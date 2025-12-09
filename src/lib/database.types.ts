export type Provider = 'GPay' | 'PhonePe' | 'Paytm';

export type TransactionStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type RequestType = 'REQUEST' | 'SPLIT_BILL';

export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  wallet_balance: number;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UPIAccount {
  id: string;
  user_id: string;
  display_name: string;
  upi_id: string;
  bank_name: string;
  is_primary: boolean;
  created_at: string;
}

export interface Contact {
  id: string;
  owner_user_id: string;
  name: string;
  upi_id: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  txn_id: string;
  from_user_id: string;
  to_upi_id: string;
  to_name: string;
  amount: number;
  provider: Provider;
  status: TransactionStatus;
  note?: string;
  balance_before: number;
  balance_after?: number;
  failure_reason?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  processed_at?: string;
}

export interface TransactionRequest {
  id: string;
  request_type: RequestType;
  from_user_id: string;
  to_upi_id: string;
  to_name: string;
  amount: number;
  note?: string;
  status: RequestStatus;
  parent_request_id?: string;
  metadata: Record<string, unknown>;
  created_at: string;
  expires_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: {
    value?: number | boolean | string;
    min?: number;
    max?: number;
    description?: string;
  };
  updated_at: string;
  updated_by?: string;
}

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>>;
      };
      upi_accounts: {
        Row: UPIAccount;
        Insert: Omit<UPIAccount, 'id' | 'created_at'>;
        Update: Partial<Omit<UPIAccount, 'id' | 'user_id' | 'created_at'>>;
      };
      contacts: {
        Row: Contact;
        Insert: Omit<Contact, 'id' | 'created_at'>;
        Update: Partial<Omit<Contact, 'id' | 'owner_user_id' | 'created_at'>>;
      };
      transactions: {
        Row: Transaction;
        Insert: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Transaction, 'id' | 'from_user_id' | 'created_at'>>;
      };
      transaction_requests: {
        Row: TransactionRequest;
        Insert: Omit<TransactionRequest, 'id' | 'created_at'>;
        Update: Partial<Omit<TransactionRequest, 'id' | 'from_user_id' | 'created_at'>>;
      };
      system_settings: {
        Row: SystemSetting;
        Insert: Omit<SystemSetting, 'id' | 'updated_at'>;
        Update: Partial<Omit<SystemSetting, 'id'>>;
      };
    };
  };
}
