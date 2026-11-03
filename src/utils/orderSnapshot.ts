/** A customer/email/session is not an order identity. */
export function getOrderBackupItems(orderId: string, backups: any[]): any[] {
  const backup = backups.find(candidate => candidate.order_id === orderId);
  return Array.isArray(backup?.cart_items) ? backup.cart_items : [];
}

export function snapshotToPrintItems(summary: any[]): any[] {
  return summary.map(item => ({
    name: item.name || 'Produit',
    quantity: item.quantity ?? 1,
    price: item.unit_price ?? item.price ?? 0,
    description: item.description || '',
    specialInstructions: item.special_instructions || '',
  }));
}