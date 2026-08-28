// The app's ONE layout route module: the loader boots everything the app
// needs — the wasm validator and the session resolution, concurrently — and
// the component is the frame every route renders inside, plus every
// cross-cutting feedback surface: ToastStack (the global toast slice),
// ConnectionOverlay (live WS status), and a LoadingOverlay whenever the
// router is loading (a navigation with pending loaders or an in-place
// revalidation — the error modals' Retry paths), so stale UI never sits
// there frozen. It also owns the live-connection lifecycle: the loader's
// SessionInfo feeds `session.connect`, keyed on the object's IDENTITY —
// child navigation (dashboard ↔ settings ↔ plugin) never re-runs the loader,
// so it never reconnects; a revalidation (Retry) or a param change hands a
// new object and does.

import { useEffect } from "react";
import {
  Outlet,
  useLoaderData,
  useNavigation,
  useParams,
  useRevalidator,
  type LoaderFunctionArgs,
} from "react-router";
import { initValidator } from "@/lib/plugins/validate";
import { ConnectionOverlay } from "@/components/ConnectionOverlay";
import { ToastStack } from "@/components/ToastStack";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { session } from "@/lib/session/SessionManager";
import { sessionLoader } from "@/lib/session/resolveSession";
import type { SessionInfo } from "@/types/api";
import styles from "./Layout.module.scss";

/** Boot loader: the validator init and the session resolution run
 *  concurrently; the router renders nothing until both settle (the hydrate
 *  fallback covers the wait). Either failure throws into RouteError — and
 *  initValidator doesn't cache rejections, so Retry re-runs a real
 *  instantiation. Re-runs (param change, revalidation) re-await the memoized
 *  init instantly. */
export async function layoutLoader(args: LoaderFunctionArgs) {
  const [, info] = await Promise.all([initValidator(), sessionLoader(args)]);
  return info;
}

export function Layout() {
  const info = useLoaderData<SessionInfo>();
  // A matched box shell (/:sessionId/box/:boxId) is a SECONDARY session
  // client: it joins the shared connection but leaves the layout/presets
  // slices and the autosave to the primary (dashboard) client.
  const { boxId } = useParams();
  const primary = boxId === undefined;
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const loading = navigation.state === "loading" || revalidator.state === "loading";

  useEffect(() => {
    void session.connect(info, { primary });
    return () => session.disconnect();
  }, [info, primary]);

  return (
    <div className={styles.app}>
      <Outlet />
      <ToastStack />
      <ConnectionOverlay />
      {loading && <LoadingOverlay label="Loading…" />}
    </div>
  );
}
