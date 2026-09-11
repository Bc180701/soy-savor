# Corriger la navigation (Waze / Plans) depuis la vue Livraison

## Ce qui se passe

La vue Livraison envoie à Waze / Google Maps / Plans **la totalité** de l'adresse saisie par le client, y compris les compléments d'adresse.

Exemple, la commande de Samy Benbara d'hier soir sur Châteaurenard (vérifié en base) :

```text
683 boulevard joliot curie N°10 Residence clos des tours, 13160 Châteaurenard
```

Waze reçoit cette phrase entière. Les compléments (`N°10`, `Residence clos des tours`) ne correspondent à rien dans sa base d'adresses, donc il ne trouve pas le bon résultat et propose un point approximatif — souvent une autre rue, voire une autre commune. L'adresse affichée à l'écran est juste ; c'est bien l'envoi vers l'application qui est en cause.

Autres adresses récentes exposées au même problème :
- `6 RUE DE LA GARRIGUE logement D58 rési...` (St Martin de Crau)
- `Impasse du Colisée, Villa Romana, Bat B Appt 23` (Maussane)
- `18 rue des sonnailles domaine le redon` (St Martin de Crau)

Deux problèmes secondaires au même endroit :
- Le lien Plans utilise `maps://`, qui ne s'ouvre pas depuis un navigateur de bureau (rien ne se passe).
- Le pays n'est jamais précisé, ce qui laisse le champ libre aux homonymes de rues hors région.

## Ce qui va changer

1. **Nettoyage de l'adresse avant l'envoi** vers Waze / Google Maps / Plans : on ne garde que le numéro et le nom de la rue, plus le code postal, la ville et « France ». Les compléments d'appartement, bâtiment, résidence, étage, logement, digicode sont retirés de la requête de navigation.
2. **L'affichage reste inchangé** : le livreur continue de voir l'adresse complète telle que le client l'a écrite, compléments inclus, ainsi que les instructions de livraison. Rien n'est perdu.
3. **Lien Plans réparé** pour qu'il fonctionne aussi sur ordinateur.
4. **Bouton « Copier l'adresse »** ajouté à côté de « Naviguer », pour les cas tordus où le livreur préfère coller lui-même dans son application.

## Détails techniques

Fichier concerné : `src/components/orders/OrdersDeliveryView.tsx`.

- Nouvelle fonction utilitaire `buildNavAddress(street, postalCode, city)` :
  - coupe la rue au premier marqueur de complément, insensible à la casse et aux accents : `n°`, `no `, `appt`, `apt`, `appartement`, `bat`, `bât`, `batiment`, `residence`, `résidence`, `res `, `rés `, `logement`, `etage`, `étage`, `esc`, `escalier`, `porte`, `interphone`, `digicode`, `code `, `chez `, `villa ` (quand elle suit déjà un nom de rue), `domaine`, `lot `, `boite`, `bp `;
  - supprime les virgules et espaces multiples résiduels en fin de chaîne ;
  - si le nettoyage ne laisse plus de nom de rue exploitable (moins de 3 caractères ou uniquement un numéro), on retombe sur la rue d'origine plutôt que d'envoyer une requête vide ;
  - retourne `"<rue nettoyée>, <code postal> <ville>, France"`.
- `openInMaps` reçoit désormais l'adresse déjà normalisée. URLs :
  - Google : `https://www.google.com/maps/search/?api=1&query=<enc>` (inchangé) ;
  - Plans : `https://maps.apple.com/?q=<enc>` au lieu de `maps://?q=` ;
  - Waze : `https://waze.com/ul?q=<enc>&navigate=yes` (inchangé).
- Le bloc d'affichage de l'adresse (lignes ~419-470) garde `order.deliveryStreet` brut ; seuls les trois `DropdownMenuItem` consomment `buildNavAddress(...)`.
- Bouton copier via `navigator.clipboard.writeText` + toast de confirmation, réutilisant le `useToast` déjà importé dans le fichier.
- Aucune modification de base de données, aucune modification du parcours client.
