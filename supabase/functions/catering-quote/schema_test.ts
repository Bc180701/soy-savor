import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { OWNER_EMAIL, quoteSchema } from "./schema.ts";

const quote = { audience: "private", name: "Test Traiteur", email: "test@example.com", phone: "0600000000", company: "", event_type: "Anniversaire", event_date: "2027-02-14", location: "Châteaurenard", guests: 20, needs: "", website: "" };
Deno.test("Private event quote accepts all requested event details", () => {
  assertEquals(quoteSchema.safeParse(quote).success, true);
});
Deno.test("Business form requires company name", () => {
  assertEquals(quoteSchema.safeParse({ ...quote, audience: "business" }).success, false);
  assertEquals(quoteSchema.safeParse({ ...quote, audience: "business", company: "Entreprise test" }).success, true);
});
Deno.test("Notification destination is the owner supplied address", () => {
  assertEquals(OWNER_EMAIL, "contact@sushieats.fr");
});
Deno.test("Invalid event dates and honeypot entries are rejected", () => {
  assertEquals(quoteSchema.safeParse({ ...quote, event_date: "2027-02-30" }).success, false);
  assertEquals(quoteSchema.safeParse({ ...quote, website: "spam" }).success, false);
});