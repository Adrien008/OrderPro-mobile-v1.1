/* OrderPro – améliorations de la version bureau.
 * Ce fichier s'ajoute à app.js : il ne modifie ni ne retire aucune fonction existante.
 * Hors de l'application Windows (navigateur), il ne fait rien. */
(function () {
  "use strict";
  var D = window.desktop;
  if (!D) return;

  /* ---------- Notifications : un clic sur la notification rouvre OrderPro ---------- */
  try {
    var NN = window.Notification;
    if (NN) {
      var NW = function (t, o) { var n = new NN(t, o); n.addEventListener("click", function () { D.showWindow(); }); return n; };
      NW.prototype = NN.prototype;
      Object.defineProperty(NW, "permission", { get: function () { return NN.permission; } });
      NW.requestPermission = function () { return NN.requestPermission.apply(NN, arguments); };
      window.Notification = NW;
    }
  } catch (e) { /* ignoré */ }

  function $(i) { return document.getElementById(i); }
  function lsg(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lss(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignoré */ } }
  function lsd(k) { try { localStorage.removeItem(k); } catch (e) { /* ignoré */ } }
  function pad(n) { return ("0" + n).slice(-2); }
  function dfr(t) { var d = new Date(t); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + "/" + d.getFullYear() + " " + pad(d.getHours()) + "h" + pad(d.getMinutes()); }
  function onReady(fn) { if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn); else fn(); }

  onReady(function () {
    /* ---------- Barre d'information en bas de l'écran ---------- */
    var bar = document.createElement("div");
    bar.id = "pc-bar"; bar.hidden = true;
    document.body.appendChild(bar);
    var barTimer = 0;
    function say(text, buttons, ms) {
      bar.innerHTML = ""; clearTimeout(barTimer);
      var s = document.createElement("span"); s.textContent = text; bar.appendChild(s);
      (buttons || []).forEach(function (b) {
        var z = document.createElement("button"); z.type = "button"; z.textContent = b[0]; if (b[2]) z.className = "alt";
        z.addEventListener("click", function () { bar.hidden = true; b[1](); }); bar.appendChild(z);
      });
      bar.hidden = false;
      if (ms) barTimer = setTimeout(function () { bar.hidden = true; }, ms);
    }
    D.onSaved(function (info) {
      say("Fichier enregistré : " + info.name, [["Afficher dans le dossier", function () { D.reveal(info.path); }]], 9000);
    });

    /* ---------- Version affichée en bas de page ---------- */
    D.version().then(function (v) { var f = $("foot"); if (f && v) f.appendChild(document.createTextNode(" · version bureau " + v)); });

    /* ---------- Mises à jour automatiques ---------- */
    var updateBusy = false;
    function updateBackupAndInstall() {
      if (updateBusy) return; updateBusy = true;
      var go = function () { D.updateInstall(); };
      if (!hasData()) { go(); return; }
      D.backupWrite(full(keysJson()), "avant-mise-a-jour").then(function (r) {
        if (r && r.ok) go(); else { updateBusy = false; alert("La sauvegarde avant mise à jour a échoué. Installation annulée."); }
      }).catch(function () { updateBusy = false; alert("La sauvegarde avant mise à jour a échoué. Installation annulée."); });
    }
    function checkUpdates() {
      say("Recherche d'une mise à jour…", [], 5000);
      D.updateCheck().then(function (r) {
        if (r && r.dev) say("La recherche de mise à jour est disponible dans la version installée, pas dans le mode test.", [], 6000);
      }).catch(function () { say("Recherche de mise à jour impossible pour le moment.", [], 5000); });
    }
    if (D.onUpdate) D.onUpdate(function (u) {
      if (!u) return;
      if (u.state === "checking") say("Recherche d'une mise à jour…", [], 5000);
      else if (u.state === "not-available") say("OrderPro est déjà à jour.", [], 5000);
      else if (u.state === "available") say("Nouvelle version OrderPro disponible : v" + (u.version || ""), [["Télécharger", function () { D.updateDownload(); }]], 12000);
      else if (u.state === "progress") say("Téléchargement de la mise à jour : " + (u.percent || 0) + "%", [], 5000);
      else if (u.state === "downloaded") say("Mise à jour téléchargée. Une sauvegarde sera créée avant l'installation.", [["Sauvegarder et installer", updateBackupAndInstall], ["Plus tard", function () {}, true]], 15000);
      else if (u.state === "error") { updateBusy = false; say("Mise à jour indisponible pour le moment.", [], 6000); }
    });
    setTimeout(function () { if (!document.querySelector(".modal.on") && D.updateCheck) D.updateCheck(); }, 15000);

    /* ---------- Sauvegarde sur ce PC (copie des données dans Documents\OrderPro\Sauvegardes) ---------- */
    function keysJson() {
      var o = {};
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf("pc_") === 0 && k.indexOf("pc_pcbk") !== 0) o[k] = localStorage.getItem(k);
      }
      return JSON.stringify(o);
    }
    function full(keys) { return '{"app":"OrderPro-PC","v":1,"date":"' + new Date().toISOString() + '","keys":' + keys + "}"; }
    function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return String(h) + ":" + s.length; }
    function hasData() { return !!(lsg("pc_commandes") || lsg("pc_commandes_enc")); }
    function autoRun() {
      if (lsg("pc_pcbk") !== "1" || !hasData()) return;
      var keys = keysJson(), h = hash(keys);
      if (lsg("pc_pcbk_h") === h) return;
      D.backupWrite(full(keys), "auto").then(function (r) { if (r && r.ok) { lss("pc_pcbk_h", h); lss("pc_pcbk_t", String(Date.now())); } });
    }
    setTimeout(autoRun, 4000);
    setInterval(autoRun, 10 * 60 * 1000);

    // Première fois : proposer d'activer la sauvegarde automatique sur le PC
    setTimeout(function () {
      if (lsg("pc_pcbk") !== null || lsg("pc_pcbk_ask") || !hasData()) return;
      if (document.querySelector(".modal.on")) return;
      lss("pc_pcbk_ask", "1");
      say("Activer la sauvegarde automatique sur ce PC (dossier Documents\\OrderPro) ?", [
        ["Activer", function () { lss("pc_pcbk", "1"); autoRun(); say("Sauvegarde automatique activée.", [], 4000); }],
        ["Plus tard", function () { /* demandé une seule fois */ }, true]
      ]);
    }, 9000);

    function mkModal() {
      var m = document.createElement("div");
      m.className = "modal"; m.id = "m30"; m.style.zIndex = "8";
      m.innerHTML =
        '<div class="box"><h2>Sauvegarde sur ce PC</h2><p class="meta" id="pc-info"></p>' +
        '<label class="ck"><input type="checkbox" id="pc-auto"> Sauvegarder automatiquement sur ce PC</label>' +
        '<p class="meta">Une copie est mise à jour dans Documents\\OrderPro\\Sauvegardes dès que tes données changent (les 30 dernières sont gardées). Avec un code PIN, la copie reste chiffrée. Sans code PIN, le fichier est lisible par toute personne qui utilise ta session Windows.</p>' +
        '<div class="btns"><button id="pc-now" type="button">Sauvegarder maintenant</button><button class="alt" id="pc-open" type="button">Ouvrir le dossier</button></div>' +
        '<h3 style="margin:16px 0 0;font-size:1rem">Copies disponibles</h3><div id="pc-list"></div>' +
        '<h3 style="margin:16px 0 0;font-size:1rem">Options Windows</h3>' +
        '<label class="ck"><input type="checkbox" id="pc-bg"> Rester actif en arrière-plan quand je ferme la fenêtre (pour les rappels)</label>' +
        '<label class="ck"><input type="checkbox" id="pc-login"> Lancer OrderPro au démarrage de Windows</label>' +
        '<p class="meta">Raccourcis : Ctrl+N nouvelle commande · Ctrl+F rechercher · Ctrl+S sauvegarder · Ctrl+P imprimer le reçu · Ctrl+Shift+C clients · Ctrl+Shift+D devis · Ctrl+Shift+L livraisons · Ctrl+Shift+K stock · Ctrl+Shift+B bilan · Échap fermer · Ctrl +/− zoom. Les mises à jour sont vérifiées automatiquement.</p>' +
        '<div class="btns"><button class="alt" id="pc-x" type="button">Fermer</button></div></div>';
      document.body.appendChild(m);
      return m;
    }
    var m30 = mkModal();

    function drawPc() {
      var t = +lsg("pc_pcbk_t") || 0;
      $("pc-info").textContent = t ? "Dernière copie automatique : " + dfr(t) + "." : "Aucune copie automatique pour le moment.";
      $("pc-auto").checked = lsg("pc_pcbk") === "1";
      D.getSettings().then(function (s) { $("pc-bg").checked = !!s.keepBg; $("pc-login").checked = !!s.login; });
      D.backupList().then(function (L) {
        var b = $("pc-list"); b.innerHTML = "";
        if (!L.length) { var e = document.createElement("div"); e.className = "meta"; e.textContent = "Aucune copie pour le moment."; b.appendChild(e); return; }
        L.forEach(function (f) {
          var d = document.createElement("div"); d.className = "irow";
          var n = document.createElement("div"); n.textContent = f.name; n.style.fontWeight = "700"; d.appendChild(n);
          var mt = document.createElement("div"); mt.className = "meta"; mt.textContent = dfr(f.mtime) + " · " + Math.max(1, Math.round(f.size / 1024)) + " Ko"; d.appendChild(mt);
          var z = document.createElement("button"); z.type = "button"; z.className = "alt"; z.textContent = "Restaurer cette copie"; z.style.marginTop = "8px";
          z.addEventListener("click", function () { restore(f.name); }); d.appendChild(z); b.appendChild(d);
        });
      });
    }
    function restore(name) {
      D.backupRead(name).then(function (t) {
        var o = null; try { o = JSON.parse(t); } catch (e) { /* invalide */ }
        if (!o || o.app !== "OrderPro-PC" || !o.keys || typeof o.keys !== "object") { alert("Cette copie n'est pas une sauvegarde OrderPro valide."); return; }
        if (!confirm("Remplacer toutes les données actuelles par « " + name + " » ?\nUne copie de sécurité de tes données actuelles sera créée avant.")) return;
        D.backupWrite(full(keysJson()), "avant-restauration").then(function (r) {
          if (!r || !r.ok) { alert("La copie de sécurité a échoué : restauration annulée."); return; }
          var rm = [], i, k;
          for (i = 0; i < localStorage.length; i++) { k = localStorage.key(i); if (k && k.indexOf("pc_") === 0 && k.indexOf("pc_pcbk") !== 0) rm.push(k); }
          rm.forEach(lsd);
          Object.keys(o.keys).forEach(function (key) { if (key.indexOf("pc_") === 0 && key.indexOf("pc_pcbk") !== 0 && typeof o.keys[key] === "string") lss(key, o.keys[key]); });
          location.reload();
        });
      });
    }
    $("pc-auto").addEventListener("change", function () { lss("pc_pcbk", this.checked ? "1" : "0"); if (this.checked) { lsd("pc_pcbk_h"); autoRun(); setTimeout(drawPc, 800); } });
    $("pc-bg").addEventListener("change", function () { D.setSetting("keepBg", this.checked); });
    $("pc-login").addEventListener("change", function () { D.setSetting("login", this.checked); });
    $("pc-now").addEventListener("click", function () {
      if (!hasData()) { alert("Aucune donnée à sauvegarder pour le moment."); return; }
      D.backupWrite(full(keysJson()), "manuelle").then(function (r) { if (r && r.ok) { lss("pc_bk", String(Date.now())); say("Copie enregistrée : " + r.name, [["Ouvrir le dossier", function () { D.openBackupDir(); }]], 7000); drawPc(); } else alert("La sauvegarde a échoué."); });
    });
    $("pc-open").addEventListener("click", function () { D.openBackupDir(); });
    $("pc-x").addEventListener("click", function () { m30.classList.remove("on"); });

    // Bouton dans la section « Données »
    var anchor = $("pin-btn");
    if (anchor && anchor.parentNode) {
      var pb = document.createElement("button");
      pb.type = "button"; pb.className = "alt"; pb.id = "pc-btn"; pb.textContent = "Sauvegarde sur ce PC";
      pb.addEventListener("click", function () { drawPc(); m30.classList.add("on"); });
      anchor.parentNode.appendChild(pb);
      var ub = document.createElement("button");
      ub.type = "button"; ub.className = "alt"; ub.id = "pc-update"; ub.textContent = "Mises à jour";
      ub.addEventListener("click", checkUpdates); anchor.parentNode.appendChild(ub);
    }

    /* ---------- Impression du reçu ---------- */
    var printing = false;
    function recuOpen() { var m = $("m13"); return !!(m && m.classList.contains("on")); }
    function printRecu() {
      if (printing || !recuOpen()) return;
      printing = true; document.body.classList.add("print-recu");
      D.print().then(function () { /* terminé ou annulé */ }, function () { /* ignoré */ }).then(function () { document.body.classList.remove("print-recu"); printing = false; });
    }
    var rbtns = document.querySelector("#m13 .btns"), rx = $("ri-x");
    if (rbtns) {
      var pr = document.createElement("button");
      pr.type = "button"; pr.className = "alt"; pr.id = "ri-print"; pr.textContent = "Imprimer";
      pr.addEventListener("click", printRecu);
      if (rx) rbtns.insertBefore(pr, rx); else rbtns.appendChild(pr);
    }

    /* ---------- Raccourcis clavier ---------- */
    function openModals() { return [].slice.call(document.querySelectorAll(".modal.on")); }
    function topModal() {
      var L = openModals(), best = null, bz = -1;
      L.forEach(function (m) { var z = parseInt(getComputedStyle(m).zIndex, 10) || 0; if (z >= bz) { bz = z; best = m; } });
      return best;
    }
    function closeModal(m) {
      var b = m.id === "m1" ? $("no") : null;
      if (!b) { [].slice.call(m.querySelectorAll("button")).some(function (x) { if (/^(Fermer|Annuler|Plus tard)$/.test(x.textContent.trim())) { b = x; return true; } return false; }); }
      if (b) b.click(); else m.classList.remove("on");
    }
    document.addEventListener("keydown", function (e) {
      var locked = $("m6") && $("m6").classList.contains("on");
      if (e.key === "Escape") {
        if (locked) return;
        var m = topModal();
        if (m && m.id !== "m3") { closeModal(m); e.preventDefault(); }
        return;
      }
      if (!(e.ctrlKey || e.metaKey) || locked) return;
      var k = (e.key || "").toLowerCase(), any = openModals().length > 0;
      if (e.shiftKey && !any) {
        var quick = { c: "cl-btn", d: "dv-btn", l: "liv-btn", k: "sk-btn", b: "bilan-btn" }, qb = $(quick[k]);
        if (qb && !qb.hidden) { qb.click(); e.preventDefault(); return; }
      }
      if (k === "n" && !any) { var a = $("add"); if (a && !a.hidden) { a.click(); e.preventDefault(); } }
      else if (k === "f" && !any) { var q = $("fq"); if (q) { q.focus(); q.select(); e.preventDefault(); } }
      else if (k === "s") { e.preventDefault(); if (!any) { var s = $("save"); if (s) s.click(); } }
      else if (k === "p" && recuOpen()) { e.preventDefault(); printRecu(); }
    });

    /* ---------- Verrouillage automatique (si un code PIN est actif) ---------- */
    var last = Date.now(), hiddenAt = 0, IDLE = 10 * 60 * 1000, AWAY = 5 * 60 * 1000;
    ["mousemove", "mousedown", "keydown", "wheel", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function () { last = Date.now(); }, { passive: true, capture: true }); });
    function formOpen() { var f = $("m1"); return !!(f && f.classList.contains("on")); }
    setInterval(function () {
      if (!lsg("pc_pin") || formOpen() || ($("m6") && $("m6").classList.contains("on"))) return;
      if (Date.now() - last > IDLE) location.reload();
    }, 30000);
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { hiddenAt = Date.now(); autoRun(); return; }
      var away = hiddenAt ? Date.now() - hiddenAt : 0; hiddenAt = 0; last = Date.now();
      if (lsg("pc_pin") && away > AWAY && !formOpen()) location.reload();
    });
  });
})();
