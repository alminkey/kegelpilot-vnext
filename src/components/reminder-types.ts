// src/components/reminder-types.ts
export type EditorData = {
  id?: string;
  label: string;
  hour: number;
  minute: number;
  enabled: boolean;
  daysOfWeek?: number[]; // 0=ned … 6=sub
};
