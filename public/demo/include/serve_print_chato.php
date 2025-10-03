<?php
// Serve the latest ePOS-Print XML for Chato to the Epson printer.
// Supports both POST (ConnectionType=GetRequest) and GET requests

header('Content-Type: text/xml; charset=UTF-8');

define("REQUEST_XML_PATH", __DIR__ . "/../request/sample_chato.xml");
define("RESPONSE_XML_PATH", __DIR__ . "/../response/sample_chato.xml");
$ACCESS_LOG = __DIR__ . '/../response/access_chato.log';

if (isset($_POST["ConnectionType"])) {
    $http_request = $_POST["ConnectionType"];
} else {
    $http_request = 'GET';
}

if ($http_request == 'GetRequest') {
    // Epson Server Direct Print protocol
    @file_put_contents($ACCESS_LOG, date('c') . " POST GetRequest ip=" . ($_SERVER['REMOTE_ADDR'] ?? '-') . " ua=" . ($_SERVER['HTTP_USER_AGENT'] ?? '-') . "\n", FILE_APPEND);
    
    if (file_exists(REQUEST_XML_PATH)) {
        // return print data
        $handle = fopen(REQUEST_XML_PATH, "r");
        fpassthru($handle);
        fclose($handle);
        
        // move file to response folder
        @rename(REQUEST_XML_PATH, RESPONSE_XML_PATH);
    } else {
        echo '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"><text>NO JOB</text></epos-print>';
    }
} else {
    // Fallback for GET requests (browser testing)
    @file_put_contents($ACCESS_LOG, date('c') . " GET ip=" . ($_SERVER['REMOTE_ADDR'] ?? '-') . " ua=" . ($_SERVER['HTTP_USER_AGENT'] ?? '-') . "\n", FILE_APPEND);
    
    if (file_exists(REQUEST_XML_PATH)) {
        readfile(REQUEST_XML_PATH);
    } else {
        echo '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"><text>NO JOB</text></epos-print>';
    }
}

?>