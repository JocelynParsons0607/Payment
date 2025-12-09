import { useAuth, AuthProvider } from './hooks/useAuth';
import { useStore } from './store/useStore';
import { Auth } from './components/Auth';
import { ProviderSelection } from './components/ProviderSelection';
import { Home } from './components/Home';

function AppContent() {
  const { user, loading } = useAuth();
  const { selectedProvider } = useStore();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!selectedProvider) {
    return <ProviderSelection />;
  }

  return <Home />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
