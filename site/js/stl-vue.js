// Aperçu 3D d'une pièce STL, dessiné sur un canvas sans bibliothèque : faces éclairées, triées de l'arrière vers
// l'avant ; on fait tourner la pièce en glissant. Suffisant pour reconnaître une pièce de Tinkercad.
//   const liberer = Atelier.vueStl(canvas, arrayBuffer)
(function (global) {
  'use strict';

  const A = global.Atelier;
  const MAX_FACES = 60000; // au-delà, une face sur deux… (aperçu seulement)

  function triangles(buffer) {
    const octets = new Uint8Array(buffer);
    const vue = new DataView(buffer);
    const points = [];
    if (octets.length >= 84) {
      const n = vue.getUint32(80, true);
      if (n > 0 && 84 + n * 50 === octets.length) {
        const pas = Math.max(1, Math.ceil(n / MAX_FACES));
        for (let i = 0; i < n; i += pas) {
          const base = 84 + i * 50 + 12;
          for (let v = 0; v < 9; v++) points.push(vue.getFloat32(base + v * 4, true));
        }
        return points;
      }
    }
    for (const m of new TextDecoder().decode(octets).matchAll(/vertex\s+(\S+)\s+(\S+)\s+(\S+)/gi)) points.push(+m[1], +m[2], +m[3]);
    return points.slice(0, MAX_FACES * 9);
  }

  function vueStl(toile, buffer) {
    const p = triangles(buffer);
    const n = p.length / 9;
    // Centrer et mettre à l'échelle.
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < p.length; i++) {
      const k = i % 3;
      if (p[i] < min[k]) min[k] = p[i];
      if (p[i] > max[k]) max[k] = p[i];
    }
    const centre = min.map((m, k) => (m + max[k]) / 2);
    const rayon = Math.max(...max.map((m, k) => m - min[k])) / 2 || 1;
    for (let i = 0; i < p.length; i++) p[i] = (p[i] - centre[i % 3]) / rayon;

    const ctx = toile.getContext('2d');
    let rx = -0.6; // vue de trois quarts au départ
    let ry = 0.7;
    const ordre = new Uint32Array(n).map((_, i) => i);
    const profondeur = new Float32Array(n);
    const proj = new Float32Array(n * 9);
    const rot = new Float32Array(n * 9); // pièce tournée : x, haut, profondeur (pour l'éclairage)

    function dessiner() {
      const ratio = global.devicePixelRatio || 1;
      const w = toile.clientWidth || 280;
      const h = toile.clientHeight || 200;
      if (toile.width !== Math.round(w * ratio)) {
        toile.width = Math.round(w * ratio);
        toile.height = Math.round(h * ratio);
      }
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      ctx.fillStyle = '#F2F5F9';
      ctx.fillRect(0, 0, w, h);
      const echelle = Math.min(w, h) * 0.42;
      const cx = Math.cos(rx), sx = Math.sin(rx), cy = Math.cos(ry), sy = Math.sin(ry);
      // Tinkercad : z vers le haut → on le met à l'écran vers le haut.
      for (let t = 0; t < n; t++) {
        let z = 0;
        for (let v = 0; v < 3; v++) {
          const i = t * 9 + v * 3;
          const x = p[i], y = p[i + 1], zz = p[i + 2];
          // rotation autour de l'axe vertical (z), puis inclinaison
          const x1 = x * cy - y * sy;
          const y1 = x * sy + y * cy;
          const y2 = y1 * cx - zz * sx;
          const z2 = y1 * sx + zz * cx;
          rot[i] = x1;
          rot[i + 1] = z2;
          rot[i + 2] = y2;
          proj[i] = w / 2 + x1 * echelle;
          proj[i + 1] = h / 2 - z2 * echelle;
          proj[i + 2] = y2;
          z += y2;
        }
        profondeur[t] = z;
      }
      ordre.sort((a, b) => profondeur[b] - profondeur[a]);
      for (const t of ordre) {
        const i = t * 9;
        const ax = rot[i + 3] - rot[i], ay = rot[i + 4] - rot[i + 1], az = rot[i + 5] - rot[i + 2];
        const bx = rot[i + 6] - rot[i], by = rot[i + 7] - rot[i + 1], bz = rot[i + 8] - rot[i + 2];
        // éclairage selon l'orientation de la face : lumière venant d'en haut à gauche, devant la pièce
        const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
        const l = Math.hypot(nx, ny, nz) || 1;
        const lum = 0.3 + 0.7 * Math.abs((nx * -0.42 + ny * 0.62 + nz * -0.66) / l);
        const c = Math.round(60 + 150 * lum);
        ctx.fillStyle = `rgb(${Math.round(c * 0.45)},${Math.round(c * 0.7)},${c})`;
        ctx.beginPath();
        ctx.moveTo(proj[i], proj[i + 1]);
        ctx.lineTo(proj[i + 3], proj[i + 4]);
        ctx.lineTo(proj[i + 6], proj[i + 7]);
        ctx.closePath();
        ctx.fill();
      }
    }

    let depart = null;
    const bas = (e) => {
      depart = { x: e.clientX, y: e.clientY, rx, ry };
      toile.setPointerCapture(e.pointerId);
    };
    const bouge = (e) => {
      if (!depart) return;
      ry = depart.ry + (e.clientX - depart.x) * 0.01;
      rx = Math.max(-1.5, Math.min(1.5, depart.rx + (e.clientY - depart.y) * 0.01));
      requestAnimationFrame(dessiner);
    };
    const haut = () => (depart = null);
    toile.addEventListener('pointerdown', bas);
    toile.addEventListener('pointermove', bouge);
    toile.addEventListener('pointerup', haut);
    toile.setAttribute('role', 'img');
    toile.setAttribute('aria-label', 'Aperçu 3D de la pièce : glisser pour la faire tourner');
    dessiner();
    return () => {
      toile.removeEventListener('pointerdown', bas);
      toile.removeEventListener('pointermove', bouge);
      toile.removeEventListener('pointerup', haut);
    };
  }

  A.vueStl = vueStl;
})(this);
