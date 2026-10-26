// Fichier d'une écurie : tout son travail tient dans un seul objet, enregistré dans Prénom_Prénom.json.
//
//   programmation  rubrique de Labo Blocs (exercices et défis) : écrite seulement par Labo Blocs
//   ecurie         rubrique du projet : identité de l'écurie, rôles, séances, rapports, essais, livrables
//
// Les médias (affiche, STL, photos, vidéos) restent dans des sous-dossiers du dossier de l'écurie : le fichier ne
// garde que leur nom et leur date.

(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;
  const LB = enNode ? require(require('../../../tools/dependances-tests.js').noyau) : global.LaboBlocs;

  const APPLICATION = 'mbot-challenge';
  const FORMAT = 1;
  const FORMAT_ECURIE = 1;

  const ROLES = [
    { id: 'chef', nom: 'Chef de projet' },
    { id: 'reporter', nom: 'Reporter' },
    { id: 'programmeur', nom: 'Programmeur' },
    { id: 'designer', nom: 'Designer' },
    { id: 'essais', nom: 'Ingénieur d’essais' },
    { id: 'pilote', nom: 'Pilote' },
  ];

  const nomEquipe = LB.nomEquipe;
  const simplifierNom = LB.simplifierNom;

  // Date locale au format des sauvegardes de Labo Blocs (2026-10-26T10:42:05).
  function maintenant() {
    const d = new Date();
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function ecurieVide() {
    return {
      format: FORMAT_ECURIE,
      nom: '',
      couleur: null,
      logo: null, // nom du fichier image dans le dossier de l'écurie
      roles: {}, // prénom → [id de rôle]
      historiqueRoles: [], // { date, roles }
      seances: [], // points de départ et de fin (jalon 3)
      rapports: [], // rapports du reporter (jalon 3)
      essais: [], // carnet d'essais des défis (jalon 2)
      livrables: {}, // affiche, style, vidéos (jalon 3)
    };
  }

  // Rubrique d'une ancienne version ou incomplète : on ajoute ce qui manque, rien n'est retiré.
  function completerEcurie(e) {
    const vide = ecurieVide();
    if (!e || typeof e !== 'object') return vide;
    for (const [cle, valeur] of Object.entries(vide)) if (!(cle in e)) e[cle] = valeur;
    return e;
  }

  // equipe : { eleves: [prénoms], classe }
  function creer(equipe) {
    const d = LB.creerSauvegarde(equipe, { application: APPLICATION });
    delete d.projet;
    d.formatVersion = FORMAT;
    d.ecurie = ecurieVide();
    return d;
  }

  // Vérifie un fichier ouvert par l'écurie. Rien n'est modifié si le fichier est refusé.
  //   { ok, donnees } ou { ok: false, raison }
  function lire(texte) {
    let d;
    try {
      d = JSON.parse(String(texte).replace(/^﻿/, ''));
    } catch {
      return { ok: false, raison: 'Ce fichier n’est pas une sauvegarde du mBot Challenge : il est illisible.' };
    }
    if (!d || d.application !== APPLICATION) {
      return { ok: false, raison: 'Ce fichier vient d’une autre application : ce n’est pas une sauvegarde du mBot Challenge.' };
    }
    if (typeof d.formatVersion !== 'number' || d.formatVersion > FORMAT || (d.programmation && d.programmation.version > 1)) {
      return { ok: false, raison: 'Cette sauvegarde vient d’une version plus récente de l’outil : demande à ton professeur.' };
    }
    if (!d.equipe || !Array.isArray(d.equipe.eleves) || !d.equipe.eleves.length) {
      return { ok: false, raison: 'Cette sauvegarde est incomplète : il manque les équipiers.' };
    }
    if (d.ecurie && d.ecurie.format > FORMAT_ECURIE) {
      return { ok: false, raison: 'Cette sauvegarde vient d’une version plus récente de l’outil : demande à ton professeur.' };
    }
    d.ecurie = completerEcurie(d.ecurie);
    d.programmation = d.programmation || LB.creerSauvegarde(d.equipe, {}).programmation;
    return { ok: true, donnees: d };
  }

  // Une modification a eu lieu : date de dernière modification (lue par le suivi du professeur).
  function toucher(d) {
    d.modifieLe = maintenant();
  }

  // Nom affiché : celui de l'écurie s'il est choisi, sinon les prénoms.
  function nomAffiche(d) {
    return (d.ecurie && d.ecurie.nom) || d.equipe.eleves.join(', ');
  }

  // Rôles : chaque équipier peut en cumuler plusieurs, mais le chef de projet n'est jamais le reporter.
  //   [] si tout va bien, sinon la liste des prénoms concernés.
  function rolesIncompatibles(roles) {
    return Object.entries(roles || {})
      .filter(([, liste]) => liste.includes('chef') && liste.includes('reporter'))
      .map(([prenom]) => prenom);
  }

  const api = {
    APPLICATION,
    FORMAT,
    ROLES,
    nomEquipe,
    simplifierNom,
    maintenant,
    ecurieVide,
    completerEcurie,
    creerProgression: creer,
    lireSauvegarde: lire,
    toucher,
    nomAffiche,
    rolesIncompatibles,
  };
  if (enNode) module.exports = api;
  else Object.assign((global.Atelier = global.Atelier || {}), api);
})(this);
