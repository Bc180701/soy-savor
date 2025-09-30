// Impression via email - Solution la plus simple !
class EmailPrinter {
    constructor(emailAddress = 'impression@votre-restaurant.com') {
        this.emailAddress = emailAddress;
    }

    async printOrder(orderData) {
        try {
            // Générer le contenu d'impression
            const printContent = this.generatePrintContent(orderData);
            
            // Créer un email avec le contenu
            const emailSubject = `Commande #${orderData.id} - ${orderData.delivery_type}`;
            const emailBody = this.createEmailBody(printContent, orderData);
            
            // Ouvrir le client email par défaut
            const mailtoLink = this.createMailtoLink(emailSubject, emailBody);
            window.open(mailtoLink);
            
            return { 
                success: true, 
                message: 'Email d\'impression ouvert ! Envoyez-le pour imprimer.' 
            };
            
        } catch (error) {
            console.error('Erreur impression email:', error);
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

    createEmailBody(printContent, orderData) {
        return `
Commande à imprimer :

${printContent}

---
Commande #${orderData.id}
Client: ${orderData.customer_name || 'N/A'}
Téléphone: ${orderData.customer_phone || 'N/A'}
Adresse: ${orderData.delivery_address || 'N/A'}

Veuillez imprimer cette commande sur l'imprimante thermique.
        `.trim();
    }

    createMailtoLink(subject, body) {
        const encodedSubject = encodeURIComponent(subject);
        const encodedBody = encodeURIComponent(body);
        return `mailto:${this.emailAddress}?subject=${encodedSubject}&body=${encodedBody}`;
    }
}

// Export pour utilisation
window.EmailPrinter = EmailPrinter;
