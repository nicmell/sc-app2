// Single registry of route patterns. React Router children may use absolute
// paths when they match their parent prefix. The session param is OPTIONAL:
// one route (and one loader) owns "/" and "/:sessionId" — a missing id
// resolves to the stored-or-minted session and replace-redirects.
export const ROUTES = {
  SESSION: "/:sessionId?",
  SESSION_SETTINGS: "/:sessionId/settings",
  SESSION_PLUGIN: "/:sessionId/plugins/:pluginId",
  /** One dashboard box as its own client — the iframe/pop-out shell (the
   *  literal `box` segment keeps it unambiguous vs settings/plugins). */
  SESSION_BOX: "/:sessionId/box/:boxId",
} as const;
