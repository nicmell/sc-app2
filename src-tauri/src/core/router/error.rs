//! The structured API error envelope: every JSON-API error body is
//! `{code, message, violations?}` with the status on the response line —
//! the frontend http client parses it into HttpError (code + headline +
//! structured violations). Codes are a STABLE kebab-case contract.
//!
//! Every server error speaks it: the route handlers (plugin/session/diag),
//! the ws pre-upgrade rejections (unreadable by browser WebSockets, but
//! honest for tools), unknown `/api/*` paths ([`api_not_found`]), malformed
//! JSON bodies ([`ApiJson`]), and handler panics ([`panic_response`]). The
//! ONE deliberate plain-text exception: assets.rs's page-serving fallback —
//! it serves documents, not API responses; the frontend http client's
//! raw-text fallback covers it (and any proxy/glue-level body).

use axum::extract::{FromRequest, Request};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::de::DeserializeOwned;
use serde::Serialize;
use uuid::Uuid;

use crate::core::plugin::manager::PluginError;

/// One API failure: the HTTP status plus the serialized envelope.
#[derive(Serialize)]
pub struct ApiError {
    #[serde(skip)]
    pub status: StatusCode,
    /// Stable kebab-case identifier the frontend can branch on.
    pub code: &'static str,
    /// The human headline (one line — structured detail rides `violations`).
    pub message: String,
    /// The entry spec gate's structured violations — the SAME
    /// tsify-generated shape the wasm gate returns.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub violations: Option<Vec<sc_validate::ValidationViolation>>,
}

impl ApiError {
    pub fn new(status: StatusCode, code: &'static str, message: impl Into<String>) -> Self {
        Self {
            status,
            code,
            message: message.into(),
            violations: None,
        }
    }

    /// 404 for a session id with no live entry and no saved layout.
    pub fn session_unknown(id: &Uuid) -> Self {
        Self::new(
            StatusCode::NOT_FOUND,
            "session-unknown",
            format!("session {id} not found"),
        )
    }

    /// 503 while scsynth has not registered with the bridge yet — the
    /// frontend loaders quiet-retry on the status.
    pub fn scsynth_unavailable() -> Self {
        Self::new(
            StatusCode::SERVICE_UNAVAILABLE,
            "scsynth-unregistered",
            "scsynth not registered yet; retry",
        )
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let status = self.status;
        (status, Json(self)).into_response()
    }
}

impl From<PluginError> for ApiError {
    fn from(error: PluginError) -> Self {
        match error {
            PluginError::Spec(violations) => Self {
                status: StatusCode::BAD_REQUEST,
                code: "plugin-spec-violations",
                message: "entry file does not conform to the sc-plugin spec".to_string(),
                violations: Some(
                    violations
                        .into_iter()
                        .map(sc_validate::ValidationViolation::from)
                        .collect(),
                ),
            },
            PluginError::Invalid(message) => {
                Self::new(StatusCode::BAD_REQUEST, "plugin-invalid", message)
            }
            PluginError::NotFound(message) => {
                Self::new(StatusCode::NOT_FOUND, "plugin-not-found", message)
            }
            PluginError::Forbidden => Self::new(
                StatusCode::FORBIDDEN,
                "plugin-path-forbidden",
                "forbidden path",
            ),
            PluginError::Io(message) => {
                Self::new(StatusCode::INTERNAL_SERVER_ERROR, "internal", message)
            }
        }
    }
}

/// The `/api/{*rest}` fallback: unknown API paths answer with the envelope.
pub async fn api_not_found(request: Request) -> Response {
    ApiError::new(
        StatusCode::NOT_FOUND,
        "not-found",
        format!(
            "no such API route: {} {}",
            request.method(),
            request.uri().path()
        ),
    )
    .into_response()
}

/// The CatchPanicLayer response: a handler panic becomes the envelope's
/// opaque 500 (the payload is logged, never leaked).
pub fn panic_response(payload: Box<dyn std::any::Any + Send + 'static>) -> Response {
    let detail = payload
        .downcast_ref::<&str>()
        .map(|s| (*s).to_string())
        .or_else(|| payload.downcast_ref::<String>().cloned())
        .unwrap_or_else(|| "non-string panic payload".to_string());
    tracing::error!(panic = %detail, "handler panicked");
    ApiError::new(
        StatusCode::INTERNAL_SERVER_ERROR,
        "internal",
        "internal server error",
    )
    .into_response()
}

/// A Json extractor whose rejection (malformed body, wrong content type)
/// answers with the envelope instead of axum's plain-text default.
pub struct ApiJson<T>(pub T);

impl<S, T> FromRequest<S> for ApiJson<T>
where
    S: Send + Sync,
    T: DeserializeOwned,
{
    type Rejection = ApiError;

    async fn from_request(request: Request, state: &S) -> Result<Self, Self::Rejection> {
        match Json::<T>::from_request(request, state).await {
            Ok(Json(value)) => Ok(ApiJson(value)),
            Err(rejection) => Err(ApiError::new(
                rejection.status(),
                "bad-request",
                rejection.body_text(),
            )),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn unknown_api_routes_answer_with_the_envelope() {
        let request = Request::builder()
            .method("GET")
            .uri("/api/nope")
            .body(axum::body::Body::empty())
            .unwrap();
        let response = api_not_found(request).await;
        assert_eq!(response.status(), StatusCode::NOT_FOUND);
        let bytes = axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap();
        let body: serde_json::Value = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(body["code"], "not-found");
        assert_eq!(body["message"], "no such API route: GET /api/nope");
    }

    #[test]
    fn violations_field_is_omitted_when_absent() {
        let error = ApiError::new(StatusCode::NOT_FOUND, "not-found", "x");
        let json = serde_json::to_value(&error).unwrap();
        assert_eq!(
            json,
            serde_json::json!({ "code": "not-found", "message": "x" })
        );
    }
}
