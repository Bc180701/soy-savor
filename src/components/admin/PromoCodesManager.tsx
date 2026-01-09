import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Edit } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";

interface PromoCode {
  id: string;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  usage_limit: number | null;
  used_count: number;
  created_at: string;
}

const PromoCodesManager = () => {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<PromoCode | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    is_active: true,
    usage_limit: null as number | null
  });

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('promotion_codes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPromoCodes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des codes promo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les codes promo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discount_percentage: 10,
      is_active: true,
      usage_limit: null
    });
    setEditingCode(null);
  };

  const handleEdit = (promoCode: PromoCode) => {
    setEditingCode(promoCode);
    setFormData({
      code: promoCode.code,
      discount_percentage: promoCode.discount_percentage,
      is_active: promoCode.is_active,
      usage_limit: promoCode.usage_limit
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un code promo",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCode) {
        const { error } = await supabase
          .from('promotion_codes')
          .update({
            code: formData.code.toUpperCase(),
            discount_percentage: formData.discount_percentage,
            is_active: formData.is_active,
            usage_limit: formData.usage_limit
          })
          .eq('id', editingCode.id);

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Code promo mis à jour"
        });
      } else {
        const { error } = await supabase
          .from('promotion_codes')
          .insert({
            code: formData.code.toUpperCase(),
            discount_percentage: formData.discount_percentage,
            is_active: formData.is_active,
            usage_limit: formData.usage_limit
          });

        if (error) throw error;

        toast({
          title: "Succès",
          description: "Code promo créé"
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadPromoCodes();
    } catch (error: any) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: error.message?.includes('duplicate') 
          ? "Ce code existe déjà" 
          : "Impossible de sauvegarder le code promo",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce code promo ?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('promotion_codes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Succès",
        description: "Code promo supprimé"
      });
      loadPromoCodes();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le code promo",
        variant: "destructive"
      });
    }
  };

  const toggleActive = async (promoCode: PromoCode) => {
    try {
      const { error } = await supabase
        .from('promotion_codes')
        .update({ is_active: !promoCode.is_active })
        .eq('id', promoCode.id);

      if (error) throw error;
      loadPromoCodes();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="h-8 w-8 rounded-full border-2 border-t-transparent border-gold-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Codes promotionnels</h3>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gold-600 hover:bg-gold-700">
              <Plus className="h-4 w-4 mr-2" />
              Nouveau code
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCode ? 'Modifier le code promo' : 'Créer un code promo'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                  placeholder="Ex: BIENVENUE10"
                  className="uppercase"
                  required
                />
              </div>

              <div>
                <Label htmlFor="discount">Réduction (%)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.discount_percentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_percentage: parseInt(e.target.value) || 0 }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="limit">Limite d'utilisation (vide = illimité)</Label>
                <Input
                  id="limit"
                  type="number"
                  min="1"
                  value={formData.usage_limit || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    usage_limit: e.target.value ? parseInt(e.target.value) : null 
                  }))}
                  placeholder="Illimité"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label>Code actif</Label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-gold-600 hover:bg-gold-700">
                  {editingCode ? 'Mettre à jour' : 'Créer'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {promoCodes.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aucun code promo créé</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Réduction</TableHead>
                  <TableHead>Utilisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoCodes.map((promo) => (
                  <TableRow key={promo.id}>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded font-mono">
                        {promo.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        -{promo.discount_percentage}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {promo.used_count} / {promo.usage_limit || '∞'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={promo.is_active}
                        onCheckedChange={() => toggleActive(promo)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(promo)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(promo.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PromoCodesManager;
