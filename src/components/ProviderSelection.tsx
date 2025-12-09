import { CreditCard } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { Provider } from '../lib/database.types';

export function ProviderSelection() {
  const { setSelectedProvider } = useStore();

  const providers: Array<{ id: Provider; name: string; gradient: string; description: string }> = [
    {
      id: 'GPay',
      name: 'GPay (Demo)',
      gradient: 'from-blue-500 to-green-500',
      description: 'Google Pay style interface',
    },
    {
      id: 'PhonePe',
      name: 'PhonePe (Demo)',
      gradient: 'from-purple-600 to-purple-700',
      description: 'PhonePe style interface',
    },
    {
      id: 'Paytm',
      name: 'Paytm (Demo)',
      gradient: 'from-cyan-500 to-blue-800',
      description: 'Paytm style interface',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full shadow-lg mb-6">
            <CreditCard className="w-10 h-10 text-gray-700" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Choose Your Demo Provider</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Select which UPI wallet interface you'd like to experience. This is purely visual and doesn't affect functionality.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${provider.gradient} opacity-0 group-hover:opacity-10 rounded-2xl transition-opacity`} />
              <div className={`w-16 h-16 bg-gradient-to-br ${provider.gradient} rounded-xl mx-auto mb-4 flex items-center justify-center shadow-md`}>
                <CreditCard className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{provider.name}</h3>
              <p className="text-sm text-gray-600">{provider.description}</p>
              <div className="mt-6 text-sm font-semibold text-gray-700 group-hover:text-gray-900 transition">
                Select Theme →
              </div>
            </button>
          ))}
        </div>

        <div className="mt-12 p-6 bg-amber-50 border border-amber-200 rounded-xl max-w-2xl mx-auto">
          <p className="text-sm text-amber-900 text-center leading-relaxed">
            This product is a demo and not affiliated with Google Pay, PhonePe, or Paytm.
            Do not use this software for processing real payments. All transactions are simulated.
          </p>
        </div>
      </div>
    </div>
  );
}
