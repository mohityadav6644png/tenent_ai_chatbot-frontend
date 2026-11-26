import { AppProviders } from './app/providers.jsx';
import { AppRouter } from './app/router.jsx';
import { ErrorBoundary } from './shared/components/ErrorBoundary.jsx';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </ErrorBoundary>
  );
}
