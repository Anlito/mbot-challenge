// Prendre ou choisir une photo, puis flouter les visages avant de l'enregistrer (remplace Digiblur) : l'élève glisse
// sur chaque visage, la zone devient une mosaïque. La photo n'est jamais enregistrée avant ce passage.
//   const blob = await Atelier.photoEditeur.ouvrir({ source: 'webcam' | 'fichier', fichier (image déjà choisie), titre })
//     → JPEG ou null
(function (global) {
  'use strict';

  const A = global.Atelier;
  const COTE_MAX = 1600; // px : assez pour une photo de rapport, léger dans le dossier
  const CARREAU = 0.035; // taille des carreaux de la mosaïque, en fraction du plus grand côté

  function choisirFichier() {
    return new Promise((ok) => {
      const entree = document.createElement('input');
      entree.type = 'file';
      entree.accept = 'image/png,image/jpeg,image/webp';
      entree.addEventListener('change', () => ok((entree.files && entree.files[0]) || null));
      entree.addEventListener('cancel', () => ok(null));
      entree.click();
    });
  }

  // Mosaïque d'un rectangle (coordonnées de l'image).
  function flouter(ctx, r, carreau) {
    const x0 = Math.max(0, Math.floor(r.x));
    const y0 = Math.max(0, Math.floor(r.y));
    const w = Math.min(ctx.canvas.width - x0, Math.ceil(r.w));
    const h = Math.min(ctx.canvas.height - y0, Math.ceil(r.h));
    if (w < 2 || h < 2) return;
    const img = ctx.getImageData(x0, y0, w, h);
    for (let y = 0; y < h; y += carreau) {
      for (let x = 0; x < w; x += carreau) {
        let rr = 0, gg = 0, bb = 0, n = 0;
        for (let yy = y; yy < Math.min(h, y + carreau); yy++) {
          for (let xx = x; xx < Math.min(w, x + carreau); xx++) {
            const i = (yy * w + xx) * 4;
            rr += img.data[i]; gg += img.data[i + 1]; bb += img.data[i + 2]; n++;
          }
        }
        ctx.fillStyle = `rgb(${rr / n | 0},${gg / n | 0},${bb / n | 0})`;
        ctx.fillRect(x0 + x, y0 + y, Math.min(carreau, w - x), Math.min(carreau, h - y));
      }
    }
  }

  function ouvrir(options) {
    const o = options || {};
    return new Promise((terminer) => {
      const dlg = document.createElement('dialog');
      dlg.className = 'dialogue-photo';
      dlg.setAttribute('aria-label', o.titre || 'Photo');
      dlg.innerHTML = `
        <div class="photo-entete"><h2>${o.titre || 'Photo'}</h2><button type="button" class="btn-lien photo-fermer">Abandonner</button></div>
        <div class="photo-etape photo-camera" hidden>
          <video class="photo-video" autoplay playsinline muted></video>
          <p class="aide">Cadrez le travail de l’écurie (le mBot, l’écran, l’affiche…), puis prenez la photo.</p>
          <div class="accueil-actions"><button type="button" class="btn-principal photo-prendre">${A.icone('camera', { epaisseur: 2.2 })}Prendre la photo</button></div>
        </div>
        <div class="photo-etape photo-flou" hidden>
          <p class="photo-consigne"><strong>Flouter les visages :</strong> glissez sur chaque visage (et chaque nom écrit) pour le cacher. S’il n’y en a pas, enregistrez directement.</p>
          <div class="photo-toile"><canvas></canvas></div>
          <div class="accueil-actions">
            <button type="button" class="btn-secondaire photo-annuler-flou" disabled>Annuler le dernier flou</button>
            <button type="button" class="btn-principal photo-enregistrer">Enregistrer la photo</button>
          </div>
        </div>
        <p class="message-ecart" role="alert" hidden></p>`;
      document.body.append(dlg);
      const $ = (s) => dlg.querySelector(s);
      let flux = null;
      let original = null; // image avant flou
      const zones = [];

      function fin(blob) {
        if (flux) flux.getTracks().forEach((t) => t.stop());
        dlg.close();
        dlg.remove();
        terminer(blob || null);
      }
      const ecart = (t) => {
        $('.message-ecart').textContent = t;
        $('.message-ecart').hidden = !t;
      };
      $('.photo-fermer').addEventListener('click', () => fin(null));
      dlg.addEventListener('cancel', (e) => {
        e.preventDefault();
        fin(null);
      });

      const toile = $('canvas');
      const ctx = toile.getContext('2d', { willReadFrequently: true });
      const carreau = () => Math.max(6, Math.round(Math.max(toile.width, toile.height) * CARREAU));
      function dessiner() {
        ctx.drawImage(original, 0, 0);
        for (const z of zones) flouter(ctx, z, carreau());
        $('.photo-annuler-flou').disabled = !zones.length;
      }
      function editer(source, largeur, hauteur) {
        const k = Math.min(1, COTE_MAX / Math.max(largeur, hauteur));
        toile.width = Math.round(largeur * k);
        toile.height = Math.round(hauteur * k);
        original = document.createElement('canvas');
        original.width = toile.width;
        original.height = toile.height;
        original.getContext('2d').drawImage(source, 0, 0, toile.width, toile.height);
        $('.photo-camera').hidden = true;
        $('.photo-flou').hidden = false;
        dessiner();
      }

      // Glisser pour flouter (souris, doigt, stylet).
      let depart = null;
      const point = (e) => {
        const r = toile.getBoundingClientRect();
        return { x: ((e.clientX - r.left) / r.width) * toile.width, y: ((e.clientY - r.top) / r.height) * toile.height };
      };
      toile.addEventListener('pointerdown', (e) => {
        depart = point(e);
        toile.setPointerCapture(e.pointerId);
      });
      toile.addEventListener('pointermove', (e) => {
        if (!depart) return;
        const p = point(e);
        dessiner();
        ctx.strokeStyle = '#FFC21A';
        ctx.lineWidth = Math.max(2, toile.width / 300);
        ctx.strokeRect(depart.x, depart.y, p.x - depart.x, p.y - depart.y);
      });
      toile.addEventListener('pointerup', (e) => {
        if (!depart) return;
        const p = point(e);
        const z = { x: Math.min(depart.x, p.x), y: Math.min(depart.y, p.y), w: Math.abs(p.x - depart.x), h: Math.abs(p.y - depart.y) };
        depart = null;
        if (z.w > 8 && z.h > 8) zones.push(z);
        dessiner();
      });
      $('.photo-annuler-flou').addEventListener('click', () => {
        zones.pop();
        dessiner();
      });
      $('.photo-enregistrer').addEventListener('click', () => {
        dessiner();
        toile.toBlob((b) => fin(b), 'image/jpeg', 0.85);
      });

      dlg.showModal();
      if (o.source === 'webcam') {
        $('.photo-camera').hidden = false;
        const video = $('.photo-video');
        navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false })
          .then((f) => {
            flux = f;
            video.srcObject = f;
          })
          .catch(() => ecart('La webcam ne s’ouvre pas. Vérifie qu’elle est branchée et autorisée, ou utilise « Ajouter un fichier ».'));
        $('.photo-prendre').addEventListener('click', () => {
          if (!video.videoWidth) return ecart('La webcam n’est pas encore prête : attends une seconde.');
          ecart('');
          editer(video, video.videoWidth, video.videoHeight);
          flux.getTracks().forEach((t) => t.stop());
          flux = null;
        });
      } else {
        (o.fichier ? Promise.resolve(o.fichier) : choisirFichier()).then(async (f) => {
          if (!f) return fin(null);
          try {
            const image = await createImageBitmap(f);
            editer(image, image.width, image.height);
          } catch {
            ecart('Ce fichier n’est pas une image lisible. Choisis une photo JPG ou PNG.');
          }
        });
      }
    });
  }

  A.photoEditeur = { ouvrir, flouter };
})(this);
