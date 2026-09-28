import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/hooks/use-cart";
import { MenuItem } from "@/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

const TestPanier = () => {
  const [loading, setLoading] = useState(false);
  const { addItemWithRestaurant, clearCart, items } = useCart();
  const { selectedRestaurant } = useRestaurantContext();
  const navigate = useNavigate();

  const total = items.reduce((t, i) => t + i.menuItem.price * i.quantity, 0);

  const fill = async (lines: number) => {
    const restaurantId = selectedRestaurant?.id;
    if (!restaurantId) {
      toast.error("Choisissez d'abord un restaurant sur la page Commander");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, category_id")
        .eq("restaurant_id", restaurantId)
        .eq("is_hidden", false)
        .gt("price", 0)
        .limit(200);

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error("Aucun produit trouvé pour ce restaurant");
        return;
      }

      clearCart();

      for (let i = 0; i < lines; i++) {
        const p = data[i % data.length];
        const item: MenuItem = {
          id: `${p.id}-test-${i}`,
          name: p.name,
          description: p.description || undefined,
          price: Number(p.price),
          imageUrl: p.image_url || undefined,
          category: (p.category_id as MenuItem["category"]) || "custom",
          restaurant_id: restaurantId,
        };
        addItemWithRestaurant(
          item,
          1,
          restaurantId,
          `Ligne de test n°${i + 1} — options: Base: Lait de vache, Sauce: Soja sucré, Enrobage: Sésame, Topping: Ciboulette, Note: commande de test volumineuse pour vérifier que rien n'est perdu`
        );
      }

      toast.success(`${lines} lignes ajoutées au panier`);
    } catch (e: any) {
      toast.error(e?.message || "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Panier de test volumineux</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Restaurant : {selectedRestaurant?.name || "aucun (choisissez-en un sur Commander)"}
          </p>
          <p className="text-sm">
            Panier actuel : <strong>{items.length}</strong> lignes — <strong>{total.toFixed(2)} €</strong>
          </p>

          <div className="flex flex-wrap gap-2">
            <Button disabled={loading} onClick={() => fill(30)}>30 lignes</Button>
            <Button disabled={loading} onClick={() => fill(60)}>60 lignes</Button>
            <Button disabled={loading} onClick={() => fill(120)}>120 lignes</Button>
            <Button variant="outline" disabled={loading} onClick={() => clearCart()}>
              Vider le panier
            </Button>
          </div>

          <Button className="w-full" variant="secondary" onClick={() => navigate("/panier")}>
            Aller au panier
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestPanier;
