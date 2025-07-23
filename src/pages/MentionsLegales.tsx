
import { motion } from "framer-motion";

const MentionsLegales = () => {
  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-12">Mentions légales</h1>
        
        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Éditeur du site</h2>
            <div className="space-y-2">
              <p><strong>Raison sociale :</strong> SUSHIEATS</p>
              <p><strong>Forme juridique :</strong> Société par actions simplifiée</p>
              <p><strong>SIREN :</strong> 934 174 566</p>
              <p><strong>SIRET du siège social :</strong> 934 174 566 00018</p>
              <p><strong>TVA intracommunautaire :</strong> FR01934174566</p>
              <p><strong>Code NAF/APE :</strong> 5610A - Restauration traditionnelle</p>
              <p><strong>Date de création :</strong> 14 octobre 2024</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Siège social</h2>
            <p>16 COURS CARNOT<br />13160 CHÂTEAURENARD<br />France</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Direction de la publication</h2>
            <p><strong>Directrice de publication :</strong> Anais REMUAUX</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Hébergement</h2>
            <div className="space-y-2">
              <p><strong>Hébergeur :</strong> OVH</p>
              <p>2 rue Kellermann<br />59100 Roubaix<br />France</p>
              <p><strong>Téléphone :</strong> 1007</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Propriété intellectuelle</h2>
            <p>
              L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle. 
              Tous les droits de reproduction sont réservés, y compris pour les documents téléchargeables et les représentations iconographiques et photographiques.
            </p>
            <p className="mt-4">
              La reproduction de tout ou partie de ce site sur un support électronique quel qu'il soit est formellement interdite 
              sauf autorisation expresse du directeur de la publication.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Protection des données personnelles</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi Informatique et Libertés, 
              vous disposez d'un droit d'accès, de rectification, de suppression et d'opposition aux données personnelles vous concernant.
            </p>
            <p className="mt-4">
              Pour exercer ces droits, vous pouvez nous contacter à l'adresse : contact@sushieats.fr
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Cookies</h2>
            <p>
              Ce site utilise des cookies pour améliorer l'expérience utilisateur et réaliser des statistiques de visites. 
              En poursuivant votre navigation sur ce site, vous acceptez l'utilisation de cookies.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Responsabilité</h2>
            <p>
              Les informations contenues sur ce site sont aussi précises que possible et le site est périodiquement remis à jour, 
              mais peut toutefois contenir des inexactitudes, des omissions ou des lacunes.
            </p>
            <p className="mt-4">
              Si vous constatez une lacune, erreur ou ce qui paraît être un dysfonctionnement, 
              merci de bien vouloir le signaler par email à contact@sushieats.fr en décrivant le problème de la manière la plus précise possible.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Droit applicable</h2>
            <p>
              Tout litige en relation avec l'utilisation du site www.sushieats.fr est soumis au droit français. 
              En dehors des cas où la loi ne le permet pas, il est fait attribution exclusive de juridiction aux tribunaux compétents de Tarascon.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mb-4 text-gray-900">Sources et mises à jour</h2>
            <div className="space-y-1">
              <p><strong>RCS :</strong> 18/07/2025</p>
              <p><strong>INSEE :</strong> 17/07/2025</p>
              <p><strong>RNE :</strong> 16/07/2025</p>
            </div>
          </section>
        </div>
      </motion.div>
    </div>
  );
};

export default MentionsLegales;
