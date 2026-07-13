// Single registry of route patterns. React Router children may use absolute
// paths when they match their parent prefix.
export const ROUTES = {
  ROOT: "/",
  SESSION: "/:sessionId",
  SESSION_SETTINGS: "/:sessionId/settings",
  SESSION_PLUGIN: "/:sessionId/plugins/:pluginId",
} as const;
