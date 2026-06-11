import { query } from './src/db/index.js';

const defaultCategories = [
  // Income (need at least one default income)
  { name: 'Salary', type: 'income', icon: 'wallet', color: '#10b981' },
  { name: 'Other Income', type: 'income', icon: 'dollar-sign', color: '#10b981' },

  // Standard Expenses
  { name: 'Electricity', type: 'expense', icon: 'zap', color: '#f59e0b' },
  { name: 'Mortgage (1st)', type: 'expense', icon: 'home', color: '#3b82f6' },
  { name: 'Mortgage (2nd)', type: 'expense', icon: 'home', color: '#3b82f6' },
  { name: 'Student Loan', type: 'expense', icon: 'book', color: '#8b5cf6' },
  { name: 'Car Payment', type: 'expense', icon: 'car', color: '#6366f1' },
  { name: 'Credit Card', type: 'expense', icon: 'credit-card', color: '#ef4444' },
  { name: 'Other Loan', type: 'expense', icon: 'file-text', color: '#6b7280' },
  { name: 'Water and Sewer', type: 'expense', icon: 'droplet', color: '#0ea5e9' },
  { name: 'Natural Gas or Propane', type: 'expense', icon: 'flame', color: '#f97316' },
  { name: 'Trash Services', type: 'expense', icon: 'trash', color: '#71717a' },
  { name: 'Internet', type: 'expense', icon: 'wifi', color: '#06b6d4' },
  { name: 'Phone Bill', type: 'expense', icon: 'smartphone', color: '#14b8a6' },
  { name: 'Grocery', type: 'expense', icon: 'shopping-cart', color: '#84cc16' },
  { name: 'Restaurant', type: 'expense', icon: 'coffee', color: '#f43f5e' },
  
  // Savings (Tracked as Expenses)
  { name: 'Emergency Fund', type: 'expense', icon: 'shield', color: '#10b981' },
  { name: 'Retirement Saving', type: 'expense', icon: 'trending-up', color: '#10b981' },
  { name: 'Large Vacation Save', type: 'expense', icon: 'plane', color: '#0ea5e9' }
];

const run = async () => {
  try {
    // Wipe existing categories
    await query('DELETE FROM categories');
    console.log("Wiped existing categories.");

    // Insert new defaults
    for (const cat of defaultCategories) {
      await query(
        'INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES (NULL, $1, $2, $3, $4, true)',
        [cat.name, cat.type, cat.icon, cat.color]
      );
    }
    console.log("Seeded default family categories.");

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
