
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
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Filter, Pencil, Trash2, EyeOff, Eye, Plus, Search } from "lucide-react";
import { fetchAllProducts, fetchCategories, supabase, deleteProduct } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ProductForm from "./ProductForm";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { useRestaurantContext } from "@/hooks/useRestaurantContext";

const ProductsTable = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [productStatusFilter, setProductStatusFilter] = useState<string>("active"); // "active", "inactive", "all"
  const productsPerPage = 10;
  const { toast } = useToast();
  const { currentRestaurant } = useRestaurantContext();

  useEffect(() => {
    const loadData = async () => {
      if (!currentRestaurant) return;
      
      try {
        setIsLoading(true);
        const productsData = await fetchAllProducts(currentRestaurant.id);
        const categoriesData = await fetchCategories(currentRestaurant.id);
        
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
  }, [toast, currentRestaurant]);

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
    if (!currentRestaurant) return;
    
    try {
      const { data: updatedProduct, error } = await supabase
        .from('products')
        .update({ is_new: !product.is_new })
        .eq('id', product.id)
        .eq('restaurant_id', currentRestaurant.id)
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
    if (!selectedProduct || !currentRestaurant) return;
    
    try {
      setIsLoading(true);
      const success = await deleteProduct(selectedProduct.id, currentRestaurant.id);

      if (!success) {
        throw new Error("La suppression du produit a échoué");
      }

      // Successfully deleted - update local state
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
        description: "Impossible de supprimer le produit. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer et trier les produits par recherche, catégorie et statut
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      
      let matchesStatus = true;
      if (productStatusFilter === "active") {
        matchesStatus = product.is_new === true;
      } else if (productStatusFilter === "inactive") {
        matchesStatus = product.is_new === false;
      }
      // Si productStatusFilter === "all", on affiche tous les produits
      
      return matchesSearch && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      // Trier d'abord par catégorie, puis par prix croissant au sein de chaque catégorie
      const categoryA = categories.find(c => c.id === a.category_id)?.display_order || 999;
      const categoryB = categories.find(c => c.id === b.category_id)?.display_order || 999;
      
      if (categoryA !== categoryB) {
        return categoryA - categoryB;
      }
      
      // Si même catégorie, trier par prix croissant
      return parseFloat(a.price) - parseFloat(b.price);
    });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, productStatusFilter]);

  const handleSaveProduct = (updatedProducts: any[]) => {
    setProducts(updatedProducts);
    setIsDialogOpen(false);
  };

  if (!currentRestaurant) {
    return <div className="flex justify-center p-8"><span>Sélectionnez un restaurant</span></div>;
  }

  if (isLoading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Liste des produits - {currentRestaurant.name}</h3>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Ajouter un produit
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select
            value={categoryFilter}
            onValueChange={setCategoryFilter}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrer par catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les catégories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={productStatusFilter === "active" ? "default" : "outline"}
            size="sm"
            onClick={() => setProductStatusFilter("active")}
          >
            Actifs
          </Button>
          <Button
            variant={productStatusFilter === "inactive" ? "default" : "outline"}
            size="sm"
            onClick={() => setProductStatusFilter("inactive")}
          >
            Désactivés
          </Button>
          <Button
            variant={productStatusFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setProductStatusFilter("all")}
          >
            Tous
          </Button>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Image</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Prix</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Badges</TableHead>
            <TableHead>Temps (min)</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentProducts.length > 0 ? (
            currentProducts.map((product) => (
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
                  <div className="flex gap-1 flex-wrap">
                    {product.is_vegetarian && (
                      <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                        Végétarien
                      </Badge>
                    )}
                    {product.is_spicy && (
                      <Badge variant="outline" className="border-orange-500 text-orange-700 text-xs">
                        Épicé
                      </Badge>
                    )}
                    {product.is_gluten_free && (
                      <Badge variant="glutenfree" className="text-xs">
                        Sans gluten
                      </Badge>
                    )}
                    {product.is_best_seller && (
                      <Badge className="bg-gold-600 text-white text-xs">
                        Best-seller
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{product.prep_time || 10}</TableCell>
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
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                {searchQuery || categoryFilter !== "all" || productStatusFilter !== "all" ? (
                  <div className="text-muted-foreground">Aucun produit ne correspond aux critères de recherche</div>
                ) : (
                  <div className="text-muted-foreground">Aucun produit disponible</div>
                )}
              </TableCell>
            </TableRow>
          )}
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
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete} 
              disabled={isLoading}
            >
              {isLoading ? "Suppression..." : "Supprimer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsTable;
