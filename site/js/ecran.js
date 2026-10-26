// Écran projeté du tournoi : il affiche ce que la régie lui envoie (BroadcastChannel, ou la copie gardée dans le
// navigateur) : accueil, passage en direct avec le chrono, résultats d'une épreuve, classement général, podium.
(function (global) {
  'use strict';

  // « mBot sorti » reste « mBot sorti » : seule la première lettre passe en minuscule.
  const minuscule = (s) => String(s).charAt(0).toLowerCase() + String(s).slice(1);

  const CANAL = 'mbot-challenge-ecran';
  const zone = document.querySelector('.ecran');
  const echapper = (s) => String(s === undefined || s === null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const chrono = (ms) => {
    const s = Math.max(0, ms) / 1000;
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:${(s - m * 60).toFixed(1).padStart(4, '0')}`;
  };
  const theme = (couleur) => global.Atelier.ecurie.theme(couleur);
  const pastille = (x, taille) => {
    const t = theme(x.couleur);
    return `<span class="pastille ${taille || ''}" style="--fond:${t.ecurieFond};--texte:${t.ecurieTexte}" aria-hidden="true">${echapper((String(x.nom).replace(/^(les?|la)\s+/i, '')[0] || '?').toUpperCase())}</span>`;
  };

  let etat = { mode: 'attente' };
  let decalage = 0; // horloge de la régie − horloge de l'écran
  let recu = 0;
  let signature = '';

  function recevoir(e) {
    if (!e || typeof e !== 'object') return;
    etat = e;
    recu = Date.now();
    if (e.maintenant) decalage = e.maintenant - Date.now();
    const s = JSON.stringify(Object.assign({}, e, { maintenant: 0, envoyeLe: 0, match: e.match ? Object.assign({}, e.match, { restant: 0 }) : undefined }));
    if (s !== signature) {
      signature = s;
      dessiner();
    }
  }

  function dessiner() {
    const e = etat;
    document.body.dataset.mode = e.mode;
    if (e.mode === 'attente') {
      zone.innerHTML = '<div class="titre-geant"><img src="img/logo.svg" alt="" width="120" height="120"><h1>mBot Challenge</h1><p>En attente de la régie…</p></div>';
    } else if (e.mode === 'accueil' || (e.mode === 'passage' && !e.postes && !e.match)) {
      zone.innerHTML = `<div class="titre-geant"><img src="img/logo.svg" alt="" width="140" height="140"><h1>mBot Challenge</h1><p>Le grand tournoi · ${echapper(e.classe)}</p></div>`;
    } else if (e.mode === 'suspense') {
      zone.innerHTML = `<div class="titre-geant"><h1>Suspense…</h1><p>Le classement général sera dévoilé à la fin du tournoi !</p></div>`;
    } else if (e.mode === 'passage' && e.match) {
      const m = e.match;
      zone.innerHTML = `
        <h1 class="titre-epreuve">${echapper(e.epreuve.titre)}</h1>
        <div class="chrono-geant" data-compte-match>${chrono(m.restant)}</div>
        <div class="duel">
          ${[[m.a, m.scoreA], [m.b, m.scoreB]].map(([x, s]) => `<div class="camp" style="--ecurie:${theme(x.couleur).ecurieFond}">${pastille(x, 'grande')}<strong>${echapper(x.nom)}</strong><span class="score">${s}</span><span class="unite">balle${s > 1 ? 's' : ''}</span></div>`).join('<div class="contre">contre</div>')}
        </div>`;
    } else if (e.mode === 'passage') {
      zone.innerHTML = `
        <h1 class="titre-epreuve">${echapper(e.epreuve.titre)}</h1>
        <div class="postes postes-${e.postes.length}">${e.postes.map((p) => `
          <section class="poste" style="--ecurie:${theme(p.ecurie.couleur).ecurieFond}">
            <div class="poste-ecurie">${pastille(p.ecurie, 'grande')}<strong>${echapper(p.ecurie.nom)}</strong></div>
            <div class="chrono-geant" data-poste="${p.id}">00:00.0</div>
            <div class="poste-infos">
              ${p.malus ? `<span class="malus">+${p.malus} ${echapper(minuscule(e.epreuve.malus.libelle))} · +${p.malus * e.epreuve.malus.secondes} s</span>` : ''}
              ${e.epreuve.sorte === 'obstacles' ? `<span>Objets sortis : <strong>${p.objets} / ${e.epreuve.objets}</strong></span>` : ''}
              ${p.abandon ? '<span class="malus">Abandon</span>' : p.fin ? '<span class="arrive">Arrivée !</span>' : p.debut ? '' : '<span>Prêt au départ</span>'}
            </div>
          </section>`).join('')}</div>`;
    } else if (e.mode === 'epreuve') {
      zone.innerHTML = `<h1 class="titre-epreuve">${echapper(e.epreuve.titre)} · résultats</h1>
        <ol class="classement">${e.lignes.map((l, i) => `<li style="--ecurie:${theme(l.couleur).ecurieFond};animation-delay:${i * 120}ms"><span class="place">${l.place}</span>${pastille(l)}<span class="nom">${echapper(l.nom)}</span><span class="valeur">${echapper(l.valeur)}</span><span class="points">${l.points} pts</span></li>`).join('') || '<li>Pas encore de résultat.</li>'}</ol>`;
    } else if (e.mode === 'general') {
      zone.innerHTML = `<h1 class="titre-epreuve">Classement général · ${echapper(e.classe)}</h1>
        <table class="general"><thead><tr><th></th><th>Écurie</th>${e.epreuves.map((x) => `<th>${echapper(x.titre)}</th>`).join('')}<th>Total</th></tr></thead>
        <tbody>${e.lignes.map((l, i) => `<tr style="animation-delay:${i * 120}ms"><td class="place">${l.place}</td><td class="nom">${pastille(l)} ${echapper(l.nom)}</td>${e.epreuves.map((x) => `<td>${l.points[x.id] === null ? '—' : l.points[x.id]}</td>`).join('')}<td class="total">${l.total}</td></tr>`).join('')}</tbody></table>`;
    } else if (e.mode === 'podium') {
      const marche = (rang) => e.lignes.filter((l) => l.place === rang);
      const colonne = (rang, ordre) => {
        const l = marche(rang);
        return `<div class="marche marche-${rang}" style="--ordre:${ordre}">${l.map((x) => `<div class="laureat">${pastille(x, 'grande')}<strong>${echapper(x.nom)}</strong><span>${x.total} pts</span></div>`).join('') || '<div class="laureat vide"></div>'}<div class="socle"><span>${rang}</span></div></div>`;
      };
      zone.innerHTML = `<h1 class="titre-epreuve">Le podium · ${echapper(e.classe)}</h1>
        <div class="podium">${colonne(2, 1)}${colonne(1, 2)}${colonne(3, 0)}</div>
        <ol class="suite" start="4">${e.lignes.filter((l) => l.place > 3).map((l) => `<li>${l.place}. ${echapper(l.nom)} · ${l.total} pts</li>`).join('')}</ol>`;
    }
  }

  // Chronos en direct (temps de la régie, corrigé du décalage d'horloge).
  function boucle() {
    const e = etat;
    if (e.mode === 'passage' && e.postes) {
      for (const p of e.postes) {
        const el = zone.querySelector(`[data-poste="${p.id}"]`);
        if (!el) continue;
        const ecoule = p.debut ? (p.fin || Date.now() + decalage) - p.debut : 0;
        el.textContent = e.epreuve.sorte === 'obstacles' ? chrono(e.epreuve.tempsMax * 1000 - ecoule) : chrono(ecoule);
        el.classList.toggle('arrete', !!p.fin);
      }
    }
    if (e.mode === 'passage' && e.match) {
      const el = zone.querySelector('[data-compte-match]');
      if (el) el.textContent = chrono(e.match.restant - (e.match.enCours ? Date.now() - recu : 0));
    }
    requestAnimationFrame(boucle);
  }

  if ('BroadcastChannel' in global) {
    const canal = new BroadcastChannel(CANAL);
    canal.onmessage = (m) => recevoir(m.data);
    canal.postMessage('bonjour');
  }
  addEventListener('storage', (e) => {
    if (e.key === CANAL && e.newValue) {
      try { recevoir(JSON.parse(e.newValue)); } catch { /* rien */ }
    }
  });
  try { recevoir(JSON.parse(localStorage.getItem(CANAL)) || { mode: 'attente' }); } catch { recevoir({ mode: 'attente' }); }
  document.querySelector('.plein-ecran').addEventListener('click', () => document.documentElement.requestFullscreen && document.documentElement.requestFullscreen());
  requestAnimationFrame(boucle);
})(this);
