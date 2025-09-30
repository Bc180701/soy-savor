<?php
// Endpoint d'impression pour OVH
// À placer sur votre serveur OVH : https://votre-site.com/print-endpoint.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
    exit;
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        throw new Exception('Données JSON invalides');
    }
    
    $orderData = $input['orderData'] ?? [];
    $printerIP = $input['printerIP'] ?? '192.168.1.129';
    $printerPort = $input['printerPort'] ?? 9100;
    
    // Générer le contenu d'impression
    $printContent = generatePrintContent($orderData);
    
    // Envoyer à l'imprimante
    $result = sendToPrinter($printContent, $printerIP, $printerPort);
    
    echo json_encode([
        'success' => true,
        'message' => 'Impression envoyée !',
        'content' => $printContent // Pour debug
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function generatePrintContent($order) {
    $content = '';
    
    // En-tête du restaurant
    $content .= "SOY SAVOR\n";
    $content .= "16 cours Carnot\n";
    $content .= "13160 Chateaurenard\n";
    $content .= "Tel: 04 90 24 00 00\n";
    $content .= "================================\n";
    
    // Informations de la commande
    $content .= "COMMANDE #" . ($order['id'] ?? 'N/A') . "\n";
    $content .= "Date: " . date('Y-m-d H:i:s') . "\n";
    $content .= "Type: " . ($order['delivery_type'] ?? 'N/A') . "\n";
    $content .= "================================\n";
    
    // Articles
    $content .= "ARTICLES COMMANDES\n";
    $content .= "================================\n";
    
    $items = $order['cartBackupItems'] ?? $order['items'] ?? [];
    $total = 0;
    
    foreach ($items as $item) {
        $name = $item['name'] ?? $item['menuItem']['name'] ?? 'Article inconnu';
        $quantity = $item['quantity'] ?? 1;
        $price = $item['price'] ?? $item['menuItem']['price'] ?? 0;
        $itemTotal = $quantity * $price;
        
        $content .= $name . "\n";
        $content .= "Qte: $quantity x " . number_format($price, 2) . "EUR = " . number_format($itemTotal, 2) . "EUR\n";
        $content .= "--------------------------------\n";
        $total += $itemTotal;
    }
    
    // Totaux
    $content .= "================================\n";
    $content .= "TOTAL: " . number_format($total, 2) . "EUR\n";
    $content .= "================================\n";
    
    // Pied de page
    $content .= "Merci pour votre commande !\n";
    $content .= "Bon appetit !\n\n\n";
    
    return $content;
}

function sendToPrinter($content, $printerIP, $printerPort) {
    // Note: Cette fonction nécessiterait une configuration réseau
    // pour permettre à OVH d'accéder à votre imprimante locale
    
    // Pour l'instant, on log le contenu
    error_log("Impression demandée vers $printerIP:$printerPort");
    error_log("Contenu: " . $content);
    
    // Dans un vrai déploiement, vous pourriez :
    // 1. Utiliser un service de cloud printing
    // 2. Envoyer par email à une adresse qui imprime
    // 3. Utiliser une API de service d'impression
    
    return true;
}
?>
