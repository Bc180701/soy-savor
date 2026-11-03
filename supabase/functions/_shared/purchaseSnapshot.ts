/** Enrich exact paid lines only; never add lines or change paid quantities/prices. */
export function enrichPurchaseSnapshot(summary: any[], lines: any[]): any[] {
  return summary.map(item => {
    if (item.description) return item;
    const matches = lines.filter(line => line.name === item.name &&
      (line.id === item.id || !item.id || !line.id));
    if (matches.length !== 1 || !matches[0].description) return item;
    return { ...item, description: matches[0].description };
  });
}

export function stripeLinesToSnapshot(lines: any[]): any[] {
  return lines.map(line => ({
    id: line.price?.product?.metadata?.product_id || line.price?.product?.id || 'unknown',
    name: line.description || line.price?.product?.name || 'Produit inconnu',
    description: line.price?.product?.description || '',
    price: (line.price?.unit_amount ?? 0) / 100,
    unit_price: (line.price?.unit_amount ?? 0) / 100,
    quantity: line.quantity ?? 1,
  }));
}