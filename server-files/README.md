# 📁 Fichiers Serveur PHP pour Impression Epson

## 📋 Description

Ces fichiers PHP doivent être uploadés sur votre hébergement OVH pour permettre l'impression automatique via votre imprimante Epson TM-m30III.

## 📦 Contenu

- **add-order.php** : Reçoit les commandes depuis votre site React
- **Test_print.php** : Interrogé par l'imprimante pour récupérer les commandes à imprimer
- **order-time.php** : Formatage commun de l'horaire réservé en France, sans ajout fixe d'heures

## 🚀 Installation sur OVH

### 1. Connexion FTP

Connectez-vous à votre hébergement OVH via FTP :

```
Host: ftp.cluster100.hosting.ovh.net
Port: 21
User: rjdndnf
Password: Bc180701
```

Utilisez un client FTP comme FileZilla, Cyberduck, ou WinSCP.

### 2. Upload des fichiers

1. Naviguez vers le dossier `/www/` (racine de votre site)
2. Uploadez les 3 fichiers PHP (`order-time.php` avant le modèle de ticket) :
   - `add-order.php`
   - `order-time.php`
   - `Test_print.php`

### 3. Permissions

Assurez-vous que les permissions sont correctes :
- Fichiers PHP : `644` (lecture/écriture pour vous, lecture seule pour les autres)
- Le serveur doit pouvoir créer les dossiers `print-queue/` et `print-archive/`

## ⚙️ Configuration de l'imprimante

### 1. Accéder à l'interface Web

Ouvrez un navigateur et allez à :
```
http://[IP_DE_VOTRE_IMPRIMANTE]/webconfig/
```

### 2. Activer ePOS-Print

1. Allez dans **TM-Intelligent** > **ePOS-Print**
2. Cochez **Enable ePOS-Print**
3. Cliquez sur **OK**

### 3. Configurer Server Direct Print

1. Allez dans **Server Access** > **Server Direct Print**
2. Cochez **Enable Server Direct Print**
3. Dans **Server 1 URL**, entrez :
   ```
   https://votre-domaine.fr/Test_print.php
   ```
   ⚠️ Remplacez `votre-domaine.fr` par votre vrai domaine OVH
4. **Interval** : Laissez 5-10 secondes (fréquence de vérification)
5. Cliquez sur **Test** pour vérifier la connexion
6. Si le test est réussi ✅, cliquez sur **OK**

## 🔧 Fonctionnement

### Architecture

```
[Site React Lovable]
      ↓
  (POST JSON)
      ↓
[add-order.php sur OVH]
      ↓
  (Sauvegarde dans print-queue/)
      ↑
  (GET toutes les 5-10s)
      ↑
[Test_print.php]
      ↑
  (Requête XML)
      ↑
[Imprimante Epson TM-m30III]
```

### Étapes :

1. L'utilisateur clique sur le bouton "Imprimer" dans l'admin
2. Le site React envoie la commande à `add-order.php`
3. Le fichier PHP sauvegarde la commande dans le dossier `print-queue/`
4. L'imprimante interroge `Test_print.php` toutes les X secondes
5. Si une commande est en attente, elle est envoyée au format XML ePOS-Print
6. L'imprimante imprime le ticket
7. La commande est déplacée dans `print-archive/`

## 🧪 Test manuel

### Tester l'enregistrement de commande

Utilisez curl ou Postman :

```bash
curl -X POST https://votre-domaine.fr/add-order.php \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-12345678",
    "clientName": "Test Client",
    "clientPhone": "0601020304",
    "orderType": "pickup",
    "scheduledFor": "2025-01-06T14:30:00Z",
    "items": [
      {
        "name": "California Saumon",
        "quantity": 2,
        "price": 8.5
      }
    ],
    "subtotal": 17.00,
    "tax": 1.70,
    "total": 18.70
  }'
```

Réponse attendue :
```json
{
  "status": "ok",
  "message": "Commande enregistrée avec succès",
  "filename": "1673012345_12345678.json",
  "timestamp": "2025-01-06 14:30:15"
}
```

### Tester la récupération par l'imprimante

Ouvrez dans un navigateur :
```
https://votre-domaine.fr/Test_print.php
```

Si des commandes sont en attente, vous verrez du XML.
Si aucune commande, vous verrez :
```xml
<?xml version="1.0" encoding="utf-8"?>
<PrintRequestInfo Version="3.00"></PrintRequestInfo>
```

## 🐛 Dépannage

### L'imprimante n'imprime pas

1. **Vérifier la connexion** :
   - L'imprimante doit être sur le même réseau ou avoir accès à Internet
   - Testez l'URL depuis l'interface Web de l'imprimante

2. **Vérifier les permissions** :
   ```bash
   chmod 755 print-queue/
   chmod 755 print-archive/
   ```

3. **Vérifier les logs PHP** :
   - Consultez les logs de votre hébergement OVH
   - Vérifiez qu'il n'y a pas d'erreur PHP

4. **Vérifier le format des commandes** :
   - Allez dans `print-queue/` et vérifiez le contenu des fichiers JSON
   - Assurez-vous que le format est correct

### Les commandes ne sont pas reçues

1. **Test manuel avec curl** (voir section Test)
2. **Vérifier les CORS** :
   - `add-order.php` doit autoriser les requêtes depuis votre domaine Lovable
3. **Vérifier l'URL** :
   - Dans le code React, l'URL doit correspondre à votre domaine OVH

### L'imprimante interroge mais ne trouve rien

1. **Vérifier le dossier `print-queue/`** :
   - Y a-t-il des fichiers `.json` dedans ?
2. **Permissions** :
   - Le serveur Web doit pouvoir lire/écrire dans ce dossier
3. **Format JSON** :
   - Ouvrez un fichier et vérifiez qu'il est valide

## 📊 Structure des dossiers

Une fois en fonctionnement, vous aurez :

```
/www/
├── add-order.php
├── Test_print.php
├── print-queue/           (créé automatiquement)
│   ├── 1673012345_12345678.json
│   └── 1673012456_87654321.json
└── print-archive/         (créé automatiquement)
    ├── 1673012000_11111111.json
    └── 1673012100_22222222.json
```

- **print-queue/** : Commandes en attente d'impression
- **print-archive/** : Commandes déjà imprimées (historique)

## 🔐 Sécurité (optionnel)

Pour sécuriser davantage, vous pouvez :

1. **Ajouter une clé API** dans `add-order.php` :
   ```php
   $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
   if ($apiKey !== 'VOTRE_CLE_SECRETE') {
       http_response_code(401);
       exit;
   }
   ```

2. **Limiter par IP** :
   ```php
   $allowedIPs = ['IP_DE_LOVABLE'];
   if (!in_array($_SERVER['REMOTE_ADDR'], $allowedIPs)) {
       http_response_code(403);
       exit;
   }
   ```

## 📝 Notes

- Les commandes sont traitées dans l'ordre (FIFO)
- Chaque commande n'est imprimée qu'une seule fois
- Les commandes imprimées sont archivées pendant 30 jours (vous pouvez les nettoyer manuellement)
- Le format XML respecte le standard Epson ePOS-Print Version 3.00

## 🆘 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs PHP sur OVH
2. Testez manuellement les endpoints avec curl
3. Vérifiez la configuration de l'imprimante
4. Consultez la documentation Epson : https://download.epson-biz.com/modules/pos/index.php?page=single_soft&cid=6678&scat=36&pcat=3

---

✅ Une fois configuré, l'impression sera automatique à chaque clic sur le bouton "Imprimer" dans l'admin !
