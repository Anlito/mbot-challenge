// Rubrique « Écurie » : nom, couleur, logo et rôles des équipiers (un chef de projet, un reporter, cumul possible).
(function (global) {
  'use strict';

  const A = global.Atelier;
  const E = A.ecurie;
  const echapper = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  const AIDE_ROLES = {
    chef: 'Lance chaque séance, fait le point de fin, fait le lien avec le professeur.',
    reporter: 'Écrit le rapport de chaque séance, avec des photos.',
    programmeur: 'Programme les défis avec Labo Blocs.',
    designer: 'Affiche, style du mBot, pièces 3D.',
    essais: 'Chronomètre les essais, note les réglages et les résultats.',
    pilote: 'Pilote le mBot au clavier : labyrinthe et Récolte.',
  };

  function afficher(zone, session) {
    const d = session.donnees;
    const couleur = d.ecurie.couleur || E.COULEURS[0].valeur;
    zone.innerHTML = `
      <section class="panneau" aria-labelledby="titre-identite">
        <div class="panneau-entete"><h2 id="titre-identite">L’identité de l’écurie</h2></div>
        <form class="formulaire-identite" novalidate>
          <div class="identite-grille">
            <label class="champ">Nom de l’écurie
              <input name="nom" maxlength="24" autocomplete="off" value="${echapper(d.ecurie.nom)}" placeholder="Ex. : Les Éclairs">
            </label>
            <fieldset class="choix-couleurs">
              <legend>Couleur de l’écurie</legend>
              ${E.COULEURS.map((c) => `
                <label class="pastille-couleur" title="${c.nom}">
                  <input type="radio" name="couleur" value="${c.valeur}"${c.valeur === couleur ? ' checked' : ''}>
                  <span style="background:${c.valeur}" aria-hidden="true"></span><span class="sr">${c.nom}</span>
                </label>`).join('')}
            </fieldset>
            <div class="logo-zone">
              <span class="champ-titre">Logo</span>
              <div class="logo-apercu">${A.paddock.pastilleHtml(d, 'grande')}</div>
              <label class="btn-secondaire">${A.icone('image', { epaisseur: 2.2 })}Choisir une image…<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden></label>
              <p class="aide">Fait sur Canva, par exemple, puis exporté en PNG.</p>
            </div>
          </div>
          <p class="message-ecart" role="alert" hidden></p>
          <div class="accueil-actions"><button type="submit" class="btn-principal">Enregistrer l’identité</button></div>
        </form>
      </section>

      <section class="panneau" aria-labelledby="titre-roles">
        <div class="panneau-entete">
          <h2 id="titre-roles">Les rôles</h2>
          <span class="panneau-note">Un chef de projet et un reporter, jamais la même personne. Les autres rôles se cumulent et peuvent changer en cours de projet.</span>
        </div>
        <form class="formulaire-roles" novalidate>
          <div class="tableau-defilant">
            <table class="tableau-roles">
              <thead><tr><th scope="col">Rôle</th>${d.equipe.eleves.map((p) => `<th scope="col">${echapper(p)}</th>`).join('')}</tr></thead>
              <tbody>
                ${A.ROLES.map((r) => `
                  <tr>
                    <th scope="row"><strong>${r.nom}</strong><span class="aide">${AIDE_ROLES[r.id]}</span></th>
                    ${d.equipe.eleves.map((p) => `<td><label class="case-role"><input type="checkbox" data-prenom="${echapper(p)}" data-role="${r.id}"${E.aLeRole(d, p, r.id) ? ' checked' : ''}><span class="sr">${echapper(p)} : ${r.nom}</span></label></td>`).join('')}
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
          <p class="message-ecart" role="alert" hidden></p>
          <div class="accueil-actions"><button type="submit" class="btn-principal">Enregistrer les rôles</button></div>
        </form>
      </section>`;

    const ecart = (form, texte) => {
      const p = form.querySelector('.message-ecart');
      p.textContent = texte || '';
      p.hidden = !texte;
    };

    const fIdentite = zone.querySelector('.formulaire-identite');
    fIdentite.addEventListener('submit', (e) => {
      e.preventDefault();
      const r = E.changerIdentite(d, { nom: fIdentite.nom.value, couleur: fIdentite.couleur.value });
      ecart(fIdentite, r.ok ? '' : r.raison);
      if (!r.ok) return;
      session.aEnregistrer(true, true);
      A.paddock.majBandeau();
      zone.querySelector('.logo-apercu').innerHTML = A.paddock.pastilleHtml(d, 'grande');
      session.message('L’identité de l’écurie est enregistrée.');
    });
    // Couleur : aperçu tout de suite.
    fIdentite.addEventListener('change', (e) => {
      if (e.target.name === 'couleur') zone.querySelector('.logo-apercu').style.setProperty('--ecurie', e.target.value);
    });
    fIdentite.querySelector('input[type=file]').addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const blob = f.type === 'image/svg+xml' ? f : await A.medias.reduireImage(f, 512);
        const nom = f.type === 'image/svg+xml' ? 'logo.svg' : 'logo.png';
        const chemin = await A.medias.ecrire(session, nom, blob);
        if (!chemin) return;
        d.ecurie.logo = chemin;
        session.aEnregistrer(true, true);
        ecart(fIdentite, '');
        await A.paddock.majBandeau();
        zone.querySelector('.logo-apercu').innerHTML = await A.paddock.pastilleHtmlAvecLogo(d, 'grande');
        session.message('Le logo est rangé dans le dossier de l’écurie.');
      } catch (err) {
        ecart(fIdentite, err && err.message && /écurie|navigateur/.test(err.message) ? err.message : 'Le logo n’a pas pu être enregistré. Essaie avec une image PNG ou JPG.');
      }
    });
    A.paddock.pastilleHtmlAvecLogo(d, 'grande').then((html) => {
      const ap = zone.querySelector('.logo-apercu');
      if (ap) ap.innerHTML = html;
    });

    const fRoles = zone.querySelector('.formulaire-roles');
    fRoles.addEventListener('submit', (e) => {
      e.preventDefault();
      const roles = {};
      for (const c of fRoles.querySelectorAll('input[type=checkbox]:checked')) (roles[c.dataset.prenom] = roles[c.dataset.prenom] || []).push(c.dataset.role);
      const r = E.changerRoles(d, roles);
      ecart(fRoles, r.ok ? '' : r.raison);
      if (!r.ok) return;
      session.aEnregistrer(true, true);
      session.message('Les rôles sont enregistrés.');
    });
  }

  A.ecranEcurie = { afficher };
})(this);
