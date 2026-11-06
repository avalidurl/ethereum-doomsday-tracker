import { describe, expect, it } from "vitest";
import {
  PUBLIC_PREFIX,
  decideRoute,
  isUnderPrefix,
  publicPathToDistKey,
} from "./prefix";

describe("decideRoute", () => {
  it("redirects bare prefix to trailing slash and keeps query", () => {
    expect(decideRoute("/ethereum-doomsday", "?y=2035&sc=orderly")).toEqual({
      kind: "redirect",
      status: 308,
      location: "/ethereum-doomsday/?y=2035&sc=orderly",
    });
  });

  it("serves trailing-slash and nested assets", () => {
    expect(decideRoute("/ethereum-doomsday/").kind).toBe("asset");
    const d = decideRoute("/ethereum-doomsday/assets/index-abc.js", "?v=1");
    expect(d).toEqual({
      kind: "asset",
      pathname: "/ethereum-doomsday/assets/index-abc.js",
      search: "?v=1",
    });
  });

  it("does not intercept out-of-prefix paths", () => {
    for (const p of ["/", "/blog", "/turkish-art-blob/x", "/ethereum-doomsday-extra", "/ethereum-doomsdaying/"]) {
      expect(decideRoute(p)).toEqual({ kind: "out_of_scope", status: 404 });
    }
  });

  it("lookalike prefixes are out of scope", () => {
    expect(isUnderPrefix("/ethereum-doomsdaying")).toBe(false);
  });
});

describe("publicPathToDistKey", () => {
  it("maps prefix root and vite assets", () => {
    expect(publicPathToDistKey("/ethereum-doomsday/")).toBe("index.html");
    expect(publicPathToDistKey("/ethereum-doomsday/assets/x.js")).toBe("assets/x.js");
    expect(publicPathToDistKey("/assets/x.js")).toBeNull();
  });
});

describe("SPA policy note", () => {
  it("forwards unknown under-prefix paths to ASSETS (404 via not_found_handling none)", () => {
    expect(decideRoute(`${PUBLIC_PREFIX}/no-such-page`).kind).toBe("asset");
  });
});
