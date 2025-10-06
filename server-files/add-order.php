<?php
/**
 * add-order.php
 * Reçoit les commandes depuis le site React et les stocke pour l'imprimante
 * 
 * À uploader sur votre hébergement OVH à l'URL:
 * https://votre-domaine.fr/add-order.php
 */

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Vérifier que c'est une requête POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        "status" => "error",
        "message" => "Méthode non autorisée. Utilisez POST."
    ]);
    exit;
}

// Récupérer les données JSON
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Aucune donnée reçue ou format JSON invalide"
    ]);
    exit;
}

// Valider les données essentielles
if (!isset($data['id']) || !isset($data['items'])) {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Données incomplètes. 'id' et 'items' sont requis."
    ]);
    exit;
}

// IDs des restaurants
define("RESTAURANT_CHATEAURENARD", "11111111-1111-1111-1111-111111111111");
define("RESTAURANT_ST_MARTIN", "22222222-2222-2222-2222-222222222222");

// Déterminer le restaurant et le dossier de queue correspondant
$restaurantId = $data['restaurant_id'] ?? RESTAURANT_CHATEAURENARD;

if ($restaurantId === RESTAURANT_ST_MARTIN) {
    $queueDir = 'print-queue-st-martin';
} else {
    $queueDir = 'print-queue-chateaurenard';
}

// Créer le dossier pour la file d'attente si nécessaire
if (!is_dir($queueDir)) {
    mkdir($queueDir, 0755, true);
}

// Nom de fichier unique basé sur timestamp + order ID
$filename = $queueDir . '/' . time() . '_' . substr($data['id'], -8) . '.json';

// Sauvegarder la commande
if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE))) {
    echo json_encode([
        "status" => "ok",
        "message" => "Commande enregistrée avec succès",
        "filename" => basename($filename),
        "timestamp" => date('Y-m-d H:i:s')
    ]);
} else {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Erreur lors de l'enregistrement de la commande"
    ]);
}
?>
