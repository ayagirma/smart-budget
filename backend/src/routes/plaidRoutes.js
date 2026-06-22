import express from 'express';
import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import dotenv from 'dotenv';
import { query } from '../db/index.js';
import { protect } from '../middleware/authMiddleware.js';
import { autoCategorize } from '../utils/categorization.js';

dotenv.config();

const router = express.Router();

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

// Create Link Token
router.post('/create_link_token', protect, async (req, res) => {
  try {
    const request = {
      user: {
        client_user_id: req.user.id.toString(),
      },
      client_name: 'Budget App',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en',
    };
    const createTokenResponse = await client.linkTokenCreate(request);
    res.json(createTokenResponse.data);
  } catch (error) {
    console.error('Error creating link token:', error.response?.data || error);
    res.status(500).json({ error: 'Failed to create link token' });
  }
});

// Set Access Token
router.post('/set_access_token', protect, async (req, res) => {
  try {
    const { public_token } = req.body;
    const response = await client.itemPublicTokenExchange({
      public_token: public_token,
    });
    const access_token = response.data.access_token;
    const item_id = response.data.item_id;

    // Get institution name for display (optional, but good UX)
    const itemResponse = await client.itemGet({ access_token });
    const institutionId = itemResponse.data.item.institution_id;
    let institutionName = "Unknown Bank";
    
    if (institutionId) {
      const instResponse = await client.institutionsGetById({
        institution_id: institutionId,
        country_codes: ['US'],
      });
      institutionName = instResponse.data.institution.name;
    }

    // Save to DB
    await query(
      `INSERT INTO plaid_items (user_id, access_token, item_id, institution_name)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, item_id) DO UPDATE SET access_token = EXCLUDED.access_token`,
      [req.user.id, access_token, item_id, institutionName]
    );

    res.json({ message: 'Item successfully linked', item_id });
  } catch (error) {
    console.error('Error exchanging token:', error.response?.data || error);
    res.status(500).json({ error: 'Failed to link account' });
  }
});

// Sync transactions manually
router.post('/sync', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's plaid items
    const { rows } = await query('SELECT * FROM plaid_items WHERE user_id = $1', [userId]);
    
    if (rows.length === 0) {
      return res.status(400).json({ error: 'No linked accounts found' });
    }

    let totalSynced = 0;

    // A simplified transaction sync (usually you'd use Plaid's /transactions/sync endpoint)
    // We'll use /transactions/get for simplicity here to get the last 30 days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    const endDate = new Date();

    const start_date = startDate.toISOString().split('T')[0];
    const end_date = endDate.toISOString().split('T')[0];

    for (const item of rows) {
      const response = await client.transactionsGet({
        access_token: item.access_token,
        start_date,
        end_date,
      });

      const transactions = response.data.transactions;
      
      for (const t of transactions) {
        const plaidTxId = t.transaction_id;
        const type = t.amount < 0 ? 'income' : 'expense';
        const amount = Math.abs(t.amount);
        
        // Auto-categorize
        const categoryId = await autoCategorize(userId, t.name);
        
        const result = await query(
          `INSERT INTO transactions (user_id, category_id, amount, type, description, date, plaid_transaction_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (plaid_transaction_id) DO NOTHING
           RETURNING id`,
          [userId, categoryId, amount, type, t.name, t.date, plaidTxId]
        );
        
        if (result.rowCount > 0) {
          totalSynced++;
        }
      }
    }

    res.json({ message: `Successfully synced ${totalSynced} transactions` });
  } catch (error) {
    console.error('Error syncing transactions:', error.response?.data || error);
    res.status(500).json({ error: 'Failed to sync transactions' });
  }
});

export default router;
