import { query } from './index.js';

export const initStripeSchema = async () => {
  try {
    await query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS plan_tier VARCHAR(20) DEFAULT 'free',
      ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS stripe_subscription_id VARCHAR(100),
      ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
    `);

    // Grant Admin & Full Pro Access to ayagirma@gmail.com
    await query(`
      UPDATE users 
      SET is_admin = TRUE, plan_tier = 'pro' 
      WHERE LOWER(email) = 'ayagirma@gmail.com';
    `);

    console.log("Stripe, Plan tier, and Admin privileges verified (ayagirma@gmail.com set as Admin with full access).");
  } catch (e) {
    console.error("Error initializing Stripe & Admin schema:", e.message);
  }
};
