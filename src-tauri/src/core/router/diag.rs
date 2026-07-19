//! Diagnostics routes. Programmatic introspection of the live scsynth state for
//! debugging client–server features (scope, sessions, routing).
//!
//! `GET /api/diag/nodetree` asks scsynth for its full node tree with control
//! values (`/g_queryTree 0 1`), parses the `/g_queryTree.reply`, and returns it
//! as JSON — so you can see execution order (head→tail = the order printed) and
//! each synth's bus controls (e.g. our scope tap's `inBus`, SuperDirt's `out`),
//! which is exactly what's needed to debug a silent tap: it shows whether the
//! tap synth exists, where it sits relative to SuperDirt's output monitors,
//! and which bus it actually reads.
//!
//! `GET /api/diag/dumptree` fires `/g_dumpTree 0 1`, which makes scsynth print
//! the same tree to its own stdout (the `yarn osc` console) — useful when the
//! reply-based query times out or you want scsynth's own formatting.
//!
//! TODO: these endpoints were added for debugging the scope bring-up and can
//! be removed (or feature-gated) once the buffer/scope migration settles.
//! Note the `/g_queryTree` request goes through the shared bridge, so its
//! (large) reply currently fans out to every connected WS client's OSC
//! console as well.

use std::time::Duration;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::{Json, Router};
use tokio::time::timeout;

use crate::core::server::Server;
use scserver_commands::commands::{GDumpTree, GQueryTree};
use scserver_commands::{KnownReply, ServerReply};

/// The `/api/diag/*` routes.
pub fn routes() -> Router<Server> {
    Router::new()
        .route("/api/diag/nodetree", get(nodetree))
        .route("/api/diag/dumptree", get(dumptree))
}

/// Query scsynth's node tree (with controls) and return it as JSON.
async fn nodetree(State(server): State<Server>) -> Response {
    // Subscribe before sending so we can't miss the reply.
    let mut rx = server.bridge().subscribe();
    server
        .bridge()
        // group 0, with controls
        .dispatch_command(
            &GQueryTree::new(vec![(0, 1)])
                .encode()
                .expect("encode /g_queryTree"),
        )
        .await;

    let reply = timeout(Duration::from_secs(2), async {
        loop {
            match rx.recv().await {
                // The crate owns the recursive reply layout — anything that
                // decodes to the typed tree is our answer.
                Ok(bytes) => match ServerReply::decode(&bytes) {
                    Ok(ServerReply::Known(KnownReply::QueryTree(tree))) => return Some(tree),
                    _ => continue,
                },
                Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                Err(_) => return None,
            }
        }
    })
    .await;

    match reply {
        Ok(Some(tree)) => Json(tree).into_response(),
        Ok(None) => (StatusCode::BAD_GATEWAY, "bridge closed before reply\n").into_response(),
        Err(_) => (
            StatusCode::GATEWAY_TIMEOUT,
            "no /g_queryTree.reply within 2s (scsynth down?)\n",
        )
            .into_response(),
    }
}

/// Fire `/g_dumpTree` — scsynth prints the tree to its own stdout.
async fn dumptree(State(server): State<Server>) -> Response {
    server
        .bridge()
        .dispatch_command(
            &GDumpTree::new(vec![(0, 1)])
                .encode()
                .expect("encode /g_dumpTree"),
        )
        .await;
    (
        StatusCode::ACCEPTED,
        "sent /g_dumpTree 0 1 — see scsynth stdout\n",
    )
        .into_response()
}
