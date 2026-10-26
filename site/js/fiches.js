// Fiches à imprimer (A4) : démarrage élève, règles du tournoi, affiche et style du mBot. Construites à partir des
// données de l'outil (donnees/*.js) : une règle changée dans les données change aussi la fiche.
(function (global) {
  'use strict';

  // « mBot sorti » reste « mBot sorti » : seule la première lettre passe en minuscule.
  const minuscule = (s) => String(s).charAt(0).toLowerCase() + String(s).slice(1);

  const A = global.Atelier;
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const adresse = 'https://anlito.github.io/mbot-challenge/';
  const entete = (titre, sous) => `<div class="fiche-entete"><img src="img/logo.svg" alt="" width="44" height="44"><div><p class="surtitre">mBot Challenge · 3e</p><h1>${titre}</h1>${sous ? `<p class="sous">${sous}</p>` : ''}</div></div>`;

  function demarrage() {
    return `<section class="fiche" id="demarrage">
      ${entete('Démarrer avec l’outil', 'Tout le travail de l’écurie est rangé dans l’outil et dans le dossier de l’écurie.')}
      <div class="encart-adresse"><span>Adresse</span><strong>${adresse}</strong><span>Chrome ou Edge</span></div>
      <ol class="etapes">
        <li><strong>Première séance : « Nouvelle écurie ».</strong> Écrivez vos prénoms (1 à 4), choisissez la classe, puis le dossier
          <span class="chemin-fiche">Bureau › Classe › 3X › COMMUN › TECHNOLOGIE › MBOT CHALLENGE</span>. L’outil y crée le dossier de l’écurie.</li>
        <li><strong>Les séances suivantes : « Reprendre » ou « Ouvrir notre écurie »</strong> (choisir le dossier de l’écurie). Le travail s’enregistre tout seul.</li>
        <li><strong>Écurie :</strong> nom, couleur, logo, et les rôles. Un chef de projet et un reporter, jamais la même personne.</li>
        <li><strong>Séance :</strong> au début, le <em>chef de projet</em> fait le point de départ avec toute l’écurie (qui fait quoi). À la fin, il fait le point de fin et va voir le professeur ; le <em>reporter</em> écrit le rapport avec des photos.</li>
        <li><strong>Permis mBot :</strong> chacun fait les 8 exercices lui-même (« C’est moi au clavier »). Les défis s’ouvrent dès qu’un équipier a son permis.</li>
        <li><strong>Défis :</strong> programmer, essayer sur la piste, noter chaque essai dans le carnet (temps, réglage, hypothèse).</li>
        <li><strong>Affiche, style du mBot, vidéos, comprendre le mBot :</strong> déposez vos fichiers dans leur rubrique.</li>
      </ol>
      <div class="deux">
        <div class="encart"><strong>Une photo prise au téléphone ?</strong><p>Envoyez-la-vous par e-mail, ouvrez le message sur le poste, enregistrez la pièce jointe, puis « Ajouter un fichier ». Les visages se floutent avant l’enregistrement.</p></div>
        <div class="encart"><strong>Ça ne marche pas ?</strong><p>Formulez une hypothèse (programme, branchement, batterie, capteur), proposez un essai pour la vérifier, testez, corrigez. Notez-le dans le carnet d’essais.</p></div>
      </div>
    </section>`;
  }

  function tournoi() {
    const T = A.reglagesTournoi;
    const defis = Object.fromEntries((A.defis || []).map((d) => [d.id.replace('mbc-d', ''), d]));
    const regles = {
      ligne: 'Le mBot suit la ligne noire et fait un tour, le plus vite possible.',
      obstacles: 'Dans la zone bordée de noir, le mBot sort les objets sans sortir lui-même.',
      labyrinthe: 'Le pilote fait sortir le mBot du labyrinthe au clavier (clé 2.4G).',
      recolte: 'Duel : le pilote ramène un maximum de balles dans le panier de l’écurie, avec votre outil de ramassage. Le mBot ne franchit jamais la bordure noire (sécurité programmée).',
      affiche: 'Les autres classes votent pour leur affiche préférée.',
      style: 'Le mBot habillé défile environ 30 secondes devant le jury, qui classe les mBot du plus stylé au moins stylé.',
    };
    return `<section class="fiche" id="tournoi">
      ${entete('Les règles du tournoi', 'Chaque épreuve rapporte des points selon la place de l’écurie. Le total donne le classement général.')}
      <table class="regles">
        <thead><tr><th scope="col">Épreuve</th><th scope="col">Règle</th><th scope="col">Ce qui compte</th></tr></thead>
        <tbody>${T.epreuves.map((e) => `<tr>
          <th scope="row">${echapper(e.titre)}</th>
          <td>${echapper(regles[e.id] || e.aide)}</td>
          <td>${e.sorte === 'chrono' ? `Le temps. Malus : +${e.malus.secondes} s par ${echapper(minuscule(e.malus.libelle))}.`
            : e.sorte === 'obstacles' ? `Réussi seulement si les ${e.objets} objets sont sortis en ${e.tempsMax / 60} minutes. Puis le temps. Malus : +${e.malus.secondes} s par ${echapper(minuscule(e.malus.libelle))}.`
            : e.sorte === 'duel' ? `${e.matchsParEcurie} matchs de ${e.dureeMatch} s par écurie, adversaires tirés au sort. Victoires (match nul : ½), puis balles.`
            : e.sorte === 'votes' ? 'Le nombre de votes.' : 'Le classement du jury.'}</td>
        </tr>`).join('')}</tbody>
      </table>
      <div class="deux">
        <div class="encart"><strong>Les points</strong><p>À chaque épreuve : ${T.points.map((p, i) => `${i + 1}${i ? 'ᵉ' : 'ʳᵉ'} place ${p}`).join(' · ')}. Égalité : même place, mêmes points. Épreuve passée sans réussir (abandon, défi 2 non validé) : ${T.pointsNonReussi} point.</p></div>
        <div class="encart"><strong>Le jour J</strong><p>Le mBot est prêt (batterie chargée, programmes envoyés) avant le passage. Les éléments de style se posent et s’enlèvent vite : les mBot sont partagés avec les autres classes.</p></div>
      </div>
      <p class="note">Le classement du tournoi ne compte pas dans la note : la note porte sur le travail de l’écurie pendant tout le projet.</p>
    </section>`;
  }

  function style() {
    const L = A.reglagesLivrables;
    const f = L.affiche.format;
    return `<section class="fiche" id="style">
      ${entete('L’affiche et le style du mBot', 'Le cahier des charges à respecter.')}
      <h2>L’affiche de l’écurie</h2>
      <div class="encart encart-fort"><strong>Format : ${echapper(f.nom)}</strong><p>Sur Canva, choisissez le format A3 et gardez-le en portrait. Exportez en PDF (« PDF pour l’impression ») ou en PNG grande taille, puis déposez le fichier dans la rubrique Affiche.</p></div>
      <ul class="cases">${L.affiche.controle.map((c) => `<li>${echapper(c)}</li>`).join('')}</ul>
      <h2>Le style du mBot</h2>
      <ul class="cases">${L.style.cahierDesCharges.map((c) => `<li>${echapper(c)}</li>`).join('')}
        ${L.style.dimensionsMax ? `<li>Chaque pièce imprimée en 3D tient dans ${L.style.dimensionsMax.join(' × ')} mm</li>` : '<li>Chaque pièce imprimée en 3D respecte la taille donnée par le professeur</li>'}</ul>
      <h2>Le défilé</h2>
      <p>Environ 30 secondes devant le jury : déplacements, lumières, musique. Il commence quand on appuie sur le bouton de la carte. Écrivez-le d’abord seconde par seconde dans la rubrique Style.</p>
    </section>`;
  }

  document.querySelector('.fiches').innerHTML = demarrage() + tournoi() + style();
  document.querySelector('.btn-imprimer').addEventListener('click', () => print());
})(this);
