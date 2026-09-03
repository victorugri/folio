use std::path::PathBuf;
use tauri::ipc::Response;

/// Read a file the user explicitly picked through the native file dialog.
///
/// The `fs` plugin scope is deliberately limited to the app data directory
/// (library index, settings, cached covers). Book files live anywhere on disk,
/// so they are read through this command instead of widening that scope to
/// the whole filesystem.
///
/// The bytes are returned as a raw IPC `Response` rather than a `Vec<u8>`, so
/// a multi-megabyte EPUB does not have to travel as a JSON array of numbers.
#[tauri::command]
pub fn read_file_bytes(path: String) -> Result<Response, String> {
    let path = PathBuf::from(path);

    if !path.is_file() {
        return Err(format!("Not a file: {}", path.display()));
    }

    let bytes =
        std::fs::read(&path).map_err(|e| format!("Failed to read {}: {e}", path.display()))?;

    Ok(Response::new(bytes))
}

/// Whether a previously imported book is still where the library index says.
/// Used to mark library entries as "missing" instead of failing on open.
#[tauri::command]
pub fn file_exists(path: String) -> bool {
    PathBuf::from(path).is_file()
}
