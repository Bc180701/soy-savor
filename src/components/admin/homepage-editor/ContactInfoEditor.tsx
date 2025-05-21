
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export interface ContactInfo {
  address: string;
  phone: string;
  email: string;
}

interface ContactInfoEditorProps {
  data: ContactInfo;
  onSave: (data: ContactInfo) => Promise<void>;
}

const ContactInfoEditor = ({ data, onSave }: ContactInfoEditorProps) => {
  const [contactInfo, setContactInfo] = useState<ContactInfo>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      await onSave(contactInfo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'enregistrement des coordonnées");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="address">Adresse</Label>
          <Input
            id="address"
            value={contactInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="16 cours Carnot, 13160 Châteaurenard"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="phone">Téléphone</Label>
          <Input
            id="phone"
            value={contactInfo.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="04 90 00 00 00"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={contactInfo.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="contact@sushieats.fr"
          />
        </div>

        <Button type="submit" className="w-full" disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer les coordonnées"
          )}
        </Button>
      </div>
    </form>
  );
};

export default ContactInfoEditor;
