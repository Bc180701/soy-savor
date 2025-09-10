import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MenuItem } from '@/types';
import { getMenuData } from '@/services/productService';
import { useRestaurantContext } from '@/hooks/useRestaurantContext';

interface DessertSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onDessertSelected: (dessert: MenuItem) => void;
}

export const DessertSelector = ({ 
  isOpen, 
  onClose, 
  onDessertSelected 
}: DessertSelectorProps) => {
  const [desserts, setDesserts] = useState<MenuItem[]>([]);
  const [selectedDessert, setSelectedDessert] = useState<MenuItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { currentRestaurant } = useRestaurantContext();

  useEffect(() => {
    const fetchDesserts = async () => {
      if (!currentRestaurant) return;
      
      setIsLoading(true);
      try {
        const menuData = await getMenuData(currentRestaurant.id);
        console.log("🍰 DEBUG: Categories disponibles:", menuData.map(cat => ({ id: cat.id, name: cat.name })));
        
        // Recherche flexible pour trouver la catégorie desserts
        const dessertCategory = menuData.find(cat => 
          cat.id.toLowerCase().includes('dessert') || 
          cat.name.toLowerCase().includes('dessert')
        );
        
        console.log("🍰 DEBUG: Catégorie desserts trouvée:", dessertCategory?.id, "avec", dessertCategory?.items?.length, "items");
        setDesserts(dessertCategory?.items || []);
      } catch (error) {
        console.error('Erreur lors du chargement des desserts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
      fetchDesserts();
    }
  }, [isOpen, currentRestaurant]);

  const handleDessertSelect = (dessert: MenuItem) => {
    setSelectedDessert(dessert);
  };

  const handleConfirm = () => {
    if (selectedDessert) {
      console.log("🍰 Dessert sélectionné:", selectedDessert.name);
      onDessertSelected(selectedDessert);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedDessert(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl mx-auto max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            🍰 Choisissez votre dessert
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="text-center text-sm text-muted-foreground mb-6">
            Sélectionnez un dessert et recevez une boisson soft offerte !
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-sm text-muted-foreground">Chargement des desserts...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {desserts.map((dessert) => (
                <div
                  key={dessert.id}
                  onClick={() => handleDessertSelect(dessert)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                    selectedDessert?.id === dessert.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {dessert.imageUrl && (
                    <img
                      src={dessert.imageUrl}
                      alt={dessert.name}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />
                  )}
                  <h3 className="font-medium text-sm mb-1">{dessert.name}</h3>
                  {dessert.description && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {dessert.description}
                    </p>
                  )}
                  <div className="text-primary font-semibold text-sm">
                    {dessert.price.toFixed(2)} €
                  </div>
                </div>
              ))}
            </div>
          )}

          {desserts.length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun dessert disponible pour le moment
            </div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Button 
            variant="outline" 
            onClick={handleClose}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedDessert}
            className="flex-1 bg-gradient-to-r from-primary to-primary/80"
          >
            Confirmer la sélection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};