import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import {
  datas,
  addJob,
  deleteJob,
  setClass,
  deleteClass,
  searchByJob,
  searchByClass,
} from "./datas/utils.js";
import { utils } from "./commands.js";
import "dotenv/config";
import emojis from "./utils/emojis.js";

console.log("Lancement de l'application...");

// Remplacez par votre token et votre ID d'application
const TOKEN = process.env.TOKEN;

// Initialisation du bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Événement prêt
client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Gestion des interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options } = interaction;
  const userId = interaction.user.id;
  const pseudo = interaction.member
    ? interaction.member.displayName
    : interaction.user.username;

  // Fonction pour créer un embed
  const createEmbed = (
    title,
    description,
    thumb,
    fields,
    color = "#3498db"
  ) => {
    const embed = new EmbedBuilder()
      .setColor(color) // Définir la couleur de l'embed
      .setTitle(title); // Titre de l'embed

    if (description.length > 0) {
      embed.setDescription(description); // Description de l'embed
    }

    // Ajouter la thumbnail seulement si elle est définie
    if (thumb) {
      embed.setThumbnail(thumb);
    }

    // Ajouter les fields seulement s'ils sont définis et sont un tableau
    if (Array.isArray(fields) && fields.length > 0) {
      embed.addFields(fields);
    }

    return embed;
  };

  if (commandName === "metier") {
    const subCommand = options.getSubcommand();

    if (subCommand === "ajouter") {
      const nom = options.getString("nom");
      const niveau = options.getInteger("niveau");
      addJob(userId, nom, niveau, pseudo); // Appel à la fonction pour ajouter un métier

      // Création de l'embed de réponse
      const embed = createEmbed(
        `Métier ${nom} ajouté`,
        `✅ Métier ${nom} de niveau ${niveau} a été ajouté.`,
        utils.jobs.find((j) => j.name === nom).icon
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subCommand === "lister") {
      const userData = datas[userId];
      let icon = "";
      if (userData && Object.keys(userData.metiers).length > 0) {
        const metiers = Object.entries(userData.metiers)
          .sort(([, niveauA], [, niveauB]) => niveauB - niveauA) // Trie par niveau décroissant
          .map(([metier, niveau]) => {
            if (icon.length === 0) icon = metier;
            return {
              name: metier,
              value: `<:${metier
                .toLocaleLowerCase()
                .replace(/û/g, "u")
                .replace(/ê/g, "e")}:${
                emojis[
                  metier
                    .toLocaleLowerCase()
                    .replace(/û/g, "u")
                    .replace(/ê/g, "e")
                ]
              }> ${niveau}`,
              inline: true,
            };
          });

        // Création de l'embed de réponse
        const embed = createEmbed(
          "Vos métiers",
          "",
          utils.jobs.find((j) => j.name === icon).icon,
          metiers
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        // Création d'un embed pour indiquer l'absence de métiers
        const embed = createEmbed(
          "Aucun métier trouvé",
          "❌ Vous n'avez pas encore inscrit de métiers."
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else if (subCommand === "supprimer") {
      const nom = options.getString("nom");
      deleteJob(userId, nom, pseudo); // Appel à la fonction pour supprimer un métier

      // Création de l'embed de réponse
      const embed = createEmbed(
        "Métier supprimé",
        `✅ Métier **${nom}** supprimé.`
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  if (commandName === "classe") {
    const subCommand = options.getSubcommand();

    if (subCommand === "definir") {
      const nom = options.getString("nom");
      const niveau = options.getInteger("niveau");
      const element = options.getString("element");
      setClass(userId, nom, niveau, element, pseudo); // Appel à la fonction pour définir une classe

      const fields = [];

      if (element) {
        fields.push({
          name: "Élément",
          value: `<:${element.toLowerCase()}:${
            emojis[element.toLowerCase()]
          }> ${element}`,
          inline: true,
        });
      }

      fields.push({
        name: "Niveau",
        value: `${niveau}`,
        inline: true,
      });

      // Création de l'embed de réponse
      const embed = createEmbed(
        "Votre classe a été ajoutée !",
        "",
        utils.classes.find((c) => c.name === nom).icon,
        fields
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (subCommand === "afficher") {
      const userData = datas[userId];
      if (userData && userData.classe) {
        const { nom, niveau, element } = userData.classe;

        const fields = [];

        if (element) {
          fields.push({
            name: "Élément",
            value: `<:${element.toLowerCase()}:${
              emojis[element.toLowerCase()]
            }> ${element}`,
            inline: true,
          });
        }

        fields.push({
          name: "Niveau",
          value: `${niveau}`,
          inline: true,
        });

        // Création de l'embed de réponse
        const embed = createEmbed(
          "Votre classe actuelle",
          "",
          utils.classes.find((c) => c.name === nom).icon,
          fields
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        // Création de l'embed pour indiquer l'absence de classe
        const embed = createEmbed(
          "Aucune classe définie",
          "❌ Vous n'avez pas encore défini de classe."
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else if (subCommand === "supprimer") {
      const userData = datas[userId];

      if (userData && userData.classe) {
        const { nom, niveau, element } = userData.classe;

        const fields = [];

        if (element) {
          fields.push({
            name: "Élément",
            value: `<:${element.toLowerCase()}:${
              emojis[element.toLowerCase()]
            }> ${element}`,
            inline: true,
          });
        }

        fields.push({
          name: "Niveau",
          value: `${niveau}`,
          inline: true,
        });

        // Création de l'embed de réponse
        const embed = createEmbed(
          "Cette classe a bien été supprimée",
          "",
          utils.classes.find((c) => c.name === nom).icon,
          fields
        );
        try {
          deleteClass(userId, pseudo); // Appel à la fonction pour supprimer une classe
          await interaction.reply({ embeds: [embed], ephemeral: true });
        } catch (e) {
          console.log("error deleting char", e);
        }
      } else {
        // Création de l'embed pour indiquer l'absence de classe
        const embed = createEmbed(
          "Aucune classe définie",
          "❌ Vous n'avez pas encore défini de classe."
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }

  if (commandName === "lvl") {
    const niveau = options.getInteger("niveau");
    const element = options.getString("element");

    const userData = datas[userId];
    if (userData && userData.classe) {
      const { nom } = userData.classe;

      // Mise à jour des données de la classe
      userData.classe.niveau = niveau;
      if (element) {
        userData.classe.element = element;
      }

      // Construction des champs de l'embed
      const fields = [];

      if (element) {
        fields.push({
          name: "Élément",
          value: `<:${element.toLowerCase()}:${
            emojis[element.toLowerCase()]
          }> ${element}`,
          inline: true,
        });
      }

      fields.push({
        name: "Niveau",
        value: `${niveau}`,
        inline: true,
      });

      // Création de l'embed de réponse
      const embed = createEmbed(
        "Classe mise à jour !",
        `Votre classe **${nom}** a été mise à jour avec succès.`,
        utils.classes.find((c) => c.name === nom).icon,
        fields
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      // Création de l'embed pour indiquer l'absence de classe
      const embed = createEmbed(
        "Aucune classe définie",
        "❌ Vous n'avez pas encore défini de classe. Utilisez `/classe definir` pour en créer une."
      );

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }

  if (commandName === "rechercher") {
    const subCommand = options.getSubcommand();

    if (subCommand === "metier") {
      const nom = options.getString("nom");
      const niveauMin = options.getInteger("niveau_min") || 1;
      const results = searchByJob(nom, niveauMin); // Recherche des utilisateurs avec le métier donné
      if (results.length > 0) {
        const response = results
          .map(
            ({ userId, level }) =>
              `<@${userId}> : **${nom}** niveau **${level}**`
          )
          .join("\n");

        // Création de l'embed de réponse
        const embed = createEmbed(
          `${nom}`,
          `🔍 Joueurs ayant le métier :\n\n${response}`,
          utils.jobs.find((c) => c.name === nom).icon
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        // Création de l'embed pour indiquer l'absence de résultats
        const embed = createEmbed(
          "Aucun joueur trouvé",
          `❌ Aucun joueur trouvé avec le métier ${nom} ${
            options.getInteger("niveau_min")
              ? `de niveau ${niveauMin} minimum.`
              : ""
          }.`
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    } else if (subCommand === "classe") {
      const nom = options.getString("nom");
      const niveauMin = options.getInteger("niveau_min") || 1;
      const element = options.getString("element");
      const results = searchByClass(nom, niveauMin, element); // Recherche des utilisateurs avec la classe donnée
      if (results.length > 0) {
        // Trier les résultats par niveau décroissant
        const sortedResults = results.sort((a, b) => b.level - a.level);

        // Préparer les colonnes
        const joueurField = sortedResults
          .map(({ userId }) => `<@${userId}>`)
          .join("\n");
        const niveauField = sortedResults
          .map(({ level }) => `${level}`)
          .join("\n");
        const elementField = sortedResults
          .map(({ element }) =>
            element
              ? `<:${element.toLowerCase()}:${
                  emojis[element.toLowerCase()]
                }> ${element}`
              : "Aucun"
          )
          .join("\n");

        // Créer les fields pour l'embed
        const fields = [
          { name: "**Joueur**", value: joueurField, inline: true },
          { name: "**Niveau**", value: niveauField, inline: true },
          { name: "**Élément**", value: elementField, inline: true },
        ];

        // Création de l'embed de réponse
        const embed = createEmbed(
          `Résultats pour la classe ${nom}`,
          "🔍 Liste des joueurs de la classe :",
          utils.classes.find((c) => c.name === nom).icon,
          fields
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      } else {
        // Création de l'embed pour indiquer l'absence de résultats
        const embed = createEmbed(
          "Aucun joueur trouvé",
          `❌ Aucun joueur trouvé avec la classe ${nom}${
            element
              ? ` de l'élément <:${element.toLowerCase()}:${
                  emojis[element.toLowerCase()]
                }> ${element}`
              : ""
          }${
            options.getInteger("niveau_min")
              ? ` et de niveau ${niveauMin} minimum`
              : ""
          }.`
        );

        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
    }
  }
});

// Lancer le bot
client.login(TOKEN);
