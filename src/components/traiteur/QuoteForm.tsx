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
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { businessEventTypes, privateEventTypes, cateringServices, formatCateringNeeds } from "@/lib/cateringProject";

export default function QuoteForm({ audience }: { audience: "business" | "private" }) {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const form = useForm<CateringQuote>({ resolver: zodResolver(cateringQuoteSchema), defaultValues: {
    audience, name: "", email: "", phone: "", company: "", event_type: "", event_date: "", location: "", needs: "", website: "",
  }});
  const submit = async (values: CateringQuote) => {
    setError("");
    try {
      const { data, error: requestError } = await supabase.functions.invoke("catering-quote", { body: { ...values, needs: formatCateringNeeds(services, values.needs) } });
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
    <h3 className="font-morning-waves font-bold text-catering-accent text-3xl">Demande de devis reçue</h3>
    <p className="text-muted-foreground">Votre projet a bien été transmis à SushiEats.</p>
    <Button variant="outline" onClick={() => { form.reset(); setServices([]); setSubmitted(false); }}>Nouvelle demande</Button>
  </div>;
  const fields: { name: "name" | "email" | "phone" | "company" | "event_type" | "event_date" | "location" | "guests"; label: string; type?: string; maxLength?: number; placeholder?: string }[] = [
    { name: "name", label: "Nom et prénom", maxLength: 100, placeholder: "Votre nom" },
    ...(audience === "business" ? [{ name: "company" as const, label: "Entreprise / Organisation", maxLength: 150, placeholder: "Nom de votre entreprise" }] : []),
    { name: "email", label: "E-mail", type: "email", maxLength: 255, placeholder: "vous@exemple.fr" },
    { name: "phone", label: "Téléphone", type: "tel", maxLength: 30, placeholder: "06 …" },
    { name: "event_type", label: "Type d’événement" },
    { name: "event_date", label: "Date souhaitée", type: "date" },
    { name: "location", label: "Lieu de l’événement", maxLength: 300, placeholder: "Adresse ou ville" },
    { name: "guests", label: "Nombre de convives", type: "number" },
  ];
  return <Form {...form}><form onSubmit={form.handleSubmit(submit)} className="space-y-5">
    {[{ title: "Vos coordonnées", fields: fields.filter(item => ["name", "company", "email", "phone"].includes(item.name)) }, { title: "Votre événement", fields: fields.filter(item => ["event_type", "event_date", "location", "guests"].includes(item.name)) }].map((section, index) => <fieldset key={section.title} className="border-t border-border pt-6">
      <legend className="font-display text-catering-accent text-lg pr-4">{index + 1}. {section.title}</legend>
      <div className="grid sm:grid-cols-2 gap-5">
      {section.fields.map(item => <FormField key={item.name} control={form.control} name={item.name} render={({ field }) => <FormItem>
        <FormLabel>{item.label} <span aria-hidden="true">*</span></FormLabel>
        {item.name === "event_type" ? <Select value={String(field.value)} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue placeholder="Choisir un type d’événement" /></SelectTrigger></FormControl><SelectContent>{(audience === "business" ? businessEventTypes : privateEventTypes).map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select> : <FormControl><Input {...field} value={field.value ?? ""} type={item.type || "text"} placeholder={item.placeholder} maxLength={item.maxLength} min={item.type === "number" ? 1 : undefined} max={item.type === "number" ? 100000 : undefined} autoComplete={item.name === "name" ? "name" : item.name === "email" ? "email" : item.name === "phone" ? "tel" : undefined} /></FormControl>}
        <FormMessage />
      </FormItem>} />)}
      </div>
    </fieldset>)}
    <fieldset className="border-t border-border pt-6 space-y-5">
      <legend className="font-display text-catering-accent text-lg pr-4">3. Votre prestation</legend>
      <div className="space-y-3">{cateringServices.map((service, index) => <label key={service} htmlFor={`service-${audience}-${index}`} className="flex items-start gap-3 cursor-pointer text-sm leading-relaxed"><Checkbox id={`service-${audience}-${index}`} className="mt-1 shrink-0" checked={services.includes(service)} onCheckedChange={checked => setServices(previous => checked === true ? [...previous, service] : previous.filter(value => value !== service))} /><span>{service}</span></label>)}</div>
    <FormField control={form.control} name="needs" render={({ field }) => <FormItem>
      <FormLabel>Décrivez-nous votre projet</FormLabel>
      <FormControl><Textarea {...field} maxLength={2000} rows={4} placeholder="Précisions, demandes particulières, animations souhaitées ou contraintes alimentaires…" /></FormControl><FormMessage />
    </FormItem>} />
    </fieldset>
    <div className="hidden" aria-hidden="true"><input tabIndex={-1} autoComplete="off" {...form.register("website")} /></div>
    <p className="text-xs text-muted-foreground">Vos coordonnées seront utilisées pour répondre à votre demande. <Link to="/politique-confidentialite" className="underline">Confidentialité</Link></p>
    {error && <p role="alert" className="text-destructive text-sm">{error}</p>}
    <Button type="submit" variant="destructive" className="w-full font-semibold" disabled={form.formState.isSubmitting}>
      {form.formState.isSubmitting ? <><Loader2 className="animate-spin" /> Envoi en cours…</> : <>Envoyer ma demande <ArrowRight /></>}
    </Button>
  </form></Form>;
}