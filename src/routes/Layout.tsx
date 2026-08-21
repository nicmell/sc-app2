// The app layout at the boot root: the frame every route renders inside, plus
// every cross-cutting feedback surface — ToastStack (the global toast slice),
// ConnectionOverlay (live WS status), and a LoadingOverlay whenever the router
// is loading (a navigation with pending loaders or an in-place revalidation —
// the error modals' Retry paths), so stale UI never sits there frozen. It also
// owns the live-connection lifecycle: the session route's loader data (by
// route id — this component sits above it) feeds `session.connect`, keyed on
// the loader object's IDENTITY: child navigation (dashboard ↔ settings ↔
// plugin) never re-runs the session loader, so it never reconnects — a
// revalidation (Retry) or a param change hands a new object and does.

import { useEffect } from "react";
import { Outlet, useNavigation, useRevalidator, useRouteLoaderData } from "react-router";
import { ConnectionOverlay } from "@/components/ConnectionOverlay";
import { ToastStack } from "@/components/ToastStack";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { RouteId } from "@/constants/routes";
import { session } from "@/lib/session/SessionManager";
import type { SessionInfo } from "@/types/api";
import styles from "./Layout.module.scss";

export function Layout() {
  const info = useRouteLoaderData<SessionInfo>(RouteId.SESSION);
  const navigation = useNavigation();
  const revalidator = useRevalidator();
  const loading = navigation.state === "loading" || revalidator.state === "loading";

  useEffect(() => {
    if (!info) return;
    void session.connect(info);
    return () => session.disconnect();
  }, [info]);

  return (
    <div className={styles.app}>
      <Outlet />
      <ToastStack />
      <ConnectionOverlay />
      {loading && <LoadingOverlay label="Loading…" />}
    </div>
  );
}
