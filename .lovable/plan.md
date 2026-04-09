

# Plan d'optimisation egress Supabase

## Modifications retenues

### 1. Filtrer par date dans `getAllOrders` (default 7 jours)
**Fichier** : `src/services/orderService.ts`
- Ajouter un paramètre `daysBack: number = 7` à `getAllOrders`
- Ajouter un filtre `.gte('created_at', dateLimit.toISOString())` à la requête
- Supprimer la pagination infinie (7 jours = bien moins de 1000 rows)

**Fichier** : `src/components/OrderList.tsx`
- Ajouter un state `daysBack` avec sélecteur de période (7j / 30j / 90j / Tout)
- Passer `daysBack` au hook `useOptimizedOrders`

**Fichier** : `src/hooks/useOptimizedOrders.tsx`
- Accepter `daysBack` en paramètre et le transmettre à `getAllOrders`
- Inclure `daysBack` dans la clé de cache

### 2. Supprimer la boucle N+1 sur order_items
**Fichier** : `src/services/orderService.ts`
- Remplacer la boucle `for` (lignes 463-503) qui fait 1 requête par commande par une seule requête batch :
  ```sql
  SELECT * FROM order_items WHERE order_id IN (id1, id2, ...) 
  ```
- Regrouper les résultats par `order_id` côté client avec un `Map`

### 3. Exclure `items_summary` du SELECT par défaut
**Fichier** : `src/services/orderService.ts`
- Retirer `items_summary` de la liste des colonnes dans `getAllOrders` (ligne 358)
- Le chargement à la demande existe déjà dans `OrderDetailsModal` et la page Compte

### 4. Augmenter le cache à 10 minutes
**Fichier** : `src/hooks/useOptimizedOrders.tsx`
- Changer `CACHE_DURATION` de `2 * 60 * 1000` à `10 * 60 * 1000` (ligne 14)

---

## Impact estimé
- **Requêtes** : de ~100+ requêtes/chargement à ~3 (orders + order_items batch + cart_backup)
- **Volume** : de ~2500 rows × items_summary (~2 MB) à ~200 rows sans items_summary (~50 KB)
- **Cache** : 5x moins de rechargements

