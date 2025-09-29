import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, FileSpreadsheet } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useRestaurantContext } from '@/hooks/useRestaurantContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/types';

interface OrdersCSVExportProps {
  className?: string;
}

const OrdersCSVExport: React.FC<OrdersCSVExportProps> = ({ className }) => {
  const [dateFrom, setDateFrom] = useState<Date | undefined>(new Date());
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [isExporting, setIsExporting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState<'from' | 'to' | null>(null);
  
  const { currentRestaurant } = useRestaurantContext();
  const { toast } = useToast();

  // Fonction pour convertir les données en CSV
  const convertToCSV = (orders: Order[]): string => {
    if (orders.length === 0) {
      return 'Aucune commande trouvée pour la période sélectionnée';
    }

    // En-têtes du CSV
    const headers = [
      'ID Commande',
      'Date de création',
      'Date de livraison/retrait',
      'Nom du client',
      'Téléphone',
      'Email',
      'Type de commande',
      'Statut',
      'Statut de paiement',
      'Sous-total (€)',
      'Taxes (€)',
      'Frais de livraison (€)',
      'Pourboire (€)',
      'Remise (€)',
      'Code promo',
      'Total (€)',
      'Méthode de paiement',
      'Instructions de livraison',
      'Notes client',
      'Allergies',
      'Adresse de livraison',
      'Ville',
      'Code postal',
      'Articles commandés'
    ];

    // Conversion des commandes en lignes CSV
    const rows = orders.map(order => {
      // Formater les articles commandés
      const itemsText = order.items?.map(item => 
        `${item.quantity}x ${item.menuItem.name} (${item.menuItem.price}€)`
      ).join('; ') || 'Aucun article';

      // Formater l'adresse de livraison
      const deliveryAddress = order.deliveryStreet && order.deliveryCity && order.deliveryPostalCode
        ? `${order.deliveryStreet}, ${order.deliveryCity} ${order.deliveryPostalCode}`
        : 'N/A';

      return [
        order.id,
        format(order.createdAt, 'dd/MM/yyyy HH:mm', { locale: fr }),
        format(order.scheduledFor, 'dd/MM/yyyy HH:mm', { locale: fr }),
        order.clientName || 'N/A',
        order.clientPhone || 'N/A',
        order.clientEmail || 'N/A',
        order.orderType === 'delivery' ? 'Livraison' : 
        order.orderType === 'pickup' ? 'Retrait' : 'Sur place',
        order.status === 'pending' ? 'En attente' :
        order.status === 'confirmed' ? 'Confirmée' :
        order.status === 'preparing' ? 'En préparation' :
        order.status === 'ready' ? 'Prête' :
        order.status === 'out-for-delivery' ? 'En livraison' :
        order.status === 'delivered' ? 'Livrée' :
        order.status === 'completed' ? 'Terminée' :
        order.status === 'cancelled' ? 'Annulée' : order.status,
        order.paymentStatus === 'paid' ? 'Payé' :
        order.paymentStatus === 'pending' ? 'En attente' :
        order.paymentStatus === 'failed' ? 'Échec' : order.paymentStatus,
        order.subtotal.toFixed(2),
        order.tax.toFixed(2),
        order.deliveryFee.toFixed(2),
        order.tip?.toFixed(2) || '0.00',
        order.discount?.toFixed(2) || '0.00',
        order.promoCode || 'N/A',
        order.total.toFixed(2),
        order.paymentMethod === 'credit-card' ? 'Carte bancaire' : order.paymentMethod,
        order.deliveryInstructions || 'N/A',
        order.customerNotes || 'N/A',
        order.allergies?.join(', ') || 'N/A',
        deliveryAddress,
        order.deliveryCity || 'N/A',
        order.deliveryPostalCode || 'N/A',
        itemsText
      ];
    });

    // Combiner les en-têtes et les lignes
    const csvContent = [headers, ...rows]
      .map(row => 
        row.map(field => 
          // Échapper les guillemets et entourer de guillemets si nécessaire
          typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
            ? `"${field.replace(/"/g, '""')}"`
            : field
        ).join(',')
      )
      .join('\n');

    return csvContent;
  };

  // Fonction pour télécharger le fichier CSV
  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Fonction principale d'export
  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une période valide",
        variant: "destructive",
      });
      return;
    }

    if (dateFrom > dateTo) {
      toast({
        title: "Erreur",
        description: "La date de début doit être antérieure à la date de fin",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);

    try {
      // Ajuster les dates pour inclure toute la journée
      const startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);

      console.log('📊 Export CSV - Période:', {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
        restaurant: currentRestaurant?.name
      });

      // Construire la requête
      let query = supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            menu_item_id,
            menu_item_name,
            menu_item_price,
            special_instructions
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      // Filtrer par restaurant si sélectionné
      if (currentRestaurant?.id) {
        query = query.eq('restaurant_id', currentRestaurant.id);
      }

      const { data: ordersData, error } = await query;

      if (error) {
        throw error;
      }

      if (!ordersData || ordersData.length === 0) {
        toast({
          title: "Aucune commande",
          description: "Aucune commande trouvée pour la période sélectionnée",
        });
        return;
      }

      // Convertir les données de la base en format Order
      const orders: Order[] = ordersData.map(order => ({
        id: order.id,
        userId: order.user_id,
        restaurant_id: order.restaurant_id,
        items: order.order_items?.map((item: any) => ({
          menuItem: {
            id: item.menu_item_id,
            name: item.menu_item_name,
            price: item.menu_item_price,
            category: 'Sushi' as const,
            description: '',
            imageUrl: '',
            isVegetarian: false,
            isSpicy: false,
            isNew: false,
            isBestSeller: false,
            isGlutenFree: false,
            allergens: []
          },
          quantity: item.quantity,
          specialInstructions: item.special_instructions
        })) || [],
        subtotal: order.subtotal,
        tax: order.tax,
        deliveryFee: order.delivery_fee,
        tip: order.tip,
        total: order.total,
        discount: order.discount,
        promoCode: order.promo_code,
        orderType: order.order_type as "delivery" | "pickup" | "dine-in",
        status: order.status as any,
        paymentMethod: "credit-card" as const,
        paymentStatus: order.payment_status as any,
        deliveryInstructions: order.delivery_instructions,
        scheduledFor: new Date(order.scheduled_for),
        createdAt: new Date(order.created_at),
        customerNotes: order.customer_notes,
        pickupTime: order.pickup_time,
        contactPreference: order.contact_preference,
        allergies: order.allergies,
        clientName: order.client_name,
        clientPhone: order.client_phone,
        clientEmail: order.client_email,
        deliveryStreet: order.delivery_street,
        deliveryCity: order.delivery_city,
        deliveryPostalCode: order.delivery_postal_code
      }));

      // Générer le CSV
      const csvContent = convertToCSV(orders);
      
      // Créer le nom de fichier
      const restaurantName = currentRestaurant?.name?.replace(/\s+/g, '_') || 'Tous_restaurants';
      const dateFromStr = format(dateFrom, 'yyyy-MM-dd');
      const dateToStr = format(dateTo, 'yyyy-MM-dd');
      const filename = `commandes_${restaurantName}_${dateFromStr}_${dateToStr}.csv`;

      // Télécharger le fichier
      downloadCSV(csvContent, filename);

      toast({
        title: "Export réussi",
        description: `${orders.length} commande(s) exportée(s) avec succès`,
      });

    } catch (error) {
      console.error('Erreur lors de l\'export CSV:', error);
      toast({
        title: "Erreur d'export",
        description: "Une erreur est survenue lors de l'export des commandes",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export des commandes en CSV
        </CardTitle>
        <CardDescription>
          Exportez les commandes pour la période sélectionnée au format Excel/CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Date de début */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date de début</label>
            <Popover open={isCalendarOpen === 'from'} onOpenChange={(open) => setIsCalendarOpen(open ? 'from' : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Date de fin */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date de fin</label>
            <Popover open={isCalendarOpen === 'to'} onOpenChange={(open) => setIsCalendarOpen(open ? 'to' : null)}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Informations sur l'export */}
        <div className="text-sm text-muted-foreground">
          <p>• Restaurant: <span className="font-medium">{currentRestaurant?.name || 'Tous les restaurants'}</span></p>
          <p>• Période: {dateFrom && dateTo ? `${format(dateFrom, "dd/MM/yyyy", { locale: fr })} - ${format(dateTo, "dd/MM/yyyy", { locale: fr })}` : 'Non sélectionnée'}</p>
        </div>

        {/* Bouton d'export */}
        <Button 
          onClick={handleExport}
          disabled={isExporting || !dateFrom || !dateTo}
          className="w-full"
        >
          {isExporting ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Export en cours...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Exporter les commandes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default OrdersCSVExport;
