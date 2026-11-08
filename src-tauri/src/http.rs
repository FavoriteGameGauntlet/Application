//! The only way the frontend talks to the backend.
//!
//! `tauri-plugin-http` builds a new `reqwest::Client` for every request, so
//! every request opened a new connection and went through the TLS handshake
//! again. One shared client keeps the connection (HTTP/2) between requests.

use reqwest::{header, redirect, Method, Url};
use reqwest_cookie_store::CookieStoreMutex;
use serde::Serialize;
use std::{
    fs::File,
    io::{BufReader, BufWriter},
    path::PathBuf,
    sync::Arc,
};
use tauri::{Manager, State};

/// The only host the app may talk to. Keep it in sync with `connect-src` in
/// `tauri.conf.json`.
const ALLOWED_HOST: &str = "api.fgg-challenge.com";

const COOKIES_FILENAME: &str = ".cookies";

const MAX_REDIRECTS: usize = 10;

pub struct Http {
    client: reqwest::Client,
    cookies: Arc<CookieStoreMutex>,
    cookies_path: PathBuf,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HttpResponse {
    status: u16,
    status_text: String,
    body: String,
}

fn is_allowed(url: &Url) -> bool {
    url.scheme() == "https" && url.host_str() == Some(ALLOWED_HOST)
}

impl Http {
    /// Loads the saved session cookies, so the user stays logged in after a restart.
    pub fn new(app: &tauri::AppHandle) -> Result<Self, Box<dyn std::error::Error>> {
        let cache_dir = app.path().app_cache_dir()?;
        std::fs::create_dir_all(&cache_dir)?;
        let cookies_path = cache_dir.join(COOKIES_FILENAME);

        let store = File::open(&cookies_path)
            .ok()
            .and_then(|file| cookie_store::serde::json::load(BufReader::new(file)).ok())
            .unwrap_or_default();
        let cookies = Arc::new(CookieStoreMutex::new(store));

        let client = reqwest::Client::builder()
            .cookie_provider(cookies.clone())
            // a redirect must not take the session cookie to another host
            .redirect(redirect::Policy::custom(|attempt| {
                if is_allowed(attempt.url()) && attempt.previous().len() < MAX_REDIRECTS {
                    attempt.follow()
                } else {
                    attempt.stop()
                }
            }))
            .build()?;

        Ok(Self {
            client,
            cookies,
            cookies_path,
        })
    }

    fn save_cookies(&self) -> Result<(), Box<dyn std::error::Error>> {
        let store = self.cookies.lock().map_err(|e| e.to_string())?;
        let mut writer = BufWriter::new(File::create(&self.cookies_path)?);
        cookie_store::serde::json::save(&store, &mut writer).map_err(|e| e.to_string())?;

        Ok(())
    }
}

#[tauri::command]
pub async fn http_request(
    state: State<'_, Http>,
    method: String,
    url: String,
    body: Option<String>,
) -> Result<HttpResponse, String> {
    let url = Url::parse(&url).map_err(|e| e.to_string())?;
    if !is_allowed(&url) {
        return Err(format!("url not allowed: {url}"));
    }
    let method = Method::from_bytes(method.as_bytes()).map_err(|e| e.to_string())?;

    let mut request = state
        .client
        .request(method, url)
        .header(header::CONTENT_TYPE, "application/json");
    if let Some(body) = body {
        request = request.body(body);
    }

    let response = request.send().await.map_err(|e| e.to_string())?;
    let status = response.status();

    // the backend sets the session cookie on login; save it as soon as it arrives
    if response.headers().contains_key(header::SET_COOKIE) {
        if let Err(e) = state.save_cookies() {
            eprintln!("failed to save the cookies: {e}");
        }
    }

    Ok(HttpResponse {
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or_default().to_string(),
        body: response.text().await.map_err(|e| e.to_string())?,
    })
}
