import { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useStore } from '../store/useStore';
import { supabase } from '../lib/supabase';
import { formatCurrency, validateUPIId, validateAmount, getProviderColors } from '../lib/utils';
import type { Contact, Provider } from '../lib/database.types';

interface PaymentFlowProps {
  onBack: () => void;
}

export function PaymentFlow({ onBack }: PaymentFlowProps) {
  const { profile } = useAuth();
  const { selectedProvider } = useStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [step, setStep] = useState<'select' | 'amount' | 'confirm' | 'processing' | 'result'>('select');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [manualUPI, setManualUPI] = useState('');
  const [manualName, setManualName] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [provider] = useState<Provider>(selectedProvider || 'GPay');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string; txnId?: string } | null>(null);

  const colors = getProviderColors(provider);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_user_id', profile.id)
      .order('name');
    if (data) setContacts(data);
  };

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    setStep('amount');
  };

  const handleManualUPI = () => {
    if (!validateUPIId(manualUPI)) {
      setError('Invalid UPI ID format');
      return;
    }
    if (!manualName.trim()) {
      setError('Please enter recipient name');
      return;
    }
    setSelectedContact({
      id: 'manual',
      owner_user_id: profile?.id || '',
      name: manualName,
      upi_id: manualUPI,
      created_at: new Date().toISOString(),
    });
    setStep('amount');
  };

  const handleAmountNext = () => {
    if (!validateAmount(amount)) {
      setError('Please enter a valid amount (max ₹1,00,000)');
      return;
    }
    const amt = parseFloat(amount);
    if (amt > (profile?.wallet_balance || 0)) {
      setError('Insufficient balance');
      return;
    }
    setError('');
    setStep('confirm');
  };

  const handlePayment = async () => {
    if (!selectedContact || !profile) return;

    setStep('processing');
    setError('');

    try {
      const { data: authData } = await supabase.auth.getSession();
      const token = authData.session?.access_token;

      if (!token) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-transaction`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            toUpiId: selectedContact.upi_id,
            toName: selectedContact.name,
            amount: parseFloat(amount),
            provider,
            note: note || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Transaction failed');
      }

      setTimeout(() => {
        setResult({
          success: true,
          message: `Payment of ${formatCurrency(parseFloat(amount))} sent via ${provider} (Demo)`,
          txnId: data.transaction.txn_id,
        });
        setStep('result');
      }, 4000);
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : 'Transaction failed',
      });
      setStep('result');
    }
  };

  const resetFlow = () => {
    setStep('select');
    setSelectedContact(null);
    setManualUPI('');
    setManualName('');
    setAmount('');
    setNote('');
    setError('');
    setResult(null);
  };

  if (step === 'result') {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          {result?.success ? (
            <>
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">{result.message}</p>
              {result.txnId && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                  <p className="font-mono text-sm font-semibold text-gray-900">{result.txnId}</p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-12 h-12 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h3>
              <p className="text-gray-600 mb-6">{result?.message}</p>
            </>
          )}
          <div className="space-y-3">
            <button
              onClick={resetFlow}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:opacity-90 transition"
              style={{ backgroundColor: colors.primary }}
            >
              Make Another Payment
            </button>
            <button onClick={onBack} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition">
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" style={{ color: colors.primary }} />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Processing...</h3>
          <p className="text-gray-600 mb-4">Please wait securely</p>
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button onClick={() => setStep('amount')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Confirm Payment</h2>

          <div className="bg-white rounded-2xl p-6 mb-6 shadow-lg border-t-4" style={{ borderColor: colors.primary }}>
            <p className="text-sm text-gray-500 mb-1">Paying to</p>
            <p className="text-2xl font-bold mb-1">{selectedContact?.name}</p>
            <p className="text-sm text-gray-500 mb-6">{selectedContact?.upi_id}</p>
            <div className="pt-6 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-1">Amount</p>
              <p className="text-4xl font-bold">{formatCurrency(parseFloat(amount))}</p>
            </div>
          </div>

          <button
            onClick={handlePayment}
            className="w-full py-4 text-white rounded-xl font-bold text-lg hover:opacity-90 transition shadow-lg"
            style={{ backgroundColor: colors.primary }}
          >
            Confirm & Pay {formatCurrency(parseFloat(amount))}
          </button>
        </div>
      </div>
    );
  }

  if (step === 'amount') {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button onClick={() => setStep('select')} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Enter Amount</h2>
          <p className="text-gray-600 mb-6">Paying to {selectedContact?.name}</p>

          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-12 pr-4 py-4 text-2xl font-bold border-2 border-gray-200 rounded-xl focus:outline-none"
                  style={{ borderColor: amount ? colors.primary : '#e5e7eb' }}
                  step="0.01"
                  min="0"
                  autoFocus
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Available balance: {formatCurrency(profile?.wallet_balance || 0)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Note (Optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            onClick={handleAmountNext}
            disabled={!amount}
            className="w-full py-4 text-white rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.primary }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Send Money</h2>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
            <input
              type="text"
              value={manualUPI}
              onChange={(e) => setManualUPI(e.target.value)}
              placeholder="username@bank"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Name</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Enter name"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleManualUPI}
            disabled={!manualUPI || !manualName}
            className="w-full py-3 text-white rounded-xl font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: colors.primary }}
          >
            Continue
          </button>
        </div>

        {contacts.length > 0 && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm text-gray-500">Or select from contacts</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            <div className="space-y-2">
              {contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleContactSelect(contact)}
                  className="w-full bg-white rounded-xl p-4 shadow hover:shadow-md transition text-left"
                >
                  <p className="font-semibold text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-500">{contact.upi_id}</p>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}