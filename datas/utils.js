import fs from "fs";

// Chemin vers le fichier de données
const DATA_FILE = "./datas/datas.json";
// Gestionnaire de données
export const datas = loadDatas();

// Fonction utilitaire : Charger les données
export function loadDatas() {
  if (!fs.existsSync(DATA_FILE)) {
    // Si le fichier n'existe pas, le créer avec une structure vide
    fs.writeFileSync(DATA_FILE, JSON.stringify({}));
    return {};
  }

  const rawData = fs.readFileSync(DATA_FILE);
  return JSON.parse(rawData);
}

// Fonction utilitaire : Sauvegarder les données
export function saveData(datas) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(datas, null, 2)); // Formatage pour lisibilité
}

export function updateUserPseudo(userId, username) {
  if (!username) return; // Si aucun pseudo n'est fourni, on ignore
  if (!datas[userId]) {
    datas[userId] = { metiers: {}, classe: null };
  }
  datas[userId].pseudo = username; // Met à jour ou ajoute le pseudo
  saveData(datas); // Sauvegarde les modifications
}

// Exemple : Ajouter un métier pour un utilisateur
export function addJob(userId, jobName, level, username) {
  updateUserPseudo(userId, username); // Met à jour le pseudo
  if (!datas[userId]) datas[userId] = { metiers: {}, classe: null };
  datas[userId].metiers[jobName] = level;
  saveData(datas); // Sauvegarde des modifications
}

// Exemple : Supprimer un métier pour un utilisateur
export function deleteJob(userId, jobName, username) {
  updateUserPseudo(userId, username); // Met à jour le pseudo
  if (datas[userId] && datas[userId].metiers[jobName]) {
    delete datas[userId].metiers[jobName];
    saveData(datas); // Sauvegarde des modifications
  }
}

// Exemple : Ajouter ou modifier une classe pour un utilisateur
export function setClass(userId, className, level, element, username) {
  updateUserPseudo(userId, username); // Met à jour le pseudo
  if (!datas[userId]) {
    datas[userId] = { metiers: {}, classe: null };
  }
  datas[userId].classe = { nom: className, niveau: level, element };
  saveData(datas); // Sauvegarde des modifications
}

// Exemple : Supprimer une classe pour un utilisateur
export function deleteClass(userId, username) {
  updateUserPseudo(userId, username); // Met à jour le pseudo
  if (datas[userId] && datas[userId].classe) {
    datas[userId].classe = null;
    saveData(datas); // Sauvegarde des modifications
  }
}

// Exemple : Recherche de joueurs ayant un métier spécifique
export function searchByJob(jobName, niveauMin = 1) {
  return Object.entries(datas)
    .filter(([_, info]) => info.metiers && info.metiers[jobName]) // Filtrer par métier
    .map(([userId, info]) => ({
      userId,
      level: info.metiers[jobName],
    }))
    .filter(({ level }) => level >= niveauMin); // Appliquer le filtre de niveau minimum
}

// Exemple : Recherche de joueurs ayant une classe spécifique
export function searchByClass(className, niveauMin = 1, element = null) {
  return Object.entries(datas)
    .filter(([_, info]) => {
      // Vérifie si la classe existe et correspond au nom, sinon renvoie false
      const matchesClass = info.classe && info.classe.nom === className;

      // Vérifie si la classe existe et si le niveau est au moins niveauMin, sinon renvoie false
      const matchesLevel = info.classe
        ? info.classe.niveau >= niveauMin
        : false;

      // Vérifie si l'élément est spécifié, et si oui, compare l'élément, sinon renvoie true
      const matchesElement = element
        ? info.classe && info.classe.element === element
        : true;

      // Si la classe n'est pas définie (null ou undefined), matchesClass et matchesLevel seront faux.
      return matchesClass && matchesLevel && matchesElement;
    })
    .map(([userId, info]) => ({
      userId,
      level: info.classe ? info.classe.niveau : 0, // Définit un niveau par défaut si la classe est absente
      element: info.classe ? info.classe.element : "Aucun", // Définit un élément par défaut si la classe est absente
    }));
}
