// The /:sessionId layout route: owns the live-connection lifecycle. Its
// loader (resolveSession) resolved the SessionInfo; the effect connects on it
// and disconnects on unmount. Keyed on the loader object's IDENTITY: child
// navigation (dashboard ↔ settings ↔ plugin) never re-runs the parent loader,
// so it never reconnects — a revalidation (Retry) or a param change hands a
// new object and does. ToastStack/ConnectionOverlay live here so they cover
// every child route.

import { useEffect } from "react";
import { Outlet, useLoaderData } from "react-router";
import { ConnectionOverlay } from "@/components/ConnectionOverlay";
import { ToastStack } from "@/components/ToastStack";
import { session } from "@/lib/session/SessionManager";
import type { SessionInfo } from "@/types/api";
import styles from "./SessionLayout.module.scss";

export function SessionLayout() {
  const info = useLoaderData<SessionInfo>();

  useEffect(() => {
    void session.connect(info);
    return () => session.disconnect();
  }, [info]);

  return (
    <div className={styles.app}>
      <Outlet />
      <ToastStack />
      <ConnectionOverlay />
    </div>
  );
}
