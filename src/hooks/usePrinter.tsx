import { useState, useCallback } from 'react';
import { useToast } from './use-toast';
import { supabase } from '@/integrations/supabase/client';
import { loadEPOSScript, EPosPrinter, type PrinterConfig, type ReceiptData } from '@/utils/epos-print';

interface Order {
  id: string;
  order_number: string;
  total: number;
  created_at: string;
  client_name?: string;
  client_phone?: string;
  delivery_address?: string;
  delivery_type: 'livraison' | 'emporter' | 'sur-place';
  order_items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
}

export function usePrinter() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const getPrinterConfig = useCallback(async (restaurantId: string): Promise<PrinterConfig | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-printer-config', {
        body: { restaurantId }
      });

      if (error || !data?.printerConfig) {
        console.error('Erreur lors de la récupération de la configuration imprimante:', error);
        return null;
      }

      return data.printerConfig;
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration imprimante:', error);
      return null;
    }
  }, []);

  const printOrderReceipt = useCallback(async (order: Order, restaurantId: string, restaurantName: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // 1. Récupérer la configuration de l'imprimante
      const printerConfig = await getPrinterConfig(restaurantId);
      
      if (!printerConfig) {
        toast({
          title: "Configuration manquante",
          description: "Aucune configuration d'imprimante trouvée pour ce restaurant",
          variant: "destructive",
        });
        return false;
      }

      // 2. Charger le SDK ePOS-Print
      try {
        await loadEPOSScript();
      } catch (error) {
        toast({
          title: "Erreur SDK",
          description: "Impossible de charger le SDK ePOS-Print",
          variant: "destructive",
        });
        return false;
      }

      // 3. Préparer les données du reçu
      const receiptData: ReceiptData = {
        orderNumber: order.order_number,
        restaurantName: restaurantName,
        date: new Date(order.created_at).toLocaleString('fr-FR'),
        items: order.order_items.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        total: order.total,
        customerInfo: {
          name: order.client_name,
          phone: order.client_phone,
          address: order.delivery_address
        },
        deliveryType: order.delivery_type
      };

      // 4. Imprimer le reçu
      const printer = new EPosPrinter(printerConfig);
      const result = await printer.printReceipt(receiptData);

      if (result.success) {
        toast({
          title: "Impression réussie",
          description: `Reçu imprimé pour la commande #${order.order_number}`,
        });
        return true;
      } else {
        toast({
          title: "Erreur d'impression",
          description: result.message,
          variant: "destructive",
        });
        return false;
      }

    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      toast({
        title: "Erreur d'impression",
        description: error instanceof Error ? error.message : "Erreur inconnue lors de l'impression",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getPrinterConfig, toast]);

  const testPrint = useCallback(async (restaurantId: string, restaurantName: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      const printerConfig = await getPrinterConfig(restaurantId);
      
      if (!printerConfig) {
        toast({
          title: "Configuration manquante",
          description: "Aucune configuration d'imprimante trouvée",
          variant: "destructive",
        });
        return false;
      }

      await loadEPOSScript();
      
      const printer = new EPosPrinter(printerConfig);
      const result = await printer.testConnection();

      if (result.success) {
        toast({
          title: "Test réussi",
          description: "L'imprimante fonctionne correctement",
        });
        return true;
      } else {
        toast({
          title: "Test échoué",
          description: result.message,
          variant: "destructive",
        });
        return false;
      }

    } catch (error) {
      console.error('Erreur lors du test d\'impression:', error);
      toast({
        title: "Erreur de test",
        description: error instanceof Error ? error.message : "Erreur inconnue",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getPrinterConfig, toast]);

  return {
    printOrderReceipt,
    testPrint,
    isLoading
  };
}