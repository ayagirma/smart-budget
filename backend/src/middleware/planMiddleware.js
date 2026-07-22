import { query } from '../db/index.js';

// @desc    Middleware to restrict endpoint access to Pro subscribers (Admins always have full access)
export const requirePro = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const result = await query('SELECT email, plan_tier, is_admin FROM users WHERE id = $1', [userId]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const { email, plan_tier, is_admin } = result.rows[0];
    const isAdmin = is_admin === true || (email && email.toLowerCase() === 'ayagirma@gmail.com');

    if (isAdmin || plan_tier === 'pro') {
      return next();
    }

    return res.status(403).json({
      error: 'Pro Subscription Required',
      requiresUpgrade: true,
      message: 'This premium feature requires a Pro subscription ($4.99/mo).'
    });
  } catch (err) {
    console.error('Error in requirePro middleware:', err.message);
    res.status(500).json({ error: 'Server error checking subscription tier' });
  }
};
