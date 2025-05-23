
import { useEffect, useRef } from "react";
import { MenuCategory } from "@/types";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DesktopCategorySelectorProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const DesktopCategorySelector = ({
  categories,
  activeCategory,
  onCategoryChange
}: DesktopCategorySelectorProps) => {
  const activeCategoryRef = useRef<HTMLButtonElement | null>(null);

  // Faire défiler le sélecteur de catégories pour montrer la catégorie active
  useEffect(() => {
    if (activeCategoryRef.current) {
      activeCategoryRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, [activeCategory]);

  return (
    <div className="md:w-1/4">
      <div className="sticky top-24">
        <h2 className="text-xl font-bold mb-4">Catégories</h2>
        <ScrollArea className="h-[70vh] pr-4">
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  ref={activeCategory === category.id ? activeCategoryRef : null}
                  onClick={() => onCategoryChange(category.id)}
                  className={`w-full text-left px-4 py-2 rounded-md transition-all duration-300 ${
                    activeCategory === category.id
                      ? "bg-gold-600 text-white font-medium shadow-md"
                      : "hover:bg-gray-100"
                  }`}
                >
                  {category.name}
                </button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
    </div>
  );
};

export default DesktopCategorySelector;
