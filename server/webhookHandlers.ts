import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { storage } from './storage';
import { PLAN_CONFIG } from './planConfig';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'This usually means express.json() parsed the body before reaching this handler. ' +
        'FIX: Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    try {
      const stripe = await getUncachableStripeClient();
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );

      await WebhookHandlers.handleSubscriptionEvent(event);
    } catch (err: any) {
      console.warn('Custom webhook handling warning:', err.message);
    }
  }

  static async handleSubscriptionEvent(event: any): Promise<void> {
    const eventType = event.type;

    if (
      eventType === 'customer.subscription.created' ||
      eventType === 'customer.subscription.updated'
    ) {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const status = subscription.status;

      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user) {
        console.warn(`No user found for Stripe customer ${customerId}`);
        return;
      }

      if (status === 'active' || status === 'trialing') {
        const productId = subscription.items?.data?.[0]?.price?.product;
        let planKey = 'starter';

        if (productId) {
          try {
            const stripe = await getUncachableStripeClient();
            const product = await stripe.products.retrieve(productId as string);
            planKey = (product.metadata as any)?.plan_key || 'starter';
          } catch {
            console.warn('Could not retrieve product metadata, using default');
          }
        }

        const config = PLAN_CONFIG[planKey] || { plan: 'starter', maxChildren: 1 };
        const periodEnd = subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000)
          : null;

        await storage.updateUserStripeSubscription(user.id, subscription.id);
        await storage.updateUserPlan(user.id, config.plan, config.maxChildren, periodEnd);
        console.log(`Updated user ${user.id} to plan ${config.plan} via webhook`);
      }
    }

    if (eventType === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const user = await storage.getUserByStripeCustomerId(customerId);
      if (!user) return;

      await storage.updateUserPlan(user.id, 'free', 1, null);
      await storage.updateUserStripeSubscription(user.id, '');
      console.log(`Reverted user ${user.id} to free plan (subscription cancelled)`);
    }
  }
}
