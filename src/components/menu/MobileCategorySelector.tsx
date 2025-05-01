
import { MenuCategory } from "@/types";
import { useEffect, useState, useRef } from "react";
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
  // Référence au conteneur de défilement
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // État pour suivre si l'utilisateur fait défiler
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Minuterie pour réinitialiser l'état de défilement
  const scrollTimerRef = useRef<number | null>(null);
  
  // Détermine l'index actif pour le scroll
  const activeIndex = categories.findIndex(cat => cat.id === activeCategory);

  // Gestionnaires d'événements pour le défilement
  const handleScrollStart = () => {
    setIsScrolling(true);
    
    // Effacer tout minuteur existant
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
    }
  };
  
  const handleScrollEnd = () => {
    // Utiliser un délai pour éviter les faux "fins de défilement"
    if (scrollTimerRef.current) {
      window.clearTimeout(scrollTimerRef.current);
    }
    
    scrollTimerRef.current = window.setTimeout(() => {
      setIsScrolling(false);
    }, 150) as unknown as number;
  };

  // Faire défiler vers la catégorie active lorsqu'elle change
  useEffect(() => {
    if (scrollContainerRef.current && activeIndex >= 0 && !isScrolling) {
      const buttons = scrollContainerRef.current.querySelectorAll('button');
      if (buttons[activeIndex]) {
        buttons[activeIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }
    }
  }, [activeCategory, activeIndex, isScrolling]);
  
  // Nettoyer les minuteries lors du démontage
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) {
        window.clearTimeout(scrollTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4">Catégories</h2>
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto scrollbar-hide py-2 px-1 -mx-1 snap-x scroll-smooth"
          style={{ 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none'
          }}
          onMouseDown={handleScrollStart}
          onMouseUp={handleScrollEnd}
          onTouchStart={handleScrollStart}
          onTouchEnd={handleScrollEnd}
          onScroll={handleScrollStart}
        >
          {categories.map((category) => (
            <div 
              key={category.id}
              className="snap-center px-1 flex-shrink-0"
            >
              <button
                onClick={() => {
                  onCategoryChange(category.id);
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
