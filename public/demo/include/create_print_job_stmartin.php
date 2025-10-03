<?php
// Endpoint for restaurant Saint-Martin-de-Crau: writes to ../request/sample_stmartin.xml
header('Content-Type: application/json; charset=utf-8');

$EXPECTED_TOKEN = getenv('EPSON_PRINT_TOKEN') ?: 'CHANGE_ME_SECRET';
$TARGET_FILE_RELATIVE = '../request/sample_stmartin.xml';

function json_input_stm() {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function respond_stm($payload, $code = 200) {
    http_response_code($code);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        respond_stm(['ok' => false, 'error' => 'Method not allowed'], 405);
    }

    $body = json_input_stm();
    $token = isset($body['token']) ? (string)$body['token'] : '';
    if ($token !== $EXPECTED_TOKEN) {
        respond_stm(['ok' => false, 'error' => 'Forbidden'], 403);
    }

    $orderId = isset($body['orderId']) ? (string)$body['orderId'] : 'order';
    $customer = isset($body['customer']) ? (string)$body['customer'] : '';
    $items = isset($body['items']) && is_array($body['items']) ? $body['items'] : [];
    $notes = isset($body['notes']) ? (string)$body['notes'] : '';
    $total = isset($body['total']) ? (float)$body['total'] : 0.0;

    $xml = [];
    $xml[] = '<?xml version="1.0" encoding="utf-8"?>';
    $xml[] = '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">';
    $xml[] = '<text lang="fr" align="center" width="2" height="2">Sushi Eats - St Martin</text>';
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

    $targetPath = __DIR__ . '/' . $TARGET_FILE_RELATIVE;
    $dir = dirname($targetPath);
    if (!is_dir($dir)) {
        if (!mkdir($dir, 0755, true)) {
            respond_stm(['ok' => false, 'error' => 'Failed to create directory'], 500);
        }
    }
    $written = file_put_contents($targetPath, implode("\n", $xml));
    if ($written === false) {
        respond_stm(['ok' => false, 'error' => 'Failed to write file'], 500);
    }

    respond_stm(['ok' => true, 'file' => basename($targetPath)]);
} catch (Throwable $e) {
    respond_stm(['ok' => false, 'error' => $e->getMessage()], 500);
}

?>


