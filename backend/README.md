# Fizzi Backend - AI Sales & Customer Agent

Complete backend implementation for the Fizzi AI-powered sales and customer engagement platform.

## Features

- **Customer Behavior Tracking**: Comprehensive event tracking and behavioral analytics
- **Dynamic Lead Scoring**: Real-time scoring with configurable rules
- **Intent Detection**: Automatic customer intent classification
- **Pipeline Management**: Automated pipeline stage transitions
- **Retell AI Integration**: Voice agent with dynamic context variables
- **Twilio Integration**: SMS and voice communication
- **Real-time Updates**: Socket.IO for live admin dashboard updates
- **Admin Dashboard**: Complete CRM and analytics APIs

## Tech Stack

- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Socket.IO
- Retell AI SDK
- Twilio SDK
- Zod validation

## Setup

### Prerequisites

- Node.js 18+ installed
- MongoDB running locally or remote URI
- Retell AI account (optional)
- Twilio account (optional)

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/fizzi
JWT_SECRET=your-secret-key
RETELL_API_KEY=your-retell-key
RETELL_AGENT_ID=your-agent-id
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
```

### Database Seeding

```bash
npm run seed
```

This creates:
- Admin user: `admin@fizzi.com` / `admin123`
- 10 customers
- 5 Fizzi products
- 30 orders
- Events, leads, conversations

## Development

```bash
npm run dev
```

Server runs on `http://localhost:5000`

## Production

```bash
npm run build
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### Events
- `POST /api/events` - Create event (public)
- `GET /api/events` - List events

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product
- `POST /api/products` - Create product (admin)
- `PATCH /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

### Agent
- `GET /api/agent/context/:userId` - Get agent context
- `POST /api/agent/call` - Initiate call
- `GET /api/agent/conversations` - List conversations
- `GET /api/agent/conversations/:id` - Get conversation

### Admin
- `GET /api/admin/dashboard` - Dashboard metrics
- `GET /api/admin/customers` - List customers
- `GET /api/admin/customers/:id` - Customer detail
- `GET /api/admin/leads` - List leads
- `GET /api/admin/leads/:id` - Lead detail
- `PATCH /api/admin/leads/:id` - Update lead
- `GET /api/admin/orders` - List orders
- `GET /api/admin/orders/:id` - Order detail
- `PATCH /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/agent-analysis/:userId` - Agent analysis
- `GET /api/admin/scoring/rules` - Get scoring rules
- `PATCH /api/admin/scoring/rules` - Update scoring rules
- `GET /api/admin/analytics` - Analytics

### Webhooks
- `POST /api/webhooks/retell` - Retell AI webhook

## Event System

The backend tracks customer behavior through events:

### Event Types
- `user_registered`
- `user_logged_in`
- `page_viewed`
- `product_viewed`
- `product_search`
- `pricing_viewed`
- `wishlist_added`
- `cart_created`
- `cart_updated`
- `cart_abandoned`
- `checkout_started`
- `purchase_completed`
- `wholesale_pricing_viewed`
- `bulk_quote_submitted`
- `voice_agent_started`
- `voice_agent_completed`

### Creating Events

```javascript
POST /api/events
{
  "userId": "user_id",
  "sessionId": "session_123",
  "eventType": "product_viewed",
  "productId": "product_id",
  "source": "web"
}
```

## Lead Scoring

Default scoring rules:
- Product viewed: +3
- Repeated product view: +8
- Pricing viewed: +10
- Wishlist added: +5
- Cart created: +15
- Checkout started: +20
- Purchase completed: +30
- Wholesale pricing viewed: +15
- Bulk quote submitted: +25
- Cart abandoned: -5

## Intent Levels

- **low**: Score < 40
- **medium**: Score 40-59
- **high**: Score 60-79
- **very_high**: Score 80+

## Pipeline Stages

- **new**: New lead
- **qualified**: Score >= 40
- **high_intent**: High/very high intent
- **cart_abandoned**: Abandoned cart
- **bulk_quote**: B2B interest
- **call_scheduled**: Call scheduled
- **negotiation**: In negotiation
- **closed_won**: Purchased
- **closed_lost**: Lost opportunity

## Retell AI Integration

### Dynamic Variables

The backend generates dynamic context for each call:

```javascript
{
  "customer_name": "Ruthvik",
  "customer_type": "d2c",
  "current_product": "Yuzu Citrus",
  "product_view_count": "4",
  "cart_value": "899",
  "lead_score": "82",
  "intent_level": "high",
  "next_best_action": "Start product conversation",
  "trigger_reason": "Repeated product views"
}
```

### Webhook Processing

Retell sends webhooks for:
- `call_started`
- `call_ended`
- `call_analyzed`

The backend automatically:
- Updates conversation status
- Extracts intent and product interest
- Updates lead score
- Updates pipeline stage

## Real-time Events

Socket.IO events:
- `customer_online`
- `product_viewed`
- `cart_updated`
- `cart_abandoned`
- `lead_score_changed`
- `lead_stage_changed`
- `agent_call_started`
- `agent_call_completed`
- `order_created`

## Testing

```bash
npm test
```

## Project Structure

```
backend/
├── src/
│   ├── config/         # Configuration
│   ├── models/         # Mongoose models
│   ├── controllers/    # Route controllers
│   ├── services/       # Business logic
│   ├── middleware/     # Express middleware
│   ├── validators/     # Input validation
│   ├── integrations/   # External APIs
│   ├── webhooks/       # Webhook handlers
│   ├── realtime/       # Socket.IO
│   ├── routes/         # API routes
│   ├── utils/          # Utilities
│   ├── app.ts          # Express app
│   └── server.ts       # Server entry
├── tests/              # Tests
├── logs/               # Log files
├── .env.example        # Environment template
└── package.json
```

## License

MIT
