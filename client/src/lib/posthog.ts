import posthog from "posthog-js";

let initialized = false;

export function initPostHog(): void {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key || initialized) return;
  posthog.init(key, {
    api_host: "https://app.posthog.com",
    capture_pageview: false,
    persistence: "localStorage",
  });
  initialized = true;
}

export function identifyUser(
  userId: string | number,
  properties: { email?: string; name?: string; userCategory?: string | null }
): void {
  if (!initialized) return;
  posthog.identify(String(userId), {
    email: properties.email,
    name: properties.name,
    user_category: properties.userCategory || "Not specified",
  });
}

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
): void {
  if (!initialized) return;
  posthog.capture(event, properties);
}

export function resetPostHog(): void {
  if (!initialized) return;
  posthog.reset();
}
