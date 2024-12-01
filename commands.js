import fs from "fs";
import path from "path";

// Initialiser un objet pour stocker les données
export const utils = {};

// Lire tous les fichiers dans le dossier utils
const files = fs.readdirSync("./utils");

files.forEach((file) => {
  // Ignorer les fichiers qui ne sont pas des JSON
  if (path.extname(file) !== ".json") return;

  // Extraire le nom de base du fichier sans l'extension
  const baseName = path.basename(file, ".json");

  // Lire et parser le contenu JSON
  const content = JSON.parse(
    fs.readFileSync(path.join("./utils", file), "utf8")
  );

  // Ajouter le contenu brut dans l'objet
  utils[baseName] = content;

  // Générer les "choices" et les ajouter dans l'objet
  utils[`${baseName}Choices`] = content.map((item) => ({
    name: item.name,
    value: item.name,
  }));
});

export const commands = [
  {
    name: "metier",
    description: "Gérer vos métiers",
    options: [
      {
        name: "ajouter",
        description: "Ajoute un métier avec son niveau",
        type: 1, // Sous-commande
        options: [
          {
            name: "nom",
            type: 3,
            description: "Nom du métier",
            required: true,
            choices: utils.jobsChoices,
          },
          {
            name: "niveau",
            type: 4,
            description: "Niveau du métier",
            required: true,
            min_value: 1,
            max_value: 200,
          },
        ],
      },
      {
        name: "lister",
        description: "Liste vos métiers enregistrés",
        type: 1, // Sous-commande
      },
      {
        name: "supprimer",
        description: "Supprime un métier",
        type: 1, // Sous-commande
        options: [
          {
            name: "nom",
            type: 3,
            description: "Nom du métier à supprimer",
            required: true,
            choices: utils.jobsChoices,
          },
        ],
      },
    ],
  },
  {
    name: "classe",
    description: "Gérer votre classe",
    options: [
      {
        name: "definir",
        description: "Définit votre classe, niveau et élément",
        type: 1, // Sous-commande
        options: [
          {
            name: "nom",
            type: 3,
            description: "Nom de la classe",
            required: true,
            choices: utils.classesChoices,
          },
          {
            name: "niveau",
            type: 4,
            description: "Niveau de la classe",
            required: true,
            min_value: 1,
            max_value: 200,
          },
          {
            name: "element",
            type: 3,
            description: "Élément (Air, Feu, etc.)",
            required: false,
            choices: utils.elementsChoices,
          },
        ],
      },
      {
        name: "afficher",
        description: "Affiche votre classe actuelle",
        type: 1, // Sous-commande
      },
      {
        name: "supprimer",
        description: "Supprime votre classe actuelle",
        type: 1, // Sous-commande
      },
    ],
  },
  {
    name: "lvl",
    description: "Met à jour directement le niveau de votre classe",
    options: [
      {
        name: "niveau",
        type: 4,
        description: "Niveau de la classe",
        required: true,
        min_value: 1,
        max_value: 200,
      },
      {
        name: "element",
        type: 3,
        description: "Élément (facultatif)",
        required: false,
        choices: utils.elementsChoices,
      },
    ],
  },
  {
    name: "rechercher",
    description: "Rechercher un métier ou une classe",
    options: [
      {
        name: "metier",
        description: "Rechercher des joueurs avec un métier spécifique",
        type: 1, // Sous-commande
        options: [
          {
            name: "nom",
            type: 3,
            description: "Nom du métier à rechercher",
            required: true,
            choices: utils.jobsChoices,
          },
          {
            name: "niveau_min",
            type: 4,
            description: "Niveau minimum",
            required: false,
            min_value: 1,
            max_value: 200,
          },
        ],
      },
      {
        name: "classe",
        description: "Rechercher des joueurs avec une classe spécifique",
        type: 1, // Sous-commande
        options: [
          {
            name: "nom",
            type: 3,
            description: "Nom de la classe à rechercher",
            required: true,
            choices: utils.classesChoices,
          },
          {
            name: "niveau_min",
            type: 4,
            description: "Niveau minimum",
            required: false,
            min_value: 1,
            max_value: 200,
          },
          {
            name: "element",
            type: 3,
            description: "Élément",
            required: false,
            choices: utils.elementsChoices,
          },
        ],
      },
    ],
  },
];
