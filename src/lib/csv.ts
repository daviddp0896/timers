import type { ActivityReportRow } from '@/timers/interfaces/timer.interface';

// Wraps a value in quotes and escapes inner quotes, so commas/newlines are safe.
const escapeCell = (value: string | number): string => {
  const str = String(value);
  return `"${str.replace(/"/g, '""')}"`;
};

// Builds the CSV text for the daily report: header, one row per activity, TOTAL row.
export const buildActivitiesCsv = (rows: ActivityReportRow[]): string => {
  const header = ['Categoria', 'Actividad', 'Minutos'];
  const total = rows.reduce((sum, row) => sum + row.minutes, 0);

  const lines = [
    header.map(escapeCell).join(','),
    ...rows.map((row) =>
      [row.category, row.activity, row.minutes].map(escapeCell).join(','),
    ),
    ['TOTAL', '', Math.round(total * 10) / 10].map(escapeCell).join(','),
  ];

  return lines.join('\r\n');
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
