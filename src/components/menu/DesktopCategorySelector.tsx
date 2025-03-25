
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
  return (
    <div className="md:w-1/4">
      <div className="sticky top-24">
        <h2 className="text-xl font-bold mb-4">Catégories</h2>
        <ScrollArea className="h-[70vh] pr-4">
          <ul className="space-y-2">
            {categories.map((category) => (
              <li key={category.id}>
                <button
                  onClick={() => onCategoryChange(category.id)}
                  className={`w-full text-left px-4 py-2 rounded-md transition-colors ${
                    activeCategory === category.id
                      ? "bg-akane-600 text-white"
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
