
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContactInfo, useHomepageData } from "@/hooks/useHomepageData";

const Footer = () => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: "16 cours Carnot, 13160 Châteaurenard",
    phone: "04 90 00 00 00",
    email: "contact@sushieats.fr"
  });
  const { data: homepageData } = useHomepageData();

  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const { data, error } = await supabase
          .from('homepage_sections')
          .select('section_data')
          .eq('section_name', 'contact_info')
          .single();
        
        if (error) {
          console.error("Erreur lors de la récupération des coordonnées de contact:", error);
          return;
        }
        
        if (data && data.section_data) {
          setContactInfo(data.section_data as unknown as ContactInfo);
        }
      } catch (error) {
        console.error("Exception lors de la récupération des coordonnées de contact:", error);
      }
    };
    
    fetchContactInfo();
  }, []);

  const footerData = homepageData?.footer_section;

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Logo et informations */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png" 
                  alt={homepageData?.header_section?.logo_alt || "SushiEats Logo"} 
                  className="h-12 w-auto"
                />
              </div>
            </Link>
            <p className="text-gray-400 text-sm mt-2">
              {footerData?.company_description || "Découvrez l'art du sushi à Châteaurenard. Des produits frais préparés avec soin pour une expérience gourmande unique."}
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gold-500 transition-colors"
                aria-label={footerData?.social_links?.facebook_aria || "Facebook"}
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gold-500 transition-colors"
                aria-label={footerData?.social_links?.instagram_aria || "Instagram"}
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gold-500 transition-colors"
                aria-label={footerData?.social_links?.linkedin_aria || "LinkedIn"}
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-medium text-lg mb-4 border-b border-gray-800 pb-2">
              {footerData?.navigation_title || "Navigation"}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  {homepageData?.header_section?.nav_links?.home || "Accueil"}
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-400 hover:text-white transition-colors">
                  {homepageData?.header_section?.nav_links?.menu || "Notre Menu"}
                </Link>
              </li>
              <li>
                <Link to="/commander" className="text-gray-400 hover:text-white transition-colors">
                  {homepageData?.header_section?.nav_links?.order || "Commander en ligne"}
                </Link>
              </li>
              <li>
                <Link to="/nos-restaurants" className="text-gray-400 hover:text-white transition-colors">
                  Nos Restaurants
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  {homepageData?.header_section?.nav_links?.contact || "Contact"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium text-lg mb-4 border-b border-gray-800 pb-2">
              {footerData?.contact_title || "Contact"}
            </h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-gray-400">
                <MapPin size={18} className="flex-shrink-0" />
                <Link 
                  to="/nos-restaurants" 
                  className="hover:text-white transition-colors"
                >
                  Trouvez nos restaurants
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} {footerData?.copyright_text || "SushiEats. Tous droits réservés."}
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/mentions-legales" className="text-gray-500 text-sm hover:text-white transition-colors">
              {footerData?.legal_links?.mentions_legales || "Mentions légales"}
            </Link>
            <Link to="/cgv" className="text-gray-500 text-sm hover:text-white transition-colors">
              {footerData?.legal_links?.cgv || "CGV"}
            </Link>
            <Link to="/confidentialite" className="text-gray-500 text-sm hover:text-white transition-colors">
              {footerData?.legal_links?.confidentialite || "Politique de confidentialité"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
