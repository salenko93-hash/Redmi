import { createInterface } from "node:readline/promises";
import { Writable } from "node:stream";
/** Read secrets locally without shell arguments, environment variables or terminal echo. */
export async function readNewPassword(fromStdin = false): Promise<string> {
  const validate = (value: string) => {
    if (value.length < 10 || value.length > 128 || /[\r\n]/.test(value))
      throw new Error("PASSWORD_LENGTH");
    return value;
  };
  if (fromStdin) {
    process.stdin.setEncoding("utf8");
    let value = "";
    for await (const chunk of process.stdin) {
      value += chunk.toString("utf8");
      if (Buffer.byteLength(value, "utf8") > 1024)
        throw new Error("PASSWORD_LENGTH");
    }
    return validate(value.replace(/\r?\n$/, ""));
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY)
    throw new Error("PASSWORD_TERMINAL");
  console.log("Введення приховано: символи пароля не відображатимуться.");
  let hidden = false;
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!hidden) process.stdout.write(chunk, encoding);
      callback();
    },
  });
  const terminal = createInterface({
    input: process.stdin,
    output,
    terminal: true,
  });
  const controller = new AbortController();
  terminal.on("SIGINT", () => controller.abort());
  const ask = async (prompt: string) => {
    hidden = false;
    const answer = terminal.question(prompt, { signal: controller.signal });
    hidden = true;
    try {
      return await answer;
    } finally {
      hidden = false;
      process.stdout.write("\n");
    }
  };
  try {
    const password = validate(await ask("Новий пароль (10–128 символів): "));
    if (password !== (await ask("Повторіть пароль: ")))
      throw new Error("PASSWORD_MISMATCH");
    return password;
  } catch (error) {
    if (controller.signal.aborted) throw new Error("PASSWORD_CANCELLED");
    throw error;
  } finally {
    hidden = true;
    terminal.close();
    output.end();
  }
}
