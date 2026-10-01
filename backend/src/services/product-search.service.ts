import { Product } from '../models/Product.js';

type SearchInput = { query?: string; category?: string; mood?: string; tags?: string[]; maxPrice?: number; minPrice?: number; availableOnly?: boolean };

export async function searchProducts(input: SearchInput) {
  const filter: any = { status: 'Active' };
  if (input.category) filter.category = new RegExp(input.category, 'i');
  if (input.availableOnly) filter.stock = { $gt: 0 };
  if (input.minPrice != null || input.maxPrice != null) filter.price = { ...(input.minPrice != null ? { $gte: input.minPrice } : {}), ...(input.maxPrice != null ? { $lte: input.maxPrice } : {}) };
  const words = [input.query, input.mood, ...(input.tags || [])].filter(Boolean).join(' ').trim().split(/\s+/).filter(word => word.length > 2);
  if (words.length) filter.$or = words.flatMap(word => [{ name: new RegExp(word, 'i') }, { description: new RegExp(word, 'i') }, { tags: new RegExp(word, 'i') }, { flavor: new RegExp(word, 'i') }]);
  return Product.find(filter).sort({ stock: -1, name: 1 }).limit(6).lean();
}
