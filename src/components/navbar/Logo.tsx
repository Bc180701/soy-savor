
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const Logo = () => {
  return (
    <Link to="/" className="relative z-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center"
      >
        <img 
          src="/lovable-uploads/80663134-a018-4c55-8a81-5ee048c700e3.png" 
          alt="SushiEats Logo" 
          className="h-12 w-auto"
        />
      </motion.div>
    </Link>
  );
};

export default Logo;
