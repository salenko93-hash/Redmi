import type { Client } from "pg";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
export const ACCESS_MIGRATION = "202610280001_access_lifecycle";
export const LEGACY_ACCESS_CHECKSUM =
  "21f9685be8adac7c89ac5d9aee55ef64b513f3f9d8bf91fef0bd40a38ed8a918";
export const CURRENT_ACCESS_CHECKSUM =
  "518c90dc914d3eeaf755a65bc9b5474aace196170167259a0f99d28559b0aa3c";
export const ACCESS_BRIDGE = "202610280002_reconcile_access_lifecycle";
export const ACCESS_BRIDGE_CHECKSUM =
  "5d154c990f5edb072c3d55c53ffa9496f93ce8a96c5efb30ef4bc0d5bd5b3f36";
export function isKnownLegacyAccess(
  name: string,
  stored: string,
  current: string,
) {
  return (
    name === ACCESS_MIGRATION &&
    stored === LEGACY_ACCESS_CHECKSUM &&
    current === CURRENT_ACCESS_CHECKSUM
  );
}
/** Recognize exactly one observed release; never rewrite or generally ignore migration checksums. */
export async function validateLegacyAccess(client: Client, root: string) {
  const bridge = await readFile(
    path.join(root, ACCESS_BRIDGE, "migration.sql"),
    "utf8",
  );
  if (
    createHash("sha256").update(bridge).digest("hex") !== ACCESS_BRIDGE_CHECKSUM
  )
    throw new Error(
      "Access recovery package is incomplete or modified. Restore the published reconciliation migration.",
    );
  const schema = (await client.query("SELECT current_schema() AS name")).rows[0]
    .name;
  if (schema !== "public")
    throw new Error(
      "Legacy access reconciliation requires the application's public schema.",
    );
  const columns = (
    await client.query(
      "SELECT table_name,column_name,data_type FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('User','Membership')",
    )
  ).rows;
  const types = new Map(
    columns.map((c) => [`${c.table_name}.${c.column_name}`, c.data_type]),
  );
  const expected = {
    "User.deletedAt": "timestamp without time zone",
    "Membership.status": "text",
  };
  for (const [column, type] of Object.entries(expected)) {
    if (types.has(column) && types.get(column) !== type)
      throw new Error("Unexpected access column type: " + column);
  }
  const legacy =
    ["timestamp without time zone", "timestamp with time zone"].includes(
      types.get("User.removedAt") ?? "",
    ) &&
    ["timestamp without time zone", "timestamp with time zone"].includes(
      types.get("Membership.removedAt") ?? "",
    ) &&
    types.get("Membership.isActive") === "boolean";
  const completed = await client.query(
    'SELECT checksum FROM "_fizlab_migrations" WHERE name=$1',
    [ACCESS_BRIDGE],
  );
  const normalized =
    Object.keys(expected).every((column) => types.has(column)) &&
    completed.rows[0]?.checksum === ACCESS_BRIDGE_CHECKSUM;
  if (!legacy && !normalized)
    throw new Error(
      "Recorded legacy access migration does not match the observed legacy or reconciled schema. No migration history was changed.",
    );
}
