
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useHomepageData } from "@/hooks/useHomepageData";

interface DesktopNavLinksProps {
  navLinks: { name: string; path: string }[];
}

const DesktopNavLinks = ({ navLinks }: DesktopNavLinksProps) => {
  const location = useLocation();
  const { data: homepageData } = useHomepageData();
  
  // Use configured texts or fall back to defaults
  const getNavLinkText = (path: string, defaultText: string) => {
    if (!homepageData?.header_section) return defaultText;
    
    switch (path) {
      case "/":
        return homepageData.header_section.nav_links.home;
      case "/carte":
      case "/menu":
        return homepageData.header_section.nav_links.menu;
      case "/commander":
        return homepageData.header_section.nav_links.order;
      case "/contact":
        return homepageData.header_section.nav_links.contact;
      default:
        return defaultText;
    }
  };
  
  return (
    <nav className="hidden md:flex items-center space-x-8">
      {navLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`text-sm font-medium relative overflow-hidden group ${
            location.pathname === link.path
              ? "text-gold-500"
              : "text-gray-800 hover:text-gold-500"
          }`}
        >
          {getNavLinkText(link.path, link.name)}
          <motion.span
            className="absolute bottom-0 left-0 w-full h-0.5 bg-gold-500 transform scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100"
            initial={false}
            animate={
              location.pathname === link.path ? { scaleX: 1 } : { scaleX: 0 }
            }
            transition={{ duration: 0.3 }}
          />
        </Link>
      ))}
    </nav>
  );
};

export default DesktopNavLinks;
