import { useState, useEffect } from 'react';
import {
  Wallet,
  Send,
  QrCode,
  Users,
  History,
  Settings,
  ArrowUpCircle,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Search,
  MoreVertical,
  Building2,
  Smartphone,
  Repeat,
  Landmark,
  ScanLine,
  Zap,
  CreditCard,
  Tv,
  Receipt,
  Home as HomeIcon,
  ShoppingBag,
  Shield,
  CircleDollarSign,
  ChevronRight,
  Menu
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatTimeShort } from '../lib/utils';
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

  // --- Sub-Components for Different Providers ---

  const GPayHome = () => (
    <div className="min-h-screen bg-white text-gray-900 pb-20">
      {/* GPay Header */}
      <div className="sticky top-0 bg-white z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex-1 mr-4 bg-white border border-gray-200 rounded-full flex items-center px-4 py-2.5 shadow-sm">
          <Search className="w-5 h-5 text-gray-500 mr-2" />
          <span className="text-gray-500 text-sm font-medium">Pay anyone on Google Pay</span>
        </div>
        <button onClick={() => setCurrentScreen('settings')} className="relative">
          <div className="w-9 h-9 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {profile?.name.charAt(0)}
          </div>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Main Actions */}
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-blue-50 rounded-2xl p-6 flex flex-col items-center justify-center relative overflow-hidden" onClick={() => setCurrentScreen('qr')}>
            <div className="absolute inset-0 bg-[url('https://www.gstatic.com/images/branding/product/2x/google_pay_48dp.png')] bg-no-repeat bg-center opacity-5"></div>
            <ScanLine className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-blue-700 font-semibold">Scan any QR code</span>
          </div>
          
          <div className="flex gap-4">
             <button onClick={() => setCurrentScreen('contacts')} className="flex-1 flex flex-col items-center gap-2 p-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center">Pay contacts</span>
             </button>
             <button onClick={() => setCurrentScreen('pay')} className="flex-1 flex flex-col items-center gap-2 p-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <Smartphone className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center">Pay phone number</span>
             </button>
             <button className="flex-1 flex flex-col items-center gap-2 p-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center">Bank transfer</span>
             </button>
             <button className="flex-1 flex flex-col items-center gap-2 p-2">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                  <Repeat className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center">Self transfer</span>
             </button>
          </div>
        </div>

        {/* People Section */}
        <div>
          <h3 className="text-lg font-normal text-gray-800 mb-4">People</h3>
          <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
            {recentTransactions.map((txn, i) => (
              <div key={i} className="flex flex-col items-center min-w-[64px] gap-1">
                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center text-purple-700 font-bold text-xl border-2 border-white shadow-sm">
                  {txn.to_name.charAt(0)}
                </div>
                <span className="text-xs text-gray-600 truncate w-16 text-center">{txn.to_name.split(' ')[0]}</span>
              </div>
            ))}
            <div onClick={() => setCurrentScreen('contacts')} className="flex flex-col items-center min-w-[64px] gap-1 cursor-pointer">
               <div className="w-14 h-14 border border-gray-300 rounded-full flex items-center justify-center text-blue-600 border-dashed">
                  <User className="w-6 h-6" />
                </div>
                <span className="text-xs text-gray-600">More</span>
            </div>
          </div>
        </div>

        {/* Businesses */}
        <div>
          <h3 className="text-lg font-normal text-gray-800 mb-4">Businesses</h3>
          <div className="grid grid-cols-4 gap-4">
             {['Jio', 'Zomato', 'Uber', 'Swiggy'].map((b, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                   <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-xs">
                      {b.charAt(0)}
                   </div>
                   <span className="text-xs text-gray-500">{b}</span>
                </div>
             ))}
          </div>
        </div>

        {/* Floating Action Button */}
        <div className="fixed bottom-6 right-6">
           <button onClick={() => setCurrentScreen('pay')} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full shadow-lg font-medium flex items-center gap-2 transition-transform hover:scale-105 active:scale-95">
              <Send className="w-4 h-4" />
              New payment
           </button>
        </div>
        
        <div className="text-center mt-8">
           <button onClick={() => alert(`Balance: ${formatCurrency(profile?.wallet_balance || 0)}`)} className="text-blue-600 text-sm font-medium px-4 py-2 border border-gray-200 rounded-full hover:bg-blue-50">
              Check bank balance
           </button>
        </div>
      </div>
    </div>
  );

  const PhonePeHome = () => (
    <div className="min-h-screen bg-[#f1f3f6] pb-20">
      {/* PhonePe Header */}
      <div className="bg-[#6739b7] text-white p-4 pb-12 rounded-b-[2rem]">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 backdrop-blur-sm" onClick={() => setCurrentScreen('settings')}>
              <User className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-medium text-purple-200">Add Address</p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold truncate max-w-[120px]">Bengaluru</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ScanLine onClick={() => setCurrentScreen('qr')} className="w-6 h-6 cursor-pointer" />
            <Menu className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Cards */}
      <div className="px-4 -mt-8 space-y-4">
        
        {/* Ad Banner Mockup */}
        <div className="bg-white rounded-xl shadow-sm p-1 overflow-hidden">
           <div className="bg-gradient-to-r from-pink-500 to-purple-500 h-32 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              Unlock Rewards
           </div>
        </div>

        {/* Transfer Money Section */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-sm font-bold text-gray-800 mb-4">Transfer Money</h3>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => setCurrentScreen('pay')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-[#6739b7] rounded-xl flex items-center justify-center text-white transition-transform group-active:scale-95">
                <User className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">To Mobile<br/>Number</span>
            </button>
            <button onClick={() => setCurrentScreen('pay')} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-[#6739b7] rounded-xl flex items-center justify-center text-white transition-transform group-active:scale-95">
                <Building2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">To Bank/<br/>UPI ID</span>
            </button>
            <button className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-[#6739b7] rounded-xl flex items-center justify-center text-white transition-transform group-active:scale-95">
                <Repeat className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">To Self<br/>Account</span>
            </button>
            <button onClick={() => alert(`Balance: ${formatCurrency(profile?.wallet_balance || 0)}`)} className="flex flex-col items-center gap-2 group">
              <div className="w-12 h-12 bg-[#6739b7] rounded-xl flex items-center justify-center text-white transition-transform group-active:scale-95">
                <Landmark className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-medium text-center leading-tight">Check<br/>Balance</span>
            </button>
          </div>
          
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1 rounded">
                   <div className="text-[10px] font-bold text-blue-700">UPI</div>
                </div>
                <span className="text-xs text-gray-500">UPI ID: {profile?.phone}@ybl</span>
             </div>
             <ChevronRight className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Recharge & Pay Bills */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-sm font-bold text-gray-800">Recharge & Pay Bills</h3>
             <span className="text-xs text-[#6739b7] font-semibold bg-purple-50 px-2 py-1 rounded">My Bills</span>
          </div>
          <div className="grid grid-cols-4 gap-4">
             {[
                { icon: Smartphone, label: 'Mobile Recharge' },
                { icon: Tv, label: 'DTH' },
                { icon: Zap, label: 'Electricity' },
                { icon: CreditCard, label: 'Credit Card Bill' },
                { icon: Building2, label: 'Rent Payment' },
                { icon: ArrowUpCircle, label: 'Loan Repayment' },
                { icon: User, label: 'Book A Cylinder' },
                { icon: MoreVertical, label: 'See All' }
             ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2">
                   <item.icon className="w-6 h-6 text-[#6739b7]" strokeWidth={1.5} />
                   <span className="text-[10px] text-gray-600 text-center truncate w-full">{item.label}</span>
                </div>
             ))}
          </div>
        </div>
      </div>

      {/* PhonePe Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-6 flex justify-between items-center z-50 text-[10px] font-medium text-gray-500">
         <div className="flex flex-col items-center gap-1 text-[#6739b7]">
            <HomeIcon className="w-6 h-6" />
            <span>Home</span>
         </div>
         <div className="flex flex-col items-center gap-1">
            <ShoppingBag className="w-6 h-6" />
            <span>Stores</span>
         </div>
         <div className="flex flex-col items-center gap-1">
            <Shield className="w-6 h-6" />
            <span>Insurance</span>
         </div>
         <div className="flex flex-col items-center gap-1">
            <CircleDollarSign className="w-6 h-6" />
            <span>Wealth</span>
         </div>
         <div className="flex flex-col items-center gap-1 cursor-pointer" onClick={() => setCurrentScreen('history')}>
            <History className="w-6 h-6" />
            <span>History</span>
         </div>
      </div>
    </div>
  );

  const PaytmHome = () => (
    <div className="min-h-screen bg-[#f5f7fa] pb-20 font-sans">
      {/* Paytm Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="w-9 h-9 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-bold border border-blue-100" onClick={() => setCurrentScreen('settings')}>
               {profile?.name.charAt(0)}
               <span className="absolute top-0 right-0 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
               </span>
            </div>
            <div>
               <div className="font-bold text-lg text-gray-800">Paytm</div>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <Search className="w-6 h-6 text-gray-600" />
            <div className="relative">
               <span className="w-2 h-2 bg-red-500 rounded-full absolute top-0 right-0"></span>
               <Menu className="w-6 h-6 text-gray-600" />
            </div>
         </div>
      </div>

      <div className="p-4 space-y-4">
         
         {/* Blue Card Section */}
         <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="grid grid-cols-4 gap-2 mb-2">
               <div onClick={() => setCurrentScreen('qr')} className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                     <ScanLine className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-gray-800 text-center">Scan & Pay</span>
               </div>
               <div onClick={() => setCurrentScreen('pay')} className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                     <Smartphone className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-gray-800 text-center">To Mobile</span>
               </div>
               <div onClick={() => setCurrentScreen('contacts')} className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                     <User className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-gray-800 text-center">To Contacts</span>
               </div>
               <div className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                     <Building2 className="w-7 h-7" />
                  </div>
                  <span className="text-xs font-bold text-gray-800 text-center">To Bank</span>
               </div>
            </div>
         </div>

         {/* My Paytm */}
         <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">My Paytm</h3>
            <div className="grid grid-cols-4 gap-4">
               <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => alert(`Balance: ${formatCurrency(profile?.wallet_balance || 0)}`)}>
                  <Landmark className="w-8 h-8 text-blue-400" />
                  <span className="text-xs font-medium text-gray-700">Balance</span>
               </div>
               <div className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => setCurrentScreen('history')}>
                  <History className="w-8 h-8 text-blue-400" />
                  <span className="text-xs font-medium text-gray-700">History</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Wallet className="w-8 h-8 text-blue-400" />
                  <span className="text-xs font-medium text-gray-700">Wallet</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Settings className="w-8 h-8 text-blue-400" />
                  <span className="text-xs font-medium text-gray-700">Settings</span>
               </div>
            </div>
         </div>

         {/* Recharge & Bill Payments */}
         <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Recharge & Bill Payments</h3>
            <div className="grid grid-cols-4 gap-6">
               <div className="flex flex-col items-center gap-2">
                  <Smartphone className="w-6 h-6 text-cyan-500" />
                  <span className="text-xs text-gray-600 text-center">Mobile Recharge</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Receipt className="w-6 h-6 text-cyan-500" />
                  <span className="text-xs text-gray-600 text-center">Rent Payment</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Tv className="w-6 h-6 text-cyan-500" />
                  <span className="text-xs text-gray-600 text-center">DTH</span>
               </div>
               <div className="flex flex-col items-center gap-2">
                  <Zap className="w-6 h-6 text-cyan-500" />
                  <span className="text-xs text-gray-600 text-center">Electricity</span>
               </div>
            </div>
         </div>
      </div>

      {/* Paytm Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 flex justify-around items-center z-50">
         <div className="flex flex-col items-center gap-1">
            <HomeIcon className="w-6 h-6 text-blue-500 fill-current" />
            <span className="text-[10px] font-bold text-blue-500">Home</span>
         </div>
         <div className="flex flex-col items-center gap-1 opacity-60">
            <ScanLine className="w-6 h-6 text-gray-600" />
            <span className="text-[10px] font-medium text-gray-600">Scan</span>
         </div>
         <div className="flex flex-col items-center gap-1 opacity-60">
            <Landmark className="w-6 h-6 text-gray-600" />
            <span className="text-[10px] font-medium text-gray-600">Bank</span>
         </div>
         <div className="flex flex-col items-center gap-1 opacity-60" onClick={() => setCurrentScreen('history')}>
            <History className="w-6 h-6 text-gray-600" />
            <span className="text-[10px] font-medium text-gray-600">History</span>
         </div>
      </div>
    </div>
  );

  // --- Main Render Logic ---

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

  switch (selectedProvider) {
    case 'GPay':
      return <GPayHome />;
    case 'PhonePe':
      return <PhonePeHome />;
    case 'Paytm':
      return <PaytmHome />;
    default:
      return <GPayHome />;
  }
}