/**
 * Utilitaires pour l'impression avec Epson ePOS-Print
 * SDK Documentation: https://support.epson.net/publist/reference_en/?ref=epos_js
 */

export interface PrinterConfig {
  ip_address: string;
  port: string;
  device_id: string;
  timeout: string;
}

export interface ReceiptData {
  orderNumber: string;
  restaurantName: string;
  date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  customerInfo?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  deliveryType: 'livraison' | 'emporter' | 'sur-place';
}

/**
 * Classe pour gérer l'impression via ePOS-Print
 */
export class EPosPrinter {
  private config: PrinterConfig;
  private device: any = null;

  constructor(config: PrinterConfig) {
    this.config = config;
  }

  /**
   * Initialise la connexion avec l'imprimante via HTTP direct
   */
  async connect(): Promise<boolean> {
    try {
      console.log(`🔌 Tentative de connexion à http://${this.config.ip_address}:${this.config.port}`);
      
      // Test de connectivité de base
      const response = await fetch(`http://${this.config.ip_address}:${this.config.port}/`, {
        method: 'GET',
        mode: 'cors'
      });
      
      if (response.ok) {
        console.log('✅ Connexion HTTP réussie');
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw error;
    }
  }

  /**
   * Déconnecte de l'imprimante
   */
  disconnect(): void {
    if (this.device) {
      this.device.disconnect();
      this.device = null;
      console.log('🔌 Déconnexion ePOS-Print');
    }
  }

  /**
   * Teste la connexion avec l'imprimante via API HTTP
   */
  async testConnection(): Promise<{ success: boolean; message: string; details?: string }> {
    try {
      console.log('🧪 Test de connexion HTTP direct avec l\'imprimante...');
      
      const { ip_address, port, device_id } = this.config;
      
      // Test 1: Connectivité de base
      const baseResponse = await fetch(`http://${ip_address}:${port}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!baseResponse.ok) {
        throw new Error(`Connexion de base échouée: HTTP ${baseResponse.status}`);
      }
      
      // Test 2: API ePOS-Print
      const eposResponse = await fetch(`http://${ip_address}:${port}/rpc/requestid`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (eposResponse.ok) {
        const result = await eposResponse.text();
        
        // Test 3: Envoi d'une commande d'impression de test simple
        try {
          const testPrintPayload = {
            method: "print",
            params: {
              devid: device_id,
              timeout: 10000
            },
            id: Date.now()
          };

          const printResponse = await fetch(`http://${ip_address}:${port}/rpc/requestid`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(testPrintPayload),
            signal: AbortSignal.timeout(5000)
          });

          const printResult = await printResponse.text();
          
          return {
            success: true,
            message: 'Test d\'impression complet réussi',
            details: `Connexion OK, API accessible, test d'impression envoyé. Device ID validé: ${device_id}`
          };
          
        } catch (printError) {
          return {
            success: true,
            message: 'Connexion réussie, test d\'impression partiel',
            details: `L'imprimante répond mais le test d'impression a échoué: ${printError.message}`
          };
        }
        
      } else {
        return {
          success: false,
          message: 'API ePOS-Print non accessible',
          details: `L'imprimante répond mais l'API ePOS-Print retourne: HTTP ${eposResponse.status}`
        };
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du test:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('fetch')) {
        return {
          success: false,
          message: 'Erreur Mixed Content ou réseau',
          details: 'CORS/Mixed Content bloqué ou imprimante non accessible. Consultez les instructions ci-dessous.'
        };
      }
      
      return {
        success: false,
        message: 'Erreur de test de connexion',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Imprime un reçu de commande
   */
  async printReceipt(receiptData: ReceiptData): Promise<{ success: boolean; message: string }> {
    try {
      await this.connect();

      const printer = this.device.createDevice('local_printer', this.device.DEVICE_TYPE_PRINTER, {
        crypto: false,
        buffer: false
      });

      // En-tête du reçu
      printer.addTextAlign(printer.ALIGN_CENTER);
      printer.addTextSize(2, 2);
      printer.addText(`${receiptData.restaurantName}\n`);
      printer.addTextSize(1, 1);
      printer.addText('═══════════════════════════════\n');
      printer.addText(`Commande #${receiptData.orderNumber}\n`);
      printer.addText(`${receiptData.date}\n`);
      printer.addText(`Type: ${receiptData.deliveryType.toUpperCase()}\n`);
      printer.addText('═══════════════════════════════\n\n');

      // Informations client (si livraison)
      if (receiptData.deliveryType === 'livraison' && receiptData.customerInfo) {
        printer.addTextAlign(printer.ALIGN_LEFT);
        printer.addText('INFORMATIONS CLIENT:\n');
        if (receiptData.customerInfo.name) {
          printer.addText(`Nom: ${receiptData.customerInfo.name}\n`);
        }
        if (receiptData.customerInfo.phone) {
          printer.addText(`Tél: ${receiptData.customerInfo.phone}\n`);
        }
        if (receiptData.customerInfo.address) {
          printer.addText(`Adresse: ${receiptData.customerInfo.address}\n`);
        }
        printer.addText('\n');
      }

      // Articles
      printer.addTextAlign(printer.ALIGN_LEFT);
      printer.addText('ARTICLES:\n');
      printer.addText('───────────────────────────────\n');

      receiptData.items.forEach(item => {
        const itemLine = `${item.quantity}x ${item.name}`;
        const priceText = `${item.price.toFixed(2)}€`;
        const spaces = ' '.repeat(32 - itemLine.length - priceText.length);
        printer.addText(`${itemLine}${spaces}${priceText}\n`);
      });

      printer.addText('───────────────────────────────\n');
      
      // Total
      printer.addTextAlign(printer.ALIGN_RIGHT);
      printer.addTextSize(2, 2);
      printer.addText(`TOTAL: ${receiptData.total.toFixed(2)}€\n`);
      printer.addTextSize(1, 1);
      
      // Pied de page
      printer.addTextAlign(printer.ALIGN_CENTER);
      printer.addText('\n');
      printer.addText('Merci de votre commande!\n');
      printer.addText('Bon appétit!\n\n');
      
      // Coupe du papier
      printer.addCut(printer.CUT_FEED);

      return new Promise((resolve) => {
        printer.send((result: any) => {
          this.disconnect();
          
          if (result.success) {
            resolve({
              success: true,
              message: 'Reçu imprimé avec succès'
            });
          } else {
            resolve({
              success: false,
              message: `Erreur d'impression: ${result.code} - ${result.status}`
            });
          }
        });
      });

    } catch (error) {
      this.disconnect();
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erreur d\'impression inconnue'
      };
    }
  }
}

/**
 * Charge le SDK ePOS-Print d'Epson
 */
export function loadEPOSScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Vérifier si le script est déjà chargé
    if (window.epson) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://download4.epson.biz/sec_pubs/pos/reference_en/epos_and/epos-sdk-js/epos-2.18.0.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ SDK ePOS-Print chargé');
      resolve();
    };
    
    script.onerror = () => {
      console.error('❌ Erreur lors du chargement du SDK ePOS-Print');
      reject(new Error('Impossible de charger le SDK ePOS-Print'));
    };
    
    document.head.appendChild(script);
  });
}

// Types pour window.epson
declare global {
  interface Window {
    epson: any;
  }
}