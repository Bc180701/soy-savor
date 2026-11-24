# Installation Multi-Restaurants - Système d'Impression

## Vue d'ensemble

Ce système permet de gérer **deux restaurants** avec **deux imprimantes séparées** :
- 🏪 **Châteaurenard** → Imprimante 1
- 🏪 **St Martin de Crau** → Imprimante 2

Chaque restaurant a sa **propre queue d'impression** et son **propre fichier Test_print.php**.

---

## 📁 Architecture des Fichiers

### Sur le serveur OVH (`/www/`)

```
/www/
├── add-order.php                      # Point d'entrée unique (route vers les bonnes queues)
├── order-time.php                     # Horaire réservé, commun aux modèles de ticket
├── Test_print_chateaurenard.php      # Pour imprimante Châteaurenard
├── Test_print_st_martin.php          # Pour imprimante St Martin
├── print-queue-chateaurenard/        # Queue Châteaurenard (créé auto)
├── print-queue-st-martin/            # Queue St Martin (créé auto)
├── print-archive-chateaurenard/      # Archive Châteaurenard (créé auto)
└── print-archive-st-martin/          # Archive St Martin (créé auto)
```

---

## 🚀 Étape 1 : Upload des Fichiers PHP

### Uploader sur le FTP OVH :

1. **Connexion FTP :**
   - Hôte : `ftp.votre-domaine.fr`
   - Dossier : `/www/`

2. **Fichiers à uploader :**
   ```
   ✅ add-order.php
   ✅ order-time.php
   ✅ Test_print_chateaurenard.php
   ✅ Test_print_st_martin.php
   ```

3. **Permissions :**
   - Tous les fichiers : `644` (lecture/écriture pour propriétaire)
   - Les dossiers seront créés automatiquement avec les bonnes permissions

Pour la correction des horaires, envoyer `order-time.php` avant de remplacer les deux modèles `Test_print_*`. Ne pas modifier ni supprimer les dossiers de file d'attente ou d'archive. Les horaires sont rendus en France, sans ajout fixe de deux heures, pour les valeurs ISO comme pour les anciens horaires locaux.

---

## 🖨️ Étape 2 : Configuration des Imprimantes Epson

### Imprimante Châteaurenard

1. **Interface web de l'imprimante** → Configuration → Server Direct Print
2. **Activer Server Direct Print** : ✅ Oui
3. **URL du serveur** : `https://sushieats.fr/Test_print_chateaurenard.php`
4. **Polling interval** : `10` secondes (recommandé)
5. **Timeout** : `30` secondes
6. **Enregistrer et redémarrer** l'imprimante

### Imprimante St Martin de Crau

1. **Interface web de l'imprimante** → Configuration → Server Direct Print
2. **Activer Server Direct Print** : ✅ Oui
3. **URL du serveur** : `https://sushieats.fr/Test_print_st_martin.php`
4. **Polling interval** : `10` secondes (recommandé)
5. **Timeout** : `30` secondes
6. **Enregistrer et redémarrer** l'imprimante

---

## 🔧 Étape 3 : Tests de Connexion

### Test 1 : Vérifier le serveur

```bash
# Test add-order.php
curl https://sushieats.fr/add-order.php
# ➜ Devrait répondre : {"status":"error","message":"Méthode non autorisée. Utilisez POST."}

# Test Test_print_chateaurenard.php
curl https://sushieats.fr/Test_print_chateaurenard.php
# ➜ Devrait afficher du XML vide (pas de commandes en attente)

# Test Test_print_st_martin.php
curl https://sushieats.fr/Test_print_st_martin.php
# ➜ Devrait afficher du XML vide (pas de commandes en attente)
```

### Test 2 : Envoyer une commande test depuis l'admin

1. **Aller dans l'admin** → Sélectionner **Châteaurenard**
2. **Créer ou sélectionner une commande**
3. **Cliquer sur "Imprimer"**
4. **Vérifier sur FTP** : un fichier JSON doit apparaître dans `print-queue-chateaurenard/`
5. **Attendre ~10 secondes** : l'imprimante Châteaurenard doit récupérer et imprimer le ticket
6. **Le fichier JSON** doit être déplacé dans `print-archive-chateaurenard/`

Répéter pour **St Martin de Crau**.

---

## 🔍 Fonctionnement du Routage

### Comment ça marche ?

1. **L'app React envoie** une commande à `add-order.php` avec `restaurant_id`
2. **`add-order.php` lit** le `restaurant_id` et détermine la queue :
   - Si `restaurant_id = 11111111-1111-1111-1111-111111111111` → `print-queue-chateaurenard/`
   - Si `restaurant_id = 22222222-2222-2222-2222-222222222222` → `print-queue-st-martin/`
3. **Les imprimantes interrogent** leur fichier Test_print respectif :
   - Imprimante 1 → `Test_print_chateaurenard.php` → lit `print-queue-chateaurenard/`
   - Imprimante 2 → `Test_print_st_martin.php` → lit `print-queue-st-martin/`
4. **Chaque imprimante** imprime uniquement les commandes de son restaurant

---

## 🛠️ Dépannage

### Problème : Aucune impression

**Vérifier :**
1. ✅ Les fichiers PHP sont bien uploadés sur le FTP
2. ✅ L'URL dans l'interface imprimante est correcte
3. ✅ Les dossiers `print-queue-xxx/` existent (créés auto après 1ère commande)
4. ✅ Le `restaurant_id` dans l'app React correspond bien

### Problème : Mauvais restaurant imprime

**Cause probable :** Mauvais `restaurant_id` envoyé par l'app React.

**Solution :**
1. Vérifier dans les logs du serveur (`ResultPrint_xxx.log`)
2. Vérifier le fichier JSON dans la queue

### Problème : Queue bloquée

**Symptôme :** Les commandes s'accumulent dans la queue sans être imprimées.

**Solution :**
1. Vérifier que l'imprimante interroge bien le serveur (logs imprimante)
2. Vérifier les logs `ResultPrint_chateaurenard.log` ou `ResultPrint_st_martin.log`
3. Supprimer manuellement les fichiers bloqués dans `print-queue-xxx/`

---

## 📊 Surveillance

### Logs disponibles

- `ResultPrint_chateaurenard.log` : Résultats d'impression Châteaurenard
- `ResultPrint_st_martin.log` : Résultats d'impression St Martin

### Commandes de monitoring

```bash
# Voir les commandes en attente Châteaurenard
ls -lah /www/print-queue-chateaurenard/

# Voir les commandes en attente St Martin
ls -lah /www/print-queue-st-martin/

# Voir les archives Châteaurenard
ls -lah /www/print-archive-chateaurenard/

# Voir les archives St Martin
ls -lah /www/print-archive-st-martin/
```

---

## ✅ Checklist de Déploiement

- [ ] Fichiers PHP uploadés sur FTP (`add-order.php`, `Test_print_chateaurenard.php`, `Test_print_st_martin.php`)
- [ ] URL testée : `https://sushieats.fr/add-order.php` répond
- [ ] URL testée : `https://sushieats.fr/Test_print_chateaurenard.php` répond
- [ ] URL testée : `https://sushieats.fr/Test_print_st_martin.php` répond
- [ ] Imprimante Châteaurenard configurée avec `Test_print_chateaurenard.php`
- [ ] Imprimante St Martin configurée avec `Test_print_st_martin.php`
- [ ] Test d'impression réussi pour Châteaurenard
- [ ] Test d'impression réussi pour St Martin
- [ ] Les deux imprimantes impriment uniquement les commandes de leur restaurant

---

## 🎉 Félicitations !

Votre système d'impression multi-restaurants est opérationnel ! 🚀
