import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MenuItem } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface WrapSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectWrap: (wrap: MenuItem) => void;
  wrapBoxItem: MenuItem;
}

export const WrapSelectionModal = ({ 
  isOpen, 
  onClose, 
  onSelectWrap, 
  wrapBoxItem 
}: WrapSelectionModalProps) => {
  const [availableWraps, setAvailableWraps] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWrap, setSelectedWrap] = useState<MenuItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableWraps();
    }
  }, [isOpen]);

  const fetchAvailableWraps = async () => {
    setLoading(true);
    try {
      // Récupérer tous les wraps de la catégorie maki_wrap
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('category_id', 'maki_wrap')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erreur lors de la récupération des wraps:', error);
        return;
      }

      // Convertir les données en MenuItem
      const wraps: MenuItem[] = data.map((wrap: any) => ({
        id: wrap.id,
        name: wrap.name,
        description: wrap.description || '',
        price: wrap.price,
        imageUrl: wrap.image_url,
        category: 'maki_wrap' as any,
        restaurant_id: wrapBoxItem.restaurant_id,
        allergens: wrap.allergens || [],
        isVegetarian: wrap.is_vegetarian || false,
        isSpicy: wrap.is_spicy || false,
        isNew: wrap.is_new || false,
        isBestSeller: wrap.is_best_seller || false,
        isGlutenFree: wrap.is_gluten_free || false,
        pieces: wrap.pieces || null,
        prepTime: wrap.prep_time || null
      }));

      setAvailableWraps(wraps);
    } catch (error) {
      console.error('Erreur lors du chargement des wraps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectWrap = (wrap: MenuItem) => {
    setSelectedWrap(wrap);
  };

  const handleConfirmSelection = () => {
    if (selectedWrap) {
      // Créer un item personnalisé basé sur le wrap sélectionné
      const customWrapItem: MenuItem = {
        ...selectedWrap,
        name: `Wrap Box - ${selectedWrap.name}`,
        description: `Wrap Box contenant: ${selectedWrap.name}`,
        price: wrapBoxItem.price, // Utiliser le prix de la Wrap Box
        category: wrapBoxItem.category
      };
      
      onSelectWrap(customWrapItem);
      onClose();
      setSelectedWrap(null);
    }
  };

  const handleCancel = () => {
    setSelectedWrap(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            🍣 Sélectionnez votre wrap pour la Wrap Box
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Choisissez un des wraps disponibles pour votre Wrap Box
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gold-600" />
            <span className="ml-2">Chargement des wraps...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {availableWraps.map((wrap) => (
              <Card 
                key={wrap.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  selectedWrap?.id === wrap.id 
                    ? 'ring-2 ring-gold-500 bg-gold-50' 
                    : 'hover:border-gold-300'
                }`}
                onClick={() => handleSelectWrap(wrap)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{wrap.name}</CardTitle>
                    <div className="flex gap-1">
                      {wrap.isVegetarian && <Badge variant="secondary" className="text-xs">🌱</Badge>}
                      {wrap.isSpicy && <Badge variant="secondary" className="text-xs">🌶️</Badge>}
                      {wrap.isGlutenFree && <Badge variant="secondary" className="text-xs">🌾</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {wrap.description && (
                    <p className="text-sm text-gray-600 mb-3">{wrap.description}</p>
                  )}
                  
                  {wrap.imageUrl && (
                    <div className="w-full h-32 bg-gray-100 rounded-lg mb-3 overflow-hidden">
                      <img 
                        src={wrap.imageUrl} 
                        alt={wrap.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-500">
                      {wrap.pieces && <span>{wrap.pieces} pièces</span>}
                      {wrap.prepTime && <span className="ml-2">⏱️ {wrap.prepTime}min</span>}
                    </div>
                    {selectedWrap?.id === wrap.id && (
                      <Badge className="bg-gold-500 text-white">
                        ✓ Sélectionné
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {availableWraps.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">Aucun wrap disponible pour le moment.</p>
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={handleCancel}
          >
            Annuler
          </Button>
          <Button 
            onClick={handleConfirmSelection}
            disabled={!selectedWrap}
            className="bg-gold-600 hover:bg-gold-700"
          >
            Confirmer la sélection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
