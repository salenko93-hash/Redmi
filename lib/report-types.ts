import type { Answers, LabContent } from "./types";

export type ReportMeta = {
  title: string;
  studentName?: string;
  classroom?: string;
};
export type ReportData = {
  meta: ReportMeta;
  number: number;
  content: LabContent;
  answers: Answers;
  status: string;
  experimentMode: string;
  score: number | null;
  feedback: string | null;
  comments: { id: string; field: string; body: string }[];
};
