
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const APropos = () => {
  const team = [
    {
      name: "Benjamin Martinez",
      role: "Chef Sushi",
      bio: "Formé à Tokyo, Benjamin apporte 20 ans d'expérience dans l'art du sushi. Sa passion pour la cuisine japonaise authentique se reflète dans chaque création.",
      image: "https://clwebdesign.fr/wp-content/uploads/2025/04/309394283_5360481447404041_82840468670811713_n.jpg"
    },
    {
      name: "Anais Remuaux",
      role: "Manager",
      bio: "Passionnée de cuisine japonaise, Anais veille à la qualité de votre expérience et à la satisfaction de chaque client.",
      image: "https://img.freepik.com/free-photo/17-lifestyle-people-ordering-sushi-home_52683-100628.jpg?t=st=1744878011~exp=1744881611~hmac=ddde7d5b646e0e5be96a25f6606613df658b19e837cc049ff3f6f8f411a9dd51&w=1480"
    }
  ];

  return (
    <div className="container mx-auto py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center mb-2">Notre Histoire</h1>
        <p className="text-gray-600 text-center mb-12">
          Découvrez qui nous sommes et notre passion pour la cuisine japonaise
        </p>

        <div className="mb-16">
          <div className="rounded-lg overflow-hidden mb-8">
            <img
              src="https://img.freepik.com/free-photo/top-view-variety-sushi-nigiri-sashimi-yakisoba-edamame-restaurant-wooden-table_181624-35322.jpg?t=st=1744878118~exp=1744881718~hmac=c0b5253dbb41cdbd760b0f5a9ae01846fb2c6cb30d502ff740f4df4ec672133f&w=1480"
              alt="Restaurant SushiEats"
              className="w-full h-80 object-cover"
            />
          </div>

          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">Notre Philosophie</h2>
            <p className="mb-4">
              Fondé en 2015, SushiEats est né d'une passion pour la cuisine japonaise authentique et du désir de partager cette richesse culinaire avec notre communauté. Notre mission est simple : proposer des plats japonais de qualité supérieure, préparés avec des ingrédients frais et selon des techniques traditionnelles.
            </p>
            <p className="mb-8">
              Chaque plat qui sort de notre cuisine est le fruit d'un savoir-faire méticuleux et d'un respect profond pour les traditions culinaires japonaises. Notre chef exécutif, formé à Tokyo, apporte son expertise et sa créativité pour vous offrir une expérience gustative exceptionnelle.
            </p>
          </div>

          <Separator className="my-12" />

          <h2 className="text-2xl font-bold mb-8">Notre Équipe</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {team.map((member) => (
              <Card key={member.name} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="h-64 overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-akane-600 font-medium mb-3">{member.role}</p>
                    <p className="text-gray-600">{member.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-12" />

          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold mb-4">Nos Engagements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-3">Qualité</h3>
                <p className="text-gray-600">
                  Nous sélectionnons rigoureusement nos ingrédients pour garantir fraîcheur et authenticité. Nos poissons sont livrés quotidiennement, nos légumes sont choisis pour leur fraîcheur, et nous utilisons du riz de la plus haute qualité.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Durabilité</h3>
                <p className="text-gray-600">
                  La durabilité est au cœur de nos préoccupations. Nous nous efforçons de nous approvisionner auprès de fournisseurs locaux et de privilégier les produits de saison pour réduire notre empreinte écologique.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-3">Innovation</h3>
                <p className="text-gray-600">
                  Tout en respectant les traditions japonaises, notre cuisine est en constante évolution. Nous explorons de nouvelles saveurs et techniques pour vous surprendre à chaque visite.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3">Accueil</h3>
                <p className="text-gray-600">
                  Nous croyons que l'hospitalité fait partie intégrante de l'expérience culinaire. Notre équipe s'engage à vous offrir un service chaleureux et attentif pour rendre votre moment chez nous inoubliable.
                </p>
              </div>
            </div>
          </div>
          
          <Separator className="my-12" />
          
          <div className="bg-gray-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center">Venez Nous Rendre Visite</h2>
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-6 md:mb-0">
                <h3 className="font-bold mb-2">Heures d'Ouverture</h3>
                <p className="text-gray-600">Lundi - Vendredi: 11h00 - 22h00</p>
                <p className="text-gray-600">Samedi - Dimanche: 12h00 - 23h00</p>
              </div>
              <div>
                <h3 className="font-bold mb-2">Contact</h3>
                <p className="text-gray-600">Téléphone: 01 23 45 67 89</p>
                <p className="text-gray-600">Email: info@sushieats.fr</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default APropos;
