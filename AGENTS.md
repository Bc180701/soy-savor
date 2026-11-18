- Every checkout click outcome is logged client-side to `checkout_attempts` (outcome + details); check it first when customers report payment failures, since edge logs are short-lived.
- Centralize Offre Gourmande availability in `promotionService` so promotional displays and cart-triggered dialogs enforce identical restaurant/day rules.
- Order details and printing must prioritize the immutable `orders.items_summary` by order ID; any backup fallback must match `cart_backup.order_id`, never email/session, to isolate repeat purchases.
- Store full purchase compositions in checkout drafts and order snapshots; missing historical descriptions may only be enriched from exact lines of that order's Stripe session through an admin-only read-only function, never another cart.

- Delay estimates remain relative to the original booked slot; the authenticated notification function resolves order contacts, confirms delivery-provider acceptance and verifies persistence before reporting success.

- Driver portal (/livraison/:slug) never reads tables directly: it goes through password-session SECURITY DEFINER RPCs (delivery_login/get_orders/update_status) so access is cut as soon as a code is disabled or deleted.
- Driver delivery completion uses the shared predicate for both `delivered` and `completed` so admin-finished orders cannot return to the active list.

- Catering quote forms submit through the public validated catering-quote edge function, persist server-side before notifying via the existing Resend provider, and expose stored requests only to admins so notification failures never lose leads.
- Global typography is loaded through hosted font asset pointers and global CSS, with legacy heading utilities mapped to the heading family so existing pages inherit font changes.
- Catering service selections are serialized with project details into the existing `needs` field, keeping the validated quote endpoint and admin/email storage compatible.
- Resolve administrator accounts by server-selected role IDs after verifying super-admin access, so Auth directory pagination and caller-supplied IDs cannot affect the list.
- Self-service admin password changes reauthenticate the current account and use Supabase global sign-out; active admin pages revalidate Auth sessions without treating network errors as revocations.
