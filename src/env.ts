import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    AXIOM_TOKEN: z.string().min(1).optional(),
    GROQ_API_KEY: z.string().min(1),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  },
  client: {
    NEXT_PUBLIC_AXIOM_DATASET: z.string().optional(),
    NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),
    NEXT_PUBLIC_POSTHOG_KEY: z.string().min(1),
  },
  runtimeEnv: {
    AXIOM_TOKEN: process.env.AXIOM_TOKEN,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    NEXT_PUBLIC_AXIOM_DATASET: process.env.NEXT_PUBLIC_AXIOM_DATASET,
    NEXT_PUBLIC_POSTHOG_HOST: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
