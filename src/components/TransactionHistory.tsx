import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Filter,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpCircle,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDateTime, exportToCSV, exportToJSON } from '../lib/utils';
import type { Transaction, Provider, TransactionStatus } from '../lib/database.types';

interface TransactionHistoryProps {
  onBack: () => void;
}

type FilterType = 'all' | 'success' | 'failed' | 'pending';

export function TransactionHistory({ onBack }: TransactionHistoryProps) {
  const { profile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [providerFilter, setProviderFilter] = useState<Provider | 'all'>('all');
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);

  useEffect(() => {
    loadTransactions();
  }, [profile?.id]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filter, providerFilter]);

  const loadTransactions = async () => {
    if (!profile?.id) return;
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('from_user_id', profile.id)
      .order('created_at', { ascending: false });

    if (data) setTransactions(data);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filter !== 'all') {
      const statusMap = {
        success: 'SUCCESS',
        failed: 'FAILED',
        pending: ['PENDING', 'PROCESSING'],
      };
      const statuses = statusMap[filter];
      filtered = filtered.filter((txn) =>
        Array.isArray(statuses) ? statuses.includes(txn.status) : txn.status === statuses
      );
    }

    if (providerFilter !== 'all') {
      filtered = filtered.filter((txn) => txn.provider === providerFilter);
    }

    setFilteredTransactions(filtered);
  };

  const getStatusBadge = (status: TransactionStatus) => {
    const styles = {
      SUCCESS: 'bg-green-100 text-green-700',
      FAILED: 'bg-red-100 text-red-700',
      PROCESSING: 'bg-yellow-100 text-yellow-700',
      PENDING: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status]}`}>
        {status}
      </span>
    );
  };

  const handleExportCSV = () => {
    const csvData = filteredTransactions.map((txn) => ({
      'Transaction ID': txn.txn_id,
      'Date': txn.created_at,
      'To': txn.to_name,
      'UPI ID': txn.to_upi_id,
      'Amount': txn.amount,
      'Provider': txn.provider,
      'Status': txn.status,
      'Note': txn.note || '',
      'Balance Before': txn.balance_before,
      'Balance After': txn.balance_after || '',
    }));
    exportToCSV(csvData, `transactions-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleExportJSON = () => {
    exportToJSON(filteredTransactions, `transactions-${new Date().toISOString().slice(0, 10)}.json`);
  };

  if (selectedTxn) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <button
          onClick={() => setSelectedTxn(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-4">
            <div className="text-center mb-6">
              {selectedTxn.status === 'SUCCESS' ? (
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
              ) : selectedTxn.status === 'FAILED' ? (
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-3" />
              ) : (
                <Clock className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
              )}
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {formatCurrency(selectedTxn.amount)}
              </h3>
              {getStatusBadge(selectedTxn.status)}
            </div>

            <div className="space-y-4 pt-6 border-t border-gray-200">
              <div>
                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                <p className="font-mono text-sm font-semibold text-gray-900">{selectedTxn.txn_id}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">To</p>
                <p className="font-semibold text-gray-900">{selectedTxn.to_name}</p>
                <p className="text-sm text-gray-600">{selectedTxn.to_upi_id}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Provider</p>
                <p className="text-sm font-medium text-gray-900">{selectedTxn.provider} (Demo)</p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Date & Time</p>
                <p className="text-sm text-gray-900">{formatDateTime(selectedTxn.created_at)}</p>
              </div>

              {selectedTxn.note && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Note</p>
                  <p className="text-sm text-gray-900">{selectedTxn.note}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Balance Before</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatCurrency(selectedTxn.balance_before)}
                  </p>
                </div>
                {selectedTxn.balance_after !== null && (
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Balance After</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(selectedTxn.balance_after)}
                    </p>
                  </div>
                )}
              </div>

              {selectedTxn.failure_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs text-red-600 mb-1">Failure Reason</p>
                  <p className="text-sm text-red-900">{selectedTxn.failure_reason}</p>
                </div>
              )}

              {selectedTxn.metadata?.bank_ref && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Bank Reference</p>
                  <p className="font-mono text-xs text-gray-700">{selectedTxn.metadata.bank_ref as string}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-xs text-yellow-800">
            This is a demo transaction. No real money was transferred.
          </div>
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

      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Transaction History</h2>
          <div className="flex gap-2">
            <button
              onClick={handleExportCSV}
              className="p-2 bg-white hover:bg-gray-50 rounded-lg shadow transition"
              title="Export as CSV"
            >
              <Download className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={handleExportJSON}
              className="px-3 py-2 bg-white hover:bg-gray-50 rounded-lg shadow text-xs font-medium text-gray-700 transition"
            >
              JSON
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-5 h-5 text-gray-600" />
            <span className="font-semibold text-gray-900">Filters</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending/Processing</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Provider</label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value as Provider | 'all')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                <option value="GPay">GPay</option>
                <option value="PhonePe">PhonePe</option>
                <option value="Paytm">Paytm</option>
              </select>
            </div>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <ArrowUpCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No transactions found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions.map((txn) => (
              <button
                key={txn.id}
                onClick={() => setSelectedTxn(txn)}
                className="w-full bg-white rounded-xl p-4 shadow hover:shadow-md transition text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                    <ArrowUpCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-gray-900">{txn.to_name}</p>
                        <p className="text-xs text-gray-500">{txn.txn_id}</p>
                      </div>
                      <p className="font-bold text-gray-900">-{formatCurrency(txn.amount)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">{formatDateTime(txn.created_at)}</p>
                      {getStatusBadge(txn.status)}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
