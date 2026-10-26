// Tournoi du jour J : écuries, ordre de passage, résultats de chaque épreuve, points par place, classement général de
// la classe et classement de toutes les classes. Le fichier du tournoi est gardé par la régie (navigateur + fichier du
// professeur) et se reprend le deuxième jour.
//
//   tournoi : { format, version, classe, creeLe, ecuries: [{ cle, nom, couleur, eleves }], ordre: [clé],
//     jours: { épreuve: 1 | 2 }, resultats: { <épreuve chrono ou obstacles>: { clé: { temps, malus, objets, abandon, date } },
//     recolte: { matchs: [{ id, a, b, scoreA, scoreB, fini }] }, affiche: { clé: votes }, style: { classement: [clé] } } }

(function (global) {
  'use strict';

  // « mBot sorti » reste « mBot sorti » : seule la première lettre passe en minuscule.
  const minuscule = (s) => String(s).charAt(0).toLowerCase() + String(s).slice(1);

  const enNode = typeof module === 'object' && module.exports;
  const FORMAT = 'mbot-challenge/tournoi';
  const maintenant = () => new Date().toISOString().slice(0, 19);

  function creerTournoi(ecuries, classe, config) {
    const jours = {};
    for (const e of config.epreuves) jours[e.id] = e.jour || 1;
    return {
      format: FORMAT,
      version: 1,
      classe: classe || '',
      creeLe: maintenant(),
      ecuries: ecuries.map((e) => ({ cle: e.cle, nom: e.nom, couleur: e.couleur || null, eleves: (e.eleves || []).slice() })),
      ordre: ecuries.map((e) => e.cle),
      jours,
      resultats: { recolte: { matchs: [] }, affiche: {}, style: { classement: [] } },
    };
  }

  function lireTournoi(texte) {
    let t;
    try {
      t = JSON.parse(String(texte).replace(/^﻿/, ''));
    } catch {
      return { ok: false, raison: 'Ce fichier de tournoi est illisible.' };
    }
    if (!t || t.format !== FORMAT) return { ok: false, raison: 'Ce fichier n’est pas un tournoi du mBot Challenge.' };
    if (t.version > 1) return { ok: false, raison: 'Ce tournoi vient d’une version plus récente de l’outil.' };
    t.resultats = Object.assign({ recolte: { matchs: [] }, affiche: {}, style: { classement: [] } }, t.resultats);
    return { ok: true, tournoi: t };
  }

  const epreuve = (config, id) => config.epreuves.find((e) => e.id === id);
  const nomDe = (t, cle) => (t.ecuries.find((e) => e.cle === cle) || { nom: cle }).nom;

  // Mélange (Fisher-Yates) ; aleatoire : fonction 0–1 (tests).
  function melanger(liste, aleatoire) {
    const r = aleatoire || Math.random;
    const l = liste.slice();
    for (let i = l.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [l[i], l[j]] = [l[j], l[i]];
    }
    return l;
  }
  function tirerOrdre(t, aleatoire) {
    t.ordre = melanger(t.ecuries.map((e) => e.cle), aleatoire);
    return t.ordre;
  }

  // Récolte : chaque écurie joue 2 matchs contre 2 adversaires différents (un cycle tiré au sort : A-B, B-C, …, Z-A).
  // Ordre des matchs : une écurie ne joue jamais deux matchs de suite quand c'est possible.
  function tirerRecolte(t, aleatoire) {
    const l = melanger(t.ecuries.map((e) => e.cle), aleatoire);
    const n = l.length;
    let matchs = [];
    if (n === 2) matchs = [[l[0], l[1]], [l[1], l[0]]];
    else if (n > 2) {
      const paires = l.map((a, i) => [a, l[(i + 1) % n]]);
      matchs = paires.filter((_, i) => i % 2 === 0).concat(paires.filter((_, i) => i % 2 === 1));
    }
    t.resultats.recolte.matchs = matchs.map(([a, b], i) => ({ id: 'm' + (i + 1), a, b, scoreA: 0, scoreB: 0, fini: false }));
    return t.resultats.recolte.matchs;
  }

  // Passage d'une écurie à une épreuve chronométrée (ou « obstacles »). temps en secondes.
  function noterPassage(t, config, idEpreuve, cle, passage) {
    const e = epreuve(config, idEpreuve);
    if (!e || (e.sorte !== 'chrono' && e.sorte !== 'obstacles')) throw new Error('Épreuve sans chrono : ' + idEpreuve);
    t.resultats[idEpreuve] = t.resultats[idEpreuve] || {};
    t.resultats[idEpreuve][cle] = {
      temps: passage.temps === null || passage.temps === undefined ? null : Math.round(Number(passage.temps) * 100) / 100,
      malus: Math.max(0, Math.round(Number(passage.malus) || 0)),
      objets: e.sorte === 'obstacles' ? Math.max(0, Math.min(e.objets, Math.round(Number(passage.objets) || 0))) : undefined,
      abandon: !!passage.abandon,
      date: maintenant(),
    };
    return t.resultats[idEpreuve][cle];
  }
  function effacerPassage(t, idEpreuve, cle) {
    if (t.resultats[idEpreuve]) delete t.resultats[idEpreuve][cle];
  }

  const tempsRetenu = (e, r) => (r.temps === null ? null : Math.round((r.temps + r.malus * ((e.malus && e.malus.secondes) || 0)) * 100) / 100);

  // Passage réussi : arrivé (pas d'abandon) ; obstacles : tous les objets sortis dans le temps.
  function reussi(e, r) {
    if (r.abandon || r.temps === null) return false;
    if (e.sorte === 'obstacles') return r.objets === e.objets && r.temps <= e.tempsMax;
    return true;
  }

  // Bilan de la Récolte par écurie : matchs joués, victoires (match nul : ½), balles.
  function bilanRecolte(t) {
    const b = {};
    for (const m of t.resultats.recolte.matchs.filter((x) => x.fini)) {
      for (const [moi, pour, contre] of [[m.a, m.scoreA, m.scoreB], [m.b, m.scoreB, m.scoreA]]) {
        b[moi] = b[moi] || { joues: 0, victoires: 0, balles: 0 };
        b[moi].joues++;
        b[moi].balles += pour;
        b[moi].victoires += pour > contre ? 1 : pour === contre ? 0.5 : 0;
      }
    }
    return b;
  }

  // Places avec égalités : liste triée, egal(a, b) → même place ; la place suivante saute (1, 2, 2, 4).
  function placer(triee, egal) {
    let place = 0;
    return triee.map((x, i) => {
      if (i === 0 || !egal(triee[i - 1], x)) place = i + 1;
      return Object.assign(x, { place });
    });
  }
  const pointsDePlace = (config, place) => (config.points[place - 1] !== undefined ? config.points[place - 1] : config.points[config.points.length - 1]);

  // Classement d'une épreuve dans la classe : [{ cle, nom, place, points, reussi, valeur, detail }] ; les écuries pas
  // encore passées sont à la fin, sans place ni points.
  function classementEpreuve(t, config, idEpreuve) {
    const e = epreuve(config, idEpreuve);
    let lignes = [];
    if (e.sorte === 'chrono' || e.sorte === 'obstacles') {
      const res = t.resultats[idEpreuve] || {};
      lignes = Object.entries(res).map(([cle, r]) => {
        const ok = reussi(e, r);
        const tr = tempsRetenu(e, r);
        const detail = [r.temps === null ? '' : `${String(r.temps).replace('.', ',')} s`, r.malus ? `+${r.malus} ${minuscule(e.malus.libelle)}` : '', e.sorte === 'obstacles' ? `${r.objets}/${e.objets} objets` : '', r.abandon ? 'abandon' : ''].filter(Boolean).join(' · ');
        return { cle, reussi: ok, cleTri: ok ? tr : Infinity, valeur: ok ? `${String(tr).replace('.', ',')} s` : e.sorte === 'obstacles' && !r.abandon ? 'non validé' : 'abandon', detail };
      });
      lignes.sort((a, b) => a.cleTri - b.cleTri);
    } else if (e.sorte === 'duel') {
      const b = bilanRecolte(t);
      lignes = Object.entries(b).map(([cle, x]) => ({ cle, reussi: true, x, valeur: `${String(x.victoires).replace('.', ',')} victoire${x.victoires >= 2 ? 's' : ''}`, detail: `${x.balles} balle${x.balles > 1 ? 's' : ''} · ${x.joues} match${x.joues > 1 ? 's' : ''}` }));
      lignes.sort((a, b2) => b2.x.victoires - a.x.victoires || b2.x.balles - a.x.balles);
    } else if (e.sorte === 'votes') {
      lignes = Object.entries(t.resultats.affiche || {}).filter(([, v]) => v !== null && v !== '').map(([cle, v]) => ({ cle, reussi: true, votes: Number(v), valeur: `${v} vote${Number(v) > 1 ? 's' : ''}`, detail: '' }));
      lignes.sort((a, b) => b.votes - a.votes);
    } else if (e.sorte === 'jury') {
      lignes = (t.resultats.style.classement || []).map((cle, i) => ({ cle, reussi: true, rang: i, valeur: `${i + 1}${i ? 'ᵉ' : 'ᵉʳ'} du jury`, detail: '' }));
    }
    const egal = {
      chrono: (a, b) => a.reussi === b.reussi && (a.reussi ? a.cleTri === b.cleTri : true),
      obstacles: (a, b) => a.reussi === b.reussi && (a.reussi ? a.cleTri === b.cleTri : true),
      duel: (a, b) => a.x.victoires === b.x.victoires && a.x.balles === b.x.balles,
      votes: (a, b) => a.votes === b.votes,
      jury: () => false,
    }[e.sorte];
    placer(lignes, egal);
    for (const l of lignes) {
      l.nom = nomDe(t, l.cle);
      l.points = l.reussi ? pointsDePlace(config, l.place) : config.pointsNonReussi;
    }
    const passes = new Set(lignes.map((l) => l.cle));
    const attente = t.ordre.filter((c) => !passes.has(c)).map((cle) => ({ cle, nom: nomDe(t, cle), place: null, points: null, reussi: null, valeur: 'pas encore passé', detail: '' }));
    return lignes.concat(attente);
  }

  // Classement général de la classe : somme des points des épreuves (jour : seulement les épreuves de ce jour et des
  // jours d'avant). [{ cle, nom, couleur, total, points: { épreuve: n | null }, place }]
  function classementGeneral(t, config, jourMax) {
    const epreuves = config.epreuves.filter((e) => !jourMax || (t.jours[e.id] || 1) <= jourMax);
    const parEpreuve = Object.fromEntries(epreuves.map((e) => [e.id, Object.fromEntries(classementEpreuve(t, config, e.id).map((l) => [l.cle, l.points]))]));
    const lignes = t.ecuries.map((x) => {
      const points = Object.fromEntries(epreuves.map((e) => [e.id, parEpreuve[e.id][x.cle] === undefined ? null : parEpreuve[e.id][x.cle]]));
      return { cle: x.cle, nom: x.nom, couleur: x.couleur, points, total: Object.values(points).reduce((s, p) => s + (p || 0), 0) };
    });
    lignes.sort((a, b) => b.total - a.total || a.nom.localeCompare(b.nom, 'fr'));
    return placer(lignes, (a, b) => a.total === b.total);
  }

  // Classement de toutes les classes : toutes les écuries reclassées ensemble, épreuve par épreuve, sur leurs résultats
  // (temps, objets, victoires, votes ; pour le jury, son rang ramené à la taille de la classe), puis points :
  // 1ʳᵉ place = nombre total d'écuries, dernière = 1. [{ classe, cle, nom, total, place }]
  function classementToutesClasses(tournois, config) {
    const toutes = tournois.flatMap((t) => t.ecuries.map((x) => ({ classe: t.classe, cle: t.classe + '|' + x.cle, nom: x.nom, couleur: x.couleur, total: 0 })));
    const N = toutes.length;
    for (const e of config.epreuves) {
      const valeurs = [];
      for (const t of tournois) {
        const n = t.ecuries.length;
        for (const l of classementEpreuve(t, config, e.id)) {
          if (l.place === null) continue;
          let score; // plus grand = meilleur
          if (e.sorte === 'chrono' || e.sorte === 'obstacles') score = l.reussi ? -l.cleTri : -1e9;
          else if (e.sorte === 'duel') score = l.x.victoires / l.x.joues + (l.x.balles / l.x.joues) / 1000;
          else if (e.sorte === 'votes') score = l.votes;
          else score = n > 1 ? 1 - l.rang / (n - 1) : 1;
          valeurs.push({ cle: t.classe + '|' + l.cle, score });
        }
      }
      valeurs.sort((a, b) => b.score - a.score);
      placer(valeurs, (a, b) => a.score === b.score);
      for (const v of valeurs) toutes.find((x) => x.cle === v.cle).total += N - v.place + 1;
    }
    toutes.sort((a, b) => b.total - a.total || a.nom.localeCompare(b.nom, 'fr'));
    return placer(toutes, (a, b) => a.total === b.total);
  }

  const api = {
    FORMAT,
    creerTournoi,
    lireTournoi,
    melanger,
    tirerOrdre,
    tirerRecolte,
    noterPassage,
    effacerPassage,
    tempsRetenu,
    reussi,
    bilanRecolte,
    classementEpreuve,
    classementGeneral,
    classementToutesClasses,
  };
  if (enNode) module.exports = api;
  else Object.assign((global.Atelier = global.Atelier || {}), { tournoi: api });
})(this);
