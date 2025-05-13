import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Search, Loader2, ChevronDown, ChevronUp, Phone, Mail, MapPin, FileText, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { getAllUsers, getUserDetails, exportUsersData } from "@/services/authService";

type AuthUser = {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at?: string;
};

type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  addresses: Array<{
    id: string;
    street: string;
    city: string;
    postal_code: string;
    additional_info?: string;
    is_default: boolean;
  }>;
  orders?: Array<{
    id: string;
    created_at: string;
    total: number;
    status: string;
    payment_status: string;
  }>;
  created_at: string;
  loyalty_points: number;
  last_sign_in_at?: string;
  totalSpent?: number;
  totalOrders?: number;
};

const UsersList = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      setFilteredUsers(
        users.filter(
          user =>
            user.first_name?.toLowerCase().includes(lowercaseQuery) ||
            user.last_name?.toLowerCase().includes(lowercaseQuery) ||
            user.email.toLowerCase().includes(lowercaseQuery) ||
            user.phone?.toLowerCase().includes(lowercaseQuery) ||
            user.addresses.some(addr => 
              addr.street?.toLowerCase().includes(lowercaseQuery) ||
              addr.city?.toLowerCase().includes(lowercaseQuery) ||
              addr.postal_code?.toLowerCase().includes(lowercaseQuery)
            )
        )
      );
    }
  }, [searchQuery, users]);

  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Get users with all additional data
      const { data: enrichedUsers, error } = await exportUsersData();
      
      if (error) {
        console.error("Error fetching users data:", error);
        fallbackToProfiles();
        return;
      }
      
      if (!enrichedUsers || enrichedUsers.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }
      
      setUsers(enrichedUsers);
      setFilteredUsers(enrichedUsers);
    } catch (error) {
      console.error("Error in fetchUsers:", error);
      // Fall back to using only profiles if there's an error
      fallbackToProfiles();
    } finally {
      setLoading(false);
    }
  };

  // Fallback method if we can't access auth.users
  const fallbackToProfiles = async () => {
    try {
      // Récupérer tous les utilisateurs depuis les profils
      // Cela nous donnera les IDs des utilisateurs
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*");
      
      if (profilesError) throw profilesError;
      
      if (!profiles || profiles.length === 0) {
        setUsers([]);
        setFilteredUsers([]);
        setLoading(false);
        return;
      }
      
      // Pour chaque profil, récupérer les informations d'adresse
      const enrichedUsers = await Promise.all(
        profiles.map(async (profile) => {
          // Récupérer les adresses
          const { data: addresses, error: addressesError } = await supabase
            .from("user_addresses")
            .select("*")
            .eq("user_id", profile.id);
            
          if (addressesError) {
            console.error(`Erreur lors de la récupération des adresses pour ${profile.id}:`, addressesError);
          }
          
          // Récupérer l'email de l'utilisateur depuis la session s'il est connecté
          let email = "";
          
          // Chercher l'email dans les commandes existantes comme fallback
          if (!email) {
            const { data: orders } = await supabase
              .from("orders")
              .select("client_email")
              .eq("user_id", profile.id)
              .limit(1);
              
            if (orders && orders.length > 0) {
              email = orders[0].client_email || "";
            }
          }
          
          return {
            id: profile.id,
            email: email,
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            phone: profile.phone || "",
            addresses: addresses || [],
            created_at: profile.created_at || new Date().toISOString(),
            loyalty_points: profile.loyalty_points || 0,
            last_sign_in_at: null
          };
        })
      );
      
      setUsers(enrichedUsers);
      setFilteredUsers(enrichedUsers);
      
      toast({
        variant: "default",
        title: "Mode limité",
        description: "Impossible d'accéder à tous les utilisateurs. Affichage limité aux profils existants."
      });
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs"
      });
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = async () => {
    setIsExporting(true);
    try {
      // Get full enriched user data directly from the export function
      const { data: enrichedUsers, error } = await exportUsersData();
      
      if (error) {
        throw error;
      }
      
      if (!enrichedUsers || enrichedUsers.length === 0) {
        toast({
          variant: "destructive",
          title: "Export échoué",
          description: "Aucune donnée utilisateur à exporter"
        });
        return;
      }

      // Définir les en-têtes du CSV avec colonnes additionnelles
      const headers = [
        "ID", 
        "Email", 
        "Prénom", 
        "Nom", 
        "Téléphone", 
        "Adresse principale", 
        "Ville", 
        "Code postal", 
        "Informations supplémentaires",
        "Nombre d'adresses",
        "Points de fidélité",
        "Date d'inscription",
        "Dernière connexion",
        "Nombre de commandes",
        "Montant total des achats"
      ];
      
      // Convertir les données en lignes CSV
      const csvRows = enrichedUsers.map(user => {
        // Adresse par défaut (utiliser la première si disponible)
        const defaultAddress = user.defaultAddress || null;
        
        return [
          user.id,
          user.email,
          user.first_name,
          user.last_name,
          user.phone,
          defaultAddress?.street || "",
          defaultAddress?.city || "",
          defaultAddress?.postal_code || "",
          defaultAddress?.additional_info || "",
          user.addresses.length.toString(),
          user.loyalty_points.toString(),
          formatDate(user.created_at),
          formatDate(user.last_sign_in_at),
          user.totalOrders?.toString() || "0",
          user.totalSpent ? `${user.totalSpent.toFixed(2)} €` : "0.00 €"
        ].map(value => `"${value}"`).join(",");
      });
      
      // Combiner en-têtes et lignes
      const csvContent = [
        headers.join(","),
        ...csvRows
      ].join("\n");
      
      // Créer un Blob et un URL pour le téléchargement
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      // Créer un élément <a> pour le téléchargement
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      
      // Déclencher le téléchargement
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Export réussi",
        description: `${enrichedUsers.length} utilisateurs exportés au format CSV`,
      });
    } catch (error) {
      console.error("Erreur lors de l'export CSV:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible d'exporter les données au format CSV"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "Jamais";
    try {
      return new Date(dateStr).toLocaleDateString("fr-FR", { 
        day: "2-digit", 
        month: "2-digit", 
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch (e) {
      return "Date invalide";
    }
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return "0,00 €";
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount);
  };

  const renderSkeletonRows = () => {
    return Array(5).fill(null).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
        <TableCell><Skeleton className="h-4 w-full" /></TableCell>
      </TableRow>
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Liste des Utilisateurs</h3>
        <Button 
          onClick={exportToCsv} 
          className="flex items-center gap-2"
          disabled={isExporting || loading || filteredUsers.length === 0}
        >
          {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          Exporter en CSV
        </Button>
      </div>
      
      <div className="relative w-full max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un utilisateur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <Card className="border rounded-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Téléphone</TableHead>
              <TableHead>Inscrit le</TableHead>
              <TableHead>Dernière connexion</TableHead>
              <TableHead>Points</TableHead>
              <TableHead>Commandes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              renderSkeletonRows()
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <Collapsible key={user.id} open={expandedUsers.has(user.id)} onOpenChange={() => toggleUserExpanded(user.id)}>
                  <TableRow className="cursor-pointer hover:bg-accent/50" onClick={() => toggleUserExpanded(user.id)}>
                    <TableCell className="w-6">
                      <CollapsibleTrigger asChild>
                        <div>
                          {expandedUsers.has(user.id) ? 
                            <ChevronUp className="h-4 w-4" /> : 
                            <ChevronDown className="h-4 w-4" />}
                        </div>
                      </CollapsibleTrigger>
                    </TableCell>
                    <TableCell>{user.email || "-"}</TableCell>
                    <TableCell>
                      {user.first_name || user.last_name ? `${user.first_name} ${user.last_name}` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user.phone ? <Phone className="h-3 w-3 text-muted-foreground" /> : null}
                        {user.phone || "-"}
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>{formatDate(user.last_sign_in_at)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gold-50">
                        {user.loyalty_points}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {user.totalOrders || 0}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <CollapsibleContent>
                    <TableRow className="bg-muted/30">
                      <TableCell colSpan={8} className="p-4">
                        <div className="space-y-4">
                          {/* Affichage des adresses */}
                          {user.addresses && user.addresses.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                Adresses ({user.addresses.length})
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {user.addresses.map((address) => (
                                  <div key={address.id} className="p-3 rounded-md border bg-card text-sm">
                                    {address.is_default && 
                                      <Badge className="mb-2 bg-blue-100 text-blue-800 hover:bg-blue-200">Par défaut</Badge>
                                    }
                                    <div><span className="font-medium">Rue :</span> {address.street}</div>
                                    <div><span className="font-medium">Ville :</span> {address.city}</div>
                                    <div><span className="font-medium">Code postal :</span> {address.postal_code}</div>
                                    {address.additional_info && 
                                      <div><span className="font-medium">Infos supplémentaires :</span> {address.additional_info}</div>
                                    }
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Aucune adresse enregistrée
                            </p>
                          )}
                          
                          {/* Affichage des commandes récentes */}
                          {user.orders && user.orders.length > 0 ? (
                            <div className="space-y-3">
                              <h4 className="font-medium text-sm flex items-center gap-1">
                                <ShoppingBag className="h-4 w-4" />
                                Commandes récentes ({user.orders.length})
                              </h4>
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left p-2">ID</th>
                                      <th className="text-left p-2">Date</th>
                                      <th className="text-left p-2">Montant</th>
                                      <th className="text-left p-2">Statut</th>
                                      <th className="text-left p-2">Paiement</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {user.orders.map(order => (
                                      <tr key={order.id} className="border-b hover:bg-muted/30">
                                        <td className="p-2">{order.id.substring(0, 8)}...</td>
                                        <td className="p-2">{formatDate(order.created_at)}</td>
                                        <td className="p-2">{formatCurrency(order.total)}</td>
                                        <td className="p-2">
                                          <Badge variant={order.status === 'completed' ? 'success' : 
                                                        order.status === 'cancelled' ? 'destructive' : 'default'}>
                                            {order.status}
                                          </Badge>
                                        </td>
                                        <td className="p-2">
                                          <Badge variant={order.payment_status === 'paid' ? 'success' : 
                                                        order.payment_status === 'failed' ? 'destructive' : 'outline'}>
                                            {order.payment_status}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm font-medium">Total dépensé: {formatCurrency(user.totalSpent)}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              Aucune commande
                            </p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  </CollapsibleContent>
                </Collapsible>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">
                  {searchQuery ? "Aucun utilisateur ne correspond à votre recherche" : "Aucun utilisateur trouvé"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
      <p className="text-sm text-muted-foreground">
        {filteredUsers.length} utilisateur(s) au total
      </p>
    </div>
  );
};

export default UsersList;
