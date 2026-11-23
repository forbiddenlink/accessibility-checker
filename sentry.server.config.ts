import * as Sentry from "@sentry/nextjs";
import { scrubEvent } from "./src/utils/sentry-scrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Only a real production deploy reports; local builds and previews stay quiet.
  enabled: process.env.VERCEL_ENV === "production",
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  release: process.env.VERCEL_GIT_COMMIT_SHA,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend: scrubEvent,
  beforeSendTransaction: scrubEvent,
  integrations: [
    Sentry.httpIntegration({
      maxIncomingRequestBodySize: "none",
      trackIncomingRequestsAsSessions: false,
    }),
  ],
});
