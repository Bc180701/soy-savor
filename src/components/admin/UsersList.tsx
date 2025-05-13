
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type UserProfile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  addresses: Array<{
    street: string;
    city: string;
    postal_code: string;
    additional_info?: string;
  }>;
  created_at: string;
  loyalty_points: number;
};

const UsersList = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isExporting, setIsExporting] = useState(false);
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
            user.phone?.toLowerCase().includes(lowercaseQuery)
        )
      );
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Récupérer les utilisateurs depuis auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // Pour chaque utilisateur, récupérer son profil et ses adresses
      const enrichedUsers = await Promise.all(
        authUsers.users.map(async (user) => {
          // Récupérer le profil
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
            
          if (profileError && profileError.code !== "PGRST116") {
            console.error(`Erreur lors de la récupération du profil pour ${user.id}:`, profileError);
          }
          
          // Récupérer les adresses
          const { data: addresses, error: addressesError } = await supabase
            .from("user_addresses")
            .select("*")
            .eq("user_id", user.id);
            
          if (addressesError) {
            console.error(`Erreur lors de la récupération des adresses pour ${user.id}:`, addressesError);
          }
          
          return {
            id: user.id,
            email: user.email || "",
            first_name: profile?.first_name || "",
            last_name: profile?.last_name || "",
            phone: profile?.phone || "",
            addresses: addresses || [],
            created_at: user.created_at,
            loyalty_points: profile?.loyalty_points || 0
          };
        })
      );
      
      setUsers(enrichedUsers);
      setFilteredUsers(enrichedUsers);
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Impossible de charger la liste des utilisateurs"
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCsv = () => {
    setIsExporting(true);
    try {
      // Définir les en-têtes du CSV
      const headers = [
        "ID", 
        "Email", 
        "Prénom", 
        "Nom", 
        "Téléphone", 
        "Adresse", 
        "Ville", 
        "Code postal", 
        "Informations supplémentaires",
        "Date d'inscription",
        "Points de fidélité"
      ];
      
      // Convertir les données en lignes CSV
      const csvRows = filteredUsers.map(user => {
        // Adresse par défaut (utiliser la première si disponible)
        const defaultAddress = user.addresses && user.addresses.length > 0 ? user.addresses[0] : null;
        
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
          new Date(user.created_at).toLocaleDateString("fr-FR"),
          user.loyalty_points.toString()
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
        description: `${filteredUsers.length} utilisateurs exportés au format CSV`,
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
      
      {loading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      ) : (
        <>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Adresse</TableHead>
                  <TableHead>Points</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>
                        {user.addresses && user.addresses.length > 0 ? (
                          <span>
                            {user.addresses[0].street}, {user.addresses[0].postal_code} {user.addresses[0].city}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{user.loyalty_points}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                      {searchQuery ? "Aucun utilisateur ne correspond à votre recherche" : "Aucun utilisateur trouvé"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredUsers.length} utilisateur(s) au total
          </p>
        </>
      )}
    </div>
  );
};

export default UsersList;
