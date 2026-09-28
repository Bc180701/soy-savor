import { supabase } from "@/integrations/supabase/client";
import { MenuItem } from "@/types";

export interface ReorderResult {
  added: number;
  skipped: string[];
}

const normalize = (value: string) =>
  (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

/**
 * Décode le items_summary d'une commande (formats encodé ou standard)
 */
const decodeSummary = async (summary: any[]): Promise<any[]> => {
  if (!summary || summary.length === 0) return [];

  if (typeof summary[0] === "object" && summary[0] !== null && "n" in summary[0]) {
    const { data, error } = await supabase.rpc("decode_items_summary", {
      encoded_summary: summary as any,
    });
    if (!error && Array.isArray(data)) return data as any[];
    return summary.map((item: any) => ({
      name: item.n,
      price: item.p || 0,
      quantity: item.q || 1,
    }));
  }

  return summary;
};

/**
 * Reconstruit le panier à partir d'une commande passée.
 * Les produits toujours disponibles au menu du restaurant sont rajoutés,
 * les créations personnalisées et articles offerts sont ignorés.
 */
export const rebuildCartFromOrder = async (
  orderId: string,
  addItemWithRestaurant: (
    item: MenuItem,
    quantity: number,
    restaurantId: string,
    specialInstructions?: string
  ) => void,
  clearCart: () => void
): Promise<ReorderResult> => {
  const { data: order, error } = await supabase
    .from("orders")
    .select("items_summary, restaurant_id")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw new Error("Impossible de charger cette commande");
  }

  const restaurantId = order.restaurant_id as string;
  const items = await decodeSummary((order.items_summary as any[]) || []);

  if (items.length === 0) {
    throw new Error("Cette commande ne contient aucun article");
  }

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("id, name, description, price, image_url, category_id, pieces, is_hidden")
    .eq("restaurant_id", restaurantId)
    .eq("is_hidden", false);

  if (productsError) {
    throw new Error("Impossible de charger la carte du restaurant");
  }

  const byName = new Map<string, any>();
  (products || []).forEach((p) => byName.set(normalize(p.name), p));

  clearCart();

  const skipped: string[] = [];
  let added = 0;

  for (const item of items) {
    const name: string = item?.name || "";
    const quantity: number = Number(item?.quantity) || 1;
    const price: number = Number(item?.price) || 0;

    if (!name) continue;

    // Articles offerts / extras gratuits : recalculés automatiquement dans le panier
    if (price === 0) continue;

    const product = byName.get(normalize(name));
    if (!product) {
      skipped.push(name);
      continue;
    }

    const menuItem: MenuItem = {
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: Number(product.price),
      image: product.image_url || "",
      category: product.category_id,
      pieces: product.pieces || undefined,
      restaurant_id: restaurantId,
    } as MenuItem;

    addItemWithRestaurant(menuItem, quantity, restaurantId);
    added += quantity;
  }

  return { added, skipped };
};
