// Code professeur devant l'espace professeur (brief §10.2). Le site est public et sans serveur : ce code arrête les
// élèves curieux, ce n'est pas une sécurité. Seule l'empreinte du code est dans le dépôt (code-professeur.js,
// PBKDF2-SHA-256 avec un sel, la même que Labo Blocs), jamais le code.
// Chargé dans <head>, juste avant code-professeur.js. Avec data-si-prof : seulement quand l'adresse contient ?prof.
(function (racine) {
  "use strict";

  var CLE = "mbot-challenge-code-professeur";
  var doc = racine.document, script = doc.currentScript;
  if (script && script.hasAttribute("data-si-prof") && !new URLSearchParams(racine.location.search).has("prof")) {
    racine.definirCodeProfesseur = function () {};
    return;
  }

  async function empreinte(code, sel, iterations) {
    var enc = new TextEncoder();
    var cle = await crypto.subtle.importKey("raw", enc.encode(String(code).trim()), "PBKDF2", false, ["deriveBits"]);
    var bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(sel), iterations: iterations }, cle, 256);
    return [].map.call(new Uint8Array(bits), function (o) { return o.toString(16).padStart(2, "0"); }).join("");
  }

  function lire(stock) { try { return stock.getItem(CLE); } catch (e) { return null; } }

  racine.MbotPorte = {
    verrouiller: function () {
      [racine.localStorage, racine.sessionStorage].forEach(function (s) { try { s.removeItem(CLE); } catch (e) { /* rien à effacer */ } });
      racine.location.reload();
    }
  };

  racine.definirCodeProfesseur = function (reglage) {
    if (!reglage || !reglage.empreinte) return;
    if (lire(racine.localStorage) === reglage.empreinte || lire(racine.sessionStorage) === reglage.empreinte) return;
    doc.documentElement.classList.add("porte-fermee");
    function poser() {
      var porte = doc.createElement("div");
      porte.className = "porte-professeur";
      porte.setAttribute("role", "dialog");
      porte.setAttribute("aria-modal", "true");
      porte.innerHTML = '<form class="accueil-carte porte-boite" novalidate><h1>mBot Challenge · professeur</h1>' +
        "<p>Espace du professeur : suivi des écuries en direct, notation, exports, régie du tournoi.</p>" +
        '<label>Code professeur<input type="password" class="porte-code" autocomplete="current-password"></label>' +
        '<label class="case"><input type="checkbox" class="porte-garder" checked> Se souvenir sur cet ordinateur</label>' +
        '<p class="message-ecart porte-ecart" role="alert" hidden></p><div class="accueil-actions"><button class="btn-principal" type="submit">Entrer</button>' +
        '<a class="btn-secondaire" href="index.html">Espace élève</a></div></form>';
      doc.body.appendChild(porte);
      var champ = porte.querySelector(".porte-code"), ecart = porte.querySelector(".porte-ecart");
      champ.focus();
      porte.querySelector("form").addEventListener("submit", async function (ev) {
        ev.preventDefault();
        function dire(t) { ecart.textContent = t; ecart.hidden = false; }
        if (!champ.value.trim()) return dire("Tape le code professeur.");
        var bon = false;
        try { bon = (await empreinte(champ.value, reglage.sel, reglage.iterations)) === reglage.empreinte; }
        catch (e) { return dire("Ce navigateur ne sait pas vérifier le code : ouvre la page avec Chrome ou Edge."); }
        if (!bon) { champ.select(); return dire("Ce n'est pas le code professeur. Vérifie-le et recommence."); }
        try { (porte.querySelector(".porte-garder").checked ? racine.localStorage : racine.sessionStorage).setItem(CLE, reglage.empreinte); }
        catch (e) { /* stockage indisponible : la page s'ouvre pour cette fois */ }
        porte.remove();
        doc.documentElement.classList.remove("porte-fermee");
      });
    }
    if (doc.body) poser(); else doc.addEventListener("DOMContentLoaded", poser);
  };
})(this);
