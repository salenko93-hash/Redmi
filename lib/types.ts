import type { SimulationRecord } from "./simulation";
export type Formula = {
  op: "divide" | "multiply" | "subtract" | "sum" | "hydro";
  args: string[];
  factor?: number;
};
export type Field = {
  key: string;
  label: string;
  unit?: string;
  type?: "number" | "text";
  calculated?: Formula;
  positive?: boolean;
  integer?: boolean;
};
export type Experiment = {
  id: string;
  title: string;
  instructions: string[];
  rows: string[];
  fields: Field[];
  defaults?: Record<string, string>[];
  graph?: { x: string; y: string };
};
export type LabContent = {
  purpose: string;
  equipment: string[];
  theory: string;
  notes: string[];
  experiments: Experiment[];
  questions: string[];
  creative: string;
  prediction: string;
  diagram?: boolean;
  image?: string;
};
export type Answers = {
  simulationRecords?: SimulationRecord[];
  prediction?: string;
  experiments?: Record<string, Record<string, string>[]>;
  questions?: string[];
  conclusion?: string[];
  creative?: string;
  graphAxes?: Record<string, { x: string; y: string }>;
  diagram?: {
    gravity: number;
    buoyancy: number;
    support: number;
    state: string;
  }[];
  help?: boolean;
  source?: string;
};
export type LabDefinition = {
  number: number;
  title: string;
  category: string;
  minutes: number;
  icon: string;
  content: LabContent;
};
