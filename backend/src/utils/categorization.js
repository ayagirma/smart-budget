import { query } from '../db/index.js';

export const autoCategorize = async (userId, description) => {
  try {
    const { rows } = await query('SELECT category_id, keyword, match_type FROM category_rules WHERE user_id = $1', [userId]);
    
    if (rows.length === 0) return null;

    const lowerDesc = description.toLowerCase();

    for (const rule of rows) {
      const lowerKeyword = rule.keyword.toLowerCase();
      
      if (rule.match_type === 'exact' && lowerDesc === lowerKeyword) {
        return rule.category_id;
      }
      
      if (rule.match_type === 'starts_with' && lowerDesc.startsWith(lowerKeyword)) {
        return rule.category_id;
      }
      
      if (rule.match_type === 'contains' && lowerDesc.includes(lowerKeyword)) {
        return rule.category_id;
      }
    }

    return null;
  } catch (error) {
    console.error('Error auto-categorizing:', error);
    return null;
  }
};
