
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  width?: number;
  height?: number;
  objectFit?: "contain" | "cover" | "fill" | "none" | "scale-down";
  priority?: boolean;
  placeholder?: string;
}

const OptimizedImage = ({
  src,
  alt,
  className = "",
  onClick,
  width,
  height,
  objectFit = "cover",
  priority = false,
  placeholder = "/placeholder.svg"
}: OptimizedImageProps) => {
  const [isLoading, setIsLoading] = useState(!priority);
  const [imgSrc, setImgSrc] = useState(priority ? src : placeholder);
  const [hasError, setHasError] = useState(false);
  
  // Load image after component mounts (lazy loading) unless priority is true
  useEffect(() => {
    if (!priority) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImgSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        setHasError(true);
        setIsLoading(false);
        setImgSrc(placeholder);
      };
    }
  }, [src, priority, placeholder]);

  // Handle direct image errors
  const handleImageError = () => {
    console.error(`Error displaying image: ${src}`);
    setHasError(true);
    setImgSrc(placeholder);
  };
  
  return (
    <div
      className={`relative ${className}`}
      style={{ width: width ? `${width}px` : "100%", height: height ? `${height}px` : "auto" }}
    >
      {isLoading && (
        <Skeleton 
          className="absolute inset-0 z-10 rounded-md" 
        />
      )}
      <img
        src={imgSrc}
        alt={alt}
        className={`w-full h-full transition-opacity duration-300 ${
          isLoading ? "opacity-0" : "opacity-100"
        } ${onClick ? "cursor-pointer" : ""}`}
        style={{ objectFit }}
        onClick={onClick}
        onError={handleImageError}
        loading={priority ? "eager" : "lazy"}
      />
    </div>
  );
};

export default OptimizedImage;
