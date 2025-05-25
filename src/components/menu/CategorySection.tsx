
import { useRef, useEffect } from "react";
import { MenuCategory } from "@/types";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileCategorySelector from "./MobileCategorySelector";
import DesktopCategorySelector from "./DesktopCategorySelector";

interface CategorySectionProps {
  categories: MenuCategory[];
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  isCategoryChanging: boolean;
  setIsCategoryChanging: (value: boolean) => void;
  setActiveCategory: (categoryId: string) => void;
  setVisibleSections: (sections: {[key: string]: boolean}) => void;
}

const CategorySection = ({
  categories,
  activeCategory,
  onCategoryChange,
  isCategoryChanging,
  setIsCategoryChanging,
  setActiveCategory,
  setVisibleSections
}: CategorySectionProps) => {
  const isMobile = useIsMobile();
  const categoryRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Configuration of the Intersection Observer to detect visible sections
  useEffect(() => {
    if (categories.length === 0) return;
    
    const observerOptions = {
      root: null,
      rootMargin: "-80px 0px -70% 0px", // Adjust to better detect when a category is actually in view
      threshold: [0.05, 0.1, 0.15, 0.2, 0.25, 0.3], // Multiple thresholds for better accuracy
    };
    
    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      const updatedVisibleSections: {[key: string]: {visible: boolean, ratio: number}} = {};
      
      entries.forEach((entry) => {
        const id = entry.target.id;
        // Store both visibility state and intersection ratio
        if (!updatedVisibleSections[id] || entry.intersectionRatio > updatedVisibleSections[id].ratio) {
          updatedVisibleSections[id] = {
            visible: entry.isIntersecting,
            ratio: entry.intersectionRatio
          };
        }
      });
      
      // Update visibleSections state with just the boolean values
      const simplifiedVisibleSections: {[key: string]: boolean} = {};
      Object.keys(updatedVisibleSections).forEach(id => {
        simplifiedVisibleSections[id] = updatedVisibleSections[id].visible;
      });
      
      setVisibleSections(simplifiedVisibleSections);
      
      // Find the most visible category (highest intersection ratio)
      let bestCategoryId = "";
      let highestRatio = -1;
      
      Object.keys(updatedVisibleSections).forEach(id => {
        const section = updatedVisibleSections[id];
        if (section.visible && section.ratio > highestRatio) {
          highestRatio = section.ratio;
          bestCategoryId = id;
        }
      });
      
      // Only update if we found a visible category and we're not in the middle of a manual category change
      if (bestCategoryId && !isCategoryChanging && bestCategoryId !== activeCategory) {
        console.log("Automatically changing to category:", bestCategoryId);
        setActiveCategory(bestCategoryId);
      }
    };
    
    const observer = new IntersectionObserver(observerCallback, observerOptions);
    
    // Observe each category section
    Object.keys(categoryRefs.current).forEach((categoryId) => {
      const el = categoryRefs.current[categoryId];
      if (el) observer.observe(el);
    });
    
    return () => {
      observer.disconnect();
    };
  }, [categories, activeCategory, isCategoryChanging, setActiveCategory, setVisibleSections]);

  // Function to change category and scroll to that section
  const handleCategoryChange = (categoryId: string) => {
    setIsCategoryChanging(true);
    onCategoryChange(categoryId);
    
    // Scroll to the selected category
    const element = categoryRefs.current[categoryId];
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
      
      // Reset the flag after scrolling is complete
      setTimeout(() => {
        setIsCategoryChanging(false);
      }, 1000); // Give enough time for scrolling to complete
    }
  };

  return (
    <>
      {/* Show fixed horizontal scrolling categories on mobile */}
      {isMobile ? (
        <MobileCategorySelector 
          categories={categories} 
          activeCategory={activeCategory} 
          onCategoryChange={handleCategoryChange} 
        />
      ) : (
        /* Show vertical categories sidebar on desktop */
        <div className="md:w-1/4">
          <DesktopCategorySelector 
            categories={categories} 
            activeCategory={activeCategory} 
            onCategoryChange={handleCategoryChange} 
          />
        </div>
      )}
      
      {/* This ref object is exposed so the parent can access it */}
      <div style={{ display: 'none' }} ref={(el) => {
        // Expose categoryRefs to parent through a custom property
        if (el) {
          (el as any).categoryRefs = categoryRefs;
        }
      }} />
    </>
  );
};

export default CategorySection;
export type { CategorySectionProps };
