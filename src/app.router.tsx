import { createBrowserRouter } from 'react-router';
import { ErrorBoundary } from 'react-error-boundary';
import { TimersLayout } from '@/timers/layouts/TimersLayout';
import { CategoriesPage } from '@/timers/pages/CategoriesPage';
import { CategoryPage } from '@/timers/pages/CategoryPage';

// Fallback shown if a route section crashes while rendering (Rule 28).
const RouteError = ({ resetErrorBoundary }: { resetErrorBoundary: () => void }) => (
  <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
    <p className="text-lg font-medium">Algo salió mal.</p>
    <button
      onClick={resetErrorBoundary}
      className="text-primary underline underline-offset-4"
    >
      Reintentar
    </button>
  </div>
);

export const appRouter = createBrowserRouter([
  {
    path: '/',
    element: (
      <ErrorBoundary FallbackComponent={RouteError}>
        <TimersLayout />
      </ErrorBoundary>
    ),
    children: [
      { index: true, element: <CategoriesPage /> },
      { path: 'category/:categoryId', element: <CategoryPage /> },
    ],
  },
]);
