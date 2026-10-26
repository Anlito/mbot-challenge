// Outil professeur : dossier de la classe lu en direct, tableau des écuries et « À regarder », fiche de chaque écurie
// (bilan et notation, séances, rapports, programmation, défis, affiche, style, vidéos, comprendre), barème, exports,
// planche des affiches à imprimer. Les évaluations du professeur restent dans son navigateur et dans son fichier.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const C = A.classe;
  const E = A.ecurie;
  const L = A.livrables;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const nombreFr = (x) => String(x).replace('.', ',');
  const heure = (iso) => (iso ? new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '—');
  const date = (iso) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' ' + heure(iso) : '—');
  const aujourdhui = () => A.maintenant().slice(0, 10);
  const CLE_DOSSIER = 'prof-dossier-classe';
  const LECTURE_MS = 10000;

  let ctx = null;
  let ecuries = []; // [{ cle, chemin, donnees, dossier (handle du dossier de l'écurie, ou null) }]
  let dossierClasse = null;
  let minuteur = null;
  let derniereLecture = null;
  let classe = '';
  let ev = null; // évaluations de la classe
  let ficheCle = null;
  let ficheOnglet = 'bilan';
  const deja = new Map(); // chemin → { modifie, texte }

  // ---------- Affichage des vues ----------

  function montrer(vue) {
    for (const v of document.querySelectorAll('.vue')) v.hidden = !v.classList.contains('vue-' + vue);
    $('.prof-actions').hidden = vue === 'accueil';
    scrollTo(0, 0);
  }
  function message(texte, duree) {
    const t = $('.message-bref');
    t.textContent = texte;
    t.hidden = false;
    clearTimeout(message.minuteur);
    message.minuteur = setTimeout(() => (t.hidden = true), duree || 2800);
  }
  function poserIcones(racine) {
    for (const el of racine.querySelectorAll('[data-icone]')) {
      if (el.querySelector('svg')) continue;
      el.insertAdjacentHTML('afterbegin', A.icone(el.dataset.icone, { epaisseur: 2.2 }));
    }
  }
  const pastille = (d, taille) => {
    const t = E.theme(d.ecurie.couleur);
    return `<span class="ecurie-pastille ${taille || ''}" style="--ecurie:${t.ecurieFond};--ecurie-texte:${t.ecurieTexte}" aria-hidden="true">${echapper((A.nomAffiche(d).replace(/^(les?|la)\s+/i, '')[0] || '?').toUpperCase())}</span>`;
  };

  // ---------- Lecture du dossier de la classe ----------

  async function lireDossier(dossier, chemin, profondeur, trouves) {
    for await (const h of dossier.values()) {
      if (h.kind === 'file' && /\.json$/i.test(h.name) && !/^validations\.json$/i.test(h.name)) {
        const f = await h.getFile();
        const ch = chemin + h.name;
        const avant = deja.get(ch);
        const texte = avant && avant.modifie === f.lastModified ? avant.texte : await f.text();
        deja.set(ch, { modifie: f.lastModified, texte });
        trouves.push({ chemin: ch, texte, dossier });
      } else if (h.kind === 'directory' && profondeur > 0 && !/^(rapports|affiche|style|videos)$/i.test(h.name)) {
        await lireDossier(h, chemin + h.name + '/', profondeur - 1, trouves);
      }
    }
  }

  async function actualiser() {
    if (!dossierClasse) return;
    try {
      if ((await dossierClasse.queryPermission({ mode: 'read' })) !== 'granted') {
        $('.prof-direct').textContent = 'Suivi en pause : cliquez sur « Reprendre » pour autoriser la lecture.';
        return arreterSuivi();
      }
      const trouves = [];
      await lireDossier(dossierClasse, '', 3, trouves);
      charger(trouves);
      derniereLecture = new Date();
      majDirect();
    } catch {
      $('.prof-direct').textContent = 'Le dossier n’est plus lisible : rouvrez-le.';
    }
  }

  function majDirect() {
    const el = $('.prof-direct');
    el.hidden = false;
    el.textContent = dossierClasse ? `● En direct · lu à ${derniereLecture ? heure(derniereLecture.toISOString()) : '…'}` : 'Fichiers importés (pas de suivi en direct)';
  }

  function arreterSuivi() {
    clearInterval(minuteur);
    minuteur = null;
  }

  async function suivre(dossier) {
    dossierClasse = dossier;
    deja.clear();
    await A.dossierEcurie.memoriserCle(CLE_DOSSIER, dossier);
    arreterSuivi();
    await actualiser();
    minuteur = setInterval(() => {
      if (document.visibilityState === 'visible') actualiser();
    }, LECTURE_MS);
  }

  // fichiers : [{ chemin, texte, dossier }]
  function charger(fichiers) {
    const lu = C.lireEcuries(fichiers);
    ecuries = lu.ecuries.map((x) => Object.assign(x, { dossier: (fichiers.find((f) => f.chemin === x.chemin) || {}).dossier || null }));
    const classes = [...new Set(ecuries.map((x) => x.donnees.equipe.classe).filter(Boolean))];
    const nouvelle = classes.join(' · ') || 'Classe';
    if (nouvelle !== classe) {
      classe = nouvelle;
      ev = chargerEvaluations(classe);
    }
    $('.prof-classe').hidden = false;
    $('.prof-classe').textContent = classe;
    const ouverte = [...document.querySelectorAll('.vue')].find((v) => !v.hidden);
    if (ouverte && ouverte.classList.contains('vue-ecurie') && ficheCle) dessinerFiche(true);
    else if (!ouverte || !ouverte.classList.contains('vue-planche')) dessinerClasse();
  }

  // ---------- Évaluations : navigateur + fichier du professeur ----------

  const cleEval = (cl) => A.projet.id + '-evaluations-' + cl;
  function chargerEvaluations(cl) {
    try {
      const r = C.lireEvaluations(localStorage.getItem(cleEval(cl)) || '');
      if (r.ok) return r.evaluations;
    } catch { /* rien de gardé */ }
    return C.evaluationsVides(cl);
  }
  let fichierEval = null;
  let minuteurEval = null;
  function evaluationsModifiees() {
    try { localStorage.setItem(cleEval(classe), JSON.stringify(ev)); } catch { /* stockage plein */ }
    clearTimeout(minuteurEval);
    minuteurEval = setTimeout(ecrireFichierEvaluations, 1500);
  }
  async function ecrireFichierEvaluations(demander) {
    if (!fichierEval) fichierEval = await A.dossierEcurie.retrouverCle(cleEval(classe) + '-fichier');
    if (!fichierEval) return false;
    try {
      const mode = { mode: 'readwrite' };
      if ((await fichierEval.queryPermission(mode)) !== 'granted' && !(demander && (await fichierEval.requestPermission(mode)) === 'granted')) return false;
      const flux = await fichierEval.createWritable();
      await flux.write(JSON.stringify(ev, null, 1));
      await flux.close();
      return true;
    } catch {
      return false;
    }
  }

  // ---------- Classe ----------

  function etatCase(symbole, texte) {
    return `<span class="etat-case"><span aria-hidden="true">${symbole}</span> ${echapper(texte)}</span>`;
  }

  function dessinerClasse() {
    if (!ctx) return;
    montrer('classe');
    const res = ecuries.map((x) => ({ x, r: C.resumer(x.donnees, ctx) }));
    $('#titre-classe').textContent = `${classe} · ${ecuries.length} écurie${ecuries.length > 1 ? 's' : ''}`;
    const eleves = ecuries.reduce((n, x) => n + x.donnees.equipe.eleves.length, 0);
    $('.prof-sous-titre').textContent = `${eleves} élèves`;
    const auj = aujourdhui();
    const departs = res.filter(({ r }) => r.seance && r.seance.depart && r.seance.depart.slice(0, 10) === auj).length;
    const permis = res.reduce((n, { r }) => n + r.permisFinis, 0);
    const affiches = res.filter(({ r }) => r.affiches).length;
    $('.chiffres-cles').innerHTML = [
      ['Points de départ aujourd’hui', `${departs} / ${ecuries.length}`],
      ['Permis mBot obtenus', `${permis} / ${eleves}`],
      ['Défis prêts', `${res.reduce((n, { r }) => n + r.defisPrets, 0)} / ${ecuries.length * (ctx.paquets.defis.exercices.length)}`],
      ['Affiches déposées', `${affiches} / ${ecuries.length}`],
    ].map(([l, v]) => `<div class="chiffre-cle"><span>${l}</span><strong class="chiffre">${v}</strong></div>`).join('');

    const alertes = res.flatMap(({ x, r }) => C.alertes(x.donnees, r, ctx, auj).map((a) => ({ a, x, r })));
    $('.zone-alertes').innerHTML = alertes.length
      ? `<section class="encart-alertes" aria-label="À regarder"><strong>À regarder</strong><ul>${alertes.map(({ a, x, r }) => `<li><button type="button" class="btn-lien" data-ecurie="${echapper(x.cle)}">${echapper(r.nom)}</button> : ${echapper(a.texte)}</li>`).join('')}</ul></section>`
      : '';

    const n = (g) => C.noteGroupe(ev, A.notation, g).note;
    $('.tableau-classe').innerHTML = `
      <thead><tr>
        <th scope="col">Écurie</th><th scope="col">Séance</th><th scope="col">Permis</th><th scope="col">Défis</th>
        <th scope="col">Affiche</th><th scope="col">Style</th><th scope="col">Vidéos</th><th scope="col">Rapports</th>
        <th scope="col">Note</th><th scope="col">Activité</th>
      </tr></thead>
      <tbody>${res.map(({ x, r }) => {
        const s = r.seance;
        const seance = !s ? etatCase('○', 'pas commencé') : s.etat === 'en_cours' ? etatCase('●', `n° ${s.numero} lancée ${heure(s.depart)}`) : s.etat === 'finie' ? etatCase('✓', `n° ${s.numero} finie`) : etatCase('○', `n° ${s.numero}`);
        const note = n(x.cle);
        return `<tr>
          <th scope="row"><button type="button" class="lien-ecurie" data-ecurie="${echapper(x.cle)}">${pastille(x.donnees)}<span><strong>${echapper(r.nom)}</strong><span>${echapper(r.eleves.join(', '))}</span></span></button></th>
          <td>${seance}</td>
          <td class="chiffre">${r.permisFinis} / ${r.eleves.length}</td>
          <td>${r.defisOuverts ? etatCase(r.defisPrets ? '●' : '○', `${r.defisPrets} / ${r.defisTotal} prêts`) : etatCase('○', 'fermés')}</td>
          <td>${r.affiches ? etatCase('✓', 'v' + r.affiches) : etatCase('○', 'pas déposée')}</td>
          <td>${r.pieces + r.photosStyle ? etatCase('●', `${r.pieces} STL · ${r.photosStyle} photo(s)`) : etatCase('○', '—')}</td>
          <td>${etatCase(r.videosDeposees ? '✓' : r.plansStoryboard ? '●' : '○', `${r.videosDeposees} / 2`)}</td>
          <td class="chiffre">${r.rapportsRemis} / ${r.seancesFinies}</td>
          <td class="chiffre">${note === null ? '—' : nombreFr(note)}</td>
          <td>${date(r.modifieLe)}</td>
        </tr>`;
      }).join('') || '<tr><td colspan="10">Aucune écurie dans ce dossier pour l’instant.</td></tr>'}</tbody>`;
  }

  // ---------- Fiche d'une écurie ----------

  const ONGLETS = [
    ['bilan', 'Bilan et note'], ['seances', 'Séances'], ['rapports', 'Rapports'], ['programmation', 'Permis mBot'],
    ['defis', 'Défis'], ['affiche', 'Affiche'], ['style', 'Style'], ['videos', 'Vidéos'], ['comprendre', 'Comprendre'],
  ];

  function ouvrirFiche(cle) {
    ficheCle = cle;
    montrer('ecurie');
    dessinerFiche();
  }

  // Fichier de l'écurie (photo, affiche, STL, vidéo) : URL lisible, ou null (import sans dossier).
  const urls = new Map();
  async function urlFichier(x, chemin) {
    if (!x.dossier || !chemin) return null;
    const cle = x.cle + '|' + chemin;
    if (urls.has(cle)) return urls.get(cle);
    try {
      const morceaux = chemin.split('/');
      let d = x.dossier;
      for (const m of morceaux.slice(0, -1)) d = await d.getDirectoryHandle(m);
      const u = URL.createObjectURL(await (await d.getFileHandle(morceaux[morceaux.length - 1])).getFile());
      urls.set(cle, u);
      return u;
    } catch {
      return null;
    }
  }
  function remplirImages(racine, x) {
    for (const el of racine.querySelectorAll('[data-fichier]')) {
      urlFichier(x, el.dataset.fichier).then((u) => {
        if (!u) {
          el.innerHTML = '<span class="aide">Dans le dossier de l’écurie</span>';
          return;
        }
        const ch = el.dataset.fichier;
        if (/\.(png|jpe?g|webp|svg)$/i.test(ch)) el.innerHTML = `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="${echapper(el.dataset.alt || ch)}"></a>`;
        else if (/\.pdf$/i.test(ch)) el.innerHTML = `<iframe src="${u}" title="${echapper(el.dataset.alt || ch)}"></iframe>`;
        else if (/\.(mp4|webm|mov)$/i.test(ch)) el.innerHTML = `<video src="${u}" controls preload="metadata"></video>`;
        else if (/\.stl$/i.test(ch)) {
          el.innerHTML = '<canvas class="vue-piece"></canvas>';
          fetch(u).then((r) => r.arrayBuffer()).then((b) => A.vueStl(el.querySelector('canvas'), b));
        }
      });
    }
  }

  function dessinerFiche(miseAJour) {
    const i = ecuries.findIndex((x) => x.cle === ficheCle);
    if (i < 0) return dessinerClasse();
    const x = ecuries[i];
    const d = x.donnees;
    const res = C.resumer(d, ctx);
    const racine = $('.vue-ecurie');
    // Un professeur qui écrit (commentaire, motif) n'est pas interrompu par la relecture du dossier.
    if (miseAJour && racine.contains(document.activeElement) && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    $('.fiche-pastille', racine).innerHTML = pastille(d, 'grande');
    $('.fiche-titre h1', racine).textContent = res.nom;
    $('.fiche-membres', racine).textContent = d.equipe.eleves.map((p) => {
      const r = (d.ecurie.roles[p] || []).map((id) => (A.ROLES.find((x2) => x2.id === id) || { nom: id }).nom);
      return r.length ? `${p} (${r.join(', ')})` : p;
    }).join(' · ') + ` · ${d.equipe.classe}`;
    $('.btn-precedente', racine).disabled = i === 0;
    $('.btn-suivante', racine).disabled = i === ecuries.length - 1;
    $('.fiche-onglets', racine).innerHTML = ONGLETS.map(([id, t]) => `<button type="button" data-onglet="${id}" aria-current="${id === ficheOnglet ? 'page' : 'false'}">${t}</button>`).join('');
    const zone = $('.fiche-contenu', racine);
    const rendus = { bilan, seances, rapports, programmation, defis, affiche, style, videos, comprendre };
    zone.innerHTML = rendus[ficheOnglet](x, d, res);
    remplirImages(zone, x);
    brancher(zone, x, d);
  }

  // Bilan : indices, niveaux par critère, commentaire, ajustements individuels.
  function bilan(x, d, res) {
    const N = A.notation;
    const e = C.evaluationDe(ev, x.cle);
    const ind = C.indices(res, ctx);
    const g = C.noteGroupe(ev, N, x.cle);
    const notes = C.notesEleves(ev, N, x.cle, d.equipe.eleves);
    return `
      <div class="deux-colonnes">
        <section class="panneau" aria-labelledby="titre-note">
          <div class="panneau-entete"><h2 id="titre-note">Note de l’écurie</h2><strong class="note-groupe chiffre">${g.note === null ? '—' : nombreFr(g.note)} <span>/ 20</span></strong></div>
          <p class="aide"><span class="compte-criteres">${g.evalues} critère(s) évalué(s) sur ${g.total}</span>. Un critère pas encore évalué reste hors du total. Le classement du tournoi ne compte pas.</p>
          ${N.criteres.filter((c) => C.coefficient(ev, N, c)).map((c) => `
            <fieldset class="critere">
              <legend><strong>${echapper(c.nom)}</strong>${C.coefficient(ev, N, c) !== 1 ? ` <span class="aide">coef. ${C.coefficient(ev, N, c)}</span>` : ''}</legend>
              <p class="indice">${echapper(ind[c.id])}</p>
              <div class="niveaux">${N.niveaux.map((n) => `<label class="niveau niveau-${n.valeur}"><input type="radio" name="niv-${c.id}" value="${n.valeur}" data-critere="${c.id}"${e.niveaux[c.id] === n.valeur ? ' checked' : ''}><span>${n.court}</span></label>`).join('')}
                <button type="button" class="btn-lien effacer-niveau" data-critere="${c.id}">Effacer</button></div>
            </fieldset>`).join('')}
        </section>
        <section class="panneau" aria-labelledby="titre-ajust">
          <div class="panneau-entete"><h2 id="titre-ajust">Ajustement individuel</h2><span class="panneau-note">de −${N.ajustementMax} à +${N.ajustementMax} points, avec un motif</span></div>
          <table class="tableau-ajust">
            <thead><tr><th scope="col">Élève</th><th scope="col">Ajustement</th><th scope="col">Motif (comportement, investissement)</th><th scope="col">Note</th></tr></thead>
            <tbody>${notes.map((n) => `<tr>
              <th scope="row">${echapper(n.prenom)}</th>
              <td><input type="number" class="ajust-valeur" data-eleve="${echapper(n.prenom)}" min="-${N.ajustementMax}" max="${N.ajustementMax}" step="0.5" value="${n.ajustement || 0}" aria-label="Ajustement de ${echapper(n.prenom)}"></td>
              <td><input class="ajust-motif" data-eleve="${echapper(n.prenom)}" maxlength="200" value="${echapper(n.motif)}" aria-label="Motif pour ${echapper(n.prenom)}"></td>
              <td class="chiffre">${n.note === null ? '—' : nombreFr(n.note)}</td></tr>`).join('')}</tbody>
          </table>
          <label class="champ">Commentaire pour l’écurie<textarea class="commentaire" rows="4" maxlength="1500">${echapper(e.commentaire)}</textarea></label>
          <p class="aide">Rôles au fil du projet : ${d.ecurie.historiqueRoles.length ? d.ecurie.historiqueRoles.map((h) => `${date(h.date)} — ${Object.entries(h.roles).map(([p, r]) => `${p} : ${r.join('/') || '—'}`).join(', ')}`).map(echapper).join(' · ') : 'pas encore choisis'}</p>
        </section>
      </div>`;
  }

  function seances(x, d) {
    const e = C.evaluationDe(ev, x.cle);
    if (!d.ecurie.seances.length) return '<p class="panneau aide">Pas encore de séance.</p>';
    return d.ecurie.seances.slice().reverse().map((s) => `
      <section class="panneau">
        <div class="panneau-entete"><h2>Séance ${s.numero}</h2><span class="panneau-note">${s.depart ? 'lancée ' + date(s.depart.date) : 'pas lancée'}${s.fin ? ' · finie ' + heure(s.fin.date) : ''}</span></div>
        ${s.depart ? `<ul class="liste-taches-prof">${s.depart.taches.map((t) => `<li>${t.fait === true ? '✓' : t.fait === false ? '○' : '●'} <strong>${echapper(t.texte)}</strong> · ${echapper(t.qui === 'tous' ? 'toute l’écurie' : t.qui)}${t.minutes ? ' · ' + t.minutes + ' min' : ''}${t.livrable ? ' · ' + echapper(t.livrable) : ''}</li>`).join('')}</ul>` : ''}
        ${s.fin ? `<p><strong>Reste à faire :</strong> ${echapper(s.fin.reste || '—')}</p><p><strong>Bloquant :</strong> ${echapper(s.fin.bloquant || '—')}</p>` : ''}
        ${s.fin ? `<div class="accueil-actions">${e.points[s.numero]
          ? `<span class="pastille-etat ton-ok">✓ Point fait avec le chef de projet · ${date(e.points[s.numero])}</span><button type="button" class="btn-lien annuler-point" data-seance="${s.numero}">Annuler</button>`
          : `<button type="button" class="btn-principal faire-point" data-seance="${s.numero}">Point fait avec ${echapper(A.ecurie.avecRole(d, 'chef') || 'le chef de projet')}</button>`}</div>` : ''}
      </section>`).join('');
  }

  function rapports(x, d) {
    if (!d.ecurie.rapports.length) return '<p class="panneau aide">Pas encore de rapport.</p>';
    return d.ecurie.rapports.slice().reverse().map((r) => `
      <section class="panneau">
        <div class="panneau-entete"><h2>Rapport · séance ${r.seance}</h2><span class="panneau-note">${r.remisLe ? '✓ remis ' + date(r.remisLe) : '○ pas remis'}</span></div>
        <p class="texte-rapport">${echapper(r.texte || '—')}</p>
        <div class="galerie-photos">${r.photos.map((p) => `<figure><div class="vignette-attente" data-fichier="${echapper(p)}" data-alt="Photo du rapport, séance ${r.seance}">Photo</div></figure>`).join('')}</div>
      </section>`).join('');
  }

  function programmation(x, d) {
    const P = ctx.paquets.permis;
    const symbole = { reussi: '✓', a_reverifier: '↻', en_cours: '●', a_faire: '○', verrouille: '·' };
    return `<section class="panneau"><div class="panneau-entete"><h2>Permis mBot</h2></div>
      <div class="tableau-defilant"><table class="tableau-essais">
        <thead><tr><th scope="col">Élève</th>${P.exercices.map((e) => `<th scope="col" title="${echapper(e.titre)}">${e.numero}</th>`).join('')}<th scope="col">Réussis</th></tr></thead>
        <tbody>${d.equipe.eleves.map((p) => {
          const s = E.etatPermis(d, p, P);
          const rub = d.ecurie.permis[p].programmation;
          return `<tr><th scope="row">${echapper(p)}</th>${P.exercices.map((e) => {
            const x2 = rub.exercices[e.id];
            const essais = x2 ? (x2.historique || []).filter((h) => h.type === 'verification').length : 0;
            return `<td title="${essais} vérification(s)">${symbole[s.statuts[e.id]] || '○'}${essais ? `<span class="aide"> ${essais}</span>` : ''}</td>`;
          }).join('')}<td class="chiffre">${s.reussis} / ${s.total}</td></tr>`;
        }).join('')}</tbody></table></div>
      <p class="legende">✓ réussi · ● en cours · ○ à faire · ↻ à revérifier · · pas encore ouvert ; le petit nombre : vérifications faites.</p></section>`;
  }

  function defis(x, d) {
    const statuts = E.etatDefis(d, ctx.paquets.defis);
    return A.defis.map((df) => {
      const essais = E.essaisDe(d, df.id);
      const m = E.meilleurEssai(d, df);
      return `<section class="panneau">
        <div class="panneau-entete"><h2>${df.numero} · ${echapper(df.titre)}</h2><span class="panneau-note">programme ${statuts[df.id] === 'reussi' ? '✓ prêt' : statuts[df.id] === 'en_cours' ? '● en cours' : '○ à faire'} · meilleur ${m ? nombreFr(m.temps) + ' s' : '—'}</span></div>
        ${essais.length ? `<div class="tableau-defilant"><table class="tableau-essais"><thead><tr><th scope="col">Quand</th><th scope="col">Temps</th>${df.compteur ? `<th scope="col">${echapper(df.compteur.libelle)}</th>` : ''}<th scope="col">Résultat</th><th scope="col">Qui</th><th scope="col">Réglage</th><th scope="col">Hypothèse</th></tr></thead>
          <tbody>${essais.map((e) => `<tr><td>${date(e.date)}</td><td class="chiffre">${e.temps === null ? '—' : nombreFr(e.temps) + ' s'}</td>${df.compteur ? `<td class="chiffre">${e.compteur === null ? '—' : e.compteur}</td>` : ''}<td>${e.reussi ? '✓ réussi' : '○ pas encore'}</td><td>${echapper(e.qui || '—')}</td><td>${echapper(e.reglage || '—')}</td><td>${echapper(e.hypothese || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="aide">Aucun essai noté.</p>'}
      </section>`;
    }).join('');
  }

  function affiche(x, d) {
    const a = L.affiche(d);
    const der = a.versions[a.versions.length - 1];
    return `<section class="panneau"><div class="panneau-entete"><h2>Affiche</h2><span class="panneau-note">${a.versions.length} version(s) · contrôle ${ctx.livrables.affiche.controle.filter((c) => a.controle[c]).length}/${ctx.livrables.affiche.controle.length}</span></div>
      ${der ? `<div class="apercu-affiche" data-fichier="${echapper(der.chemin)}" data-alt="Affiche de l’écurie ${echapper(A.nomAffiche(d))}">Chargement…</div>` : '<p class="aide">Pas encore déposée.</p>'}
      <ul class="liste-versions">${a.versions.slice().reverse().map((v, i) => `<li>Version ${a.versions.length - i} · ${date(v.date)} · ${echapper(v.chemin)}</li>`).join('')}</ul>
      <ul class="liste-controle-prof">${ctx.livrables.affiche.controle.map((c) => `<li>${a.controle[c] ? '✓' : '○'} ${echapper(c)}</li>`).join('')}</ul></section>`;
  }

  function style(x, d) {
    const s = L.style(d);
    const max = ctx.livrables.style.dimensionsMax;
    return `<div class="deux-colonnes">
      <section class="panneau"><div class="panneau-entete"><h2>Le style</h2></div>
        <p><strong>Description :</strong> ${echapper(s.description || '—')}</p>
        <p><strong>Défilé :</strong> ${echapper(s.defile || '—')}</p>
        <ul class="liste-controle-prof">${ctx.livrables.style.cahierDesCharges.map((c) => `<li>${s.cahier[c] ? '✓' : '○'} ${echapper(c)}</li>`).join('')}</ul></section>
      <section class="panneau"><div class="panneau-entete"><h2>Pièces 3D</h2></div>
        <div class="grille-pieces">${s.pieces.map((p) => {
          const c = L.controlerDimensions(p.dims, max);
          return `<figure class="carte-piece"><div data-fichier="${echapper(p.chemin)}">Chargement…</div><figcaption><strong>${echapper(p.chemin.split('/').pop())}</strong><span>${p.dims.map(nombreFr).join(' × ')} mm</span>${c.ok === false ? `<span class="pastille-etat ton-ambre">Trop grande : ${c.depasse.map(nombreFr).join(', ')} mm</span>` : c.ok ? '<span class="pastille-etat ton-ok">✓ imprimable</span>' : ''}</figcaption></figure>`;
        }).join('') || '<p class="aide">Aucune pièce.</p>'}</div></section>
    </div>
    <section class="panneau"><div class="panneau-entete"><h2>Photos du mBot habillé</h2></div>
      <div class="galerie-photos">${s.photos.map((p) => `<figure><div class="vignette-attente" data-fichier="${echapper(p)}" data-alt="mBot habillé">Photo</div></figure>`).join('') || '<p class="aide">Aucune photo.</p>'}</div></section>`;
  }

  function videos(x, d) {
    return ctx.livrables.videos.sortes.map((so) => {
      const v = L.videos(d, so.id);
      return `<section class="panneau"><div class="panneau-entete"><h2>${so.titre}</h2><span class="panneau-note">storyboard ${L.dureeStoryboard(d, so.id)} s · ${v.fichier ? '✓ vidéo déposée' : '○ pas de vidéo'}</span></div>
        ${v.storyboard.length ? `<ol class="liste-plans">${v.storyboard.map((c) => `<li>${echapper(c.image || '—')} · <em>${echapper(c.son || '—')}</em>${c.duree ? ` · ${c.duree} s` : ''}</li>`).join('')}</ol>` : '<p class="aide">Pas de storyboard.</p>'}
        ${v.fichier ? `<div class="apercu-video" data-fichier="${echapper(v.fichier)}">Chargement…</div>` : ''}</section>`;
    }).join('');
  }

  function comprendre(x, d) {
    const c = L.comprendre(d);
    return `<div class="deux-colonnes">
      <section class="panneau"><div class="panneau-entete"><h2>QCM</h2></div>
        ${c.qcm.length ? `<ul>${c.qcm.map((q) => `<li>${date(q.date)} · ${echapper(q.qui || '—')} · <strong class="chiffre">${nombreFr(q.note)} / 20</strong> (${q.bonnes}/${q.total})</li>`).join('')}</ul>` : '<p class="aide">Pas encore fait.</p>'}</section>
      <section class="panneau"><div class="panneau-entete"><h2>Les 7 fonctions</h2></div>
        <dl class="fonctions-prof">${A.comprendre.chaines.map((f) => `<dt>${f.fonction}</dt><dd>${echapper(c.chaines[f.id] || '—')}</dd>`).join('')}</dl></section>
    </div>`;
  }

  function brancher(zone, x, d) {
    const e = C.evaluationDe(ev, x.cle);
    const majNote = () => {
      evaluationsModifiees();
      const g = C.noteGroupe(ev, A.notation, x.cle);
      const ng = zone.querySelector('.note-groupe');
      if (ng) ng.innerHTML = `${g.note === null ? '—' : nombreFr(g.note)} <span>/ 20</span>`;
      const compte = zone.querySelector('.compte-criteres');
      if (compte) compte.textContent = `${g.evalues} critère(s) évalué(s) sur ${g.total}`;
      const notes = C.notesEleves(ev, A.notation, x.cle, d.equipe.eleves);
      zone.querySelectorAll('.tableau-ajust tbody tr').forEach((tr, i) => (tr.lastElementChild.textContent = notes[i].note === null ? '—' : nombreFr(notes[i].note)));
    };
    zone.addEventListener('change', (ev2) => {
      const t = ev2.target;
      if (t.dataset.critere && t.type === 'radio') {
        e.niveaux[t.dataset.critere] = Number(t.value);
        majNote();
      } else if (t.classList.contains('ajust-valeur')) {
        (e.ajustements[t.dataset.eleve] = e.ajustements[t.dataset.eleve] || { valeur: 0, motif: '' }).valeur = Number(t.value) || 0;
        majNote();
      }
    });
    zone.addEventListener('input', (ev2) => {
      const t = ev2.target;
      if (t.classList.contains('ajust-motif')) {
        (e.ajustements[t.dataset.eleve] = e.ajustements[t.dataset.eleve] || { valeur: 0, motif: '' }).motif = t.value;
        evaluationsModifiees();
      } else if (t.classList.contains('commentaire')) {
        e.commentaire = t.value;
        evaluationsModifiees();
      }
    });
    zone.addEventListener('click', async (ev2) => {
      const t = ev2.target.closest('button');
      if (!t) return;
      if (t.classList.contains('effacer-niveau')) {
        delete e.niveaux[t.dataset.critere];
        for (const r of zone.querySelectorAll(`input[name="niv-${t.dataset.critere}"]`)) r.checked = false;
        majNote();
      } else if (t.classList.contains('faire-point')) {
        e.points[t.dataset.seance] = A.maintenant();
        evaluationsModifiees();
        await ecrireValidations(x, e);
        dessinerFiche();
      } else if (t.classList.contains('annuler-point')) {
        delete e.points[t.dataset.seance];
        evaluationsModifiees();
        await ecrireValidations(x, e);
        dessinerFiche();
      }
    });
  }

  // Les points de fin validés sont aussi écrits dans le dossier de l'écurie (validations.json) : l'écurie les voit.
  async function ecrireValidations(x, e) {
    if (!x.dossier) return;
    try {
      if ((await x.dossier.queryPermission({ mode: 'readwrite' })) !== 'granted' && (await x.dossier.requestPermission({ mode: 'readwrite' })) !== 'granted') return;
      const h = await x.dossier.getFileHandle('validations.json', { create: true });
      const flux = await h.createWritable();
      await flux.write(JSON.stringify({ format: 'mbot-challenge/validations', version: 1, points: e.points }, null, 1));
      await flux.close();
    } catch {
      message('Le point est noté dans vos évaluations, mais pas dans le dossier de l’écurie (droit d’écriture refusé).', 5000);
    }
  }

  // ---------- Barème ----------

  function ouvrirBareme() {
    const dlg = $('.dialogue-bareme');
    $('.bareme-lignes', dlg).innerHTML = A.notation.criteres.map((c) => `<label class="champ ligne-bareme"><span>${echapper(c.nom)}<span class="aide">${echapper(c.competence)}</span></span><input type="number" min="0" max="5" step="1" data-critere="${c.id}" value="${C.coefficient(ev, A.notation, c)}"></label>`).join('');
    dlg.showModal();
    dlg.addEventListener('close', function fin() {
      dlg.removeEventListener('close', fin);
      if (dlg.returnValue !== 'ok') return;
      for (const i of dlg.querySelectorAll('input[data-critere]')) ev.coefficients[i.dataset.critere] = Math.max(0, Math.min(5, Math.round(Number(i.value) || 0)));
      evaluationsModifiees();
      message('Barème enregistré.');
      dessinerClasse();
    });
  }

  // ---------- Exports ----------

  function telecharger(contenu, type, nom) {
    const url = URL.createObjectURL(new Blob([contenu], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nom;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }
  const nomExport = (suffixe, ext) => `mbot-challenge-${classe.replace(/[^\w-]+/g, '-')}-${suffixe}-${aujourdhui()}.${ext}`;

  function exporterXlsx() {
    const eleves = C.lignesEleves(ecuries, ev, A.notation);
    const ecus = {
      nom: 'Écuries',
      entete: ['Écurie', 'Élèves', 'Note du groupe /20', 'Permis obtenus', 'Défis prêts', 'Essais notés', 'Affiche (versions)', 'Pièces 3D', 'Vidéos', 'Séances finies', 'Rapports remis', 'QCM (meilleur)', 'Fonctions expliquées', 'Commentaire'],
      lignes: ecuries.map((x) => {
        const r = C.resumer(x.donnees, ctx);
        const g = C.noteGroupe(ev, A.notation, x.cle).note;
        return [r.nom, r.eleves.join(', '), g === null ? '' : g, r.permisFinis, r.defisPrets, r.essais, r.affiches, r.pieces, r.videosDeposees, r.seancesFinies, r.rapportsRemis, r.qcm === null ? '' : r.qcm, r.fonctions, C.evaluationDe(ev, x.cle).commentaire];
      }),
    };
    telecharger(A.classeurXlsx([{ nom: 'Élèves', entete: eleves.entete, lignes: eleves.lignes }, ecus]), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', nomExport('notes', 'xlsx'));
  }
  const exporterCsv = () => telecharger('﻿' + C.csv(C.lignesEleves(ecuries, ev, A.notation)), 'text/csv;charset=utf-8', nomExport('notes', 'csv'));
  const exporterPronote = () => telecharger('﻿' + C.csv(C.lignesPronote(ecuries, ev, A.notation)), 'text/csv;charset=utf-8', nomExport('pronote', 'csv'));

  // ---------- Planche des affiches ----------

  function planche() {
    montrer('planche');
    const zone = $('.planche');
    zone.innerHTML = ecuries.map((x) => {
      const a = L.affiche(x.donnees);
      const der = a.versions[a.versions.length - 1];
      return `<figure class="carte-affiche">${der ? `<div class="apercu-affiche" data-fichier="${echapper(der.chemin)}" data-alt="Affiche de ${echapper(A.nomAffiche(x.donnees))}">Chargement…</div>` : '<div class="vignette-attente">Pas d’affiche</div>'}<figcaption>${pastille(x.donnees)} ${echapper(A.nomAffiche(x.donnees))}${der && /\.pdf$/i.test(der.chemin) ? ' · PDF : ' + echapper(der.chemin) : ''}</figcaption></figure>`;
    }).join('');
    for (const fig of zone.querySelectorAll('.carte-affiche')) {
      const x = ecuries[[...zone.children].indexOf(fig)];
      remplirImages(fig, x);
    }
  }

  // ---------- Démarrage ----------

  async function demarrer() {
    const LB = global.LaboBlocs;
    const brut = LB.parcoursDefinis.find((p) => p.id === A.projet.parcours);
    ctx = { paquets: E.paquets(brut), defis: A.defis, calendrier: A.calendrier, comprendre: A.comprendre, livrables: A.reglagesLivrables };
    poserIcones(document);
    montrer('accueil');
    const accesDossiers = typeof global.showDirectoryPicker === 'function';
    $('.prof-alerte-navigateur').hidden = accesDossiers;
    $('.btn-dossier-classe').hidden = !accesDossiers;
    const erreur = (t) => {
      $('.prof-erreur').textContent = t;
      $('.prof-erreur').hidden = !t;
    };

    const memorise = accesDossiers ? await A.dossierEcurie.retrouverCle(CLE_DOSSIER) : null;
    if (memorise) {
      $('.btn-reprendre-suivi').hidden = false;
      $('.reprendre-dossier').textContent = memorise.name;
      $('.btn-reprendre-suivi').addEventListener('click', async () => {
        try {
          if ((await memorise.requestPermission({ mode: 'readwrite' })) !== 'granted') return erreur('Le navigateur n’a pas donné l’accès au dossier.');
          await suivre(memorise);
        } catch {
          erreur('Ce dossier n’est plus accessible : ouvrez-le à nouveau.');
        }
      });
    }
    $('.btn-dossier-classe').addEventListener('click', async () => {
      try {
        const d = await global.showDirectoryPicker({ id: A.projet.id + '-prof', mode: 'readwrite' });
        erreur('');
        await suivre(d);
        if (!ecuries.length) erreur('Aucune sauvegarde d’écurie dans ce dossier : choisissez le dossier MBOT CHALLENGE de la classe.');
      } catch (e) {
        if (e && e.name !== 'AbortError') erreur('Ce dossier ne peut pas être lu.');
      }
    });
    $('.entree-fichiers').addEventListener('change', async (e) => {
      const fichiers = await Promise.all([...e.target.files].map(async (f) => ({ chemin: f.name, texte: await f.text(), dossier: null })));
      arreterSuivi();
      dossierClasse = null;
      charger(fichiers);
      majDirect();
      if (!ecuries.length) {
        montrer('accueil');
        erreur('Aucun de ces fichiers n’est une sauvegarde d’écurie du mBot Challenge.');
      }
    });

    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-ecurie]');
      if (b) return ouvrirFiche(b.dataset.ecurie);
      const o = e.target.closest('[data-onglet]');
      if (o) {
        ficheOnglet = o.dataset.onglet;
        return dessinerFiche();
      }
    });
    $('.btn-retour-classe').addEventListener('click', dessinerClasse);
    $('.btn-retour-planche').addEventListener('click', dessinerClasse);
    $('.btn-imprimer-planche').addEventListener('click', () => print());
    const voisine = (pas) => {
      const i = ecuries.findIndex((x) => x.cle === ficheCle) + pas;
      if (ecuries[i]) ouvrirFiche(ecuries[i].cle);
    };
    $('.btn-precedente').addEventListener('click', () => voisine(-1));
    $('.btn-suivante').addEventListener('click', () => voisine(1));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !$('.vue-ecurie').hidden && !document.querySelector('dialog[open]')) dessinerClasse();
    });
    $('.btn-bareme').addEventListener('click', ouvrirBareme);
    $('.btn-xlsx').addEventListener('click', exporterXlsx);
    $('.btn-csv').addEventListener('click', exporterCsv);
    $('.btn-pronote').addEventListener('click', exporterPronote);
    $('.btn-planche').addEventListener('click', planche);
    $('.btn-autre-classe').addEventListener('click', () => {
      arreterSuivi();
      dossierClasse = null;
      ecuries = [];
      classe = '';
      $('.prof-classe').hidden = true;
      $('.prof-direct').hidden = true;
      montrer('accueil');
    });

    // Évaluations : fichier du professeur
    const dlgEval = $('.dialogue-evaluations');
    $('.btn-evaluations').addEventListener('click', async () => {
      fichierEval = fichierEval || (await A.dossierEcurie.retrouverCle(cleEval(classe) + '-fichier'));
      $('.evaluations-etat', dlgEval).textContent = fichierEval
        ? `Vos évaluations de ${classe} sont gardées dans ce navigateur et réécrites dans le fichier « ${fichierEval.name} » à chaque changement.`
        : `Vos évaluations de ${classe} sont gardées dans ce navigateur. Enregistrez-les dans un fichier de votre dossier personnel pour les retrouver sur un autre poste.`;
      dlgEval.showModal();
    });
    $('.btn-enregistrer-evaluations').addEventListener('click', async () => {
      try {
        fichierEval = await global.showSaveFilePicker({ id: A.projet.id + '-evaluations', suggestedName: `mbot-challenge-evaluations-${classe.replace(/[^\w-]+/g, '-')}.json`, types: [{ description: 'Évaluations', accept: { 'application/json': ['.json'] } }] });
        await A.dossierEcurie.memoriserCle(cleEval(classe) + '-fichier', fichierEval);
        if (await ecrireFichierEvaluations(true)) message('Évaluations enregistrées : elles seront réécrites à chaque changement.');
        dlgEval.close();
      } catch (e) {
        if (e && e.name !== 'AbortError') message('Le fichier n’a pas pu être écrit.');
      }
    });
    $('.btn-ouvrir-evaluations').addEventListener('click', async () => {
      try {
        const [h] = await global.showOpenFilePicker({ id: A.projet.id + '-evaluations', types: [{ description: 'Évaluations', accept: { 'application/json': ['.json'] } }] });
        const r = C.lireEvaluations(await (await h.getFile()).text());
        if (!r.ok) return message(r.raison, 5000);
        ev = r.evaluations;
        fichierEval = h;
        await A.dossierEcurie.memoriserCle(cleEval(classe) + '-fichier', h);
        evaluationsModifiees();
        dlgEval.close();
        message('Évaluations ouvertes.');
        dessinerClasse();
      } catch (e) {
        if (e && e.name !== 'AbortError') message('Ce fichier ne peut pas être lu.');
      }
    });
  }

  A.demarrerProfesseur = demarrer;
  A.prof = { charger, ouvrirFiche, dessinerClasse, planche, etat: () => ({ ecuries, ev, classe }) };
})(this);
