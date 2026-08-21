// Single registry of route patterns. React Router children may use absolute
// paths when they match their parent prefix. The session param is OPTIONAL:
// one route (and one loader) owns "/" and "/:sessionId" — a missing id
// resolves to the stored-or-minted session and replace-redirects.
export const ROUTES = {
  SESSION: "/:sessionId?",
  SESSION_SETTINGS: "/:sessionId/settings",
  SESSION_PLUGIN: "/:sessionId/plugins/:pluginId",
} as const;

/** Route ids for cross-route data access (useRouteLoaderData). */
export const RouteId = {
  SESSION: "session",
} as const;
