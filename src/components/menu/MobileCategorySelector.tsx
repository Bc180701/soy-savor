
import { MenuCategory } from "@/types";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

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
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold mb-4">Catégories</h2>
      <Carousel
        opts={{
          align: "start",
          loop: false,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-2">
          {categories.map((category) => (
            <CarouselItem key={category.id} className="pl-2 basis-auto">
              <button
                onClick={() => onCategoryChange(category.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-md transition-colors ${
                  activeCategory === category.id
                    ? "bg-gold-600 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {category.name}
              </button>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex left-0" />
        <CarouselNext className="hidden sm:flex right-0" />
      </Carousel>
    </div>
  );
};

export default MobileCategorySelector;
