

# Plan de correction de l'impression sans cart_backup

## Contexte du problème

La commande `826f081b-5c0c-440f-8435-78f8ccea8311` n'a pas de cart_backup associé, ce qui empêche l'impression de fonctionner. J'ai identifié **deux causes** :

### Cause 1 : cart_backup non créé
Dans `src/pages/Panier.tsx` ligne 292, le code tente d'insérer une chaîne vide `''` comme `restaurant_id` si le restaurant n'est pas défini. Or, `restaurant_id` est un UUID obligatoire, donc PostgreSQL rejette silencieusement l'insertion.

### Cause 2 : items_summary non récupéré
Le fallback existe dans le printerService (utiliser `items_summary` si pas de cart_backup), MAIS le champ `items_summary` n'est jamais récupéré de la base de données ! La requête dans `getAllOrders()` ne l'inclut pas dans le SELECT.

---

## Modifications à effectuer

### 1. Ajouter `items_summary` à la requête getAllOrders

**Fichier** : `src/services/orderService.ts`

Modifier le SELECT (lignes 302-330) pour inclure `items_summary` :

```typescript
let query = supabase
  .from('orders')
  .select(`
    id,
    user_id,
    restaurant_id,
    subtotal,
    tax,
    delivery_fee,
    tip,
    total,
    discount,
    promo_code,
    order_type,
    status,
    payment_method,
    payment_status,
    delivery_instructions,
    scheduled_for,
    created_at,
    customer_notes,
    pickup_time,
    contact_preference,
    allergies,
    client_name,
    client_phone,
    client_email,
    delivery_street,
    delivery_city,
    delivery_postal_code,
    items_summary  // ← AJOUT
  `)
```

Puis dans le mapping (ligne 377+), ajouter :
```typescript
itemsSummary: order.items_summary || []
```

### 2. Améliorer la validation du cart_backup

**Fichier** : `src/pages/Panier.tsx`

Modifier la sauvegarde préventive (lignes 286-302) pour valider le `restaurant_id` avant l'insertion :

```typescript
// 💾 SAUVEGARDE PRÉVENTIVE DU PANIER AVANT LE CHECKOUT
console.log("💾 Sauvegarde préventive du panier...");
const restaurantIdForBackup = cartRestaurant?.id || selectedRestaurantId;

// Validation : ne pas insérer si pas de restaurant_id valide
if (!restaurantIdForBackup || restaurantIdForBackup.length < 10) {
  console.warn("⚠️ Pas de restaurant_id valide, sauvegarde du panier impossible");
} else {
  try {
    const { error: backupError } = await supabase
      .from('cart_backup')
      .insert({
        session_id: deliveryInfo.email || 'anonymous',
        cart_items: items as any,
        restaurant_id: restaurantIdForBackup
      });
    
    if (backupError) {
      console.error("Erreur lors de la sauvegarde du panier:", backupError);
    } else {
      console.log("✅ Panier sauvegardé avec succès pour:", deliveryInfo.email);
    }
  } catch (backupError) {
    console.error("Erreur critique lors de la sauvegarde:", backupError);
  }
}
```

### 3. Ajouter un log dans le printerService pour debug

**Fichier** : `src/services/printerService.ts`

Ajouter un log au début pour identifier quelle source de données est utilisée (lignes 56-94) :

```typescript
// Préparer les articles à imprimer
const items: PrintItem[] = [];

console.log('🔍 [PRINT] Sources de données disponibles:', {
  cartBackupItems: order.cartBackupItems?.length || 0,
  itemsSummary: order.itemsSummary?.length || 0,
  items: order.items?.length || 0
});

// Utiliser cart_backup en priorité (le plus complet)
if (order.cartBackupItems && order.cartBackupItems.length > 0) {
  console.log('📦 [PRINT] Utilisation de cartBackupItems');
  // ... code existant
} 
// Sinon utiliser itemsSummary
else if (order.itemsSummary && order.itemsSummary.length > 0) {
  console.log('📦 [PRINT] Utilisation de itemsSummary (fallback)');
  // ... code existant
}
// Fallback sur items
else if (order.items && order.items.length > 0) {
  console.log('📦 [PRINT] Utilisation de items (dernier recours)');
  // ... code existant
} else {
  console.error('❌ [PRINT] Aucune source de données pour les articles !');
}
```

---

## Résumé des fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/services/orderService.ts` | Ajouter `items_summary` au SELECT et au mapping |
| `src/pages/Panier.tsx` | Valider le `restaurant_id` avant l'insertion du cart_backup |
| `src/services/printerService.ts` | Ajouter des logs pour debug |

---

## Bénéfices attendus

- L'impression fonctionnera même sans cart_backup grâce au fallback sur `items_summary`
- Les futures commandes sans restaurant_id défini ne tenteront plus d'insérer un cart_backup invalide
- Les logs permettront de diagnostiquer plus facilement les problèmes d'impression

