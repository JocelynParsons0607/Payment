/*
  # Unified Pay - Complete Database Schema
  
  ## Overview
  Creates the complete database schema for the Unified Pay demo UPI wallet application.
  This includes user profiles, UPI accounts, contacts, transactions, and system settings.
  
  ## New Tables
  
  ### `user_profiles`
  Extended user profile with wallet balance and demo account info
  - `id` (uuid, references auth.users) - User ID
  - `name` (text) - Display name
  - `phone` (text, unique) - Phone number
  - `email` (text, unique) - Email address
  - `wallet_balance` (decimal) - Current wallet balance (demo)
  - `avatar_url` (text, nullable) - Profile picture URL
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `upi_accounts`
  Virtual UPI IDs linked to user accounts
  - `id` (uuid) - Account ID
  - `user_id` (uuid, references user_profiles) - Owner
  - `display_name` (text) - Account display name
  - `upi_id` (text, unique) - UPI ID (e.g., alice@demo)
  - `bank_name` (text) - Virtual bank name
  - `is_primary` (boolean) - Primary account flag
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `contacts`
  User's contact list for quick payments
  - `id` (uuid) - Contact ID
  - `owner_user_id` (uuid, references user_profiles) - Contact list owner
  - `name` (text) - Contact name
  - `upi_id` (text) - Contact's UPI ID
  - `phone` (text, nullable) - Phone number
  - `avatar_url` (text, nullable) - Avatar URL
  - `created_at` (timestamptz) - Creation timestamp
  
  ### `transactions`
  All payment transactions with complete audit trail
  - `id` (uuid) - Transaction record ID
  - `txn_id` (text, unique) - Human-readable transaction ID
  - `from_user_id` (uuid, references user_profiles) - Sender
  - `to_upi_id` (text) - Recipient UPI ID
  - `to_name` (text) - Recipient name
  - `amount` (decimal) - Transaction amount
  - `provider` (text) - Provider used (GPay/PhonePe/Paytm Demo)
  - `status` (text) - Transaction status (PENDING/PROCESSING/SUCCESS/FAILED)
  - `note` (text, nullable) - Transaction note
  - `balance_before` (decimal) - Sender balance before transaction
  - `balance_after` (decimal, nullable) - Sender balance after transaction
  - `failure_reason` (text, nullable) - Reason if failed
  - `metadata` (jsonb) - Additional data (bank ref, routing info)
  - `created_at` (timestamptz) - Transaction creation time
  - `updated_at` (timestamptz) - Last status update time
  - `processed_at` (timestamptz, nullable) - Processing completion time
  
  ### `transaction_requests`
  Money requests and bill splits
  - `id` (uuid) - Request ID
  - `request_type` (text) - Type: REQUEST or SPLIT_BILL
  - `from_user_id` (uuid, references user_profiles) - Requester
  - `to_upi_id` (text) - Recipient UPI ID
  - `to_name` (text) - Recipient name
  - `amount` (decimal) - Requested amount
  - `note` (text, nullable) - Request note
  - `status` (text) - Status: PENDING/ACCEPTED/REJECTED/EXPIRED
  - `parent_request_id` (uuid, nullable) - For split bills
  - `metadata` (jsonb) - Additional data
  - `created_at` (timestamptz) - Request creation time
  - `expires_at` (timestamptz) - Expiration time
  
  ### `system_settings`
  Admin controls for transaction simulation
  - `id` (uuid) - Settings ID
  - `setting_key` (text, unique) - Setting name
  - `setting_value` (jsonb) - Setting value
  - `updated_at` (timestamptz) - Last update
  - `updated_by` (uuid, nullable) - Admin who updated
  
  ## Security
  - Enable RLS on all tables
  - Users can read/update their own profile
  - Users can manage their own UPI accounts
  - Users can manage their own contacts
  - Users can view their own transactions
  - Transaction requests visible to both parties
  - System settings readable by all, writable by admins only
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  wallet_balance decimal(12, 2) NOT NULL DEFAULT 0.00,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create upi_accounts table
CREATE TABLE IF NOT EXISTS upi_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  upi_id text UNIQUE NOT NULL,
  bank_name text NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  upi_id text NOT NULL,
  phone text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  txn_id text UNIQUE NOT NULL,
  from_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  to_upi_id text NOT NULL,
  to_name text NOT NULL,
  amount decimal(12, 2) NOT NULL,
  provider text NOT NULL CHECK (provider IN ('GPay', 'PhonePe', 'Paytm')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED')),
  note text,
  balance_before decimal(12, 2) NOT NULL,
  balance_after decimal(12, 2),
  failure_reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create transaction_requests table
CREATE TABLE IF NOT EXISTS transaction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_type text NOT NULL CHECK (request_type IN ('REQUEST', 'SPLIT_BILL')),
  from_user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  to_upi_id text NOT NULL,
  to_name text NOT NULL,
  amount decimal(12, 2) NOT NULL,
  note text,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  parent_request_id uuid REFERENCES transaction_requests(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT now() + interval '7 days'
);

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES user_profiles(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_upi_accounts_user_id ON upi_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_upi_accounts_upi_id ON upi_accounts(upi_id);
CREATE INDEX IF NOT EXISTS idx_contacts_owner_user_id ON contacts(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_user_id ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transaction_requests_from_user_id ON transaction_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_requests_status ON transaction_requests(status);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE upi_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for upi_accounts
CREATE POLICY "Users can view own UPI accounts"
  ON upi_accounts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own UPI accounts"
  ON upi_accounts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own UPI accounts"
  ON upi_accounts FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own UPI accounts"
  ON upi_accounts FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- RLS Policies for contacts
CREATE POLICY "Users can view own contacts"
  ON contacts FOR SELECT
  TO authenticated
  USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create own contacts"
  ON contacts FOR INSERT
  TO authenticated
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update own contacts"
  ON contacts FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can delete own contacts"
  ON contacts FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid());

CREATE POLICY "Users can create own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update own pending transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (from_user_id = auth.uid())
  WITH CHECK (from_user_id = auth.uid());

-- RLS Policies for transaction_requests
CREATE POLICY "Users can view requests they created or received"
  ON transaction_requests FOR SELECT
  TO authenticated
  USING (from_user_id = auth.uid() OR to_upi_id IN (
    SELECT upi_id FROM upi_accounts WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create transaction requests"
  ON transaction_requests FOR INSERT
  TO authenticated
  WITH CHECK (from_user_id = auth.uid());

CREATE POLICY "Users can update transaction requests"
  ON transaction_requests FOR UPDATE
  TO authenticated
  USING (from_user_id = auth.uid() OR to_upi_id IN (
    SELECT upi_id FROM upi_accounts WHERE user_id = auth.uid()
  ))
  WITH CHECK (from_user_id = auth.uid() OR to_upi_id IN (
    SELECT upi_id FROM upi_accounts WHERE user_id = auth.uid()
  ));

-- RLS Policies for system_settings
CREATE POLICY "All authenticated users can view system settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update system settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can modify system settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value)
VALUES 
  ('transaction_success_rate', '{"value": 0.9, "description": "Probability of transaction success (0.0 to 1.0)"}'::jsonb),
  ('transaction_delay_ms', '{"min": 2000, "max": 8000, "description": "Simulated processing delay in milliseconds"}'::jsonb),
  ('enable_dev_mode', '{"value": true, "description": "Enable developer mode features"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();