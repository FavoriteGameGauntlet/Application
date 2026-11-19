//! The user's own sound for the end of the timer. The chosen file is copied
//! into the app data folder, so it keeps playing when the original is moved
//! or deleted.

use std::{fs, io::ErrorKind, path::PathBuf};
use tauri::{ipc::Response, AppHandle, Manager};

const FILENAME: &str = "timer-sound";

/// A larger file is refused, the frontend tells the user so.
const MAX_BYTES: u64 = 5 * 1024 * 1024;

const TOO_LARGE: &str = "too_large";

fn sound_path(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join(FILENAME))
}

/// Errors with "too_large" when the file passes the limit.
#[tauri::command]
pub fn timer_sound_save(app: AppHandle, path: PathBuf) -> Result<(), String> {
    let size = fs::metadata(&path).map_err(|e| e.to_string())?.len();
    if size > MAX_BYTES {
        return Err(TOO_LARGE.into());
    }

    fs::copy(&path, sound_path(&app)?).map_err(|e| e.to_string())?;
    Ok(())
}

/// The raw bytes, not a JSON array of numbers.
#[tauri::command]
pub fn timer_sound_read(app: AppHandle) -> Result<Response, String> {
    let bytes = fs::read(sound_path(&app)?).map_err(|e| e.to_string())?;
    Ok(Response::new(bytes))
}

#[tauri::command]
pub fn timer_sound_clear(app: AppHandle) -> Result<(), String> {
    match fs::remove_file(sound_path(&app)?) {
        Err(e) if e.kind() != ErrorKind::NotFound => Err(e.to_string()),
        _ => Ok(()),
    }
}
