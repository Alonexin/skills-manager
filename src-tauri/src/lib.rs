mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::scan_directory,
            commands::read_file,
            commands::write_file,
            commands::file_exists,
            commands::file_stat,
            commands::list_directory,
            commands::create_symlink,
            commands::fetch_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
