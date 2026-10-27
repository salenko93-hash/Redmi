import { test } from "node:test";
import assert from "node:assert/strict";
import {
  invitationMailConfig,
  invitationMessage,
  definiteMailFailure,
} from "../lib/invitation-email";
const config = {
  SMTP_USER: "teacher@example.com",
  SMTP_PASSWORD: "app-password",
  APP_URL: "https://fizlab.example.com",
};
test("Gmail configuration requires credentials, verified TLS and a public HTTPS invitation URL", () => {
  assert.equal(invitationMailConfig({}), null);
  for (const APP_URL of [
    "http://localhost:3000",
    "https://127.0.0.1",
    "https://school.local",
    "https://user:secret@example.com",
    "https://example.com/?token=secret",
    "https://example.com/#fragment",
    "http://example.com",
    "https://example.com/subpath",
  ])
    assert.equal(invitationMailConfig({ ...config, APP_URL }), null, APP_URL);
  assert.equal(
    invitationMailConfig({
      ...config,
      SMTP_FROM: "bad\r\nBcc:other@example.com",
    }),
    null,
  );
  assert.equal(invitationMailConfig({ ...config, SMTP_PORT: "NaN" }), null);
  assert.equal(invitationMailConfig({ ...config, SMTP_SECURE: "no" }), null);
  const parsed = invitationMailConfig(config)!;
  assert.equal(parsed.host, "smtp.gmail.com");
  assert.equal(parsed.port, 465);
  assert.equal(parsed.secure, true);
  assert.equal(parsed.from, config.SMTP_USER);
  assert.equal(
    invitationMailConfig({
      ...config,
      APP_URL: "http://localhost:3000",
      PUBLIC_APP_URL: "https://fizlab.example.com",
    })?.url,
    "https://fizlab.example.com",
  );
});
test("invitation email has an individual code, explicit email-bound registration instructions and escaped user content", () => {
  const message = invitationMessage({
    name: '<img src=x onerror="alert(1)">',
    classroom: "7-А\r\nBcc: other@example.com",
    teacher: "Учитель & клас",
    email: "pupil@example.com",
    code: "S1234567890ABCDEF",
    url: "https://fizlab.example.com",
  });
  assert.ok(message.text.includes("S1234567890ABCDEF"));
  assert.ok(message.text.includes("pupil@example.com"));
  assert.ok(message.text.includes("Мій клас"));
  assert.ok(message.text.includes("Це не пароль"));
  assert.ok(!message.html.includes("<img"));
  assert.ok(message.html.includes("&lt;img"));
  assert.ok(message.html.includes("Учитель &amp; клас"));
  assert.ok(!/[\r\n]/.test(message.subject));
  assert.ok(!message.html.includes("?code="));
});
test("SMTP rejection is retryable but a missing acknowledgement does not claim definite failure or delivery", () => {
  assert.equal(definiteMailFailure({ responseCode: 550 }), true);
  assert.equal(definiteMailFailure({ code: "EAUTH" }), true);
  assert.equal(definiteMailFailure({ code: "ECONNECTION" }), false);
  assert.equal(definiteMailFailure({ code: "EDNS" }), true);
  assert.equal(
    definiteMailFailure({ code: "ETIMEDOUT", command: "DATA" }),
    false,
  );
  assert.equal(definiteMailFailure(new Error("socket closed")), false);
});
