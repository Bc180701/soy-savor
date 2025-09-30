// Impression directe via WebSocket ou fetch vers l'imprimante
class DirectPrinter {
    constructor(printerIP = '192.168.1.129', printerPort = 9100) {
        this.printerIP = printerIP;
        this.printerPort = printerPort;
    }

    async printOrder(orderData) {
        try {
            // Convertir les données en commandes ESC/POS
            const printContent = this.generatePrintContent(orderData);
            
            // Envoyer directement à l'imprimante via WebSocket ou fetch
            const response = await this.sendToPrinter(printContent);
            
            return { success: true, message: 'Impression envoyée !' };
            
        } catch (error) {
            console.error('Erreur impression:', error);
            return { success: false, message: error.message };
        }
    }

    generatePrintContent(order) {
        let content = '';
        
        // En-tête du restaurant
        content += 'SOY SAVOR\n';
        content += '16 cours Carnot\n';
        content += '13160 Chateaurenard\n';
        content += 'Tel: 04 90 24 00 00\n';
        content += '================================\n';
        
        // Informations de la commande
        content += `COMMANDE #${order.id}\n`;
        content += `Date: ${new Date().toLocaleString('fr-FR')}\n`;
        content += `Type: ${order.delivery_type}\n`;
        content += '================================\n';
        
        // Articles
        content += 'ARTICLES COMMANDES\n';
        content += '================================\n';
        
        const items = order.cartBackupItems || order.items || [];
        let total = 0;
        
        items.forEach(item => {
            const name = item.name || item.menuItem?.name || 'Article inconnu';
            const quantity = item.quantity || 1;
            const price = item.price || item.menuItem?.price || 0;
            const itemTotal = quantity * price;
            
            content += `${name}\n`;
            content += `Qte: ${quantity} x ${price.toFixed(2)}EUR = ${itemTotal.toFixed(2)}EUR\n`;
            content += '--------------------------------\n';
            total += itemTotal;
        });
        
        // Totaux
        content += '================================\n';
        content += `TOTAL: ${total.toFixed(2)}EUR\n`;
        content += '================================\n';
        
        // Pied de page
        content += 'Merci pour votre commande !\n';
        content += 'Bon appetit !\n\n\n';
        
        return content;
    }

    async sendToPrinter(content) {
        // Méthode 1: Via un service web simple (recommandée)
        const response = await fetch('/api/print', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                printerIP: this.printerIP,
                printerPort: this.printerPort,
                content: content
            })
        });
        
        if (!response.ok) {
            throw new Error('Erreur serveur d\'impression');
        }
        
        return await response.json();
    }
}

// Export pour utilisation
window.DirectPrinter = DirectPrinter;
