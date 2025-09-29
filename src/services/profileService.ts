
import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";

/**
 * Récupère les informations de profil de l'utilisateur
 * @returns {Promise<{profile: any, address: any, error: any}>}
 */
export const getUserProfile = async () => {
  try {
    // Récupérer la session utilisateur
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { profile: null, address: null, error: "Utilisateur non connecté" };
    }

    // Récupérer le profil utilisateur
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Erreur lors de la récupération du profil:", profileError);
      return { profile: null, address: null, error: profileError };
    }

    // Récupérer l'adresse par défaut
    const { data: addressData, error: addressError } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("is_default", true)
      .maybeSingle();

    if (addressError && addressError.code !== "PGRST116") {
      console.error("Erreur lors de la récupération de l'adresse:", addressError);
      return { profile: profileData, address: null, error: addressError };
    }

    return { 
      profile: profileData, 
      address: addressData, 
      error: null 
    };
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return { profile: null, address: null, error };
  }
};

/**
 * Enregistre les informations de profil de l'utilisateur
 * @param {Object} profileData - Données du profil à enregistrer
 * @returns {Promise<{success: boolean, error: any}>}
 */
export const saveUserProfile = async (profileData: {
  firstName: string;
  lastName: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  additionalInfo?: string;
}) => {
  try {
    // Récupérer la session utilisateur
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: "Utilisateur non connecté" };
    }

    console.log("Enregistrement du profil pour l'utilisateur:", session.user.id);
    console.log("Données du profil:", profileData);

    // Mettre à jour le profil
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        id: session.user.id,
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
      });

    if (profileError) {
      console.error("Erreur lors de la mise à jour du profil:", profileError);
      return { success: false, error: profileError };
    }

    // Vérifier si l'adresse existe déjà
    const { data: existingAddress, error: checkError } = await supabase
      .from("user_addresses")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("is_default", true)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Erreur lors de la vérification de l'adresse:", checkError);
      return { success: false, error: checkError };
    }

    // Si l'adresse existe, la mettre à jour
    if (existingAddress) {
      const { error: addressError } = await supabase
        .from("user_addresses")
        .update({
          street: profileData.street,
          city: profileData.city,
          postal_code: profileData.postalCode,
          additional_info: profileData.additionalInfo || "",
        })
        .eq("id", existingAddress.id);

      if (addressError) {
        console.error("Erreur lors de la mise à jour de l'adresse:", addressError);
        return { success: false, error: addressError };
      }
    } 
    // Sinon, créer une nouvelle adresse
    else {
      const { error: addressError } = await supabase
        .from("user_addresses")
        .insert({
          user_id: session.user.id,
          street: profileData.street,
          city: profileData.city,
          postal_code: profileData.postalCode,
          additional_info: profileData.additionalInfo || "",
          is_default: true,
        });

      if (addressError) {
        console.error("Erreur lors de la création de l'adresse:", addressError);
        return { success: false, error: addressError };
      }
    }

    console.log("Profil enregistré avec succès");
    return { success: true, error: null };
  } catch (error) {
    console.error("Erreur inattendue lors de l'enregistrement du profil:", error);
    return { success: false, error };
  }
};

/**
 * Récupère les informations de contact de l'utilisateur pour une commande
 * @returns {Promise<{name: string, email: string, phone: string}>}
 */
export const getUserContactInfo = async (): Promise<{ name: string, email: string, phone: string }> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { name: "", email: "", phone: "" };
    }

    // Récupérer l'email depuis la session
    const email = session.user.email || "";

    // Récupérer le profil
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, phone")
      .eq("id", session.user.id)
      .maybeSingle();

    if (profile) {
      const name = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      return {
        name,
        email,
        phone: profile.phone || "",
      };
    }

    return { name: "", email, phone: "" };
  } catch (error) {
    console.error("Erreur lors de la récupération des informations de contact:", error);
    return { name: "", email: "", phone: "" };
  }
};
