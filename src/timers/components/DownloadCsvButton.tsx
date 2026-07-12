import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { buildActivitiesCsv, downloadCsv, type CsvSummaryColumn } from '@/lib/csv';
import { secondsToWholeMinutes } from '@/lib/time';
import {
  ALL_ACTIVITIES,
  CATEGORY_BY_ID,
  CSV_ACTIVITY_ORDER,
  EJERCICIO_CATEGORY_ID,
  ESTUDIO_SUM_IDS,
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

const EJERCICIO_IDS =
  CATEGORY_BY_ID.get(EJERCICIO_CATEGORY_ID)?.activities.map((a) => a.id) ?? [];

// Orders the activities as the spreadsheet expects them (CSV_ACTIVITY_ORDER),
// leaving any activity missing from that list at the end so nothing is dropped.
const orderRows = (rows: ActivityReportRow[]): ActivityReportRow[] => {
  const rank = (id: string) => {
    const index = CSV_ACTIVITY_ORDER.indexOf(id);
    return index === -1 ? CSV_ACTIVITY_ORDER.length : index;
  };
  return [...rows].sort((a, b) => rank(a.activityId) - rank(b.activityId));
};

const sumOf = (rows: ActivityReportRow[], ids: string[]): number =>
  rows
    .filter((row) => ids.includes(row.activityId))
    .reduce((sum, row) => sum + row.minutes, 0);

export const DownloadCsvButton = () => {
  const handleDownload = () => {
    // Read committed + running time straight from the store at click time.
    const now = Date.now();
    const { elapsedOf } = useTimersStore.getState();

    const rows: ActivityReportRow[] = orderRows(
      ALL_ACTIVITIES.map(({ category, activity }) => ({
        activityId: activity.id,
        category: category.name,
        activity: activity.name,
        minutes: secondsToWholeMinutes(elapsedOf(activity.id, now)),
      })),
    );

    // The unclassified time is not one of the spreadsheet's activity columns —
    // it goes in the summary block below, together with the totals.
    const unclassified = secondsToWholeMinutes(elapsedOf(GENERAL_ID, now));
    const total = rows.reduce((sum, row) => sum + row.minutes, 0) + unclassified;

    const summary: CsvSummaryColumn[] = [
      { label: GENERAL_REPORT.activity, minutes: unclassified },
      { label: 'Ejercicio', minutes: sumOf(rows, EJERCICIO_IDS) },
      { label: 'Estudio Code + Video', minutes: sumOf(rows, ESTUDIO_SUM_IDS) },
      { label: 'TOTAL', minutes: total },
    ];

    downloadCsv(`actividades-${todayStamp()}.csv`, buildActivitiesCsv(rows, summary));
    toast.success('CSV generado y descargado');
  };

  return (
    <Button size="sm" onClick={handleDownload}>
      <Download className="size-4" />
      Descargar CSV
    </Button>
  );
};
