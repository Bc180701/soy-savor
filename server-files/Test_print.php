<?php
/**
 * Test_print.php
 * Interrogé par l'imprimante Epson en mode Server Direct Print
 * Retourne les commandes en attente au format XML ePOS-Print
 * 
 * À uploader sur votre hébergement OVH à l'URL:
 * https://votre-domaine.fr/Test_print.php
 * 
 * Configuration de l'imprimante:
 * 1. Aller sur http://IP_IMPRIMANTE/webconfig/
 * 2. TM-Intelligent > ePOS-Print > Enable
 * 3. Server Access > Server Direct Print > Enable
 * 4. Server 1 URL: https://votre-domaine.fr/Test_print.php
 */

header("Content-Type: text/xml; charset=utf-8");

$queueDir = 'print-queue';
$printedDir = 'print-archive';

// Créer le dossier d'archive si nécessaire
if (!is_dir($printedDir)) {
    mkdir($printedDir, 0755, true);
}

// Vérifier s'il y a des commandes en attente
if (!is_dir($queueDir)) {
    // Aucune commande
    echo '<?xml version="1.0" encoding="utf-8"?><PrintRequestInfo Version="3.00"></PrintRequestInfo>';
    exit;
}

// Récupérer la première commande (la plus ancienne)
$files = glob($queueDir . '/*.json');

if (empty($files)) {
    // Aucune commande
    echo '<?xml version="1.0" encoding="utf-8"?><PrintRequestInfo Version="3.00"></PrintRequestInfo>';
    exit;
}

// Trier par date de création (la plus ancienne en premier)
sort($files);
$orderFile = $files[0];

// Lire la commande
$order = json_decode(file_get_contents($orderFile), true);

if (!$order) {
    // Fichier corrompu, le supprimer
    unlink($orderFile);
    echo '<?xml version="1.0" encoding="utf-8"?><PrintRequestInfo Version="3.00"></PrintRequestInfo>';
    exit;
}

// Générer le contenu d'impression
$printJobId = 'order_' . substr($order['id'], -8) . '_' . time();

// Fonction helper pour échapper le XML
function escapeXml($text) {
    return htmlspecialchars($text, ENT_XML1 | ENT_QUOTES, 'UTF-8');
}

// Fonction pour formater le type de commande
function getOrderTypeLabel($type) {
    switch($type) {
        case 'delivery': return 'LIVRAISON';
        case 'pickup': return 'EMPORTE';
        case 'dine-in': return 'SUR PLACE';
        default: return strtoupper($type);
    }
}

// Construire le XML ePOS-Print
echo '<?xml version="1.0" encoding="utf-8"?>';
?>
<PrintRequestInfo Version="3.00">
  <ePOSPrint>
    <Parameter>
      <devid>local_printer</devid>
      <timeout>10000</timeout>
      <printjobid><?php echo escapeXml($printJobId); ?></printjobid>
    </Parameter>
    <PrintData>
      <epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">
        
        <!-- En-tête -->
        <text align="center" width="2" height="2" em="true">SUSHI EATS</text>
        <feed line="1"/>
        <text align="center"><?php echo escapeXml(getOrderTypeLabel($order['orderType'] ?? 'pickup')); ?></text>
        <feed line="1"/>
        <text>================================</text>
        <feed line="1"/>
        
        <!-- Info commande -->
        <text width="1" height="1" em="true">COMMANDE #<?php echo escapeXml(substr($order['id'], -8)); ?></text>
        <feed line="1"/>
        <text><?php echo escapeXml(date('d/m/Y H:i', strtotime($order['scheduledFor'] ?? 'now'))); ?></text>
        <feed line="1"/>
        <text>Client: <?php echo escapeXml($order['clientName'] ?? 'N/A'); ?></text>
        <feed line="1"/>
        <text>Tel: <?php echo escapeXml($order['clientPhone'] ?? 'N/A'); ?></text>
        <feed line="1"/>
        <text>--------------------------------</text>
        <feed line="1"/>
        
        <!-- Articles -->
        <text em="true">ARTICLES:</text>
        <feed line="1"/>
        <?php
        if (isset($order['items']) && is_array($order['items'])) {
            foreach ($order['items'] as $item) {
                $itemName = $item['name'] ?? 'Produit';
                $itemQty = $item['quantity'] ?? 1;
                $itemPrice = $item['price'] ?? 0;
                $itemTotal = $itemQty * $itemPrice;
                
                echo '<text>' . escapeXml($itemQty . 'x ' . $itemName) . '</text>';
                echo '<feed line="1"/>';
                
                // Prix aligné à droite
                echo '<text align="right">' . number_format($itemTotal, 2, ',', ' ') . ' EUR</text>';
                echo '<feed line="1"/>';
                
                // Description (pour créations personnalisées)
                if (isset($item['description']) && !empty($item['description'])) {
                    if (strpos($itemName, 'Créa') !== false) {
                        echo '<text>' . escapeXml('  ' . $item['description']) . '</text>';
                        echo '<feed line="1"/>';
                    }
                }
                
                // Instructions spéciales
                if (isset($item['specialInstructions']) && !empty($item['specialInstructions'])) {
                    echo '<text>  * ' . escapeXml($item['specialInstructions']) . '</text>';
                    echo '<feed line="1"/>';
                }
            }
        }
        ?>
        <text>--------------------------------</text>
        <feed line="1"/>
        
        <!-- Totaux -->
        <text>Sous-total: <?php echo number_format($order['subtotal'] ?? 0, 2, ',', ' '); ?> EUR</text>
        <feed line="1"/>
        <text>Taxes: <?php echo number_format($order['tax'] ?? 0, 2, ',', ' '); ?> EUR</text>
        <feed line="1"/>
        <?php if (isset($order['deliveryFee']) && $order['deliveryFee'] > 0): ?>
        <text>Livraison: <?php echo number_format($order['deliveryFee'], 2, ',', ' '); ?> EUR</text>
        <feed line="1"/>
        <?php endif; ?>
        <?php if (isset($order['tip']) && $order['tip'] > 0): ?>
        <text>Pourboire: <?php echo number_format($order['tip'], 2, ',', ' '); ?> EUR</text>
        <feed line="1"/>
        <?php endif; ?>
        <?php if (isset($order['discount']) && $order['discount'] > 0): ?>
        <text>Remise: -<?php echo number_format($order['discount'], 2, ',', ' '); ?> EUR</text>
        <feed line="1"/>
        <?php endif; ?>
        <text>================================</text>
        <feed line="1"/>
        <text width="2" height="2" em="true" align="right">TOTAL: <?php echo number_format($order['total'] ?? 0, 2, ',', ' '); ?> EUR</text>
        <feed line="1"/>
        
        <!-- Notes -->
        <?php if (isset($order['deliveryInstructions']) && !empty($order['deliveryInstructions'])): ?>
        <text>--------------------------------</text>
        <feed line="1"/>
        <text>LIVRAISON: <?php echo escapeXml($order['deliveryInstructions']); ?></text>
        <feed line="1"/>
        <?php endif; ?>
        
        <?php if (isset($order['customerNotes']) && !empty($order['customerNotes'])): ?>
        <text>NOTES: <?php echo escapeXml($order['customerNotes']); ?></text>
        <feed line="1"/>
        <?php endif; ?>
        
        <?php if (isset($order['allergies']) && is_array($order['allergies']) && count($order['allergies']) > 0): ?>
        <text>ALLERGIES: <?php echo escapeXml(implode(', ', $order['allergies'])); ?></text>
        <feed line="1"/>
        <?php endif; ?>
        
        <!-- Adresse de livraison -->
        <?php if (isset($order['orderType']) && $order['orderType'] === 'delivery'): ?>
        <text>--------------------------------</text>
        <feed line="1"/>
        <text>ADRESSE:</text>
        <feed line="1"/>
        <text><?php echo escapeXml($order['deliveryStreet'] ?? ''); ?></text>
        <feed line="1"/>
        <text><?php echo escapeXml(($order['deliveryPostalCode'] ?? '') . ' ' . ($order['deliveryCity'] ?? '')); ?></text>
        <feed line="1"/>
        <?php endif; ?>
        
        <!-- Pied de page -->
        <text>--------------------------------</text>
        <feed line="1"/>
        <text align="center"><?php echo date('d/m/Y H:i:s'); ?></text>
        <feed line="1"/>
        <text align="center">Merci de votre commande!</text>
        <feed line="3"/>
        
        <!-- Coupe du papier -->
        <cut type="feed"/>
      </epos-print>
    </PrintData>
  </ePOSPrint>
</PrintRequestInfo>
<?php
// Archiver la commande après l'avoir envoyée à l'imprimante
$archiveFile = $printedDir . '/' . basename($orderFile);
rename($orderFile, $archiveFile);
?>
