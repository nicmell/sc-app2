//! The `/api/plugins` HTTP routes: list / add / remove + serving plugin files
//! out of their zip bundles. Thin axum wrappers over [`crate::core::plugin::manager`];
//! the validation + storage logic is framework-agnostic and stateless w.r.t.
//! [`crate::core::server::Server`] (it reads the app data dir directly).

use axum::body::Bytes;
use axum::extract::Path;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{delete, get};
use axum::{Json, Router};

use super::error::ApiError;
use crate::core::plugin::manager;
use crate::core::server::Server;

/// The `/api/plugins` routes (list / add / remove / serve file).
pub fn routes() -> Router<Server> {
    Router::new()
        .route("/api/plugins", get(list).post(add))
        .route("/api/plugins/{id}", delete(remove))
        .route("/api/plugins/{id}/{*file}", get(serve_file))
}

/// `GET /api/plugins` → 200 the registry, as-is.
async fn list() -> Response {
    match manager::list_plugins() {
        Ok(plugins) => Json(plugins).into_response(),
        Err(e) => ApiError::from(e).into_response(),
    }
}

/// `POST /api/plugins` (raw zip body) → 201 PluginInfo; 400 envelope on a
/// bad bundle (spec-gate failures carry structured `violations`), 500 on
/// storage trouble.
async fn add(body: Bytes) -> Response {
    match manager::add_plugin(&body) {
        Ok(info) => (StatusCode::CREATED, Json(info)).into_response(),
        // The PluginError variant carries the status.
        Err(e) => ApiError::from(e).into_response(),
    }
}

/// `DELETE /api/plugins/{id}` → 204; 404 envelope on an unknown id.
async fn remove(Path(id): Path<String>) -> Response {
    match manager::remove_plugin(&id) {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => ApiError::from(e).into_response(),
    }
}

/// `GET /api/plugins/{id}/{file}` → the file out of the zip (only the entry
/// and declared assets; content type from the metadata declaration);
/// 404/403 envelopes on undeclared/escaping paths.
async fn serve_file(Path((id, file)): Path<(String, String)>) -> Response {
    match manager::read_plugin_file(&id, &file) {
        Ok((content_type, bytes)) => {
            ([(header::CONTENT_TYPE, content_type)], bytes).into_response()
        }
        Err(e) => ApiError::from(e).into_response(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;

    use crate::core::config;

    async fn body_json(response: Response) -> serde_json::Value {
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .expect("body");
        serde_json::from_slice(&bytes).expect("json body")
    }

    #[tokio::test]
    async fn add_rejects_non_zip_with_the_envelope() {
        config::install_test_root();
        let response = add(Bytes::from_static(b"not a zip")).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = body_json(response).await;
        assert_eq!(body["code"], "plugin-invalid");
        assert_eq!(body["message"], "file is not a valid zip archive");
        assert!(body.get("violations").is_none());
    }

    #[tokio::test]
    async fn add_ships_structured_violations_for_the_spec_gate() {
        config::install_test_root();
        // An in-memory bundle: valid metadata + an entry violating the spec.
        let mut zip = zip::ZipWriter::new(std::io::Cursor::new(Vec::new()));
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Stored);
        zip.start_file("metadata.json", options).unwrap();
        zip.write_all(br#"{"name":"t","author":"t","version":"0.0.1","entry":"index.html"}"#)
            .unwrap();
        zip.start_file("index.html", options).unwrap();
        zip.write_all(
            br#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><sc-slider size="xl"/></sc-plugin>"#,
        )
        .unwrap();
        let bundle = zip.finish().unwrap().into_inner();

        let response = add(Bytes::from(bundle)).await;
        assert_eq!(response.status(), StatusCode::BAD_REQUEST);
        let body = body_json(response).await;
        assert_eq!(body["code"], "plugin-spec-violations");
        assert_eq!(
            body["message"],
            "entry file does not conform to the sc-plugin spec"
        );
        let violations = body["violations"].as_array().expect("violations array");
        assert_eq!(violations.len(), 2);
        // The SAME wire shape the wasm gate emits: nested kind + display
        // line, in spec-declared attr order (value before size).
        assert_eq!(violations[0]["tag"], "sc-slider");
        assert_eq!(violations[0]["kind"]["code"], "missing-required-attr");
        assert_eq!(violations[0]["kind"]["attr"], "value");
        assert!(violations[0]["line"].is_u64() && violations[0]["column"].is_u64());
        assert!(violations[0]["message"]
            .as_str()
            .unwrap()
            .starts_with("<sc-slider>: "));
        assert_eq!(violations[1]["kind"]["code"], "invalid-enum");
        assert_eq!(
            violations[1]["kind"]["allowed"],
            serde_json::json!(["sm", "md", "lg"])
        );
    }
}
