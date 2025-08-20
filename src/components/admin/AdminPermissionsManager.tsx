import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Shield, Users } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
}

interface Permission {
  id: string;
  admin_user_id: string;
  section_name: string;
  can_access: boolean;
}

const ADMIN_SECTIONS = [
  { id: 'dashboard', label: 'Tableau de bord' },
  { id: 'products', label: 'Gestion des produits' },
  { id: 'orders', label: 'Gestion des commandes' },
  { id: 'users', label: 'Gestion des utilisateurs' },
  { id: 'blocked-slots', label: 'Créneaux bloqués' },
  { id: 'promotions', label: 'Gestion des promotions' },
  { id: 'homepage', label: 'Page d\'accueil' },
  { id: 'admins', label: 'Administrateurs' },
  { id: 'stripe-keys', label: 'Gestion des clés Stripe' },
  { id: 'printers', label: 'Imprimantes' },
  { id: 'bluetooth', label: 'Bluetooth Mobile' },
  { id: 'settings', label: 'Paramètres' },
];

export default function AdminPermissionsManager() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminUsers();
    fetchPermissions();
  }, []);

  const fetchAdminUsers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-admin-users-detailed');

      if (error) {
        console.error('Erreur lors de l\'appel à la fonction:', error);
        throw error;
      }

      if (data) {
        setAdminUsers(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des administrateurs:', error);
      toast.error('Erreur lors de la récupération des administrateurs');
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_permissions')
        .select('*');

      if (error) throw error;
      setPermissions(data || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      toast.error('Erreur lors de la récupération des permissions');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = async (userId: string, sectionName: string, canAccess: boolean) => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non connecté');

      const { error } = await supabase
        .from('admin_permissions')
        .upsert({
          admin_user_id: userId,
          section_name: sectionName,
          can_access: canAccess,
          granted_by: user.id
        }, {
          onConflict: 'admin_user_id,section_name'
        });

      if (error) throw error;

      // Mettre à jour l'état local immédiatement
      setPermissions(prev => {
        const existing = prev.find(p => p.admin_user_id === userId && p.section_name === sectionName);
        if (existing) {
          return prev.map(p => 
            p.admin_user_id === userId && p.section_name === sectionName
              ? { ...p, can_access: canAccess }
              : p
          );
        } else {
          return [...prev, {
            id: '',
            admin_user_id: userId,
            section_name: sectionName,
            can_access: canAccess
          }];
        }
      });

      // Notifier immédiatement tous les composants du changement
      window.dispatchEvent(new CustomEvent('admin-permissions-changed', {
        detail: { userId, sectionName, canAccess }
      }));

      // Si c'est pour l'utilisateur actuel, forcer un rafraîchissement immédiat
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && currentUser.id === userId) {
        console.log('🔄 Mise à jour des permissions pour l\'utilisateur actuel');
        
        // Vider le cache des permissions immédiatement
        const keys = Object.keys(localStorage).filter(key => key.startsWith('admin_permissions_'));
        keys.forEach(key => localStorage.removeItem(key));
        
        // Recharger la page après un court délai
        setTimeout(() => {
          console.log('🔄 Rechargement de la page...');
          window.location.reload();
        }, 100);
      }

      toast.success('Permission mise à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la permission:', error);
      toast.error('Erreur lors de la mise à jour de la permission');
    } finally {
      setSaving(false);
    }
  };

  const getPermissionValue = (userId: string, sectionName: string): boolean => {
    const permission = permissions.find(p => 
      p.admin_user_id === userId && p.section_name === sectionName
    );
    return permission ? permission.can_access : true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Chargement des permissions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Gestion des permissions administrateurs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Permissions par utilisateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          {adminUsers.length === 0 ? (
            <p className="text-muted-foreground">Aucun administrateur trouvé.</p>
          ) : (
            <div className="space-y-6">
              {adminUsers.map(user => (
                <div key={user.id} className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">
                    {user.first_name && user.last_name 
                      ? `${user.first_name} ${user.last_name}` 
                      : user.email
                    }
                    {user.first_name || user.last_name ? (
                      <span className="text-sm text-muted-foreground ml-2">({user.email})</span>
                    ) : null}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ADMIN_SECTIONS.map(section => (
                      <div key={section.id} className="flex items-center justify-between p-2 rounded border">
                        <label htmlFor={`${user.id}-${section.id}`} className="text-sm font-medium">
                          {section.label}
                        </label>
                        <Switch
                          id={`${user.id}-${section.id}`}
                          checked={getPermissionValue(user.id, section.id)}
                          onCheckedChange={(checked) => togglePermission(user.id, section.id, checked)}
                          disabled={saving}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}