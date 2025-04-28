
import { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Pencil, Trash2, EyeOff, Eye, Plus } from "lucide-react";
import { fetchAllProducts, fetchCategories, supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import ProductForm from "./ProductForm";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

const ProductsTable = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 10;
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const productsData = await fetchAllProducts();
        const categoriesData = await fetchCategories();
        
        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les produits",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (product: any) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleActive = async (product: any) => {
    try {
      // Instead of toggling is_active (which doesn't exist), use is_new as a flag
      // Or choose another appropriate property that exists in the product schema
      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update({ is_new: !product.is_new })
        .eq('id', product.id)
        .select()
        .single();

      if (error) throw error;

      setProducts(products.map(p => p.id === product.id ? updatedProduct : p));
      
      toast({
        title: "Succès",
        description: `Produit ${!product.is_new ? "activé" : "désactivé"} avec succès`,
      });
    } catch (error) {
      console.error("Error toggling product status:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut du produit",
        variant: "destructive"
      });
    }
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', selectedProduct.id);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== selectedProduct.id));
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Succès",
        description: "Produit supprimé avec succès",
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le produit",
        variant: "destructive"
      });
    }
  };

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(products.length / productsPerPage);

  const handleSaveProduct = (updatedProducts: any[]) => {
    setProducts(updatedProducts);
    setIsDialogOpen(false);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Liste des produits</h3>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Ajouter un produit
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentProducts.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="h-10 w-10 object-cover rounded"
                  />
                ) : (
                  <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center text-gray-500">
                    Aucune
                  </div>
                )}
              </TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.price.toFixed(2)}€</TableCell>
              <TableCell>
                {categories.find(c => c.id === product.category_id)?.name || "Non catégorisé"}
              </TableCell>
              <TableCell>
                <Badge variant={product.is_new ? "default" : "secondary"}>
                  {product.is_new ? "Actif" : "Désactivé"}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(product)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggleActive(product)}>
                    {product.is_new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(product)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <PaginationItem key={page}>
                <PaginationLink 
                  isActive={currentPage === page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Product Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-screen overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? "Modifier le produit" : "Ajouter un produit"}</DialogTitle>
          </DialogHeader>
          <ProductForm 
            product={selectedProduct} 
            categories={categories} 
            onSave={handleSaveProduct} 
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
          </DialogHeader>
          <p>
            Êtes-vous sûr de vouloir supprimer le produit "{selectedProduct?.name}" ?
            Cette action est irréversible.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsTable;
