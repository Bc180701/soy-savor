import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { cateringQuoteSchema, type CateringQuote } from "@/lib/cateringQuote";

export default function QuoteForm({ audience }: { audience: "business" | "private" }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const form = useForm<CateringQuote>({ resolver: zodResolver(cateringQuoteSchema), defaultValues: {
    audience, name: "", email: "", phone: "", company: "", event_type: "", event_date: "", location: "", guests: 1, needs: "", website: "",
  }});
  const submit = async (values: CateringQuote) => {
    setError("");
    try {
      const { data, error: requestError } = await supabase.functions.invoke("catering-quote", { body: values });
      if (requestError || !data?.success) {
        let message = data?.error || "Votre demande n’a pas pu être envoyée. Réessayez.";
        if (requestError && "context" in requestError && requestError.context instanceof Response) {
          const response = await requestError.context.json().catch(() => null);
          message = response?.error || message;
        }
        setError(message);
        return;
      }
      setSubmitted(true);
    } catch { setError("La connexion a été interrompue. Veuillez réessayer."); }
  };
  if (submitted) return <div role="status" className="py-12 space-y-4 text-center">
    <CheckCircle2 className="mx-auto size-10 text-catering-accent" />
    <h3 className="font-serif text-2xl">Demande de devis reçue</h3>
    <p className="text-muted-foreground">Votre projet a bien été transmis à SushiEats.</p>
    <Button variant="outline" onClick={() => { form.reset(); setSubmitted(false); }}>Nouvelle demande</Button>
  </div>;
  const fields: { name: "name" | "email" | "phone" | "company" | "event_type" | "event_date" | "location" | "guests"; label: string; type?: string; maxLength?: number; placeholder?: string }[] = [
    { name: "name", label: "Nom et prénom", maxLength: 100, placeholder: "Votre nom" },
    ...(audience === "business" ? [{ name: "company" as const, label: "Entreprise", maxLength: 150, placeholder: "Nom de votre entreprise" }] : []),
    { name: "email", label: "E-mail", type: "email", maxLength: 255, placeholder: "vous@exemple.fr" },
    { name: "phone", label: "Téléphone", type: "tel", maxLength: 30, placeholder: "06 …" },
    { name: "event_type", label: "Type d’événement", maxLength: 150, placeholder: audience === "business" ? "Séminaire, repas d’équipe…" : "Anniversaire, mariage…" },
    { name: "event_date", label: "Date de l’événement", type: "date" },
    { name: "location", label: "Lieu de l’événement", maxLength: 300, placeholder: "Adresse ou ville" },
    { name: "guests", label: "Nombre de personnes", type: "number" },
  ];
  return <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-5">
    <div className="grid sm:grid-cols-2 gap-5">
      {fields.map(item => <FormField key={item.name} control={form.control} name={item.name} render={({ field }) => <FormItem>
        <FormLabel>{item.label} <span aria-hidden="true">*</span></FormLabel>
        <FormControl><Input {...field} type={item.type || "text"} placeholder={item.placeholder} maxLength={item.maxLength} min={item.type === "number" ? 1 : undefined} max={item.type === "number" ? 100000 : undefined} autoComplete={item.name === "name" ? "name" : item.name === "email" ? "email" : item.name === "phone" ? "tel" : undefined} /></FormControl>
        <FormMessage />
      </FormItem>} />)}
    </div>
    <FormField control={form.control} name="needs" render={({ field }) => <FormItem>
      <FormLabel>Besoins particuliers</FormLabel>
      <FormControl><Textarea {...field} maxLength={3000} rows={4} placeholder="Vos envies, allergies, contraintes alimentaires…" /></FormControl><FormMessage />
    </FormItem>} />
    <div className="hidden" aria-hidden="true"><input tabIndex={-1} autoComplete="off" {...form.register("website")} /></div>
    <p className="text-xs text-muted-foreground">Vos coordonnées seront utilisées pour répondre à votre demande. <Link to="/politique-confidentialite" className="underline">Confidentialité</Link></p>
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    <Button type="submit" className="w-full bg-catering-accent text-catering-ink hover:bg-catering-accent/90" disabled={form.formState.isSubmitting}>
      {form.formState.isSubmitting ? <><Loader2 className="animate-spin" /> Envoi en cours…</> : <>Envoyer ma demande <ArrowRight /></>}
    </Button>
  </form></Form>;
}