
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface HeroSectionProps {
  background_image: string;
  title: string;
  subtitle: string;
}

export const HeroSection = ({ background_image, title, subtitle }: HeroSectionProps) => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure smooth transition when the component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section
      className="relative min-h-[85vh] flex items-center pt-16 overflow-hidden"
    >
      {/* Image de fond */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 z-5 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{ backgroundImage: `url(${background_image})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Grand logo en arrière-plan à droite - devant l'image */}
      <div 
        className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-15 transition-all duration-700 ${
          isLoaded ? "opacity-30" : "opacity-0"
        }`}
      >
        <img 
          src="/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png" 
          alt="SushiEats Logo Background" 
          className="h-96 md:h-[500px] lg:h-[600px] w-auto"
        />
      </div>

      <div className="container mx-auto px-4 relative z-20">
        <div className="max-w-2xl">
          <h1 
            className={`text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 transition-all duration-700 delay-200 better-times-gold-gradient ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            dangerouslySetInnerHTML={{ __html: title }}
          />
          
          <p 
            className={`text-xl md:text-2xl text-gray-100 mb-8 transition-all duration-700 delay-300 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            {subtitle}
          </p>
          
          <div 
            className={`transition-all duration-700 delay-500 ${
              isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
          >
            <Button asChild size="lg" className="bg-gold-300 hover:bg-gold-400 text-gray-800 border-2 border-gold-300 font-semibold">
              <Link to="/commander">Commander maintenant</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
