
import { useRef } from "react";
import { MenuCategory, MenuItem } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import CategoryContent from "./CategoryContent";

interface ProductsDisplayProps {
  categories: MenuCategory[];
  onAddToCart: (item: MenuItem) => void;
  categoryRefs?: React.MutableRefObject<{[key: string]: HTMLDivElement | null}>;
}

const ProductsDisplay = ({ categories, onAddToCart, categoryRefs }: ProductsDisplayProps) => {
  const isMobile = useIsMobile();
  const localCategoryRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  
  // Use the provided refs or fallback to local refs
  const refs = categoryRefs || localCategoryRefs;

  if (categories.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">Aucun produit disponible actuellement.</p>
      </div>
    );
  }

  return (
    <div className={isMobile ? "w-full" : "md:w-3/4"}>
      {/* Display all categories at once to allow scrolling */}
      <div className="space-y-12">
        {categories.map((category) => (
          <div 
            key={category.id}
            id={category.id}
            data-category-id={category.id}
            ref={el => refs.current[category.id] = el}
          >
            <CategoryContent 
              category={category} 
              onAddToCart={onAddToCart} 
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductsDisplay;
