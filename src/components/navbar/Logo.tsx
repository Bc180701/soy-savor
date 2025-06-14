
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useHomepageData } from "@/hooks/useHomepageData";

const Logo = () => {
  const { data: homepageData } = useHomepageData();
  
  return (
    <Link to="/" className="relative z-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center"
      >
        <img 
          src="/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png" 
          alt={homepageData?.header_section?.logo_alt || "SushiEats Logo"} 
          className="h-12 w-auto"
        />
      </motion.div>
    </Link>
  );
};

export default Logo;
