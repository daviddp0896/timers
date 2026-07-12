import type { ActivityReportRow } from '@/timers/interfaces/timer.interface';

// Wraps a value in quotes and escapes inner quotes, so commas/newlines are safe.
const escapeCell = (value: string | number): string => {
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

// A computed column of the summary block below the activities (sums, unclassified time).
export interface CsvSummaryColumn {
  label: string;
  minutes: number;
}

// Builds the CSV text for the daily report, laid out horizontally: one column per
// activity, in the order the caller passes them. Row 1 is the category of each
// column, row 2 the activity name, row 3 the minutes. The summary columns go in
// their own block below, separated by a blank line, with the same label/minutes shape.
export const buildActivitiesCsv = (
  rows: ActivityReportRow[],
  summary: CsvSummaryColumn[] = [],
): string => {
  const lines = [
    rows.map((row) => row.category),
    rows.map((row) => row.activity),
    rows.map((row) => row.minutes),
  ];

  if (summary.length > 0) {
    lines.push(
      [],
      summary.map((column) => column.label),
      summary.map((column) => column.minutes),
    );
  }

  return lines
    .map((line) => line.map(escapeCell).join(','))
    .join('\r\n');
};

// Triggers a browser download of the given text as a .csv file.
export const downloadCsv = (filename: string, text: string): void => {
  // Prepend a BOM so Excel opens accented Spanish characters correctly.
  const blob = new Blob(['﻿' + text], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
