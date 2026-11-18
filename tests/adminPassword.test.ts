import { test, expect } from "bun:test";
import { changeOwnAdminPassword, isRevokedAdminSession } from "../src/utils/adminPassword";

const current = "Example-Old-Password!";
const next = "Example-New-Password!";

function authSteps({ currentIsValid = true, passwordUpdated = true, signedOut = true } = {}) {
  const calls: unknown[][] = [];
  return {
    calls,
    async reauthenticate(password: string) {
      calls.push(["verify", password]);
      return currentIsValid;
    },
    async updatePassword(password: string, currentPassword: string) {
      calls.push(["update", password, currentPassword]);
      return passwordUpdated;
    },
    async signOutEverywhere() {
      calls.push(["sign-out-everywhere"]);
      return signedOut;
    },
  };
}

test("requires the current password before changing the account or disconnecting any device", async () => {
  const auth = authSteps({ currentIsValid: false });
  expect(await changeOwnAdminPassword(auth, current, next, next)).toBe("reauthentication-failed");
  expect(auth.calls).toEqual([["verify", current]]);
});

test("after changing the current account password, requests sign-out on every device", async () => {
  const auth = authSteps();
  expect(await changeOwnAdminPassword(auth, current, next, next)).toBe("done");
  expect(auth.calls).toEqual([["verify", current], ["update", next, current], ["sign-out-everywhere"]]);
});

test("does not sign out existing sessions if the password update fails", async () => {
  const auth = authSteps({ passwordUpdated: false });
  expect(await changeOwnAdminPassword(auth, current, next, next)).toBe("update-failed");
  expect(auth.calls).toEqual([["verify", current], ["update", next, current]]);
});

test("reports a failed sign-out separately from a successful password change", async () => {
  const auth = authSteps({ signedOut: false });
  expect(await changeOwnAdminPassword(auth, current, next, next)).toBe("sign-out-failed");
});

test("distinguishes a revoked session from a network or server outage", () => {
  expect(isRevokedAdminSession({ status: 403, code: "session_not_found" })).toBe(true);
  expect(isRevokedAdminSession({ status: 503 })).toBe(false);
  expect(isRevokedAdminSession({ name: "AuthRetryableFetchError" })).toBe(false);
});