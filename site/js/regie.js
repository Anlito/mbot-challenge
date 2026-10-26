// Régie du tournoi : préparation (écuries, ordre de passage, jours, matchs de la Récolte), épreuves chronométrées
// (un ou deux postes), Récolte, votes de l'affiche, classement du jury, classement général et de toutes les classes.
// Commande l'écran projeté (ecran.html, dans une 2ᵉ fenêtre) par BroadcastChannel. Le tournoi est gardé dans le
// navigateur à chaque saisie, et dans un fichier du professeur s'il en a choisi un : il se reprend le 2ᵉ jour.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const T = A.tournoi;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const nombreFr = (x) => String(x).replace('.', ',');
  const CANAL = 'mbot-challenge-ecran';
  const PREFIXE = 'mbot-challenge-tournoi-';

  let config = null;
  let t = null; // tournoi
  let vue = 'preparation';
  let jour = 1; // jour du tournoi en cours (1 ou 2)
  let deuxPostes = false;
  let ecranMode = 'accueil';
  let fichierTournoi = null;
  let brouillonStyle = null;
  let matchCourant = null; // { id, debut, ecoule, enCours }
  let autres = []; // tournois d'autres classes (classement toutes classes)
  const postes = [nouveauPoste('A'), nouveauPoste('B')];
  const canal = 'BroadcastChannel' in global ? new BroadcastChannel(CANAL) : null;

  function nouveauPoste(id) {
    return { id, epreuve: null, cle: null, debut: null, fin: null, malus: 0, objets: 0, actions: [] };
  }

  // ---------- Outils ----------

  function message(texte, duree) {
    const m = $('.message-bref');
    m.textContent = texte;
    m.hidden = false;
    clearTimeout(message.minuteur);
    message.minuteur = setTimeout(() => (m.hidden = true), duree || 2800);
  }
  const epreuve = (id) => config.epreuves.find((e) => e.id === id);
  const ecurie = (cle) => t.ecuries.find((e) => e.cle === cle) || { cle, nom: cle };
  const pastille = (x) => {
    const th = A.ecurie.theme(x.couleur);
    return `<span class="ecurie-pastille" style="--ecurie:${th.ecurieFond};--ecurie-texte:${th.ecurieTexte}" aria-hidden="true">${echapper((String(x.nom).replace(/^(les?|la)\s+/i, '')[0] || '?').toUpperCase())}</span>`;
  };
  const chrono = (ms) => {
    const s = Math.max(0, ms) / 1000;
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
  };
  function poserIcones(racine) {
    for (const el of racine.querySelectorAll('[data-icone]')) if (!el.querySelector('svg')) el.insertAdjacentHTML('afterbegin', A.icone(el.dataset.icone, { epaisseur: 2.2 }));
  }

  // ---------- Sauvegarde ----------

  function sauver() {
    if (!t) return;
    try { localStorage.setItem(PREFIXE + t.classe, JSON.stringify(t)); } catch { /* stockage plein */ }
    $('.regie-etat').textContent = 'Enregistré à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    ecrireFichier();
    envoyer();
  }
  async function ecrireFichier(demander) {
    if (!fichierTournoi) return false;
    try {
      const mode = { mode: 'readwrite' };
      if ((await fichierTournoi.queryPermission(mode)) !== 'granted' && !(demander && (await fichierTournoi.requestPermission(mode)) === 'granted')) return false;
      const flux = await fichierTournoi.createWritable();
      await flux.write(JSON.stringify(t, null, 1));
      await flux.close();
      return true;
    } catch {
      return false;
    }
  }
  function tournoisGardes() {
    const l = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.startsWith(PREFIXE)) {
          const r = T.lireTournoi(localStorage.getItem(k));
          if (r.ok) l.push(r.tournoi);
        }
      }
    } catch { /* rien */ }
    return l;
  }

  // ---------- Écuries de la classe ----------

  async function lireDossier(dossier, profondeur, trouves) {
    for await (const h of dossier.values()) {
      if (h.kind === 'file' && /\.json$/i.test(h.name)) trouves.push(await (await h.getFile()).text());
      else if (h.kind === 'directory' && profondeur > 0 && !/^(rapports|affiche|style|videos)$/i.test(h.name)) await lireDossier(h, profondeur - 1, trouves);
    }
  }
  function ecuriesDe(textes) {
    const parCle = new Map();
    for (const texte of textes) {
      const r = A.lireSauvegarde(texte);
      if (!r.ok) continue;
      const d = r.donnees;
      const cle = d.equipe.classe + '/' + A.nomEquipe(d.equipe.eleves);
      const avant = parCle.get(cle);
      if (!avant || String(d.modifieLe) > String(avant.modifieLe)) parCle.set(cle, d);
    }
    return [...parCle.entries()].map(([cle, d]) => ({ cle, nom: A.nomAffiche(d), couleur: d.ecurie.couleur, eleves: d.equipe.eleves, classe: d.equipe.classe }));
  }
  function nouveauTournoi(ecuries) {
    if (!ecuries.length) return message('Aucune écurie trouvée : choisissez le dossier MBOT CHALLENGE de la classe.', 5000);
    const classe = [...new Set(ecuries.map((e) => e.classe).filter(Boolean))].join(' · ') || 'Classe';
    const garde = tournoisGardes().find((x) => x.classe === classe);
    if (garde && confirm(`Un tournoi de ${classe} est déjà en cours dans ce navigateur (commencé le ${new Date(garde.creeLe).toLocaleDateString('fr-FR')}). Le reprendre ?\n\nAnnuler : commencer un nouveau tournoi (l’ancien sera remplacé).`)) {
      t = garde;
    } else {
      t = T.creerTournoi(ecuries, classe, config);
      // Classe à 1 h 30 : tout le tournoi en une séance.
      const circuit = A.calendrierClasse.circuit(A.calendrier, classe.split(' · ')[0]);
      if (circuit.tournoi.length < 2) for (const e of config.epreuves) t.jours[e.id] = 1;
    }
    commencer();
  }
  function commencer() {
    $('.regie-classe').textContent = '· tournoi ' + t.classe;
    $('.regie-ecran-commande').hidden = false;
    const deuxJours = Object.values(t.jours).some((j) => j === 2);
    $('.case-suspense').checked = deuxJours && jour === 1;
    sauver();
    naviguer('preparation');
  }

  // ---------- Navigation ----------

  function onglets() {
    const nav = $('.regie-onglets');
    if (!t) return (nav.innerHTML = '');
    const deuxJours = Object.values(t.jours).some((j) => j === 2);
    nav.innerHTML = [['preparation', 'Préparation']].concat(config.epreuves.map((e) => [e.id, (deuxJours ? `J${t.jours[e.id]} · ` : '') + e.titre.replace(/^Défi \d · /, '')]), [['classement', 'Classement']])
      .map(([id, titre]) => `<button type="button" data-vue="${id}" aria-current="${id === vue ? 'page' : 'false'}">${echapper(titre)}</button>`).join('');
  }
  function naviguer(v) {
    vue = v;
    onglets();
    const zone = $('.regie-contenu');
    if (!t) return accueil(zone);
    if (v === 'preparation') return preparation(zone);
    if (v === 'classement') return classement(zone);
    const e = epreuve(v);
    if (e.sorte === 'chrono' || e.sorte === 'obstacles') return epreuveChrono(zone, e);
    if (e.sorte === 'duel') return recolte(zone, e);
    if (e.sorte === 'votes') return votes(zone, e);
    if (e.sorte === 'jury') return jury(zone, e);
  }

  // ---------- Accueil (pas encore de tournoi) ----------

  function accueil(zone) {
    const gardes = tournoisGardes();
    zone.innerHTML = `
      <section class="regie-panneau">
        <h1>Préparer le tournoi</h1>
        <p>Choisissez le dossier <strong>MBOT CHALLENGE</strong> de la classe : la régie y lit les écuries (nom, couleur, équipiers).</p>
        <div class="prof-cartes">
          <button type="button" class="prof-carte carte-sombre btn-dossier"><span data-icone="dossier"></span><strong>Ouvrir le dossier de la classe</strong><span>Les écuries de la classe.</span></button>
          <label class="prof-carte carte-sombre"><span data-icone="importer"></span><strong>Importer des fichiers .json</strong><span>Les sauvegardes des écuries.</span><input type="file" class="entree-ecuries" accept=".json" multiple hidden></label>
          <button type="button" class="prof-carte carte-sombre btn-ouvrir-tournoi"><span data-icone="disquette"></span><strong>Ouvrir un fichier de tournoi</strong><span>Reprendre le 2ᵉ jour sur un autre poste.</span></button>
        </div>
        ${gardes.length ? `<h2>Reprendre un tournoi de ce navigateur</h2><div class="liste-reprendre">${gardes.map((g) => `<button type="button" class="btn-principal" data-reprendre="${echapper(g.classe)}">Tournoi ${echapper(g.classe)} · ${g.ecuries.length} écuries</button>`).join('')}</div>` : ''}
      </section>`;
    poserIcones(zone);
    $('.btn-dossier', zone).addEventListener('click', async () => {
      try {
        const memo = await A.dossierEcurie.retrouverCle('prof-dossier-classe');
        const d = await global.showDirectoryPicker({ id: A.projet.id + '-prof', mode: 'read', startIn: memo || undefined });
        const textes = [];
        await lireDossier(d, 2, textes);
        nouveauTournoi(ecuriesDe(textes));
      } catch (e) {
        if (e && e.name !== 'AbortError') message('Ce dossier ne peut pas être lu.');
      }
    });
    $('.entree-ecuries', zone).addEventListener('change', async (e) => nouveauTournoi(ecuriesDe(await Promise.all([...e.target.files].map((f) => f.text())))));
    $('.btn-ouvrir-tournoi', zone).addEventListener('click', ouvrirFichierTournoi);
    for (const b of zone.querySelectorAll('[data-reprendre]')) b.addEventListener('click', () => {
      t = tournoisGardes().find((x) => x.classe === b.dataset.reprendre);
      commencer();
    });
  }
  async function ouvrirFichierTournoi() {
    try {
      const [h] = await global.showOpenFilePicker({ id: A.projet.id + '-tournoi', types: [{ description: 'Tournoi', accept: { 'application/json': ['.json'] } }] });
      const r = T.lireTournoi(await (await h.getFile()).text());
      if (!r.ok) return message(r.raison, 5000);
      t = r.tournoi;
      fichierTournoi = h;
      commencer();
    } catch (e) {
      if (e && e.name !== 'AbortError') message('Ce fichier ne peut pas être lu.');
    }
  }

  // ---------- Préparation ----------

  function preparation(zone) {
    const deuxJours = Object.values(t.jours).some((j) => j === 2);
    zone.innerHTML = `
      <div class="regie-deux">
        <section class="regie-panneau">
          <div class="regie-entete"><h2>Ordre de passage</h2><button type="button" class="btn-secondaire btn-tirer-ordre" data-icone="recommencer">Tirer au sort</button></div>
          <ol class="liste-ordre">${t.ordre.map((c, i) => `<li>${pastille(ecurie(c))}<span class="nom">${echapper(ecurie(c).nom)}</span>
            <button type="button" class="btn-petit" data-monter="${i}" aria-label="Monter ${echapper(ecurie(c).nom)}"${i ? '' : ' disabled'}>↑</button>
            <button type="button" class="btn-petit" data-descendre="${i}" aria-label="Descendre ${echapper(ecurie(c).nom)}"${i < t.ordre.length - 1 ? '' : ' disabled'}>↓</button></li>`).join('')}</ol>
        </section>
        <section class="regie-panneau">
          <h2>Jour de chaque épreuve</h2>
          <p class="aide">Classes à 1 h : tournoi sur deux séances. Le classement général n’apparaît à l’écran qu’à la fin si le suspense est coché.</p>
          <div class="liste-jours">${config.epreuves.map((e) => `<label><span>${echapper(e.titre)}</span><select data-jour="${e.id}"><option value="1"${t.jours[e.id] === 1 ? ' selected' : ''}>Jour 1</option><option value="2"${t.jours[e.id] === 2 ? ' selected' : ''}>Jour 2</option></select></label>`).join('')}</div>
          ${deuxJours ? `<p class="choix-jour">Aujourd’hui : <button type="button" class="${jour === 1 ? 'actif' : ''}" data-aujourdhui="1">Jour 1</button><button type="button" class="${jour === 2 ? 'actif' : ''}" data-aujourdhui="2">Jour 2</button></p>` : ''}
          <h2>Récolte · les matchs</h2>
          ${t.resultats.recolte.matchs.length ? `<ol class="liste-matchs">${t.resultats.recolte.matchs.map((m) => `<li>${echapper(ecurie(m.a).nom)} <span class="contre">contre</span> ${echapper(ecurie(m.b).nom)}${m.fini ? ` · ✓ ${m.scoreA}–${m.scoreB}` : ''}</li>`).join('')}</ol>` : '<p class="aide">Pas encore tirés : chaque écurie jouera 2 matchs contre 2 adversaires différents.</p>'}
          <div class="accueil-actions"><button type="button" class="btn-secondaire btn-tirer-matchs" data-icone="recommencer">${t.resultats.recolte.matchs.length ? 'Tirer à nouveau' : 'Tirer les matchs'}</button></div>
          <h2>Sauvegarde</h2>
          <p class="aide">${fichierTournoi ? `Le tournoi est réécrit à chaque saisie dans « ${echapper(fichierTournoi.name)} ».` : 'Le tournoi est gardé dans ce navigateur. Pour le reprendre sur un autre poste, enregistrez-le dans un fichier.'}</p>
          <div class="accueil-actions">
            <button type="button" class="btn-principal btn-fichier" data-icone="disquette">Enregistrer dans un fichier</button>
            <button type="button" class="btn-lien btn-fermer-tournoi">Changer de classe</button>
          </div>
        </section>
      </div>`;
    poserIcones(zone);
    zone.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.monter !== undefined || b.dataset.descendre !== undefined) {
        const i = Number(b.dataset.monter !== undefined ? b.dataset.monter : b.dataset.descendre);
        const j = b.dataset.monter !== undefined ? i - 1 : i + 1;
        [t.ordre[i], t.ordre[j]] = [t.ordre[j], t.ordre[i]];
        sauver();
        return naviguer('preparation');
      }
      if (b.classList.contains('btn-tirer-ordre')) {
        T.tirerOrdre(t);
        sauver();
        return naviguer('preparation');
      }
      if (b.classList.contains('btn-tirer-matchs')) {
        if (t.resultats.recolte.matchs.some((m) => m.fini) && !confirm('Des matchs sont déjà joués. Les effacer et tirer à nouveau ?')) return;
        T.tirerRecolte(t);
        sauver();
        return naviguer('preparation');
      }
      if (b.dataset.aujourdhui) {
        jour = Number(b.dataset.aujourdhui);
        $('.case-suspense').checked = jour === 1;
        envoyer();
        return naviguer('preparation');
      }
      if (b.classList.contains('btn-fichier')) {
        try {
          fichierTournoi = await global.showSaveFilePicker({ id: A.projet.id + '-tournoi', suggestedName: `mbot-challenge-tournoi-${t.classe.replace(/[^\w-]+/g, '-')}.json`, types: [{ description: 'Tournoi', accept: { 'application/json': ['.json'] } }] });
          if (await ecrireFichier(true)) message('Tournoi enregistré : il sera réécrit à chaque saisie.');
          naviguer('preparation');
        } catch (err) {
          if (err && err.name !== 'AbortError') message('Le fichier n’a pas pu être écrit.');
        }
      }
      if (b.classList.contains('btn-fermer-tournoi')) {
        t = null;
        fichierTournoi = null;
        $('.regie-ecran-commande').hidden = true;
        $('.regie-classe').textContent = '· tournoi';
        naviguer('preparation');
      }
    });
    zone.addEventListener('change', (e) => {
      if (!e.target.dataset.jour) return;
      t.jours[e.target.dataset.jour] = Number(e.target.value);
      sauver();
      naviguer('preparation');
    });
  }

  // ---------- Épreuves chronométrées ----------

  function resultatsHtml(e) {
    const c = T.classementEpreuve(t, config, e.id);
    return `<ol class="liste-passages">${t.ordre.map((cle) => {
      const l = c.find((x) => x.cle === cle);
      const enPiste = postes.find((p) => p.cle === cle && p.epreuve === e.id);
      return `<li class="${enPiste ? 'en-piste' : ''}">${pastille(ecurie(cle))}<span class="nom">${echapper(ecurie(cle).nom)}${l.detail ? `<span class="detail">${echapper(l.detail)}</span>` : ''}</span>
        <span class="valeur">${l.place ? `<strong>${l.place === 1 ? '1re' : l.place + 'e'}</strong> · ` : ''}${echapper(l.valeur)}${l.points !== null ? ` · <strong>${l.points} pts</strong>` : ''}</span>
        <span class="actions">${postes.slice(0, deuxPostes ? 2 : 1).map((p) => `<button type="button" class="btn-petit" data-en-piste="${echapper(cle)}" data-poste="${p.id}">${enPiste && enPiste.id === p.id ? '● ' : ''}${deuxPostes ? 'Poste ' + p.id : 'En piste'}</button>`).join('')}</span></li>`;
    }).join('')}</ol>`;
  }

  function posteHtml(p, e) {
    const x = p.cle ? ecurie(p.cle) : null;
    const lance = !!p.debut;
    const fini = !!p.fin;
    const obstacles = e.sorte === 'obstacles';
    return `
      <section class="poste" data-poste="${p.id}">
        <div class="poste-entete">
          <span class="poste-nom">${deuxPostes ? 'Poste ' + p.id : 'En piste'}</span>
          ${x ? `${pastille(x)}<strong class="poste-ecurie">${echapper(x.nom)}</strong>` : '<span class="aide">Choisissez l’écurie en piste dans la liste.</span>'}
        </div>
        <div class="poste-chrono chiffre" data-chrono="${p.id}">${obstacles ? chrono(e.tempsMax * 1000) : '00:00.0'}</div>
        <div class="poste-infos">
          <span>${echapper(e.malus.libelle)} : <strong class="chiffre">${p.malus}</strong> (+${p.malus * e.malus.secondes} s)</span>
          ${obstacles ? `<span>Objets sortis : <strong class="chiffre">${p.objets} / ${e.objets}</strong></span>` : ''}
        </div>
        <div class="poste-boutons">
          <button type="button" class="btn-geant ${fini ? 'btn-attente' : lance ? 'btn-arrivee' : 'btn-depart'}" data-action="principal"${!x || fini ? ' disabled' : ''}>${fini ? 'Arrivé' : lance ? (obstacles ? 'Arrêt' : 'Arrivée') : 'Départ'}${p.id === 'A' ? '<span class="touche">Espace</span>' : ''}</button>
          <button type="button" class="btn-malus" data-action="malus"${!lance || fini ? ' disabled' : ''}>+1 ${echapper(e.malus.libelle.toLowerCase())}${p.id === 'A' ? '<span class="touche">M</span>' : ''}</button>
          ${obstacles ? `<button type="button" class="btn-malus btn-objet" data-action="objet"${!lance || p.objets >= e.objets ? ' disabled' : ''}>+1 objet sorti${p.id === 'A' ? '<span class="touche">O</span>' : ''}</button>` : ''}
        </div>
        <div class="poste-secondaires">
          <button type="button" class="btn-lien" data-action="annuler"${p.actions.length ? '' : ' disabled'}>Annuler le dernier appui</button>
          <button type="button" class="btn-lien" data-action="abandon"${lance && !fini ? '' : ' disabled'}>Abandon</button>
          <button type="button" class="btn-principal" data-action="valider"${fini ? '' : ' disabled'}>Valider le passage</button>
        </div>
      </section>`;
  }

  function epreuveChrono(zone, e) {
    for (const p of postes) if (p.epreuve !== e.id && !p.debut) Object.assign(p, nouveauPoste(p.id), { epreuve: e.id });
    zone.innerHTML = `
      <div class="regie-entete"><h1>${echapper(e.titre)}</h1><span class="aide">${echapper(e.aide)} Malus : +${e.malus.secondes} s.</span>
        <label class="deux-postes"><input type="checkbox" class="case-deux-postes"${deuxPostes ? ' checked' : ''}> Deux postes en même temps</label></div>
      <div class="regie-deux">
        <section class="regie-panneau zone-liste">${resultatsHtml(e)}</section>
        <div class="zone-postes">${postes.slice(0, deuxPostes ? 2 : 1).map((p) => posteHtml(p, e)).join('')}</div>
      </div>`;
    $('.case-deux-postes', zone).addEventListener('change', (ev) => {
      deuxPostes = ev.target.checked;
      naviguer(e.id);
    });
    zone.onclick = (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.enPiste) {
        const p = postes.find((x) => x.id === b.dataset.poste);
        if (p.debut && !p.fin) return message('Ce poste a un passage en cours : validez-le ou annulez-le d’abord.');
        Object.assign(p, nouveauPoste(p.id), { epreuve: e.id, cle: b.dataset.enPiste });
        ecranMode = ecranMode === 'accueil' ? 'passage' : ecranMode;
        envoyer();
        return naviguer(e.id);
      }
      const poste = b.closest('.poste');
      if (poste && b.dataset.action) agir(postes.find((x) => x.id === poste.dataset.poste), e, b.dataset.action);
    };
  }

  function agir(p, e, action) {
    const maintenant = Date.now();
    if (action === 'principal') {
      if (!p.cle || p.fin) return;
      if (!p.debut) {
        p.debut = maintenant;
        p.actions.push('depart');
      } else {
        p.fin = maintenant;
        p.actions.push('arrivee');
      }
    } else if (action === 'malus' && p.debut && !p.fin) {
      p.malus++;
      p.actions.push('malus');
    } else if (action === 'objet' && p.debut && p.objets < e.objets) {
      p.objets++;
      p.actions.push('objet');
      // Les 3 objets sont dehors : le chrono s'arrête tout seul.
      if (p.objets === e.objets && !p.fin) {
        p.fin = maintenant;
        p.actions.push('arrivee');
      }
    } else if (action === 'annuler') {
      const a = p.actions.pop();
      if (a === 'depart') p.debut = null;
      else if (a === 'arrivee') p.fin = null;
      else if (a === 'malus') p.malus--;
      else if (a === 'objet') p.objets--;
      else if (a === 'abandon') { p.fin = null; p.abandon = false; }
    } else if (action === 'abandon' && p.debut && !p.fin) {
      p.fin = maintenant;
      p.abandon = true;
      p.actions.push('abandon');
    } else if (action === 'valider' && p.fin) {
      const temps = Math.min((p.fin - p.debut) / 1000, e.tempsMax || Infinity);
      T.noterPassage(t, config, e.id, p.cle, { temps, malus: p.malus, objets: p.objets, abandon: !!p.abandon });
      const r = T.classementEpreuve(t, config, e.id).find((l) => l.cle === p.cle);
      message(`${ecurie(p.cle).nom} : ${r.valeur}${r.points !== null ? ' · ' + r.points + ' pts pour l’instant' : ''}`, 4000);
      // L'écurie suivante (pas encore passée, pas sur l'autre poste) monte en piste.
      const passes = new Set(Object.keys(t.resultats[e.id] || {}));
      const autre = postes.find((x) => x !== p && x.epreuve === e.id && x.cle);
      const suivante = t.ordre.find((c) => !passes.has(c) && (!autre || autre.cle !== c));
      Object.assign(p, nouveauPoste(p.id), { epreuve: e.id, cle: suivante || null });
      sauver();
    }
    envoyer();
    naviguer(e.id);
  }

  // Affichage des chronos (et arrêt automatique au temps maximal des obstacles).
  function boucle() {
    if (t && vue && epreuve(vue)) {
      const e = epreuve(vue);
      for (const p of postes) {
        const el = document.querySelector(`[data-chrono="${p.id}"]`);
        if (!el || p.epreuve !== e.id) continue;
        const ecoule = p.debut ? (p.fin || Date.now()) - p.debut : 0;
        if (e.sorte === 'obstacles') {
          if (p.debut && !p.fin && ecoule >= e.tempsMax * 1000) {
            p.fin = p.debut + e.tempsMax * 1000;
            p.actions.push('arrivee');
            envoyer();
            naviguer(e.id);
            message('Temps écoulé : 2 minutes.');
          }
          el.textContent = chrono(e.tempsMax * 1000 - ecoule);
          el.classList.toggle('presque', p.debut && !p.fin && e.tempsMax * 1000 - ecoule < 15000);
        } else el.textContent = chrono(ecoule);
      }
      const m = document.querySelector('[data-chrono-match]');
      if (m && matchCourant) m.textContent = chrono(Math.max(0, epreuve('recolte').dureeMatch * 1000 - ecouleMatch()));
    }
    requestAnimationFrame(boucle);
  }

  // ---------- Récolte ----------

  const ecouleMatch = () => (matchCourant ? matchCourant.ecoule + (matchCourant.enCours ? Date.now() - matchCourant.debut : 0) : 0);

  function recolte(zone, e) {
    const matchs = t.resultats.recolte.matchs;
    if (!matchs.length) {
      zone.innerHTML = `<section class="regie-panneau"><h1>${echapper(e.titre)}</h1><p>${echapper(e.aide)}</p><button type="button" class="btn-principal btn-tirer">Tirer les matchs</button></section>`;
      $('.btn-tirer', zone).addEventListener('click', () => {
        T.tirerRecolte(t);
        sauver();
        naviguer(e.id);
      });
      return;
    }
    const m = matchCourant && matchs.find((x) => x.id === matchCourant.id);
    zone.innerHTML = `
      <div class="regie-entete"><h1>${echapper(e.titre)}</h1><span class="aide">${echapper(e.aide)}</span></div>
      <div class="regie-deux">
        <section class="regie-panneau zone-liste">
          <ol class="liste-passages">${matchs.map((x, i) => `<li class="${m && m.id === x.id ? 'en-piste' : ''}"><span class="nom">Match ${i + 1} · ${echapper(ecurie(x.a).nom)} <span class="contre">contre</span> ${echapper(ecurie(x.b).nom)}</span>
            <span class="valeur">${x.fini ? `✓ ${x.scoreA} – ${x.scoreB}` : '○ à jouer'}</span>
            <span class="actions"><button type="button" class="btn-petit" data-match="${x.id}">${x.fini ? 'Corriger' : 'Jouer'}</button></span></li>`).join('')}</ol>
          <h2>Classement provisoire</h2>
          ${classementCourt(e.id)}
        </section>
        <div class="zone-postes">${m ? `
          <section class="poste">
            <div class="poste-chrono chiffre" data-chrono-match>${chrono(e.dureeMatch * 1000 - ecouleMatch())}</div>
            <div class="duel">${[['a', 'scoreA'], ['b', 'scoreB']].map(([c, s]) => `
              <div class="duel-camp">${pastille(ecurie(m[c]))}<strong>${echapper(ecurie(m[c]).nom)}</strong>
                <div class="duel-score chiffre">${m[s]}</div>
                <div class="duel-boutons"><button type="button" class="btn-petit" data-score="${s}" data-pas="-1" aria-label="Une balle de moins pour ${echapper(ecurie(m[c]).nom)}">−</button><button type="button" class="btn-geant btn-depart" data-score="${s}" data-pas="1">+1 balle</button></div>
              </div>`).join('<div class="duel-contre">contre</div>')}</div>
            <div class="poste-secondaires">
              <button type="button" class="btn-geant ${matchCourant.enCours ? 'btn-arrivee' : 'btn-depart'}" data-match-chrono>${matchCourant.enCours ? 'Pause' : ecouleMatch() ? 'Reprendre' : 'Coup d’envoi'}</button>
              <button type="button" class="btn-principal" data-fin-match>Fin du match</button>
            </div>
          </section>` : '<p class="aide">Choisissez un match dans la liste.</p>'}</div>
      </div>`;
    zone.onclick = (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.match) {
        matchCourant = { id: b.dataset.match, debut: 0, ecoule: 0, enCours: false };
        ecranMode = 'passage';
      } else if (b.dataset.score && m) {
        m[b.dataset.score] = Math.max(0, m[b.dataset.score] + Number(b.dataset.pas));
        sauver();
      } else if (b.hasAttribute('data-match-chrono')) {
        if (matchCourant.enCours) {
          matchCourant.ecoule += Date.now() - matchCourant.debut;
          matchCourant.enCours = false;
        } else {
          matchCourant.debut = Date.now();
          matchCourant.enCours = true;
        }
      } else if (b.hasAttribute('data-fin-match') && m) {
        m.fini = true;
        matchCourant = null;
        sauver();
        message(`Match noté : ${ecurie(m.a).nom} ${m.scoreA} – ${m.scoreB} ${ecurie(m.b).nom}`, 4000);
      }
      envoyer();
      naviguer(e.id);
    };
  }

  function classementCourt(id) {
    return `<ol class="classement-court">${T.classementEpreuve(t, config, id).filter((l) => l.place).map((l) => `<li><strong>${l.place}</strong> ${echapper(l.nom)} · ${echapper(l.valeur)}${l.detail ? ' · ' + echapper(l.detail) : ''} · <strong>${l.points} pts</strong></li>`).join('') || '<li class="aide">Pas encore de résultat.</li>'}</ol>`;
  }

  // ---------- Votes de l'affiche ----------

  function votes(zone, e) {
    zone.innerHTML = `
      <div class="regie-entete"><h1>${echapper(e.titre)}</h1><span class="aide">${echapper(e.aide)}</span></div>
      <div class="regie-deux">
        <section class="regie-panneau"><form class="liste-votes">${t.ordre.map((c) => `<label>${pastille(ecurie(c))}<span class="nom">${echapper(ecurie(c).nom)}</span><input type="number" min="0" step="1" inputmode="numeric" data-votes="${echapper(c)}" value="${t.resultats.affiche[c] === undefined ? '' : t.resultats.affiche[c]}" aria-label="Votes pour ${echapper(ecurie(c).nom)}"></label>`).join('')}</form></section>
        <section class="regie-panneau"><h2>Classement des affiches</h2><div class="zone-court">${classementCourt(e.id)}</div></section>
      </div>`;
    zone.querySelector('.liste-votes').addEventListener('input', (ev) => {
      const c = ev.target.dataset.votes;
      const v = ev.target.value === '' ? undefined : Math.max(0, Math.round(Number(ev.target.value) || 0));
      if (v === undefined) delete t.resultats.affiche[c];
      else t.resultats.affiche[c] = v;
      sauver();
      zone.querySelector('.zone-court').innerHTML = classementCourt(e.id);
    });
  }

  // ---------- Jury du style ----------

  function jury(zone, e) {
    brouillonStyle = brouillonStyle || (t.resultats.style.classement.length ? t.resultats.style.classement.slice() : t.ordre.slice());
    const valide = t.resultats.style.classement.length > 0;
    zone.innerHTML = `
      <div class="regie-entete"><h1>${echapper(e.titre)}</h1><span class="aide">${echapper(e.aide)} Glissez les écuries ou utilisez ↑ ↓ : en haut, la plus stylée.</span></div>
      <div class="regie-deux">
        <section class="regie-panneau">
          <ol class="liste-ordre liste-jury">${brouillonStyle.map((c, i) => `<li draggable="true" data-cle="${echapper(c)}"><strong class="rang">${i + 1}</strong>${pastille(ecurie(c))}<span class="nom">${echapper(ecurie(c).nom)}</span>
            <button type="button" class="btn-petit" data-monter="${i}" aria-label="Monter ${echapper(ecurie(c).nom)}"${i ? '' : ' disabled'}>↑</button>
            <button type="button" class="btn-petit" data-descendre="${i}" aria-label="Descendre ${echapper(ecurie(c).nom)}"${i < brouillonStyle.length - 1 ? '' : ' disabled'}>↓</button></li>`).join('')}</ol>
          <div class="accueil-actions"><button type="button" class="btn-principal btn-valider-jury">${valide ? 'Mettre à jour le classement du jury' : 'Valider le classement du jury'}</button></div>
        </section>
        <section class="regie-panneau"><h2>Points</h2>${valide ? classementCourt(e.id) : '<p class="aide">Pas encore validé : les points arrivent avec la validation.</p>'}</section>
      </div>`;
    const liste = $('.liste-jury', zone);
    let tire = null;
    liste.addEventListener('dragstart', (ev) => (tire = ev.target.closest('li')));
    liste.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      const sur = ev.target.closest('li');
      if (!sur || sur === tire) return;
      const r = sur.getBoundingClientRect();
      liste.insertBefore(tire, ev.clientY > r.top + r.height / 2 ? sur.nextSibling : sur);
    });
    liste.addEventListener('drop', (ev) => {
      ev.preventDefault();
      brouillonStyle = [...liste.children].map((li) => li.dataset.cle);
      naviguer(e.id);
    });
    zone.onclick = (ev) => {
      const b = ev.target.closest('button');
      if (!b) return;
      if (b.dataset.monter !== undefined || b.dataset.descendre !== undefined) {
        const i = Number(b.dataset.monter !== undefined ? b.dataset.monter : b.dataset.descendre);
        const j = b.dataset.monter !== undefined ? i - 1 : i + 1;
        [brouillonStyle[i], brouillonStyle[j]] = [brouillonStyle[j], brouillonStyle[i]];
        return naviguer(e.id);
      }
      if (b.classList.contains('btn-valider-jury')) {
        t.resultats.style.classement = brouillonStyle.slice();
        sauver();
        message('Classement du jury enregistré.');
        naviguer(e.id);
      }
    };
  }

  // ---------- Classement ----------

  function classement(zone) {
    const deuxJours = Object.values(t.jours).some((j) => j === 2);
    const g = T.classementGeneral(t, config);
    const tc = autres.length ? T.classementToutesClasses([t].concat(autres), config) : null;
    zone.innerHTML = `
      <div class="regie-entete"><h1>Classement général · ${echapper(t.classe)}</h1>${deuxJours ? `<span class="aide">Tournoi sur deux jours. ${$('.case-suspense').checked ? 'Suspense : l’écran projeté ne montre pas encore ce classement.' : ''}</span>` : ''}</div>
      <section class="regie-panneau tableau-defilant">
        <table class="tableau-general">
          <thead><tr><th scope="col">Place</th><th scope="col">Écurie</th>${config.epreuves.map((e) => `<th scope="col">${echapper(e.titre.replace(/^Défi \d · /, ''))}</th>`).join('')}<th scope="col">Total</th></tr></thead>
          <tbody>${g.map((l) => `<tr><td class="chiffre">${l.place}</td><th scope="row">${pastille(l)} ${echapper(l.nom)}</th>${config.epreuves.map((e) => `<td class="chiffre">${l.points[e.id] === null ? '—' : l.points[e.id]}</td>`).join('')}<td class="chiffre total">${l.total}</td></tr>`).join('')}</tbody>
        </table>
      </section>
      <div class="accueil-actions">
        <button type="button" class="btn-secondaire btn-csv" data-icone="telecharger">Exporter (CSV)</button>
        <label class="btn-secondaire"><span data-icone="importer"></span>Ajouter les tournois des autres classes<input type="file" class="entree-autres" accept=".json" multiple hidden></label>
        ${autres.length ? `<button type="button" class="btn-lien btn-oublier-autres">Retirer les autres classes</button>` : ''}
      </div>
      ${tc ? `<section class="regie-panneau tableau-defilant"><h2>Toutes les classes · ${tc.length} écuries</h2>
        <p class="aide">Toutes les écuries reclassées ensemble, épreuve par épreuve, sur leurs résultats (temps, objets, victoires, votes ; pour le jury, son rang ramené à la taille de la classe). Points : 1ʳᵉ place = ${tc.length}, dernière = 1.</p>
        <table class="tableau-general"><thead><tr><th scope="col">Place</th><th scope="col">Écurie</th><th scope="col">Classe</th><th scope="col">Points</th></tr></thead>
        <tbody>${tc.map((l) => `<tr><td class="chiffre">${l.place}</td><th scope="row">${pastille(l)} ${echapper(l.nom)}</th><td>${echapper(l.classe)}</td><td class="chiffre total">${l.total}</td></tr>`).join('')}</tbody></table></section>` : ''}`;
    poserIcones(zone);
    $('.btn-csv', zone).addEventListener('click', () => {
      const lignes = [['Place', 'Écurie', ...config.epreuves.map((e) => e.titre), 'Total']].concat(g.map((l) => [l.place, l.nom, ...config.epreuves.map((e) => (l.points[e.id] === null ? '' : l.points[e.id])), l.total]));
      const texte = '﻿' + lignes.map((l) => l.map((v) => (/[;"\n]/.test(String(v)) ? '"' + String(v).replace(/"/g, '""') + '"' : v)).join(';')).join('\r\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([texte], { type: 'text/csv;charset=utf-8' }));
      a.download = `mbot-challenge-tournoi-${t.classe.replace(/[^\w-]+/g, '-')}.csv`;
      a.click();
    });
    $('.entree-autres', zone).addEventListener('change', async (ev) => {
      for (const f of ev.target.files) {
        const r = T.lireTournoi(await f.text());
        if (r.ok && r.tournoi.classe !== t.classe) autres = autres.filter((x) => x.classe !== r.tournoi.classe).concat(r.tournoi);
      }
      naviguer('classement');
    });
    const oublier = $('.btn-oublier-autres', zone);
    if (oublier) oublier.addEventListener('click', () => {
      autres = [];
      naviguer('classement');
    });
  }

  // ---------- Écran projeté ----------

  function etatEcran() {
    if (!t) return { mode: 'attente' };
    const e = epreuve(vue);
    const suspense = $('.case-suspense').checked;
    const base = { mode: ecranMode, classe: t.classe, suspense, envoyeLe: Date.now() };
    if (ecranMode === 'passage' && e) {
      if (e.sorte === 'duel' && matchCourant) {
        const m = t.resultats.recolte.matchs.find((x) => x.id === matchCourant.id);
        return Object.assign(base, { epreuve: { titre: e.titre, sorte: e.sorte, dureeMatch: e.dureeMatch }, match: { a: ecurie(m.a), b: ecurie(m.b), scoreA: m.scoreA, scoreB: m.scoreB, restant: e.dureeMatch * 1000 - ecouleMatch(), enCours: matchCourant.enCours } });
      }
      return Object.assign(base, {
        epreuve: { titre: e.titre, sorte: e.sorte, malus: e.malus, tempsMax: e.tempsMax, objets: e.objets },
        postes: postes.filter((p) => p.epreuve === e.id && p.cle).slice(0, deuxPostes ? 2 : 1).map((p) => ({ id: p.id, ecurie: ecurie(p.cle), debut: p.debut, fin: p.fin, malus: p.malus, objets: p.objets, abandon: !!p.abandon })),
        maintenant: Date.now(),
      });
    }
    if (ecranMode === 'epreuve' && e) return Object.assign(base, { epreuve: { titre: e.titre }, lignes: T.classementEpreuve(t, config, e.id).filter((l) => l.place).map((l) => ({ place: l.place, nom: l.nom, couleur: ecurie(l.cle).couleur, valeur: l.valeur, points: l.points })) });
    if (ecranMode === 'epreuve') return Object.assign(base, { mode: 'accueil' });
    const g = T.classementGeneral(t, config);
    if (ecranMode === 'general' || ecranMode === 'podium') {
      if (suspense) return Object.assign(base, { mode: 'suspense' });
      return Object.assign(base, { epreuves: config.epreuves.map((x) => ({ id: x.id, titre: x.titre.replace(/^Défi \d · /, '') })), lignes: g.map((l) => ({ place: l.place, nom: l.nom, couleur: l.couleur, total: l.total, points: l.points })) });
    }
    return base;
  }
  function envoyer() {
    const etat = etatEcran();
    if (canal) canal.postMessage(etat);
    try { localStorage.setItem(CANAL, JSON.stringify(etat)); } catch { /* rien */ }
    for (const b of document.querySelectorAll('[data-ecran]')) b.setAttribute('aria-pressed', String(b.dataset.ecran === ecranMode));
  }

  // ---------- Démarrage ----------

  function demarrer() {
    config = A.reglagesTournoi;
    poserIcones(document);
    $('.regie-onglets').addEventListener('click', (e) => {
      const b = e.target.closest('[data-vue]');
      if (b) naviguer(b.dataset.vue);
    });
    $('.btn-ecran').addEventListener('click', () => {
      open('ecran.html', 'mbot-challenge-ecran', 'popup,width=1280,height=720');
      setTimeout(envoyer, 1500);
    });
    $('.regie-ecran-commande').addEventListener('click', (e) => {
      const b = e.target.closest('[data-ecran]');
      if (!b) return;
      if ((b.dataset.ecran === 'general' || b.dataset.ecran === 'podium') && $('.case-suspense').checked) message('Suspense coché : l’écran annonce « Résultats au prochain épisode ». Décochez pour révéler.', 4500);
      ecranMode = b.dataset.ecran;
      envoyer();
    });
    $('.case-suspense').addEventListener('change', envoyer);
    if (canal) canal.onmessage = (m) => m.data === 'bonjour' && envoyer();
    // Clavier : barre d'espace (départ, arrivée), M (malus), O (objet) pour le poste A, hors des champs de saisie.
    // preventDefault : la barre d'espace n'« appuie » pas en plus sur le bouton qui a le focus.
    const TOUCHES = { ' ': 'principal', m: 'malus', M: 'malus', o: 'objet', O: 'objet' };
    document.addEventListener('keydown', (e) => {
      const ep = t && epreuve(vue);
      if (!ep || (ep.sorte !== 'chrono' && ep.sorte !== 'obstacles') || e.ctrlKey || e.altKey || e.metaKey || e.repeat) return;
      if (!TOUCHES[e.key] || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || document.querySelector('dialog[open]')) return;
      e.preventDefault();
      agir(postes[0], ep, TOUCHES[e.key]);
    });
    // Ne pas fermer la régie par erreur pendant un passage.
    addEventListener('beforeunload', (e) => {
      if (postes.some((p) => p.debut && !p.fin) || (matchCourant && matchCourant.enCours)) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
    naviguer('preparation');
    requestAnimationFrame(boucle);
    setInterval(() => ecranMode === 'passage' && matchCourant && envoyer(), 1000);
  }

  A.demarrerRegie = demarrer;
  A.regie = { etat: () => ({ t, postes, vue }), nouveauTournoi, naviguer, agir: (id, action) => agir(postes.find((p) => p.id === id), epreuve(vue), action) };
})(this);
