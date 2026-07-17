## Le problème

La page admin se recharge toute seule toutes les 5 min. Si Supabase renouvelle ton jeton pile à ce moment-là, la vérif admin échoue une fraction de seconde → tu es renvoyé à l'accueil. Rien à voir avec les RLS.

## Corrections

1. **`src/components/admin/AdminManager.tsx`** — enlever le `window.location.reload()` du timer 5 min. Juste mettre à jour l'horodatage, plus de rechargement forcé.

2. **`src/pages/Admin.tsx`** — vérif admin plus tolérante :
   - retry automatique une fois si l'appel échoue (réseau / token en cours de renouvellement)
   - écoute `onAuthStateChange` : redirection vers `/login` **uniquement** sur `SIGNED_OUT` réel, pas sur `TOKEN_REFRESHED`
   - pas de redirection vers `/` sur erreur transitoire

3. **`src/utils/adminUtils.ts`** — distinguer « pas admin » de « check échoué » pour éviter les faux négatifs.

Résultat : plus de déconnexion intempestive au bout de ~10 min.