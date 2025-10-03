<?php
// Serve the latest ePOS-Print XML for Chato to the Epson printer.
// GET this URL from the printer. Optionally delete file after serving with ?delete=1

$TARGET = __DIR__ . '/../request/sample_chato.xml';
$DELETE_AFTER = isset($_GET['delete']) ? ($_GET['delete'] === '1') : false; // printer can also delete itself

header('Content-Type: application/xml; charset=utf-8');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

if (!file_exists($TARGET)) {
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

if ($DELETE_AFTER) {
    @unlink($TARGET);
}

?>


