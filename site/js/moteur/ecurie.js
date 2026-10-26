// Écurie : identité (nom, couleur, logo), rôles, permis mBot de chaque équipier, défis et carnet d'essais.
//
// Permis mBot : chaque équipier fait lui-même les exercices 1 à 8. Son travail (blocs, vérifications, réussites)
// est une rubrique « programmation » de Labo Blocs à son nom, dans ecurie.permis[prénom]. Les défis se programment
// en commun dans la rubrique « programmation » de l'écurie ; ils s'ouvrent dès qu'un équipier a fini son permis.

(function (global) {
  'use strict';

  const enNode = typeof module === 'object' && module.exports;
  const LB = enNode ? require(require('../../../tools/dependances-tests.js').noyau) : global.LaboBlocs;
  const P = enNode ? require('./progression.js') : global.Atelier;

  // Couleurs d'écurie : toutes lisibles avec un texte blanc (contraste ≥ 4,5:1) ; aucun rouge (réservé à rien).
  const COULEURS = [
    { valeur: '#1565C0', nom: 'Bleu mBot' },
    { valeur: '#0E7C7B', nom: 'Turquoise' },
    { valeur: '#2F6B2F', nom: 'Vert' },
    { valeur: '#6A4FB3', nom: 'Violet' },
    { valeur: '#9C2F6B', nom: 'Prune' },
    { valeur: '#B4530A', nom: 'Orange' },
    { valeur: '#7A5C00', nom: 'Bronze' },
    { valeur: '#33475B', nom: 'Ardoise' },
  ];

  // ---------- Identité ----------

  // { ok } ou { ok: false, raison } ; rien n'est modifié si c'est refusé.
  function changerIdentite(d, identite) {
    const nom = String(identite.nom || '').trim().replace(/\s+/g, ' ');
    if (nom.length < 2) return { ok: false, raison: 'Le nom de l’écurie doit avoir au moins 2 lettres.' };
    if (nom.length > 24) return { ok: false, raison: 'Le nom de l’écurie doit tenir en 24 caractères.' };
    const couleur = identite.couleur || d.ecurie.couleur || COULEURS[0].valeur;
    if (!COULEURS.some((c) => c.valeur === couleur)) return { ok: false, raison: 'Choisis une des couleurs proposées.' };
    d.ecurie.nom = nom;
    d.ecurie.couleur = couleur;
    return { ok: true };
  }

  // ---------- Rôles ----------

  // roles : prénom → [id de rôle]. Un seul chef de projet, un seul reporter, jamais la même personne ; les autres
  // rôles se cumulent. Un changement est gardé dans l'historique (le professeur voit qui a eu quel rôle et quand).
  function changerRoles(d, roles) {
    const ids = P.ROLES.map((r) => r.id);
    const propres = {};
    for (const prenom of d.equipe.eleves) {
      propres[prenom] = ids.filter((id) => ((roles && roles[prenom]) || []).includes(id));
    }
    const avec = (id) => d.equipe.eleves.filter((p) => propres[p].includes(id));
    const double = P.rolesIncompatibles(propres);
    if (double.length) return { ok: false, raison: `${double[0]} ne peut pas être à la fois chef de projet et reporter.` };
    if (avec('chef').length !== 1) return { ok: false, raison: 'Il faut un chef de projet, et un seul.' };
    if (d.equipe.eleves.length > 1 && avec('reporter').length !== 1) return { ok: false, raison: 'Il faut un reporter, et un seul.' };
    if (JSON.stringify(propres) !== JSON.stringify(d.ecurie.roles)) {
      d.ecurie.roles = propres;
      d.ecurie.historiqueRoles.push({ date: P.maintenant(), roles: JSON.parse(JSON.stringify(propres)) });
    }
    return { ok: true };
  }

  const aLeRole = (d, prenom, id) => ((d.ecurie.roles || {})[prenom] || []).includes(id);
  const avecRole = (d, id) => d.equipe.eleves.find((p) => aLeRole(d, p, id)) || null;

  // ---------- Parcours : permis (exercices) et défis ----------

  // Le parcours de Labo Blocs coupé en deux paquets : exercices (permis de chaque équipier) et défis (écurie).
  function paquets(brut) {
    const estDefi = (e) => /^D/i.test(String(e.numero));
    const partie = (garder) => LB.preparer(Object.assign({}, brut, { exercices: brut.exercices.filter(garder) }));
    return { permis: partie((e) => !estDefi(e)), defis: partie(estDefi) };
  }

  // Données « comme une équipe » pour Labo Blocs : un équipier seul et sa rubrique de permis. L'écran d'exercice de
  // Labo Blocs écrit dans vue.programmation, qui est la rubrique rangée dans le fichier de l'écurie.
  function vuePermis(d, prenom, paquet) {
    if (!d.equipe.eleves.includes(prenom)) throw new Error('Équipier inconnu : ' + prenom);
    d.ecurie.permis = d.ecurie.permis || {};
    const place = (d.ecurie.permis[prenom] = d.ecurie.permis[prenom] || {});
    if (!place.programmation) place.programmation = LB.creerSauvegarde({ eleves: [prenom], classe: d.equipe.classe }, { parcours: paquet }).programmation;
    const vue = { application: d.application, formatVersion: d.formatVersion, equipe: { eleves: [prenom], classe: d.equipe.classe } };
    Object.defineProperty(vue, 'programmation', { enumerable: true, get: () => place.programmation, set: (r) => (place.programmation = r) });
    Object.defineProperty(vue, 'modifieLe', { enumerable: true, get: () => d.modifieLe, set: (v) => (d.modifieLe = v) });
    LB.relierParcours(vue, paquet);
    return vue;
  }

  // Avancement du permis d'un équipier : { reussis, total, fini, statuts: { id: 'reussi' | 'en_cours' | … } }.
  function etatPermis(d, prenom, paquet) {
    const vue = vuePermis(d, prenom, paquet);
    const statuts = {};
    for (const e of paquet.exercices) statuts[e.id] = LB.etat(vue, paquet, e.id);
    const reussis = paquet.exercices.filter((e) => statuts[e.id] === 'reussi').length;
    return { reussis, total: paquet.exercices.length, fini: reussis === paquet.exercices.length, statuts };
  }

  // Les défis s'ouvrent dès qu'un équipier a fini son permis (il pourra montrer aux autres).
  function defisOuverts(d, paquet) {
    return d.equipe.eleves.some((p) => etatPermis(d, p, paquet).fini);
  }

  // Défis de l'écurie (rubrique « programmation » de l'écurie) : statut de chacun.
  function etatDefis(d, paquet) {
    LB.relierParcours(d, paquet);
    const statuts = {};
    for (const e of paquet.exercices) {
      const x = d.programmation.exercices[e.id];
      statuts[e.id] = x && x.statut === 'reussi' ? 'reussi' : x && x.statut === 'en_cours' ? 'en_cours' : 'a_faire';
    }
    return statuts;
  }

  // ---------- Carnet d'essais ----------

  // essai : { defi, temps (s, ou null), compteur (nombre ou null), reussi (bool), reglage, hypothese, qui }
  function ajouterEssai(d, essai, defis) {
    const defi = defis.find((x) => x.id === essai.defi);
    if (!defi) return { ok: false, raison: 'Choisis le défi essayé.' };
    const temps = essai.temps === null || essai.temps === undefined || essai.temps === '' ? null : Number(essai.temps);
    if (temps !== null && !(temps > 0 && temps < 3600)) return { ok: false, raison: 'Le temps doit être un nombre de secondes.' };
    let compteur = null;
    if (defi.compteur && essai.compteur !== '' && essai.compteur !== null && essai.compteur !== undefined) {
      compteur = Number(essai.compteur);
      if (!Number.isInteger(compteur) || compteur < 0 || (defi.compteur.max !== undefined && compteur > defi.compteur.max)) {
        return { ok: false, raison: `« ${defi.compteur.libelle} » : écris un nombre entier${defi.compteur.max !== undefined ? ' de 0 à ' + defi.compteur.max : ''}.` };
      }
    }
    if (temps === null && compteur === null && !String(essai.reglage || '').trim()) {
      return { ok: false, raison: 'Note au moins un temps, un compte ou le réglage essayé.' };
    }
    const propre = {
      id: 'essai-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1e6).toString(36),
      date: P.maintenant(),
      defi: defi.id,
      temps: temps === null ? null : Math.round(temps * 10) / 10,
      compteur,
      reussi: !!essai.reussi,
      reglage: String(essai.reglage || '').trim().slice(0, 300),
      hypothese: String(essai.hypothese || '').trim().slice(0, 500),
      qui: String(essai.qui || '').trim(),
    };
    d.ecurie.essais.push(propre);
    return { ok: true, essai: propre };
  }

  const essaisDe = (d, defi) => d.ecurie.essais.filter((e) => e.defi === defi).sort((a, b) => String(b.date).localeCompare(String(a.date)));

  // Meilleur essai réussi : le plus court pour un temps à battre ; pour le défilé, le plus proche de 30 s.
  function meilleurEssai(d, defi) {
    const reussis = essaisDe(d, defi.id).filter((e) => e.reussi && e.temps !== null);
    if (!reussis.length) return null;
    const ecart = (e) => (defi.mesure === 'duree' ? Math.abs(e.temps - 30) : e.temps);
    return reussis.reduce((m, e) => (ecart(e) < ecart(m) ? e : m));
  }

  const api = {
    COULEURS,
    changerIdentite,
    changerRoles,
    aLeRole,
    avecRole,
    paquets,
    vuePermis,
    etatPermis,
    defisOuverts,
    etatDefis,
    ajouterEssai,
    essaisDe,
    meilleurEssai,
  };
  if (enNode) module.exports = api;
  else Object.assign((global.Atelier = global.Atelier || {}), { ecurie: api });
})(this);
