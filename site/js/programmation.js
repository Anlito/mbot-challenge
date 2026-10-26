// Programmation : permis mBot (exercices 1 à 8, chaque équipier pour lui) et défis de l'écurie (programmes en commun,
// carnet d'essais avec chrono). Les exercices et les défis s'ouvrent dans l'écran de Labo Blocs, posé par-dessus.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const LB = global.LaboBlocs;
  const E = A.ecurie;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const nombreFr = (x) => String(Math.round(x * 10) / 10).replace('.', ',');

  const MEDIA = 'https://anlito.github.io/labo-blocs/module/blockly/media/';
  const STATUTS = {
    reussi: { symbole: '✓', texte: 'réussi' },
    a_reverifier: { symbole: '↻', texte: 'à revérifier' },
    en_cours: { symbole: '●', texte: 'en cours' },
    a_faire: { symbole: '○', texte: 'à faire' },
    verrouille: { symbole: '·', texte: 'pas encore ouvert' },
  };

  // ---------- Parcours ----------

  let lesPaquets = null;
  function paquets() {
    if (!lesPaquets) {
      const brut = LB.parcoursDefinis.find((p) => p.id === A.projet.parcours);
      lesPaquets = E.paquets(brut);
    }
    return lesPaquets;
  }

  // ---------- Écran de Labo Blocs ----------

  // Ce que l'écran de Labo Blocs range avant chaque enregistrement (le programme affiché) : seulement celui de
  // l'écran ouvert, même après plusieurs ouvertures dans la séance.
  let avantEcriture = [];
  let branche = false;
  let ecranOuvert = null;

  function sessionPour(session, donnees) {
    if (!branche) {
      session.surAvantEcriture(() => avantEcriture.forEach((f) => f()));
      branche = true;
    }
    avantEcriture = [];
    return {
      donnees,
      lecture: !!session.lecture,
      aEnregistrer: (maintenant, geste) => session.aEnregistrer(maintenant, geste),
      enregistrer: (mode) => session.enregistrer(mode),
      majEtat: (texte) => session.majEtat(texte),
      message: (texte, duree) => session.message(texte, duree),
      surAvantEcriture: (f) => avantEcriture.push(f),
    };
  }

  // quoi : { donnees, paquet, id, texteEquipe, toutDebloquer, retour (vue du paddock), actionsReussite }
  function ouvrirEcran(session, quoi) {
    const hote = $('.ecran-programmation');
    const d = session.donnees;
    $('.ecran-paddock').hidden = true;
    hote.hidden = false;
    const fermer = () => {
      hote.hidden = true;
      hote.replaceChildren();
      ecranOuvert = null;
      $('.ecran-paddock').hidden = false;
      A.paddock.naviguer(quoi.retour);
      A.paddock.majBandeau();
    };
    ecranOuvert = LB.monterExercice(hote, {
      session: sessionPour(session, quoi.donnees),
      paquet: quoi.paquet,
      projet: { id: A.projet.id, titre: A.projet.titre, accent: d.ecurie.couleur ? A.ecurie.theme(d.ecurie.couleur).principal : A.projet.accent, logo: 'img/logo.svg' },
      media: MEDIA,
      retour: { texte: quoi.retour === 'defis' ? 'Défis' : 'Permis mBot', action: fermer },
      toutDebloquer: !!quoi.toutDebloquer,
      actionsReussite: quoi.actionsReussite,
    });
    const equipe = hote.querySelector('.equipe-texte');
    if (equipe) equipe.textContent = quoi.texteEquipe;
    ecranOuvert.ouvrir(quoi.id || null);
  }

  // ---------- Permis mBot ----------

  function pastillesPermis(etat, paquet) {
    return `<ol class="permis-exos">${paquet.exercices.map((e) => {
      const s = STATUTS[etat.statuts[e.id]] || STATUTS.a_faire;
      return `<li class="permis-exo statut-${etat.statuts[e.id]}" title="Exercice ${e.numero} · ${echapper(e.titre)} : ${s.texte}"><span aria-hidden="true">${s.symbole}</span><span class="sr">Exercice ${e.numero} : ${s.texte}</span><span class="permis-num" aria-hidden="true">${e.numero}</span></li>`;
    }).join('')}</ol>`;
  }

  function afficherPermis(zone, session) {
    const d = session.donnees;
    const { permis } = paquets();
    const etats = d.equipe.eleves.map((p) => ({ prenom: p, etat: E.etatPermis(d, p, permis) }));
    zone.innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Permis mBot</p>
          <h1>Chacun son permis</h1>
          <p>Chaque équipier fait lui-même les 8 exercices, à son tour au clavier : allumer les LED, utiliser le bouton, le suiveur de ligne et les ultrasons. Les défis s’ouvrent dès qu’un équipier a son permis.</p>
        </div>
      </section>
      <section class="permis-grille" aria-label="Permis de chaque équipier">
        ${etats.map(({ prenom, etat }) => `
          <article class="carte-permis${etat.fini ? ' fini' : ''}">
            <div class="carte-permis-entete">
              <span class="avatar">${echapper(prenom.slice(0, 2).toUpperCase())}</span>
              <div><h2>${echapper(prenom)}</h2><span class="permis-compte">${etat.fini ? '✓ Permis obtenu' : `${etat.reussis} / ${etat.total} exercices`}</span></div>
            </div>
            ${pastillesPermis(etat, permis)}
            <button type="button" class="btn-principal" data-au-clavier="${echapper(prenom)}">${A.icone('robot', { epaisseur: 2.2 })}${etat.fini ? 'Revoir mes exercices' : 'C’est moi au clavier'}</button>
          </article>`).join('')}
      </section>
      <p class="legende">✓ réussi · ● en cours · ○ à faire · ↻ à revérifier (l’exercice a changé) · · pas encore ouvert</p>`;
    zone.querySelector('.permis-grille').addEventListener('click', (e) => {
      const b = e.target.closest('[data-au-clavier]');
      if (!b) return;
      const prenom = b.dataset.auClavier;
      ouvrirEcran(session, {
        donnees: E.vuePermis(d, prenom, permis),
        paquet: permis,
        texteEquipe: `Permis de ${prenom}${d.ecurie.nom ? ' · Écurie ' + d.ecurie.nom : ''}`,
        retour: 'programmation',
        actionsReussite: (ex) => (ex.id === permis.exercices[permis.exercices.length - 1].id
          ? [{ texte: 'Permis obtenu : voir les défis', principal: true, action: () => { $('.ecran-programmation .btn-vers-parcours').click(); A.paddock.naviguer('defis'); } }]
          : []),
      });
    });
  }

  // ---------- Défis et carnet d'essais ----------

  let defiChoisi = null;
  let chrono = { debut: null, ecoule: 0, minuteur: null };

  function afficherDefis(zone, session) {
    const d = session.donnees;
    const { permis, defis } = paquets();
    if (!E.defisOuverts(d, permis)) {
      const meilleur = d.equipe.eleves.map((p) => ({ p, n: E.etatPermis(d, p, permis).reussis })).sort((a, b) => b.n - a.n)[0];
      zone.innerHTML = `
        <section class="panneau briefing">
          <div>
            <p class="surtitre">Les défis</p>
            <h1>Les défis s’ouvrent après un premier permis</h1>
            <p>Dès qu’un équipier a réussi les 8 exercices du permis mBot, l’écurie peut programmer les 5 défis du tournoi. Pour l’instant, ${echapper(meilleur.p)} en a réussi ${meilleur.n} sur ${permis.exercices.length}.</p>
          </div>
          <button type="button" class="btn-principal" data-vue="programmation">Aller au permis mBot</button>
        </section>`;
      return;
    }
    const statuts = E.etatDefis(d, defis);
    zone.innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Les défis du tournoi</p>
          <h1>Programmer, essayer, régler</h1>
          <p>Pour chaque défi : écrivez l’algorithme, programmez-le, puis essayez-le sur la vraie piste. Chaque essai se note dans le carnet : temps, réglage, résultat, et votre hypothèse quand ça ne marche pas.</p>
          <p><a href="fiches.html#tournoi" target="_blank" rel="noopener">Les règles du tournoi</a> (épreuves, malus, points).</p>
        </div>
      </section>
      <section class="defis-grille" aria-label="Les 5 défis">
        ${A.defis.map((x) => {
          const s = STATUTS[statuts[x.id]] || STATUTS.a_faire;
          const m = E.meilleurEssai(d, x);
          const n = E.essaisDe(d, x.id).length;
          return `
          <article class="carte-defi${defiChoisi === x.id ? ' choisi' : ''}">
            <div class="carte-defi-entete"><span class="defi-numero">${x.numero}</span><h2>${echapper(x.titre)}</h2></div>
            <p>${echapper(x.objectif)}</p>
            <dl class="defi-chiffres">
              <div><dt>Programme</dt><dd>${s.symbole} ${statuts[x.id] === 'reussi' ? 'prêt' : s.texte}</dd></div>
              <div><dt>${x.mesure === 'duree' ? 'Meilleure durée' : 'Meilleur temps'}</dt><dd class="chiffre">${m ? nombreFr(m.temps) + ' s' : '—'}</dd></div>
              <div><dt>Essais notés</dt><dd class="chiffre">${n}</dd></div>
            </dl>
            <div class="carte-defi-actions">
              <button type="button" class="btn-principal" data-programmer="${x.id}">${A.icone('robot', { epaisseur: 2.2 })}Programmer</button>
              <button type="button" class="btn-secondaire" data-essais="${x.id}">${A.icone('chrono', { epaisseur: 2.2 })}Carnet d’essais</button>
            </div>
          </article>`;
        }).join('')}
      </section>
      <div class="zone-essais"></div>`;
    zone.querySelector('.defis-grille').addEventListener('click', (e) => {
      const p = e.target.closest('[data-programmer]');
      if (p) {
        ouvrirEcran(session, {
          donnees: d,
          paquet: defis,
          id: p.dataset.programmer,
          toutDebloquer: true,
          texteEquipe: `Écurie ${d.ecurie.nom || d.equipe.eleves.join(', ')}`,
          retour: 'defis',
        });
        return;
      }
      const c = e.target.closest('[data-essais]');
      if (c) {
        defiChoisi = c.dataset.essais;
        for (const carte of zone.querySelectorAll('.carte-defi')) carte.classList.toggle('choisi', !!carte.querySelector(`[data-essais="${defiChoisi}"]`));
        afficherEssais(zone.querySelector('.zone-essais'), session);
        zone.querySelector('.zone-essais').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    if (defiChoisi) afficherEssais(zone.querySelector('.zone-essais'), session);
  }

  function texteChrono(ms) {
    const s = ms / 1000;
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
  }

  function arreterChrono() {
    clearInterval(chrono.minuteur);
    if (chrono.debut) chrono.ecoule += Date.now() - chrono.debut;
    chrono.debut = null;
    chrono.minuteur = null;
  }

  function afficherEssais(zone, session) {
    const d = session.donnees;
    const defi = A.defis.find((x) => x.id === defiChoisi);
    arreterChrono();
    chrono.ecoule = 0;
    const essais = E.essaisDe(d, defi.id);
    const heure = (iso) => {
      const t = new Date(iso);
      return t.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    };
    zone.innerHTML = `
      <section class="panneau carnet-essais" aria-labelledby="titre-essais">
        <div class="panneau-entete">
          <h2 id="titre-essais">Carnet d’essais · ${defi.numero} ${echapper(defi.titre)}</h2>
          <span class="panneau-note">Méthode : une hypothèse → un réglage → un essai → on note → on corrige.</span>
        </div>
        <div class="essai-grille">
          <div class="chrono" role="group" aria-label="Chronomètre">
            <div class="chrono-affichage" role="timer" aria-live="off">00:00.0</div>
            <div class="chrono-boutons">
              <button type="button" class="btn-principal chrono-depart">Départ</button>
              <button type="button" class="btn-secondaire chrono-zero">Remettre à zéro</button>
            </div>
            <p class="aide">${defi.mesure === 'duree' ? 'Mesurez la durée du défilé : l’objectif est d’environ 30 secondes.' : 'Départ quand le mBot part, Arrêt quand il arrive : le temps se recopie dans l’essai.'}</p>
          </div>
          <form class="formulaire-essai" novalidate>
            <label class="champ">${defi.mesure === 'duree' ? 'Durée (s)' : 'Temps (s)'}<input name="temps" type="number" min="0" step="0.1" inputmode="decimal"></label>
            ${defi.compteur ? `<label class="champ">${echapper(defi.compteur.libelle)}<input name="compteur" type="number" min="0"${defi.compteur.max !== undefined ? ` max="${defi.compteur.max}"` : ''} step="1" inputmode="numeric"></label>` : ''}
            <label class="champ">Qui a fait l’essai ?<select name="qui"><option value="">—</option>${d.equipe.eleves.map((p) => `<option>${echapper(p)}</option>`).join('')}</select></label>
            <fieldset class="champ resultat">
              <legend>Résultat</legend>
              <label><input type="radio" name="reussi" value="oui"> ✓ Essai réussi</label>
              <label><input type="radio" name="reussi" value="non" checked> ○ Pas encore</label>
            </fieldset>
            <label class="champ large">Réglage essayé<input name="reglage" maxlength="300" placeholder="Ex. : vitesse 60 % dans les virages"></label>
            <label class="champ large">Si ça n’a pas marché : notre hypothèse<textarea name="hypothese" rows="2" maxlength="500" placeholder="Ex. : le capteur droit voit le carrelage comme du noir"></textarea></label>
            <p class="message-ecart large" role="alert" hidden></p>
            <div class="large"><button type="submit" class="btn-principal">Noter l’essai</button></div>
          </form>
        </div>
        ${essais.length ? `
        <div class="tableau-defilant">
          <table class="tableau-essais">
            <thead><tr><th scope="col">Quand</th><th scope="col">${defi.mesure === 'duree' ? 'Durée' : 'Temps'}</th>${defi.compteur ? `<th scope="col">${echapper(defi.compteur.libelle)}</th>` : ''}<th scope="col">Résultat</th><th scope="col">Qui</th><th scope="col">Réglage</th><th scope="col">Hypothèse</th></tr></thead>
            <tbody>${essais.map((x) => `
              <tr>
                <td>${heure(x.date)}</td>
                <td class="chiffre">${x.temps === null ? '—' : nombreFr(x.temps) + ' s'}</td>
                ${defi.compteur ? `<td class="chiffre">${x.compteur === null ? '—' : x.compteur}</td>` : ''}
                <td>${x.reussi ? '✓ réussi' : '○ pas encore'}</td>
                <td>${echapper(x.qui || '—')}</td>
                <td>${echapper(x.reglage || '—')}</td>
                <td>${echapper(x.hypothese || '—')}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>` : '<p class="aide">Aucun essai noté pour ce défi.</p>'}
      </section>`;

    const affichage = $('.chrono-affichage', zone);
    const depart = $('.chrono-depart', zone);
    const form = $('.formulaire-essai', zone);
    const maj = () => (affichage.textContent = texteChrono(chrono.ecoule + (chrono.debut ? Date.now() - chrono.debut : 0)));
    depart.addEventListener('click', () => {
      if (chrono.debut) {
        arreterChrono();
        maj();
        form.temps.value = (Math.round(chrono.ecoule / 100) / 10).toFixed(1);
        depart.textContent = 'Reprendre';
        form.temps.focus();
      } else {
        chrono.debut = Date.now();
        chrono.minuteur = setInterval(maj, 100);
        depart.textContent = 'Arrêt';
      }
    });
    $('.chrono-zero', zone).addEventListener('click', () => {
      arreterChrono();
      chrono.ecoule = 0;
      maj();
      depart.textContent = 'Départ';
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const r = E.ajouterEssai(d, {
        defi: defi.id,
        temps: form.temps.value.replace(',', '.'),
        compteur: form.compteur ? form.compteur.value : null,
        reussi: form.reussi.value === 'oui',
        reglage: form.reglage.value,
        hypothese: form.hypothese.value,
        qui: form.qui.value,
      }, A.defis);
      const p = $('.message-ecart', form);
      p.textContent = r.ok ? '' : r.raison;
      p.hidden = r.ok;
      if (!r.ok) return;
      session.aEnregistrer(true, true);
      session.message('Essai noté dans le carnet.');
      A.paddock.naviguer('defis');
      const carnet = $('.zone-essais');
      if (carnet) carnet.scrollIntoView({ block: 'start' });
    });
  }

  A.programmation = { paquets, afficherPermis, afficherDefis, ecranOuvert: () => ecranOuvert };
})(this);
