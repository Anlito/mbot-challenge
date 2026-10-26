// Séance : point de départ du chef de projet (tâches, qui, temps prévu), point de fin (fait, reste, bloquant) et
// rapport du reporter (texte guidé, photos floutées). Le chef de projet montre ensuite cet écran au professeur.
(function (global) {
  'use strict';

  const A = global.Atelier;
  const L = A.livrables;
  const echapper = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const heure = (iso) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const jour = (iso) => new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  function optionsQui(d, choisi) {
    return `<option value="">Qui ?</option><option value="tous"${choisi === 'tous' ? ' selected' : ''}>Toute l’écurie</option>` +
      d.equipe.eleves.map((p) => `<option${p === choisi ? ' selected' : ''}>${echapper(p)}</option>`).join('');
  }
  function optionsLivrable(choisi) {
    return '<option value="">Pour quoi ?</option>' + A.reglagesLivrables.seance.livrables.map((l) => `<option${l === choisi ? ' selected' : ''}>${echapper(l)}</option>`).join('');
  }
  function ligneTache(d, t) {
    return `
      <tr class="ligne-tache">
        <td><input class="tache-texte" maxlength="200" value="${echapper(t.texte)}" aria-label="Tâche" placeholder="Ex. : finir le virage serré du défi 1"></td>
        <td><select class="tache-qui" aria-label="Qui s’en charge">${optionsQui(d, t.qui)}</select></td>
        <td><input class="tache-minutes" type="number" min="5" max="120" step="5" value="${t.minutes || ''}" aria-label="Temps prévu en minutes" placeholder="min"></td>
        <td><select class="tache-livrable" aria-label="Pour quoi">${optionsLivrable(t.livrable)}</select></td>
        <td><button type="button" class="btn-lien tache-retirer" aria-label="Retirer cette tâche">Retirer</button></td>
      </tr>`;
  }

  function lireTaches(form) {
    return [...form.querySelectorAll('.ligne-tache')].map((l) => ({
      texte: l.querySelector('.tache-texte').value,
      qui: l.querySelector('.tache-qui').value,
      minutes: l.querySelector('.tache-minutes').value,
      livrable: l.querySelector('.tache-livrable').value,
    }));
  }

  // ---------- Point de départ ----------

  function departHtml(d, s) {
    const reste = L.resteDeLaFois(d);
    const taches = s && s.depart ? s.depart.taches : (reste ? reste.taches.map((t) => Object.assign({}, t, { id: null, fait: null })) : []);
    const lignes = (taches.length ? taches : d.equipe.eleves.map((p) => ({ texte: '', qui: p }))).map((t) => ligneTache(d, t)).join('');
    const numero = s ? s.numero : L.prochainNumero(d);
    return `
      <section class="panneau" aria-labelledby="titre-depart">
        <div class="panneau-entete">
          <h2 id="titre-depart">Point de départ</h2>
        </div>
        <p class="aide-bloc">Toute l’écurie ensemble : listez ce qu’il reste à faire, répartissez-le pour que chacun avance en parallèle, estimez le temps.</p>
        ${reste && !(s && s.depart) ? `<div class="encart-reprise"><strong>Repris de la séance ${reste.numero} :</strong> ${echapper(reste.reste || 'rien de noté')}${reste.taches.length ? ` · ${reste.taches.length} tâche(s) pas finie(s), déjà dans la liste.` : ''}</div>` : ''}
        <form class="formulaire-depart" novalidate>
          <label class="champ champ-numero">Séance n°<input name="numero" type="number" min="1" max="20" value="${numero}"></label>
          <div class="tableau-defilant">
            <table class="tableau-taches">
              <thead><tr><th scope="col">Tâche</th><th scope="col">Qui</th><th scope="col">Temps prévu</th><th scope="col">Pour</th><th scope="col"><span class="sr">Retirer</span></th></tr></thead>
              <tbody>${lignes}</tbody>
            </table>
          </div>
          <div class="accueil-actions">
            <button type="button" class="btn-secondaire tache-ajouter">+ Ajouter une tâche</button>
            <button type="submit" class="btn-principal">${s && s.depart ? 'Mettre à jour le plan' : 'Lancer la séance'}</button>
          </div>
          <p class="message-ecart" role="alert" hidden></p>
        </form>
      </section>`;
  }

  // ---------- Point de fin ----------

  function finHtml(d, s) {
    return `
      <section class="panneau" aria-labelledby="titre-fin">
        <div class="panneau-entete">
          <h2 id="titre-fin">Point de fin</h2>
          <span class="panneau-note">Séance ${s.numero} lancée à ${heure(s.depart.date)}. Ensuite, le chef de projet montre cet écran au professeur.</span>
        </div>
        <form class="formulaire-fin" novalidate>
          <ul class="liste-fin">
            ${s.depart.taches.map((t) => `
              <li>
                <div><strong>${echapper(t.texte)}</strong><span class="aide">${echapper(t.qui === 'tous' ? 'Toute l’écurie' : t.qui)}${t.minutes ? ' · ' + t.minutes + ' min prévues' : ''}${t.livrable ? ' · ' + echapper(t.livrable) : ''}</span></div>
                <fieldset class="choix-fait"><legend class="sr">${echapper(t.texte)}</legend>
                  <label><input type="radio" name="fait-${t.id}" value="oui"${t.fait === true ? ' checked' : ''}> ✓ Fait</label>
                  <label><input type="radio" name="fait-${t.id}" value="non"${t.fait === false ? ' checked' : ''}> ○ Pas encore</label>
                </fieldset>
              </li>`).join('')}
          </ul>
          <label class="champ">Ce qu’il reste à faire la prochaine fois<textarea name="reste" rows="2" maxlength="600"></textarea></label>
          <label class="champ">Ce qui bloque (si quelque chose bloque)<textarea name="bloquant" rows="2" maxlength="600" placeholder="Ex. : le capteur droit voit le carrelage comme du noir"></textarea></label>
          <div class="accueil-actions"><button type="submit" class="btn-principal">Faire le point de fin</button></div>
          <p class="message-ecart" role="alert" hidden></p>
        </form>
      </section>`;
  }

  // ---------- Rapport du reporter ----------

  function rapportHtml(d, numero) {
    const r = L.rapportDe(d, numero);
    const aide = A.reglagesLivrables.seance.aideRapport;
    return `
      <section class="panneau rapport" aria-labelledby="titre-rapport">
        <div class="panneau-entete">
          <h2 id="titre-rapport">Le rapport de la séance ${numero}</h2>
          <span class="panneau-note">${r.remisLe ? '✓ remis à ' + heure(r.remisLe) : '○ pas encore remis'}</span>
        </div>
        <form class="formulaire-rapport" novalidate>
          <label class="champ">Ce que l’écurie a fait aujourd’hui<textarea name="texte" rows="6" maxlength="4000">${echapper(r.texte)}</textarea></label>
          <p class="aide">Pour vous aider : ${aide.map(echapper).join(' · ')}</p>
          <div class="champ-titre">Photos et captures (${r.photos.length} / ${A.reglagesLivrables.seance.photosMax})</div>
          <div class="galerie-photos">${r.photos.map((c) => `<figure data-chemin="${echapper(c)}"><div class="vignette-attente">Photo</div><figcaption>${echapper(c.split('/').pop())}</figcaption></figure>`).join('') || '<p class="aide">Pas encore de photo.</p>'}</div>
          <div class="accueil-actions">
            <button type="button" class="btn-secondaire photo-webcam"${r.photos.length >= A.reglagesLivrables.seance.photosMax ? ' disabled' : ''}>${A.icone('camera', { epaisseur: 2.2 })}Prendre avec la webcam</button>
            <button type="button" class="btn-secondaire photo-fichier"${r.photos.length >= A.reglagesLivrables.seance.photosMax ? ' disabled' : ''}>${A.icone('importer', { epaisseur: 2.2 })}Ajouter un fichier</button>
          </div>
          <p class="aide">Photo prise au téléphone : envoie-la-toi par e-mail, ouvre le message sur ce poste, enregistre la pièce jointe, puis « Ajouter un fichier ». Les visages se floutent avant l’enregistrement.</p>
          <div class="accueil-actions"><button type="submit" class="btn-principal">${r.remisLe ? 'Mettre à jour le rapport' : 'Remettre le rapport'}</button></div>
          <p class="message-ecart" role="alert" hidden></p>
        </form>
      </section>`;
  }

  function historiqueHtml(d) {
    const fermees = d.ecurie.seances.filter((s) => s.fin);
    if (!fermees.length) return '';
    return `
      <section class="panneau" aria-labelledby="titre-historique">
        <div class="panneau-entete"><h2 id="titre-historique">Les séances précédentes</h2></div>
        <div class="tableau-defilant">
          <table class="tableau-essais">
            <thead><tr><th scope="col">Séance</th><th scope="col">Tâches faites</th><th scope="col">Reste à faire</th><th scope="col">Bloquant</th><th scope="col">Rapport</th></tr></thead>
            <tbody>${fermees.slice().reverse().map((s) => {
              const faites = s.depart ? s.depart.taches.filter((t) => t.fait).length : 0;
              const total = s.depart ? s.depart.taches.length : 0;
              const r = d.ecurie.rapports.find((x) => x.seance === s.numero);
              return `<tr><td class="chiffre">${s.numero}</td><td class="chiffre">${faites} / ${total}</td><td>${echapper(s.fin.reste || '—')}</td><td>${echapper(s.fin.bloquant || '—')}</td><td>${r && r.remisLe ? '✓ remis' : '○ pas remis'}</td></tr>`;
            }).join('')}</tbody>
          </table>
        </div>
      </section>`;
  }

  // ---------- Qui fait quoi ----------

  // Frise de la séance : chaque étape, qui la fait, où on en est (symbole et mot, jamais la couleur seule).
  function friseHtml(d, s, rapport) {
    const chef = A.ecurie.avecRole(d, 'chef') || 'le chef de projet';
    const reporter = A.ecurie.avecRole(d, 'reporter') || 'le reporter';
    const lancee = !!(s && s.depart);
    const finie = !!(s && s.fin);
    const etapes = [
      { titre: 'Point de départ', qui: `${chef} · chef de projet`, fait: lancee || finie },
      { titre: 'Au travail', qui: 'Toute l’écurie', fait: finie },
      { titre: 'Point de fin', qui: `${chef} · chef de projet`, fait: finie },
      { titre: 'Rapport', qui: `${reporter} · reporter`, fait: !!(rapport && rapport.remisLe) },
      { titre: 'Point avec le professeur', qui: `${chef} · chef de projet`, fait: false },
    ];
    const courante = etapes.findIndex((e) => !e.fait);
    return `<ol class="frise-seance" aria-label="Les étapes de la séance">${etapes.map((e, i) => `
      <li class="${e.fait ? 'faite' : i === courante ? 'courante' : ''}"${i === courante ? ' aria-current="step"' : ''}>
        <span class="frise-num">${e.fait ? '✓' : i + 1}</span>
        <span><strong>${e.titre}</strong><span class="frise-qui">${echapper(e.qui)}</span>${i === courante ? '<span class="frise-etat">← maintenant</span>' : ''}</span>
      </li>`).join('')}</ol>`;
  }

  // Bandeau d'une zone : à qui elle revient.
  function bandeauRole(d, role, ce) {
    const nom = A.ecurie.avecRole(d, role);
    const titre = role === 'chef' ? 'Chef de projet' : 'Reporter';
    return `<div class="bandeau-role">
      ${A.icone(role === 'chef' ? 'drapeau' : 'crayon', { epaisseur: 2.2 })}
      <div><span class="bandeau-role-titre">Côté ${titre.toLowerCase()}</span>
      <strong>À remplir par ${nom ? echapper(nom) : `le ${titre.toLowerCase()} (à choisir dans la rubrique Écurie)`}</strong>
      <span class="bandeau-role-ce">${ce}</span></div></div>`;
  }

  // ---------- Écran ----------

  function afficher(zone, session) {
    const d = session.donnees;
    const s = L.seanceEnCours(d);
    const enCours = s && s.depart;
    const derniere = d.ecurie.seances[d.ecurie.seances.length - 1];
    const numeroRapport = enCours ? s.numero : derniere ? derniere.numero : null;
    zone.innerHTML = `
      <section class="panneau briefing">
        <div>
          <p class="surtitre">Séance du jour</p>
          <h1>${enCours ? `Séance ${s.numero} · au travail` : 'Lancer la séance'}</h1>
          <p>${enCours ? `Lancée le ${jour(s.depart.date)} à ${heure(s.depart.date)}.` : 'Chaque séance suit les mêmes étapes. Chacun regarde la sienne.'}</p>
        </div>
        ${friseHtml(d, enCours ? s : derniere && derniere.fin ? derniere : null, numeroRapport ? L.rapportDe(d, numeroRapport) : null)}
      </section>
      <div class="zone-role zone-chef">
        ${bandeauRole(d, 'chef', enCours ? 'En fin de séance : cocher ce qui est fait, noter ce qui reste, puis aller voir le professeur avec cet écran.' : 'En début de séance, avec toute l’écurie : lister les tâches et les répartir.')}
        ${enCours ? finHtml(d, s) + `<details class="repli-plan"><summary>Voir ou modifier le plan de la séance ${s.numero}</summary>${departHtml(d, s)}</details>` : departHtml(d, s)}
      </div>
      ${numeroRapport ? `<div class="zone-role zone-reporter">${bandeauRole(d, 'reporter', 'En fin de séance : raconter ce que l’écurie a fait, avec des photos.')}${rapportHtml(d, numeroRapport)}</div>` : ''}
      ${historiqueHtml(d)}`;

    const ecart = (form, t) => {
      const p = form.querySelector('.message-ecart');
      p.textContent = t || '';
      p.hidden = !t;
    };

    // Point de départ
    const fDepart = zone.querySelector('.formulaire-depart');
    fDepart.querySelector('.tache-ajouter').addEventListener('click', () => {
      fDepart.querySelector('tbody').insertAdjacentHTML('beforeend', ligneTache(d, { texte: '', qui: '' }));
      fDepart.querySelector('tbody tr:last-child .tache-texte').focus();
    });
    fDepart.addEventListener('click', (e) => {
      const b = e.target.closest('.tache-retirer');
      if (b && fDepart.querySelectorAll('.ligne-tache').length > 1) b.closest('tr').remove();
    });
    fDepart.addEventListener('submit', (e) => {
      e.preventDefault();
      const avant = s && s.depart ? s.depart.taches : [];
      const taches = lireTaches(fDepart).map((t, i) => Object.assign(t, { id: avant[i] && avant[i].texte === t.texte.trim() ? avant[i].id : undefined }));
      const r = L.pointDeDepart(d, fDepart.numero.value, taches);
      ecart(fDepart, r.ok ? '' : r.raison);
      if (!r.ok) return;
      session.aEnregistrer(true, true);
      session.message(`Séance ${r.seance.numero} lancée : bon travail !`);
      A.paddock.naviguer('seance');
    });

    // Point de fin
    const fFin = zone.querySelector('.formulaire-fin');
    if (fFin) {
      fFin.addEventListener('submit', (e) => {
        e.preventDefault();
        const faits = {};
        for (const t of s.depart.taches) {
          const v = (fFin.querySelector(`input[name="fait-${t.id}"]:checked`) || {}).value;
          if (v) faits[t.id] = v === 'oui';
        }
        const r = L.pointDeFin(d, faits, fFin.reste.value, fFin.bloquant.value);
        ecart(fFin, r.ok ? '' : r.raison);
        if (!r.ok) return;
        session.aEnregistrer(true, true);
        session.message('Point de fin noté. Le chef de projet va voir le professeur avec cet écran.', 5000);
        A.paddock.naviguer('seance');
        const rapport = document.querySelector('.rapport');
        if (rapport) rapport.scrollIntoView({ block: 'start' });
      });
    }

    // Rapport
    const fRapport = zone.querySelector('.formulaire-rapport');
    if (!fRapport) return;
    const r = L.rapportDe(d, numeroRapport);
    for (const fig of fRapport.querySelectorAll('.galerie-photos figure')) {
      A.medias.url(session, fig.dataset.chemin).then((u) => {
        if (u) fig.querySelector('.vignette-attente').outerHTML = `<a href="${u}" target="_blank" rel="noopener"><img src="${u}" alt="Photo du rapport de la séance ${numeroRapport}"></a>`;
        else fig.querySelector('.vignette-attente').textContent = 'Photo dans le dossier de l’écurie';
      });
    }
    async function ajouterPhoto(source) {
      r.texte = fRapport.texte.value; // garder ce qui est écrit
      const blob = await A.photoEditeur.ouvrir({ source, titre: `Photo du rapport · séance ${numeroRapport}` });
      if (!blob) return;
      try {
        const chemin = await A.medias.ecrire(session, L.cheminPhoto(d, numeroRapport, 'jpg'), blob);
        if (!chemin) return;
        r.photos.push(chemin);
        session.aEnregistrer(true, true);
        A.paddock.naviguer('seance');
        const rapport = document.querySelector('.rapport');
        if (rapport) rapport.scrollIntoView({ block: 'start' });
      } catch (err) {
        ecart(fRapport, err && err.message ? err.message : 'La photo n’a pas pu être enregistrée.');
      }
    }
    fRapport.querySelector('.photo-webcam').addEventListener('click', () => ajouterPhoto('webcam'));
    fRapport.querySelector('.photo-fichier').addEventListener('click', () => ajouterPhoto('fichier'));
    fRapport.addEventListener('submit', (e) => {
      e.preventDefault();
      const res = L.remettreRapport(d, numeroRapport, fRapport.texte.value, A.reglagesLivrables.seance.photosMax);
      ecart(fRapport, res.ok ? '' : res.raison);
      if (!res.ok) return;
      session.aEnregistrer(true, true);
      session.message('Rapport remis au professeur.');
      A.paddock.naviguer('seance');
    });
  }

  A.ecranSeance = { afficher };
})(this);
