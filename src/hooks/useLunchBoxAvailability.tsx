import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const LUNCH_END_MINUTES = 14 * 60;
const toMin = (t: string) => {
  const [h, m] = t.split(":").map((x) => parseInt(x, 10));
  return h * 60 + (m || 0);
};

/**
 * Box du Midi disponible uniquement s'il existe aujourd'hui un service ouvert
 * commençant avant 14h, et qu'il est encore avant 14h.
 */
export const useLunchBoxAvailability = (restaurantId?: string) => {
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    if (!restaurantId) return;
    let cancelled = false;

    const check = async () => {
      const now = new Date();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (nowMin >= LUNCH_END_MINUTES) {
        if (!cancelled) setAvailable(false);
        return;
      }
      const y = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      const today = `${y}-${mo}-${d}`;

      const [{ data: hours }, { data: closures }] = await Promise.all([
        supabase
          .from("restaurant_opening_hours")
          .select("is_open, open_time, close_time")
          .eq("restaurant_id", restaurantId)
          .eq("day_of_week", now.getDay()),
        supabase
          .from("restaurant_closures")
          .select("is_all_day")
          .eq("restaurant_id", restaurantId)
          .eq("closure_date", today),
      ]);

      if (closures?.some((c) => c.is_all_day)) {
        if (!cancelled) setAvailable(false);
        return;
      }
      const ok = (hours || []).some(
        (h) => h.is_open && toMin(h.open_time) < LUNCH_END_MINUTES
      );
      if (!cancelled) setAvailable(ok);
    };

    check();
    const id = setInterval(check, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [restaurantId]);

  return available;
};
