
import { MenuCategory } from "@/types";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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
  // État local pour suivre si l'utilisateur fait défiler le carrousel
  const [isDragging, setIsDragging] = useState(false);

  // Détermine l'index actif pour le scroll
  const activeIndex = categories.findIndex(cat => cat.id === activeCategory);
  
  // Référence au conteneur du carrousel
  const [containerElement, setContainerElement] = useState<HTMLDivElement | null>(null);

  // Faire défiler vers la catégorie active lorsqu'elle change
  useEffect(() => {
    if (containerElement && activeIndex >= 0 && !isDragging) {
      const buttons = containerElement.querySelectorAll('button');
      if (buttons[activeIndex]) {
        buttons[activeIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeCategory, activeIndex, containerElement, isDragging]);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4">Catégories</h2>
      <div className="relative">
        <div
          ref={setContainerElement}
          className="flex overflow-x-auto scrollbar-hide py-2 px-1 -mx-1 snap-x scroll-smooth"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
        >
          {categories.map((category) => (
            <div 
              key={category.id}
              className="snap-center px-1 flex-shrink-0"
            >
              <button
                onClick={() => {
                  if (!isDragging) {
                    onCategoryChange(category.id);
                  }
                }}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-md transition-colors",
                  activeCategory === category.id
                    ? "bg-gold-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                )}
              >
                {category.name}
              </button>
            </div>
          ))}
        </div>
        
        {/* Boutons de navigation (visible uniquement sur tablette et desktop) */}
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hidden sm:flex bg-white shadow-md border-gray-200"
          onClick={() => {
            if (activeIndex > 0) {
              onCategoryChange(categories[activeIndex - 1].id);
            }
          }}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Catégorie précédente</span>
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hidden sm:flex bg-white shadow-md border-gray-200"
          onClick={() => {
            if (activeIndex < categories.length - 1) {
              onCategoryChange(categories[activeIndex + 1].id);
            }
          }}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Catégorie suivante</span>
        </Button>
      </div>
    </div>
  );
};

export default MobileCategorySelector;
