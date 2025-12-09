import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Provider, UserProfile, Transaction, Contact, UPIAccount } from '../lib/database.types';

interface AppState {
  currentUser: UserProfile | null;
  selectedProvider: Provider | null;
  upiAccounts: UPIAccount[];
  contacts: Contact[];
  transactions: Transaction[];
  isLoading: boolean;

  setCurrentUser: (user: UserProfile | null) => void;
  setSelectedProvider: (provider: Provider | null) => void;
  setUPIAccounts: (accounts: UPIAccount[]) => void;
  setContacts: (contacts: Contact[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  setLoading: (loading: boolean) => void;
  updateWalletBalance: (balance: number) => void;
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  reset: () => void;
}

const initialState = {
  currentUser: null,
  selectedProvider: null,
  upiAccounts: [],
  contacts: [],
  transactions: [],
  isLoading: false,
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setCurrentUser: (user) => set({ currentUser: user }),

      setSelectedProvider: (provider) => set({ selectedProvider: provider }),

      setUPIAccounts: (accounts) => set({ upiAccounts: accounts }),

      setContacts: (contacts) => set({ contacts: contacts }),

      setTransactions: (transactions) => set({ transactions: transactions }),

      setLoading: (loading) => set({ isLoading: loading }),

      updateWalletBalance: (balance) =>
        set((state) =>
          state.currentUser
            ? { currentUser: { ...state.currentUser, wallet_balance: balance } }
            : {}
        ),

      addTransaction: (transaction) =>
        set((state) => ({
          transactions: [transaction, ...state.transactions],
        })),

      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((txn) =>
            txn.id === id ? { ...txn, ...updates } : txn
          ),
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'unified-pay-storage',
      partialize: (state) => ({
        selectedProvider: state.selectedProvider,
      }),
    }
  )
);
