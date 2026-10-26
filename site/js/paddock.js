// Paddock : la page de l'écurie (bandeau, onglets, circuit des séances, rubriques, équipage).
// Rubriques ouvertes : Écurie (identité et rôles), Programmation (permis mBot), Défis (programmes et carnet d'essais).
// Séance, affiche, style, vidéos et « Comprendre le mBot » arrivent au jalon 3.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const VUES = [
    { id: 'paddock', titre: 'Paddock' },
    { id: 'ecurie', titre: 'Écurie' },
    { id: 'programmation', titre: 'Programmation' },
    { id: 'defis', titre: 'Défis' },
  ];

  const RUBRIQUES = [
    { id: 'ecurie', titre: 'L’écurie', texte: 'Le nom, la couleur, le logo et les rôles de chaque équipier.', icone: 'drapeau' },
    { id: 'programmation', titre: 'Permis mBot', texte: 'Chaque équipier fait les 8 exercices : LED, bouton, capteur de ligne, ultrasons.', icone: 'robot' },
    { id: 'defis', titre: 'Les défis', texte: 'Ligne noire, obstacles, labyrinthe, Récolte et défilé, avec le carnet d’essais.', icone: 'chrono' },
    { id: 'seance', titre: 'Séance du jour', texte: 'Le point de départ et le point de fin du chef de projet, le rapport du reporter.', icone: 'horloge' },
    { id: 'affiche', titre: 'Affiche', texte: 'L’affiche de l’écurie faite sur Canva, pour le vote des autres classes.', icone: 'image' },
    { id: 'style', titre: 'Style du mBot', texte: 'Pièces 3D, carton, photos : un mBot stylé qui se monte et se démonte vite.', icone: 'pinceau' },
    { id: 'videos', titre: 'Vidéos', texte: 'La vidéo de promotion de l’écurie et le reportage du projet.', icone: 'camera' },
    { id: 'comprendre', titre: 'Comprendre le mBot', texte: 'Les vidéos, le QCM et les chaînes d’information et d’énergie.', icone: 'livre' },
  ];

  let session = null;
  let vueCourante = 'paddock';

  // Taille de l'interface : ×1 jusqu'à 1536×864, puis jusqu'à ×1,25 en 1920×1080.
  function ajusterEchelle() {
    const s = Math.min(1.25, Math.max(1, Math.min(innerWidth / 1536, innerHeight / 864)));
    document.documentElement.style.setProperty('--s', String(s));
    document.documentElement.style.fontSize = 16 * s + 'px';
  }

  function initiale(nom) {
    const mots = String(nom).split(/[\s,]+/).filter((m) => m && !/^(les?|la|l’.*|l'.*)$/i.test(m));
    return ((mots[0] || String(nom))[0] || '?').toUpperCase();
  }

  // Pastille de l'écurie : sa couleur et son initiale ; avec le logo quand il est lisible.
  function pastilleHtml(d, taille) {
    const couleur = d.ecurie.couleur || A.ecurie.COULEURS[0].valeur;
    return `<span class="ecurie-pastille ${taille || ''}" style="--ecurie:${couleur}" aria-hidden="true">${echapper(initiale(A.nomAffiche(d)))}</span>`;
  }
  async function pastilleHtmlAvecLogo(d, taille) {
    const url = d.ecurie.logo ? await A.medias.url(session, d.ecurie.logo) : null;
    if (!url) return pastilleHtml(d, taille);
    const couleur = d.ecurie.couleur || A.ecurie.COULEURS[0].valeur;
    return `<span class="ecurie-pastille avec-logo ${taille || ''}" style="--ecurie:${couleur}"><img src="${url}" alt="Logo de l’écurie"></span>`;
  }

  async function majBandeau() {
    const d = session.donnees;
    const racine = $('.ecran-paddock');
    $('.ecurie-nom', racine).textContent = d.ecurie.nom || 'Écurie sans nom';
    $('.ecurie-membres', racine).textContent = d.equipe.eleves.join(', ') + (d.equipe.classe ? ' · ' + d.equipe.classe : '');
    $('.ecurie-badge .pastille-place', racine).innerHTML = pastilleHtml(d);
    $('.ecurie-badge .pastille-place', racine).innerHTML = await pastilleHtmlAvecLogo(d);
    document.title = A.nomAffiche(d) + ' · ' + A.projet.titre;
  }

  function rolesDe(d, prenom) {
    const ids = (d.ecurie.roles && d.ecurie.roles[prenom]) || [];
    return ids.map((id) => (A.ROLES.find((r) => r.id === id) || { nom: id }).nom).join(' · ') || 'Rôle à choisir';
  }

  function circuitHtml(d) {
    const c = A.calendrierClasse.circuit(A.calendrier, d.equipe.classe);
    const cases = c.seances
      .map((s) => {
        const repere = s.affiche ? '<span class="seance-repere">Affiche à rendre</span>' : '';
        const classes = ['seance', s.tournoi ? 'seance-tournoi' : '', s.affiche ? 'seance-affiche' : ''].join(' ');
        return `<li class="${classes}"><span class="seance-numero">${s.numero}</span><span class="seance-titre">${echapper(s.titre)}</span>${repere}</li>`;
      })
      .join('');
    return `
      <section class="panneau circuit" aria-labelledby="titre-circuit">
        <div class="panneau-entete">
          <h2 id="titre-circuit">Le circuit des ${c.seances.length} séances</h2>
          <span class="panneau-note">${echapper(c.libelle)} · affiche à rendre en séance ${c.seanceAffiche} · tournoi en séance${c.tournoi.length > 1 ? 's' : ''} ${c.tournoi.join(' et ')}</span>
        </div>
        <ol class="circuit-seances" style="--nb:${c.seances.length}">${cases}</ol>
      </section>`;
  }

  // État affiché sur la carte d'une rubrique (texte, jamais la couleur seule).
  function etatRubrique(d, id) {
    if (id === 'ecurie') {
      const manque = [!d.ecurie.nom && 'nom', !A.ecurie.avecRole(d, 'chef') && 'rôles'].filter(Boolean);
      return manque.length ? { texte: 'À compléter : ' + manque.join(', '), ton: 'ambre' } : { texte: 'Prête', ton: 'ok' };
    }
    if (id === 'programmation') {
      const p = A.programmation.paquets().permis;
      const finis = d.equipe.eleves.filter((e) => A.ecurie.etatPermis(d, e, p).fini).length;
      return { texte: `${finis} / ${d.equipe.eleves.length} permis`, ton: finis === d.equipe.eleves.length ? 'ok' : 'neutre' };
    }
    if (id === 'defis') {
      const paquets = A.programmation.paquets();
      if (!A.ecurie.defisOuverts(d, paquets.permis)) return { texte: 'Après un permis', ton: 'neutre' };
      const faits = Object.values(A.ecurie.etatDefis(d, paquets.defis)).filter((s) => s === 'reussi').length;
      return { texte: `${faits} / ${paquets.defis.exercices.length} prêts`, ton: faits ? 'ok' : 'neutre' };
    }
    return null;
  }

  function rubriquesHtml(d) {
    return `
      <section class="rubriques" aria-label="Rubriques de l’écurie">
        ${RUBRIQUES.map((r) => {
          const ouverte = VUES.some((v) => v.id === r.id);
          const e = ouverte ? etatRubrique(d, r.id) : { texte: 'Bientôt', ton: 'neutre' };
          const entete = `${A.icone(r.icone, { epaisseur: 2.2 })}<span class="carte-titre">${r.titre}</span><span class="pastille-etat ton-${e.ton}">${echapper(e.texte)}</span>`;
          return ouverte
            ? `<button type="button" class="carte-rubrique ouverte" data-vue="${r.id}"><span class="carte-rubrique-entete">${entete}</span><span class="carte-texte">${r.texte}</span></button>`
            : `<article class="carte-rubrique"><div class="carte-rubrique-entete">${entete}</div><p class="carte-texte">${r.texte}</p></article>`;
        }).join('')}
      </section>`;
  }

  function equipageHtml(d) {
    return `
      <section class="panneau" aria-labelledby="titre-equipage">
        <div class="panneau-entete"><h2 id="titre-equipage">L’équipage</h2><button type="button" class="btn-lien" data-vue="ecurie">Changer les rôles</button></div>
        <ul class="equipage">
          ${d.equipe.eleves.map((p) => `
            <li><span class="avatar">${echapper(p.slice(0, 2).toUpperCase())}</span><span><strong>${echapper(p)}</strong><span class="equipier-roles">${echapper(rolesDe(d, p))}</span></span></li>`).join('')}
        </ul>
      </section>`;
  }

  function vuePaddock(zone) {
    const d = session.donnees;
    const chef = A.ecurie.avecRole(d, 'chef');
    const prete = d.ecurie.nom && chef;
    zone.innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Paddock de l’écurie</p>
          <h1>${d.ecurie.nom ? 'Bienvenue dans l’écurie ' + echapper(d.ecurie.nom) : 'Bienvenue, ' + echapper(d.equipe.eleves.join(', '))}</h1>
          <p>${prete
            ? `${echapper(chef)}, chef de projet : faites le point ensemble, répartissez le travail, puis chacun passe à sa tâche.`
            : 'Première étape : donnez un nom à votre écurie, choisissez sa couleur et répartissez les rôles.'}</p>
        </div>
        ${prete ? '' : '<button type="button" class="btn-principal" data-vue="ecurie">Créer notre écurie</button>'}
      </section>
      ${circuitHtml(d)}
      ${rubriquesHtml(d)}
      ${equipageHtml(d)}`;
  }

  function naviguer(vue) {
    vueCourante = vue;
    const zone = $('.paddock-contenu');
    for (const b of document.querySelectorAll('.paddock-onglets [data-vue]')) b.setAttribute('aria-current', b.dataset.vue === vue ? 'page' : 'false');
    if (vue === 'ecurie') A.ecranEcurie.afficher(zone, session);
    else if (vue === 'programmation') A.programmation.afficherPermis(zone, session);
    else if (vue === 'defis') A.programmation.afficherDefis(zone, session);
    else vuePaddock(zone);
    scrollTo(0, 0);
  }

  function demarrer(s) {
    session = s;
    const racine = $('.ecran-paddock');
    racine.hidden = false;
    $('.paddock-onglets', racine).innerHTML = VUES.map((v) => `<button type="button" data-vue="${v.id}">${v.titre}</button>`).join('');
    racine.addEventListener('click', (e) => {
      const b = e.target.closest('[data-vue]');
      if (b && racine.contains(b)) naviguer(b.dataset.vue);
    });
    Object.assign(A.paddock, { session, naviguer, majBandeau, actualiser: () => naviguer(vueCourante) });
    majBandeau();
    naviguer('paddock');
  }

  A.paddock = { pastilleHtml, pastilleHtmlAvecLogo };
  Object.assign(A, { ajusterEchelle, demarrerPaddock: demarrer });
})(this);
