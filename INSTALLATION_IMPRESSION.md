# 🖨️ Installation du système d'impression Epson

## ✅ Ce qui a été fait

### 1. Modification du bouton d'impression

Le bouton **Imprim!** dans l'admin (onglet Commandes) a été modifié pour **envoyer les commandes à votre serveur OVH** au lieu d'ouvrir une fenêtre d'impression locale.

**Fichiers modifiés :**
- `src/services/printerService.ts` (nouveau)
- `src/components/orders/OrdersAccountingView.tsx`
- `src/components/orders/OrdersKitchenView.tsx`
- `src/components/orders/OrdersDeliveryView.tsx`

### 2. Fichiers PHP créés

Les fichiers PHP ont été préparés dans le dossier `/server-files/` :
- `add-order.php` : Reçoit les commandes depuis React
- `Test_print.php` : Interrogé par l'imprimante Epson
- `README.md` : Documentation détaillée

## 🚀 Ce que VOUS devez faire maintenant

### Étape 1 : Uploader les fichiers PHP sur OVH

1. **Ouvrez votre client FTP** (FileZilla, Cyberduck, WinSCP...)

2. **Connectez-vous à votre hébergement OVH** :
   ```
   Host: ftp.cluster100.hosting.ovh.net
   Port: 21
   User: rjdndnf
   Password: Bc180701
   ```

3. **Naviguez vers `/www/`** (racine de votre site)

4. **Uploadez ces 2 fichiers** :
   - `server-files/add-order.php` → `/www/add-order.php`
   - `server-files/Test_print.php` → `/www/Test_print.php`

5. **Vérifiez les permissions** : `644` (lecture/écriture pour vous, lecture seule pour les autres)

### Étape 2 : Configurer l'URL dans le code React

**⚠️ IMPORTANT** : Vous devez remplacer `https://votre-domaine.fr` par votre vrai domaine OVH.

1. **Ouvrez le fichier** : `src/services/printerService.ts`

2. **Ligne 9, remplacez** :
   ```typescript
   const OVH_SERVER_URL = "https://votre-domaine.fr/add-order.php";
   ```
   
   Par :
   ```typescript
   const OVH_SERVER_URL = "https://votre-vrai-domaine.fr/add-order.php";
   ```

3. **Exemple** : Si votre site est `https://sushieats-fr.com`, mettez :
   ```typescript
   const OVH_SERVER_URL = "https://sushieats-fr.com/add-order.php";
   ```

### Étape 3 : Configurer l'imprimante Epson

1. **Trouvez l'adresse IP de votre imprimante** :
   - Imprimez un rapport réseau depuis l'imprimante
   - Ou consultez votre box/routeur

2. **Accédez à l'interface Web** :
   ```
   http://[IP_DE_VOTRE_IMPRIMANTE]/webconfig/
   ```
   Exemple : `http://192.168.1.100/webconfig/`

3. **Activez ePOS-Print** :
   - Allez dans : **TM-Intelligent** > **ePOS-Print**
   - Cochez : **Enable ePOS-Print**
   - Cliquez : **OK**

4. **Configurez Server Direct Print** :
   - Allez dans : **Server Access** > **Server Direct Print**
   - Cochez : **Enable Server Direct Print**
   - **Server 1 URL** : Entrez votre URL PHP :
     ```
     https://votre-vrai-domaine.fr/Test_print.php
     ```
   - **Interval** : Laissez `5` ou `10` secondes
   - Cliquez : **Test** → Doit afficher ✅ "Success"
   - Cliquez : **OK**

## 🧪 Test

### 1. Test manuel avec curl

Depuis votre ordinateur, testez que le serveur PHP répond :

```bash
curl -X POST https://votre-domaine.fr/add-order.php \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-12345678",
    "clientName": "Test Client",
    "clientPhone": "0601020304",
    "orderType": "pickup",
    "scheduledFor": "2025-01-06T14:30:00Z",
    "items": [{"name": "California", "quantity": 1, "price": 8.5}],
    "subtotal": 8.50,
    "tax": 0.85,
    "total": 9.35
  }'
```

**Réponse attendue** :
```json
{
  "status": "ok",
  "message": "Commande enregistrée avec succès",
  "filename": "1673012345_12345678.json"
}
```

### 2. Test depuis l'admin

1. Connectez-vous à votre admin
2. Allez dans **Commandes**
3. Cliquez sur le bouton **🖨️** (Imprimante) d'une commande
4. Vous devriez voir :
   - Toast "Envoi en cours..."
   - Puis toast "✅ Envoyé à l'imprimante"
5. **Attendez 5-10 secondes** : L'imprimante doit imprimer automatiquement

## 🔍 Vérification

### Sur le serveur OVH (via FTP) :

Après avoir testé, vérifiez que ces dossiers ont été créés :
```
/www/
├── add-order.php
├── Test_print.php
├── print-queue/      ← Commandes en attente
└── print-archive/    ← Commandes imprimées
```

### Dans print-queue/ :

Avant l'impression, vous devriez voir des fichiers `.json` :
```
1673012345_12345678.json
1673012456_87654321.json
```

### Dans print-archive/ :

Après l'impression, les fichiers sont déplacés ici (historique).

## 🐛 Dépannage

### ❌ "Serveur d'impression inaccessible"

**Causes possibles** :
1. Les fichiers PHP ne sont pas uploadés sur OVH
2. L'URL dans `printerService.ts` est incorrecte
3. Les permissions du serveur sont mauvaises

**Solution** :
- Vérifiez que vous pouvez accéder à `https://votre-domaine.fr/add-order.php` dans un navigateur (vous devriez voir une erreur 405, c'est normal)

### ❌ L'imprimante n'imprime pas

**Causes possibles** :
1. L'imprimante ne peut pas accéder à Internet
2. L'URL configurée dans l'imprimante est incorrecte
3. Le Server Direct Print n'est pas activé

**Solution** :
1. Testez la connexion depuis l'interface Web de l'imprimante (bouton **Test**)
2. Vérifiez que `Test_print.php` est bien accessible
3. Consultez les logs de l'imprimante (dans l'interface Web)

### ❌ "Erreur de configuration serveur (CORS)"

**Cause** : Le serveur PHP rejette les requêtes depuis Lovable.

**Solution** : 
- Les fichiers PHP fournis incluent déjà les headers CORS appropriés
- Vérifiez que vous n'avez pas modifié les fichiers PHP

### ❌ Les commandes restent bloquées dans print-queue/

**Causes possibles** :
1. L'imprimante n'interroge pas le serveur
2. Le format XML est incorrect
3. L'imprimante est éteinte/hors ligne

**Solution** :
1. Vérifiez que le Server Direct Print est activé
2. Vérifiez l'interval (5-10 secondes)
3. Redémarrez l'imprimante

## 📊 Architecture finale

```
┌─────────────────┐
│  Admin React    │
│  (Lovable)      │
└────────┬────────┘
         │ POST JSON
         ↓
┌─────────────────┐
│ add-order.php   │
│  (Serveur OVH)  │
└────────┬────────┘
         │ Sauvegarde
         ↓
┌─────────────────┐
│  print-queue/   │
│  (fichiers JSON)│
└────────┬────────┘
         ↑ GET (toutes les 5-10s)
┌─────────────────┐
│ Test_print.php  │
│  (Serveur OVH)  │
└────────┬────────┘
         ↑ Requête XML
┌─────────────────┐
│ Imprimante      │
│ Epson TM-m30III │
└─────────────────┘
         │
         ↓
     🖨️ IMPRESSION
```

## 📝 Notes importantes

- ✅ **Une seule impression par commande** : Chaque commande n'est imprimée qu'une fois
- ✅ **File d'attente** : Plusieurs commandes peuvent être en attente
- ✅ **Historique** : Les commandes imprimées sont archivées
- ✅ **Ordre FIFO** : La commande la plus ancienne est imprimée en premier
- ⚠️ **Délai** : Il peut y avoir 5-10 secondes entre le clic et l'impression (selon l'interval configuré)

## 🆘 Besoin d'aide ?

1. **Consultez les logs PHP** sur votre hébergement OVH
2. **Vérifiez la console du navigateur** (F12) pour voir les erreurs réseau
3. **Consultez l'interface Web de l'imprimante** pour voir les logs ePOS-Print
4. **Lisez le README.md détaillé** dans `/server-files/`

---

✅ **Une fois tout configuré, l'impression sera automatique !**

Chaque clic sur le bouton **🖨️** dans l'admin enverra la commande à l'imprimante, qui l'imprimera automatiquement après quelques secondes.
