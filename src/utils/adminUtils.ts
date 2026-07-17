import { supabase } from "@/integrations/supabase/client";

/**
 * Vérifie si un utilisateur a des privilèges d'administration
 * (rôle 'administrateur' ou 'super_administrateur').
 *
 * Retourne :
 *  - true  : l'utilisateur est admin
 *  - false : l'utilisateur n'est PAS admin (réponse explicite du serveur)
 *  - null  : impossible de vérifier (erreur réseau / RPC transitoire).
 *
 * Les appelants doivent traiter `null` comme "indéterminé" et NE PAS
 * déconnecter/rediriger l'utilisateur dans ce cas.
 */
export const checkAdminRoleStrict = async (
  userId: string
): Promise<boolean | null> => {
  try {
    const [adminResult, superAdminResult] = await Promise.all([
      supabase.rpc("has_role", { user_id: userId, role: "administrateur" }),
      supabase.rpc("has_role", { user_id: userId, role: "super_administrateur" }),
    ]);

    // Si les deux appels échouent → indéterminé
    if (adminResult.error && superAdminResult.error) {
      console.warn(
        "checkAdminRoleStrict: les deux RPC ont échoué",
        adminResult.error,
        superAdminResult.error
      );
      return null;
    }

    // Si un des deux répond true → admin
    if (adminResult.data === true || superAdminResult.data === true) {
      return true;
    }

    // Si un seul a échoué et l'autre a répondu false → indéterminé (prudence)
    if (adminResult.error || superAdminResult.error) {
      console.warn(
        "checkAdminRoleStrict: un RPC a échoué, l'autre est false → indéterminé"
      );
      return null;
    }

    // Les deux ont répondu explicitement false
    return false;
  } catch (error) {
    console.error("checkAdminRoleStrict: exception", error);
    return null;
  }
};

/**
 * Version avec retry (une seule nouvelle tentative après 1s) — utile pendant
 * un renouvellement de token Supabase où un appel peut échouer transitoirement.
 */
export const checkAdminRoleWithRetry = async (
  userId: string
): Promise<boolean | null> => {
  const first = await checkAdminRoleStrict(userId);
  if (first !== null) return first;

  await new Promise((r) => setTimeout(r, 1000));
  return await checkAdminRoleStrict(userId);
};

/**
 * Version legacy (booléenne). Conservée pour compatibilité : renvoie `false`
 * en cas d'erreur. NE PAS utiliser pour décider d'une redirection.
 */
export const checkAdminRole = async (userId: string): Promise<boolean> => {
  const result = await checkAdminRoleWithRetry(userId);
  return result === true;
};

/**
 * Vérifie si un utilisateur a des privilèges de super administration
 */
export const checkSuperAdminRole = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase.rpc("has_role", {
      user_id: userId,
      role: "super_administrateur",
    });

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error("Erreur lors de la vérification du statut super admin:", error);
    return false;
  }
};
