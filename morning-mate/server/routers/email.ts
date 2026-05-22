import { router } from "../_core/trpc";

// Email sending is handled directly in routers.ts (register → welcome email)
// and will be triggered by Stripe webhooks (subscription-welcome).
// This router is kept as a placeholder for future admin email endpoints.
export const emailRouter = router({});
