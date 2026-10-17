//! Keeps the proportions of the window while it is being resized by its edges.
//!
//! The webview can't do it: it hears about the new size only after the window
//! has already got it, and putting the size back makes the window jerk.

use std::sync::atomic::{AtomicU64, Ordering};

/// width / height as the bits of an f64; 0 while the ratio is not locked
static RATIO: AtomicU64 = AtomicU64::new(0);

#[tauri::command]
pub fn set_aspect_ratio(ratio: Option<f64>) {
    RATIO.store(ratio.map_or(0, f64::to_bits), Ordering::Relaxed);
}

#[cfg(windows)]
pub use windows_impl::install;

#[cfg(windows)]
mod windows_impl {
    use super::RATIO;
    use std::sync::atomic::Ordering;
    use windows::Win32::Foundation::{HWND, LPARAM, LRESULT, RECT, WPARAM};
    use windows::Win32::UI::Shell::{DefSubclassProc, SetWindowSubclass};
    use windows::Win32::UI::WindowsAndMessaging::{
        GetClientRect, GetWindowRect, WMSZ_BOTTOM, WMSZ_LEFT, WMSZ_RIGHT, WMSZ_TOP,
        WMSZ_TOPLEFT, WMSZ_TOPRIGHT, WMSZ_BOTTOMLEFT, WM_SIZING,
    };

    const SUBCLASS_ID: usize = 1;

    /// puts the window under the watch of `WM_SIZING`, the ratio itself is set by the command
    pub fn install(window: &tauri::WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
        let hwnd = window.hwnd()?;

        unsafe { SetWindowSubclass(hwnd, Some(subclass_proc), SUBCLASS_ID, 0) }.ok()?;

        Ok(())
    }

    unsafe extern "system" fn subclass_proc(
        hwnd: HWND,
        msg: u32,
        wparam: WPARAM,
        lparam: LPARAM,
        _id: usize,
        _data: usize,
    ) -> LRESULT {
        if msg == WM_SIZING {
            let bits = RATIO.load(Ordering::Relaxed);

            if bits != 0 {
                // for WM_SIZING the lparam is the rect the window is about to get
                keep_ratio(hwnd, wparam.0 as u32, &mut *(lparam.0 as *mut RECT), f64::from_bits(bits));

                return LRESULT(1);
            }
        }

        DefSubclassProc(hwnd, msg, wparam, lparam)
    }

    /// `edge` is the side or the corner the user drags, the opposite one stays where it is
    unsafe fn keep_ratio(hwnd: HWND, edge: u32, rect: &mut RECT, ratio: f64) {
        // what the window adds around its content, if it adds anything
        let mut window = RECT::default();
        let mut client = RECT::default();
        let _ = GetWindowRect(hwnd, &mut window);
        let _ = GetClientRect(hwnd, &mut client);

        let frame_w = (window.right - window.left) - (client.right - client.left);
        let frame_h = (window.bottom - window.top) - (client.bottom - client.top);

        let width = (rect.right - rect.left - frame_w) as f64;
        let height = (rect.bottom - rect.top - frame_h) as f64;

        let new_height = (width / ratio).round() as i32 + frame_h;
        let new_width = (height * ratio).round() as i32 + frame_w;

        match edge {
            WMSZ_LEFT | WMSZ_RIGHT => rect.bottom = rect.top + new_height,
            WMSZ_TOP | WMSZ_BOTTOM => rect.right = rect.left + new_width,
            // a corner: the side that asks for more wins, so the window follows the cursor
            _ if width / ratio > height => {
                if matches!(edge, WMSZ_TOPLEFT | WMSZ_TOPRIGHT) {
                    rect.top = rect.bottom - new_height;
                } else {
                    rect.bottom = rect.top + new_height;
                }
            }
            _ => {
                if matches!(edge, WMSZ_TOPLEFT | WMSZ_BOTTOMLEFT) {
                    rect.left = rect.right - new_width;
                } else {
                    rect.right = rect.left + new_width;
                }
            }
        }
    }
}
