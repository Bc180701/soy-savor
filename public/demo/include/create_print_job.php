<?php
// Minimal endpoint to generate an ePOS-Print XML file for Epson Server Direct Print.
// Input: POST body JSON with fields: token, orderId, customer, items[], notes, total
// Output: Writes XML to ../request/sample.xml (or ../request/order_<id>.xml if use_per_order_file=true)

header('Content-Type: application/json; charset=utf-8');

// ---------------- Configuration ----------------
// IMPORTANT: Replace this with a strong secret and keep it in OVH env or a file.
$EXPECTED_TOKEN = getenv('EPSON_PRINT_TOKEN') ?: 'CHANGE_ME_SECRET';

// If true, create one file per order: order_<id>.xml. If false, always write sample.xml
$USE_PER_ORDER_FILE = false; // default to sample.xml so printer grabs it immediately

// ------------------------------------------------

// Helpers
function json_input() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function sanitize_filename($name) {
    return preg_replace('/[^a-zA-Z0-9_\-]/', '', $name);
}

function respond($payload, $code = 200) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond(['ok' => false, 'error' => 'Method not allowed'], 405);
    }

    $body = json_input();
    $token = isset($body['token']) ? (string)$body['token'] : '';
    if ($token !== $EXPECTED_TOKEN) {
        respond(['ok' => false, 'error' => 'Forbidden'], 403);
    }

    $orderId = isset($body['orderId']) ? sanitize_filename((string)$body['orderId']) : 'order';
    $usePerOrderFile = isset($body['usePerOrderFile']) ? (bool)$body['usePerOrderFile'] : $USE_PER_ORDER_FILE;
    $customer = isset($body['customer']) ? (string)$body['customer'] : '';
    $items = isset($body['items']) && is_array($body['items']) ? $body['items'] : [];
    $notes = isset($body['notes']) ? (string)$body['notes'] : '';
    $total = isset($body['total']) ? (float)$body['total'] : 0.0;

    // Build ePOS-Print XML (simplified). Adjust tags/attrs per your printer settings.
    $xml = [];
    $xml[] = '<?xml version="1.0" encoding="utf-8"?>';
    $xml[] = '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">';
    $xml[] = '<text lang="fr" align="center" width="2" height="2">Sushi Eats</text>';
    $xml[] = '<text>Commande: ' . htmlspecialchars($orderId) . '</text>';
    if ($customer !== '') {
        $xml[] = '<text>Client: ' . htmlspecialchars($customer) . '</text>';
    }
    $xml[] = '<text>------------------------------</text>';

    foreach ($items as $it) {
        $name = isset($it['name']) ? (string)$it['name'] : 'Produit';
        $qty = isset($it['qty']) ? (int)$it['qty'] : 1;
        $price = isset($it['price']) ? (float)$it['price'] : 0.0;
        $desc = isset($it['description']) ? (string)$it['description'] : '';

        $line = $qty . 'x ' . $name . '  ' . number_format($price, 2, ',', ' ') . '€';
        $xml[] = '<text>' . htmlspecialchars($line) . '</text>';
        if ($desc !== '') {
            $desc_one_line = str_replace(["\r", "\n"], ' ', $desc);
            $xml[] = '<text>' . htmlspecialchars($desc_one_line) . '</text>';
        }
    }

    $xml[] = '<text>------------------------------</text>';
    $xml[] = '<text align="right">TOTAL: ' . number_format($total, 2, ',', ' ') . '€</text>';
    if ($notes !== '') {
        $xml[] = '<text>* ' . htmlspecialchars($notes) . '</text>';
    }
    $xml[] = '<feed line="3"/><cut type="feed"/>';
    $xml[] = '</epos-print>';

    $relativeTarget = $usePerOrderFile
        ? ('../request/order_' . $orderId . '.xml')
        : ('../request/sample.xml');

    $targetPath = __DIR__ . '/' . $relativeTarget; // __DIR__ is demo/include

    // Ensure directory exists
    $dir = dirname($targetPath);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            respond(['ok' => false, 'error' => 'Failed to create directory'], 500);
        }
    }

    $written = file_put_contents($targetPath, implode("\n", $xml));
    if ($written === false) {
        respond(['ok' => false, 'error' => 'Failed to write file'], 500);
    }

    respond(['ok' => true, 'file' => basename($targetPath)]);
} catch (Throwable $e) {
    respond(['ok' => false, 'error' => $e->getMessage()], 500);
}

?>


