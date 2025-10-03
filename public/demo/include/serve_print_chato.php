<?php
// Serve the latest ePOS-Print XML for Chato to the Epson printer.
// GET this URL from the printer. Optionally delete file after serving with ?delete=1

$TARGET = __DIR__ . '/../request/sample_chato.xml';
$DELETE_AFTER = isset($_GET['delete']) ? ($_GET['delete'] === '1') : false; // printer can also delete itself
$ACCESS_LOG = __DIR__ . '/../response/access_chato.log';

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (!file_exists($TARGET)) {
    @file_put_contents($ACCESS_LOG, date('c') . " MISS ip=" . ($_SERVER['REMOTE_ADDR'] ?? '-') . " ua=" . ($_SERVER['HTTP_USER_AGENT'] ?? '-') . "\n", FILE_APPEND);
    // Return a minimal valid ePOS-Print to avoid printer error
    echo '<epos-print xmlns="http://www.epson-pos.com/schemas/2011/03/epos-print"><text>NO JOB</text></epos-print>';
    exit;
}

clearstatcache(true, $TARGET);
$size = @filesize($TARGET);
if ($size !== false) {
    header('Content-Length: ' . $size);
}
readfile($TARGET);
flush();
@file_put_contents($ACCESS_LOG, date('c') . " HIT ip=" . ($_SERVER['REMOTE_ADDR'] ?? '-') . " size=" . ($size !== false ? $size : '-') . " delete=" . ($DELETE_AFTER ? '1' : '0') . " ua=" . ($_SERVER['HTTP_USER_AGENT'] ?? '-') . "\n", FILE_APPEND);

if ($DELETE_AFTER) {
    @unlink($TARGET);
}

?>


