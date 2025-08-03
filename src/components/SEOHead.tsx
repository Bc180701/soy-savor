import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  structuredData?: object;
}

const SEOHead = ({ 
  title, 
  description, 
  canonical, 
  keywords, 
  ogImage = "/lovable-uploads/08b9952e-cd9a-4377-9a76-11adb9daba70.png",
  ogType = "website",
  structuredData 
}: SEOHeadProps) => {
  
  useEffect(() => {
    // Update document title
    document.title = title;
    
    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description);
    }
    
    // Update or create meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (keywords) {
      if (metaKeywords) {
        metaKeywords.setAttribute('content', keywords);
      } else {
        const keywordsTag = document.createElement('meta');
        keywordsTag.name = 'keywords';
        keywordsTag.content = keywords;
        document.head.appendChild(keywordsTag);
      }
    }
    
    // Update canonical URL
    const canonicalLink = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      if (canonicalLink) {
        canonicalLink.setAttribute('href', canonical);
      } else {
        const canonicalTag = document.createElement('link');
        canonicalTag.rel = 'canonical';
        canonicalTag.href = canonical;
        document.head.appendChild(canonicalTag);
      }
    }
    
    // Update Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) {
      ogTitle.setAttribute('content', title);
    }
    
    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) {
      ogDescription.setAttribute('content', description);
    }
    
    const ogImageTag = document.querySelector('meta[property="og:image"]');
    if (ogImageTag) {
      ogImageTag.setAttribute('content', ogImage);
    }
    
    const ogTypeTag = document.querySelector('meta[property="og:type"]');
    if (ogTypeTag) {
      ogTypeTag.setAttribute('content', ogType);
    }
    
    // Update Twitter Card tags
    const twitterImage = document.querySelector('meta[name="twitter:image"]');
    if (twitterImage) {
      twitterImage.setAttribute('content', ogImage);
    }
    
    // Add structured data if provided
    if (structuredData) {
      const existingStructuredData = document.querySelector('script[type="application/ld+json"]');
      if (existingStructuredData) {
        existingStructuredData.remove();
      }
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(structuredData);
      document.head.appendChild(script);
    }
    
    // Cleanup function
    return () => {
      // Reset to default title if needed
      if (document.title !== 'Sushieats.fr - Commandez en ligne') {
        // Don't reset to avoid flickering
      }
    };
  }, [title, description, canonical, keywords, ogImage, ogType, structuredData]);
  
  return null; // This component doesn't render anything
};

export default SEOHead;