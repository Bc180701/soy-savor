export const cateringServices = [
  "Plateaux & assortiments de sushis",
  "Buffets gastronomiques",
  "Cocktails dînatoires",
  "Animations culinaires & ateliers de dégustation",
  "Scénographie & art de la table",
  "Prestations événementielles sur mesure",
  "Accompagnement & conseil personnalisé",
] as const;

export const businessEventTypes = ["Repas d’équipe", "Séminaire", "Cocktail professionnel", "Inauguration", "Réception d’entreprise", "Soirée d’entreprise", "Autre événement"];
export const privateEventTypes = ["Mariage", "Anniversaire", "Réception privée", "Célébration familiale", "Soirée privée", "Autre événement"];

export function formatCateringNeeds(services: string[], description: string): string {
  return [services.length ? `Prestations souhaitées :\n${services.map(service => `• ${service}`).join("\n")}` : "", description.trim() ? `Projet :\n${description.trim()}` : ""].filter(Boolean).join("\n\n");
}