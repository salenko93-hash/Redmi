import { z } from "zod";
const short = z.string().max(10000);
export const answersSchema = z.object({
  simulationRecords: z
    .array(
      z.object({
        modelVersion: z.literal(1),
        labNumber: z.number().int().min(1).max(10),
        experimentId: z.string().max(80),
        rowIndex: z.number().int().min(0).max(29),
        parameters: z.record(z.string().max(50), z.number().finite()),
        readings: z.record(z.string().max(80), z.string().max(1000)),
        recordedAt: z.iso.datetime(),
      }),
    )
    .max(60)
    .optional(),
  prediction: short.optional(),
  experiments: z
    .record(
      z.string().max(80),
      z.array(z.record(z.string().max(80), z.string().max(1000))).max(30),
    )
    .optional(),
  questions: z.array(short).max(30).optional(),
  conclusion: z.array(short).max(4).optional(),
  creative: short.optional(),
  graphAxes: z
    .record(
      z.string().max(80),
      z.object({ x: z.string().max(50), y: z.string().max(50) }),
    )
    .optional(),
  diagram: z
    .array(
      z.object({
        gravity: z.number().min(0).max(5),
        buoyancy: z.number().min(0).max(5),
        support: z.number().min(0).max(5),
        state: z.string().max(100),
      }),
    )
    .max(3)
    .optional(),
  help: z.boolean().optional(),
  source: short.optional(),
});
export const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(10).max(128),
  name: z.string().trim().min(2).max(100).optional(),
  invite: z.string().max(100).optional(),
});
