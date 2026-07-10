import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { buildActivitiesCsv, downloadCsv } from '@/lib/csv';
import { secondsToWholeMinutes } from '@/lib/time';
import {
  ALL_ACTIVITIES,
  GENERAL_ID,
  GENERAL_REPORT,
} from '@/timers/data/categories.data';
import { useTimersStore } from '@/timers/store/timers.store';
import type { ActivityReportRow } from '@/timers/interfaces/timer.interface';

// Local date as YYYY-MM-DD for the filename.
const todayStamp = (): string => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

export const DownloadCsvButton = () => {
  const handleDownload = () => {
    // Read committed + running time straight from the store at click time.
    const now = Date.now();
    const { elapsedOf } = useTimersStore.getState();

    const rows: ActivityReportRow[] = ALL_ACTIVITIES.map(({ category, activity }) => ({
      category: category.name,
      activity: activity.name,
      minutes: secondsToWholeMinutes(elapsedOf(activity.id, now)),
    }));

    // Append the general "unclassified" time as its own row.
    rows.push({
      category: GENERAL_REPORT.category,
      activity: GENERAL_REPORT.activity,
      minutes: secondsToWholeMinutes(elapsedOf(GENERAL_ID, now)),
    });

    downloadCsv(`actividades-${todayStamp()}.csv`, buildActivitiesCsv(rows));
    toast.success('CSV generado y descargado');
  };

  return (
    <Button size="sm" onClick={handleDownload}>
      <Download className="size-4" />
      Descargar CSV
    </Button>
  );
};
