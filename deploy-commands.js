import { REST, Routes } from "discord.js";
import "dotenv/config";

// Charger les commandes définies dans votre projet
import { commands } from "./commands.js"; // Importez les commandes depuis index.js

// Charger le token et l'ID du client depuis les variables d'environnement
const token = process.env.TOKEN; // Votre token de bot
const clientId = process.env.CLIENT_ID; // L'ID de votre application (client)
const guildId = process.env.GUILD_ID; // L'ID de votre application (client)

// Initialiser le client REST de Discord
const rest = new REST({ version: "10" }).setToken(token);

// Fonction pour déployer les commandes
(async () => {
  try {
    console.log("Suppression des commandes existantes...");

    // Récupérer toutes les commandes existantes
    const existingCommands = await rest.get(
      Routes.applicationCommands(clientId)
    );

    // Supprimer chaque commande
    for (const command of existingCommands) {
      await rest.delete(
        `${Routes.applicationCommands(clientId)}/${command.id}`
      );
    }

    console.log("Commandes existantes supprimées.");

    console.log("Déploiement des nouvelles commandes...");
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commands,
    });

    console.log("Nouvelles commandes déployées avec succès !");
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log("Déploiement terminé.");
  } catch (error) {
    console.error("Erreur lors du déploiement :", error);
  }
})();
