import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PopupSection } from "@/hooks/useHomepageData";

interface Props {
  data?: PopupSection;
  page: "home" | "commander";
}

const storageKey = (page: string) => `popup_dismissed_${page}`;

const HomepagePopup = ({ data, page }: Props) => {
  const [open, setOpen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!data?.enabled || !data?.image_url) return;
    const target = data.display_on;
    if (target !== "both" && target !== page) return;

    const dismissed = sessionStorage.getItem(storageKey(page));
    if (dismissed) return;

    let cancelled = false;
    const img = new Image();
    img.src = data.image_url;
    const onReady = () => {
      if (cancelled) return;
      setImageLoaded(true);
      setTimeout(() => !cancelled && setOpen(true), 300);
    };
    if (img.complete && img.naturalWidth > 0) {
      onReady();
    } else {
      img.onload = onReady;
      img.onerror = () => {}; // n'affiche pas si erreur
    }
    return () => {
      cancelled = true;
    };
  }, [data, page]);

  const handleClose = () => {
    sessionStorage.setItem(storageKey(page), "1");
    setOpen(false);
  };

  const handleClick = () => {
    if (!data?.button_link) return;
    if (/^https?:\/\//i.test(data.button_link)) {
      window.open(data.button_link, "_blank", "noopener,noreferrer");
    } else {
      // Navigation SPA pour éviter un rechargement complet (qui provoquait un flash de sélection restaurant)
      navigate(data.button_link);
      // Forcer le déclenchement du scroll d'ancre si on est déjà sur la même route
      setTimeout(() => {
        window.dispatchEvent(new HashChangeEvent("hashchange"));
      }, 50);
    }
    handleClose();
  };

  if (!data?.enabled || !data?.image_url) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : setOpen(o))}>
      <DialogContent className="p-0 max-w-[425px] bg-transparent border-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">{data.title || "Annonce"}</DialogTitle>
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full p-1.5 shadow"
          >
            <X className="h-4 w-4 text-gray-700" />
          </button>
          <img
            src={data.image_url}
            alt={data.title || "Annonce"}
            className="w-full h-auto block"
          />

          {(data.title || data.description || data.button_text) && (
            <div className="p-4 space-y-3">
              {data.title && (
                <h2 className="text-lg font-semibold text-gray-900 text-center">
                  {data.title}
                </h2>
              )}
              {data.description && (
                <p className="text-sm text-gray-600 text-center whitespace-pre-line">
                  {data.description}
                </p>
              )}
              {data.button_text && (
                <Button
                  onClick={handleClick}
                  className="w-full bg-gold-600 hover:bg-gold-700 text-white"
                >
                  {data.button_text}
                </Button>
              )}
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
};

export default HomepagePopup;
