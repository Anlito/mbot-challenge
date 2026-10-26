// « Comprendre le mBot » : vidéos du cours avec chapitres (lues depuis le dossier du serveur, choisi une fois par
// poste), QCM sur les chaînes d'information et d'énergie, et les 7 fonctions expliquées avec ses mots.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const L = A.livrables;
  const C = () => A.comprendre;
  const echapper = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const minutes = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  const CLE_VIDEOS = 'videos-du-cours';
  const LETTRES = ['A', 'B', 'C', 'D'];

  let partie = 'videos';
  let videoChoisie = null;
  let urlVideo = null;

  // ---------- Vidéos ----------

  async function dossierVideos(demander) {
    let d = await A.dossierEcurie.retrouverCle(CLE_VIDEOS);
    if (d) {
      try {
        if ((await d.queryPermission({ mode: 'read' })) === 'granted') return d;
        if (demander && (await d.requestPermission({ mode: 'read' })) === 'granted') return d;
      } catch {
        d = null;
      }
    }
    if (!demander) return null;
    if (typeof global.showDirectoryPicker !== 'function') throw new Error('Sur ce navigateur, ouvrez la vidéo depuis le dossier du serveur.');
    try {
      d = await global.showDirectoryPicker({ id: A.projet.id + '-videos', mode: 'read' });
    } catch (e) {
      if (e && e.name === 'AbortError') return null;
      throw e;
    }
    await A.dossierEcurie.memoriserCle(CLE_VIDEOS, d);
    return d;
  }

  async function chargerVideo(zone, v, demander) {
    const lecteur = zone.querySelector('.lecteur');
    const etat = zone.querySelector('.etat-video');
    try {
      const dossier = await dossierVideos(demander);
      if (!dossier) {
        etat.innerHTML = `<p>Les vidéos sont dans le dossier du serveur où se trouve le raccourci de l’outil. Choisissez ce dossier une fois sur ce poste.</p><button type="button" class="btn-principal choisir-videos">${A.icone('dossier', { epaisseur: 2.2 })}Choisir le dossier des vidéos</button>`;
        lecteur.hidden = true;
        return;
      }
      const f = await (await dossier.getFileHandle(v.fichier)).getFile();
      if (urlVideo) URL.revokeObjectURL(urlVideo);
      urlVideo = URL.createObjectURL(f);
      lecteur.src = urlVideo;
      lecteur.hidden = false;
      etat.innerHTML = '';
    } catch (e) {
      lecteur.hidden = true;
      etat.innerHTML = `<p class="message-ecart">Le fichier « ${echapper(v.fichier)} » n’est pas dans le dossier choisi. Choisissez le dossier qui contient les vidéos du cours.</p><button type="button" class="btn-secondaire choisir-videos" data-autre="1">Choisir un autre dossier</button>`;
    }
  }

  function videosHtml() {
    const v = C().videos.find((x) => x.id === videoChoisie) || C().videos[0];
    videoChoisie = v.id;
    return `
      <div class="comprendre-videos">
        <nav class="liste-videos" aria-label="Vidéos du cours">
          ${C().videos.map((x) => `<button type="button" data-video="${x.id}" aria-current="${x.id === v.id ? 'true' : 'false'}"><strong>${echapper(x.titre)}</strong><span>${x.duree}</span></button>`).join('')}
          <div class="chapitres">
            ${v.groupes.map((g) => `${g.titre ? `<div class="chapitres-titre">${echapper(g.titre)}</div>` : ''}${g.chapitres.map(([t, nom]) => `<button type="button" data-temps="${t}"><span class="chiffre">${minutes(t)}</span>${echapper(nom)}</button>`).join('')}`).join('')}
          </div>
        </nav>
        <section class="panneau lecteur-zone">
          <h2>${echapper(v.titre)}</h2>
          <p class="aide">${echapper(v.description)}</p>
          ${v.aide ? `<p class="encart-reprise">${echapper(v.aide)}</p>` : ''}
          <video class="lecteur" controls preload="metadata" hidden></video>
          <div class="etat-video"><p class="aide">Recherche de la vidéo…</p></div>
        </section>
      </div>`;
  }

  // ---------- QCM ----------

  function qcmHtml(d) {
    const essais = L.comprendre(d).qcm;
    return `
      <section class="panneau" aria-labelledby="titre-qcm">
        <div class="panneau-entete"><h2 id="titre-qcm">QCM · chaînes d’information et d’énergie</h2><span class="panneau-note">15 questions · 1 seule réponse par question · environ 10 min</span></div>
        <form class="formulaire-qcm" novalidate>
          <label class="champ champ-qui">Qui répond ?<select name="qui"><option value="">—</option>${d.equipe.eleves.map((p) => `<option>${echapper(p)}</option>`).join('')}</select></label>
          <ol class="questions">
            ${C().qcm.map((q, i) => `
              <li class="question">
                <fieldset>
                  <legend><span class="question-theme">${echapper(q.theme)}</span>${echapper(q.question)}</legend>
                  ${q.choix.map((c, j) => `<label class="choix"><input type="radio" name="q${i}" value="${j}"><span class="lettre">${LETTRES[j]}</span>${echapper(c)}</label>`).join('')}
                </fieldset>
              </li>`).join('')}
          </ol>
          <div class="accueil-actions"><button type="submit" class="btn-principal">Voir mes résultats</button></div>
          <p class="message-ecart" role="alert" hidden></p>
        </form>
        <div class="resultats-qcm"></div>
        ${essais.length ? `<p class="aide">Essais de l’écurie : ${essais.slice(-5).map((e) => `${echapper(e.qui || '—')} ${String(e.note).replace('.', ',')}/20`).join(' · ')}</p>` : ''}
      </section>`;
  }

  function correctionHtml(essai) {
    const appreciation = essai.note >= 16 ? 'Excellent' : essai.note >= 12 ? 'Solide' : essai.note >= 8 ? 'À consolider' : 'À revoir';
    return `
      <div class="resultat-qcm">
        <p class="score"><span class="chiffre">${essai.bonnes} / ${essai.total}</span> bonnes réponses · <span class="chiffre">${String(essai.note).replace('.', ',')} / 20</span> · ${appreciation}</p>
        <ol class="correction">
          ${C().qcm.map((q, i) => {
            const ok = essai.reponses[i] === q.bonne;
            return `<li class="${ok ? 'juste' : 'a-revoir'}"><strong>${echapper(q.question)}</strong><br>${ok ? `✓ ${LETTRES[q.bonne]}. ${echapper(q.choix[q.bonne])}` : `Ta réponse : ${LETTRES[essai.reponses[i]]}. ${echapper(q.choix[essai.reponses[i]])}<br>→ Réponse attendue : ${LETTRES[q.bonne]}. ${echapper(q.choix[q.bonne])}`}</li>`;
          }).join('')}
        </ol>
      </div>`;
  }

  // ---------- Les 7 fonctions ----------

  function chainesHtml(d) {
    const c = L.comprendre(d).chaines;
    const groupe = (chaine, titre) => `
      <fieldset class="groupe-chaine chaine-${chaine}">
        <legend>${titre}</legend>
        ${C().chaines.filter((f) => f.chaine === chaine).map((f) => `<label class="champ"><span class="fonction">${f.fonction}</span><textarea name="${f.id}" rows="2" maxlength="400" placeholder="Sur notre mBot, …">${echapper(c[f.id] || '')}</textarea></label>`).join('')}
      </fieldset>`;
    const n = C().chaines.filter((f) => (c[f.id] || '').length >= 10).length;
    return `
      <section class="panneau" aria-labelledby="titre-chaines">
        <div class="panneau-entete"><h2 id="titre-chaines">Les 7 fonctions de notre mBot</h2><span class="panneau-note">${n} / 7 expliquées</span></div>
        <p class="aide-bloc">${echapper(C().aideChaines)}</p>
        <form class="formulaire-chaines" novalidate>
          <div class="deux-colonnes">${groupe('information', 'Chaîne d’information')}${groupe('energie', 'Chaîne d’énergie')}</div>
          <div class="accueil-actions"><button type="submit" class="btn-principal">Enregistrer</button></div>
        </form>
      </section>`;
  }

  // ---------- Écran ----------

  function afficher(zone, session) {
    const d = session.donnees;
    const parties = [['videos', 'Vidéos du cours'], ['qcm', 'QCM'], ['chaines', 'Les 7 fonctions']];
    zone.innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Comprendre le mBot</p>
          <h1>Capteurs, actionneurs, chaînes</h1>
          <p>Comment le mBot perçoit, décide et agit : regardez les vidéos, testez-vous avec le QCM, puis expliquez avec vos mots les 7 fonctions de votre mBot.</p>
        </div>
      </section>
      <nav class="sous-onglets" aria-label="Parties">${parties.map(([id, t]) => `<button type="button" data-partie="${id}" aria-current="${id === partie ? 'page' : 'false'}">${t}</button>`).join('')}</nav>
      <div class="partie-comprendre">${partie === 'qcm' ? qcmHtml(d) : partie === 'chaines' ? chainesHtml(d) : videosHtml()}</div>`;

    zone.querySelector('.sous-onglets').addEventListener('click', (e) => {
      const b = e.target.closest('[data-partie]');
      if (!b) return;
      partie = b.dataset.partie;
      afficher(zone, session);
    });

    if (partie === 'videos') {
      const v = C().videos.find((x) => x.id === videoChoisie);
      chargerVideo(zone, v, false);
      zone.querySelector('.comprendre-videos').addEventListener('click', (e) => {
        const bv = e.target.closest('[data-video]');
        if (bv) {
          videoChoisie = bv.dataset.video;
          return afficher(zone, session);
        }
        const bt = e.target.closest('[data-temps]');
        const lecteur = zone.querySelector('.lecteur');
        if (bt && !lecteur.hidden) {
          lecteur.currentTime = Number(bt.dataset.temps);
          lecteur.play();
        }
        const bd = e.target.closest('.choisir-videos');
        if (bd) {
          if (bd.dataset.autre) A.dossierEcurie.memoriserCle(CLE_VIDEOS, null);
          chargerVideo(zone, v, true);
        }
      });
    }

    if (partie === 'qcm') {
      const form = zone.querySelector('.formulaire-qcm');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const reponses = C().qcm.map((_, i) => {
          const c = form.querySelector(`input[name="q${i}"]:checked`);
          return c ? Number(c.value) : null;
        });
        const manque = reponses.indexOf(null);
        const p = form.querySelector('.message-ecart');
        if (manque >= 0) {
          p.textContent = `Il manque la réponse à la question ${manque + 1}.`;
          p.hidden = false;
          form.querySelectorAll('.question')[manque].scrollIntoView({ block: 'center' });
          return;
        }
        const r = L.noterQcm(d, C().qcm, reponses, form.qui.value);
        session.aEnregistrer(true, true);
        p.hidden = true;
        form.hidden = true;
        zone.querySelector('.resultats-qcm').innerHTML = correctionHtml(r.essai) + '<div class="accueil-actions"><button type="button" class="btn-secondaire recommencer-qcm">Recommencer le QCM</button></div>';
        zone.querySelector('.resultats-qcm').scrollIntoView({ block: 'start' });
        zone.querySelector('.recommencer-qcm').addEventListener('click', () => afficher(zone, session));
      });
    }

    if (partie === 'chaines') {
      const form = zone.querySelector('.formulaire-chaines');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const textes = {};
        for (const f of C().chaines) textes[f.id] = form[f.id].value;
        const n = L.changerChaines(d, textes, C().chaines);
        session.aEnregistrer(true, true);
        session.message(`Enregistré : ${n} fonction(s) sur 7 expliquées.`);
        zone.querySelector('#titre-chaines + .panneau-note').textContent = `${n} / 7 expliquées`;
      });
    }
  }

  A.ecranComprendre = { afficher };
})(this);
