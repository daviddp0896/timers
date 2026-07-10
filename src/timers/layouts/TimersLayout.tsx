import { Link, Outlet } from 'react-router';
import { ResetDayButton } from '@/timers/components/ResetDayButton';
import { DownloadCsvButton } from '@/timers/components/DownloadCsvButton';

// Shared chrome for the whole app: header with title + day controls, then the page.
export const TimersLayout = () => (
  <div className="min-h-screen bg-background">
    <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <span>Timers del día</span>
        </Link>
        <div className="flex items-center gap-2">
          <DownloadCsvButton />
          <ResetDayButton />
        </div>
      </div>
    </header>

    <main className="mx-auto max-w-4xl px-4 py-6">
      <Outlet />
    </main>
  </div>
);
