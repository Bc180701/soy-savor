
import { MenuCategory, MenuItem } from "@/types";
import CategoryDetails from "./CategoryDetails";
import MenuItemCard from "./MenuItemCard";

interface CategoryContentProps {
  category: MenuCategory;
  onAddToCart: (item: MenuItem) => void;
}

const CategoryContent = ({ category, onAddToCart }: CategoryContentProps) => {
  return (
    <div>
      <CategoryDetails category={category} />
      
      {category.items.length === 0 ? (
        <p className="text-gray-500 italic text-center py-8">
          Aucun produit disponible dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {category.items.map((item) => (
            <MenuItemCard key={item.id} item={item} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryContent;
