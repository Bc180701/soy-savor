
import React from 'react';

/**
 * Formate les détails d'un produit personnalisé à partir de sa description
 * 
 * @param description La description du produit personnalisé (Sushi Créa ou Poké Créa)
 * @param classNames Classes CSS optionnelles à appliquer au conteneur
 * @returns JSX avec le formatage des détails, ou null si ce n'est pas un produit personnalisé
 */
export const formatCustomProduct = (description: string | undefined, classNames?: string) => {
  if (!description) return null;
  
  // Vérifier si c'est un produit personnalisé
  if (!description.includes('Enrobage:') && !description.includes('Ingrédients:')) {
    return null;
  }
  
  // Extraire les différentes parties
  const parts = description.split(', ');
  
  // Pour les sushis personnalisés
  if (description.includes('Enrobage:')) {
    const enrobage = parts.find(p => p.startsWith('Enrobage:'))?.replace('Enrobage: ', '');
    const base = parts.find(p => p.startsWith('Base:'))?.replace('Base: ', '');
    const garnitures = parts.find(p => p.startsWith('Garnitures:'))?.replace('Garnitures: ', '');
    const topping = parts.find(p => p.startsWith('Topping:'))?.replace('Topping: ', '');
    const sauce = parts.find(p => p.startsWith('Sauce:'))?.replace('Sauce: ', '');
    
    return (
      <div className={`space-y-1 ${classNames || ''}`}>
        {enrobage && <p><span className="font-semibold">Enrobage:</span> {enrobage}</p>}
        {base && <p><span className="font-semibold">Base:</span> {base}</p>}
        {garnitures && <p><span className="font-semibold">Garnitures:</span> {garnitures}</p>}
        {topping && <p><span className="font-semibold">Topping:</span> {topping}</p>}
        {sauce && <p><span className="font-semibold">Sauce:</span> {sauce}</p>}
      </div>
    );
  }
  
  // Pour les pokés personnalisés
  if (description.includes('Ingrédients:')) {
    const ingredients = parts.find(p => p.startsWith('Ingrédients:'))?.replace('Ingrédients: ', '');
    const proteine = parts.find(p => p.startsWith('Protéine:'))?.replace('Protéine: ', '');
    const sauce = parts.find(p => p.startsWith('Sauce:'))?.replace('Sauce: ', '');
    
    return (
      <div className={`space-y-1 ${classNames || ''}`}>
        {ingredients && <p><span className="font-semibold">Ingrédients:</span> {ingredients}</p>}
        {proteine && <p><span className="font-semibold">Protéine:</span> {proteine}</p>}
        {sauce && <p><span className="font-semibold">Sauce:</span> {sauce}</p>}
      </div>
    );
  }
  
  return null;
};
