// Types for the daily activity timers (Rule 14).

export interface Activity {
  id: string;
  name: string;
}

export interface CategoryColor {
  bar: string; // solid accent bar / running indicator
  soft: string; // soft tinted background
  text: string; // accent text
  border: string; // accent border
  ring: string; // focus / active ring
}

export interface Category {
  id: string;
  name: string;
  color: CategoryColor;
  activities: Activity[];
}

// One exported row of the CSV report.
export interface ActivityReportRow {
  category: string;
  activity: string;
  minutes: number;
}
