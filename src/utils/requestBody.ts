import { NextResponse } from "next/server";

export type UrlBody =
  { ok: true; url: string } | { ok: false; response: NextResponse };

/**
 * Reads `{ url }` from a JSON request body. A body that is not valid JSON, or
 * not an object, is the caller's mistake and answers 400; letting the parse
 * error escape into a route's catch-all reports it as a 500 server failure.
 * A missing or non-string `url` comes back as "" so each route keeps its own
 * validation message for it.
 */
export async function readUrlBody(request: Request): Promise<UrlBody> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = undefined;
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Request body must be a JSON object." },
        { status: 400 },
      ),
    };
  }

  const { url } = body as { url?: unknown };
  return { ok: true, url: typeof url === "string" ? url : "" };
}
