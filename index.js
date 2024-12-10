import { Client, GatewayIntentBits, EmbedBuilder } from "discord.js";
import {
  datas,
  addJob,
  deleteJob,
  setClass,
  deleteClass,
  searchByJob,
  searchByClass,
  addOrder,
  deleteOrder,
  validateOrder,
  listWaitingOrders,
  listToDoOrdersByResource,
  formatResourceString,
  formatOrderString,
  formatInlineList
} from "./datas/utils.js";
import { utils } from "./commands.js";
import "dotenv/config";
import emojis from "./utils/emojis.js";

console.log("Lancement de l'application...");

// Remplacez par votre token d'application et l'ID du channel où envoyer les validations de commandes
const TOKEN = process.env.TOKEN;
const ORDER_CHANNEL_ID = process.env.ORDER_CHANNEL_ID;

// Initialisation du bot
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Événement prêt
client.once("ready", () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
});

// Gestion des interactions
client.on("interactionCreate", async (interaction) => {
  let commandName, subCommand, options;
  if(interaction.isCommand()) {
    ({ commandName, options } = interaction);
    try {
      subCommand = options.getSubcommand();
    } catch {
      // no subCommand
    }
  }
  else if(interaction.isButton())
    [commandName, subCommand] = interaction.customId.split(" ");
  else
    return;

  const userId = interaction.user.id;
  const pseudo = interaction.member
    ? interaction.member.displayName
    : interaction.user.username;

  console.debug(`[${Date.now()}] Receive command "${commandName}" from ${pseudo} (#${userId})`);

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

    if (description?.length > 0) {
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

  if (commandName === "commander") {
    const toUserId = options.getUser("pseudo").id;
    const resource = options.getString("ressource");
    const quantity = options.getInteger("quantite");

    const orderId = addOrder(userId, toUserId, resource, quantity)
    const embed = createEmbed(
      "Commande passée avec succès !",
      `✅ Commande de **${quantity}** × **[${formatResourceString(resource)}]** passée à <@${toUserId}>`
    );
    await interaction.reply({ embeds: [embed], ephemeral: true });

    const channel = await client.channels.fetch(ORDER_CHANNEL_ID);
    const publicMessage = createEmbed("Nouvelle commande", `<@${userId}> aimerait ${quantity} × **[${formatResourceString(resource)}]** (commande **#${orderId}**)`);
    await channel.send({ content: `<@${toUserId}>`, embeds: [publicMessage] });
  }

  if (commandName === "commandes") {
    if (subCommand === "lister") {
      const orders = listWaitingOrders(userId);
      const formatedOrders = orders.length ? orders.map(({id, toUserId, resource, quantity}) => {
        return `• ${quantity} × **[${formatResourceString(resource)}]** demandé${quantity > 1 ? "s" : ""} à <@${toUserId}> (commande **#${id}**)`;
      }).join("\n") : "Aucune commande en attente";
      const embed = createEmbed(
        "Liste de vos commandes en attente ⌛",
        formatedOrders
      );
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subCommand === "todo") {
      const ordersByResource = listToDoOrdersByResource(userId);
      const lines = [];
      for(const resource in ordersByResource) {
        const { total, orders } = ordersByResource[resource];
        const ids = orders.map((order) => `**#${order.id}**`);
        lines.push(`• ${total} × **[${formatResourceString(resource)}]** (commande${ids.length > 1 ? "s" : ""} ${formatInlineList(ids)})`);
      }
      const content = lines.length ? lines.join("\n") : "Aucune commande à réaliser ✅";
      await interaction.reply({ embeds: [createEmbed("Liste de vos commandes à réaliser 📝", content)], ephemeral: true, "components": [
        {
          "type": 1,
          "components": [
              {
                  "type": 2,
                  "label": "Détails",
                  "style": 1,
                  "emoji": {"id": null, "name": "🔎"},
                  "custom_id": "commandes todo-details"
              }
          ]
        }
      ]});
    }

    if (subCommand === "todo-details") {
      const ordersByResource = listToDoOrdersByResource(userId);
      const embeds = [createEmbed("Liste de vos commandes à réaliser 📝")];
      for(const resource in ordersByResource) {
        const { total, orders } = ordersByResource[resource];
        const title = `${total} × **[${formatResourceString(resource)}]**`;
        const details = [];
        for(const order of orders) {
          const { fromUserId, quantity} = order;
          details.push(`• ${quantity} demandé${quantity>1?"s":""} par <@${fromUserId}> (${formatOrderString(order)})`);
        }
        embeds.push(createEmbed(title, details.join("\n")));
      }
      if(embeds.length === 1)
        embeds.push(createEmbed("Aucune commande à réaliser ✅"));
      await interaction.reply({ embeds, ephemeral: true });
    }

    if (subCommand === "supprimer") {
      const orderId = options.getInteger("numero");
      const success = deleteOrder(orderId, userId);
      const title = success ? "Commande supprimée avec succès !" : "Impossible de supprimer cette commande"
      const text = success ? `✅ La commande **#${orderId}** a été supprimée` : "❌ Cette commande n'existe pas ou vous ne pouvez pas la supprimer"
      const embed = createEmbed(title, text);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (subCommand === "valider") {
      const orderId = options.getInteger("numero");
      const [success, order] = validateOrder(orderId, userId);
      const title = success ? "Commande validée avec succès !" : "Impossible de valider cette commande"
      const text = success ? `✅ La commande **#${orderId}** a été validée` : "❌ Cette commande n'existe pas ou vous ne pouvez pas la valider"
      const embed = createEmbed(title, text);
      await interaction.reply({ embeds: [embed], ephemeral: true });
      if(success) {
        const channel = await client.channels.fetch(ORDER_CHANNEL_ID);
        const publicMessage = createEmbed("Commande prête ✅", `Ta commande **#${orderId}** de ${order.quantity} × **[${formatResourceString(order.resource)}]** a été validée par <@${userId}>`);
        await channel.send({ content: `<@${order.fromUserId}>`, embeds: [publicMessage] });
      }
    }
  }

  if (commandName === "classe") {
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
