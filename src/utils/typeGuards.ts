// Type guards pour vérifier les erreurs Supabase et filtrer les données valides

export function isNotError<T>(item: T | { error: true }): item is T {
  return !(item && typeof item === 'object' && 'error' in item);
}

export function filterValidData<T>(data: (T | { error: true })[]): T[] {
  return data.filter(isNotError);
}

export function hasProperty<T, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return obj !== null && typeof obj === 'object' && prop in obj;
}

export function safeAccess<T>(
  data: unknown,
  property: string
): T | undefined {
  if (data && typeof data === 'object' && !('error' in data) && property in data) {
    return (data as any)[property];
  }
  return undefined;
}