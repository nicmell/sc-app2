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
use serde_json::{json, Value};
use tokio::time::timeout;

use crate::core::osc::{self, OscType};
use crate::server::Server;

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
        .dispatch_command(&osc::encode(
            "/g_queryTree",
            vec![OscType::Int(0), OscType::Int(1)], // group 0, with controls
        ))
        .await;

    let reply = timeout(Duration::from_secs(2), async {
        loop {
            match rx.recv().await {
                Ok(bytes) => {
                    if let Some(msg) = osc::decode_message(&bytes) {
                        if msg.addr == "/g_queryTree.reply" {
                            return Some(msg.args);
                        }
                    }
                }
                Err(tokio::sync::broadcast::error::RecvError::Lagged(_)) => continue,
                Err(_) => return None,
            }
        }
    })
    .await;

    match reply {
        Ok(Some(args)) => Json(parse_query_tree(&args)).into_response(),
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
        .dispatch_command(&osc::encode(
            "/g_dumpTree",
            vec![OscType::Int(0), OscType::Int(1)],
        ))
        .await;
    (StatusCode::ACCEPTED, "sent /g_dumpTree 0 1 — see scsynth stdout\n").into_response()
}

// ── /g_queryTree.reply parsing ─────────────────────────────────────────────
//
// Layout: [flag, queriedGroupId, childCount, <node>…] where each <node> is:
//   nodeId, numChildren(-1=synth)
//   if synth:  defName
//   if synth && flag:  numControls, then numControls × (name:str|int, value:f|str)
//   if group:  its `numChildren` nodes follow inline (depth-first).

fn as_int(args: &[OscType], i: usize) -> Option<i64> {
    match args.get(i)? {
        OscType::Int(v) => Some(*v as i64),
        OscType::Long(v) => Some(*v),
        _ => None,
    }
}

fn as_value(arg: Option<&OscType>) -> Value {
    match arg {
        Some(OscType::Int(v)) => json!(v),
        Some(OscType::Long(v)) => json!(v),
        Some(OscType::Float(v)) => json!(v),
        Some(OscType::Double(v)) => json!(v),
        Some(OscType::String(s)) => json!(s),
        _ => Value::Null,
    }
}

fn parse_node(args: &[OscType], i: &mut usize, with_controls: bool) -> Value {
    let node_id = as_int(args, *i).unwrap_or(i64::MIN);
    *i += 1;
    let n_children = as_int(args, *i).unwrap_or(-1);
    *i += 1;

    if n_children == -1 {
        // Synth.
        let def = match args.get(*i) {
            Some(OscType::String(s)) => s.clone(),
            _ => String::new(),
        };
        *i += 1;
        let mut controls = serde_json::Map::new();
        if with_controls {
            let n = as_int(args, *i).unwrap_or(0).max(0);
            *i += 1;
            for _ in 0..n {
                let name = match args.get(*i) {
                    Some(OscType::String(s)) => s.clone(),
                    Some(OscType::Int(v)) => v.to_string(),
                    _ => "?".into(),
                };
                *i += 1;
                let value = as_value(args.get(*i));
                *i += 1;
                controls.insert(name, value);
            }
        }
        json!({ "id": node_id, "synth": def, "controls": Value::Object(controls) })
    } else {
        let mut children = Vec::new();
        for _ in 0..n_children {
            children.push(parse_node(args, i, with_controls));
        }
        json!({ "id": node_id, "group": true, "children": children })
    }
}

fn parse_query_tree(args: &[OscType]) -> Value {
    let with_controls = as_int(args, 0).unwrap_or(0) == 1;
    let group_id = as_int(args, 1).unwrap_or(0);
    let child_count = as_int(args, 2).unwrap_or(0).max(0);
    let mut i = 3;
    let mut children = Vec::new();
    for _ in 0..child_count {
        if i >= args.len() {
            break;
        }
        children.push(parse_node(args, &mut i, with_controls));
    }
    json!({
        "rootGroup": group_id,
        "withControls": with_controls,
        "children": children,
    })
}
