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
    <SEOHead title="Sushi Eats Événements & Traiteur" description="Bien plus qu’un traiteur, une expérience à partager. Créations gourmandes, buffets soignés et animations culinaires pour vos événements professionnels et privés." canonical="https://sushi-eats.lovable.app/traiteur" ogType="website" />
    <div className="traiteur-page">
      <section className="relative isolate min-h-[560px] md:min-h-[600px] flex items-center py-24 md:py-28 overflow-hidden">
        <img src={hero.url} alt="Table SushiEats avec plateaux de sushi et pokés à partager" className="absolute inset-0 -z-20 h-full w-full object-cover object-[center_58%]" fetchPriority="high" />
        <div className="absolute inset-0 -z-10 bg-catering-ink/60" />
        <div className="container px-4 text-catering-on-dark">
          <p className="text-sm md:text-base font-medium mb-4">Entreprises & événements privés</p>
          <h1 className="font-display text-catering-accent text-3xl md:text-5xl lg:text-6xl leading-tight max-w-4xl">Sushi Eats<br />Événements & Traiteur</h1>
          <p className="mt-6 text-lg md:text-xl max-w-2xl leading-relaxed">Bien plus qu'un traiteur, une expérience à partager.</p>
          <p className="mt-3 text-base md:text-lg max-w-2xl leading-relaxed">Des créations gourmandes, des buffets soignés et des animations culinaires pour donner une autre dimension à vos événements.</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Button size="lg" variant="destructive" className="font-semibold whitespace-normal h-auto min-h-11" asChild><a href="#entreprises">Pour mon entreprise <ArrowRight /></a></Button>
            <Button size="lg" variant="outline" className="border-catering-accent bg-transparent text-catering-accent hover:bg-catering-accent hover:text-catering-ink font-semibold whitespace-normal h-auto min-h-11" asChild><a href="#particuliers">Pour mon événement <ArrowRight /></a></Button>
          </div>
        </div>
        <a href="#entreprises" aria-label="Découvrir les prestations traiteur" className="absolute bottom-5 right-6 text-catering-on-dark"><ArrowDown size={24} /></a>
      </section>
      <section className="py-14 md:py-20 border-b border-border">
        <div className="container px-4 grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          <div><h2 className="font-display text-catering-accent text-2xl md:text-3xl leading-tight">Bien plus qu’un traiteur, une expérience à partager.</h2>
          <p className="mt-6 text-lg leading-relaxed">SushiEats donne une autre dimension à vos réceptions.</p>
          <p className="mt-4 text-muted-foreground leading-relaxed">Des créations gourmandes, des buffets soignés et des animations culinaires pour faire de chaque événement un moment unique.</p></div>
          <img src={table.url} alt="Créations SushiEats sur une table de réception" className="w-full aspect-[4/3] object-cover rounded-lg" loading="lazy" />
        </div>
      </section>
      <section id="entreprises" className="scroll-mt-24 py-16 md:py-24">
        <div className="container px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <img src={business.url} alt="Plateau de sushi SushiEats présenté pour un repas à partager" className="w-full aspect-[4/5] object-cover max-h-[560px] rounded-lg" loading="lazy" />
          <div><Building2 className="text-catering-accent mb-5" size={28} /><p className="text-sm text-muted-foreground mb-3">Vos rendez-vous professionnels</p><h2 className="font-display text-catering-accent text-3xl md:text-4xl leading-tight">Traiteur entreprises</h2>
            <p className="mt-6 text-lg leading-relaxed">Faites de vos événements professionnels un moment de partage.</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">Repas d’équipe, séminaires ou soirées d’entreprise : régalez vos collaborateurs avec l’univers SushiEats.</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">Plateaux, buffets et cocktails dînatoires : nous imaginons une prestation adaptée à vos envies.</p>
            <Button size="lg" variant="destructive" onClick={() => setAudience("business")} className="mt-8 font-semibold whitespace-normal h-auto min-h-11">Votre projet événementiel <ArrowRight /></Button>
          </div>
        </div>
      </section>
      <section id="particuliers" className="scroll-mt-24 py-16 md:py-24 bg-secondary/50">
        <div className="container px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div className="order-2 md:order-1"><Heart className="text-catering-accent mb-5" size={28} /><p className="text-sm text-muted-foreground mb-3">Vos moments à célébrer</p><h2 className="font-display text-catering-accent text-3xl md:text-4xl leading-tight">Événements privés</h2>
            <p className="mt-6 text-lg leading-relaxed">Les plus beaux moments sont ceux que l’on partage.</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">Mariages, anniversaires, réceptions privées, célébrations familiales ou soirées d’exception : faites de vos belles occasions un moment signé SushiEats.</p>
            <p className="mt-4 text-muted-foreground leading-relaxed">Plateaux raffinés, buffets généreux et cocktails dînatoires : nous imaginons une expérience gourmande et personnalisée, à la hauteur de vos envies et de vos invités.</p>
            <Button size="lg" variant="destructive" onClick={() => setAudience("private")} className="mt-8 font-semibold whitespace-normal h-auto min-h-11">Votre projet événementiel <ArrowRight /></Button>
          </div>
          <img src={privateEvent.url} alt="Assortiment de plats SushiEats sur une table pour un événement privé" className="order-1 md:order-2 w-full aspect-[4/5] object-cover max-h-[560px] rounded-lg" loading="lazy" />
        </div>
      </section>
      <section className="py-16 md:py-24">
        <div className="container px-4"><div className="flex flex-wrap items-end justify-between gap-4 mb-9"><h2 className="font-display text-catering-accent text-2xl md:text-3xl">À la table de SushiEats</h2><span className="text-sm text-muted-foreground">Le goût du partage</span></div>
          <div className="grid grid-cols-3 gap-3 md:gap-6">{[{ asset: poke, alt: "Poké SushiEats" }, { asset: plateau, alt: "Plateau de sushi à partager" }, { asset: table, alt: "Sushis et sashimis SushiEats" }].map(item => <img key={item.asset.asset_id} src={item.asset.url} alt={item.alt} className="w-full aspect-[3/4] object-cover rounded-lg" loading="lazy" />)}</div>
        </div>
      </section>
      <section className="bg-catering-ink text-catering-on-dark py-16 md:py-20 text-center"><div className="container px-4"><h2 className="font-display text-catering-accent text-2xl md:text-3xl">Une envie, une idée, un projet ?</h2><p className="mt-5 text-lg leading-relaxed">Imaginons ensemble une expérience SushiEats qui vous ressemble.</p><Button asChild size="lg" variant="destructive" className="mt-8 whitespace-normal h-auto min-h-11"><a href="mailto:contact@sushieats.fr">Parlons de votre événement <ArrowRight /></a></Button><div><a href="mailto:contact@sushieats.fr" className="inline-flex items-center gap-2 mt-6 underline underline-offset-4"><Mail size={18} />contact@sushieats.fr</a></div></div></section>
    </div>
    <Dialog open={audience !== null} onOpenChange={open => { if (!open) setAudience(null); }}><DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
      <DialogHeader><DialogTitle className="font-display text-catering-accent text-xl md:text-3xl leading-tight pr-6">Votre projet événementiel</DialogTitle><DialogDescription>Parlez-nous de votre événement, nous imaginons une prestation SushiEats adaptée à vos envies.</DialogDescription></DialogHeader>
      {audience && <QuoteForm key={audience} audience={audience} />}
    </DialogContent></Dialog>
  </>;
}