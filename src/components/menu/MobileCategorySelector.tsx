
import { useRef, useEffect } from "react";
import { MenuCategory } from "@/types";

interface MobileCategorySelectorProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const MobileCategorySelector = ({
  categories,
  activeCategory,
  onCategoryChange
}: MobileCategorySelectorProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeCategoryRef = useRef<HTMLButtonElement>(null);

  // Scroll to show the active category
  useEffect(() => {
    if (activeCategoryRef.current && scrollContainerRef.current) {
      // Calculate scroll position to center the active element
      const container = scrollContainerRef.current;
      const activeButton = activeCategoryRef.current;
      const containerWidth = container.offsetWidth;
      const buttonLeft = activeButton.offsetLeft;
      const buttonWidth = activeButton.offsetWidth;
      
      // Center the button in the container
      const scrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: scrollLeft,
        behavior: "smooth"
      });
    }
  }, [activeCategory]);

  return (
    <div className="mb-6 pb-2 border-b border-gray-200">
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-2 scrollbar-hide snap-x"
      >
        {categories.map((category) => (
          <button
            key={category.id}
            ref={category.id === activeCategory ? activeCategoryRef : null}
            onClick={() => onCategoryChange(category.id)}
            className={`whitespace-nowrap px-4 py-2 mx-1 rounded-full transition-all duration-300 snap-center flex-shrink-0 ${
              category.id === activeCategory
                ? "bg-gold-600 text-white font-medium shadow-md"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MobileCategorySelector;
