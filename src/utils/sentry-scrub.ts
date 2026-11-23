import type { Breadcrumb, Event } from "@sentry/nextjs";

/**
 * Checks fetch visitor-supplied URLs, and failures quote them: no cookies, headers, bodies or query strings reach Sentry.
 * Credentials, query strings and fragments are also cut from URLs in the event URL, transaction name,
 * error messages, breadcrumbs (navigation, fetch, xhr) and span data, since sign-in callbacks and
 * searches carry codes and text there.
 */
// Span and breadcrumb keys that can hold a full URL with a query string.
const URL_KEYS = new Set([
  "url",
  "from",
  "to",
  "url.full",
  "http.url",
  "http.target",
]);
// Keys that hold only a query string.
const QUERY_KEYS = new Set(["http.query", "url.query"]);

// A URL inside free text, such as an error message that quotes the page it failed on.
const URL_IN_TEXT = /\bhttps?:\/\/[^\s"'<>]+/g;

/** Drops credentials, the query string and the fragment from a URL, path or "GET https://..." span description. */
export function stripQuery(value: string): string {
  return value.split(/[?#]/)[0].replace(/\/\/[^/@\s]*@/, "//");
}

function scrubText(text: string): string {
  return text.replace(URL_IN_TEXT, stripQuery);
}

function scrubData(data: Record<string, unknown> | undefined): void {
  if (!data) return;
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (QUERY_KEYS.has(key)) delete data[key];
    else if (URL_KEYS.has(key) && typeof value === "string")
      data[key] = stripQuery(value);
  }
}

export function scrubBreadcrumb(crumb: Breadcrumb): Breadcrumb {
  scrubData(crumb.data);
  if (crumb.category === "navigation" && crumb.message)
    crumb.message = stripQuery(crumb.message);
  return crumb;
}

export function scrubEvent<T extends Event>(event: T): T {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
    if (event.request.url) event.request.url = stripQuery(event.request.url);
  }
  if (event.transaction) event.transaction = stripQuery(event.transaction);
  if (event.message) event.message = scrubText(event.message);
  for (const exception of event.exception?.values ?? []) {
    if (exception.value) exception.value = scrubText(exception.value);
  }
  event.breadcrumbs?.forEach(scrubBreadcrumb);
  scrubData(event.contexts?.trace?.data);
  for (const span of event.spans ?? []) {
    if (span.description) span.description = stripQuery(span.description);
    scrubData(span.data);
  }
  return event;
}
