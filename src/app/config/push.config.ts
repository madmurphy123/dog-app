/* Web Push configuration.
 *
 * - vapidPublicKey is safe to ship publicly (it's the public half of the pair).
 * - workerUrl is your deployed Cloudflare Worker base URL. Paste it in AFTER you
 *   deploy the Worker (see docs/NOTIFICATIONS.md), then push — Pages redeploys.
 *   Leave no trailing slash. While it's empty, the "phone alerts" button stays
 *   disabled with a hint.
 */
export const PUSH_CONFIG = {
  vapidPublicKey: 'BOWemmuzA81-oeWK4miIENFuXOQnO0xjsvbgazB7XSkMqEF2rGVyiFKS4iwo4iWQ6BcoeG-fULJfaRJFeXv9eTY',
  workerUrl: 'https://dog-day-push.dog.workers.dev',
  daysAhead: 7
};
