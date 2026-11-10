import { useState } from "react";
import { ArrowDown, ArrowRight, Building2, Heart, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import SEOHead from "@/components/SEOHead";
import QuoteForm from "@/components/traiteur/QuoteForm";
import hero from "@/assets/traiteur/table-partage.jpg.asset.json";
import business from "@/assets/traiteur/plateau-entreprise.jpg.asset.json";
import privateEvent from "@/assets/traiteur/evenement-prive.jpg.asset.json";
import poke from "@/assets/traiteur/poke-bowl.jpg.asset.json";
import plateau from "@/assets/traiteur/plateau-signature.jpg.asset.json";
import table from "@/assets/traiteur/sashimi-table.jpg.asset.json";

export default function Traiteur() {
  const [audience, setAudience] = useState<"business" | "private" | null>(null);
  return <>
    <SEOHead title="Traiteur SushiEats — Entreprises & événements privés" description="SushiEats accompagne vos événements professionnels et privés. Présentez votre projet et demandez un devis traiteur personnalisé." canonical="https://sushi-eats.lovable.app/traiteur" ogType="website" />
    <div className="traiteur-page">
      <section className="relative isolate min-h-[620px] md:min-h-[700px] flex items-end pt-32 pb-20 overflow-hidden">
        <img src={hero.url} alt="Table SushiEats avec plateaux de sushi et pokés à partager" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_58%]" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-catering-ink/55" />
        <div className="container px-6 md:px-12 text-catering-on-dark">
          <p className="uppercase text-sm font-medium mb-5 text-catering-accent">Entreprises & événements privés</p>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.12] max-w-3xl">SushiEats<br /><span className="italic">Traiteur</span></h1>
          <p className="mt-6 text-lg max-w-md leading-relaxed">Des sushis à partager.<br />Un événement qui vous ressemble.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button size="lg" className="bg-catering-accent text-catering-ink hover:bg-catering-accent/90" asChild><a href="#entreprises">Pour mon entreprise <ArrowRight /></a></Button>
            <Button size="lg" variant="outline" className="border-catering-on-dark/60 bg-transparent text-catering-on-dark hover:bg-catering-on-dark/15 hover:text-catering-on-dark" asChild><a href="#particuliers">Pour mon événement <ArrowRight /></a></Button>
          </div>
        </div>
        <a href="#entreprises" aria-label="Découvrir les prestations traiteur" className="absolute bottom-5 right-6 text-catering-on-dark"><ArrowDown size={24} /></a>
      </section>
      <section className="py-14 md:py-20 border-b border-border">
        <div className="container px-6 md:px-12 grid md:grid-cols-[1fr_1.2fr] gap-6 md:gap-16 items-center">
          <h2 className="font-serif text-3xl md:text-4xl">Le plaisir de partager,<br /><span className="italic">signé SushiEats.</span></h2>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">Un rendez-vous professionnel ou une célébration privée : racontez-nous votre événement et vos envies pour une demande de devis personnalisée.</p>
        </div>
      </section>
      <section id="entreprises" className="scroll-mt-24 py-16 md:py-24">
        <div className="container px-6 md:px-12 grid md:grid-cols-2 gap-10 md:gap-20 items-center">
          <img src={business.url} alt="Plateau de sushi SushiEats présenté pour un repas à partager" className="w-full aspect-[4/5] object-cover max-h-[560px]" loading="lazy" />
          <div><Building2 className="text-catering-accent mb-5" size={28} /><p className="text-sm uppercase text-muted-foreground mb-3">Vos rendez-vous professionnels</p><h2 className="font-serif text-4xl md:text-5xl leading-tight">Traiteur<br /><span className="italic">entreprises</span></h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">Repas d’équipe, séminaire, réception ou événement d’entreprise : réunissez vos collaborateurs et vos invités autour de SushiEats.</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">Précisez la date, le lieu, le nombre de personnes et vos besoins pour nous présenter votre projet.</p>
            <Button size="lg" onClick={() => setAudience("business")} className="mt-8 bg-catering-accent text-catering-ink hover:bg-catering-accent/90">Demander un devis entreprise <ArrowRight /></Button>
          </div>
        </div>
      </section>
      <section id="particuliers" className="scroll-mt-24 py-16 md:py-24 bg-secondary/50">
        <div className="container px-6 md:px-12 grid md:grid-cols-2 gap-10 md:gap-20 items-center">
          <div className="order-2 md:order-1"><Heart className="text-catering-accent mb-5" size={28} /><p className="text-sm uppercase text-muted-foreground mb-3">Vos moments à célébrer</p><h2 className="font-serif text-4xl md:text-5xl leading-tight">Événements<br /><span className="italic">privés</span></h2>
            <p className="mt-6 text-muted-foreground leading-relaxed">Anniversaire, mariage, fête de famille ou retrouvailles entre amis : faites une place à SushiEats dans les moments qui comptent.</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">Parlez-nous de vos envies et des besoins de vos invités pour une demande adaptée à votre événement.</p>
            <Button size="lg" onClick={() => setAudience("private")} className="mt-8 bg-catering-accent text-catering-ink hover:bg-catering-accent/90">Demander un devis événement <ArrowRight /></Button>
          </div>
          <img src={privateEvent.url} alt="Assortiment de plats SushiEats sur une table pour un événement privé" className="order-1 md:order-2 w-full aspect-[4/5] object-cover max-h-[560px]" loading="lazy" />
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container px-6 md:px-12"><div className="flex flex-wrap items-end justify-between gap-4 mb-9"><h2 className="font-serif text-3xl md:text-4xl">À la table de <span className="italic">SushiEats</span></h2><span className="text-sm text-muted-foreground">Le goût du partage</span></div>
          <div className="grid grid-cols-3 gap-3 md:gap-6">{[{ asset: poke, alt: "Poké SushiEats" }, { asset: plateau, alt: "Plateau de sushi à partager" }, { asset: table, alt: "Sushis et sashimis SushiEats" }].map(item => <img key={item.asset.asset_id} src={item.asset.url} alt={item.alt} className="w-full aspect-[3/4] object-cover" loading="lazy" />)}</div>
        </div>
      </section>
      <section className="bg-catering-ink text-catering-on-dark py-16 md:py-20 text-center"><div className="container px-6"><h2 className="font-serif text-3xl md:text-4xl">Votre prochain événement,<br /><span className="italic text-catering-accent">on en parle ?</span></h2><a href="mailto:contact@sushieats.fr" className="inline-flex items-center gap-2 mt-6 underline underline-offset-4"><Mail size={18} />contact@sushieats.fr</a></div></section>
    </div>
    <Dialog open={audience !== null} onOpenChange={open => { if (!open) setAudience(null); }}><DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-serif text-2xl">{audience === "business" ? "Votre devis traiteur entreprise" : "Votre devis pour un événement privé"}</DialogTitle><DialogDescription>Parlez-nous de votre projet.</DialogDescription></DialogHeader>
      {audience && <QuoteForm key={audience} audience={audience} />}
    </DialogContent></Dialog>
  </>;
}