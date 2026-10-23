import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import type { Socket, AddressInfo } from "node:net";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { databaseConfig } from "../lib/postgres";

test(
  "a stalled PostgreSQL handshake fails within the configured bound",
  { timeout: 9000 },
  async () => {
    const sockets = new Set<Socket>();
    const server = createServer((socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const port = (server.address() as AddressInfo).port;
    const client = new PrismaClient({
      adapter: new PrismaPg(
        databaseConfig(`postgresql://test:test@127.0.0.1:${port}/test`),
      ),
    });
    const start = performance.now();
    try {
      await assert.rejects(() => client.$queryRaw`SELECT 1`);
      assert.ok(
        performance.now() - start < 8000,
        "must not keep a page loading indefinitely",
      );
    } finally {
      await client.$disconnect();
      for (const socket of sockets) socket.destroy();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
);
