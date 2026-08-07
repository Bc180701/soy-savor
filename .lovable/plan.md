# Borne de commande — St Martin de Crau

Oui, c'est jouable. Le site actuel reste intact : la borne devient un **projet séparé** qui partage la **même base Supabase**, donc les commandes borne remontent automatiquement dans l'admin existant et peuvent être imprimées comme aujourd'hui.

## Ce que fait la borne

- Écran tactile, plein écran, sans navigation web (pas de header/footer, pas de compte).
- Restaurant figé sur St Martin de Crau, service **Sur place / À emporter** uniquement.
- Parcours : catégories → produits (avec suppléments et choix obligatoires déjà en base) → panier → mode de paiement.
- Mode invité : juste un prénom ou un simple numéro de commande auto-incrémenté du jour (ex. B-042).
- Retour automatique à l'écran d'accueil après 60 s d'inactivité (panier vidé) — indispensable en borne.

## Les deux chemins de paiement

**Carte (TPE)**
1. La borne affiche le montant, le client paie sur le TPE.
2. Commande créée en base avec `order_type = 'pickup'` ou `'dine-in'`, `payment_method = 'card_terminal'`, `payment_status = 'paid'`.
3. Elle apparaît dans l'admin St Martin comme une commande web → le restaurateur imprime le ticket cuisine avec le système actuel (`add-order.php` → `print-queue-st-martin`).
4. La borne imprime le ticket client (numéro de commande + récapitulatif). Selon le TPE choisi, c'est le TPE ou l'imprimante de la borne qui édite ce ticket.

**Espèces (au comptoir)**
1. La borne enregistre la commande en `payment_status = 'pending'`, `payment_method = 'cash'`.
2. Elle imprime un ticket « À payer au comptoir » avec le numéro de commande.
3. Le client paie en caisse ; l'encaissement se fait sur le logiciel de caisse du restaurant (hors périmètre pour l'instant).
4. L'admin affiche ces commandes avec un badge « Espèces – non payé » et un bouton pour marquer payé.

## Matériel recommandé

Comme le TPE (Stripe Terminal) et l'imprimante cuisine (ePOS réseau) ne sont **pas branchés** à la borne, le poste de la borne n'a besoin que d'un navigateur et d'une connexion réseau. Une **tablette Windows** suffit donc.

| Élément | Recommandation | Pourquoi |
|---|---|---|
| Borne | **Tablette Windows 11 Pro** 12"–15" sur pied/support antivol (ex. Surface Pro + dock), ou écran tactile 22"–27" + mini-PC si le client veut du grand format | Chromium en mode kiosque suffit ; aucun périphérique à piloter |
| Alternative | Tablette Android/iPad en mode kiosque possible si on renonce à `window.print()` local | Impression ticket client via ePOS réseau uniquement |
| Navigateur | Chrome/Edge `--kiosk`, démarrage auto au boot, veille écran désactivée | Aucune barre d'adresse, impossible de sortir du site |
| Ticket client | Imprimé via l'**imprimante ePOS réseau existante** (même mécanisme qu'aujourd'hui), pas d'imprimante dédiée à la borne | Rien de nouveau à installer |
| Imprimante cuisine | **Celle déjà installée**, aucun changement | Le flux d'impression existant est réutilisé tel quel |
| Réseau | Ethernet filaire pour la borne (dock USB-C/RJ45 sur tablette) et pour le TPE ; Wi-Fi acceptable en secours | Une borne qui décroche = commandes perdues |
| Alimentation | Tablette branchée en permanence via son dock ; petit UPS si possible | La batterie évite déjà les micro-coupures |

**Tout-en-un tactile 15" type AliExpress (~240 €)** : techniquement suffisant puisque la borne n'exécute qu'un navigateur, mais à surveiller — la variante à ce prix est un **RK3566 / 4 Go / Android 11** (SoC bas de gamme, site React lourd = scroll saccadé), Android impose un kiosque + MDM tiers et fait perdre `window.print()` local, la prise doit être basculée en **UE**, et il n'y a aucun SAV local. Si ce choix est retenu, prévoir **deux unités** (une en spare) — cela reste moins cher qu'un tout-en-un pro (Aures, Elo, HP RP9) garanti en France. Par défaut, le plan reste sur tablette Windows 11 Pro sur support antivol.



## Choix du TPE — ma recommandation

Le point structurant : **est-ce que la borne pilote le TPE, ou est-ce que le client tape le montant à la main ?**

1. **Stripe Terminal (recommandé)** — Stripe est déjà en place sur le projet (clés par restaurant, webhook). Le lecteur s'achète directement chez Stripe (Dashboard → Terminal → Hardware, livré en France). La borne envoie le montant au lecteur (BBPOS WisePOS E ou Verifone P400, filaire/Ethernet), le client insère sa carte, la confirmation revient dans le code : impression automatique, zéro saisie manuelle, réconciliation propre avec la commande. C'est la seule option où la borne est réellement autonome.
   - **Type d'intégration à sélectionner chez Stripe : « Piloté par le serveur » (intégration côté serveur).** C'est le mode où le paiement est déclenché depuis une edge function : le montant est poussé au lecteur, on attend la confirmation, puis on écrit la commande. Aucun SDK dans le navigateur de la borne, donc rien à casser si la borne redémarre, et la clé Stripe ne quitte jamais le serveur. Les options JavaScript / Android / iOS / React Native sont des intégrations côté client, réservées aux lecteurs pilotés depuis l'appareil — inutiles ici.
   - Ce mode exige un **lecteur « smart » compatible** : WisePOS E ou Stripe Reader S700. Le Verifone P400 n'est pas compatible avec le mode piloté par le serveur — donc **WisePOS E ou S700** pour la borne.
2. **SumUp Solo** — la clé `SUMUP_API_KEY` existe déjà en projet, mais l'API "montant poussé au terminal" dépend du modèle et du contrat ; à valider avant achat.
3. **TPE bancaire actuel du restaurant** — le moins cher (rien à acheter) mais **pas d'intégration** : le client doit saisir le montant sur le TPE, puis appuyer sur « J'ai payé » sur la borne. Risque d'écart entre montant encaissé et commande imprimée. À éviter si possible, ou à réserver au démarrage.

Avant de commander le matériel, il faut trancher ce point avec le client (et vérifier auprès de sa banque si son contrat monétique autorise Stripe Terminal en complément).

## Points à prévoir

- **Numérotation borne** : compteur journalier lisible par le client et le comptoir, distinct des UUID de commande.
- **Marquage `source`** : nouvelle colonne pour distinguer `web` / `borne` dans l'admin et les statistiques.
- **Créneaux horaires** : la borne commande en immédiat ; il faut court-circuiter le sélecteur de créneaux et la logique de réservation de slot, en gardant le contrôle des horaires d'ouverture et du verrou de commande.
- **Promotions** : décider ce qui s'applique en borne (codes promo, offre box du midi, sauces/couverts offerts, desserts offerts). Le plus simple : pas de code promo saisi en borne.
- **Hors ligne** : que se passe-t-il si Internet tombe ? Minimum : écran « Borne momentanément indisponible, commandez au comptoir » plutôt qu'un écran blanc.
- **Panne d'imprimante** : afficher le numéro de commande en gros à l'écran en secours.
- **RGPD / accessibilité** : pas de collecte de données personnelles = beaucoup plus simple. Hauteur d'écran et zones tactiles accessibles PMR.
- **Sécurité poste** : session Windows verrouillée, pas de clavier accessible, mises à jour automatiques désactivées aux heures de service.

## Détails techniques

- **Projet séparé** relié à la même base Supabase (`tdykegnmomyyucbhslok`) : mêmes tables `products`, `categories`, `orders`, `order_items`, `items_summary`, mêmes edge functions.
- Migration légère : ajout de `orders.source` (`web` | `kiosk`) et `orders.kiosk_ticket_number`, plus les valeurs de `payment_method` (`card_terminal`, `cash`) — le site actuel n'est pas impacté (valeurs par défaut).
- Insertion des commandes borne via une **edge function dédiée** (pas d'insert direct depuis la borne) : elle valide le panier, recalcule le total côté serveur, réserve le numéro de ticket, écrit `items_summary` et déclenche l'envoi vers la queue d'impression St Martin.
- Réutilisation par copie ciblée depuis le projet actuel : logique produits/suppléments/choix obligatoires, calculateurs Sushi/Poké, formatage des lignes de commande. Le code borne a son propre layout tactile (grandes cibles, pas de hover).
- Impression du ticket client : envoi vers l'**imprimante ePOS réseau déjà utilisée** (même chemin que les tickets actuels), la borne n'a donc aucun périphérique local. Repli possible : `window.print()` avec une CSS ticket 80 mm si une imprimante locale est ajoutée un jour.

## Prochaines étapes

1. Trancher le TPE (Stripe Terminal vs TPE existant) → conditionne le devis matériel.
2. Valider le périmètre promos en borne.
3. Créer le projet borne, appliquer la petite migration, puis construire le parcours écran par écran.
