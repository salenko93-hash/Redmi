import { test } from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
const helper = new URL("../lib/password-prompt.ts", import.meta.url).href;
function run(source: string, secret: string) {
  return new Promise<string>((resolve, reject) => {
    const child = execFile(
      process.execPath,
      [
        "--import",
        "tsx",
        "--input-type=module",
        "-e",
        `import {readNewPassword} from ${JSON.stringify(helper)};${source}`,
      ],
      { cwd: process.cwd() },
      (error, stdout) => (error ? reject(error) : resolve(stdout.trim())),
    );
    child.stdin!.end(secret);
  });
}
test("password stdin preserves Unicode and spaces, removes one transport newline and does not echo secrets", async () => {
  const value = "  НовийПароль2026!  ";
  const result = await run(
    `const value=await readNewPassword(true);console.log(JSON.stringify({matches:value===${JSON.stringify(value)}}));`,
    value + "\r\n",
  );
  assert.equal(result, '{"matches":true}');
  assert.ok(!result.includes(value));
});
test("password input rejects invalid lengths and multiline values, and an interactive prompt requires a terminal", async () => {
  for (const input of ["short", "x".repeat(129), "ValidPassword2026!\nextra"])
    assert.equal(
      await run(
        "try{await readNewPassword(true)}catch(e){console.log(e.message)}",
        input,
      ),
      "PASSWORD_LENGTH",
    );
  assert.equal(
    await run(
      "try{await readNewPassword(false)}catch(e){console.log(e.message)}",
      "",
    ),
    "PASSWORD_TERMINAL",
  );
});
