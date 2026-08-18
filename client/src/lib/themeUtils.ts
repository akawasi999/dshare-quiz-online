export type StoredTheme = "light" | "dark";

export function getInitialTheme(storedTheme: string | null, defaultTheme: StoredTheme = "light", requestedTheme?: string | null): StoredTheme {
  if (requestedTheme === "dark" || requestedTheme === "light") return requestedTheme;
  return storedTheme === "dark" || storedTheme === "light" ? storedTheme : defaultTheme;
}
