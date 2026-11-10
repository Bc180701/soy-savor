- Every checkout click outcome is logged client-side to `checkout_attempts` (outcome + details); check it first when customers report payment failures, since edge logs are short-lived.
- Centralize Offre Gourmande availability in `promotionService` so promotional displays and cart-triggered dialogs enforce identical restaurant/day rules.
- Order details and printing must prioritize the immutable `orders.items_summary` by order ID; any backup fallback must match `cart_backup.order_id`, never email/session, to isolate repeat purchases.
- Store full purchase compositions in checkout drafts and order snapshots; missing historical descriptions may only be enriched from exact lines of that order's Stripe session through an admin-only read-only function, never another cart.

- Delay estimates remain relative to the original booked slot; the authenticated notification function resolves order contacts, confirms delivery-provider acceptance and verifies persistence before reporting success.

- Driver portal (/livraison/:slug) never reads tables directly: it goes through password-session SECURITY DEFINER RPCs (delivery_login/get_orders/update_status) so access is cut as soon as a code is disabled or deleted.
