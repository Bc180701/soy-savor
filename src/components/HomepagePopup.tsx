import { useEffect, useState } from "react";
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

  useEffect(() => {
    if (!data?.enabled || !data?.image_url) return;
    const target = data.display_on;
    if (target !== "both" && target !== page) return;

    const dismissed = sessionStorage.getItem(storageKey(page));
    if (dismissed) return;

    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
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
      window.location.href = data.button_link;
    }
    handleClose();
  };

  if (!data?.enabled || !data?.image_url) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? handleClose() : setOpen(o))}>
      <DialogContent className="p-0 max-w-[340px] bg-transparent border-0 shadow-none [&>button]:hidden">
        <DialogTitle className="sr-only">Annonce</DialogTitle>
        <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl">
          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            className="absolute top-2 right-2 z-10 bg-white/80 hover:bg-white rounded-full p-1.5 shadow"
          >
            <X className="h-4 w-4 text-gray-700" />
          </button>
          <div className="aspect-[3/4] w-full">
            <img
              src={data.image_url}
              alt="Annonce"
              className="w-full h-full object-cover"
            />
          </div>
          {data.button_text && (
            <div className="p-3">
              <Button
                onClick={handleClick}
                className="w-full bg-gold-600 hover:bg-gold-700 text-white"
              >
                {data.button_text}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HomepagePopup;
