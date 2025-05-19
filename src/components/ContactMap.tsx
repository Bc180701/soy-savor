
import { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface ContactMapProps {
  longitude?: number;
  latitude?: number;
  address?: string;
}

const ContactMap = ({ 
  longitude = 4.853931, 
  latitude = 43.883025, 
  address = "SushiEats Restaurant" 
}: ContactMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    // Vérifier si le container existe
    if (!mapContainer.current) return;

    // Token MapBox - dans un environnement de production, utilisez les secrets de Supabase
    const MAPBOX_TOKEN = "pk.eyJ1IjoiZXhhbXBsZXVzZXIiLCJhIjoiY2xxeW04aXQwMDd0YjJrcGZvenRyMG9ociJ9.D4h-NiZq_PVc8Cm2QWv1vA";
    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Initialiser la carte
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [longitude, latitude],
      zoom: 15,
      scrollZoom: false // Désactiver le zoom par scroll pour éviter les problèmes sur mobile
    });

    // Ajouter les contrôles de navigation
    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Créer et ajouter un marqueur
    marker.current = new mapboxgl.Marker({
      color: "#b8860b"
    })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    // Ajouter un popup avec l'adresse
    if (address) {
      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: false
      }).setHTML(`<div class="font-medium text-sm">${address}</div>`);
      
      marker.current.setPopup(popup);
      popup.addTo(map.current); // Afficher le popup dès le chargement
    }

    // Nettoyage
    return () => {
      map.current?.remove();
    };
  }, [longitude, latitude, address]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-full rounded-lg overflow-hidden shadow-md"
    />
  );
};

export default ContactMap;
