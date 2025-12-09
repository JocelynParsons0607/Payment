import { useState, useEffect } from 'react';
import {
  Wallet,
  Send,
  QrCode,
  Users,
  History,
  Settings,
  ArrowUpCircle,
  ArrowDownCircle,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatTimeShort, getProviderColors } from '../lib/utils';
import { PaymentFlow } from './PaymentFlow';
import { TransactionHistory } from './TransactionHistory';
import { ContactsManager } from './ContactsManager';
import { QRScanner } from './QRScanner';
import { AdminPanel } from './AdminPanel';
import type { Transaction } from '../lib/database.types';

type Screen = 'home' | 'pay' | 'history' | 'contacts' | 'qr' | 'settings';

export function Home() {
  const { profile, refreshProfile, signOut } = useAuth();
  const { selectedProvider, transactions, setTransactions } = useStore();
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);

  const providerColors = selectedProvider ? getProviderColors(selectedProvider) : null;

  useEffect(() => {
    loadTransactions();
    setupRealtimeSubscription();
  }, [profile?.id]);

  const loadTransactions = async () => {
    if (!profile?.id) return;

    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('from_user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (data) {
      setRecentTransactions(data);
      setTransactions(data);
    }
  };

  const setupRealtimeSubscription = () => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `from_user_id=eq.${profile.id}`,
        },
        async () => {
          await loadTransactions();
          await refreshProfile();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  if (currentScreen === 'pay') {
    return <PaymentFlow onBack={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'history') {
    return <TransactionHistory onBack={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'contacts') {
    return <ContactsManager onBack={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'qr') {
    return <QRScanner onBack={() => setCurrentScreen('home')} />;
  }

  if (currentScreen === 'settings') {
    return <AdminPanel onBack={() => setCurrentScreen('home')} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`bg-gradient-to-br ${providerColors?.gradient || 'from-blue-500 to-green-500'} text-white p-6 pb-20 rounded-b-3xl shadow-lg`}
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <p className="text-sm opacity-90">Welcome back</p>
            <h2 className="text-2xl font-bold">{profile?.name}</h2>
          </div>
          <button
            onClick={() => setCurrentScreen('settings')}
            className="p-2 hover:bg-white/20 rounded-full transition"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5" />
            <p className="text-sm opacity-90">Wallet Balance</p>
          </div>
          <p className="text-4xl font-bold">{formatCurrency(profile?.wallet_balance || 0)}</p>
          <p className="text-xs mt-2 opacity-75">Demo Balance - Not Real Money</p>
        </div>
      </div>

      <div className="px-6 -mt-12 pb-6">
        <div className="grid grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setCurrentScreen('pay')}
            className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Pay</span>
          </button>

          <button
            onClick={() => setCurrentScreen('qr')}
            className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
              <QrCode className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">QR</span>
          </button>

          <button
            onClick={() => setCurrentScreen('contacts')}
            className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">Contacts</span>
          </button>

          <button
            onClick={() => setCurrentScreen('history')}
            className="bg-white rounded-2xl p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center gap-2"
          >
            <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center">
              <History className="w-6 h-6 text-orange-600" />
            </div>
            <span className="text-xs font-medium text-gray-700">History</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-900">Recent Transactions</h3>
            <button
              onClick={() => setCurrentScreen('history')}
              className="text-sm text-blue-600 font-medium hover:text-blue-700"
            >
              See All
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No transactions yet</p>
              <button
                onClick={() => setCurrentScreen('pay')}
                className="mt-4 text-blue-600 font-medium text-sm hover:text-blue-700"
              >
                Make your first payment
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition"
                >
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowUpCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{txn.to_name}</p>
                    <p className="text-xs text-gray-500">{formatTimeShort(txn.created_at)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-gray-900">-{formatCurrency(txn.amount)}</p>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {getStatusIcon(txn.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={signOut}
          className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
