import { useState, useEffect } from 'react';
import { ArrowLeft, Settings, DollarSign, Zap, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { formatCurrency } from '../lib/utils';
import type { SystemSetting } from '../lib/database.types';

interface AdminPanelProps {
  onBack: () => void;
}

export function AdminPanel({ onBack }: AdminPanelProps) {
  const { profile, refreshProfile } = useAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [successRate, setSuccessRate] = useState(0.9);
  const [minDelay, setMinDelay] = useState(2000);
  const [maxDelay, setMaxDelay] = useState(8000);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase.from('system_settings').select('*');
    if (data) {
      setSettings(data);
      data.forEach((setting) => {
        if (setting.setting_key === 'transaction_success_rate') {
          setSuccessRate((setting.setting_value as { value?: number }).value ?? 0.9);
        } else if (setting.setting_key === 'transaction_delay_ms') {
          const value = setting.setting_value as { min?: number; max?: number };
          setMinDelay(value.min ?? 2000);
          setMaxDelay(value.max ?? 8000);
        }
      });
    }
  };

  const updateSetting = async (key: string, value: unknown) => {
    await supabase
      .from('system_settings')
      .update({ setting_value: value })
      .eq('setting_key', key);
  };

  const handleSuccessRateChange = async (rate: number) => {
    setSuccessRate(rate);
    await updateSetting('transaction_success_rate', {
      value: rate,
      description: 'Probability of transaction success (0.0 to 1.0)',
    });
  };

  const handleDelayChange = async () => {
    await updateSetting('transaction_delay_ms', {
      min: minDelay,
      max: maxDelay,
      description: 'Simulated processing delay in milliseconds',
    });
  };

  const handleTopUp = async () => {
    if (!topUpAmount || !profile) return;

    setLoading(true);
    const amount = parseFloat(topUpAmount);
    const newBalance = (profile.wallet_balance || 0) + amount;

    const { error } = await supabase
      .from('user_profiles')
      .update({ wallet_balance: newBalance })
      .eq('id', profile.id);

    if (!error) {
      await refreshProfile();
      setTopUpAmount('');
    }

    setLoading(false);
  };

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear all transaction history? This cannot be undone.')) {
      return;
    }

    await supabase.from('transactions').delete().eq('from_user_id', profile!.id);
    alert('Transaction history cleared');
  };

  const exportData = async () => {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('from_user_id', profile!.id);

    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('owner_user_id', profile!.id);

    const exportData = {
      profile,
      transactions,
      contacts,
      exportedAt: new Date().toISOString(),
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `unified-pay-data-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-5 h-5" />
        <span>Back</span>
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-8 h-8 text-gray-700" />
          <h2 className="text-2xl font-bold text-gray-900">Developer Settings</h2>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-gray-900">Demo Wallet</h3>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Current Balance</p>
            <p className="text-3xl font-bold text-gray-900">{formatCurrency(profile?.wallet_balance || 0)}</p>
          </div>

          <div className="flex gap-3">
            <input
              type="number"
              value={topUpAmount}
              onChange={(e) => setTopUpAmount(e.target.value)}
              placeholder="Amount to add"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              step="0.01"
            />
            <button
              onClick={handleTopUp}
              disabled={loading || !topUpAmount}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Top Up'}
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-3">
            Add demo money to your wallet for testing payments
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-yellow-600" />
            <h3 className="font-bold text-gray-900">Transaction Simulation</h3>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Success Rate: {(successRate * 100).toFixed(0)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={successRate}
                onChange={(e) => handleSuccessRateChange(parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0% (All Fail)</span>
                <span>100% (All Success)</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Processing Delay
              </label>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Min (ms)</label>
                  <input
                    type="number"
                    value={minDelay}
                    onChange={(e) => setMinDelay(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="100"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Max (ms)</label>
                  <input
                    type="number"
                    value={maxDelay}
                    onChange={(e) => setMaxDelay(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    step="100"
                  />
                </div>
              </div>
              <button
                onClick={handleDelayChange}
                className="w-full py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Update Delay Settings
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900">Data Management</h3>
          </div>

          <div className="space-y-3">
            <button
              onClick={exportData}
              className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition"
            >
              <Database className="w-5 h-5" />
              Export All Data (JSON)
            </button>

            <button
              onClick={handleClearHistory}
              className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
            >
              Clear Transaction History
            </button>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm text-amber-900 leading-relaxed">
            These are developer tools for testing the demo application. Changes affect transaction simulation behavior. All transactions remain simulated and no real money is involved.
          </p>
        </div>
      </div>
    </div>
  );
}
