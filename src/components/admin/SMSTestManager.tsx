
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { sendOrderStatusSMS } from "@/services/smsService";
import { Loader2, Send, Phone } from "lucide-react";

const SMSTestManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [orderType, setOrderType] = useState<'delivery' | 'pickup' | 'dine-in'>('delivery');
  const [status, setStatus] = useState('ready');
  const [restaurantId, setRestaurantId] = useState('11111111-1111-1111-1111-111111111111'); // Châteaurenard par défaut
  const [testMessage, setTestMessage] = useState("");
  const { toast } = useToast();

  const handleTestSMS = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro de téléphone",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendOrderStatusSMS({
        phoneNumber: phoneNumber.trim(),
        orderId: "TEST-" + Date.now().toString().slice(-6),
        orderType,
        status,
        customerName: customerName.trim() || "Client Test",
        restaurantId
      });

      if (result.success) {
        toast({
          title: "SMS envoyé avec succès",
          description: `SMS de test envoyé au ${phoneNumber}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Erreur d'envoi",
          description: result.error || "Erreur lors de l'envoi du SMS",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors du test SMS:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomMessageTest = async () => {
    if (!phoneNumber.trim() || !testMessage.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un numéro de téléphone et un message",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Utiliser directement l'edge function pour envoyer un message personnalisé
      const response = await fetch(`https://tdykegnmomyyucbhslok.supabase.co/functions/v1/send-sms-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRkeWtlZ25tb215eXVjYmhzbG9rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI3NjA2NjUsImV4cCI6MjA1ODMzNjY2NX0.88jbkZIkFiFXudHvqe0l2DhqQGh2V9JIThv9FFFagas`
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          message: testMessage.trim(),
          orderId: "CUSTOM-TEST-" + Date.now().toString().slice(-6)
        })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "SMS personnalisé envoyé",
          description: `Message envoyé au ${phoneNumber}`,
          variant: "default"
        });
      } else {
        toast({
          title: "Erreur d'envoi",
          description: result.error || "Erreur lors de l'envoi du SMS",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors du test SMS personnalisé:", error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Test SMS
        </CardTitle>
        <CardDescription>
          Testez l'envoi de SMS sans passer par une commande
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone *</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="06 12 34 56 78"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customerName">Nom du client (optionnel)</Label>
            <Input
              id="customerName"
              type="text"
              placeholder="Jean Dupont"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="orderType">Type de commande</Label>
            <Select value={orderType} onValueChange={(value: 'delivery' | 'pickup' | 'dine-in') => setOrderType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="delivery">Livraison</SelectItem>
                <SelectItem value="pickup">À emporter</SelectItem>
                <SelectItem value="dine-in">Sur place</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Statut</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ready">Prêt</SelectItem>
                <SelectItem value="out-for-delivery">En livraison</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="restaurant">Restaurant</Label>
            <Select value={restaurantId} onValueChange={setRestaurantId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="11111111-1111-1111-1111-111111111111">Châteaurenard</SelectItem>
                <SelectItem value="22222222-2222-2222-2222-222222222222">Saint Martin de Crau</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Test avec message automatique</h4>
            <p className="text-sm text-gray-600 mb-3">
              Envoie un SMS de test avec le message automatique selon le type et statut sélectionnés
            </p>
            <Button
              onClick={handleTestSMS}
              disabled={isLoading}
              className="w-full md:w-auto"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Envoyer SMS test automatique
            </Button>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Test avec message personnalisé</h4>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customMessage">Message personnalisé</Label>
                <Textarea
                  id="customMessage"
                  placeholder="Saisissez votre message de test..."
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  rows={3}
                />
              </div>
              <Button
                onClick={handleCustomMessageTest}
                disabled={isLoading}
                variant="outline"
                className="w-full md:w-auto"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Envoyer message personnalisé
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h5 className="font-medium text-yellow-800 mb-1">Note importante</h5>
          <p className="text-sm text-yellow-700">
            Les SMS de test seront envoyés réellement au numéro saisi. Assurez-vous d'utiliser un numéro valide et de ne pas abuser de cette fonctionnalité.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SMSTestManager;
