/** Public mount path for gokhanturhan.com (no trailing slash in constant). */
export const PUBLIC_PREFIX = "/ethereum-doomsday";

export type RouteDecision =
  | { kind: "out_of_scope"; status: 404 }
  | { kind: "redirect"; status: 308; location: string }
  | { kind: "asset"; pathname: string; search: string };

/**
 * Decide how to handle a request pathname + search for the ethereum-doomsday Worker.
 * Pure policy shared by unit tests and the Worker entry.
 */
export function decideRoute(pathname: string, search = ""): RouteDecision {
  const q = search.startsWith("?") || search === "" ? search : `?${search}`;

  if (pathname === PUBLIC_PREFIX) {
    return { kind: "redirect", status: 308, location: `${PUBLIC_PREFIX}/${q}` };
  }

  if (pathname === `${PUBLIC_PREFIX}/` || pathname.startsWith(`${PUBLIC_PREFIX}/`)) {
    return { kind: "asset", pathname, search: q };
  }

  return { kind: "out_of_scope", status: 404 };
}

/** Map a public asset pathname to a file key relative to dist/ (for local checks). */
export function publicPathToDistKey(pathname: string): string | null {
  if (!(pathname === `${PUBLIC_PREFIX}/` || pathname.startsWith(`${PUBLIC_PREFIX}/`))) {
    return null;
  }
  let rest = pathname.slice(PUBLIC_PREFIX.length);
  if (rest === "" || rest === "/") return "index.html";
  if (rest.startsWith("/")) rest = rest.slice(1);
  return rest;
}

export function isUnderPrefix(pathname: string): boolean {
  return pathname === PUBLIC_PREFIX || pathname.startsWith(`${PUBLIC_PREFIX}/`);
}
