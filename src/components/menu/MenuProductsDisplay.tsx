
import { useRef } from "react";
import { MenuCategory } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import MenuCategoryContent from "./MenuCategoryContent";

interface MenuProductsDisplayProps {
  categories: MenuCategory[];
  categoryRefs?: React.MutableRefObject<{[key: string]: HTMLDivElement | null}>;
}

const MenuProductsDisplay = ({ categories, categoryRefs }: MenuProductsDisplayProps) => {
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
            ref={el => refs.current[category.id] = el}
          >
            <MenuCategoryContent 
              category={category}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default MenuProductsDisplay;
