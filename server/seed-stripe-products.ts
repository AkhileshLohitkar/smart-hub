import { getUncachableStripeClient } from './stripeClient';

const PLANS = [
  {
    name: "Starter Monthly",
    description: "Unlimited worksheets for 1 child",
    metadata: { plan_key: "starter_monthly" },
    price: { unit_amount: 9900, currency: "inr", interval: "month" as const },
  },
  {
    name: "Starter Annual",
    description: "Unlimited worksheets for 1 child — save ₹189/year",
    metadata: { plan_key: "starter_annual" },
    price: { unit_amount: 99900, currency: "inr", interval: "year" as const },
  },
  {
    name: "Family Monthly",
    description: "Unlimited worksheets for 2-3 children",
    metadata: { plan_key: "family_monthly" },
    price: { unit_amount: 18900, currency: "inr", interval: "month" as const },
  },
  {
    name: "Family Annual",
    description: "Unlimited worksheets for 2-3 children — save ₹469/year",
    metadata: { plan_key: "family_annual" },
    price: { unit_amount: 179900, currency: "inr", interval: "year" as const },
  },
  {
    name: "No Watermark",
    description: "Unlimited worksheets, unlimited children, no watermark",
    metadata: { plan_key: "no_watermark" },
    price: { unit_amount: 34900, currency: "inr", interval: "year" as const },
  },
];

async function seedProducts() {
  const stripe = await getUncachableStripeClient();

  for (const plan of PLANS) {
    const existing = await stripe.products.search({
      query: `name:'${plan.name}'`,
    });

    if (existing.data.length > 0) {
      console.log(`✓ "${plan.name}" already exists (${existing.data[0].id})`);
      const prices = await stripe.prices.list({ product: existing.data[0].id, active: true });
      if (prices.data.length > 0) {
        console.log(`  Price: ${prices.data[0].id} (${prices.data[0].unit_amount} ${prices.data[0].currency})`);
      }
      continue;
    }

    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description,
      metadata: plan.metadata,
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: plan.price.unit_amount,
      currency: plan.price.currency,
      recurring: { interval: plan.price.interval },
    });

    console.log(`✓ Created "${plan.name}" → product: ${product.id}, price: ${price.id}`);
  }

  console.log("\nDone! Products are synced via webhook.");
}

seedProducts().catch(console.error);
