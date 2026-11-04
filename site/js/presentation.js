// Présentation de lancement du projet, projetée par le professeur en première séance. Diaporama 16:9 :
// ← → (ou espace, Page suivante) pour avancer, F pour le plein écran, #n dans l'adresse pour aller à la diapositive n.
// Les règles (séances, malus, points, critères, format de l'affiche) viennent des données de l'outil.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const minuscule = (s) => String(s).charAt(0).toLowerCase() + String(s).slice(1);
  const T = A.reglagesTournoi;
  const L = A.reglagesLivrables;
  const N = A.notation;
  const epreuve = (id) => T.epreuves.find((e) => e.id === id);
  let modele = 'une-heure'; // circuit montré : séances de 1 h ou de 1 h 30
  // Où trouver l'outil : le raccourci du dossier de la classe.
  const raccourci = A.projet.raccourci.map((x) => x.replace('{classe}', '3X')).join(' › ');

  const ROLES = [
    ['Chef de projet', 'Lance chaque séance, fait le point de fin, fait le lien avec le professeur.', 'fixe'],
    ['Reporter', 'Écrit le rapport de chaque séance, avec des photos.', 'fixe'],
    ['Programmeur', 'Programme les défis avec Labo Blocs.', ''],
    ['Designer', 'Affiche, style du mBot, pièces 3D.', ''],
    ['Ingénieur d’essais', 'Chronomètre les essais, note les réglages et les résultats.', ''],
    ['Pilote', 'Pilote le mBot au clavier : labyrinthe et Récolte.', ''],
  ];
  const EXERCICES = ['Les couleurs des LED', 'Les LED clignotent', 'Son et bouton', 'Bouton et LED', 'Capteur de ligne et LED', 'Capteur de ligne et moteurs', 'Capteur d’obstacle et moteurs', 'Éviter l’obstacle'];

  const malus = (id) => `+${epreuve(id).malus.secondes} s par ${echapper(minuscule(epreuve(id).malus.libelle))}`;

  function circuit() {
    const m = A.calendrier.modeles[modele];
    const seances = Array.from({ length: m.seances }, (_, i) => {
      const n = i + 1;
      const e = m.etapes.find((x) => n >= x.de && n <= x.a);
      return { n, titre: e.titre, tournoi: m.tournoi.includes(n), affiche: n === m.affiche };
    });
    return `
      <div class="bascule" role="group" aria-label="Durée des séances">
        ${Object.entries(A.calendrier.modeles).map(([id, x]) => `<button type="button" data-modele="${id}" aria-pressed="${id === modele}">${echapper(x.libelle)}</button>`).join('')}
      </div>
      <ol class="circuit" style="--nb:${seances.length}">${seances.map((s) => `<li class="${s.tournoi ? 'tournoi' : s.affiche ? 'affiche' : ''}"><span class="num">${s.n}</span><span>${echapper(s.titre)}</span>${s.affiche ? '<strong>Affiche à rendre</strong>' : ''}</li>`).join('')}</ol>
      <p class="pied">L’affiche est rendue en séance ${m.affiche} : il faut le temps de l’imprimer et de la faire voter par les autres classes avant le tournoi.</p>`;
  }

  // Chaque diapositive : { titre (court, pour le compteur), html }
  const DIAPOS = [
    {
      titre: 'mBot Challenge',
      classe: 'couverture',
      html: () => `
        <div class="couverture-contenu">
          <img src="img/logo.svg" alt="" width="150" height="150">
          <h1>mBot Challenge</h1>
          <p class="accroche">Le grand tournoi des écuries</p>
          <p class="sous">Technologie · 3e · robotique, programmation, travail d’équipe</p>
        </div>`,
    },
    {
      titre: 'Le défi',
      html: () => `
        <p class="surtitre">Le défi</p>
        <h2>Votre écurie prépare le grand tournoi</h2>
        <div class="trois">
          <div class="carte"><span class="grand">1</span><strong>Un mBot</strong><p>À programmer pour suivre une ligne, sortir des obstacles, sortir d’un labyrinthe et gagner des duels.</p></div>
          <div class="carte"><span class="grand">2</span><strong>Une écurie</strong><p>Un nom, une couleur, un logo, une affiche, un mBot stylé : il faut des fans !</p></div>
          <div class="carte"><span class="grand">3</span><strong>Un tournoi</strong><p>Le dernier jour, chaque écurie passe toutes les épreuves devant la classe. Podium à la fin.</p></div>
        </div>
        <p class="pied">Vous êtes autonomes : c’est l’écurie qui organise son travail, séance après séance.</p>`,
    },
    {
      titre: 'Ce que vous apprenez',
      html: () => `
        <p class="surtitre">Ce que ça vous apprend</p>
        <h2>Les compétences du projet</h2>
        <ul class="liste-grande">
          <li><strong>Concevoir un algorithme</strong> puis le traduire en programme, le tester, le mettre au point.</li>
          <li><strong>Tester et dépanner</strong> : une hypothèse, un essai, une correction.</li>
          <li><strong>Décrire le mBot</strong> : chaîne d’information et chaîne d’énergie.</li>
          <li><strong>Mener un projet en équipe</strong> : planifier, répartir les tâches, rendre compte.</li>
          <li><strong>Créer et communiquer</strong> : affiche, style du mBot, vidéos.</li>
        </ul>`,
    },
    {
      titre: 'L’écurie et les rôles',
      html: () => `
        <p class="surtitre">L’écurie</p>
        <h2>3 ou 4 équipiers, 1 mBot, des rôles</h2>
        <div class="roles">${ROLES.map(([r, t, f]) => `<div class="role${f ? ' fixe' : ''}"><strong>${r}</strong><p>${t}</p>${f ? '<span class="etiquette">rôle clé</span>' : ''}</div>`).join('')}</div>
        <p class="pied">On peut cumuler des rôles, et en changer en cours de projet. Une seule règle : <strong>le chef de projet n’est jamais le reporter</strong>.</p>`,
    },
    {
      titre: 'Une séance',
      html: () => `
        <p class="surtitre">Chaque séance</p>
        <h2>Toujours les mêmes étapes</h2>
        <ol class="frise">
          <li><span class="num">1</span><strong>Point de départ</strong><em>Chef de projet</em><p>Avec toute l’écurie : ce qu’il reste à faire, qui fait quoi, combien de temps.</p></li>
          <li><span class="num">2</span><strong>Au travail</strong><em>Toute l’écurie</em><p>Chacun avance sur sa tâche, en parallèle. Personne n’attend.</p></li>
          <li><span class="num">3</span><strong>Point de fin</strong><em>Chef de projet</em><p>Ce qui est fait, ce qui reste, ce qui bloque.</p></li>
          <li><span class="num">4</span><strong>Rapport</strong><em>Reporter</em><p>Ce que l’écurie a fait, avec des photos.</p></li>
          <li><span class="num">5</span><strong>Point avec le professeur</strong><em>Chef de projet</em><p>Il vient montrer l’écran de la séance.</p></li>
        </ol>`,
    },
    { titre: 'Le circuit des séances', html: () => `<p class="surtitre">Le calendrier</p><h2>Le circuit des séances</h2>${circuit()}` },
    {
      titre: 'L’outil',
      html: () => `
        <p class="surtitre">L’outil de l’écurie</p>
        <h2>Tout le travail au même endroit</h2>
        <div class="adresse"><span>Le raccourci « mBot Challenge »</span>${echapper(raccourci)}</div>
        <div class="deux">
          <ol class="liste-grande petite">
            <li><strong>Première séance :</strong> « Nouvelle écurie », vos prénoms, votre classe, puis le dossier <code>MBOT CHALLENGE</code> de la classe.</li>
            <li><strong>Ensuite :</strong> « Reprendre » ou « Ouvrir notre écurie ». Tout s’enregistre tout seul.</li>
            <li><strong>Photos :</strong> avec la webcam du poste, ou au téléphone puis envoyée par e-mail et « Ajouter un fichier ». Les visages sont floutés.</li>
          </ol>
          <div class="tuiles">${['Écurie', 'Séance', 'Permis mBot', 'Défis', 'Affiche', 'Style', 'Vidéos', 'Comprendre'].map((x) => `<span>${x}</span>`).join('')}</div>
        </div>`,
    },
    {
      titre: 'Le permis mBot',
      html: () => `
        <p class="surtitre">Étape 1</p>
        <h2>Le permis mBot : chacun le sien</h2>
        <ol class="exercices">${EXERCICES.map((e, i) => `<li><span class="num">${i + 1}</span>${echapper(e)}</li>`).join('')}</ol>
        <p class="pied">Chaque équipier fait les 8 exercices lui-même (« C’est moi au clavier ») : LED, bouton, son, suiveur de ligne, ultrasons. Les défis s’ouvrent dès qu’un équipier a son permis.</p>`,
    },
    {
      titre: 'Les défis 1 à 3',
      html: () => `
        <p class="surtitre">Étape 2 · les défis</p>
        <h2>Trois défis contre la montre</h2>
        <div class="trois">
          <div class="carte defi"><span class="badge">D1</span><strong>Suivre la ligne</strong><p>Un tour du circuit, le plus vite possible, avec le suiveur de ligne.</p><em>${malus('ligne')}, on replace le mBot</em></div>
          <div class="carte defi"><span class="badge">D2</span><strong>Sortir les obstacles</strong><p>Les ${epreuve('obstacles').objets} objets hors de la zone en ${epreuve('obstacles').tempsMax / 60} minutes : ultrasons et suiveur de ligne.</p><em>Réussi seulement si tous sont sortis · ${malus('obstacles')}</em></div>
          <div class="carte defi"><span class="badge">D3</span><strong>Le labyrinthe</strong><p>Le pilote fait sortir le mBot au clavier, en direct par la clé 2.4G.</p><em>${malus('labyrinthe')}</em></div>
        </div>
        <p class="pied">À l’entraînement, chaque essai se chronomètre et se note dans le carnet d’essais de l’outil : temps, réglage, résultat, hypothèse.</p>`,
    },
    {
      titre: 'La Récolte et le défilé',
      html: () => `
        <p class="surtitre">Étape 2 · les défis</p>
        <h2>Un duel et un spectacle</h2>
        <div class="deux">
          <div class="carte defi"><span class="badge">D4</span><strong>La Récolte</strong><p>Duel de ${epreuve('recolte').dureeMatch} secondes : ramener un maximum de balles dans le panier de l’écurie, avec l’outil de ramassage que vous fabriquez.</p><p><strong>Sécurité programmée :</strong> si le suiveur de ligne voit la bordure noire, le mBot recule tout seul, même si le pilote appuie.</p><em>${epreuve('recolte').matchsParEcurie} matchs par écurie, adversaires tirés au sort</em></div>
          <div class="carte defi"><span class="badge">D5</span><strong>Le défilé</strong><p>Le mBot habillé défile environ 30 secondes devant le jury : déplacements, lumières, musique.</p><p>Il démarre quand on appuie sur le bouton de la carte.</p><em>Classement du jury pour le style</em></div>
        </div>`,
    },
    {
      titre: 'L’affiche',
      html: () => `
        <p class="surtitre">Le défi affiche</p>
        <h2>Recrutez des fans !</h2>
        <div class="deux">
          <div>
            <p class="texte-grand">Sur Canva, l’affiche de votre écurie. Elle est imprimée et affichée : <strong>les autres classes votent</strong> pour leur préférée.</p>
            <div class="encart-fort">Format : <strong>${echapper(L.affiche.format.nom)}</strong></div>
          </div>
          <ul class="coches">${L.affiche.controle.map((c) => `<li>${echapper(c)}</li>`).join('')}</ul>
        </div>`,
    },
    {
      titre: 'Le style du mBot',
      html: () => `
        <p class="surtitre">Le style</p>
        <h2>Le mBot le plus stylé</h2>
        <div class="deux">
          <p class="texte-grand">Pièces modélisées sur <strong>Tinkercad</strong> et imprimées en 3D, carton, tissu… Attention : les mBot sont partagés avec les autres classes.</p>
          <ul class="coches">${L.style.cahierDesCharges.map((c) => `<li>${echapper(c)}</li>`).join('')}</ul>
        </div>`,
    },
    {
      titre: 'Les vidéos',
      html: () => `
        <p class="surtitre">Les vidéos</p>
        <h2>Deux vidéos, un storyboard d’abord</h2>
        <div class="deux">${L.videos.sortes.map((v) => `<div class="carte"><strong>${echapper(v.titre)}</strong><p>${echapper(v.but)}</p><em>${echapper(v.dureeConseillee)}</em></div>`).join('')}</div>
        <p class="pied">Avant de filmer : chaque plan, ce qu’on voit, ce qu’on entend, combien de temps.</p>`,
    },
    {
      titre: 'Comprendre le mBot',
      html: () => `
        <p class="surtitre">Comprendre le mBot</p>
        <h2>Le mBot perçoit, décide, agit</h2>
        <div class="chaines">
          <div class="chaine info"><strong>Chaîne d’information</strong><div class="maillons"><span>Acquérir</span><span>Traiter</span><span>Communiquer</span></div></div>
          <div class="fleche">ordres ↓</div>
          <div class="chaine energie"><strong>Chaîne d’énergie</strong><div class="maillons"><span>Alimenter</span><span>Distribuer</span><span>Convertir</span><span>Transmettre</span></div></div>
        </div>
        <p class="pied">Dans l’outil : les vidéos du cours, un QCM, et les 7 fonctions à expliquer avec vos mots, pour <em>votre</em> mBot.</p>`,
    },
    {
      titre: 'Quand ça ne marche pas',
      html: () => `
        <p class="surtitre">La méthode</p>
        <h2>Quand ça ne marche pas…</h2>
        <ol class="methode"><li>Une <strong>hypothèse</strong></li><li>Un <strong>essai</strong> pour la vérifier</li><li>On <strong>note</strong> dans le carnet d’essais</li><li>On <strong>corrige</strong></li></ol>
        <div class="quatre">${['Erreur dans le programme ?', 'Branchement ou port ?', 'Batterie faible ?', 'Capteur mal placé ?'].map((x) => `<span>${x}</span>`).join('')}</div>
        <p class="pied">Trouver un dysfonctionnement fait partie du travail : ce n’est pas un échec.</p>`,
    },
    {
      titre: 'Le tournoi',
      html: () => `
        <p class="surtitre">Le jour J</p>
        <h2>Le tournoi : des points à chaque épreuve</h2>
        <div class="epreuves">${T.epreuves.map((e) => `<span>${echapper(e.titre.replace(/^Défi \d · /, ''))}</span>`).join('')}</div>
        <div class="points">${T.points.map((p, i) => `<div><span>${i + 1}${i ? 'ᵉ' : 'ʳᵉ'}</span><strong>${p}</strong></div>`).join('')}</div>
        <p class="pied">Égalité : mêmes points. Épreuve passée sans réussir : ${T.pointsNonReussi} point. Classes à 1 h : le tournoi se joue sur deux séances. Le classement ne compte pas dans la note.</p>`,
    },
    {
      titre: 'L’évaluation',
      html: () => `
        <p class="surtitre">L’évaluation</p>
        <h2>Ce qui est noté : le travail de l’écurie</h2>
        <div class="criteres">${N.criteres.map((c) => `<span>${echapper(c.nom)}</span>`).join('')}</div>
        <p class="texte-grand">Une note de groupe sur ${N.criteres.length} critères (non atteint · partiellement atteint · atteint · dépassé), puis un <strong>ajustement individuel</strong> de −${N.ajustementMax} à +${N.ajustementMax} points : comportement, investissement.</p>`,
    },
    {
      titre: 'Les outils',
      html: () => `
        <p class="surtitre">Vos outils</p>
        <h2>Ce que vous allez utiliser</h2>
        <div class="quatre outils">
          <div><strong>Labo Blocs</strong><p>Programmer le mBot en blocs, le simulateur, l’envoi dans le robot.</p></div>
          <div><strong>Clé 2.4G</strong><p>Piloter le mBot en direct depuis l’ordinateur : labyrinthe et Récolte.</p></div>
          <div><strong>Tinkercad</strong><p>Modéliser en 3D les pièces du style.</p></div>
          <div><strong>Canva</strong><p>L’affiche de l’écurie, les visuels.</p></div>
        </div>`,
    },
    {
      titre: 'C’est parti',
      classe: 'couverture',
      html: () => `
        <div class="couverture-contenu">
          <h1>À vos écuries !</h1>
          <ol class="depart">
            <li>Former l’écurie (3 ou 4)</li>
            <li>« Nouvelle écurie » dans l’outil</li>
            <li>Nom, couleur, rôles</li>
            <li>Premier point de départ</li>
          </ol>
          <p class="sous">Le raccourci : ${echapper(raccourci)}</p>
        </div>`,
    },
  ];

  // ---------- Diaporama ----------

  const scene = document.querySelector('.scene');
  let courante = 0;

  function afficher(i) {
    courante = Math.max(0, Math.min(DIAPOS.length - 1, i));
    const d = DIAPOS[courante];
    scene.innerHTML = `<section class="diapo ${d.classe || ''}" aria-roledescription="diapositive" aria-label="${courante + 1} sur ${DIAPOS.length} : ${echapper(d.titre)}">${d.html()}<div class="damier" aria-hidden="true"></div></section>`;
    document.querySelector('.compteur').textContent = `${courante + 1} / ${DIAPOS.length}`;
    document.querySelector('.progression span').style.width = `${((courante + 1) / DIAPOS.length) * 100}%`;
    document.querySelector('.btn-prec').disabled = courante === 0;
    document.querySelector('.btn-suiv').disabled = courante === DIAPOS.length - 1;
    document.title = courante ? `${d.titre} · mBot Challenge` : 'mBot Challenge · présentation du projet';
    history.replaceState(null, '', '#' + (courante + 1));
  }

  // La diapositive (1280 × 720) est mise à l'échelle de la fenêtre, comme un vrai diaporama.
  function echelle() {
    const k = Math.min(innerWidth / 1280, innerHeight / 720);
    document.documentElement.style.setProperty('--k', String(k));
  }

  document.querySelector('.btn-prec').addEventListener('click', () => afficher(courante - 1));
  document.querySelector('.btn-suiv').addEventListener('click', () => afficher(courante + 1));
  document.querySelector('.btn-plein').addEventListener('click', () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()));
  scene.addEventListener('click', (e) => {
    const b = e.target.closest('[data-modele]');
    if (b) {
      modele = b.dataset.modele;
      afficher(courante);
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (['ArrowRight', 'PageDown', ' ', 'Enter'].includes(e.key)) afficher(courante + 1);
    else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) afficher(courante - 1);
    else if (e.key === 'Home') afficher(0);
    else if (e.key === 'End') afficher(DIAPOS.length - 1);
    else if (e.key === 'f' || e.key === 'F') document.querySelector('.btn-plein').click();
    else return;
    e.preventDefault();
  });
  // Glisser sur une tablette ou un tableau tactile.
  let x0 = null;
  scene.addEventListener('touchstart', (e) => (x0 = e.touches[0].clientX), { passive: true });
  scene.addEventListener('touchend', (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) afficher(courante + (dx < 0 ? 1 : -1));
    x0 = null;
  });
  addEventListener('resize', echelle);
  // Lien vers une diapositive précise (…/presentation.html#6), aussi quand on change le numéro dans l'adresse.
  const depuisAdresse = () => afficher((parseInt(location.hash.slice(1), 10) || 1) - 1);
  addEventListener('hashchange', depuisAdresse);
  echelle();
  depuisAdresse();
})(this);
