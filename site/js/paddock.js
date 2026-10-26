// Paddock : la page d'accueil de l'écurie (bandeau, circuit des séances, rubriques, équipage).
// Les rubriques s'ouvrent au fil des jalons : programmation et défis (jalons 1 et 2), séances et livrables (jalon 3).
(function (global) {
  'use strict';

  const A = global.Atelier;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const RUBRIQUES = [
    { id: 'programmation', titre: 'Programmation', texte: 'Les exercices pour apprendre à piloter le mBot : LED, bouton, capteur de ligne, ultrason.', icone: 'robot' },
    { id: 'defis', titre: 'Les défis', texte: 'Ligne noire, obstacles, labyrinthe, Récolte et défilé, avec le carnet d’essais.', icone: 'drapeau' },
    { id: 'seance', titre: 'Séance du jour', texte: 'Le point de départ et le point de fin du chef de projet, le rapport du reporter.', icone: 'horloge' },
    { id: 'affiche', titre: 'Affiche', texte: 'L’affiche de l’écurie faite sur Canva, pour le vote des autres classes.', icone: 'image' },
    { id: 'style', titre: 'Style du mBot', texte: 'Pièces 3D, carton, photos : un mBot stylé qui se monte et se démonte vite.', icone: 'pinceau' },
    { id: 'videos', titre: 'Vidéos', texte: 'La vidéo de promotion de l’écurie et le reportage du projet.', icone: 'camera' },
    { id: 'comprendre', titre: 'Comprendre le mBot', texte: 'Les vidéos, le QCM et les chaînes d’information et d’énergie.', icone: 'livre' },
  ];

  // Taille de l'interface : ×1 jusqu'à 1536×864, puis jusqu'à ×1,25 en 1920×1080.
  function ajusterEchelle() {
    const s = Math.min(1.25, Math.max(1, Math.min(innerWidth / 1536, innerHeight / 864)));
    document.documentElement.style.setProperty('--s', String(s));
    document.documentElement.style.fontSize = 16 * s + 'px';
  }

  function initiales(nom) {
    const mots = String(nom).split(/[\s,]+/).filter(Boolean);
    return (mots.length > 1 ? mots[0][0] + mots[1][0] : String(nom).slice(0, 1)).toUpperCase();
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

  function rubriquesHtml() {
    return `
      <section class="rubriques" aria-label="Rubriques de l’écurie">
        ${RUBRIQUES.map((r) => `
          <article class="carte-rubrique" data-rubrique="${r.id}">
            <div class="carte-rubrique-entete">
              ${A.icone(r.icone, { epaisseur: 2.2 })}
              <h3>${r.titre}</h3>
              <span class="pastille-etat">Bientôt</span>
            </div>
            <p>${r.texte}</p>
          </article>`).join('')}
      </section>`;
  }

  function equipageHtml(d) {
    return `
      <section class="panneau" aria-labelledby="titre-equipage">
        <div class="panneau-entete"><h2 id="titre-equipage">L’équipage</h2></div>
        <ul class="equipage">
          ${d.equipe.eleves.map((p) => `
            <li><span class="avatar">${echapper(p.slice(0, 2).toUpperCase())}</span><span><strong>${echapper(p)}</strong><span class="equipier-roles">${echapper(rolesDe(d, p))}</span></span></li>`).join('')}
        </ul>
      </section>`;
  }

  function demarrer(session) {
    const d = session.donnees;
    const racine = $('.ecran-paddock');
    racine.hidden = false;
    const nom = A.nomAffiche(d);
    $('.ecurie-pastille', racine).textContent = initiales(nom);
    $('.ecurie-nom', racine).textContent = d.ecurie.nom || 'Écurie sans nom';
    $('.ecurie-membres', racine).textContent = d.equipe.eleves.join(', ') + (d.equipe.classe ? ' · ' + d.equipe.classe : '');
    $('.paddock-contenu', racine).innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Paddock de l’écurie</p>
          <h1>${d.ecurie.nom ? 'Bienvenue dans l’écurie ' + echapper(d.ecurie.nom) : 'Bienvenue, ' + echapper(d.equipe.eleves.join(', '))}</h1>
          <p>Votre écurie est créée. Tout votre travail sera rangé ici et dans le dossier de votre écurie. Les rubriques s’ouvriront au fil du projet.</p>
        </div>
      </section>
      ${circuitHtml(d)}
      ${rubriquesHtml()}
      ${equipageHtml(d)}`;
    document.title = nom + ' · ' + A.projet.titre;
    A.paddock = { session };
  }

  Object.assign(A, { ajusterEchelle, demarrerPaddock: demarrer });
})(this);
