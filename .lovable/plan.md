

# Fix: Commandes admin affichent le mauvais restaurant

## Problème
`OrderList` utilise `useRestaurantContext()` (contexte client) pour déterminer le restaurant, mais l'admin sélectionne son restaurant via `useAdminRestaurantSession()` (stocké dans `localStorage` sous `admin-restaurant-session`). Ces deux sources ne sont pas synchronisées, ce qui explique pourquoi au premier chargement, les commandes de tous les restaurants (ou du mauvais) s'affichent.

## Solution
Passer le `sessionRestaurant` de l'admin en prop à `OrderList` depuis `AdminManager`, et l'utiliser au lieu de `useRestaurantContext`.

### Fichiers modifiés

**`src/components/admin/AdminManager.tsx`**
- Passer `sessionRestaurant` en prop à `OrderList` :
  ```tsx
  case "orders":
    return <OrderList defaultTab={...} restaurantId={sessionRestaurant} />;
  ```

**`src/components/OrderList.tsx`**
- Ajouter `restaurantId` dans les props de `OrderList`
- Supprimer `useRestaurantContext()` et utiliser directement la prop `restaurantId`
- Supprimer le calcul intermédiaire `restaurantLoading` / `currentRestaurant?.id`
- Le state `restaurantId` sera directement la prop, prêt dès le premier rendu

Cela garantit que dès l'ouverture de la page admin, le filtre restaurant est immédiatement actif sans attendre le chargement du contexte client.

