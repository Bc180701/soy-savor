import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Gift, Calendar, Package } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRestaurantContext } from '@/hooks/useRestaurantContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SpecialEvent {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  preorder_start: string;
  preorder_end: string;
  restrict_menu_on_event: boolean;
  allowed_categories: string[] | null;
  is_active: boolean;
  restaurant_id: string;
}

interface EventProduct {
  id: string;
  event_id: string;
  product_id: string;
}

interface Product {
  id: string;
  name: string;
  category_id: string;
}

const DEFAULT_ALLOWED_CATEGORIES = ['desserts', 'boissons'];

export const SpecialEventsManager = () => {
  const { currentRestaurant } = useRestaurantContext();
  const selectedRestaurantId = currentRestaurant?.id || null;
  const { toast } = useToast();
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [eventProducts, setEventProducts] = useState<Record<string, EventProduct[]>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    event_date: '',
    preorder_start: '',
    preorder_end: '',
    restrict_menu_on_event: true,
    allowed_categories: DEFAULT_ALLOWED_CATEGORIES,
  });

  useEffect(() => {
    if (selectedRestaurantId) {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [selectedRestaurantId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch events
      const { data: eventsData, error: eventsError } = await supabase
        .from('special_events')
        .select('*')
        .eq('restaurant_id', selectedRestaurantId)
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Fetch event products for each event
      if (eventsData && eventsData.length > 0) {
        const eventIds = eventsData.map(e => e.id);
        const { data: productsData, error: productsError } = await supabase
          .from('event_products')
          .select('*')
          .in('event_id', eventIds);

        if (!productsError && productsData) {
          const grouped: Record<string, EventProduct[]> = {};
          productsData.forEach(ep => {
            if (!grouped[ep.event_id]) grouped[ep.event_id] = [];
            grouped[ep.event_id].push(ep);
          });
          setEventProducts(grouped);
        }
      }

      // Fetch all products for linking
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('id, name, category_id')
        .eq('restaurant_id', selectedRestaurantId)
        .order('name');

      if (!productsError) {
        setProducts(allProducts || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les événements',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!formData.name || !formData.slug || !formData.event_date || !formData.preorder_start || !formData.preorder_end) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('special_events')
        .insert({
          ...formData,
          restaurant_id: selectedRestaurantId,
        })
        .select()
        .single();

      if (error) throw error;

      setEvents(prev => [data, ...prev]);
      setShowForm(false);
      setFormData({
        name: '',
        slug: '',
        event_date: '',
        preorder_start: '',
        preorder_end: '',
        restrict_menu_on_event: true,
        allowed_categories: DEFAULT_ALLOWED_CATEGORIES,
      });

      toast({
        title: 'Succès',
        description: 'Événement créé avec succès',
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'événement',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (eventId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('special_events')
        .update({ is_active: isActive })
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, is_active: isActive } : e
      ));

      toast({
        title: isActive ? 'Événement activé' : 'Événement désactivé',
      });
    } catch (error) {
      console.error('Error toggling event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

    try {
      const { error } = await supabase
        .from('special_events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(e => e.id !== eventId));
      toast({
        title: 'Événement supprimé',
      });
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleLinkProduct = async (eventId: string, productId: string) => {
    try {
      const { data, error } = await supabase
        .from('event_products')
        .insert({
          event_id: eventId,
          product_id: productId,
        })
        .select()
        .single();

      if (error) throw error;

      setEventProducts(prev => ({
        ...prev,
        [eventId]: [...(prev[eventId] || []), data],
      }));

      toast({
        title: 'Produit lié',
        description: 'Le produit a été ajouté à l\'événement',
      });
    } catch (error: any) {
      if (error.code === '23505') {
        toast({
          title: 'Déjà lié',
          description: 'Ce produit est déjà lié à cet événement',
          variant: 'destructive',
        });
      } else {
        console.error('Error linking product:', error);
      }
    }
  };

  const handleUnlinkProduct = async (eventId: string, eventProductId: string) => {
    try {
      const { error } = await supabase
        .from('event_products')
        .delete()
        .eq('id', eventProductId);

      if (error) throw error;

      setEventProducts(prev => ({
        ...prev,
        [eventId]: (prev[eventId] || []).filter(ep => ep.id !== eventProductId),
      }));

      toast({
        title: 'Produit retiré',
      });
    } catch (error) {
      console.error('Error unlinking product:', error);
    }
  };

  const getProductName = (productId: string) => {
    return products.find(p => p.id === productId)?.name || 'Produit inconnu';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!selectedRestaurantId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Veuillez sélectionner un restaurant dans le menu déroulant en haut à gauche.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Gift className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold">Événements Spéciaux</h2>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel événement
        </Button>
      </div>

      {showForm && (
        <Card className="border-2 border-dashed border-primary/50">
          <CardHeader>
            <CardTitle className="text-lg">Créer un événement</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom de l'événement *</Label>
                <Input
                  placeholder="ex: Noël 2025"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Slug (URL) *</Label>
                <Input
                  placeholder="ex: noel-2025"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Date de l'événement *</Label>
                <Input
                  type="date"
                  value={formData.event_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, event_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Début précommandes *</Label>
                <Input
                  type="date"
                  value={formData.preorder_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, preorder_start: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin précommandes *</Label>
                <Input
                  type="date"
                  value={formData.preorder_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, preorder_end: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.restrict_menu_on_event}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, restrict_menu_on_event: checked }))}
              />
              <Label>Restreindre le menu le jour de l'événement (n'afficher que les produits liés + catégories autorisées)</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateEvent}>Créer l'événement</Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {events.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucun événement spécial créé</p>
            <p className="text-sm">Créez un événement pour permettre les précommandes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id} className={!event.is_active ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-xl">{event.name}</CardTitle>
                  {event.is_active ? (
                    <Badge className="bg-green-500">Actif</Badge>
                  ) : (
                    <Badge variant="secondary">Inactif</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={event.is_active}
                    onCheckedChange={(checked) => handleToggleActive(event.id, checked)}
                  />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Événement: {format(parseISO(event.event_date), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Précommandes:</span>{' '}
                    {format(parseISO(event.preorder_start), 'dd/MM', { locale: fr })} -{' '}
                    {format(parseISO(event.preorder_end), 'dd/MM', { locale: fr })}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="h-4 w-4" />
                    <h4 className="font-medium">Produits liés à l'événement</h4>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    {(eventProducts[event.id] || []).map((ep) => (
                      <Badge 
                        key={ep.id} 
                        variant="secondary"
                        className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleUnlinkProduct(event.id, ep.id)}
                      >
                        {getProductName(ep.product_id)}
                        <span className="text-xs">×</span>
                      </Badge>
                    ))}
                    {(eventProducts[event.id] || []).length === 0 && (
                      <span className="text-sm text-muted-foreground">Aucun produit lié</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Select onValueChange={(productId) => handleLinkProduct(event.id, productId)}>
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Ajouter un produit..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(p => !(eventProducts[event.id] || []).some(ep => ep.product_id === p.id))
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default SpecialEventsManager;
