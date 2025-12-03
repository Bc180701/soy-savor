import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Gift, Calendar, Package, Truck, Store, Clock, ImageIcon, Upload } from 'lucide-react';
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

interface TimeSlot {
  time: string;
  max_orders: number;
}

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
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  time_slots: TimeSlot[];
  image_url: string | null;
  banner_title: string | null;
  banner_description: string | null;
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
    delivery_enabled: true,
    pickup_enabled: true,
    time_slots: [] as TimeSlot[],
    image_url: '',
    banner_title: '',
    banner_description: '',
  });
  
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);
  
  const [newTimeSlot, setNewTimeSlot] = useState({ time: '', max_orders: 10 });

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
      // Transform time_slots from Json to TimeSlot[]
      const transformedEvents = (eventsData || []).map(e => ({
        ...e,
        time_slots: (Array.isArray(e.time_slots) ? e.time_slots : []) as unknown as TimeSlot[],
      }));
      setEvents(transformedEvents);

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
      const { time_slots, ...insertData } = formData;
      const { data, error } = await supabase
        .from('special_events')
        .insert({
          ...insertData,
          restaurant_id: selectedRestaurantId,
          time_slots: time_slots as unknown as any,
        })
        .select()
        .single();

      if (error) throw error;

      const transformedData = {
        ...data,
        time_slots: (Array.isArray(data.time_slots) ? data.time_slots : []) as unknown as TimeSlot[],
      };
      setEvents(prev => [transformedData, ...prev]);
      setShowForm(false);
      setFormData({
        name: '',
        slug: '',
        event_date: '',
        preorder_start: '',
        preorder_end: '',
        restrict_menu_on_event: true,
        allowed_categories: DEFAULT_ALLOWED_CATEGORIES,
        delivery_enabled: true,
        pickup_enabled: true,
        time_slots: [],
        image_url: '',
        banner_title: '',
        banner_description: '',
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

  const handleImageUpload = async (file: File, eventId?: string) => {
    const targetId = eventId || 'new';
    setUploadingImage(targetId);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `event-${Date.now()}.${fileExt}`;
      const filePath = `events/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      if (eventId) {
        // Update existing event
        const { error } = await supabase
          .from('special_events')
          .update({ image_url: publicUrl })
          .eq('id', eventId);

        if (error) throw error;

        setEvents(prev => prev.map(e => 
          e.id === eventId ? { ...e, image_url: publicUrl } : e
        ));
        toast({ title: 'Image mise à jour' });
      } else {
        // Update form for new event
        setFormData(prev => ({ ...prev, image_url: publicUrl }));
        toast({ title: 'Image uploadée' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'uploader l\'image',
        variant: 'destructive',
      });
    } finally {
      setUploadingImage(null);
    }
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.delivery_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, delivery_enabled: checked }))}
                />
                <div className="flex items-center gap-1">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <Label>Livraison activée</Label>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.pickup_enabled}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, pickup_enabled: checked }))}
                />
                <div className="flex items-center gap-1">
                  <Store className="h-4 w-4 text-muted-foreground" />
                  <Label>Retrait en magasin activé</Label>
                </div>
              </div>
            </div>

            {/* Bannière d'image */}
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <Label className="font-medium">Bannière de l'événement (page d'accueil)</Label>
              </div>
              
              {formData.image_url ? (
                <div className="space-y-2">
                  <img 
                    src={formData.image_url} 
                    alt="Bannière" 
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  >
                    Supprimer l'image
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    disabled={uploadingImage === 'new'}
                    className="w-full"
                  />
                  {uploadingImage === 'new' && (
                    <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                  )}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Cette image sera affichée en bannière sur la page d'accueil pendant la période de l'événement
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div className="space-y-1">
                  <Label className="text-xs">Titre de la bannière</Label>
                  <Input
                    placeholder="ex: Noël 2025"
                    value={formData.banner_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, banner_title: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Description</Label>
                  <Input
                    placeholder="ex: Précommandez maintenant !"
                    value={formData.banner_description}
                    onChange={(e) => setFormData(prev => ({ ...prev, banner_description: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Gestion des créneaux horaires */}
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <Label className="font-medium">Créneaux horaires spéciaux</Label>
              </div>
              
              <div className="flex gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Heure</Label>
                  <Input
                    type="time"
                    value={newTimeSlot.time}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, time: e.target.value }))}
                    className="w-32"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Max commandes</Label>
                  <Input
                    type="number"
                    value={newTimeSlot.max_orders}
                    onChange={(e) => setNewTimeSlot(prev => ({ ...prev, max_orders: parseInt(e.target.value) || 0 }))}
                    className="w-24"
                    min={1}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newTimeSlot.time) {
                      setFormData(prev => ({
                        ...prev,
                        time_slots: [...prev.time_slots, { ...newTimeSlot }].sort((a, b) => a.time.localeCompare(b.time))
                      }));
                      setNewTimeSlot({ time: '', max_orders: 10 });
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.time_slots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.time_slots.map((slot, idx) => (
                    <Badge 
                      key={idx} 
                      variant="secondary"
                      className="gap-1 cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        time_slots: prev.time_slots.filter((_, i) => i !== idx)
                      }))}
                    >
                      {slot.time} (max {slot.max_orders})
                      <span className="text-xs">×</span>
                    </Badge>
                  ))}
                </div>
              )}
              
              {formData.time_slots.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Aucun créneau spécial défini. Les créneaux habituels du restaurant seront utilisés.
                </p>
              )}
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
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Événement: {format(parseISO(event.event_date), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Précommandes:</span>{' '}
                    {format(parseISO(event.preorder_start), 'dd/MM', { locale: fr })} -{' '}
                    {format(parseISO(event.preorder_end), 'dd/MM', { locale: fr })}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1 ${event.delivery_enabled ? 'text-green-600' : 'text-muted-foreground line-through'}`}>
                      <Truck className="h-4 w-4" />
                      <span>Livraison</span>
                    </div>
                    <div className={`flex items-center gap-1 ${event.pickup_enabled ? 'text-green-600' : 'text-muted-foreground line-through'}`}>
                      <Store className="h-4 w-4" />
                      <span>Retrait</span>
                    </div>
                  </div>
                </div>

                {/* Créneaux horaires */}
                {event.time_slots && event.time_slots.length > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Créneaux:</span>
                    <div className="flex flex-wrap gap-1">
                      {event.time_slots.map((slot, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {slot.time} (max {slot.max_orders})
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bannière image */}
                <div className="border rounded-lg p-3 bg-muted/30">
                  <div className="flex items-center gap-2 mb-2">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Bannière page d'accueil</span>
                  </div>
                  {event.image_url ? (
                    <div className="space-y-2">
                      <img 
                        src={event.image_url} 
                        alt="Bannière" 
                        className="w-full max-w-md h-24 object-cover rounded"
                      />
                      <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(file, event.id);
                            }}
                            disabled={uploadingImage === event.id}
                          />
                          <Button type="button" variant="outline" size="sm" asChild>
                            <span>
                              {uploadingImage === event.id ? (
                                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                              ) : (
                                <>
                                  <Upload className="h-3 w-3 mr-1" />
                                  Changer
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer">
                        <Input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file, event.id);
                          }}
                          disabled={uploadingImage === event.id}
                        />
                        <Button type="button" variant="outline" size="sm" asChild>
                          <span>
                            {uploadingImage === event.id ? (
                              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
                            ) : (
                              <>
                                <Upload className="h-3 w-3 mr-1" />
                                Ajouter une bannière
                              </>
                            )}
                          </span>
                        </Button>
                      </label>
                      <span className="text-xs text-muted-foreground">Aucune bannière définie</span>
                    </div>
                  )}
                  
                  {/* Texte de la bannière */}
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Titre</Label>
                      <Input
                        placeholder={event.name}
                        value={event.banner_title || ''}
                        onChange={async (e) => {
                          const newTitle = e.target.value;
                          await supabase
                            .from('special_events')
                            .update({ banner_title: newTitle || null })
                            .eq('id', event.id);
                          setEvents(prev => prev.map(ev => 
                            ev.id === event.id ? { ...ev, banner_title: newTitle || null } : ev
                          ));
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input
                        placeholder="Précommandez maintenant !"
                        value={event.banner_description || ''}
                        onChange={async (e) => {
                          const newDesc = e.target.value;
                          await supabase
                            .from('special_events')
                            .update({ banner_description: newDesc || null })
                            .eq('id', event.id);
                          setEvents(prev => prev.map(ev => 
                            ev.id === event.id ? { ...ev, banner_description: newDesc || null } : ev
                          ));
                        }}
                      />
                    </div>
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
