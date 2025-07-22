
import ProductsTable from "./ProductsTable";
import { useIsMobile } from "@/hooks/use-mobile";

const ProductManager = () => {
  const isMobile = useIsMobile();

  return (
    <div className={`space-y-8 ${isMobile ? 'px-2' : ''}`}>
      {!isMobile && <h2 className="text-2xl font-bold">Gestion des produits</h2>}
      <ProductsTable />
    </div>
  );
};

export default ProductManager;
