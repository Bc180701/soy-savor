import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCustomProduct } from "@/utils/formatCustomProduct";

interface DecodedItemsListProps {
  items: any[];
}

interface DecodedItem {
  name: string;
  price: number;
  quantity: number;
  description?: string;
  special_instructions?: string;
}

export const DecodedItemsList = ({ items }: DecodedItemsListProps) => {
  const [decodedItems, setDecodedItems] = useState<DecodedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const decodeItems = async () => {
      try {
        // Vérifier si les items sont déjà au format décodé (avec des noms complets)
        const firstItem = items[0];
        if (firstItem && firstItem.name && firstItem.name.length > 5 && !('n' in firstItem)) {
          // Les items semblent déjà décodés
          setDecodedItems(items.map(item => ({
            name: item.name,
            price: item.price || 0,
            quantity: item.quantity || 1,
            description: item.description,
            special_instructions: item.special_instructions
          })));
          setLoading(false);
          return;
        }

        // Sinon, décoder depuis la base de données
        if (items.length > 0 && typeof items[0] === 'object' && 'n' in items[0]) {
          // Format encodé avec codes lettres
          const { data, error } = await supabase
            .rpc('decode_items_summary', {
              encoded_summary: items
            });

          if (error) {
            console.error('Erreur décodage:', error);
            // Fallback : utiliser les codes comme noms
            setDecodedItems(items.map((item: any) => ({
              name: item.n || 'Produit inconnu',
              price: (item.p || 0) / 100, // Convertir centimes en euros
              quantity: item.q || 1
            })));
          } else {
            // Convertir les données décodées au bon format
            const decodedData = Array.isArray(data) ? data.map((item: any) => ({
              name: item.name || 'Produit inconnu',
              price: item.price || 0,
              quantity: item.quantity || 1,
              description: item.description,
              special_instructions: item.special_instructions
            })) : [];
            setDecodedItems(decodedData);
          }
        } else {
          // Format déjà standard
          setDecodedItems(items);
        }
      } catch (error) {
        console.error('Erreur lors du décodage des items:', error);
        setDecodedItems(items);
      } finally {
        setLoading(false);
      }
    };

    if (items && items.length > 0) {
      decodeItems();
    } else {
      setLoading(false);
    }
  }, [items]);

  if (loading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Décodage des produits...
      </div>
    );
  }

  if (!decodedItems || decodedItems.length === 0) {
    return (
      <div className="p-3 text-center text-muted-foreground">
        Aucun produit trouvé
      </div>
    );
  }

  return (
    <>
      {decodedItems.map((item: DecodedItem, index: number) => (
        <div key={index} className="p-4 flex justify-between">
          <div className="flex-1">
            <div className="font-medium text-lg">
              {item.name}
            </div>
            {formatCustomProduct(item.description, "text-sm text-muted-foreground mt-1")}
            {item.special_instructions && (
              <div className="text-sm text-muted-foreground italic mt-1">
                "{item.special_instructions}"
              </div>
            )}
          </div>
          <div className="text-right min-w-[100px]">
            <div className="text-base">{item.quantity} x {(item.price || 0).toFixed(2)} €</div>
            <div className="font-semibold text-lg">
              {((item.quantity || 1) * (item.price || 0)).toFixed(2)} €
            </div>
          </div>
        </div>
      ))}
    </>
  );
};