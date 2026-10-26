// Rubriques Affiche, Style du mBot et Vidéos : dépôt des fichiers dans le dossier de l'écurie, listes de contrôle,
// aperçus (image, PDF, pièce 3D, vidéo), storyboard.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const L = A.livrables;
  const $ = (sel, racine) => (racine || document).querySelector(sel);
  const echapper = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const date = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + ' à ' + new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const mm = (x) => String(x).replace('.', ',');

  function ecartDe(form, t) {
    const p = form.querySelector('.message-ecart');
    p.textContent = t || '';
    p.hidden = !t;
  }

  function choisirFichier(accept) {
    return new Promise((ok) => {
      const entree = document.createElement('input');
      entree.type = 'file';
      entree.accept = accept;
      entree.addEventListener('change', () => ok((entree.files && entree.files[0]) || null));
      entree.addEventListener('cancel', () => ok(null));
      entree.click();
    });
  }

  // Séance où en est l'écurie (pour la date limite de l'affiche).
  function seanceActuelle(d) {
    const s = d.ecurie.seances[d.ecurie.seances.length - 1];
    return s ? s.numero : 0;
  }

  // ---------- Affiche ----------

  function afficherAffiche(zone, session) {
    const d = session.donnees;
    const r = A.reglagesLivrables.affiche;
    const a = L.affiche(d);
    const c = A.calendrierClasse.circuit(A.calendrier, d.equipe.classe);
    const reste = c.seanceAffiche - seanceActuelle(d);
    const derniere = a.versions[a.versions.length - 1];
    const coches = r.controle.filter((x) => a.controle[x]).length;
    zone.innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Défi affiche</p>
          <h1>L’affiche de l’écurie</h1>
          <p>Sur Canva, créez l’affiche qui présente votre écurie : les autres classes voteront pour leur préférée. Chaque personne qui vote pour vous devient un fan de l’écurie !</p>
        </div>
        <div class="encart-date ${reste <= 1 ? 'proche' : ''}">
          <span class="chiffre">Séance ${c.seanceAffiche}</span>
          <span>${reste > 1 ? `à rendre dans ${reste} séances` : reste === 1 ? 'à rendre à la prochaine séance' : reste === 0 ? 'à rendre aujourd’hui' : 'date dépassée : déposez la version finale'}</span>
        </div>
      </section>
      <div class="deux-colonnes">
        <section class="panneau" aria-labelledby="titre-controle">
          <div class="panneau-entete"><h2 id="titre-controle">Avant de la rendre</h2><span class="panneau-note">${coches} / ${r.controle.length}</span></div>
          <form class="liste-controle">
            ${r.controle.map((x, i) => `<label><input type="checkbox" data-controle="${i}"${a.controle[x] ? ' checked' : ''}> ${echapper(x)}</label>`).join('')}
          </form>
          <p class="aide">Exportez depuis Canva en PNG ou en PDF (format A3), puis déposez le fichier ici. Chaque dépôt est une nouvelle version : les anciennes restent.</p>
        </section>
        <section class="panneau" aria-labelledby="titre-versions">
          <div class="panneau-entete"><h2 id="titre-versions">Les versions</h2><span class="panneau-note">${a.versions.length ? a.versions.length + ' déposée(s)' : 'aucune'}</span></div>
          <div class="apercu-affiche">${derniere ? '<p class="aide">Chargement de l’aperçu…</p>' : '<p class="aide">Pas encore d’affiche déposée.</p>'}</div>
          <ul class="liste-versions">${a.versions.slice().reverse().map((v, i) => `<li><strong>Version ${a.versions.length - i}</strong> · ${date(v.date)} · <a href="#" data-ouvrir="${echapper(v.chemin)}">ouvrir</a></li>`).join('')}</ul>
          <form class="formulaire-affiche" novalidate>
            <div class="accueil-actions"><button type="button" class="btn-principal deposer-affiche">${A.icone('importer', { epaisseur: 2.2 })}Déposer ${a.versions.length ? 'une nouvelle version' : 'l’affiche'}</button></div>
            <p class="message-ecart" role="alert" hidden></p>
          </form>
        </section>
      </div>`;

    zone.querySelector('.liste-controle').addEventListener('change', (e) => {
      const i = e.target.dataset.controle;
      if (i === undefined) return;
      a.controle[r.controle[i]] = e.target.checked;
      session.aEnregistrer(false, true);
      zone.querySelector('#titre-controle + .panneau-note').textContent = `${r.controle.filter((x) => a.controle[x]).length} / ${r.controle.length}`;
    });
    zone.addEventListener('click', async (e) => {
      const o = e.target.closest('[data-ouvrir]');
      if (!o) return;
      e.preventDefault();
      const u = await A.medias.url(session, o.dataset.ouvrir) || URL.createObjectURL(await A.medias.lireFichier(session, o.dataset.ouvrir));
      open(u, '_blank', 'noopener');
    });
    if (derniere) {
      A.medias.url(session, derniere.chemin).then((u) => {
        const ap = zone.querySelector('.apercu-affiche');
        if (!ap) return;
        if (!u) ap.innerHTML = '<p class="aide">L’aperçu s’affiche quand le navigateur a le droit de lire le dossier de l’écurie : cliquez sur « ouvrir ».</p>';
        else ap.innerHTML = /\.pdf$/i.test(derniere.chemin) ? `<iframe src="${u}" title="Dernière version de l’affiche"></iframe>` : `<img src="${u}" alt="Dernière version de l’affiche">`;
      });
    }
    const form = zone.querySelector('.formulaire-affiche');
    form.querySelector('.deposer-affiche').addEventListener('click', async () => {
      const f = await choisirFichier('.png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf');
      if (!f) return;
      const c2 = L.cheminAffiche(d, f.name, r.formats);
      if (!c2.ok) return ecartDe(form, c2.raison);
      try {
        const chemin = await A.medias.ecrire(session, c2.chemin, f);
        if (!chemin) return;
        L.ajouterVersionAffiche(d, chemin);
        session.aEnregistrer(true, true);
        session.message('L’affiche est rangée dans le dossier de l’écurie.');
        A.paddock.naviguer('affiche');
      } catch (err) {
        ecartDe(form, err && err.message ? err.message : 'L’affiche n’a pas pu être enregistrée.');
      }
    });
  }

  // ---------- Style du mBot ----------

  function afficherStyle(zone, session) {
    const d = session.donnees;
    const r = A.reglagesLivrables.style;
    const s = L.style(d);
    zone.innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Style du mBot</p>
          <h1>Le mBot le plus stylé</h1>
          <p>Pièces imprimées en 3D (Tinkercad), carton, tissu… Le jour du tournoi, le jury classe les mBot du plus stylé au moins stylé, après un défilé de 30 secondes. Les mBot sont partagés : tout doit se monter et s’enlever vite.</p>
        </div>
      </section>
      <div class="deux-colonnes">
        <section class="panneau" aria-labelledby="titre-cahier">
          <div class="panneau-entete"><h2 id="titre-cahier">Le cahier des charges</h2></div>
          <form class="liste-controle">
            ${r.cahierDesCharges.map((x, i) => `<label><input type="checkbox" data-cahier="${i}"${s.cahier[x] ? ' checked' : ''}> ${echapper(x)}</label>`).join('')}
          </form>
          <p class="aide">${r.dimensionsMax ? `Pièce imprimée : au plus ${r.dimensionsMax.map(mm).join(' × ')} mm.` : 'Demandez au professeur la taille maximale d’une pièce imprimée.'}</p>
        </section>
        <section class="panneau" aria-labelledby="titre-description">
          <div class="panneau-entete"><h2 id="titre-description">Notre style</h2></div>
          <form class="formulaire-style" novalidate>
            <label class="champ">Ce que nous fabriquons, en quelles matières, comment ça se fixe<textarea name="description" rows="4" maxlength="1500">${echapper(s.description)}</textarea></label>
            <label class="champ">Le défilé de 30 secondes, seconde par seconde<textarea name="defile" rows="4" maxlength="1500" placeholder="0-5 s : le mBot avance, LED aux couleurs de l’écurie…">${echapper(s.defile)}</textarea></label>
            <div class="accueil-actions"><button type="submit" class="btn-principal">Enregistrer</button></div>
            <p class="message-ecart" role="alert" hidden></p>
          </form>
        </section>
      </div>
      <section class="panneau" aria-labelledby="titre-pieces">
        <div class="panneau-entete"><h2 id="titre-pieces">Les pièces 3D</h2><span class="panneau-note">Fichiers STL exportés de Tinkercad, en millimètres</span></div>
        <div class="grille-pieces">${s.pieces.map((p, i) => {
          const c = L.controlerDimensions(p.dims, r.dimensionsMax);
          const verdict = c.ok === null ? '' : c.ok ? '<span class="pastille-etat ton-ok">✓ imprimable</span>' : `<span class="pastille-etat ton-ambre">Trop grande : ${c.depasse.map(mm).join(', ')} mm</span>`;
          return `<figure class="carte-piece"><canvas class="vue-piece" data-piece="${i}"></canvas><figcaption><strong>${echapper(p.chemin.split('/').pop())}</strong><span>${p.dims.map(mm).join(' × ')} mm · ${p.triangles} triangles</span>${verdict}</figcaption></figure>`;
        }).join('') || '<p class="aide">Pas encore de pièce déposée.</p>'}</div>
        <form class="formulaire-piece" novalidate>
          <div class="accueil-actions"><button type="button" class="btn-principal deposer-stl">${A.icone('importer', { epaisseur: 2.2 })}Déposer un fichier STL</button></div>
          <p class="message-ecart" role="alert" hidden></p>
        </form>
      </section>
      <section class="panneau" aria-labelledby="titre-photos-style">
        <div class="panneau-entete"><h2 id="titre-photos-style">Photos du mBot habillé</h2><span class="panneau-note">Carton, tissu, essais de montage…</span></div>
        <div class="galerie-photos">${s.photos.map((c) => `<figure data-chemin="${echapper(c)}"><div class="vignette-attente">Photo</div><figcaption>${echapper(c.split('/').pop())}</figcaption></figure>`).join('') || '<p class="aide">Pas encore de photo.</p>'}</div>
        <form class="formulaire-photos-style" novalidate>
          <div class="accueil-actions">
            <button type="button" class="btn-secondaire photo-webcam">${A.icone('camera', { epaisseur: 2.2 })}Prendre avec la webcam</button>
            <button type="button" class="btn-secondaire photo-fichier">${A.icone('importer', { epaisseur: 2.2 })}Ajouter un fichier</button>
          </div>
          <p class="message-ecart" role="alert" hidden></p>
        </form>
      </section>`;

    zone.querySelector('.liste-controle').addEventListener('change', (e) => {
      const i = e.target.dataset.cahier;
      if (i === undefined) return;
      s.cahier[r.cahierDesCharges[i]] = e.target.checked;
      session.aEnregistrer(false, true);
    });
    const fStyle = zone.querySelector('.formulaire-style');
    fStyle.addEventListener('submit', (e) => {
      e.preventDefault();
      s.description = fStyle.description.value.trim().slice(0, 1500);
      s.defile = fStyle.defile.value.trim().slice(0, 1500);
      session.aEnregistrer(true, true);
      session.message('Le style de l’écurie est enregistré.');
    });

    // Aperçus 3D (lecture du fichier si le droit de lecture est déjà donné).
    for (const toile of zone.querySelectorAll('.vue-piece')) {
      const p = s.pieces[toile.dataset.piece];
      A.medias.url(session, p.chemin).then(async (u) => {
        if (!u) return;
        const buffer = await (await fetch(u)).arrayBuffer();
        if (toile.isConnected) A.vueStl(toile, buffer);
      });
    }
    const fPiece = zone.querySelector('.formulaire-piece');
    fPiece.querySelector('.deposer-stl').addEventListener('click', async () => {
      const f = await choisirFichier('.stl');
      if (!f) return;
      if (L.extension(f.name) !== 'stl') return ecartDe(fPiece, 'Choisis un fichier .stl exporté de Tinkercad.');
      const analyse = L.analyserStl(await f.arrayBuffer());
      if (!analyse) return ecartDe(fPiece, 'Ce fichier STL est illisible : exporte-le à nouveau depuis Tinkercad.');
      const nom = A.simplifierNom(f.name.replace(/\.stl$/i, '')).replace(/[^a-z0-9_-]+/gi, '-') || 'piece';
      let chemin = `style/${nom}.stl`;
      for (let i = 2; s.pieces.some((p) => p.chemin === chemin); i++) chemin = `style/${nom}-${i}.stl`;
      try {
        const ok = await A.medias.ecrire(session, chemin, f);
        if (!ok) return;
        L.ajouterPiece(d, chemin, analyse);
        session.aEnregistrer(true, true);
        A.paddock.naviguer('style');
      } catch (err) {
        ecartDe(fPiece, err && err.message ? err.message : 'La pièce n’a pas pu être enregistrée.');
      }
    });

    // Photos
    const fPhotos = zone.querySelector('.formulaire-photos-style');
    for (const fig of zone.querySelectorAll('.galerie-photos figure')) {
      A.medias.url(session, fig.dataset.chemin).then((u) => {
        const v = fig.querySelector('.vignette-attente');
        if (u) v.outerHTML = `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="Photo du mBot habillé"></a>`;
        else v.textContent = 'Photo dans le dossier de l’écurie';
      });
    }
    async function ajouterPhoto(source) {
      const blob = await A.photoEditeur.ouvrir({ source, titre: 'Photo du mBot habillé' });
      if (!blob) return;
      let i = 1;
      while (s.photos.includes(`style/photo-${i}.jpg`)) i++;
      try {
        const chemin = await A.medias.ecrire(session, `style/photo-${i}.jpg`, blob);
        if (!chemin) return;
        s.photos.push(chemin);
        session.aEnregistrer(true, true);
        A.paddock.naviguer('style');
      } catch (err) {
        ecartDe(fPhotos, err && err.message ? err.message : 'La photo n’a pas pu être enregistrée.');
      }
    }
    fPhotos.querySelector('.photo-webcam').addEventListener('click', () => ajouterPhoto('webcam'));
    fPhotos.querySelector('.photo-fichier').addEventListener('click', () => ajouterPhoto('fichier'));
  }

  // ---------- Vidéos ----------

  function afficherVideos(zone, session) {
    const d = session.donnees;
    const r = A.reglagesLivrables.videos;
    zone.innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Vidéos</p>
          <h1>Promotion et reportage</h1>
          <p>Avant de filmer, écrivez le storyboard : ce qu’on voit et ce qu’on entend dans chaque plan, et combien de temps il dure. Ensuite seulement, on filme et on monte.</p>
        </div>
      </section>
      ${r.sortes.map((x) => {
        const v = L.videos(d, x.id);
        const cases = Array.from({ length: Math.max(r.casesStoryboard, v.storyboard.length) }, (_, i) => v.storyboard[i] || { image: '', son: '', duree: null });
        return `
      <section class="panneau" aria-labelledby="titre-${x.id}">
        <div class="panneau-entete"><h2 id="titre-${x.id}">${x.titre}</h2><span class="panneau-note">Durée conseillée : ${x.dureeConseillee}</span></div>
        <p class="aide-bloc">${echapper(x.but)}</p>
        <form class="formulaire-storyboard" data-sorte="${x.id}" novalidate>
          <div class="tableau-defilant">
            <table class="tableau-taches">
              <thead><tr><th scope="col">Plan</th><th scope="col">Ce qu’on voit</th><th scope="col">Ce qu’on entend (paroles, musique, texte)</th><th scope="col">Durée (s)</th></tr></thead>
              <tbody>${cases.map((c, i) => `<tr><td class="chiffre">${i + 1}</td><td><input class="sb-image" maxlength="300" value="${echapper(c.image)}" aria-label="Plan ${i + 1} : ce qu’on voit"></td><td><input class="sb-son" maxlength="300" value="${echapper(c.son)}" aria-label="Plan ${i + 1} : ce qu’on entend"></td><td><input class="sb-duree" type="number" min="1" max="600" value="${c.duree || ''}" aria-label="Plan ${i + 1} : durée en secondes"></td></tr>`).join('')}</tbody>
            </table>
          </div>
          <p class="aide">Durée totale prévue : <strong class="chiffre">${L.dureeStoryboard(d, x.id)} s</strong></p>
          <div class="accueil-actions">
            <button type="submit" class="btn-principal">Enregistrer le storyboard</button>
            <button type="button" class="btn-secondaire deposer-video">${A.icone('importer', { epaisseur: 2.2 })}${v.fichier ? 'Remplacer la vidéo' : 'Déposer la vidéo finale'}</button>
          </div>
          <div class="apercu-video">${v.fichier ? `<p class="aide">Vidéo déposée le ${date(v.date)} : ${echapper(v.fichier)}</p>` : ''}</div>
          <p class="message-ecart" role="alert" hidden></p>
        </form>
      </section>`;
      }).join('')}`;

    for (const form of zone.querySelectorAll('.formulaire-storyboard')) {
      const sorte = form.dataset.sorte;
      const v = L.videos(d, sorte);
      if (v.fichier) {
        A.medias.url(session, v.fichier).then((u) => {
          if (u) form.querySelector('.apercu-video').insertAdjacentHTML('beforeend', `<video src="${u}" controls preload="metadata"></video>`);
        });
      }
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const cases = [...form.querySelectorAll('tbody tr')].map((tr) => ({ image: $('.sb-image', tr).value, son: $('.sb-son', tr).value, duree: $('.sb-duree', tr).value }))
          .filter((c, i, toutes) => c.image || c.son || c.duree || toutes.slice(i + 1).some((x) => x.image || x.son || x.duree));
        L.changerStoryboard(d, sorte, cases);
        session.aEnregistrer(true, true);
        session.message('Storyboard enregistré.');
        A.paddock.naviguer('videos');
      });
      form.querySelector('.deposer-video').addEventListener('click', async () => {
        const f = await choisirFichier(r.formats.map((x) => '.' + x).join(',') + ',video/*');
        if (!f) return;
        const ext = L.extension(f.name);
        if (!r.formats.includes(ext)) return ecartDe(form, 'Choisis une vidéo MP4 (ou WEBM, MOV).');
        try {
          ecartDe(form, '');
          session.message('Copie de la vidéo dans le dossier de l’écurie…', 8000);
          const chemin = await A.medias.ecrire(session, `videos/${sorte}.${ext}`, f);
          if (!chemin) return;
          v.fichier = chemin;
          v.date = A.maintenant();
          session.aEnregistrer(true, true);
          session.message('La vidéo est rangée dans le dossier de l’écurie.');
          A.paddock.naviguer('videos');
        } catch (err) {
          ecartDe(form, err && err.message ? err.message : 'La vidéo n’a pas pu être enregistrée.');
        }
      });
    }
  }

  A.ecranLivrables = { afficherAffiche, afficherStyle, afficherVideos };
})(this);
