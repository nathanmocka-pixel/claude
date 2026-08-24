export const SUPABASE_COOKIE_OPTIONS = {
  // 30 days — persistent, so the session survives closing the browser.
  maxAge: 60 * 60 * 24 * 30,
  path: "/",
  sameSite: "lax" as const,
};
