
import { Link } from "react-router-dom";
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Clock } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo et informations */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <div className="flex items-center">
                <img 
                  src="/lovable-uploads/80663134-a018-4c55-8a81-5ee048c700e3.png" 
                  alt="SushiEats Logo" 
                  className="h-12 w-auto"
                />
              </div>
            </Link>
            <p className="text-gray-400 text-sm mt-2">
              Découvrez l'art du sushi à Châteaurenard. Des produits frais préparés avec soin pour une expérience gourmande unique.
            </p>
            <div className="flex space-x-4 mt-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gold-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gold-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gold-500 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-medium text-lg mb-4 border-b border-gray-800 pb-2">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                  Accueil
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-400 hover:text-white transition-colors">
                  Notre Menu
                </Link>
              </li>
              <li>
                <Link to="/commander" className="text-gray-400 hover:text-white transition-colors">
                  Commander en ligne
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-gray-400 hover:text-white transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Horaires */}
          <div>
            <h4 className="font-medium text-lg mb-4 border-b border-gray-800 pb-2">Horaires d'ouverture</h4>
            <div className="flex items-start space-x-2 text-gray-400">
              <Clock size={18} className="mt-1 flex-shrink-0" />
              <div>
                <p className="mb-1">Mardi - Samedi</p>
                <p className="mb-1">11h - 14h | 18h - 22h</p>
                <p className="text-gold-400">Fermé le dimanche et lundi</p>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-medium text-lg mb-4 border-b border-gray-800 pb-2">Contact</h4>
            <div className="space-y-3">
              <div className="flex items-start space-x-2 text-gray-400">
                <MapPin size={18} className="mt-1 flex-shrink-0" />
                <a
                  href="https://maps.google.com/?q=16+cours+Carnot+13160+Chateaurenard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  16 cours Carnot,<br />13160 Châteaurenard
                </a>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Phone size={18} className="flex-shrink-0" />
                <a href="tel:+33490000000" className="hover:text-white transition-colors">
                  04 90 00 00 00
                </a>
              </div>
              <div className="flex items-center space-x-2 text-gray-400">
                <Mail size={18} className="flex-shrink-0" />
                <a href="mailto:contact@sushieats.fr" className="hover:text-white transition-colors">
                  contact@sushieats.fr
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SushiEats. Tous droits réservés.
          </p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <Link to="/mentions-legales" className="text-gray-500 text-sm hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link to="/cgv" className="text-gray-500 text-sm hover:text-white transition-colors">
              CGV
            </Link>
            <Link to="/confidentialite" className="text-gray-500 text-sm hover:text-white transition-colors">
              Politique de confidentialité
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
