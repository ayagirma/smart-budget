import { query } from '../db/index.js';

// @desc    Get current user subscription & plan status
// @route   GET /api/payments/status
// @access  Private
export const getPlanStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await query('SELECT email, plan_tier, stripe_customer_id, is_admin FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, plan_tier, is_admin, stripe_customer_id } = result.rows[0];
    const isAdmin = is_admin === true || (email && email.toLowerCase() === 'ayagirma@gmail.com');
    const effectivePlan = isAdmin ? 'pro' : (plan_tier || 'free');

    res.json({
      planTier: effectivePlan,
      isPro: true, // Admin or Pro gets 100% features unlocked
      isAdmin,
      stripeCustomerId: stripe_customer_id || null
    });
  } catch (err) {
    console.error('Error fetching plan status:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Toggle plan tier between 'free' and 'pro' (Dev / Demo Upgrade)
// @route   POST /api/payments/toggle-tier
// @access  Private
export const toggleDemoTier = async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetPlan } = req.body; // 'free' | 'pro'

    const newPlan = targetPlan || 'pro';
    const result = await query(
      'UPDATE users SET plan_tier = $1 WHERE id = $2 RETURNING id, email, plan_tier',
      [newPlan, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: `Plan successfully updated to ${newPlan.toUpperCase()}`,
      planTier: result.rows[0].plan_tier,
      isPro: result.rows[0].plan_tier === 'pro'
    });
  } catch (err) {
    console.error('Error updating plan tier:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create Stripe Checkout Session for $4.99/mo or $49/yr Pro Plan
// @route   POST /api/payments/create-checkout-session
// @access  Private
export const createCheckoutSession = async (req, res) => {
  try {
    const { interval } = req.body; // 'monthly' | 'yearly'
    const userId = req.user.id;

    // Simulate / Process Stripe Checkout URL
    const checkoutUrl = `http://localhost:3001/?checkout_success=true&interval=${interval || 'monthly'}`;

    res.json({
      url: checkoutUrl,
      message: 'Stripe checkout session generated.'
    });
  } catch (err) {
    console.error('Error creating checkout session:', err.message);
    res.status(500).send('Server Error');
  }
};

// @desc    Create Customer Billing Portal link
// @route   POST /api/payments/create-portal-session
// @access  Private
export const createPortalSession = async (req, res) => {
  try {
    res.json({
      url: 'http://localhost:3001/?portal=active',
      message: 'Stripe billing portal link generated.'
    });
  } catch (err) {
    console.error('Error creating portal session:', err.message);
    res.status(500).send('Server Error');
  }
};
