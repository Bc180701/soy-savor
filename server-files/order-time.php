<?php
/** OVH transport adapter: display the booked slot in France, never add fixed hours. */
function formatBookedOrderTime(array $order): string {
    $slot = $order['scheduledFor'] ?? null;
    if (!is_string($slot) || trim($slot) === '') {
        return 'Horaire non renseigné';
    }
    try {
        $paris = new DateTimeZone('Europe/Paris');
        // Unzoned legacy slots are already French local time; ISO instants use their offset.
        $date = new DateTimeImmutable($slot, $paris);
        return $date->setTimezone($paris)->format('d/m/Y H:i');
    } catch (Exception $error) {
        return 'Horaire non renseigné';
    }
}