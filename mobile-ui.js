/* OrderPro — navigation mobile additive. Les fonctions de l'application restent dans app.js. */
(function(){
  "use strict";
  if(window.desktop)return;
  function $(id){return document.getElementById(id)}
  function ready(fn){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",fn);else fn()}
  ready(function(){
    document.body.classList.add("mobile-ready");
    var navLabels={fr:{home:"Accueil",orders:"Commandes",clients:"Clients",data:"Données",more:"Plus"},en:{home:"Home",orders:"Orders",clients:"Clients",data:"Data",more:"More"}};
    function labelNav(lang){lang=lang==="en"?"en":"fr";nav.querySelectorAll("button[data-nav]").forEach(function(b){var sp=b.querySelector(".mi"),key=b.dataset.nav;if(sp&&navLabels[lang][key]){var icon=sp.textContent;b.textContent="";b.appendChild(sp);b.appendChild(document.createTextNode(navLabels[lang][key]))}})}
    var nav=document.createElement("nav");nav.id="mobile-nav";nav.setAttribute("aria-label","Navigation mobile");
    var add=document.createElement("button");add.id="mobile-add";add.type="button";add.setAttribute("aria-label","Nouvelle commande");add.textContent="+";add.hidden=true;
    var items=[
      ["home","⌂","Accueil",function(){var x=$("home");if(x)x.scrollIntoView({behavior:"smooth",block:"start"})}],
      ["orders","▤","Commandes",function(){var x=$("list");if(x)x.scrollIntoView({behavior:"smooth",block:"start"})}],
      ["clients","♟","Clients",function(){var x=$("cl-btn");if(x)x.click()}],
      ["data","▣","Données",function(){var x=$("save");if(x&&x.closest("section"))x.closest("section").scrollIntoView({behavior:"smooth",block:"start"})}]
    ];
    items.forEach(function(it){var b=document.createElement("button");b.type="button";b.dataset.nav=it[0];b.innerHTML='<span class="mi">'+it[1]+'</span>'+it[2];b.addEventListener("click",function(){items.forEach(function(z){var y=nav.querySelector('[data-nav="'+z[0]+'"]');if(y)y.classList.remove("active")});b.classList.add("active");it[3]()});nav.appendChild(b)});
    var more=document.createElement("button");more.type="button";more.dataset.nav="more";more.innerHTML='<span class="mi">⋯</span>Plus';more.addEventListener("click",function(){var x=$("guide");if(x)x.click()});nav.appendChild(more);
    document.body.appendChild(nav);document.body.appendChild(add);
    labelNav(localStorage.getItem("pc_ui_lang")||"fr");
    document.addEventListener("orderpro-language",function(e){labelNav(e.detail)});
    add.addEventListener("click",function(){var x=$("add");if(x&&!x.hidden)x.click()});
    function update(){var want=!!($("add")&&$("add").hidden)||!!document.querySelector(".modal.on");if(add.hidden!==want)add.hidden=want;}
    var mo=new MutationObserver(update);mo.observe(document.body,{subtree:true,attributes:true,attributeFilter:["class","hidden"]});
    update();
    var first=nav.querySelector('[data-nav="home"]');if(first)first.classList.add("active");
  });
})();
