import { query } from './src/db/index.js';

const seedCategories = async () => {
  const userId = 2; // the dummy user we created

  const defaultCategories = [
    { name: 'Grocery', type: 'expense', icon: 'shopping-cart', color: '#10b981' },
    { name: 'Bills', type: 'expense', icon: 'file-text', color: '#ef4444' },
    { name: 'Restaurant', type: 'expense', icon: 'coffee', color: '#f59e0b' },
    { name: 'Giving Away', type: 'expense', icon: 'heart', color: '#ec4899' },
    { name: 'Gift', type: 'expense', icon: 'gift', color: '#8b5cf6' },
    { name: 'Personal Growth', type: 'expense', icon: 'book', color: '#3b82f6' },
    { name: 'Salary', type: 'income', icon: 'dollar-sign', color: '#10b981' },
    { name: 'Side Hustle', type: 'income', icon: 'briefcase', color: '#6366f1' }
  ];

  try {
    // Check if they already exist
    const res = await query('SELECT * FROM categories WHERE user_id = $1', [userId]);
    if (res.rows.length === 0) {
      for (const cat of defaultCategories) {
        await query(
          'INSERT INTO categories (user_id, name, type, icon, color, is_default) VALUES ($1, $2, $3, $4, $5, $6)',
          [userId, cat.name, cat.type, cat.icon, cat.color, true]
        );
      }
      console.log('Categories seeded for dummy user!');
    } else {
      console.log('Categories already exist for dummy user.');
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
};

seedCategories();
