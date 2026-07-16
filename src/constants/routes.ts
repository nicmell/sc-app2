// Single registry of route patterns. React Router children may use absolute
// paths when they match their parent prefix.
export const ROUTES = {
  ROOT: "/",
  SESSION: "/:sessionId",
  SESSION_SETTINGS: "/:sessionId/settings",
  SESSION_PLUGIN_NEW: "/:sessionId/plugins/new",
  SESSION_PLUGIN_EDIT: "/:sessionId/plugins/:pluginId/edit",
  SESSION_PLUGIN: "/:sessionId/plugins/:pluginId",
} as const;
