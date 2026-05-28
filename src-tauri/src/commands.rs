use serde::Serialize;
use std::fs;
use std::path::Path;

fn resolve_home(p: &str) -> String {
    if p.starts_with('~') {
        let home = std::env::var("HOME")
            .or_else(|_| std::env::var("USERPROFILE"))
            .unwrap_or_default();
        return format!("{}{}", home, &p[1..]);
    }
    p.to_string()
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DirEntry {
    pub name: String,
    pub path: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FullDirEntry {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FileStat {
    pub size: u64,
    pub last_modified: f64,
    pub is_directory: bool,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WriteResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FetchResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_type: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[tauri::command]
pub fn scan_directory(dir_path: String) -> Vec<DirEntry> {
    let resolved = resolve_home(&dir_path);
    let path = Path::new(&resolved);
    if !path.exists() || !path.is_dir() {
        return vec![];
    }
    fs::read_dir(path)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .filter(|e| e.file_type().map(|t| t.is_dir()).unwrap_or(false))
                .map(|e| DirEntry {
                    name: e.file_name().to_string_lossy().to_string(),
                    path: e.path().to_string_lossy().replace('\\', "/"),
                })
                .collect()
        })
        .unwrap_or_default()
}

#[tauri::command]
pub fn read_file(file_path: String) -> Option<String> {
    let resolved = resolve_home(&file_path);
    fs::read_to_string(&resolved).ok()
}

#[tauri::command]
pub fn write_file(file_path: String, content: String) -> WriteResult {
    let resolved = resolve_home(&file_path);
    let path = Path::new(&resolved);
    if let Some(parent) = path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return WriteResult {
                success: false,
                error: Some(e.to_string()),
            };
        }
    }
    match fs::write(&resolved, &content) {
        Ok(_) => WriteResult {
            success: true,
            error: None,
        },
        Err(e) => WriteResult {
            success: false,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
pub fn file_exists(file_path: String) -> bool {
    Path::new(&resolve_home(&file_path)).exists()
}

#[tauri::command]
pub fn file_stat(file_path: String) -> Option<FileStat> {
    let resolved = resolve_home(&file_path);
    let path = Path::new(&resolved);
    if !path.exists() {
        return None;
    }
    fs::metadata(path).ok().map(|m| FileStat {
        size: m.len(),
        last_modified: m
            .modified()
            .ok()
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_millis() as f64)
            .unwrap_or(0.0),
        is_directory: m.is_dir(),
    })
}

#[tauri::command]
pub fn list_directory(dir_path: String) -> Vec<FullDirEntry> {
    let resolved = resolve_home(&dir_path);
    let path = Path::new(&resolved);
    if !path.exists() || !path.is_dir() {
        return vec![];
    }
    fs::read_dir(path)
        .map(|entries| {
            entries
                .filter_map(|e| e.ok())
                .map(|e| FullDirEntry {
                    name: e.file_name().to_string_lossy().to_string(),
                    path: e.path().to_string_lossy().replace('\\', "/"),
                    is_directory: e.file_type().map(|t| t.is_dir()).unwrap_or(false),
                })
                .collect()
        })
        .unwrap_or_default()
}

#[tauri::command]
pub fn create_symlink(target: String, link_path: String) -> WriteResult {
    let resolved_target = resolve_home(&target);
    let resolved_link = resolve_home(&link_path);
    let link_path = Path::new(&resolved_link);
    let target_path = Path::new(&resolved_target);

    if let Some(parent) = link_path.parent() {
        if let Err(e) = fs::create_dir_all(parent) {
            return WriteResult {
                success: false,
                error: Some(e.to_string()),
            };
        }
    }

    if link_path.exists() {
        let _ = if link_path.is_dir() {
            fs::remove_dir_all(link_path)
        } else {
            fs::remove_file(link_path)
        };
    }

    if !target_path.exists() {
        return WriteResult {
            success: false,
            error: Some(format!("Target does not exist: {}", resolved_target)),
        };
    }

    let is_dir = target_path.is_dir();

    #[cfg(windows)]
    let result = if is_dir {
        std::os::windows::fs::symlink_dir(target_path, link_path)
    } else {
        std::os::windows::fs::symlink_file(target_path, link_path)
    };

    #[cfg(not(windows))]
    let result = std::os::unix::fs::symlink(target_path, link_path);

    match result {
        Ok(_) => WriteResult {
            success: true,
            error: None,
        },
        Err(e) => WriteResult {
            success: false,
            error: Some(e.to_string()),
        },
    }
}

#[tauri::command]
pub async fn fetch_url(url: String) -> FetchResult {
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .user_agent("skills-manager/1.0")
        .redirect(reqwest::redirect::Policy::limited(5))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            return FetchResult {
                success: false,
                data: None,
                content_type: None,
                error: Some(e.to_string()),
            }
        }
    };

    match client.get(&url).send().await {
        Ok(resp) => {
            let content_type = resp
                .headers()
                .get("content-type")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("text/plain")
                .to_string();
            let status = resp.status();
            if !status.is_success() {
                return FetchResult {
                    success: false,
                    data: None,
                    content_type: None,
                    error: Some(format!("HTTP {}", status)),
                };
            }
            match resp.text().await {
                Ok(data) => FetchResult {
                    success: true,
                    data: Some(data),
                    content_type: Some(content_type),
                    error: None,
                },
                Err(e) => FetchResult {
                    success: false,
                    data: None,
                    content_type: None,
                    error: Some(e.to_string()),
                },
            }
        }
        Err(e) => FetchResult {
            success: false,
            data: None,
            content_type: None,
            error: Some(e.to_string()),
        },
    }
}
