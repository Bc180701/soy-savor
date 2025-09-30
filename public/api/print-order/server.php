<?php
// Endpoint pour Server Direct Print Epson
// Accepte les requêtes POST de l'imprimante

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// Log des requêtes pour diagnostic
$log = date('Y-m-d H:i:s') . " - Requête reçue\n";
$log .= "Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
$log .= "User-Agent: " . ($_SERVER['HTTP_USER_AGENT'] ?? 'N/A') . "\n";
$log .= "Remote IP: " . ($_SERVER['REMOTE_ADDR'] ?? 'N/A') . "\n";

// Log des paramètres POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $log .= "POST Data:\n";
    foreach ($_POST as $key => $value) {
        $log .= "  $key: $value\n";
    }
}

// Log des paramètres GET
if (!empty($_GET)) {
    $log .= "GET Data:\n";
    foreach ($_GET as $key => $value) {
        $log .= "  $key: $value\n";
    }
}

// Sauvegarder le log
file_put_contents('print_log.txt', $log, FILE_APPEND);

// Générer le contenu d'impression
$printContent = generatePrintContent();

// Retourner le contenu
echo $printContent;

function generatePrintContent() {
    $content = "";
    
    // Commandes ESC/POS
    $content .= "\x1B\x40"; // ESC @ - Initialize printer
    $content .= "\x1B\x61\x01"; // ESC a 1 - Center alignment
    
    // En-tête du restaurant
    $content .= "\x1B\x21\x30"; // ESC ! 0 - Normal text
    $content .= "SOY SAVOR\n";
    $content .= "16 cours Carnot\n";
    $content .= "13160 Châteaurenard\n";
    $content .= "Tel: 04 90 24 00 00\n";
    $content .= "================================\n";
    
    // Informations de la commande
    $content .= "\x1B\x21\x10"; // ESC ! 16 - Double height
    $content .= "COMMANDE #DEBUG\n";
    $content .= "\x1B\x21\x00"; // ESC ! 0 - Normal text
    
    $content .= "Date: " . date('Y-m-d H:i:s') . "\n";
    $content .= "Type: TEST SERVER DIRECT PRINT\n";
    $content .= "================================\n";
    
    // Articles de la commande
    $content .= "\x1B\x21\x08"; // ESC ! 8 - Bold
    $content .= "ARTICLES COMMANDES\n";
    $content .= "\x1B\x21\x00"; // ESC ! 0 - Normal text
    $content .= "================================\n";
    
    $content .= "Test Article 1\n";
    $content .= "Qte: 1 x 5.00€ = 5.00€\n";
    $content .= "--------------------------------\n";
    
    $content .= "Test Article 2\n";
    $content .= "Qte: 2 x 3.50€ = 7.00€\n";
    $content .= "--------------------------------\n";
    
    // Totaux
    $content .= "================================\n";
    $content .= "\x1B\x21\x08"; // Bold
    $content .= "TOTAL: 12.00€\n";
    $content .= "\x1B\x21\x00"; // Normal text
    
    // Pied de page
    $content .= "================================\n";
    $content .= "Merci pour votre commande !\n";
    $content .= "Bon appetit !\n";
    $content .= "\n\n\n"; // Espace pour couper
    
    // Couper le papier
    $content .= "\x1D\x56\x00"; // GS V 0 - Full cut
    
    return $content;
}
?>
