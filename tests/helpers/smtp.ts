import { createServer, type TLSSocket } from "node:tls";
import { readFileSync } from "node:fs";
export type CapturedEmail = { to: string; data: string };
/** Loopback-only SMTP fixture. Never relays messages to the internet. */
export async function smtpFixture() {
  const cert = process.env.E2E_SMTP_CERT,
    key = process.env.E2E_SMTP_KEY;
  if (!cert || !key || process.env.SMTP_HOST !== "127.0.0.1")
    throw new Error("Local SMTP test configuration required");
  const messages: CapturedEmail[] = [],
    sockets = new Set<TLSSocket>();
  const server = createServer(
    { cert: readFileSync(cert), key: readFileSync(key) },
    (socket) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
      socket.on("error", () => {});
      socket.setEncoding("utf8");
      socket.write("220 localhost Test SMTP\r\n");
      let buffer = "",
        recipient = "",
        receiving = false,
        body = "";
      socket.on("data", (data) => {
        buffer += data;
        while (buffer.includes("\r\n")) {
          const end = buffer.indexOf("\r\n"),
            line = buffer.slice(0, end);
          buffer = buffer.slice(end + 2);
          if (receiving) {
            if (line === ".") {
              receiving = false;
              messages.push({ to: recipient, data: body });
              body = "";
              if (recipient.includes("uncertain@")) socket.destroy();
              else socket.write("250 queued locally\r\n");
            } else body += line.replace(/^\.\./, ".") + "\r\n";
          } else if (/^EHLO|^HELO/i.test(line))
            socket.write("250-localhost\r\n250 AUTH PLAIN\r\n");
          else if (/^AUTH PLAIN/i.test(line))
            socket.write("235 authenticated\r\n");
          else if (/^MAIL FROM/i.test(line)) socket.write("250 sender ok\r\n");
          else if (/^RCPT TO/i.test(line)) {
            recipient = line.slice(line.indexOf(":") + 1).trim();
            socket.write(
              recipient.includes("reject@")
                ? "550 recipient rejected\r\n"
                : "250 recipient ok\r\n",
            );
          } else if (/^DATA/i.test(line)) {
            receiving = true;
            socket.write("354 end with dot\r\n");
          } else if (/^QUIT/i.test(line)) {
            socket.end("221 goodbye\r\n");
          } else if (/^RSET|^NOOP/i.test(line)) socket.write("250 ok\r\n");
          else socket.write("500 unsupported test command\r\n");
        }
      });
    },
  );
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(Number(process.env.SMTP_PORT), "127.0.0.1", resolve);
  });
  return {
    messages,
    close: () =>
      new Promise<void>((resolve) => {
        sockets.forEach((s) => s.destroy());
        server.close(() => resolve());
      }),
  };
}
