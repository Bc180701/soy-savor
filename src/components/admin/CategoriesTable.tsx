
import { useState, useEffect } from "react";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { Pencil, Trash2, MoveUp, MoveDown, Plus } from "lucide-react";
import { fetchCategories } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import CategoryForm from "./CategoryForm";
import { supabase } from "@/integrations/supabase/client";

const CategoriesTable = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error loading categories:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les catégories",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  const handleEdit = (category: any) => {
    setSelectedCategory(category);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setSelectedCategory(null);
    setIsDialogOpen(true);
  };

  const handleDelete = (category: any) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;
    
    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', selectedCategory.id);

      if (error) throw error;

      setCategories(categories.filter(c => c.id !== selectedCategory.id));
      setIsDeleteDialogOpen(false);
      
      toast({
        title: "Succès",
        description: "Catégorie supprimée avec succès",
      });
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la catégorie. Vérifiez qu'elle ne contient pas de produits.",
        variant: "destructive"
      });
    }
  };

  const handleSaveCategory = (updatedCategories: any[]) => {
    setCategories(updatedCategories);
    setIsDialogOpen(false);
  };

  const moveCategory = async (category: any, direction: 'up' | 'down') => {
    const index = categories.findIndex(c => c.id === category.id);
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === categories.length - 1)) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const swapCategory = categories[newIndex];
    
    try {
      // Update the first category's order
      const { error: error1 } = await supabase
        .from('categories')
        .update({ display_order: swapCategory.display_order })
        .eq('id', category.id);
        
      if (error1) throw error1;
      
      // Update the second category's order
      const { error: error2 } = await supabase
        .from('categories')
        .update({ display_order: category.display_order })
        .eq('id', swapCategory.id);
        
      if (error2) throw error2;
      
      // Reload categories to get updated order
      const newCategories = await fetchCategories();
      setCategories(newCategories);
      
      toast({
        title: "Succès",
        description: "Ordre des catégories mis à jour",
      });
    } catch (error) {
      console.error("Error reordering categories:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'ordre des catégories",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Liste des catégories</h3>
        <Button onClick={handleAdd} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Ajouter une catégorie
        </Button>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ordre</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Nom</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.display_order}</TableCell>
              <TableCell>{category.id}</TableCell>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.description || "-"}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => moveCategory(category, 'up')}>
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => moveCategory(category, 'down')}>
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleEdit(category)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(category)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Category Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCategory ? "Modifier la catégorie" : "Ajouter une catégorie"}</DialogTitle>
          </DialogHeader>
          <CategoryForm 
            category={selectedCategory} 
            categories={categories} 
            onSave={handleSaveCategory} 
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
            Êtes-vous sûr de vouloir supprimer la catégorie "{selectedCategory?.name}" ?
            Cette action est irréversible et supprimera tous les produits associés.
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

export default CategoriesTable;
