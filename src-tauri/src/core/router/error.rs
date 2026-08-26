//! The structured API error envelope: every JSON-API error body is
//! `{code, message, violations?}` with the status on the response line —
//! the frontend http client parses it into HttpError (code + headline +
//! structured violations). Codes are a STABLE kebab-case contract.
//!
//! DELIBERATE plain-text exceptions: ws.rs pre-upgrade rejections (a browser
//! WebSocket cannot read handshake bodies), assets.rs static 404s (the
//! page-serving fallback, which also catches unknown `/api/*` paths in
//! production), and axum's own JSON-extractor rejections — the frontend's
//! text fallback covers them all.

use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
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
