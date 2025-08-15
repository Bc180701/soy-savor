import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";

const PolitiqueConfidentialite = () => {
  return (
    <>
      <SEOHead
        title="Politique de Confidentialité - Sushieats.fr"
        description="Consultez notre politique de confidentialité pour comprendre comment nous collectons, utilisons et protégeons vos données personnelles sur Sushieats.fr"
        canonical="https://sushieats.fr/politique-confidentialite"
        keywords="politique confidentialité, protection données, RGPD, sushi, livraison"
      />
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="container mx-auto px-4 py-8 max-w-4xl"
      >
        <h1 className="text-3xl font-bold mb-8 text-center">Politique de Confidentialité</h1>
        
        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">1. Identité du responsable de traitement</h2>
            <p className="mb-4">
              <strong>Sushieats</strong><br />
              SARL au capital de 8 000 euros<br />
              RCS Tarascon 123 456 789<br />
              Siège social : 16 cours Carnot, 13160 Châteaurenard<br />
              Téléphone : 04 90 00 00 00<br />
              Email : contact@sushieats.fr
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">2. Données personnelles collectées</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">2.1 Données d'identification</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Nom et prénom</li>
                  <li>Adresse email</li>
                  <li>Numéro de téléphone</li>
                  <li>Date de création du compte</li>
                  <li>Date de dernière connexion</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.2 Données de livraison</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Adresse de livraison (rue, ville, code postal)</li>
                  <li>Informations complémentaires d'adresse</li>
                  <li>Adresse par défaut</li>
                  <li>Historique des adresses de livraison</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.3 Données de commande</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Détails des produits commandés</li>
                  <li>Montant des commandes</li>
                  <li>Mode de paiement utilisé</li>
                  <li>Historique des commandes</li>
                  <li>Statut des commandes</li>
                  <li>Instructions de livraison</li>
                  <li>Notes client</li>
                  <li>Allergies déclarées</li>
                  <li>Créneaux horaires choisis</li>
                  <li>Codes promo utilisés</li>
                  <li>Pourboires</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.4 Données de fidélité</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Points de fidélité accumulés</li>
                  <li>Historique d'utilisation des points</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">2.5 Données techniques</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Adresse IP</li>
                  <li>Type de navigateur</li>
                  <li>Pages visitées</li>
                  <li>Données de géolocalisation (pour la livraison)</li>
                  <li>Cookies et traceurs</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">3. Finalités du traitement</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Gestion des comptes clients et authentification</li>
              <li>Traitement et suivi des commandes</li>
              <li>Gestion des livraisons et des retraits</li>
              <li>Traitement des paiements</li>
              <li>Service client et communication</li>
              <li>Programme de fidélité</li>
              <li>Amélioration de nos services</li>
              <li>Envoi d'informations commerciales (avec consentement)</li>
              <li>Respect des obligations légales</li>
              <li>Prévention de la fraude</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">4. Base légale du traitement</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Exécution du contrat :</strong> Traitement des commandes, livraisons, paiements</li>
              <li><strong>Intérêt légitime :</strong> Amélioration des services, prévention de la fraude</li>
              <li><strong>Consentement :</strong> Communications marketing, cookies non essentiels</li>
              <li><strong>Obligation légale :</strong> Conservation des factures, déclarations fiscales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">5. Destinataires des données</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Personnel autorisé de Sushieats</li>
              <li>Prestataires de paiement (Stripe)</li>
              <li>Services de livraison</li>
              <li>Prestataires techniques (hébergement, maintenance)</li>
              <li>Autorités compétentes (sur demande légale)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">6. Durée de conservation</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Données de compte :</strong> Jusqu'à suppression du compte + 3 ans</li>
              <li><strong>Commandes :</strong> 10 ans (obligation comptable)</li>
              <li><strong>Données marketing :</strong> 3 ans après dernière interaction</li>
              <li><strong>Cookies :</strong> 13 mois maximum</li>
              <li><strong>Logs techniques :</strong> 1 an</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">7. Vos droits</h2>
            <p className="mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données</li>
              <li><strong>Droit de rectification :</strong> Corriger vos données inexactes</li>
              <li><strong>Droit à l'effacement :</strong> Supprimer vos données sous conditions</li>
              <li><strong>Droit à la limitation :</strong> Limiter le traitement de vos données</li>
              <li><strong>Droit à la portabilité :</strong> Récupérer vos données dans un format structuré</li>
              <li><strong>Droit d'opposition :</strong> Vous opposer au traitement pour motifs légitimes</li>
              <li><strong>Droit de retrait du consentement :</strong> Pour les traitements basés sur le consentement</li>
            </ul>
            <p className="mt-4">
              Pour exercer ces droits, contactez-nous à : <strong>contact@sushieats.fr</strong>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">8. Cookies</h2>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">8.1 Cookies essentiels</h3>
                <p>Nécessaires au fonctionnement du site (session, panier, authentification)</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">8.2 Cookies de performance</h3>
                <p>Analyse de l'utilisation du site pour améliorer nos services</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">8.3 Cookies marketing</h3>
                <p>Personnalisation des contenus et publicités (avec votre consentement)</p>
              </div>
            </div>
            <p className="mt-4">
              Vous pouvez gérer vos préférences cookies via le bandeau de consentement ou dans les paramètres de votre navigateur.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">9. Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données personnelles contre tout accès non autorisé, altération, divulgation ou destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">10. Réclamations</h2>
            <p>
              Vous avez le droit d'introduire une réclamation auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) si vous estimez que le traitement de vos données personnelles constitue une violation de la réglementation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-4 text-primary">11. Modifications</h2>
            <p>
              Cette politique de confidentialité peut être modifiée. La version en vigueur est celle publiée sur notre site web.
            </p>
            <p className="mt-2">
              <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
            </p>
          </section>
        </div>
      </motion.div>
    </>
  );
};

export default PolitiqueConfidentialite;