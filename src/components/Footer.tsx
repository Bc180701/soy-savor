
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ContactInfo, useHomepageData } from "@/hooks/useHomepageData";

const Footer = () => {
  const { data: homepageData } = useHomepageData();

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

          {/* Nos Restaurants */}
          <div>
            <h4 className="font-medium text-lg mb-4 border-b border-gray-800 pb-2">
              Nos Restaurants
            </h4>
            <div className="space-y-3">
              <p className="text-gray-400 text-sm">
                Découvrez tous nos restaurants et leurs horaires d'ouverture.
              </p>
              <Link 
                to="/nos-restaurants" 
                className="inline-block text-gold-500 hover:text-gold-400 transition-colors font-medium"
              >
                Voir tous nos restaurants →
              </Link>
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
