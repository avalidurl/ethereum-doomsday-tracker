import { decideRoute } from "../src/routing/prefix";

export interface Env {
  ASSETS: Fetcher;
}

/**
 * Scoped Worker for gokhanturhan.com/ethereum-doomsday*.
 * Routes outside the prefix should not hit this Worker (zone route pattern).
 * Defense-in-depth: out_of_scope → 404 without claiming the rest of the site.
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const decision = decideRoute(url.pathname, url.search);

    if (decision.kind === "out_of_scope") {
      return new Response("Not found", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
    }

    if (decision.kind === "redirect") {
      return Response.redirect(new URL(decision.location, url.origin).toString(), decision.status);
    }

    // Forward original request so assets.base_path can map /ethereum-doomsday/* → dist/*
    return env.ASSETS.fetch(request);
  },
};
