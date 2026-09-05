// Placeholder operator until real authentication provides the active user.
// lib/api.ts stamps every created/fetched site with this id instead of a
// value from a logged-in session — swap for the authenticated user's id once
// real auth exists.
export const CURRENT_OPERATOR_ID = "op-demo"

// Name of the mock session cookie set by lib/auth.ts on login and read by
// proxy.ts to gate routes. Its presence is the only signal checked — it is
// not a real session token (not signed, not validated against a backend).
export const AUTH_COOKIE_NAME = "parkitup_session"
