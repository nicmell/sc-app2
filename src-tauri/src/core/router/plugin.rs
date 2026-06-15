//! The `/api/plugins` HTTP routes: list / add / remove + serving plugin files
//! out of their zip bundles. Thin axum wrappers over [`crate::core::plugin::manager`];
//! the validation + storage logic is framework-agnostic and stateless w.r.t.
//! [`Server`](crate::core::server::Server) (it reads the app data dir directly).

use axum::body::Bytes;
use axum::extract::Path;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get};
use axum::{Json, Router};

use crate::core::plugin::manager;
use crate::core::server::Server;

/// The `/api/plugins` routes (list / add / remove / serve file).
pub fn routes() -> Router<Server> {
    Router::new()
        .route("/api/plugins", get(list).post(add))
        .route("/api/plugins/{id}", delete(remove))
        .route("/api/plugins/{id}/{*file}", get(serve_file))
}

async fn list() -> Response {
    match manager::list_plugins() {
        Ok(plugins) => Json(plugins).into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn add(body: Bytes) -> Response {
    match manager::add_plugin(&body) {
        Ok(info) => (StatusCode::CREATED, Json(info)).into_response(),
        // A validation failure is the caller's fault (bad bundle) → 400.
        Err(e) => (StatusCode::BAD_REQUEST, e).into_response(),
    }
}

async fn remove(Path(id): Path<String>) -> Response {
    match manager::remove_plugin(&id) {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::NOT_FOUND, e).into_response(),
    }
}

async fn serve_file(Path((id, file)): Path<(String, String)>) -> Response {
    match manager::read_plugin_file(&id, &file) {
        Ok((content_type, bytes)) => {
            ([(header::CONTENT_TYPE, content_type)], bytes).into_response()
        }
        Err(e) => (StatusCode::NOT_FOUND, e).into_response(),
    }
}
