<?php
    header('Content-Type: text/xml; charset=UTF-8');

    define("PRINT_QUEUE_DIR", "print-queue-st-martin");
    define("PRINT_ARCHIVE_DIR", "print-archive-st-martin");

    // Create directories if they don't exist
    if (!file_exists(PRINT_ARCHIVE_DIR)) {
        mkdir(PRINT_ARCHIVE_DIR, 0755, true);
    }
    if (!file_exists(PRINT_QUEUE_DIR)) {
        mkdir(PRINT_QUEUE_DIR, 0755, true);
    }

    // Get connection type - support GET for testing
    $http_request = $_POST["ConnectionType"] ?? $_GET["ConnectionType"] ?? 'GetRequest';

    if ($http_request == 'GetRequest') {
        # Send print data

        // Get shop ID (printer ID)
        $shop_id = $_POST["ID"] ?? 'unknown';

        // Check for pending orders in queue
        $files = glob(PRINT_QUEUE_DIR . "/*.json");
        
        if (empty($files)) {
            // No orders to print - return empty XML
            echo '<?xml version="1.0" encoding="UTF-8"?>';
            echo '<PrintRequestInfo Version="3.00"></PrintRequestInfo>';
            exit;
        }

        // Get the oldest file
        usort($files, function($a, $b) {
            return filemtime($a) - filemtime($b);
        });
        $orderFile = $files[0];

        // Read and decode order data
        $orderJson = file_get_contents($orderFile);
        $order = json_decode($orderJson, true);

        if (!$order) {
            // Invalid JSON - delete the file and return empty XML
            unlink($orderFile);
            echo '<?xml version="1.0" encoding="UTF-8"?>';
            echo '<PrintRequestInfo Version="3.00"></PrintRequestInfo>';
            exit;
        }

        // Generate unique print job ID
        $shortOrderId = substr(str_replace('-', '_', $order['id']), 0, 8);
        $printJobId = 'order_' . $shortOrderId . '_' . time();

        // Helper function to escape XML
        function escapeXml($str) {
            return htmlspecialchars($str, ENT_XML1 | ENT_QUOTES, 'UTF-8');
        }

        // Helper function to get order type label
        function getOrderTypeLabel($type) {
            switch($type) {
                case 'delivery': return 'LIVRAISON';
                case 'pickup': return 'À EMPORTER';
                case 'dine_in': return 'SUR PLACE';
                default: return strtoupper($type);
            }
        }

        // Start building ePOS-Print XML
        $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
        $xml .= '<PrintRequestInfo Version="3.00">' . "\n";
        $xml .= '<ePOSPrint>' . "\n";
        
        // Printer parameters
        $xml .= '<Parameter>' . "\n";
        $xml .= '<devid>local_printer</devid>' . "\n";
        $xml .= '<timeout>10000</timeout>' . "\n";
        $xml .= '<printjobid>' . escapeXml($printJobId) . '</printjobid>' . "\n";
        $xml .= '</Parameter>' . "\n";
        
        // Print data
        $xml .= '<PrintData>' . "\n";
        $xml .= '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print">' . "\n";
        
        // Header
        $xml .= '<!--  En-tête  -->' . "\n";
        $xml .= '<text align="center" width="2" height="2" em="true">SUSHI EATS ST MARTIN</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        $xml .= '<text align="center">' . escapeXml(getOrderTypeLabel($order['orderType'])) . '</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        $xml .= '<text>================================</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        
        // Order info
        $xml .= '<!--  Info commande  -->' . "\n";
        $shortId = substr($order['id'], 0, 8);
        $xml .= '<text width="1" height="1" em="true">COMMANDE #' . escapeXml($shortId) . '</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        
        // Format date
        $orderDate = new DateTime($order['scheduledFor']);
        $xml .= '<text>' . $orderDate->format('d/m/Y H:i') . '</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        
        // Client info
        $xml .= '<text>Client: ' . escapeXml($order['clientName']) . '</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        $xml .= '<text>Tel: ' . escapeXml($order['clientPhone']) . '</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        $xml .= '<text>--------------------------------</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        
        // Items
        $xml .= '<!--  Articles  -->' . "\n";
        $xml .= '<text align="left" em="true">ARTICLES:</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        
        foreach ($order['items'] as $item) {
            $itemName = escapeXml($item['name']);
            $itemQuantity = $item['quantity'];
            $itemPrice = number_format($item['price'], 2, ',', ' ');
            
            $xml .= '<text>' . $itemQuantity . 'x ' . $itemName . '</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            
            // Description if available
            if (!empty($item['description'])) {
                $xml .= '<text>   ' . escapeXml($item['description']) . '</text>' . "\n";
                $xml .= '<feed line="1"/>' . "\n";
            }
            
            // Special instructions if available
            if (!empty($item['specialInstructions'])) {
                $xml .= '<text>   NOTE: ' . escapeXml($item['specialInstructions']) . '</text>' . "\n";
                $xml .= '<feed line="1"/>' . "\n";
            }
            
            $xml .= '<text align="right">' . $itemPrice . ' EUR</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
        }
        
        $xml .= '<text>--------------------------------</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        
        // Totals
        $xml .= '<!--  Totaux  -->' . "\n";
        $xml .= '<text>Sous-total: ' . number_format($order['subtotal'], 2, ',', ' ') . ' EUR</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        $xml .= '<text>Taxes: ' . number_format($order['tax'], 2, ',', ' ') . ' EUR</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        
        if (!empty($order['deliveryFee']) && $order['deliveryFee'] > 0) {
            $xml .= '<text>Livraison: ' . number_format($order['deliveryFee'], 2, ',', ' ') . ' EUR</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
        }
        
        if (!empty($order['tip']) && $order['tip'] > 0) {
            $xml .= '<text>Pourboire: ' . number_format($order['tip'], 2, ',', ' ') . ' EUR</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
        }
        
        if (!empty($order['discount']) && $order['discount'] > 0) {
            $xml .= '<text>Remise: -' . number_format($order['discount'], 2, ',', ' ') . ' EUR</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
        }
        
        $xml .= '<text>================================</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        $xml .= '<text width="2" height="2" em="true" align="right">TOTAL: ' . number_format($order['total'], 2, ',', ' ') . ' EUR</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        
        // Delivery instructions
        if (!empty($order['deliveryInstructions'])) {
            $xml .= '<text>--------------------------------</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text>INSTRUCTIONS:</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text>' . escapeXml($order['deliveryInstructions']) . '</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
        }
        
        // Customer notes
        if (!empty($order['customerNotes'])) {
            $xml .= '<text>--------------------------------</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text>NOTES CLIENT:</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text>' . escapeXml($order['customerNotes']) . '</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
        }
        
        // Allergies
        if (!empty($order['allergies']) && is_array($order['allergies']) && count($order['allergies']) > 0) {
            $xml .= '<text>--------------------------------</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text em="true">ALLERGIES:</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text>' . escapeXml(implode(', ', $order['allergies'])) . '</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
        }
        
        // Delivery address
        if ($order['orderType'] === 'delivery' && !empty($order['deliveryStreet'])) {
            $xml .= '<!--  Adresse de livraison  -->' . "\n";
            $xml .= '<text>--------------------------------</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text>ADRESSE:</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text>' . escapeXml($order['deliveryStreet']) . '</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
            $xml .= '<text>' . escapeXml($order['deliveryPostalCode'] . ' ' . $order['deliveryCity']) . '</text>' . "\n";
            $xml .= '<feed line="1"/>' . "\n";
        }
        
        // Footer
        $xml .= '<!--  Pied de page  -->' . "\n";
        $xml .= '<text>--------------------------------</text>' . "\n";
        $xml .= '<feed line="1"/>' . "\n";
        $xml .= '<text align="center">' . date('d/m/Y H:i:s') . '</text>' . "\n";
        $xml .= '<feed line="3"/>' . "\n";
        
        // Paper cut
        $xml .= '<!--  Coupe du papier  -->' . "\n";
        $xml .= '<cut type="feed"/>' . "\n";
        
        $xml .= '</epos-print>' . "\n";
        $xml .= '</PrintData>' . "\n";
        $xml .= '</ePOSPrint>' . "\n";
        $xml .= '</PrintRequestInfo>';

        // Output XML
        echo $xml;

        // Move order file to archive
        $archiveFile = PRINT_ARCHIVE_DIR . '/' . basename($orderFile);
        rename($orderFile, $archiveFile);

    } else if ($http_request == 'SetResponse') {
        # Get print result
        $xml = simplexml_load_string($_POST["ResponseFile"]);
        $version = $xml['Version'];

        if ($version == '3.00') {
            // Log result
            $fhandle = @fopen("ResultPrint_st_martin.log", "wt");
            fprintf($fhandle, "PrintResponseInfo Version %s\n", $version);
            
            $success = $xml->ServerDirectPrint->Response['Success'];
            
            if($success == 'true') {
                fprintf($fhandle, "Success: true\n");
            } else {
                $summary = $xml->ServerDirectPrint->Response->ErrorSummary;
                $detail = $xml->ServerDirectPrint->Response->ErrorDetail;
                fprintf($fhandle, "----------\nServer Direct Print Success : false.\nErrorSummary : %s\nErrorDetail : %s\n", $summary, $detail);
            }
            fclose($fhandle);
        }
    } else {
        # Ignore other connectionType
    }
?>
