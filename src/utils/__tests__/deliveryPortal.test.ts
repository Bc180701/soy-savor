import { describe, it, expect } from "vitest";
import { isSessionValid, SESSION_DURATION_MS } from "../deliveryPortal";

describe("delivery session", () => {
  it("dure 5 heures", () => expect(SESSION_DURATION_MS).toBe(5 * 3600 * 1000));
  it("est refusée après expiration", () => {
    const now = Date.now();
    expect(isSessionValid({ token: "t", label: "x", expiresAt: new Date(now - 1000).toISOString() }, now)).toBe(false);
    expect(isSessionValid({ token: "t", label: "x", expiresAt: new Date(now + 1000).toISOString() }, now)).toBe(true);
  });
});
