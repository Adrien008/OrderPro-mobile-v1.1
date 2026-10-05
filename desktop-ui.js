/* OrderPro PC — navigation par pages, sans raccourcis dans le tableau de bord.
   Couche additive : les fonctions métier restent dans app.js. */
(function(){
  "use strict";
  if(window.__ORDERPRO_DESKTOP_UI__) return;
  window.__ORDERPRO_DESKTOP_UI__=true;

  function ready(fn){
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",fn);
    else setTimeout(fn,0);
  }
  function byId(id){return document.getElementById(id)}
  function click(id){var e=byId(id);if(e)e.click()}
  function scrollToId(id){var e=byId(id);if(e)e.scrollIntoView({behavior:"smooth",block:"start"})}
  function direct(el){return el&&el.parentElement===document.querySelector("main")}

  ready(function(){
    var main=document.querySelector("main");
    if(!main) return;
    document.body.classList.add("pc-desktop");

    var brandRow=main.children[0];
    if(brandRow) brandRow.classList.add("pc-brand-row");

    if(!document.querySelector(".pc-page-head")){
      var head=document.createElement("div");
      head.className="pc-page-head";
      head.innerHTML='<div><h2>Tableau de bord</h2><div class="pc-subtitle">Suivez votre activité, vos paiements et vos livraisons.</div></div><div class="pc-head-actions"></div>';
      var actions=head.querySelector(".pc-head-actions");
      var add=byId("add");
      var quick=document.createElement("button");
      quick.type="button";quick.textContent="+ Nouvelle commande";
      quick.addEventListener("click",function(){if(add)add.click()});
      actions.appendChild(quick);
      main.insertBefore(head,main.children[1]||null);
    }

    // Marquage des pages existantes : aucun remplacement du HTML métier.
    var home=byId("home"), stats=null, orders=null, settings=null;
    Array.prototype.forEach.call(main.children,function(el){
      if(el===brandRow||el.classList.contains("pc-page-head")||el.id==="warn")return;
      if(el.tagName==="SECTION"&&!stats&&el.querySelector("#dtitle"))stats=el;
      if(el.tagName==="SECTION"&&!orders&&el.querySelector("#fq"))orders=el;
      if(el.tagName==="SECTION"&&!settings&&el.querySelector("#save"))settings=el;
    });
    if(home)home.dataset.pcPage="home";
    if(stats)stats.dataset.pcPage="home";
    if(orders)orders.dataset.pcPage="orders";
    if(settings)settings.dataset.pcPage="settings";
    ["waitbar","demobar","list"].forEach(function(id){var e=byId(id);if(e)e.dataset.pcPage="orders"});
    var tip=main.querySelector(".meta[style*='margin:0 0 8px']");if(tip)tip.dataset.pcPage="orders";
    ["modebar","t-real","t-demo"].forEach(function(id){var e=byId(id);if(e)e.dataset.pcShared="1"});
    var foot=byId("foot");if(foot)foot.dataset.pcPage="settings";

    var pageNames={
      home:["Tableau de bord","Suivez votre activité, vos paiements et vos livraisons."],
      orders:["Commandes","Retrouvez, filtrez et suivez toutes vos commandes."],
      clients:["Clients","Fiches clients et historique des commandes."],
      debts:["Qui me doit de l'argent ?","Suivez les soldes à recevoir et relancez vos clients."],
      delivery:["Livraisons","Préparez les tournées et les montants à encaisser."],
      stock:["Stock","Suivez les quantités disponibles et les alertes."],
      reports:["Rapports","Analysez votre activité et téléchargez un rapport Excel."],
      backup:["Sauvegardes","Protégez et restaurez vos données OrderPro."],
      settings:["Paramètres","Préférences, profil local, langue et thème."]
    };
    var headTitle=document.querySelector(".pc-page-head h2"),headSub=document.querySelector(".pc-page-head .pc-subtitle");
    function setHead(page){var p=pageNames[page]||pageNames.home;if(headTitle)headTitle.textContent=p[0];if(headSub)headSub.textContent=p[1]}

    function showPage(page){
      page=page||"home";
      main.querySelectorAll("[data-pc-page]").forEach(function(el){el.hidden=el.dataset.pcPage!==page});
      main.querySelectorAll("[data-pc-shared]").forEach(function(el){el.hidden=!(page==="home"||page==="orders")});
      setHead(page);
      document.body.dataset.pcPage=page;
      var currentNav=document.querySelectorAll(".pc-nav button");Array.prototype.forEach.call(currentNav,function(b){b.classList.toggle("active",b.dataset.page===page)});
    }

    // Les actions restent de vraies fenêtres centrées : aucune fenêtre ne doit
    // transformer l'écran en page bloquée ou empêcher un autre clic.
    var pageModalIds=[];
    function closeOpenModals(){
      document.querySelectorAll(".modal.on").forEach(function(e){
        e.classList.remove("on");
        e.classList.remove("pc-page-modal");
      });
    }
    function openPageModal(id,page){
      closeOpenModals();
      var e=byId(id);if(e)e.classList.add("on");
    }

    if(!document.querySelector(".pc-sidebar")){
      var side=document.createElement("aside");
      side.className="pc-sidebar";
      side.setAttribute("aria-label","Navigation OrderPro");
      side.innerHTML='<div class="pc-brand"><img src="icon-192.png" alt=""><strong>OrderPro</strong></div><div class="pc-nav-title">Espace de travail</div><nav class="pc-nav"></nav><div class="pc-sidebar-foot">Gestion des commandes<br><span>Version bureau</span></div>';
      var nav=side.querySelector(".pc-nav");
      var items=[
        ["home","⌂","Tableau de bord",function(){showPage("home")}],
        ["orders","▤","Commandes",function(){showPage("orders");scrollToId("list")}],
        ["clients","♙","Clients",function(){openPageModal("m15","clients");click("cl-btn")}],
        ["debts","₣","Qui me doit de l'argent",function(){openPageModal("m5","debts");click("dettes")}],
        ["delivery","⌁","Livraisons",function(){openPageModal("m12","delivery");click("liv-btn")}],
        ["stock","▦","Stock",function(){openPageModal("m17","stock");click("sk-btn")}],
        ["reports","▥","Rapports",function(){openPageModal("m10","reports");click("bilan-btn")}],
        ["backup","↥","Sauvegardes",function(){openPageModal("m18","backup");click("ab-btn")}],
        ["settings","⚙","Paramètres",function(){showPage("settings")}]
      ];
      items.forEach(function(item,index){
        var b=document.createElement("button");
        b.type="button";b.dataset.page=item[0];b.innerHTML='<span class="pc-nav-icon" aria-hidden="true">'+item[1]+'</span><span>'+item[2]+'</span>';
        if(index===0)b.classList.add("active");
        b.addEventListener("click",function(){
          // Une fenêtre ouverte ne doit jamais bloquer le passage à une autre fonction.
          closeOpenModals();
          nav.querySelectorAll("button").forEach(function(x){x.classList.remove("active")});
          b.classList.add("active");
          item[3]();
        });
        nav.appendChild(b);
      });
      document.body.insertBefore(side,document.body.firstChild);
    }

    function syncModalLayer(){
      var active=!!document.querySelector(".modal.on");
      document.body.classList.toggle("pc-modal-open",active);
      pageModalIds.forEach(function(id){var e=byId(id);if(e&&e.classList.contains("on"))e.classList.add("pc-page-modal")});
    }
    syncModalLayer();
    if(window.MutationObserver)new MutationObserver(syncModalLayer).observe(document.body,{subtree:true,attributes:true,attributeFilter:["class"]});

    // Haut de page : profil local, thème, langue et feedback.
    var theme=byId("theme-btn"),lang=byId("lang-btn"),auth=byId("auth-btn");
    if(theme)theme.addEventListener("click",function(){if(byId("priv")){} var dark=document.documentElement.getAttribute("data-theme")==="dark";document.documentElement.setAttribute("data-theme",dark?"light":"dark");localStorage.setItem("pc_theme",dark?"light":"dark");theme.textContent=dark?"☾ Mode sombre":"☀ Mode clair"});
    var savedTheme=localStorage.getItem("pc_theme");if(savedTheme)document.documentElement.setAttribute("data-theme",savedTheme);if(theme&&savedTheme==="dark")theme.textContent="☀ Mode clair";
    if(lang)lang.addEventListener("click",function(){var e=byId("m21");if(e)e.classList.add("on");var l=byId("ui-lang");if(l)l.value=localStorage.getItem("pc_ui_lang")||"fr"});
    if(auth)auth.addEventListener("click",function(){var e=byId("m21");if(e)e.classList.add("on")});

    // Les boutons masqués restent disponibles comme points d'entrée des fonctions existantes.
    showPage("home");

    document.addEventListener("keydown",function(e){
      var key=String(e.key||"").toLowerCase();
      if((e.ctrlKey||e.metaKey)&&key==="n"){e.preventDefault();click("add")}
      else if((e.ctrlKey||e.metaKey)&&key==="f"){e.preventDefault();var q=byId("fq");if(q){showPage("orders");q.focus();q.select()}}
      else if((e.ctrlKey||e.metaKey)&&key==="s"){e.preventDefault();click("save")}
      else if(e.key==="Escape"){
        var open=document.querySelector(".modal.on");
        if(open){var close=open.querySelector("[data-x]");if(close)close.click();else open.classList.remove("on")}
      }
    });
  });
})();
