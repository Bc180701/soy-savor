/** The singleton has no restaurant ID: this switch always covers both restaurants. */
export async function readAutomaticPrintSetting(db: any): Promise<boolean> {
  const { data, error } = await db.from('automatic_print_settings').select('enabled').eq('id', true).single();
  if (error || typeof data?.enabled !== 'boolean') throw new Error('Impossible de lire le réglage de l’impression automatique.');
  return data.enabled;
}

export async function saveAutomaticPrintSetting(db: any, enabled: boolean): Promise<boolean> {
  const { data, error } = await db.from('automatic_print_settings')
    .update({ enabled }).eq('id', true).select('enabled').single();
  if (error || data?.enabled !== enabled) throw new Error('Impossible d’enregistrer le réglage. Réessayez.');
  return data.enabled;
}