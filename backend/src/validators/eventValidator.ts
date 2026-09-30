import { z } from 'zod';

export const eventSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().min(1, 'Session ID is required'),
  eventType: z.enum([
    'user_registered',
    'user_logged_in',
    'page_viewed',
    'product_viewed',
    'product_search',
    'product_comparison',
    'pricing_viewed',
    'wishlist_added',
    'wishlist_removed',
    'cart_created',
    'cart_updated',
    'cart_abandoned',
    'checkout_started',
    'purchase_completed',
    'wholesale_pricing_viewed',
    'bulk_quote_submitted',
    'voice_agent_started',
    'voice_agent_completed',
    'voice_agent_triggered'
  ]),
  productId: z.string().optional(),
  orderId: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  source: z.string().default('web'),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional()
});

export type EventInput = z.infer<typeof eventSchema>;
