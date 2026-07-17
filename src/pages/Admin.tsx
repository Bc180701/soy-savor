import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import AdminManager from "@/components/admin/AdminManager";
import { checkAdminRoleWithRetry } from "@/utils/adminUtils";
import { useToast } from "@/components/ui/use-toast";

const Admin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const authorizedRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const verifyAdmin = async (userId: string, isInitial: boolean) => {
      const result = await checkAdminRoleWithRetry(userId);
      if (!mounted) return;

      if (result === true) {
        authorizedRef.current = true;
        setIsAuthorized(true);
        setIsLoading(false);
        return;
      }

      if (result === false) {
        // Réponse explicite : pas admin → retour accueil
        authorizedRef.current = false;
        navigate("/", { replace: true });
        return;
      }

      // result === null : check indéterminé (réseau / token en cours de refresh)
      if (isInitial) {
        // Au tout premier check on ne peut rien afficher : on retente plus tard
        // mais on ne déconnecte pas non plus l'utilisateur.
        console.warn(
          "Admin: vérification du rôle indéterminée au chargement initial, on garde l'utilisateur sur la page"
        );
        // On considère l'utilisateur comme autorisé provisoirement s'il était
        // déjà authorized. Sinon on reste en loading et on retentera au prochain event.
        if (authorizedRef.current) {
          setIsAuthorized(true);
          setIsLoading(false);
        } else {
          // Dernier essai après 2s pour ne pas bloquer indéfiniment
          setTimeout(async () => {
            if (!mounted) return;
            const retry = await checkAdminRoleWithRetry(userId);
            if (!mounted) return;
            if (retry === true) {
              authorizedRef.current = true;
              setIsAuthorized(true);
              setIsLoading(false);
            } else if (retry === false) {
              navigate("/", { replace: true });
            } else {
              // Toujours indéterminé : on affiche un toast mais on n'éjecte pas
              toast({
                variant: "destructive",
                title: "Vérification impossible",
                description:
                  "Impossible de vérifier vos droits pour le moment. Rechargez la page si le problème persiste.",
              });
              setIsLoading(false);
            }
          }, 2000);
        }
      } else {
        // Événement postérieur (token refresh, etc.) : ne rien faire, garder
        // l'utilisateur en place. Une vraie déconnexion viendra via SIGNED_OUT.
        console.warn(
          "Admin: vérification indéterminée après event auth, aucun changement"
        );
      }
    };

    // Vérif initiale
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        navigate("/login");
        return;
      }

      await verifyAdmin(session.user.id, true);
    })();

    // Écoute des changements de session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT") {
        authorizedRef.current = false;
        navigate("/login");
        return;
      }

      if (event === "TOKEN_REFRESHED") {
        // Rien à faire : le token est renouvelé, l'utilisateur reste admin.
        return;
      }

      if (event === "SIGNED_IN" && session?.user?.id) {
        // Nouvelle session (rare ici) → re-check
        verifyAdmin(session.user.id, false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return <AdminManager />;
};

export default Admin;
