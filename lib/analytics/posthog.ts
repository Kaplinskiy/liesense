import { PostHog } from "posthog-node";

let client: PostHog | null = null;

function getPostHog() {
  if (client) return client;
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST || "https://app.posthog.com";
  if (!apiKey) throw new Error("POSTHOG_API_KEY missing");
  client = new PostHog(apiKey, { host });
  return client;
}

export function captureEvent(event: string, properties: Record<string, unknown>) {
  const posthog = getPostHog();
  const distinctId = (properties.guest_id as string) ?? "anonymous";
  posthog.capture({ distinctId, event, properties });
}
