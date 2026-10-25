"use client";
import { Printer } from "lucide-react";
export function MaterialPrint() {
  return (
    <button
      type="button"
      className="button secondary no-print"
      onClick={() => window.print()}
    >
      <Printer size={16} /> Надрукувати пам’ятку
    </button>
  );
}
