//! The HTTP server.
//!
//! A [`Server`] owns HTTP routing and backend resources, and is used by
//! both run modes (`serve` headless and the GUI), so the serving logic
//! lives in one place. The production frontend (`dist/`) is shipped as a
//! Tauri bundle resource and served from disk; the caller resolves its
//! path — GUI via the Tauri PathResolver (`app.path().resolve`),
//! headless via `tauri::utils::platform::resource_dir` — and hands it in
//! as `dist`. In dev `dist` is `None`: Vite serves the UI and the server
//! is API-only.

use std::net::SocketAddr;
use std::path::{Path, PathBuf};

use axum::extract::Request;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::{routing::get, Json, Router};
use serde::Serialize;
use tokio::fs;
use tokio::net::TcpListener;

/// Owns HTTP routing and backend resources. Built per mode (with the
/// resolved `dist`) and used identically by both.
pub struct Server {
    port: u16,
    dist: Option<PathBuf>,
}

impl Server {
    pub fn new(port: u16, dist: Option<PathBuf>) -> Self {
        Self { port, dist }
    }

    /// Bind a localhost listener and log its address. Separate from
    /// [`serve`](Self::serve) so GUI mode can bind synchronously (the
    /// webview URL is valid before it loads) then serve on a spawned task.
    pub async fn listen(&self) -> std::io::Result<(TcpListener, SocketAddr)> {
        let listener = TcpListener::bind(("127.0.0.1", self.port)).await?;
        let addr = listener.local_addr()?;
        println!("sc-app2 server listening on http://{addr}");
        Ok((listener, addr))
    }

    /// Serve on a bound listener until the process exits.
    pub async fn serve(self, listener: TcpListener) -> std::io::Result<()> {
        axum::serve(listener, self.router()).await
    }

    fn router(&self) -> Router {
        let mut app = Router::new().route("/api/hello", get(Self::hello));
        // Production: serve the frontend from the bundled dist/ dir. Dev:
        // `dist` is None — Vite serves it, so we stay API-only.
        if let Some(dir) = self.dist.clone() {
            app = app.fallback(move |req: Request| Self::serve_static(req, dir.clone()));
        }
        app
    }

    /// Dummy endpoint proving the frontend can reach the server.
    async fn hello() -> Json<Hello> {
        Json(Hello {
            message: "Hello from the sc-app2 server!".to_string(),
        })
    }

    /// Serve a file from `dist/`, falling back to `index.html` for
    /// client-side routes. Asset-shaped paths that miss get a loud 404
    /// (so a stale build reference doesn't masquerade as HTML); requests
    /// that canonicalise outside `dist/` are rejected.
    async fn serve_static(req: Request, dist: PathBuf) -> Response {
        let path = req.uri().path();
        let on_disk = dist.join(path.trim_start_matches('/'));

        let inside_dist = match (fs::canonicalize(&on_disk).await, fs::canonicalize(&dist).await) {
            (Ok(p), Ok(d)) => p.starts_with(&d),
            _ => false,
        };
        if inside_dist {
            if let Ok(meta) = fs::metadata(&on_disk).await {
                if meta.is_file() {
                    return Self::file(&on_disk).await;
                }
            }
        }

        let asset_shaped =
            path.starts_with("/assets/") || path.rsplit('/').next().is_some_and(|s| s.contains('.'));
        if asset_shaped {
            return (StatusCode::NOT_FOUND, format!("not found: {path}\n")).into_response();
        }
        Self::file(&dist.join("index.html")).await
    }

    /// Read a file and respond with a content type guessed from its path.
    async fn file(path: &Path) -> Response {
        match fs::read(path).await {
            Ok(bytes) => {
                let mime = mime_guess::from_path(path).first_or_octet_stream();
                ([(header::CONTENT_TYPE, mime.as_ref())], bytes).into_response()
            }
            Err(_) => {
                (StatusCode::NOT_FOUND, format!("not found: {}\n", path.display())).into_response()
            }
        }
    }
}

#[derive(Serialize)]
struct Hello {
    message: String,
}
