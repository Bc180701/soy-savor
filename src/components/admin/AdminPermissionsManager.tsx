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
  { id: 'restaurants', label: 'Gestion des restaurants' },
  { id: 'promotions', label: 'Gestion des promotions' },
  { id: 'ingredients', label: 'Gestion des ingrédients' },
  { id: 'settings', label: 'Paramètres' },
  { id: 'homepage', label: 'Page d\'accueil' },
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
      // Récupérer tous les administrateurs (sauf les super-admins)
      const { data: adminRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'administrateur');

      if (rolesError) throw rolesError;

      if (adminRoles && adminRoles.length > 0) {
        const userIds = adminRoles.map(role => role.user_id);
        
        // Récupérer les informations des utilisateurs depuis la vue auth_users_view
        const { data: authUsers, error: authError } = await supabase
          .from('auth_users_view')
          .select('id, email')
          .in('id', userIds);

        if (authError) throw authError;

        // Récupérer les profils pour les noms
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', userIds);

        if (profilesError) throw profilesError;

        // Fusionner les données
        const users = authUsers?.map(user => {
          const profile = profiles?.find(p => p.id === user.id);
          return {
            id: user.id,
            email: user.email,
            first_name: profile?.first_name || '',
            last_name: profile?.last_name || ''
          };
        }) || [];

        setAdminUsers(users);
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

      // Mettre à jour l'état local
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
            id: '', // sera généré par la DB
            admin_user_id: userId,
            section_name: sectionName,
            can_access: canAccess
          }];
        }
      });

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
    // Par défaut, l'accès est autorisé si aucune permission spécifique n'est définie
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