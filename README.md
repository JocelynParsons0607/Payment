# Unified Pay — Demo UPI Wallet

A full-featured, single-page web application that simulates the user experience and core functionality of popular Indian UPI wallets (Google Pay, PhonePe, Paytm). This is a **demo/test tool only** — all transactions are simulated locally with no connections to real payment gateways, banks, or UPI networks.

⚠️ **IMPORTANT DISCLAIMER**: This product is a demo and not affiliated with Google Pay, PhonePe, or Paytm. Do not use this software for processing real payments. All transactions are simulated and no real money is involved.

## Features

### Core Functionality
- **Provider Selection**: Choose between three provider themes (GPay, PhonePe, Paytm)
- **User Authentication**: Demo user accounts with sign up/sign in
- **Wallet Management**: Virtual wallet balance with demo top-up functionality
- **UPI Accounts**: Link multiple virtual UPI IDs
- **Send Money**: Complete payment flow with recipient selection, amount entry, and provider choice
- **Transaction History**: View all transactions with filters by status and provider
- **Transaction Details**: Complete audit trail including transaction ID, timestamps, balances, and metadata
- **Contacts Management**: Add and manage contacts for quick payments
- **QR Code**: Generate and scan QR codes for payment requests
- **Real-time Updates**: Transaction status updates via Supabase Realtime
- **Export Data**: Export transaction history as CSV or JSON

### Developer/Admin Features
- **Adjustable Success Rate**: Control transaction success/failure probability
- **Configurable Delays**: Set processing delay ranges
- **Demo Wallet Top-up**: Add funds to wallet for testing
- **Clear History**: Reset transaction data
- **Export All Data**: Backup complete user data

### Transaction Simulation
- Realistic transaction lifecycle: PENDING → PROCESSING → SUCCESS/FAILED
- Random transaction IDs in format: `TXN-YYYYMMDD-XXXXXX`
- Configurable success rates and processing delays
- Simulated failure reasons
- Balance tracking before and after transactions
- Bank reference numbers

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Zustand for state management
- Lucide React for icons
- QRCode library for QR generation
- date-fns for date formatting

### Backend
- Supabase (PostgreSQL database)
- Supabase Auth for authentication
- Supabase Realtime for live updates
- Supabase Edge Functions for transaction processing

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- A Supabase account and project

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Environment variables are already configured in `.env`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. The database schema and Edge Functions are already deployed.

### Running Locally

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
npm run preview
```

## Demo Users

Three demo users are pre-seeded with sample data:

| Email | Password | Initial Balance |
|-------|----------|----------------|
| alice@demo.com | demo123 | ₹2,000.00 |
| bob@demo.com | demo123 | ₹1,500.00 |
| carol@demo.com | demo123 | ₹500.00 |

You can also create your own demo accounts through the sign-up flow.

## Usage Guide

### Making a Payment

1. **Sign In**: Use one of the demo accounts or create a new one
2. **Select Provider**: Choose your preferred UI theme (GPay/PhonePe/Paytm)
3. **Initiate Payment**: Click "Pay" from the home screen
4. **Enter Details**:
   - Enter recipient's UPI ID or select from contacts
   - Enter amount and optional note
5. **Confirm**: Review details and confirm payment
6. **Wait for Processing**: Transaction will process with simulated delays
7. **View Result**: See success or failure message with transaction details

### Using Developer Mode

Access the Settings/Admin panel to:
- **Top Up Wallet**: Add demo funds for testing
- **Adjust Success Rate**: Control how often transactions succeed (0-100%)
- **Set Processing Delays**: Configure min/max delay in milliseconds
- **Clear History**: Remove all transaction records
- **Export Data**: Download all data as JSON

### QR Code Features

**Generate QR**:
1. Go to QR section
2. Select "Show My QR"
3. Optionally enter amount
4. Download or share QR code

**Scan QR** (Simulated):
1. Go to QR section
2. Select "Scan QR"
3. Upload a QR code image
4. System will parse payment details

## Database Schema

### Tables
- **user_profiles**: Extended user information and wallet balance
- **upi_accounts**: Virtual UPI IDs linked to users
- **contacts**: User's contact list
- **transactions**: Complete transaction records with audit trail
- **transaction_requests**: Money requests and bill splits (future feature)
- **system_settings**: Admin configuration for transaction simulation

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Transactions are scoped to authenticated users
- Settings readable by all, writable with proper permissions

## API Endpoints (Edge Functions)

### POST /functions/v1/process-transaction
Processes a payment transaction with simulated delays and success/failure.

**Request Body**:
```json
{
  "toUpiId": "string",
  "toName": "string",
  "amount": number,
  "provider": "GPay" | "PhonePe" | "Paytm",
  "note": "string" (optional)
}
```

**Response**:
```json
{
  "transaction": {
    "id": "uuid",
    "txn_id": "TXN-20231209-ABC123",
    "status": "PENDING",
    ...
  }
}
```

### POST /functions/v1/seed-demo-data
Seeds the database with demo users and sample transactions.

## Transaction Lifecycle

1. **PENDING**: Initial state when transaction is created
2. **PROCESSING**: Transaction is being processed (simulated)
3. **SUCCESS**: Transaction completed successfully, balance updated
4. **FAILED**: Transaction failed, balance restored, failure reason recorded

Processing includes:
- Balance validation
- Hold funds to prevent double-spend
- Simulated async processing with configurable delays
- Random success/failure based on configured rate
- Balance updates and transaction finalization
- Real-time status updates to UI

## Export Formats

### CSV Export
Transaction history exported with columns:
- Transaction ID
- Date
- Recipient Name
- UPI ID
- Amount
- Provider
- Status
- Note
- Balance Before/After

### JSON Export
Complete data export including:
- User profile
- All transactions
- All contacts
- Export timestamp

## Testing Scenarios

### Happy Path
1. Sign in as Alice
2. Send ₹100 to Bob
3. Transaction succeeds
4. Balance deducted correctly
5. Transaction appears in history

### Failure Scenarios
1. Lower success rate to 30%
2. Attempt multiple payments
3. Some will fail with various reasons
4. Failed transactions don't deduct balance

### Concurrent Transactions
1. Make multiple quick payments
2. Verify no double-spend occurs
3. Check all transactions process correctly

## Security Considerations

- All passwords are hashed with bcrypt
- Session management via Supabase Auth
- Row Level Security enforces data access
- No real payment processing or API connections
- Demo-only disclaimer shown throughout UI
- Edge Functions use service role key securely

## Known Limitations

- This is a demo application for testing and demonstration only
- No integration with real UPI, banks, or payment gateways
- QR scanning simulated (no camera access)
- No SMS/OTP integration
- Request Money and Split Bill features are database-ready but UI incomplete
- No push notifications (can be added)

## Future Enhancements

- Complete Request Money UI
- Complete Split Bill UI
- Transaction search and advanced filters
- Recurring payments setup
- Budget tracking and analytics
- Multi-language support
- Dark mode theme
- Progressive Web App (PWA) support

## Project Structure

```
src/
├── components/          # React components
│   ├── Auth.tsx        # Authentication screens
│   ├── Home.tsx        # Main dashboard
│   ├── PaymentFlow.tsx # Payment process
│   ├── TransactionHistory.tsx
│   ├── ContactsManager.tsx
│   ├── QRScanner.tsx
│   ├── AdminPanel.tsx
│   └── ProviderSelection.tsx
├── hooks/
│   └── useAuth.tsx     # Authentication hook
├── lib/
│   ├── supabase.ts     # Supabase client
│   ├── database.types.ts # TypeScript types
│   └── utils.ts        # Utility functions
├── store/
│   └── useStore.ts     # Zustand state management
├── App.tsx             # Main app component
└── main.tsx            # Entry point

supabase/
└── functions/          # Edge Functions
    ├── process-transaction/
    └── seed-demo-data/
```

## Troubleshooting

### Transactions stuck in PENDING
- Check browser console for errors
- Verify Edge Function is deployed
- Check Supabase logs

### Balance not updating
- Ensure real-time subscription is active
- Refresh the page to fetch latest data
- Check transaction status in history

### Cannot sign in
- Verify demo users are seeded (run seed-demo-data function)
- Check credentials match demo accounts
- Clear browser cache and cookies

## Support & Contributing

This is a demo project. For questions or issues:
1. Check this README
2. Review the code comments
3. Check Supabase logs for Edge Function errors

## License

This is a demo application for educational and testing purposes only.

## Legal Notice

This product is not affiliated with, endorsed by, or connected to Google Pay, PhonePe, Paytm, or any other payment service provider. All trademarks and brand names are the property of their respective owners. This application is provided "as is" for demonstration purposes only and should not be used for any real payment processing.
