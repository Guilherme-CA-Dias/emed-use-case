# Integration Use Case Template

A Next.js application demonstrating integration capabilities using [Integration.app](https://integration.app). This template showcases real-world integration patterns including contact management, webhook handling, and flow execution monitoring.

## Features

- 🔐 Authentication & Authorization
- 👥 Contact Management
- 🔄 Real-time Integration Flow Monitoring
- 🪝 Webhook Processing
- 🎨 Modern UI with Tailwind CSS
- 📱 Responsive Design
- 🌗 Dark Mode Support

## Prerequisites

- Node.js 18+
- Integration.app workspace credentials
- MongoDB database

## Setup

1. Clone and install:
```bash
git clone <repository-url>
cd <repository-name>
npm install
```

2. Environment configuration:
```bash
cp .env-sample .env
```

Required environment variables:
```env
INTEGRATION_APP_WORKSPACE_KEY=your_workspace_key
INTEGRATION_APP_WORKSPACE_SECRET=your_workspace_secret
MONGODB_URI=your_mongodb_connection_string
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # Backend API endpoints
│   │   ├── contacts/      # Contact management endpoints
│   │   ├── webhooks/      # Webhook handlers
│   │   └── integration-token/ # Token generation
│   ├── contacts/          # Contact management UI
│   ├── integrations/      # Integration management UI
│   └── users/             # User management UI
├── components/            # Reusable React components
│   ├── ui/               # UI components (buttons, modals, etc.)
│   └── shared/           # Shared components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions
│   ├── integration-app-client.ts  # Integration.app SDK setup
│   ├── integration-token.ts       # Token generation
│   ├── mongodb.ts               # Database connection
│   └── server-auth.ts          # Auth utilities
├── models/               # MongoDB models
└── types/               # TypeScript type definitions
```

## Key Features Implementation

### Contact Management

The application implements a complete contact management system:

- Create, read, update, and delete contacts
- Real-time synchronization with external systems
- Webhook processing for contact updates
- Flow execution monitoring

```typescript
// Example: Creating a contact
const response = await fetch('/api/contacts/create', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    ...getAuthHeaders()
  },
  body: JSON.stringify(contactData)
})
```

### Integration Flow Monitoring

Monitors integration flow execution in real-time:

- Polls flow status
- Handles various flow states (completed, failed)
- Provides feedback on flow progress

### Webhook Processing

Robust webhook handling system:

- Processes incoming webhooks from Integration.app
- Updates local database based on webhook events
- Handles various event types (created, updated, deleted)

## API Routes

- `POST /api/contacts/create` - Create new contact
- `GET /api/contacts` - List contacts
- `POST /api/webhooks/contacts` - Process contact webhooks
- `GET /api/integration-token` - Generate integration tokens

## Components

### UI Components

- `Modal` - Reusable modal dialog
- `Button` - Styled button component
- `Form` - Form components with validation

### Feature Components

- `ContactsTable` - Displays contact list
- `CreateContactModal` - Contact creation form
- `IntegrationsList` - Manages integrations

## Development

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

## Best Practices

- Use SWR for data fetching
- Include authorization headers in requests
- Handle loading and error states
- Implement proper type checking
- Follow REST API conventions
- Use environment variables for configuration

## Error Handling

The application implements comprehensive error handling:

- API error responses
- Flow execution monitoring
- Webhook processing errors
- Integration token generation failures

## License

MIT