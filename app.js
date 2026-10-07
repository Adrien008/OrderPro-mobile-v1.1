/*
 * OrderPro - application de gestion de commandes (PWA, hors-ligne).
 * Toutes les données restent dans le navigateur (localStorage) : aucun serveur distant.
 * Contact officiel : voir APP.contact ci-dessous.
 */
(function(){
var APP={nom:"OrderPro",contact:"nlompaaadrien@gmail.com",version:"1.8.14",essai:5,secret:"ac1b66d889b9"};
var STI=["Commandée","Acompte reçu","Achetée en Chine","En transit","Arrivée à Douala","Livrée","Annulée"],STS=["Réservée","Acompte reçu","Prête à livrer","Livrée","Annulée"],ST=STI,mode="import";
var active=false,view="real",DEMO="Vague d'exemple",KEY="pc_commandes",data=[],trash=[],devis=[],stk=[],fromDv=0,editId=null,mem=null,shop="";
function load(){try{var v=localStorage.getItem(KEY);if(v)unpack(JSON.parse(v)||[])}catch(e){data=[]}}

// Sauvegarde des commandes (chiffrées si un code PIN est actif)
function store(){if(lsg("pc_enc")==="1"){if(!ek)return;var snap=JSON.stringify(pack()),kk=ek,sl=eSalt;encQ=encQ.then(function(){return encBlob(kk,sl,snap)}).then(function(b){lss("pc_commandes_enc",b)}).catch(function(){})}else{try{localStorage.setItem(KEY,JSON.stringify(pack()))}catch(e){}}warn()}
function $(i){return document.getElementById(i)}
function sync(c){c.total=0;c.qte=0;var names=[];c.items.forEach(function(i){c.total+=num(i.t);c.qte+=num(i.q)||1;names.push(i.p)});c.produit=names.join(", ");c.acompte=0;c.pays.forEach(function(x){c.acompte+=num(x.m)});c.cout=num(c.cout)}

// Mise en forme d'une commande (articles, versements, totaux)
function norm(c){if(!c.items)c.items=[{p:c.produit||"",q:c.qte||1,t:num(c.total)}];if(!c.pays)c.pays=num(c.acompte)>0?[{d:"",m:num(c.acompte)}]:[];sync(c)}
function fmt(x){return Math.round(x||0).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g," ")}
function num(v){var x=parseFloat(v);return isFinite(x)&&x>0?x:0}
function opt(sel,vals,first){sel.innerHTML="";if(first){var o=document.createElement("option");o.value="";o.textContent=first;sel.appendChild(o)}
vals.forEach(function(v){var o=document.createElement("option");o.value=v;o.textContent=v;sel.appendChild(o)})}
function waves(){var s=[];data.forEach(function(c){if(!c.demo&&c.vague&&s.indexOf(c.vague)<0)s.push(c.vague)});return s}
function refreshFilters(){var v=$("fv").value,s=$("fs").value;var hd=data.some(function(c){return c.demo});opt($("fv"),waves(),"Tous les Client ID");opt($("fs"),ST,"Tous les statuts");var zv=$("fz").value;opt($("fz"),zones(),"Toutes les zones");$("fz").value=zones().indexOf(zv)>-1?zv:"";fillQ();
$("fv").value=waves().indexOf(v)>-1?v:"";$("fs").value=s;opt($("vagues"),waves())}

// ===== LISTE DES COMMANDES : filtres, recherche, affichage =====
function shown(){var z=$("fz").value,v=$("fv").value,s=$("fs").value,q=$("fq").value.trim().toLowerCase();
return data.filter(function(c){return(view==="demo"?!!c.demo:(!c.demo&&(!v||c.vague===v)))&&(!s||c.statut===s)&&(!z||(c.zone||"")===z)&&qmatch(c)&&(!q||noacc([c.nom,c.tel,c.vague,c.ville,c.zone].join(" ")).indexOf(noacc(q))>-1)})}
function reste(c){return Math.max(0,num(c.total)-num(c.acompte))}

// Affichage de la liste, du tableau de bord et des cartes de commande
function render(){
var dm=view==="demo";updateWaitBar();updMode();renderHome();$("demobar").hidden=!dm;$("add").hidden=dm;$("fv").parentNode.hidden=dm;$("t-real").className=dm?"alt":"";$("t-demo").className=dm?"":"alt";
var l=shown(),t=0,e=0,r=0,n=0,bf=0,hb=false;
l.forEach(function(c){if(c.statut==="Annulée")return;n++;t+=num(c.total);e+=num(c.acompte);r+=reste(c);if(c.cout>0){hb=true;bf+=num(c.total)-c.cout}});
$("dtitle").textContent="Statistiques";
$("s-n").textContent=n;$("s-t").textContent=fmt(t)+" F";$("s-e").textContent=fmt(e)+" F";$("s-r").textContent=fmt(r)+" F";$("s-bw").hidden=!hb;$("s-b").textContent=fmt(bf)+" F";
var box=$("list");box.innerHTML="";
/* La version Windows utilise un tableau lisible et filtrable. Le mobile et le navigateur conservent les cartes existantes. */
if(window.desktop&&window.desktop.tableMode!==false){renderPcTable(l);return}
if(!l.length){var d=document.createElement("div");d.className="empty";d.textContent=data.length?"Aucune commande ne correspond aux filtres.":"Aucune commande. Appuie sur « Nouvelle commande » pour commencer.";box.appendChild(d);return}
l.forEach(function(c){
var k=document.createElement("div");k.className="card";
var h=document.createElement("h3");h.textContent=c.nom;k.appendChild(h);
var bd=badge(c);k.style.borderLeft="5px solid "+bd.color;var bde=mk("div",{className:"meta",textContent:bd.icon+" "+bd.txt});bde.style.cssText="margin:4px 0;font-weight:700";k.appendChild(bde);
if(c.statut!=="Livrée"&&c.statut!=="Annulée"){var lv=reste(c)>0,lb=mk("span",{className:"amt",textContent:lv?"À ENCAISSER ("+fmt(reste(c))+" FCFA)":"LIVRAISON SIMPLE (0 FCFA)"});lb.style.cssText="display:inline-block;margin:2px 0 6px;padding:4px 10px;border-radius:999px;font-weight:700;font-size:.78rem;font-family:system-ui,sans-serif;color:#fff;background:"+(lv?"#e08a00":"#1f9d55");k.appendChild(lb)}
var m=document.createElement("div");m.className="meta";m.textContent=c.vague+" · "+c.tel+(c.ville?" · "+c.ville:"")+(c.zone?" · "+c.zone:"")+(c.rel?" · Relancé il y a "+ago(c.rel):"");k.appendChild(m);
if(c.wait){var wt=mk("div",{className:"meta"});wt.style.cssText="margin-top:6px;color:var(--red);font-weight:600";wt.textContent="En attente de réponse depuis "+ago(c.wait)+" ";var wb=mk("button",{type:"button",className:"alt",textContent:"Le client a répondu"});wb.style.cssText="padding:6px 10px;font-size:.8rem;margin-left:6px";wb.addEventListener("click",function(){c.wait=0;c.waN=false;store();render()});wt.appendChild(wb);k.appendChild(wt)}
var p=document.createElement("div");p.style.marginTop="6px";p.textContent=c.items.map(function(i){var sp=specOf(i);return i.q+" × "+i.p+(sp?" ("+sp+")":"")}).join(", ")+(c.note?" · "+c.note:"");k.appendChild(p);
var r1=document.createElement("div");r1.className="row";
r1.innerHTML="<span>Total <b></b></span><span>Acompte <b></b></span><span>Reste <b class='left'></b></span>";
var bs=r1.querySelectorAll("b");bs[0].textContent=fmt(c.total);bs[1].textContent=fmt(c.acompte);bs[2].textContent=fmt(reste(c));k.appendChild(r1);
var s=document.createElement("select");s.setAttribute("aria-label","Statut");s.style.marginTop="10px";opt(s,ST);s.value=c.statut;
s.addEventListener("change",function(){var mo=stockMap(c);c.statut=s.value;c.su=today();stockApply(mo,stockMap(c));store();render()});k.appendChild(s);
var b=document.createElement("div");b.className="btns";
[["Relancer sur WhatsApp",function(){openWa(c)},""],["Envoyer le reçu",function(){openWa(c,"rec")},"alt"],["Reçu en image",function(){showRecuImg(c)},"alt"],["Modifier",function(){openForm(c)},"alt"],["Supprimer",function(){delOrder(c)},"del"]].forEach(function(a){
var z=document.createElement("button");z.type="button";z.textContent=a[0];z.className=a[2];z.addEventListener("click",a[1]);b.appendChild(z)});
if(!c.demo&&validTel(c.tel)){b.appendChild(mk("a",{href:"tel:+"+digits(c.tel),className:"btnalt",textContent:"Appeler"}))}
swipe(k,c);
k.appendChild(b);box.appendChild(k)})}
/* Tableau professionnel de la version PC : une ligne par commande, avec actions rapides. */
function renderPcTable(rows){
var box=$("list");box.innerHTML="";
if(!rows.length){var empty=document.createElement("div");empty.className="empty";empty.textContent=data.length?"Aucune commande ne correspond aux filtres.":"Aucune commande. Appuie sur « Nouvelle commande » pour commencer.";box.appendChild(empty);return}
var wrap=mk("div",{className:"pc-table-wrap"}),table=mk("table",{className:"pc-order-table"});
table.setAttribute("aria-label","Tableau des commandes");
var heads=["Client ID","Client / WhatsApp","Produits","Total","Versé","Reste","Statut","Échéance","Ville / zone","Commande","Actions"];
var thead=document.createElement("thead"),hr=document.createElement("tr");
heads.forEach(function(h){var th=document.createElement("th");th.scope="col";th.textContent=h;hr.appendChild(th)});thead.appendChild(hr);table.appendChild(thead);
var tb=document.createElement("tbody");
rows.forEach(function(c){
var tr=document.createElement("tr");tr.className=c.statut==="Annulée"?"is-cancelled":"";
function cell(text,cls){var td=document.createElement("td");if(cls)td.className=cls;td.textContent=text==null||text===""?"—":text;return td}
tr.appendChild(cell(c.vague||"—","pc-id"));
var who=document.createElement("td");who.className="pc-who";var bd=badge(c),dot=document.createElement("span");dot.className="pc-urgency-dot pc-urgency-"+bd.k;dot.title=bd.txt;dot.setAttribute("aria-label",bd.txt);dot.style.background=bd.color;var wh=document.createElement("div");wh.className="pc-who-head";wh.appendChild(dot);var nm=document.createElement("strong");nm.textContent=c.nom||"Client sans nom";wh.appendChild(nm);who.appendChild(wh);var tel=document.createElement("span");tel.textContent=fmtT(c.tel);who.appendChild(tel);tr.appendChild(who);
tr.appendChild(cell(itemsS(c),"pc-products"));
tr.appendChild(cell(fmt(c.total)+" F","pc-money"));
tr.appendChild(cell(fmt(c.acompte)+" F","pc-money"));
tr.appendChild(cell(fmt(reste(c))+" F",reste(c)>0?"pc-money pc-due":"pc-money pc-paid"));
var st=document.createElement("td");st.className="pc-status-cell";var select=document.createElement("select");select.className="pc-status";select.setAttribute("aria-label","Statut de "+(c.nom||"la commande"));opt(select,ST);select.value=c.statut;select.addEventListener("change",function(){var oldMap=stockMap(c);c.statut=select.value;c.su=today();stockApply(oldMap,stockMap(c));store();render()});st.appendChild(select);tr.appendChild(st);
var dueDate=c.echeance?dfr(c.echeance):"—",dueCls=c.echeance&&c.echeance<today()&&reste(c)>0?"pc-date pc-overdue":"pc-date";tr.appendChild(cell(dueDate,dueCls));
var loc=document.createElement("td");loc.className="pc-location";var city=document.createElement("strong");city.textContent=c.ville||"Ville non précisée";loc.appendChild(city);if(c.zone){var zone=document.createElement("span");zone.textContent=c.zone;loc.appendChild(zone)}if(c.adresse){var adr=document.createElement("span");adr.textContent=c.adresse;loc.appendChild(adr)}tr.appendChild(loc);
tr.appendChild(cell(cday(c)?dfr(cday(c)):"—","pc-date"));
var actions=document.createElement("td");actions.className="pc-actions";
function action(label,cls,fn){var b=document.createElement("button");b.type="button";b.className=cls||"";b.textContent=label;b.addEventListener("click",fn);actions.appendChild(b)}
if(c.demo){action("Voir message","alt",function(){openWa(c)})}else{action("WhatsApp","",function(){openWa(c)});action("Reçu","alt",function(){showRecuImg(c)});action("Modifier","alt",function(){openForm(c)});action("Supprimer","del",function(){delOrder(c)})}
tr.appendChild(actions);tb.appendChild(tr)
});
table.appendChild(tb);wrap.appendChild(table);box.appendChild(wrap)
}

var fItems=[],fPays=[];
function mk(tag,at){var e=document.createElement(tag);for(var k in at)e[k]=at[k];return e}
function today(){var d=new Date();return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}

// Lignes produits : quantité, prix, genre, taille/pointure, couleur
function drawItems(){var b=$("f-items");b.innerHTML="";
fItems.forEach(function(it,i){var r=mk("div",{className:"g2"});r.style.cssText="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--line)";
if(!it.g)it.g=guessG(it.p);
var a=mk("input",{value:it.p,placeholder:"Produit"});a.style.gridColumn="1 / 3";
var q=mk("input",{type:"number",value:it.q,placeholder:"Quantité"});q.min=1;q.inputMode="numeric";q.addEventListener("input",function(){it.q=num(q.value)||1;calcReste()});
var t=mk("input",{type:"number",value:it.t||"",placeholder:"Prix de la ligne (FCFA)"});t.inputMode="numeric";t.addEventListener("input",function(){it.t=num(t.value);calcReste()});
var gw=mk("div",{});gw.style.gridColumn="1 / 3";gw.appendChild(mk("label",{textContent:"Genre du produit (pour « ton / ta / tes » dans le message)"}));
var gs=mk("select",{});[["m","Masculin : ton, le"],["f","Féminin : ta, la"],["p","Pluriel : tes, les"]].forEach(function(o){gs.appendChild(mk("option",{value:o[0],textContent:o[1]}))});gs.value=it.g;
gs.addEventListener("change",function(){it.g=gs.value;it.gm=true});gw.appendChild(gs);
a.setAttribute("list","plist");
a.addEventListener("input",function(){it.p=a.value;if(!it.gm){it.g=guessG(a.value);gs.value=it.g}s.placeholder=SHOE.test(noacc(it.p||""))?"Pointure":"Taille"});
a.addEventListener("change",function(){var m=prodMem()[a.value.trim().toLowerCase()];if(!m)return;if(!num(it.t)&&m.u){it.t=Math.round(m.u*(num(it.q)||1));t.value=it.t}if(!it.gm&&m.g){it.g=m.g;gs.value=m.g;it.gm=true}calcReste()});
var s=mk("input",{value:it.s||"",placeholder:SHOE.test(noacc(it.p||""))?"Pointure":"Taille"});s.style.gridColumn="1 / 3";
var nk=mk("label",{});nk.style.cssText="grid-column:1 / 3;display:flex;gap:8px;align-items:center;margin:0";
var ck=mk("input",{type:"checkbox",checked:!!it.n});ck.style.cssText="width:auto;margin:0";nk.appendChild(ck);nk.appendChild(document.createTextNode("Pas de taille/pointure"));
function sz(){s.disabled=ck.checked;if(ck.checked){s.value="";it.s=""}s.placeholder=ck.checked?"Pas de taille/pointure":"Taille/Pointure"}
ck.addEventListener("change",function(){it.n=ck.checked;sz()});s.addEventListener("input",function(){it.s=s.value.trim()});sz();
var co=mk("input",{value:it.co||"",placeholder:"Couleur"});co.style.gridColumn="1 / 3";co.addEventListener("input",function(){it.co=co.value.trim()});
r.appendChild(a);r.appendChild(q);r.appendChild(t);r.appendChild(gw);r.appendChild(s);r.appendChild(nk);r.appendChild(co);
if(fItems.length>1){var x=mk("button",{type:"button",className:"del",textContent:"Retirer ce produit"});x.style.gridColumn="1 / 3";x.addEventListener("click",function(){fItems.splice(i,1);drawItems();calcReste()});r.appendChild(x)}
b.appendChild(r)})}
function drawPays(){var b=$("f-pays");b.innerHTML="";
fPays.forEach(function(p,i){var r=mk("div",{className:"g2"});r.style.marginBottom="6px";
var d=mk("input",{type:"date",value:p.d||""});d.addEventListener("input",function(){p.d=d.value});
var m=mk("input",{type:"number",value:p.m||"",placeholder:"Montant (FCFA)"});m.inputMode="numeric";m.addEventListener("input",function(){p.m=num(m.value);calcReste()});
var x=mk("button",{type:"button",className:"del",textContent:"Retirer ce versement"});x.style.gridColumn="1 / 3";x.addEventListener("click",function(){fPays.splice(i,1);drawPays();calcReste()});
var pm=mk("select",{});opt(pm,PAYM,"Mode de paiement");pm.value=p.mode||"";pm.addEventListener("change",function(){p.mode=pm.value});
var rf=mk("input",{value:p.ref||"",placeholder:"Référence (n° de transaction)"});rf.addEventListener("input",function(){p.ref=rf.value.trim()});
r.appendChild(d);r.appendChild(m);r.appendChild(pm);r.appendChild(rf);r.appendChild(x);b.appendChild(r)})}
function calcReste(){var t=0,p=0;fItems.forEach(function(i){t+=num(i.t)});fPays.forEach(function(x){p+=num(x.m)});
$("f-reste").textContent="Total : "+fmt(t)+" FCFA · Versé : "+fmt(p)+" FCFA · Reste à payer : "+fmt(Math.max(0,t-p))+" FCFA"}
$("add-item").addEventListener("click",function(){fItems.push({p:"",q:1,t:0});drawItems()});
$("add-pay").addEventListener("click",function(){fPays.push({d:today(),m:0,mode:lsg("pc_pm")||"",ref:""});drawPays();calcReste()});

// ===== FORMULAIRE DE COMMANDE (création et modification) =====
function fillClientSuggestions(){var dl=$("clients-list");if(!dl)return;dl.innerHTML="";clientList().forEach(function(e){var o=document.createElement("option");o.value=e.nom;o.label=fmtT(e.tel)+(e.zone?" · "+e.zone:"");dl.appendChild(o)})}
function useExistingClient(){var name=noacc($("f-nom").value.trim()),e=clientList().filter(function(x){return noacc(x.nom)===name})[0];if(!e){$("f-client-hint").textContent="Nouveau client : vérifie le nom et le numéro WhatsApp.";return}
$("f-tel").value=e.tel||"+237 ";if(!$("f-vague").value.trim())$("f-vague").value=e.id||"";if(e.ville){$("f-ville").value=e.ville;fillQ()}$("f-adresse").value=e.adresse||"";$("f-zone").value=e.zone||"";$("f-note").value=e.note||"";$("f-lang").value=e.lang||"fr";$("f-client-hint").textContent="Coordonnées reprises de la fiche client : "+fmtT(e.tel)+(e.zone?" · "+e.zone:"")}
$("f-nom").addEventListener("change",useExistingClient);
$("f-nom").addEventListener("blur",useExistingClient);
function openForm(c){editId=c?c.id:null;$("mt").textContent=c?"Modifier la commande":"Nouvelle commande";
fillClientSuggestions();$("f-client-hint").textContent=c?"Modifie les informations de cette commande sans changer la fiche des autres commandes.":"Choisis un client existant pour reprendre automatiquement ses coordonnées.";
opt($("f-st"),ST);fillPlist();var cur=$("fv").value;
$("f-vague").value=c?c.vague:"";$("f-nom").value=c?c.nom:"";$("f-adresse").value=c?(c.adresse||""):"";$("f-zone").value=c?(c.zone||""):"";opt($("f-ville"),VILLES);$("f-ville").value=(c&&c.ville)||lsg("pc_ville")||"Douala";fillQ();$("f-tel").value=c?c.tel:"+237 ";
fItems=c?c.items.map(function(i){return{p:i.p,q:i.q,t:i.t,g:i.g,gm:!!i.g,s:i.s,n:i.n,co:i.co}}):[{p:"",q:1,t:0}];
fPays=c?c.pays.map(function(x){return{d:x.d,m:x.m,mode:x.mode||"",ref:x.ref||""}}):[];$("f-echeance").value=c?(c.echeance||""):"";$("f-lang").value=(c&&c.lang)||"fr";
$("f-cout").value=c&&c.cout?c.cout:"";
$("f-st").value=c?c.statut:ST[0];$("f-note").value=c?c.note:"";drawItems();drawPays();calcReste();$("m1").classList.add("on")}
$("ok").addEventListener("click",function(){
var old=editId?data.filter(function(x){return x.id===editId})[0]:null;
if(!editId&&!active&&data.filter(function(x){return!x.demo}).length>=APP.essai){alert("Version d'essai limitée à "+APP.essai+" commandes. Active l'application pour continuer.");openAct();return}
var its=fItems.filter(function(i){return String(i.p).trim()}).map(function(i){return{p:String(i.p).trim(),q:num(i.q)||1,t:num(i.t),g:i.g||guessG(i.p),s:i.n?"":String(i.s||"").trim(),n:!!i.n,co:String(i.co||"").trim()}});
var o={id:editId||Date.now(),vague:$("f-vague").value.trim()||(old&&old.vague)||nextCid(fixTel($("f-tel").value)),nom:$("f-nom").value.trim(),tel:fixTel($("f-tel").value),items:its,pays:fPays.filter(function(x){return num(x.m)>0}).map(function(x){return{d:x.d,m:num(x.m),mode:x.mode||"",ref:x.ref||""}}),echeance:$("f-echeance").value||"",cout:num($("f-cout").value),statut:$("f-st").value,note:$("f-note").value.trim(),adresse:$("f-adresse").value.trim(),zone:$("f-zone").value.trim(),ville:$("f-ville").value,lang:$("f-lang").value};
if(old&&old.demo)o.demo=true;
o.su=(old&&old.statut===o.statut)?(old.su||""):today();
qRemember(o.ville,o.zone);lss("pc_ville",o.ville);
if(!o.nom||!its.length){alert("Renseigne au moins le nom du client et un produit.");return}
if(digits(o.tel).length<=3)o.tel="";
if(o.tel&&!validTel(o.tel)){alert("Le numéro WhatsApp semble incomplet. Corrige-le ou efface-le si le client n'en a pas.");return}
sync(o);
var sig=o.items.map(function(i){return noacc(i.p)+"|"+(num(i.q)||1)+"|"+num(i.t)}).join("||"),dup=!editId&&o.tel&&data.filter(function(c){return!c.demo&&c.statut!=="Annulée"&&digits(c.tel)===digits(o.tel)&&c.items.map(function(i){return noacc(i.p)+"|"+(num(i.q)||1)+"|"+num(i.t)}).join("||")===sig})[0];
if(dup&&!confirm("Une commande très similaire existe déjà pour "+dup.nom+" ("+dup.vague+"). Est-ce bien une nouvelle commande ?"))return;
if(o.acompte>o.total&&!confirm("Les versements dépassent le total de la commande. Enregistrer quand même ?"))return;
var oMap=old?stockMap(old):{};
if(editId){data=data.map(function(x){return x.id===editId?o:x})}else{data.push(o)}
stockApply(oMap,stockMap(o));if(fromDv){devis=devis.filter(function(d){return d.id!==fromDv});fromDv=0}
lss("pc_pm",(o.pays.filter(function(p){return p.mode}).pop()||{}).mode||lsg("pc_pm")||"");
store();$("m1").classList.remove("on");refreshFilters();render();stockWarn(stockMap(o))});
$("no").addEventListener("click",function(){$("m1").classList.remove("on")});
$("add").addEventListener("click",function(){openForm(null)});

// ===== MESSAGES WHATSAPP : accords grammaticaux (ton / ta / tes, le / la / les) =====
function noacc(t){return String(t||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
var FEMW=/^(montre|robe|jupe|chemise|chemisette|veste|valise|chaise|lampe|trousse|perruque|ceinture|bague|bouteille|casquette|cravate|echarpe|sacoche|tablette|enceinte|coque|brosse|creme|tondeuse|culotte|chaine|tenue|serviette|couverture|housse|machine|camera|manette|batterie|pochette|banane|besace|poche|boite|bouilloire|poupee|peluche|trottinette|glaciere|gourde|casserole|marmite|assiette|tasse|cuillere|fourchette|nappe|salopette|combinaison|doudoune|parka|blouse|tunique|souris|tele|television|radio|gourmette|paire|jarre|bonnette)$/;
var SHOE=/(basket|chaussure|sandale|sneaker|mocassin|botte|babouche|tong|escarpin|soulier|talon|claquette)/;
function guessG(name){var w=noacc(name).trim().split(/[\s-]+/)[0]||"";if(w.length>3&&/[sx]$/.test(w)&&!/^(pass|bus|gaz|lys)$/.test(w))return"p";if(FEMW.test(w)||/(tte|ette|ure|ance|ence|tion|sion|ade|ine|ise|ille|ice)$/.test(w))return"f";return"m"}
function vow(t){return/^[aeiouyh]/.test(noacc(t).trim())}
function gOf(i){return i.g||guessG(i.p)}
function specOf(i){var a=[],sz=String(i.s||"").trim();if(!i.n&&sz&&!/^pas de taille/i.test(sz))a.push((SHOE.test(noacc(i.p))?"pointure ":"taille ")+sz);var co=String(i.co||"").trim();if(co)a.push("couleur "+co);return a.join(", ")}
function qn(i){return num(i.q)||1}
function itemTxt(i,sp){var q=qn(i),g=gOf(i),s=sp?specOf(i):"";if(q>1)return"tes articles ("+q+" × "+i.p+(s?", "+s:"")+")";var w=g==="p"?"tes":(g==="f"&&!vow(i.p)?"ta":"ton");return w+" "+i.p+(s?" ("+s+")":"")}
function lst(a){return a.length>1?a.slice(0,-1).join(", ")+" et "+a[a.length-1]:(a[0]||"")}
function refs(c,sp){return lst(c.items.map(function(i){return itemTxt(i,sp)}))}
function art(i,k){var q=qn(i),g=gOf(i);if(q>1||g==="p")return k==="de"?"des ":"les ";if(vow(i.p))return k==="de"?"de l'":"l'";return k==="de"?(g==="f"?"de la ":"du "):(g==="f"?"la ":"le ")}
function defs(c,k){return lst(c.items.map(function(i){if(qn(i)>1)return(k==="de"?"des":"les")+" articles ("+qn(i)+" × "+i.p+")";return art(i,k)+i.p}))}
function names(c){return c.items.map(function(i){return(qn(i)>1?qn(i)+" × ":"")+i.p}).join(", ")}
function plur(c){return c.items.length>1||qn(c.items[0])>1||gOf(c.items[0])==="p"}
function est(c){return plur(c)?"sont":"est"}
function sfx(c){if(plur(c))return c.items.every(function(i){return gOf(i)==="f"&&qn(i)===1})?"es":"s";return gOf(c.items[0])==="f"?"e":""}
function pr(c){return plur(c)?"les":(gOf(c.items[0])==="f"?"la":"le")}

// Message au client selon le statut de la commande
function msg(c){var n=c.nom.split(" ")[0],b="Bonjour "+n+", ",R=refs(c),S=sfx(c),E=est(c),st=mode==="stock";
switch(c.statut){
case"Réservée":return b+"merci pour ta commande : "+refs(c,1)+". Total : "+fmt(c.total)+" FCFA. Peux-tu verser l'acompte pour que je mette de côté "+defs(c,"")+" ?";
case"Prête à livrer":return b+R+" "+E+" prêt"+S+" ! "+(reste(c)?"Il reste "+fmt(reste(c))+" FCFA à régler. ":"")+"Quand passes-tu "+pr(c)+" récupérer, ou préfères-tu être livré(e) ?";
case"Commandée":return b+"merci pour ta commande : "+refs(c,1)+". Total : "+fmt(c.total)+" FCFA. Peux-tu verser l'acompte pour que je lance l'achat "+defs(c,"de")+" ?";
case"Acompte reçu":return b+"j'ai bien reçu ton acompte de "+fmt(c.acompte)+" FCFA pour "+refs(c,1)+". "+(st?"Ta commande est réservée.":"Je lance l'achat bientôt.")+" Reste à payer : "+fmt(reste(c))+" FCFA.";
case"Achetée en Chine":return b+"bonne nouvelle : "+R+" "+E+" acheté"+S+" en Chine. Je te tiens au courant pour l'expédition.";
case"En transit":return b+R+" "+E+" en route vers le Cameroun. Je te préviens dès l'arrivée à Douala.";
case"Arrivée à Douala":return b+R+" "+E+" arrivé"+S+" à Douala ! "+(reste(c)?"Il reste "+fmt(reste(c))+" FCFA à régler avant la livraison. ":"")+"Quand peut-on organiser la remise ?";
case"Livrée":return b+"merci pour ta confiance ! Si tu es satisfait(e) de "+R+", n'hésite pas à en parler autour de toi. "+(st?"":"La prochaine vague arrive bientôt.");
default:return b+"ta commande de "+names(c)+" a été annulée. N'hésite pas à me contacter si tu as une question."}}
function digits(t){var d=(t||"").replace(/\D/g,"");if(d.indexOf("00")===0)d=d.slice(2);while(d.indexOf("237237")===0)d=d.slice(3);if(d.indexOf("237")===0&&d.length===13&&d[3]==="0")d=d.slice(0,3)+d.slice(4);if(d.length===10&&d[0]==="0")d=d.slice(1);if(d.length===9)d="237"+d;return d}
function fixTel(t){var d=digits(t);return d.length>=11?"+"+d:t.trim()}
function upd(){var d=digits(mem.tel),ok=!mem.demo&&(d.indexOf("237")===0?d.length===12:(d.length>=11&&d.length<=15)),t=$("wa-to");
$("wa-go").href=ok?"https://api.whatsapp.com/send?phone="+d+"&text="+encodeURIComponent($("wa-txt").value):"#";
t.style.color=ok||mem.demo?"":"var(--red)";t.textContent=mem.demo?"Exemple : numéros fictifs, l'envoi WhatsApp est désactivé. Tu peux quand même copier le message.":ok?"Envoi à : +"+d:"Numéro invalide ("+(mem.tel||"vide")+"). Corrige-le avec « Modifier » : 9 chiffres, avec ou sans +237."}
$("wa-go").addEventListener("click",function(e){if(this.getAttribute("href")==="#"){e.preventDefault()}});
$("wa-cp").addEventListener("click",function(){var b=this;function ok(){b.textContent="Copié ✓"}try{navigator.clipboard.writeText($("wa-txt").value).then(ok,function(){$("wa-txt").select()})}catch(e){$("wa-txt").select()}})
function dfr(d){return d&&/^\d{4}-\d{2}-\d{2}$/.test(d)?d.slice(8)+"/"+d.slice(5,7)+"/"+d.slice(0,4):""}
function receipt(c){var L=["*Reçu – "+(shop||APP.nom)+"*","Client : "+c.nom,"","Produits :"];
c.items.forEach(function(i){var sp=specOf(i);L.push("- "+i.q+" × "+i.p+(sp?" ("+sp+")":"")+" : "+fmt(i.t)+" FCFA")});
L.push("","Total : "+fmt(c.total)+" FCFA","Versements :");
if(!c.pays.length)L.push("- aucun");
c.pays.forEach(function(x){L.push("- "+(dfr(x.d)||"date non précisée")+" : "+fmt(x.m)+" FCFA"+(x.mode?" ("+x.mode+(x.ref?", réf. "+x.ref:"")+")":""))});
L.push("Total versé : "+fmt(c.acompte)+" FCFA","Reste à payer : "+fmt(reste(c))+" FCFA");if(c.echeance&&reste(c)>0)L.push("Échéance du solde : "+dfr(c.echeance));L.push("","Merci pour ta confiance !");return L.join("\n")}
function remind(c){return "Bonjour "+c.nom.split(" ")[0]+", petit rappel : il reste "+fmt(reste(c))+" FCFA à régler pour ta commande de "+names(c)+". Tu peux me confirmer quand tu peux payer ? Merci."}
var waKind="";

// Ouverture de WhatsApp avec le message préparé
function openWa(c,k){mem=c;waKind=k||"";$("wa-cp").textContent="Copier le message";$("wa-txt").value=(c.lang==="en"?(k==="rem"?remindEn(c):k==="rec"?receiptEn(c):msgEn(c)):(k==="rem"?remind(c):k==="rec"?receipt(c):msg(c)))+(shop&&k!=="rec"?"\n— "+shop:"");upd();$("m2").classList.add("on")}
$("wa-txt").addEventListener("input",upd);$("wa-x").addEventListener("click",function(){$("m2").classList.remove("on")});
["fv","fs","fq","fz"].forEach(function(i){$(i).addEventListener("input",render)});
function dl(name,text,type){var a=document.createElement("a");a.href="data:"+type+";charset=utf-8,"+encodeURIComponent(text);a.download=name;
var ok=false;try{a.click();ok=true}catch(e){}return ok}
function shareOrDownloadBackup(text,name,type){try{var fl=new File([text],name,{type:type});if(navigator.canShare&&navigator.canShare({files:[fl]})){navigator.share({files:[fl],title:"Sauvegarde OrderPro"}).then(stamp,function(e){if(!e||e.name!=="AbortError")dl(name,text,type)});return}}catch(e){}dl(name,text,type);stamp()}
$("save").addEventListener("click",function(){
  if(lsg("pc_enc")!=="1"||!ek){alert("Active d'abord la protection par code PIN : une sauvegarde non chiffrée n'est pas autorisée.");$("m7").classList.add("on");return}
  var txt=JSON.stringify(pack().filter(function(c){return!c.demo}));
  encBlob(ek,eSalt,txt).then(function(packet){shareOrDownloadBackup(packet,"sauvegarde-orderpro.opbak","application/json")}).catch(function(){alert("Impossible de chiffrer la sauvegarde.")});
});
function applyBackupData(d,pin){if(!Array.isArray(d))throw 0;if(lsg("pc_enc")!=="1"&&!pin){alert("Active d'abord la protection par code PIN, puis restaure cette ancienne sauvegarde.");$("m7").classList.add("on");return}if(!confirm("Remplacer les données actuelles par cette sauvegarde ("+cntOrders(d)+" commandes) ?"))return;
unpack(d);data.forEach(norm);
function done(){store();refreshFilters();render();stamp();alert("Sauvegarde restaurée et protégée.")}
if(pin&&lsg("pc_enc")!=="1"&&canCrypto)enableEnc(pin).then(function(ok){if(ok)done();else alert("Impossible de protéger cette restauration.")});else done()}
function restoreBackupText(raw){var obj;try{obj=JSON.parse(raw)}catch(e){alert("Fichier invalide.");return}
if(obj&&obj.v===1&&obj.s&&obj.i&&obj.d){
  var salt;try{salt=unb64(obj.s)}catch(e){alert("Sauvegarde chiffrée invalide.");return}
  function decryptWith(pin){return deriveKey(pin,salt).then(function(k){return decBlob(k,obj).then(function(t){applyBackupData(JSON.parse(t),pin)})})}
  var pin=prompt("Entre le code PIN de cette sauvegarde chiffrée :");if(!pin)return;
  decryptWith(pin).catch(function(){alert("PIN incorrect ou sauvegarde illisible.")});return
}
if(Array.isArray(obj)){if(confirm("Cette ancienne sauvegarde n'est pas chiffrée. Elle sera protégée après restauration. Continuer ?")){applyBackupData(obj,"")};return}
alert("Format de sauvegarde inconnu.")}
$("load").addEventListener("click",function(){$("file").click()});
$("file").addEventListener("change",function(){var f=this.files[0];if(!f)return;var r=new FileReader();r.onload=function(){restoreBackupText(r.result)};r.readAsText(f);this.value=""});

// ===== STOCKAGE LOCAL : lecture / écriture dans le navigateur (localStorage) =====
function lsg(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lss(k,v){try{localStorage.setItem(k,v)}catch(e){}}
function head(){shop=lsg("pc_shop")||"";$("brand").textContent=shop||APP.nom;document.title=shop||APP.nom}
function stamp(){lss("pc_bk",String(Date.now()));warn()}
function warn(){var t=+lsg("pc_bk")||0,w=$("warn"),fq=bkFreq();w.innerHTML="";w.style.borderLeft="";
if(lsg("pc_enc")!=="1"){w.textContent="Protection recommandée : active un code PIN pour chiffrer tes données et sauvegardes.";w.style.borderLeft="5px solid var(--red)";var pb=mk("button",{type:"button",textContent:"Activer la protection"});pb.style.cssText="display:block;margin-top:8px";pb.addEventListener("click",function(){$("m7").classList.add("on")});w.appendChild(pb);return}
if(!data.some(function(c){return!c.demo})){w.textContent="Tes données restent dans ce navigateur. Pense à faire une sauvegarde régulièrement.";return}
var d=t?Math.floor((Date.now()-t)/864e5):null,late=d===null||(fq>0&&d>=fq);
w.textContent=d===null?"Aucune sauvegarde faite. Protège tes données maintenant.":late?"Dernière sauvegarde il y a "+d+" jour(s) : il est temps d'en refaire une.":"Dernière sauvegarde il y a "+d+" jour(s). C'est bon.";
if(late){w.style.borderLeft="5px solid var(--red)";var bt=mk("button",{type:"button",textContent:"Sauvegarder maintenant"});bt.style.cssText="display:block;margin-top:8px";bt.addEventListener("click",function(){$("save").click()});w.appendChild(bt)}}
var TOS={"Commandée":"Réservée","Achetée en Chine":"Acompte reçu","En transit":"Acompte reçu","Arrivée à Douala":"Prête à livrer"},TOI={"Réservée":"Commandée","Prête à livrer":"Arrivée à Douala"};
function setMode(m){mode=m==="stock"?"stock":"import";ST=mode==="stock"?STS:STI;$("g-st").textContent="Change le statut au fil de l'avancement : "+ST.join(", ")+".";var cv=$("conv-btn");if(cv)cv.hidden=mode!=="import"}
function applyMode(nm){if(nm===mode)return;var mp=nm==="stock"?TOS:TOI;data.forEach(function(c){if(mp[c.statut])c.statut=mp[c.statut]});setMode(nm);lss("pc_mode",nm);store();refreshFilters();render()}
$("w-go").addEventListener("click",function(){var v=$("w-nom").value.trim();if(!v){alert("Écris le nom de ta boutique.");return}lss("pc_shop",v);lss("pc_seen","1");head();applyMode($("w-mode").value);$("m3").classList.remove("on")});
function loadDemo(){var t=Date.now(),s2=mode==="stock"?"Prête à livrer":"En transit";
data=data.filter(function(c){return!c.demo});
[["Awa Ndiaye","+237 600000001","Sac à main",1,18000,9000,"Acompte reçu","noir"],["Paul Mbarga","+237 600000002","Baskets",2,45000,15000,s2,"pointure 42"],["Carine Fouda","+237 600000003","Montre",1,12000,12000,"Livrée",""]].forEach(function(a,i){data.push({id:t+i,demo:true,vague:DEMO,nom:a[0],tel:a[1],produit:a[2],qte:a[3],total:a[4],acompte:a[5],statut:a[6],note:a[7],cout:Math.round(a[4]*.7)})});
data.forEach(norm);store();view="demo";refreshFilters();render()}
$("w-demo").addEventListener("click",function(){lss("pc_seen","1");applyMode($("w-mode").value);loadDemo();$("m3").classList.remove("on")});
$("d-load").addEventListener("click",loadDemo);
$("d-del").addEventListener("click",function(){data=data.filter(function(c){return!c.demo});store();view="real";$("fv").value="";refreshFilters();render()});
$("t-real").addEventListener("click",function(){view="real";render()});
$("t-demo").addEventListener("click",function(){if(data.some(function(c){return c.demo})){view="demo";render()}else loadDemo()});
$("rename").addEventListener("click",function(){$("w-nom").value=shop;$("w-mode").value=mode;$("m3").classList.add("on")});
$("guide").addEventListener("click",function(){$("m4").classList.add("on")});
$("g-x").addEventListener("click",function(){$("m4").classList.remove("on")});
var fo=$("foot");fo.textContent=APP.nom+" v"+APP.version+" · Contact : ";var ma=mk("a",{href:"mailto:"+APP.contact,textContent:APP.contact});ma.style.color="inherit";fo.appendChild(ma);fo.appendChild(document.createTextNode(" · Outil fourni tel quel, sans garantie en cas de perte de données : fais des sauvegardes."));
function dettes(){var l=data.filter(function(c){return!!c.demo===(view==="demo")&&c.statut!=="Annulée"&&reste(c)>0}).sort(function(a,b){return reste(b)-reste(a)});
var tot=0;l.forEach(function(c){tot+=reste(c)});
$("d-tot").textContent=l.length?l.length+" client(s) · "+fmt(tot)+" FCFA à recevoir":"Personne ne te doit d'argent.";
var b=$("d-list");b.innerHTML="";
l.forEach(function(c){var d=mk("div",{className:"card"});d.appendChild(mk("h3",{textContent:c.nom}));
d.appendChild(mk("div",{className:"meta",textContent:c.vague+" · "+c.statut}));
var r=mk("div",{className:"row"});r.innerHTML="<span>Reste à payer</span><b class='left'></b>";r.querySelector("b").textContent=fmt(reste(c))+" FCFA";d.appendChild(r);
var z=mk("button",{type:"button",textContent:"Relancer le solde"});z.style.marginTop="8px";z.addEventListener("click",function(){openWa(c,"rem")});d.appendChild(z);b.appendChild(d)});
$("m5").classList.add("on")}
$("dettes").addEventListener("click",dettes);$("d-x").addEventListener("click",function(){$("m5").classList.remove("on")});
function h53(str){var h1=0xdeadbeef,h2=0x41c6ce57;for(var i=0,ch;i<str.length;i++){ch=str.charCodeAt(i);h1=Math.imul(h1^ch,2654435761);h2=Math.imul(h2^ch,1597334677)}
h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);return 4294967296*(2097151&h2)+(h1>>>0)}
function mkCode(id){return h53(APP.secret+":"+digits(id)).toString(36).toUpperCase().padStart(11,"0").slice(0,8)}
var LIC=window.ORDERPRO_LICENSE_CONFIG||{};
function remoteLicenseOn(){return!!(LIC.apiUrl&&LIC.publicKey&&window.fetch&&window.crypto&&crypto.subtle)}
function deviceId(){var id=lsg("pc_device_id");if(!id){var a=crypto.getRandomValues(new Uint8Array(16)),h=[];for(var i=0;i<a.length;i++)h.push(("0"+a[i].toString(16)).slice(-2));id=h.join("");lss("pc_device_id",id)}return id}
function b64Bytes(v){v=v.replace(/-/g,"+").replace(/_/g,"/");while(v.length%4)v+="=";var b=atob(v),a=new Uint8Array(b.length);for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i);return a}
function pemBytes(p){return b64Bytes(String(p).replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g,"").replace(/\s/g,""))}
function hexBytes(a){var h=[];for(var i=0;i<a.length;i++)h.push(("0"+a[i].toString(16)).slice(-2));return h.join("")}
function remoteTokenPayload(token){
if(!token)return Promise.resolve(null);var x=String(token).split(".");if(x.length!==2)return Promise.resolve(null);var body=x[0],sig=b64Bytes(x[1]),p;try{p=JSON.parse(new TextDecoder().decode(b64Bytes(body)))}catch(e){return Promise.resolve(null)}
if(p.iss!==(LIC.appId||"com.adcl.orderpro")||!p.licenseKey||+p.expiresAt<=Date.now()||+p.offlineUntil<=Date.now())return Promise.resolve(null);
return crypto.subtle.importKey("spki",pemBytes(LIC.publicKey),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["verify"]).then(function(k){return crypto.subtle.verify({name:"RSASSA-PKCS1-v1_5"},k,sig,new TextEncoder().encode(body))}).then(function(ok){if(!ok)return null;return crypto.subtle.digest("SHA-256",new TextEncoder().encode("orderpro-device-v1:"+deviceId())).then(function(d){return hexBytes(new Uint8Array(d))===p.device?p:null})}).catch(function(){return null})}
function remoteActivate(key){
return fetch(String(LIC.apiUrl).replace(/\/$/,"")+"/v1/activate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({licenseKey:key,deviceId:deviceId(),appId:LIC.appId||"com.adcl.orderpro"})}).then(function(r){return r.json().then(function(x){if(!r.ok||!x.ok)throw new Error(x.error||"activation_failed");return x})}).then(function(x){return remoteTokenPayload(x.token).then(function(p){if(!p)throw new Error("token_invalid");lss("pc_license_token",x.token);lss("pc_act_id",key);active=true;$("act-btn").hidden=true;return p})})}
function checkAct(){
var id=lsg("pc_act_id")||"",cd=lsg("pc_act_code")||"";
if(remoteLicenseOn()){
 active=false;var tk=lsg("pc_license_token");
 if(tk)remoteTokenPayload(tk).then(function(p){active=!!p;if(!p)lsd("pc_license_token");$("act-btn").hidden=active});
 else $("act-btn").hidden=false;
 return
}
active=!!id&&cd===mkCode(id);$("act-btn").hidden=active
}
function openAct(){$("a-err").textContent="";$("m8").classList.add("on")}
$("act-btn").addEventListener("click",openAct);$("a-x").addEventListener("click",function(){$("m8").classList.remove("on")});
$("a-ok").addEventListener("click",function(){
var id=$("a-id").value.trim().toUpperCase(),cd=$("a-code").value.toUpperCase().replace(/[^A-Z0-9]/g,"");
if(remoteLicenseOn()){
 if(!/^OP-[A-Z0-9-]{8,}$/.test(id)){$("a-err").textContent="Entre une clé de licence valide commençant par OP-.";return}
 $("a-ok").disabled=true;$("a-err").textContent="Vérification de la licence…";
 remoteActivate(id).then(function(){checkAct();$("m8").classList.remove("on");alert("Application activée. Merci pour ta confiance.")}).catch(function(e){$("a-err").textContent=e.message==="device_limit_reached"?"Cette licence a déjà atteint sa limite d'appareils.":"Licence refusée ou serveur indisponible."}).then(function(){$("a-ok").disabled=false});return
}
if(digits(id).length<11||cd!==mkCode(id)){$("a-err").textContent="Code incorrect. Vérifie le numéro et le code.";return}
lss("pc_act_id",id);lss("pc_act_code",cd);checkAct();$("m8").classList.remove("on")});
function pk(v){return"p"+h53("pin:"+v)}
$("pin-btn").addEventListener("click",function(){$("p-new").value="";$("p-confirm").value="";$("m7").classList.add("on")});
$("p-x").addEventListener("click",function(){$("m7").classList.remove("on")});
$("p-ok").addEventListener("click",function(){var v=$("p-new").value.trim(),c=$("p-confirm").value.trim();if(!/^\d{6,8}$/.test(v)){alert("Le code doit avoir 6 à 8 chiffres.");return}if(v!==c){alert("Les deux codes PIN ne correspondent pas.");return}
if(!canCrypto){alert("Le chiffrement sécurisé n'est pas disponible sur cet ordinateur. Aucune protection faible ne sera activée.");return}
enableEnc(v).then(function(ok){if(ok){lss("pc_security_version","1");alert("Protection activée : tes données et sauvegardes seront chiffrées.");$("m7").classList.remove("on")}else alert("Le chiffrement a échoué : le code n'a pas été enregistré.")})});
$("p-rm").addEventListener("click",function(){if(!confirm("Désactiver le chiffrement expose les données locales et les sauvegardes. Continuer ?"))return;if(lsg("pc_enc")==="1"){try{localStorage.setItem(KEY,JSON.stringify(pack()))}catch(e){alert("Impossible de retirer le code.");return}try{localStorage.removeItem("pc_commandes_enc")}catch(e){}lss("pc_enc","");ek=null}lss("pc_pin","");try{localStorage.removeItem("pc_snaps");localStorage.removeItem("pc_asd")}catch(e){}$("m7").classList.remove("on")});
var fails=0;
function unlockUI(){$("m6").classList.remove("on");$("l-in").value="";$("l-err").textContent="";boot()}
$("l-go").addEventListener("click",function(){var pin=$("l-in").value.trim(),err=$("l-err"),btn=this;
if(lsg("pc_enc")==="1"){
if(!lsg("pc_commandes_enc")){lss("pc_enc","");lss("pc_pin","");unpack([]);unlockUI();return}
unlockWith(pin).then(function(r){ek=r.k;eSalt=r.salt;unpack(r.data);fails=0;unlockUI()},function(){fails++;err.textContent=fails>=5?"Trop d'essais. Attends 30 secondes.":"Code incorrect.";if(fails>=5){btn.disabled=true;setTimeout(function(){btn.disabled=false;fails=0},30000)}})}
else if(pk(pin)===lsg("pc_pin")){$("m6").classList.remove("on");$("l-in").value="";err.textContent="";if(canCrypto)enableEnc(pin)}
else{err.textContent="Code incorrect."}});
$("l-in").addEventListener("keydown",function(e){if(e.key==="Enter")$("l-go").click()});
function ymd(d){return d.getFullYear()+"-"+("0"+(d.getMonth()+1)).slice(-2)+"-"+("0"+d.getDate()).slice(-2)}
function cday(c){return c.id>1e12?ymd(new Date(c.id)):""}
function inR(d,f,t){return!!d&&d>=f&&d<=t}
function dayInfo(c,f,t){var py=0;c.pays.forEach(function(x){if(inR(x.d||cday(c),f,t))py+=num(x.m)});return{cr:inR(cday(c),f,t),py:py,st:inR(c.su,f,t)}}
function hasAct(f,t){return data.some(function(c){if(c.demo)return false;var x=dayInfo(c,f,t);return x.cr||x.py>0||x.st})}
function addD(iso,n){var d=new Date(iso+"T12:00:00");d.setDate(d.getDate()+n);return ymd(d)}
var PN={j:"journée",s:"semaine",m:"mois",a:"année",c:"personnalisé"},PF={j:"jour",s:"semaine",m:"mois",a:"annee",c:"personnalise"};
function range(p,ref,end){var d=new Date(ref+"T12:00:00"),y=d.getFullYear(),m=d.getMonth();
if(p==="c"){var e=end||ref;return ref<=e?{f:ref,t:e}:{f:e,t:ref}}
if(p==="s"){var dw=(d.getDay()+6)%7,f=addD(ref,-dw);return{f:f,t:addD(f,6)}}
if(p==="m")return{f:ymd(new Date(y,m,1,12)),t:ymd(new Date(y,m+1,0,12))};
if(p==="a")return{f:y+"-01-01",t:y+"-12-31"};
return{f:ref,t:ref}}
function rangeTxt(p,r){return p==="j"?"Le "+dfr(r.f):"Du "+dfr(r.f)+" au "+dfr(r.t)}
function csvText(rows){return rows.map(function(r){return r.map(function(v){return'"'+String(v==null?"":v).replace(/"/g,'""')+'"'}).join(";")}).join("\n")}

// ===== BILAN : période (journée, semaine, mois, année, personnalisé) =====
function bilanData(p,r){var f=r.f,t=r.t,L=[],n=0,tn=0,enc=0,liv=0,due=0,bf=0,by={},bm={};
function bk(k){return by[k]||(by[k]={n:0,t:0,e:0})}
var mo=p==="a"||(p==="c"&&(new Date(t+"T12:00:00")-new Date(f+"T12:00:00"))/864e5>62);
function key(d){return mo?d.slice(0,7):d}
data.forEach(function(c){if(c.demo)return;if(c.statut!=="Annulée")due+=reste(c);
c.pays.forEach(function(x){var d=x.d||cday(c);if(inR(d,f,t)){bk(key(d)).e+=num(x.m);var pmk=x.mode||"Non précisé";bm[pmk]=(bm[pmk]||0)+num(x.m)}});
var x=dayInfo(c,f,t);if(!(x.cr||x.py>0||x.st))return;var a=[];
if(x.cr){a.push("Nouvelle commande");n++;if(c.statut!=="Annulée"){tn+=num(c.total);var b=bk(key(cday(c)));b.n++;b.t+=num(c.total);if(c.cout>0)bf+=num(c.total)-c.cout}}
if(x.py>0){a.push("Versement de "+fmt(x.py)+" FCFA");enc+=x.py}
if(x.st){a.push("Statut : "+c.statut);if(c.statut==="Livrée")liv++}
L.push([c.vague,c.nom,c.tel,c.ville||"",c.zone||"",itemsS(c),c.total,x.py,c.acompte,reste(c),c.statut,payModes(c),a.join(" + ")])});
var det=Object.keys(by).sort().map(function(k){return[mo?k.slice(5)+"/"+k.slice(0,4):dfr(k),by[k].n,by[k].t,by[k].e]});
return{mo:mo,sum:[["Période",rangeTxt(p,r)],["Type de bilan",cap(PN[p])],["Total encaissé (FCFA)",enc],["Reste dehors (FCFA)",due],["Nombre de colis (nouvelles commandes)",n],["Colis livrés",liv],["Montant des nouvelles commandes (FCFA)",tn],["Bénéfice estimé (FCFA)",bf]].concat(Object.keys(bm).sort().map(function(k){return["Encaissé en "+k+" (FCFA)",bm[k]]})),
detHead:[mo?"Mois":"Date","Nouvelles commandes","Montant (FCFA)","Encaissé (FCFA)"],det:det,
ordHead:["Client ID","Client","WhatsApp","Ville","Quartier","Produits","Total (FCFA)","Versé sur la période (FCFA)","Total versé (FCFA)","Reste (FCFA)","Statut","Modes de paiement","Actions"],ord:L}}
function paymentReportRows(r){var rows=[["Date","Client ID","Client","WhatsApp","Montant (FCFA)","Mode","Référence","Statut"]];data.forEach(function(c){if(c.demo)return;(c.pays||[]).forEach(function(x){var d=x.d||cday(c);if(!inR(d,r.f,r.t))return;rows.push([d?dfr(d):"Date non précisée",c.vague,c.nom,c.tel,num(x.m),x.mode||"Non précisé",x.ref||"",c.statut])})});return rows}
function clientReportRows(){var rows=[["Client ID","Client","WhatsApp","Ville","Zone","Commandes","Total (FCFA)","Versé (FCFA)","Reste (FCFA)","Dernière commande"]];clientList().forEach(function(e){rows.push([e.id,e.nom,e.tel,e.ville||"",e.zone||"",e.ord.length,e.tot,e.paid,e.due,e.last>1e12?dfr(cday({id:e.last})):""])});return rows}
function bilanBook(p,r){var d=bilanData(p,r),sh=[];
sh.push({name:"Résumé",widths:[42,34],rows:[[{v:"Bilan OrderPro",s:"title"}],[]].concat(d.sum.map(function(x){return[{v:x[0],s:"lab"},typeof x[1]==="number"?{v:x[1],s:"nb"}:{v:x[1],s:"t"}]}))});
if(p!=="j")sh.push({name:d.mo?"Détail par mois":"Détail par jour",widths:[16,22,20,20],head:0,rows:[d.detHead].concat(d.det)});
sh.push({name:"Commandes",widths:[12,22,18,14,18,44,16,24,20,16,18,22,44],head:0,rows:[d.ordHead].concat(d.ord)});
sh.push({name:"Paiements",widths:[16,12,22,18,18,20,24,20],head:0,rows:paymentReportRows(r)});
sh.push({name:"Clients",widths:[12,22,18,14,18,12,18,18,18,18],head:0,rows:clientReportRows()});return sh}
var bP="j",bRef="",bEnd="",snooze=0;
function renderBilanPreview(){var box=$("b-preview");if(!box||!bRef)return;var d=bilanData(bP,range(bP,bRef,bEnd));box.innerHTML="";
var grid=mk("div",{className:"bilan-preview-grid"});d.sum.slice(2,8).forEach(function(x){var card=mk("div",{className:"bilan-preview-card"});card.appendChild(mk("span",{textContent:x[0]}));card.appendChild(mk("b",{textContent:typeof x[1]==="number"&&/FCFA/.test(x[0])?fmt(x[1])+" F":String(x[1])}));grid.appendChild(card)});box.appendChild(grid);
var top=d.ord.slice().sort(function(a,c){return num(c[6])-num(a[6])}).slice(0,5);var title=mk("h3",{textContent:"Principales commandes de la période"});title.style.cssText="margin:14px 0 6px;font-size:1rem";box.appendChild(title);
if(!top.length){box.appendChild(mk("p",{className:"meta",textContent:"Aucune commande ou aucun versement sur cette période."}));return}
var list=mk("div",{className:"bilan-top-list"});top.forEach(function(x){var row=mk("div",{className:"bilan-top-row"});row.appendChild(mk("span",{textContent:(x[1]||"Client")+" · "+(x[0]||"—")}));row.appendChild(mk("b",{textContent:fmt(num(x[6]))+" F"}));list.appendChild(row)});box.appendChild(list)}
function showRange(){var c=bP==="c";$("b-d2w").hidden=!c;$("b-dlab").textContent=c?"Du":"Date de référence";var r=range(bP,bRef,bEnd);$("b-range").textContent=rangeTxt(bP,r);renderBilanPreview()}
function enabled(){var e=lsg("pc_bil_en");return e===null?"j":e}
function setNs(){var t=$("b-ns");t.textContent=!("Notification" in window)?"Les notifications ne sont pas disponibles sur ce navigateur.":Notification.permission==="granted"?"Notifications activées.":Notification.permission==="denied"?"Notifications bloquées : autorise-les dans les réglages du navigateur.":"Notifications non activées."}
function notify(title,body){try{if(!("Notification" in window)||Notification.permission!=="granted")return;
if(navigator.serviceWorker&&navigator.serviceWorker.controller){navigator.serviceWorker.ready.then(function(g){g.showNotification(title,{body:body,icon:"icon-192.png",tag:"orderpro"})})}else{new Notification(title,{body:body})}}catch(e){}}
function openBilan(p,ref,pending){bP=p||"j";bRef=ref||today();$("b-p").value=bP;$("b-d").value=bRef;bEnd=bRef;$("b-d2").value=bEnd;$("b-h").value=lsg("pc_bil_h")||"20:00";
var en=enabled();["j","s","m","a"].forEach(function(k){$("b-e"+k).checked=en.indexOf(k)>-1});$("b-wh").value=lsg("pc_wait_h")||"24";
$("b-txt").textContent=pending?"Ton bilan est prêt. Consulte le résumé puis télécharge le rapport Excel.":"Le résumé se met à jour quand tu changes la période. Télécharge ensuite le rapport Excel.";
setNs();showRange();$("m10").classList.add("on")}
$("bilan-btn").addEventListener("click",function(){openBilan("j",today(),false)});
$("b-p").addEventListener("change",function(){bP=this.value;showRange()});
$("b-d").addEventListener("change",function(){bRef=this.value||today();showRange()});
$("b-d2").addEventListener("change",function(){bEnd=this.value||bRef;showRange()});
function markDone(p,t){var k="pc_bd_"+p;if(t<=today()&&t>(lsg(k)||""))lss(k,t)}

$("b-sv").addEventListener("click",function(){var v=$("b-h").value;if(!/^\d{2}:\d{2}$/.test(v)){alert("Choisis une heure.");return}
lss("pc_bil_h",v);var en="";["j","s","m","a"].forEach(function(k){if($("b-e"+k).checked)en+=k});lss("pc_bil_en",en);lss("pc_wait_h",$("b-wh").value);updateWaitBar();alert("Réglages enregistrés.")});
$("b-x").addEventListener("click",function(){$("m10").classList.remove("on");snooze=Date.now()+60*60000});
$("b-nt").addEventListener("click",function(){if(!("Notification" in window)){setNs();return}try{Notification.requestPermission().then(setNs)}catch(e){setNs()}});
function dueKey(p){var h=(lsg("pc_bil_h")||"20:00").split(":"),tm=(+h[0]||0)*60+(+h[1]||0),n=new Date(),after=n.getHours()*60+n.getMinutes()>=tm,td=today();
if(p==="j")return after?td:addD(td,-1);
if(p==="s"){var e=n.getDay()===0?td:addD(td,-n.getDay());if(e===td&&!after)e=addD(e,-7);return e}
if(p==="m"){var last=ymd(new Date(n.getFullYear(),n.getMonth()+1,0,12));return td===last&&after?last:ymd(new Date(n.getFullYear(),n.getMonth(),0,12))}
var dec=n.getFullYear()+"-12-31";return td===dec&&after?dec:(n.getFullYear()-1)+"-12-31"}
function bilanPending(){var en=enabled(),ps=["j","s","m","a"];for(var i=0;i<ps.length;i++){var p=ps[i];if(en.indexOf(p)<0)continue;var k=dueKey(p);if(k>(lsg("pc_bd_"+p)||"")){var r=range(p,k);if(hasAct(r.f,r.t))return{p:p,k:k}}}return null}
function ago(t){var m=Math.floor((Date.now()-t)/60000);if(m<60)return"moins d'une heure";var h=Math.floor(m/60);if(h<24)return h+" h";var j=Math.floor(h/24);return j+" jour"+(j>1?"s":"")}
function waitHours(){return+(lsg("pc_wait_h")||"24")||24}
function waitList(){var lim=waitHours()*36e5;return data.filter(function(c){return!c.demo&&c.wait&&Date.now()-c.wait>=lim})}
function updateWaitBar(){var l=waitList(),b=$("waitbar");b.hidden=!l.length;if(l.length)$("w-txt").textContent=l.length+(l.length>1?" clients n'ont pas répondu":" client n'a pas répondu")+" depuis plus de "+waitHours()+" h."}

// Alerte pour les clients qui n'ont pas répondu après le délai choisi
function waitCheck(){var nw=waitList().filter(function(c){return!c.waN});
if(nw.length){nw.forEach(function(c){c.waN=true});store();if(document.hidden)notify("OrderPro : clients sans réponse",nw.length+(nw.length>1?" clients n'ont pas répondu":" client n'a pas répondu")+" à ton message.")}updateWaitBar()}
function showWait(){var b=$("w-list");b.innerHTML="";var l=waitList();if(!l.length)b.textContent="Aucun client en attente.";
l.forEach(function(c){var d=mk("div",{className:"item"});d.style.flexWrap="wrap";d.appendChild(mk("span",{textContent:c.nom+" · sans réponse depuis "+ago(c.wait)}));
var z=mk("button",{type:"button",textContent:"Relancer"});z.addEventListener("click",function(){$("m11").classList.remove("on");openWa(c,reste(c)>0?"rem":"")});
var y=mk("button",{type:"button",className:"alt",textContent:"Réponse reçue"});y.addEventListener("click",function(){c.wait=0;c.waN=false;store();render();showWait()});
d.appendChild(z);d.appendChild(y);b.appendChild(d)});$("m11").classList.add("on")}
$("w-see").addEventListener("click",showWait);$("w-x").addEventListener("click",function(){$("m11").classList.remove("on")});
$("wa-go").addEventListener("click",function(){if(this.getAttribute("href")==="#"||!mem||mem.demo||waKind==="rec")return;mem.wait=Date.now();mem.rel=Date.now();mem.waN=false;store();render()});

// Rappels : bilan à l'heure choisie et clients sans réponse
function bilanCheck(){waitCheck();backupNotify();autoSnap();if(document.querySelector(".modal.on")||Date.now()<snooze)return;var p=bilanPending();
if(p){if(document.hidden)notify("OrderPro : bilan prêt","Ton bilan ("+PN[p.p]+") est prêt à télécharger.");openBilan(p.p,p.k,true)}}
document.addEventListener("visibilitychange",function(){if(!document.hidden)bilanCheck()});
var lgk=document.createElement("link");lgk.rel="icon";lgk.href=$("logo").src;document.head.appendChild(lgk);

// ===== SÉCURITÉ : chiffrement des données avec le code PIN (AES-GCM) =====
/*CRYPTO*/
var ek=null,eSalt=null,encQ=Promise.resolve(),canCrypto=!!(window.crypto&&crypto.subtle&&window.TextEncoder);
function b64(u){var t="";u=new Uint8Array(u);for(var i=0;i<u.length;i++)t+=String.fromCharCode(u[i]);return btoa(t)}
function unb64(t){var a=atob(t),u=new Uint8Array(a.length);for(var i=0;i<a.length;i++)u[i]=a.charCodeAt(i);return u}
function deriveKey(pin,salt){return crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveKey"]).then(function(k){return crypto.subtle.deriveKey({name:"PBKDF2",salt:salt,iterations:250000,hash:"SHA-256"},k,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])})}
function encBlob(key,salt,text){var iv=crypto.getRandomValues(new Uint8Array(12));return crypto.subtle.encrypt({name:"AES-GCM",iv:iv},key,new TextEncoder().encode(text)).then(function(ct){return JSON.stringify({v:1,s:b64(salt),i:b64(iv),d:b64(ct)})})}
function decBlob(key,blob){var o=JSON.parse(blob);return crypto.subtle.decrypt({name:"AES-GCM",iv:unb64(o.i)},key,unb64(o.d)).then(function(pt){return new TextDecoder().decode(pt)})}
function unlockWith(pin){var blob=lsg("pc_commandes_enc"),salt;try{salt=unb64(JSON.parse(blob).s)}catch(e){return Promise.reject(e)}
return deriveKey(pin,salt).then(function(k){return decBlob(k,blob).then(function(t){return{k:k,salt:salt,data:JSON.parse(t)||[]}})})}
function enableEnc(pin){if(!canCrypto)return Promise.resolve(false);var salt=crypto.getRandomValues(new Uint8Array(16)),snap=JSON.stringify(pack());
return deriveKey(pin,salt).then(function(k){return encBlob(k,salt,snap).then(function(b){return decBlob(k,b).then(function(t){if(t!==snap)throw 0;lss("pc_commandes_enc",b);ek=k;eSalt=salt;lss("pc_enc","1");lss("pc_pin","enc");try{localStorage.removeItem("pc_snaps");localStorage.removeItem("pc_asd")}catch(e){}try{localStorage.removeItem(KEY)}catch(e){}return true})})}).catch(function(){return false})}
/*ENDCRYPTO*/
var tt=0;
function toast(msg,fn){var t=$("toast");t.textContent=msg+" ";if(fn){var b=mk("button",{type:"button",textContent:"Annuler"});b.style.cssText="margin-left:8px;padding:6px 12px";b.addEventListener("click",function(){fn();t.hidden=true;clearTimeout(tt)});t.appendChild(b)}t.hidden=false;clearTimeout(tt);tt=setTimeout(function(){t.hidden=true},6000)}
function quick(c,kind){var prev={statut:c.statut,su:c.su,wait:c.wait,waN:c.waN,rel:c.rel};
if(kind==="liv"){if(c.statut==="Livrée"){toast("Cette commande est déjà livrée.");return}
if(reste(c)>0&&!confirm("Il reste "+fmt(reste(c))+" FCFA à payer. Marquer la commande comme livrée quand même ?"))return;
c.statut="Livrée";c.su=today();store();render();toast("Marqué « Livré » : "+c.nom,function(){Object.assign(c,prev);store();render()})}
else{c.rel=Date.now();c.wait=Date.now();c.waN=false;store();render();toast("Marqué « Relancé » : "+c.nom,function(){Object.assign(c,prev);store();render()})}}

// ===== GESTES : glisser à droite = « Livré », à gauche = « Relancé » =====
function swipe(k,c){if(c.demo)return;var x0=0,y0=0,dx=0,on=false,lock="";k.style.touchAction="pan-y";
function reset(){on=false;k.style.transform="";k.style.opacity=""}
k.addEventListener("touchstart",function(e){if(e.touches.length!==1||/^(SELECT|INPUT|TEXTAREA|BUTTON|A)$/.test(e.target.tagName)){on=false;return}on=true;lock="";dx=0;x0=e.touches[0].clientX;y0=e.touches[0].clientY},{passive:true});
k.addEventListener("touchmove",function(e){if(!on)return;var t=e.touches[0],mx=t.clientX-x0,my=t.clientY-y0;
if(lock===""){if(Math.abs(mx)>12&&Math.abs(mx)>Math.abs(my)*1.5)lock="h";else if(Math.abs(my)>12)lock="v"}
if(lock==="h"){dx=mx;k.style.transform="translateX("+Math.max(-120,Math.min(120,dx))+"px)";k.style.opacity=".85"}},{passive:true});
k.addEventListener("touchend",function(){if(!on)return;var d=dx,l=lock;reset();if(l==="h"){if(d>90)quick(c,"liv");else if(d<-90)quick(c,"rel")}});
k.addEventListener("touchcancel",reset)}
var ZD=["Akwa","Bonamoussadi","Bonapriso","Deido","Bonabéri","Makepe","Logpom","Kotto","Ndokotti","Bépanda","Bastos","Mvan","Essos","Mendong","Biyem-Assi","Nlongkak"];
function zones(){var a=[];data.forEach(function(c){if(c.zone&&a.indexOf(c.zone)<0)a.push(c.zone)});return a.sort()}
function validTel(t){var d=digits(t);return d.indexOf("237")===0?d.length===12:(d.length>=11&&d.length<=15)}

// Pastille de couleur selon l'urgence (rouge, orange, vert)
function badge(c){var inc=!c.nom||num(c.total)<=0||!validTel(c.tel);
if(c.statut==="Annulée")return{icon:"⚪",txt:"Annulée",color:"var(--mute)",k:"x"};
if(inc)return{icon:"🔴",txt:"Incomplet",color:"var(--red)",k:"r"};
if(c.statut==="Livrée")return reste(c)>0?{icon:"🔴",txt:"Livrée, solde impayé",color:"var(--red)",k:"r"}:{icon:"🟢",txt:"Livrée",color:"#1f9d55",k:"v"};
if(c.statut==="Arrivée à Douala"||c.statut==="Prête à livrer")return{icon:"🟠",txt:"Prêt à livrer"+(reste(c)>0?" · à encaisser "+fmt(reste(c))+" FCFA":""),color:"#e08a00",k:"o"};
if(reste(c)<=0)return{icon:"🟢",txt:"Soldée",color:"#1f9d55",k:"v"};
if(num(c.acompte)<=0)return{icon:"🔴",txt:"Impayée",color:"var(--red)",k:"r"};
return{icon:"⚪",txt:"En cours",color:"var(--line)",k:"n"}}

// ===== SAISIE RAPIDE : copier-coller WhatsApp, mémoire des produits, calculatrice =====
/*LOT23*/
var COLS=["noir","blanc","rouge","bleu","vert","jaune","rose","gris","marron","beige","violet","orange","doré","argenté","kaki","bordeaux","marine","turquoise"];
function cap(t){t=String(t||"").trim();return t?t.charAt(0).toUpperCase()+t.slice(1):t}
function parseMsg(t){var o={},txt=String(t||""),n=noacc(txt),L=txt.split(/\r?\n/);
var m=txt.match(/(?:\+?\s?237[\s.-]?)?6(?:[\s.-]?\d){8}/);if(m)o.tel=fixTel(m[0]);
var lab={nom:/^(nom|client|cliente|prenom|noms?)$/,ville:/^ville$/,p:/^(produit|article|commande|modele)$/,zone:/^(quartier|zone|lieu|adresse|localisation|livraison)$/,co:/^couleur$/,s:/^(taille|pointure)$/,q:/^(quantite|qte|nombre)$/,t:/^(prix|montant|total)$/};
L.forEach(function(l){var k=l.match(/^\s*[-•*]?\s*([^:：\-–]{2,20})\s*[:：]\s*(.+?)\s*$/);if(!k)return;var key=noacc(k[1]).trim(),v=k[2].trim();for(var f in lab){if(lab[f].test(key)&&!o[f]){o[f]=v;break}}});
if(o.tel&&o.nom&&digits(o.nom).length>8)delete o.nom;
if(!o.nom){var mn=txt.match(/(?:je m'appelle|je m’appelle|mon nom est|moi c'est|moi c’est|c'est|c’est)\s+([A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]*(?:\s+[A-ZÀ-Ý][A-Za-zÀ-ÿ'’-]*)?)/);if(mn)o.nom=mn[1]}
if(!o.zone){var pr2=[];VILLES.forEach(function(v){qFor(v).forEach(function(z){pr2.push([v,z])})});for(var i=0;i<pr2.length;i++){if(hasW(n,pr2[i][1])){o.zone=pr2[i][1];o.ville=pr2[i][0];break}}}
if(!o.ville){for(var vi=0;vi<VILLES.length;vi++){if(hasW(n,VILLES[vi])){o.ville=VILLES[vi];break}}}
if(!o.p){var mp=txt.match(/(?:je veux|je voudrais|je prends|je commande|je souhaite|j'aimerais(?: avoir)?|j’aimerais(?: avoir)?|donne-moi|il me faut)\s+(?:(\d{1,3})\s+)?(?:un |une |des |le |la |les |du |de la )?([^.,;\n!?]+?)(?=\s+(?:en |taille|pointure|couleur|à |au |pour |svp|stp|s'il)|[.,;\n!?]|$)/i);if(mp){o.p=mp[2].trim();if(mp[1]&&!o.q)o.q=mp[1]}}
if(o.p){var mq=o.p.match(/^(\d{1,3})\s*(?:x|×|paires? de|pi[eè]ces? de|pcs)?\s+(.+)$/i);if(mq){o.p=mq[2];if(!o.q)o.q=mq[1]}}
if(!o.s){var ms=txt.match(/pointure\s*:?\s*(\d{2})/i)||txt.match(/taille\s*:?\s*([A-Za-z0-9]{1,4})\b/i);if(ms)o.s=ms[1].toUpperCase()}
else{var ms2=String(o.s).match(/\d{2}|\b(?:XXL|XL|XS|S|M|L)\b/i);o.s=ms2?ms2[0].toUpperCase():o.s}
if(!o.co){for(var j=0;j<COLS.length;j++){if(new RegExp("(^|[^a-z])"+noacc(COLS[j])+"(e|es|s)?([^a-z]|$)").test(n)){o.co=COLS[j];break}}}
if(!o.q){var mq2=txt.match(/(\d{1,3})\s*(?:x|×|paires?|pi[eè]ces?|pcs|exemplaires?)\b/i);if(mq2)o.q=mq2[1]}
var pr=(o.t?String(o.t):txt).match(/(\d{1,3}(?:[\s.]\d{3})+|\d{4,7})\s*(?:fcfa|f\s?cfa|xaf|francs?|f)?\b/i);
if(o.t){o.t=num(String(o.t).replace(/[^\d]/g,""))}else{var mf=txt.match(/(\d{1,3}(?:[\s.]\d{3})+|\d{4,7})\s*(?:fcfa|f\s?cfa|xaf|francs?)/i);o.t=mf?num(mf[1].replace(/[^\d]/g,"")):0}
o.q=num(o.q)||0;return o}
function applyParse(o){var got=[];
if(o.nom){$("f-nom").value=o.nom;got.push("nom")}
if(o.tel){$("f-tel").value=o.tel;got.push("numéro")}
if(o.ville){$("f-ville").value=o.ville;fillQ();got.push("ville")}
if(o.zone){$("f-zone").value=o.zone;got.push("quartier")}
if(o.p){var it={p:cap(o.p),q:o.q||1,t:o.t||0,s:o.s||"",co:o.co||""};it.g=guessG(it.p);
var mm=prodMem()[it.p.toLowerCase()];if(mm&&!it.t&&mm.u)it.t=Math.round(mm.u*it.q);if(mm&&mm.g){it.g=mm.g;it.gm=true}
var empty=fItems.length===1&&!String(fItems[0].p).trim()&&!num(fItems[0].t);if(empty)fItems[0]=it;else fItems.push(it);drawItems();calcReste();
got.push("produit");if(it.s)got.push("taille ou pointure");if(it.co)got.push("couleur");if(o.t)got.push("prix")}
var pcHint=window.desktop?" Tu peux aussi coller : nom, numéro, ville, quartier, produit, couleur, quantité, taille ou prix.":"";
var pcEmpty=window.desktop?"Rien trouvé. Tu peux coller : nom, numéro, ville, quartier, produit, couleur, quantité, taille ou prix.":"Rien trouvé. Vérifie que le message contient un numéro, un produit ou un quartier.";
$("f-pres").textContent=got.length?"Rempli : "+got.join(", ")+"."+pcHint+" Vérifie chaque champ avant d'enregistrer.":pcEmpty}
$("f-parse").addEventListener("click",function(){applyParse(parseMsg($("f-paste").value))});
function prodMem(){var m={};data.filter(function(c){return!c.demo}).sort(function(a,b){return a.id-b.id}).forEach(function(c){c.items.forEach(function(i){var k=String(i.p).trim().toLowerCase();if(!k)return;var e=m[k]||(m[k]={p:i.p,u:0,g:i.g,n:0});e.n++;e.p=i.p;if(num(i.t)>0)e.u=num(i.t)/(num(i.q)||1);if(i.g)e.g=i.g})});return m}
function fillPlist0(){var m=prodMem(),a=Object.keys(m).map(function(k){return m[k]}).sort(function(x,y){return y.n-x.n}).slice(0,60),d=$("plist");d.innerHTML="";a.forEach(function(e){var o=document.createElement("option");o.value=e.p;if(e.u)o.label=e.p+" · "+fmt(e.u)+" FCFA";d.appendChild(o)})}
var cc={a:null,op:null,cur:"0",fresh:true};
function ccFmt(t){var p=t.split("."),i=p[0].replace(/\B(?=(\d{3})+(?!\d))/g," ");return p.length>1?i+","+p[1]:i}
function ccOp(a,o,b){return o==="+"?a+b:o==="−"?a-b:o==="×"?a*b:(b===0?0:a/b)}
function ccKey(k){
if(/^\d+$/.test(k)){cc.cur=(cc.fresh||cc.cur==="0")?k:cc.cur+k;cc.fresh=false}
else if(k==="."){if(cc.fresh){cc.cur="0.";cc.fresh=false}else if(cc.cur.indexOf(".")<0)cc.cur+="."}
else if(k==="C"){cc.a=null;cc.op=null;cc.cur="0";cc.fresh=true}
else if(k==="⌫"){cc.cur=cc.cur.length>1?cc.cur.slice(0,-1):"0";if(cc.cur==="-")cc.cur="0"}
else{var v=parseFloat(cc.cur);if(cc.op!==null&&!cc.fresh)v=ccOp(cc.a,cc.op,v);cc.a=v;cc.cur=String(+v.toFixed(6));cc.fresh=true;cc.op=(k==="=")?null:k}
$("c-disp").textContent=ccFmt(cc.cur)}
function rendu(){var d=num($("c-due").value),r=num($("c-rec").value),x=$("c-res");
if(!r){x.textContent="";return}var diff=r-d;x.textContent=diff>0?"À rendre : "+fmt(diff)+" FCFA":diff===0?"Le compte est bon.":"Il manque : "+fmt(-diff)+" FCFA"}
function openCalc(due){$("c-due").value=due||"";$("c-rec").value="";rendu();$("m14").classList.add("on")}
(function(){var K=["C","⌫","÷","×","7","8","9","−","4","5","6","+","1","2","3","=","0","00","."],kp=$("c-kp");
K.forEach(function(k){if(k==="=")return;var b=mk("button",{type:"button",className:/\d|\./.test(k)?"alt":"",textContent:k});b.addEventListener("click",function(){ccKey(k)});kp.appendChild(b)});
var eq=mk("button",{type:"button",textContent:"="});eq.style.gridColumn="4";eq.style.gridRow="4 / span 2";eq.addEventListener("click",function(){ccKey("=")});kp.appendChild(eq);
[1000,2000,5000,10000].forEach(function(v){var b=mk("button",{type:"button",className:"alt",textContent:fmt(v)});b.addEventListener("click",function(){$("c-rec").value=v;rendu()});$("c-q").appendChild(b)})})();
$("c-due").addEventListener("input",rendu);$("c-rec").addEventListener("input",rendu);
$("calc-btn").addEventListener("click",function(){openCalc("")});$("c-x").addEventListener("click",function(){$("m14").classList.remove("on")});
function fmtT(t){var d=digits(t);return d.indexOf("237")===0&&d.length===12?"+237 "+d.slice(3):(t||"")}
function itemsS(c){return c.items.map(function(i){var sp=specOf(i);return i.q+" × "+i.p+(sp?" ("+sp+")":"")}).join(", ")}
function livList(){var z=$("lv-z").value;return data.filter(function(c){return!c.demo&&(c.statut==="Arrivée à Douala"||c.statut==="Prête à livrer")&&(!z||(c.zone||"")===z)})}

// ===== LIVRAISONS : message au livreur (dépôt simple ou encaissement) =====
function livMsg(c){var s=reste(c);return(s>0?"ORDRE D'ENCAISSEMENT : "+fmt(s)+" FCFA":"ORDRE DE DÉPÔT - NE RIEN ENCAISSER")+"\nClient : "+c.nom+"\nTéléphone : "+fmtT(c.tel)+"\nVille : "+(c.ville||"à confirmer")+"\nQuartier : "+(c.zone||"à confirmer")+"\nArticles : "+itemsS(c)+"\nConsigne : "+(s>0?"encaisse le montant exact ("+fmt(s)+" FCFA) avant de remettre le colis.":"dépose le colis sans encaisser d'argent, tout est déjà payé.")}
function sendLiv(text){var ok=validTel($("lv-t").value),a=document.createElement("a");a.href="https://api.whatsapp.com/send?"+(ok?"phone="+digits($("lv-t").value)+"&":"")+"text="+encodeURIComponent(text);a.target="_blank";a.rel="noopener";document.body.appendChild(a);a.click();a.remove()}
function deliverDone(c){var s=reste(c);if(s>0){if(!confirm("Le livreur a-t-il encaissé "+fmt(s)+" FCFA ?"))return;c.pays=c.pays.concat([{d:today(),m:s,mode:"Cash",ref:""}]);sync(c)}else if(!confirm("Marquer cette commande comme livrée ?"))return;
c.statut="Livrée";c.su=today();store();refreshFilters();render();drawLiv()}
function drawLiv(){var l=livList(),b=$("lv-list"),tot=0;b.innerHTML="";
l.forEach(function(c){var s=reste(c);tot+=s;var d=mk("div",{className:"irow"});
var h=mk("div",{textContent:c.nom+(c.zone?" · "+c.zone:"")});h.style.fontWeight="700";d.appendChild(h);
d.appendChild(mk("div",{className:"meta",textContent:itemsS(c)}));
var bg=mk("div",{textContent:s>0?"🟠 À ENCAISSER ("+fmt(s)+" FCFA)":"🟢 LIVRAISON SIMPLE (0 FCFA)"});bg.style.cssText="font-weight:700;margin:6px 0 2px;font-family:system-ui,sans-serif";d.appendChild(bg);
d.appendChild(mk("div",{className:"meta",textContent:s>0?"Consigne : encaisser le montant exact avant de remettre le colis.":"Consigne : déposer le colis sans encaisser d'argent."}));
var bs=mk("div",{className:"btns"});
var a1=mk("button",{type:"button",textContent:"Envoyer au livreur"});a1.addEventListener("click",function(){sendLiv(livMsg(c))});bs.appendChild(a1);
if(validTel(c.tel))bs.appendChild(mk("a",{href:"tel:+"+digits(c.tel),className:"btnalt",textContent:"Appeler"}));
if(s>0){var a2=mk("button",{type:"button",className:"alt",textContent:"Rendu de monnaie"});a2.addEventListener("click",function(){openCalc(s)});bs.appendChild(a2)}
var a3=mk("button",{type:"button",className:"alt",textContent:"Livré"});a3.addEventListener("click",function(){deliverDone(c)});bs.appendChild(a3);
d.appendChild(bs);b.appendChild(d)});
$("lv-sum").textContent=l.length?"À encaisser au total : "+fmt(tot)+" FCFA · "+l.length+" livraison"+(l.length>1?"s":""):"Aucune livraison prête. Les commandes « Arrivée à Douala » ou « Prête à livrer » apparaissent ici."}
$("liv-btn").addEventListener("click",function(){var z=$("lv-z").value;opt($("lv-z"),zones(),"Toutes les zones");$("lv-z").value=zones().indexOf(z)>-1?z:"";$("lv-t").value=lsg("pc_livreur")||"";drawLiv();$("m12").classList.add("on")});
$("lv-z").addEventListener("change",drawLiv);$("lv-t").addEventListener("input",function(){lss("pc_livreur",this.value)});$("lv-x").addEventListener("click",function(){$("m12").classList.remove("on")});
$("lv-all").addEventListener("click",function(){var l=livList();if(!l.length){alert("Aucune livraison à envoyer.");return}var tot=0;l.forEach(function(c){tot+=reste(c)});
var z=$("lv-z").value;sendLiv("TOURNÉE DU "+dfr(today())+(z?" - "+z:"")+"\n\n"+l.map(function(c,i){return(i+1)+") "+livMsg(c)}).join("\n\n")+"\n\nTotal à encaisser : "+fmt(tot)+" FCFA")});

// ===== REÇU EN IMAGE : dessin sur un canvas (sans e-mail ni donnée interne) =====
function rrect(x,px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath()}
// Reçu / devis en image : carte blanche, bandeau vert, tableau des articles, mode de paiement. Aucune adresse e-mail n'y figure.
function paint(c,x,W,H,dry,o){o=o||{};var DV=!!o.devis,EN=c.lang==="en";
function Lb(fr,en){return EN?en:fr}
function stT(t){return EN?(STEN[t]||t):t}
function pmT(m){return EN?(PAYEN[m]||m):m}
function spT(i){var t=specOf(i);return EN?t.replace(/pointure/g,"shoe size").replace(/taille/g,"size").replace(/couleur/g,"color"):t}
var F="system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif",IX=48,IR=W-48,QC=IR-262,y=0,G="#0b5a43",INK="#14302a",MU="#5f746d",LN="#e1e9e5";
function fo(f){return f+" "+F}
function T(t,f,col,al,px,py){if(dry)return;x.font=fo(f);x.fillStyle=col;x.textAlign=al;x.fillText(t,px,py)}
function PA(px,py,w,h,r){x.beginPath();x.moveTo(px+r,py);x.arcTo(px+w,py,px+w,py+h,r);x.arcTo(px+w,py+h,px,py+h,r);x.arcTo(px,py+h,px,py,r);x.arcTo(px,py,px+w,py,r);x.closePath()}
function RR(px,py,w,h,r,fill){if(dry)return;PA(px,py,w,h,r);x.fillStyle=fill;x.fill()}
function wrapT(t,f,mw){x.font=fo(f);var w=String(t).split(" "),l=[],cu="";w.forEach(function(a){var tt=cu?cu+" "+a:a;if(x.measureText(tt).width>mw&&cu){l.push(cu);cu=a}else cu=tt});if(cu)l.push(cu);return l}
function hl(){if(!dry){x.fillStyle=LN;x.fillRect(IX,y,IR-IX,2)}y+=2}
function row(lab,val,col,bold){T(lab,"400 23px",MU,"left",IX,y+24);T(val,(bold?"700":"600")+" 24px",col||INK,"right",IR,y+24);y+=42}
function fit(t,f0,mw,min){var f=f0;x.font=fo("700 "+f+"px");while(f>min&&x.measureText(t).width>mw){f-=2;x.font=fo("700 "+f+"px")}return f}
var rs=DV?0:reste(c),paid=DV?0:num(c.acompte),sn=shop||APP.nom,lg=document.getElementById("logo");
/* Fond, carte blanche avec ombre douce, bandeau d'en-tête */
if(!dry){x.fillStyle="#eef3f0";x.fillRect(0,0,W,H);
x.save();x.shadowColor="rgba(12,58,44,.20)";x.shadowBlur=26;x.shadowOffsetY=8;PA(20,20,W-40,H-40,26);x.fillStyle="#ffffff";x.fill();x.restore();
x.save();PA(20,20,W-40,H-40,26);x.clip();
var g=x.createLinearGradient(20,20,W,170);g.addColorStop(0,"#07412f");g.addColorStop(1,"#14865f");x.fillStyle=g;x.fillRect(20,20,W-40,150);
x.fillStyle="rgba(255,255,255,.07)";x.beginPath();x.arc(W-60,40,110,0,7);x.fill();x.restore();
if(lg&&lg.complete&&lg.naturalWidth){x.save();PA(IX,46,78,78,18);x.clip();x.drawImage(lg,IX,46,78,78);x.restore()}}
var fs=fit(sn,34,330,22);T(sn,"700 "+fs+"px","#ffffff","left",IX+98,88);
T(DV?Lb("DEVIS","QUOTE"):Lb("REÇU DE COMMANDE","ORDER RECEIPT"),"500 19px","#bfe9d6","left",IX+98,118);
T(DV?c.num:Lb("N° ","No. ")+String(c.id).slice(-6),"700 22px","#ffffff","right",IR,84);T(dfr(DV?c.date:today()),"500 20px","#d3efe2","right",IR,114);
/* Bloc client + pastille */
y=200;T(Lb("CLIENT","CUSTOMER"),"600 17px",MU,"left",IX,y+12);
if(!dry){var pl,pc;if(DV){pl=Lb("VALABLE "+(c.valid||7)+" JOURS","VALID "+(c.valid||7)+" DAYS");pc=["#e8f3ee","#0b5a43"]}else{pl=rs<=0?Lb("PAYÉ","PAID"):(paid>0?Lb("PARTIEL","PARTIAL"):Lb("À RÉGLER","DUE"));pc=rs<=0?["#e5f5ec","#1f7a45"]:(paid>0?["#fff1de","#b5600a"]:["#fdeceb","#a8321f"])}
x.font=fo("700 18px");var bw=x.measureText(pl).width+40;RR(IR-bw,y-8,bw,38,19,pc[0]);T(pl,"700 18px",pc[1],"center",IR-bw/2,y+18)}
y+=24;var nf=fit(c.nom,32,IR-IX-190,22);T(c.nom,"700 "+nf+"px",INK,"left",IX,y+30);y+=46;
var meta=[],loc=[c.ville,c.zone].filter(Boolean).join(" · ");if(!DV&&c.vague&&!c.demo)meta.push("ID : "+c.vague);if(loc)meta.push(Lb("Lieu : ","Place: ")+loc);
if(meta.length){wrapT(meta.join("   •   "),"400 21px",IR-IX).forEach(function(t){T(t,"400 21px",MU,"left",IX,y+20);y+=28})}
y+=14;hl();y+=20;
/* Tableau des articles */
RR(IX,y,IR-IX,44,12,"#e8f3ee");T(Lb("DÉSIGNATION","ITEM"),"700 17px",G,"left",IX+16,y+29);T(Lb("QTÉ","QTY"),"700 17px",G,"center",QC,y+29);T(Lb("MONTANT","AMOUNT"),"700 17px",G,"right",IR-16,y+29);y+=52;
c.items.forEach(function(i){var sp=spT(i),ls=wrapT(i.p,"600 24px",QC-50-(IX+16)),y0=y+14;
ls.forEach(function(t,k){T(t,"600 24px",INK,"left",IX+16,y0+20);if(k===0){T(String(qn(i)),"600 24px",INK,"center",QC,y0+20);T(fmt(i.t)+" FCFA","600 24px",INK,"right",IR-16,y0+20)}y0+=32});
if(sp){T(sp,"400 20px",MU,"left",IX+16,y0+14);y0+=28}
y=y0+12;if(!dry){x.fillStyle="#edf2ef";x.fillRect(IX,y,IR-IX,1.5)}y+=4});
y+=14;
if(DV){
RR(IX,y,IR-IX,96,18,"#e5f5ec");T(Lb("TOTAL À PAYER","TOTAL TO PAY"),"700 19px","#1f7a45","left",IX+26,y+40);T(Lb("Valable jusqu'au ","Valid until ")+dfr(addD(c.date,c.valid||7)),"400 19px","#1f7a45","left",IX+26,y+68);T(fmt(c.total)+" FCFA","700 38px","#1f7a45","right",IR-26,y+60);y+=96+22;
}else{
/* Totaux, versements (avec mode de paiement et référence) */
row(Lb("Total commande","Order total"),fmt(c.total)+" FCFA",INK,true);
c.pays.forEach(function(q){row(Lb("Versement","Payment")+(q.d?Lb(" du "," on ")+dfr(q.d):""),fmt(q.m)+" FCFA");
var dt=[q.mode?pmT(q.mode):"",q.ref?Lb("Réf. ","Ref. ")+q.ref:""].filter(Boolean).join("  ·  ");if(dt){y-=12;T(dt,"400 19px",MU,"left",IX,y+24);y+=34}});
if(c.pays.length>1)row(Lb("Total versé","Total paid"),fmt(paid)+" FCFA","#1f7a45",true);
y+=10;var bg=rs>0?"#fdeceb":"#e5f5ec",fg=rs>0?"#a8321f":"#1f7a45";
RR(IX,y,IR-IX,96,18,bg);T(Lb("RESTE À PAYER","BALANCE DUE"),"700 19px",fg,"left",IX+26,y+40);T(rs>0?Lb("À régler à la livraison","To be paid on delivery"):Lb("Commande entièrement réglée","Order fully paid"),"400 19px",fg,"left",IX+26,y+68);T(fmt(rs)+" FCFA","700 38px",fg,"right",IR-26,y+60);y+=96+22;
row(Lb("Statut de la commande","Order status"),stT(c.statut))}
y+=6;hl();y+=30;
T(Lb("Merci pour votre confiance !","Thank you for your trust!"),"700 27px",G,"center",W/2,y+8);y+=38;
T(DV?Lb("Devis sans engagement, valable jusqu'à la date indiquée.","Non-binding quote, valid until the date shown."):Lb("Ce reçu fait foi de votre commande.","This receipt is your proof of order."),"400 20px",MU,"center",W/2,y+6);y+=40;
var ft=y;if(!dry){x.save();PA(20,20,W-40,H-40,26);x.clip();var g2=x.createLinearGradient(20,ft,W,ft);g2.addColorStop(0,"#07412f");g2.addColorStop(1,"#14865f");x.fillStyle=g2;x.fillRect(20,ft,W-40,60);x.restore()}
T(sn,"600 20px","#ffffff","center",W/2,ft+37);
return ft+60+20}
function receiptCanvas(c,o){var W=720,S=2,cv=document.createElement("canvas");cv.width=W;cv.height=10;var h=paint(c,cv.getContext("2d"),W,0,true,o);cv.width=W*S;cv.height=h*S;var x=cv.getContext("2d");x.scale(S,S);paint(c,x,W,h,false,o);return cv}
var recuBlob=null,recuName="recu.png",recuUrl="",recuTxt="";
function showRecuImg(c,o){var cv=receiptCanvas(c,o);cv.toBlob(function(b){if(!b){alert("Impossible de créer l'image.");return}recuBlob=b;recuTxt=(o&&o.devis)?(c.lang==="en"?"Your quote":"Ton devis"):(c.lang==="en"?"Your order receipt":"Reçu de ta commande");document.querySelector("#m13 h2").textContent=(o&&o.devis)?"Devis en image":"Reçu en image";recuName=((o&&o.devis)?"devis-":"recu-")+(noacc(c.nom).replace(/[^a-z0-9]+/g,"-")||"client")+".png";if(recuUrl)URL.revokeObjectURL(recuUrl);recuUrl=URL.createObjectURL(b);$("ri-img").src=recuUrl;$("m13").classList.add("on")},"image/png")}
$("ri-x").addEventListener("click",function(){$("m13").classList.remove("on")});
$("ri-cp").addEventListener("click",function(){if(!recuBlob)return;var ko=function(){alert("Copie impossible ici. Utilise « Télécharger l'image ».")};try{navigator.clipboard.write([new ClipboardItem({"image/png":recuBlob})]).then(function(){alert("Image copiée. Colle-la dans la conversation WhatsApp.")},ko)}catch(e){ko()}});
$("wa-img").addEventListener("click",function(){if(mem){$("m2").classList.remove("on");showRecuImg(mem)}});
$("ri-dl").addEventListener("click",function(){if(!recuBlob)return;var a=document.createElement("a");a.href=recuUrl;a.download=recuName;document.body.appendChild(a);a.click();a.remove()});
$("ri-sh").addEventListener("click",function(){if(!recuBlob)return;try{var f=new File([recuBlob],recuName,{type:"image/png"});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f],text:recuTxt}).catch(function(){});return}}catch(e){}alert("Le partage direct n'est pas disponible ici. Utilise « Télécharger l'image », puis envoie-la sur WhatsApp.")});
/*ENDLOT23*/

// ===== VILLES ET QUARTIERS : suggestions + mémorisation des nouveaux quartiers =====
/*VILLES*/
var VILLES=["Douala","Yaoundé","Bafoussam","Kribi","Garoua","Bamenda","Buea","Limbe","Tiko","Kumba","Edéa","Nkongsamba","Dschang","Mbouda","Foumban","Ebolowa","Sangmélima","Bertoua","Ngaoundéré","Maroua","Mbalmayo"];
var QD={"Douala":["Akwa","Bonanjo","Bonapriso","Bonamoussadi","Deido","Bonabéri","Makepe","Logpom","Kotto","Ndokotti","Bépanda","New Bell","Bali","Logbessou","Ndogbong","Nyalla","Yassa","Japoma","Bassa","PK 8","PK 14","Ndogpassi"],
"Yaoundé":["Bastos","Mvan","Essos","Mendong","Biyem-Assi","Nlongkak","Melen","Ekounou","Mvog-Mbi","Etoudi","Omnisports","Obili","Odza","Nsimeyong","Tsinga","Nsam","Nkolbisson","Nkolndongo","Simbock","Ahala","Emana","Messassi","Damase","Mokolo"],
"Bafoussam":["Tamdja","Djeleng","Banengo","Kamkop","Tougang","Tocket","Ngouache","Kouogouo","Ndamvout","Djemoum","Haoussa"],
"Kribi":["Mpangou","Talla","Ngoye","Dombé","Londji","Grand Batanga","Ebome","Mpolongwe","Lolabé","Zio"],
"Garoua":["Poumpoumré","Roumdé Adjia","Foulbéré","Lopéré","Pitoaré","Laindé","Plateau","Pitoa Road","Marouaré","Sanguéré"],
"Bamenda":["Up Station","Commercial Avenue","Nkwen","Mankon","Ntarikon","Mile 4 Nkwen","Meta Quarters","Foncha Street","Old Town","Ntahsengo","Atuangang"],
"Buea":["Molyko","Muea","Great Soppo","Bokwango","Bonduma","Clerks Quarters","Buea Town","Mile 16","Mile 17","Buea Station","Upper Farms","Lower Farms"],
"Limbe":["Down Beach","Mile 1","Mile 2","Mile 4","Bota","Batoke","Mile 3","Mile 5","New Town","Bojongo","Holly Wood"],
"Tiko":["Tiko Town","Mutengene","Likomba","Ombe","Misselele","Holforth","Kange","Likomba Estate","Tiko Beach","Small Soppo"],
"Kumba":["Kumba Town","Fiango","Mbonge Road","Mambanda","Kumba IV","Kosala","Buea Road","Three Corners","Ntam","Kumba Market"],
"Edéa":["Centre-ville","Ekité","Mbanda","Pongo","New Bell","Marché central","Mbengue","Mouanko Road","Kompina","Pongo-Sitibi","Elogbatindi"],
"Nkongsamba":["Centre-ville","Quartier administratif","Marché central","Gare routière","Route de Melong","Quartier 1","Quartier 2","Baré","Loum Road","Manjo Road","Mbaressoumtou"],
"Dschang":["Centre-ville","Foto","Foréké-Dschang","Mingmeto","Marché central","Nzong","Santchou Road","Tsinmel","Nka","Lépoh","Fongo-Tongo"],
"Mbouda":["Centre-ville","Bamendjinda","Bamenkombo","Quartier administratif","Marché central","Batcham Road","Babadjou Road","Matsitsa","Bamessingue","Centre artisanal"],
"Foumban":["Centre-ville","Njintout","Koptchou","Marché central","Quartier administratif","Njimom Road","Kouoptamo Road","Manka","Mambain","Magne"],
"Ebolowa":["Centre-ville","Nko'ovos","Angalé","New Bell","Marché central","Mekalat","Mekomo","Mvam Essaboutou","Nko'ovos II","Nselang"],
"Sangmélima":["Centre-ville","Nkolso'o","Mekin","Quartier administratif","Marché central","Nkolnguet","Meyomessala Road","Mvomeka","Bilik","Nkolenyeng"],
"Bertoua":["Centre-ville","Nkolbikon","Mokolo","Enia","Mandjou","Marché central","Kpokolota","Kano","Koumé","Bertoua II","Bétaré-Oya Road"],
"Ngaoundéré":["Centre-ville","Baladji","Mabanga","Dang","Mardock","Marché central","Ndelbe","Bamyanga","Marza","Tchabal","Wakwa"],
"Maroua":["Centre-ville","Domayo","Pitoaré","Dougoy","Kakataré","Hardé","Palar","Djarengol","Ziling","Meskine","Dougoï"],
"Mbalmayo":["Centre-ville","Abang","Quartier administratif","Marché central","Gare routière","Nkolguet","Etoa","Mengueme Road","Abang II","Nkolso'o"]};
function qLoad(){try{return JSON.parse(lsg("pc_quartiers")||"{}")||{}}catch(e){return{}}}
function qFor(v){var a=(QD[v]||[]).slice(),m=qLoad()[v]||[];m.forEach(function(x){if(a.indexOf(x)<0)a.push(x)});return a}
function qRemember(v,z){z=String(z||"").trim();if(!z||!v)return;if(qFor(v).some(function(x){return noacc(x)===noacc(z)}))return;var m=qLoad();(m[v]=m[v]||[]).push(z);lss("pc_quartiers",JSON.stringify(m))}
function fillQ(){opt($("zlist"),qFor($("f-ville").value))}
$("f-ville").addEventListener("change",fillQ);
function hasW(n,w){return new RegExp("(^|[^a-z])"+noacc(w).replace(/[.*+?^${}()|[\]\\]/g,"\\$&")+"([^a-z]|$)").test(n)}

// Génération automatique du Client ID (CL-001, CL-002...) ; même numéro = même identifiant
function nextCid(tel){var d=digits(tel),e=data.filter(function(c){return!c.demo&&digits(c.tel)===d&&/^CL-\d+$/i.test(c.vague||"")})[0];if(e)return e.vague;
var mx=+(lsg("pc_cid")||0);data.forEach(function(c){var m=/^CL-(\d+)$/i.exec(c.vague||"");if(m&&+m[1]>mx)mx=+m[1]});mx++;lss("pc_cid",String(mx));
var t=String(mx);return"CL-"+("000"+t).slice(-Math.max(3,t.length))}
var qf="";
function qmatch(c){if(!qf)return true;if(c.statut==="Annulée")return false;if(qf==="imp")return reste(c)>0;if(qf==="liv")return c.statut==="Arrivée à Douala"||c.statut==="Prête à livrer";if(qf==="pay")return reste(c)<=0&&num(c.total)>0;return true}
function updChips(){document.querySelectorAll("#chips button").forEach(function(b){b.className=b.getAttribute("data-q")===qf?"":"alt"})}
document.querySelectorAll("#chips button").forEach(function(b){b.addEventListener("click",function(){qf=b.getAttribute("data-q");updChips();render()})});
function updMode(){$("m-imp").className=mode==="import"?"":"alt";$("m-stk").className=mode==="stock"?"":"alt"}
$("m-imp").addEventListener("click",function(){applyMode("import");updMode()});$("m-stk").addEventListener("click",function(){applyMode("stock");updMode()});
/*ENDVILLES*/

// ===== EXPORTS : Excel (.xlsx) et CSV bien structurés =====
/*XLSX*/
/* Écriture d'un classeur Excel (.xlsx) sans bibliothèque : fichier ZIP non compressé contenant du XML. */
var CRCT=(function(){var t=[],c,n,k;for(n=0;n<256;n++){c=n;for(k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(u){var c=0xFFFFFFFF;for(var i=0;i<u.length;i++)c=CRCT[(c^u[i])&255]^(c>>>8);return(c^0xFFFFFFFF)>>>0}
function xe(t){return String(t==null?"":t).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}
function colL(i){var s="";i++;while(i>0){var m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26)}return s}
var XST={h:1,t:2,n:3,title:4,lab:5,nb:6};
function sheetXml(sh){var rows=sh.rows,x='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0">';
if(sh.head!==undefined)x+='<pane ySplit="'+(sh.head+1)+'" topLeftCell="A'+(sh.head+2)+'" activePane="bottomLeft" state="frozen"/><selection pane="bottomLeft"/>';
x+='</sheetView></sheetViews><sheetFormatPr defaultRowHeight="15"/>';
if(sh.widths){x+="<cols>";sh.widths.forEach(function(w,i){x+='<col min="'+(i+1)+'" max="'+(i+1)+'" width="'+w+'" customWidth="1"/>'});x+="</cols>"}
x+="<sheetData>";var maxC=0;
rows.forEach(function(row,ri){var hd=sh.head===ri;x+='<row r="'+(ri+1)+'"'+(hd?' ht="32" customHeight="1"':"")+">";
row.forEach(function(cell,ci){var v=cell,st=null;if(cell&&typeof cell==="object"){v=cell.v;st=cell.s}
var sid=hd?1:(st?XST[st]:(typeof v==="number"?3:2)),ref=colL(ci)+(ri+1);if(ci+1>maxC)maxC=ci+1;
if(v===""||v==null)x+='<c r="'+ref+'" s="'+sid+'"/>';
else if(typeof v==="number")x+='<c r="'+ref+'" s="'+sid+'"><v>'+v+"</v></c>";
else x+='<c r="'+ref+'" s="'+sid+'" t="inlineStr"><is><t xml:space="preserve">'+xe(v)+"</t></is></c>"});x+="</row>"});
x+="</sheetData>";
if(sh.head!==undefined&&rows.length>sh.head+1)x+='<autoFilter ref="A'+(sh.head+1)+":"+colL(Math.max(0,maxC-1))+rows.length+'"/>';
return x+"</worksheet>"}
var XSTYLES='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font><font><b/><sz val="14"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0F6B4F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F3EE"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFB7C9C1"/></left><right style="thin"><color rgb="FFB7C9C1"/></right><top style="thin"><color rgb="FFB7C9C1"/></top><bottom style="thin"><color rgb="FFB7C9C1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="3" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="0" fontId="3" fillId="3" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/><xf numFmtId="3" fontId="3" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';
function xlsxFiles(sheets){var H='<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',n=sheets.length,f=[],ct=H+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>';
sheets.forEach(function(s,i){ct+='<Override PartName="/xl/worksheets/sheet'+(i+1)+'.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'});ct+="</Types>";
f.push(["[Content_Types].xml",ct]);
f.push(["_rels/.rels",H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>']);
var wb=H+'<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>',rl=H+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
sheets.forEach(function(s,i){wb+='<sheet name="'+xe(s.name)+'" sheetId="'+(i+1)+'" r:id="rId'+(i+1)+'"/>';rl+='<Relationship Id="rId'+(i+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet'+(i+1)+'.xml"/>'});
rl+='<Relationship Id="rId'+(n+1)+'" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>';
f.push(["xl/workbook.xml",wb+"</sheets></workbook>"]);f.push(["xl/_rels/workbook.xml.rels",rl]);f.push(["xl/styles.xml",XSTYLES]);
sheets.forEach(function(s,i){f.push(["xl/worksheets/sheet"+(i+1)+".xml",sheetXml(s)])});return f}
function zipStore(files){var enc=new TextEncoder(),parts=[],cd=[],off=0;
function u16(v){return[v&255,(v>>>8)&255]}function u32(v){return[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255]}
files.forEach(function(f){var nm=enc.encode(f[0]),d=enc.encode(f[1]),c=crc32(d),h=[].concat(u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(c),u32(d.length),u32(d.length),u16(nm.length),u16(0));
parts.push(new Uint8Array(h),nm,d);
cd.push([].concat(u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0x21),u32(c),u32(d.length),u32(d.length),u16(nm.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(off)),Array.prototype.slice.call(nm));
off+=h.length+nm.length+d.length});
var cdl=0;cd.forEach(function(a){parts.push(new Uint8Array(a));cdl+=a.length});
parts.push(new Uint8Array([].concat(u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(cdl),u32(off),u16(0))));
return new Blob(parts,{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"})}
function xlsxBlob(sheets){return zipStore(xlsxFiles(sheets))}
function dlBlob(name,blob){var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove()}
/* Export de toutes les commandes : un tableau, une colonne par information. */
function orderTable(){var rows=[["Client ID","Client","WhatsApp","Ville","Adresse","Quartier","Produits","Quantité","Total (FCFA)","Versé (FCFA)","Reste (FCFA)","Mode(s) de paiement","Référence(s)","Statut","Échéance","Date de commande","Notes","Coût d'achat (FCFA)","Bénéfice (FCFA)"]];
data.forEach(function(c){if(c.demo)return;rows.push([c.vague,c.nom,c.tel,c.ville||"",c.adresse||"",c.zone||"",itemsS(c),c.qte,c.total,c.acompte,reste(c),payModes(c),payRefs(c),c.statut,c.echeance||"",c.id>1e12?dfr(cday(c)):"",c.note||"",c.cout||"",c.cout?c.total-c.cout:""])});return rows}
function allReportRange(){return{f:"0000-01-01",t:"9999-12-31"}}
$("xls").addEventListener("click",function(){var r=allReportRange();dlBlob("commandes-orderpro.xlsx",xlsxBlob([
{name:"Commandes",widths:[12,22,18,14,28,18,44,10,16,16,16,22,24,18,16,18,30,18,16],head:0,rows:orderTable()},
{name:"Paiements",widths:[16,12,22,18,18,20,24,20],head:0,rows:paymentReportRows(r)},
{name:"Clients",widths:[12,22,18,14,18,12,18,18,18,18],head:0,rows:clientReportRows()}
]))});
/* Export du bilan : Excel (plusieurs feuilles) ou CSV (un seul tableau propre). */
function bilanFile(r){return"bilan-"+PF[bP]+"-"+(bP==="j"?r.f:r.f+"_au_"+r.t)}
function exportBilan(kind){var r=range(bP,bRef,bEnd);
if(kind==="xlsx"){dlBlob(bilanFile(r)+".xlsx",xlsxBlob(bilanBook(bP,r)))}else{var d=bilanData(bP,r);dl(bilanFile(r)+".csv","\ufeff"+csvText([d.ordHead].concat(d.ord)),"text/csv")}
if(bP!=="c")markDone(bP,r.t);$("m10").classList.remove("on")}
$("b-dl").addEventListener("click",function(){exportBilan("xlsx")});
/*ENDXLSX*/

// ===== NOUVEAUTÉS : paiements, anglais, corbeille, stock, devis, fiches clients, accueil, mode discret, sauvegarde auto =====
var PAYM=["Cash","MTN MoMo","Orange Money","Virement bancaire","Autre"],PAYEN={"Virement bancaire":"Bank transfer","Autre":"Other"};
var STEN={"Commandée":"Ordered","Réservée":"Reserved","Acompte reçu":"Deposit received","Achetée en Chine":"Purchased in China","En transit":"In transit","Arrivée à Douala":"Arrived in Douala","Prête à livrer":"Ready for delivery","Livrée":"Delivered","Annulée":"Cancelled"};
function payModes(c){var a=[];(c.pays||[]).forEach(function(x){if(x.mode&&a.indexOf(x.mode)<0)a.push(x.mode)});return a.join(" + ")}
function payRefs(c){var a=[];(c.pays||[]).forEach(function(x){if(x.ref)a.push(x.ref)});return a.join(" / ")}

// Toutes les données (commandes, corbeille, devis, stock) sont stockées ensemble : même chiffrement, même sauvegarde.
function pack(){return data.concat(trash,devis,stk)}
function unpack(a){data=[];trash=[];devis=[];stk=[];(a||[]).forEach(function(c){if(!c)return;if(c.sk)stk.push(c);else if(c.dv)devis.push(c);else if(c.del)trash.push(c);else data.push(c)})}
function cntOrders(rows){return rows.filter(function(c){return c&&!c.del&&!c.dv&&!c.sk}).length}
function openM(id){$(id).classList.add("on")}
document.querySelectorAll("[data-x]").forEach(function(b){b.addEventListener("click",function(){$(b.getAttribute("data-x")).classList.remove("on")})});
// --- Conversion de devises pour les importations ---
var FX_RATES={EUR:0.001524,CNY:0.011545,NGN:2.347797,USD:0.001715,XOF:1},FX_UPDATED="04/10/2026";
function fxFormat(x,c){return new Intl.NumberFormat("fr-FR",{maximumFractionDigits:c||2}).format(x)}
function fxUpdate(){var amount=num($("cv-amt").value),to=$("cv-to").value,rate=FX_RATES[to]||0;
  lss("pc_fx_amt",String($("cv-amt").value||""));lss("pc_fx_to",to);
  $("cv-res").textContent=amount>0?fxFormat(amount,0)+" XAF ≈ "+fxFormat(amount*rate,to==="NGN"?0:2)+" "+to:"Entre un montant pour afficher le résultat.";
  $("cv-rate-note").textContent="Taux indicatif : 1 XAF = "+String(rate).replace(".",",")+" "+to+" · référence du "+FX_UPDATED+".";
  $("cv-status").textContent=FX_UPDATED==="aujourd'hui"?"Taux actualisés avec Internet.":"Mode hors ligne : taux de référence conservés. Actualise si tu as Internet.";
}
function fxOpen(){if(lsg("pc_fx_amt")&&$("cv-amt"))$("cv-amt").value=lsg("pc_fx_amt");if(lsg("pc_fx_to")&&$("cv-to"))$("cv-to").value=lsg("pc_fx_to");fxUpdate();openM("m20")}
if($("conv-btn"))$("conv-btn").addEventListener("click",fxOpen);
if($("cv-amt"))$("cv-amt").addEventListener("input",fxUpdate);
if($("cv-to"))$("cv-to").addEventListener("change",fxUpdate);
if($("cv-copy"))$("cv-copy").addEventListener("click",function(){var text=$("cv-res").textContent;if(!text||/Entre un montant/.test(text))return;if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(text).then(function(){alert("Résultat copié.")},function(){alert("Copie impossible ici.")});else alert("Sélectionne le résultat pour le copier.")});
if($("cv-x"))$("cv-x").addEventListener("click",function(){$("m20").classList.remove("on")});
if($("cv-refresh"))$("cv-refresh").addEventListener("click",function(){
  var b=this;b.disabled=true;b.textContent="Mise à jour…";
  fetch("https://open.er-api.com/v6/latest/XAF").then(function(r){return r.json()}).then(function(x){if(x&&x.rates){["EUR","CNY","NGN","USD","XOF"].forEach(function(k){if(isFinite(+x.rates[k]))FX_RATES[k]=+x.rates[k]});FX_UPDATED="aujourd'hui";fxUpdate()}}).catch(function(){alert("Taux hors ligne conservés : "+FX_UPDATED)}).then(function(){b.disabled=false;b.textContent="Actualiser les taux"});
});

// --- Profil local, langue, thème et feedback ---
var UI_LABELS={fr:{home:"Tableau de bord",orders:"Commandes",clients:"Clients",debts:"Qui me doit de l'argent",delivery:"Livraisons",stock:"Stock",reports:"Rapports",backup:"Sauvegardes",settings:"Paramètres"},en:{home:"Dashboard",orders:"Orders",clients:"Clients",debts:"Who owes me",delivery:"Deliveries",stock:"Stock",reports:"Reports",backup:"Backups",settings:"Settings"}};
var UI_ACTIONS={fr:{"m-imp":"Importation","conv-btn":"Conversion","m-stk":"Stock local","add":"+ Nouvelle commande","liv-btn":"Livraisons","cl-btn":"Fiches clients","sk-btn":"Stock","dettes":"Qui me doit de l'argent","bilan-btn":"Rapports","ab-btn":"Sauvegarde auto","tr-btn":"Corbeille","feedback-btn":"Feedback","guide":"Mode d'emploi","rename":"Nom de ma boutique","pin-btn":"Code PIN","act-btn":"Activer l'application","save":"Sauvegarder","load":"Restaurer","b-dl":"Télécharger le rapport Excel","cv-copy":"Copier le résultat"},en:{"m-imp":"Import","conv-btn":"Currency conversion","m-stk":"Local stock","add":"+ New order","liv-btn":"Deliveries","cl-btn":"Client files","sk-btn":"Stock","dettes":"Who owes me","bilan-btn":"Reports","ab-btn":"Auto backup","tr-btn":"Recycle bin","feedback-btn":"Feedback","guide":"User guide","rename":"Shop name","pin-btn":"PIN code","act-btn":"Activate app","save":"Save","load":"Restore","b-dl":"Download Excel report","cv-copy":"Copy result"}};
function applyUiLanguage(lang){lang=lang==="en"?"en":"fr";lss("pc_ui_lang",lang);document.documentElement.lang=lang;var d=UI_LABELS[lang];document.querySelectorAll(".pc-nav button").forEach(function(b){var k=b.dataset.page,sp=b.querySelector("span:last-child");if(sp&&d[k])sp.textContent=d[k]});var a=UI_ACTIONS[lang];Object.keys(a).forEach(function(k){var e=$(k);if(e)e.textContent=a[k]});if($("lang-btn"))$("lang-btn").textContent=lang.toUpperCase();if($("ui-lang"))$("ui-lang").value=lang;if($("auth-login"))$("auth-login").textContent=lang==="en"?"Sign in":"Se connecter";if($("auth-logout"))$("auth-logout").textContent=lang==="en"?"Log out":"Se déconnecter";document.dispatchEvent(new CustomEvent("orderpro-language",{detail:lang}))}
function renderAuth(){var n=lsg("pc_profile_name")||"",e=lsg("pc_profile_email")||"";if($("auth-name"))$("auth-name").value=n;if($("auth-email"))$("auth-email").value=e;if($("auth-status"))$("auth-status").textContent=n?("Profil local actif : "+n+(e?" · "+e:"")):"Aucun profil local connecté. Les données restent dans cette installation.";if($("auth-login"))$("auth-login").hidden=!!n;if($("auth-logout"))$("auth-logout").hidden=!n;if($("auth-btn"))$("auth-btn").textContent=n?("👤 "+n):"Se connecter"}
if(!window.desktop){
  var mobileTheme=$("theme-btn");
  function mobileThemeIsDark(){return document.documentElement.getAttribute("data-theme")==="dark"||(!document.documentElement.getAttribute("data-theme")&&window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches)}
  function renderMobileTheme(){if(mobileTheme)mobileTheme.textContent=mobileThemeIsDark()?"☀ Mode clair":"☾ Mode sombre"}
  var savedMobileTheme=lsg("pc_theme");if(savedMobileTheme)document.documentElement.setAttribute("data-theme",savedMobileTheme);renderMobileTheme();
  if(mobileTheme)mobileTheme.addEventListener("click",function(){var dark=mobileThemeIsDark();document.documentElement.setAttribute("data-theme",dark?"light":"dark");lss("pc_theme",dark?"light":"dark");renderMobileTheme()});
  if($("lang-btn"))$("lang-btn").addEventListener("click",function(){applyUiLanguage((lsg("pc_ui_lang")||"fr")==="fr"?"en":"fr")});
}
if($("auth-btn"))$("auth-btn").addEventListener("click",function(){renderAuth();openM("m21")});
if($("auth-login"))$("auth-login").addEventListener("click",function(){var n=$("auth-name").value.trim(),e=$("auth-email").value.trim();if(!n){alert("Indique un nom ou le nom de ta boutique.");return}lss("pc_profile_name",n);lss("pc_profile_email",e);renderAuth();$("m21").classList.remove("on")});
if($("auth-logout"))$("auth-logout").addEventListener("click",function(){localStorage.removeItem("pc_profile_name");localStorage.removeItem("pc_profile_email");renderAuth()});
if($("auth-x"))$("auth-x").addEventListener("click",function(){$("m21").classList.remove("on")});
if($("ui-lang"))$("ui-lang").addEventListener("change",function(){applyUiLanguage(this.value)});
if($("feedback-btn"))$("feedback-btn").addEventListener("click",function(){location.href="mailto:"+APP.contact+"?subject="+encodeURIComponent("Feedback OrderPro PC")+"&body="+encodeURIComponent("Version : "+APP.version+"\\nMessage : ")});
applyUiLanguage(lsg("pc_ui_lang")||"fr");renderAuth();

// --- Messages en anglais ---
function msgEn(c){var n=c.nom.split(" ")[0],b="Hello "+n+", ",R=names(c),st=mode==="stock",bal=reste(c)?" Balance to pay: "+fmt(reste(c))+" FCFA.":"";
switch(c.statut){
case"Réservée":return b+"thank you for your order: "+R+". Total: "+fmt(c.total)+" FCFA. Could you send the deposit so I can set it aside for you?";
case"Commandée":return b+"thank you for your order: "+R+". Total: "+fmt(c.total)+" FCFA. Could you send the deposit so I can start the purchase?";
case"Acompte reçu":return b+"I have received your deposit of "+fmt(c.acompte)+" FCFA for "+R+". "+(st?"Your order is reserved.":"I will place the purchase soon.")+bal;
case"Achetée en Chine":return b+"good news: your order ("+R+") has been purchased in China. I will keep you posted about the shipping.";
case"En transit":return b+"your order ("+R+") is on its way to Cameroon. I will let you know as soon as it arrives in Douala.";
case"Arrivée à Douala":return b+"your order ("+R+") has arrived in Douala!"+(reste(c)?" The remaining "+fmt(reste(c))+" FCFA must be paid before delivery.":"")+" When can we arrange the handover?";
case"Prête à livrer":return b+"your order ("+R+") is ready!"+bal+" Would you like to pick it up, or shall I deliver it?";
case"Livrée":return b+"thank you for your trust! If you are happy with your order ("+R+"), feel free to tell your friends."+(st?"":" The next batch is coming soon.");
default:return b+"your order ("+R+") has been cancelled. Feel free to contact me if you have any questions."}}
function remindEn(c){return"Hello "+c.nom.split(" ")[0]+", a quick reminder: "+fmt(reste(c))+" FCFA is still to be paid for your order ("+names(c)+"). Could you let me know when you can pay? Thank you."}
function receiptEn(c){var L=["*Receipt – "+(shop||APP.nom)+"*","Customer: "+c.nom,"","Items:"];
c.items.forEach(function(i){L.push("- "+i.q+" × "+i.p+" : "+fmt(i.t)+" FCFA")});
L.push("","Total: "+fmt(c.total)+" FCFA","Payments:");if(!c.pays.length)L.push("- none");
c.pays.forEach(function(x){L.push("- "+(dfr(x.d)||"date not specified")+" : "+fmt(x.m)+" FCFA"+(x.mode?" ("+(PAYEN[x.mode]||x.mode)+(x.ref?", ref. "+x.ref:"")+")":""))});
L.push("Total paid: "+fmt(c.acompte)+" FCFA","Balance due: "+fmt(reste(c))+" FCFA");if(c.echeance&&reste(c)>0)L.push("Payment deadline: "+dfr(c.echeance));L.push("","Thank you for your trust!");return L.join("\n")}
$("f-tel").addEventListener("input",function(){var d=digits(this.value);if(d.length<11||editId)return;var e=data.filter(function(c){return!c.demo&&digits(c.tel)===d})[0];if(e&&e.lang)$("f-lang").value=e.lang});

// --- Corbeille (30 jours) ---
function delOrder(c){if(!confirm("Supprimer la commande de "+c.nom+" ? Elle ira dans la corbeille pendant 30 jours."))return;
data=data.filter(function(x){return x.id!==c.id});
if(c.demo){store();refreshFilters();render();return}
stockApply(stockMap(c),{});c.del=Date.now();trash.push(c);store();refreshFilters();render();
toast("Commande de "+c.nom+" déplacée dans la corbeille.",function(){restoreOrder(c)})}
function restoreOrder(c){trash=trash.filter(function(x){return x.id!==c.id});delete c.del;data.push(c);stockApply({},stockMap(c));store();refreshFilters();render()}
function purgeTrash(){var n=trash.length;trash=trash.filter(function(c){return Date.now()-c.del<30*864e5});if(trash.length!==n)store()}
function drawTrash(){var b=$("tr-list");b.innerHTML="";
if(!trash.length){b.appendChild(mk("div",{className:"empty",textContent:"La corbeille est vide."}));$("tr-all").hidden=true;return}
$("tr-all").hidden=false;
trash.slice().sort(function(a,c){return c.del-a.del}).forEach(function(c){var left=Math.max(0,30-Math.floor((Date.now()-c.del)/864e5));
var d=mk("div",{className:"card"});d.appendChild(mk("h3",{textContent:c.nom}));
d.appendChild(mk("div",{className:"meta",textContent:c.vague+" · "+itemsS(c)+" · supprimée il y a "+ago(c.del)+" · suppression définitive dans "+left+" jour(s)"}));
var bt=mk("div",{className:"btns"}),r=mk("button",{type:"button",textContent:"Restaurer"}),x=mk("button",{type:"button",className:"del",textContent:"Supprimer définitivement"});
r.addEventListener("click",function(){restoreOrder(c);drawTrash()});
x.addEventListener("click",function(){if(confirm("Supprimer définitivement cette commande ? Cette action est irréversible.")){trash=trash.filter(function(z){return z.id!==c.id});store();drawTrash()}});
bt.appendChild(r);bt.appendChild(x);d.appendChild(bt);b.appendChild(d)})}
$("tr-btn").addEventListener("click",function(){drawTrash();openM("m19")});
$("tr-all").addEventListener("click",function(){if(confirm("Vider toute la corbeille ? Cette action est irréversible.")){trash=[];store();drawTrash()}});

// --- Stock local : la quantité baisse à chaque commande ---
function stockKey(p){return noacc(String(p||"")).trim()}
function stockMap(c){var m={};if(!c||c.demo||c.statut==="Annulée"||!c.items)return m;c.items.forEach(function(i){var k=stockKey(i.p);if(stk.some(function(s){return stockKey(s.p)===k}))m[k]=(m[k]||0)+qn(i)});return m}
function stockApply(a,b){var u={};Object.keys(a).concat(Object.keys(b)).forEach(function(k){u[k]=1});Object.keys(u).forEach(function(k){var s=stk.filter(function(x){return stockKey(x.p)===k})[0];if(s)s.q=(+s.q||0)-((b[k]||0)-(a[k]||0))})}
function stockWarn(m){var w=[];Object.keys(m).forEach(function(k){var s=stk.filter(function(x){return stockKey(x.p)===k})[0];if(!s)return;var q=+s.q||0;if(q<0)w.push(s.p+" : stock insuffisant ("+q+")");else if(q<=(+s.seuil||0))w.push(s.p+" : "+q+" restant(s)")});if(w.length)toast("⚠ Stock bas : "+w.join(" ; "))}
function fillPlist(){fillPlist0();var d=$("plist");stk.forEach(function(s){var o=document.createElement("option");o.value=s.p;o.label=s.p+" · en stock : "+(+s.q||0);d.appendChild(o)})}
var skEdit=0;
function skReset(){skEdit=0;$("sk-n").value="";$("sk-q").value="";$("sk-s").value="2";$("sk-ok").textContent="Ajouter"}
function drawStock(){var b=$("sk-list");b.innerHTML="";
if(!stk.length)b.appendChild(mk("div",{className:"empty",textContent:"Aucun produit en stock. Ajoute-en un ci-dessus : la quantité baissera à chaque commande."}));
stk.slice().sort(function(a,c){return a.p.localeCompare(c.p)}).forEach(function(s){var q=+s.q||0,lo=q<=0?["Épuisé","#a8321f"]:q<=(+s.seuil||0)?["Stock bas","#e08a00"]:["En stock","#1f9d55"];
var d=mk("div",{className:"card"});d.appendChild(mk("h3",{textContent:s.p}));
var bd=mk("span",{textContent:lo[0]});bd.style.cssText="display:inline-block;margin:4px 0;padding:3px 10px;border-radius:999px;color:#fff;font-weight:700;font-size:.78rem;font-family:system-ui,sans-serif;background:"+lo[1];d.appendChild(bd);
d.appendChild(mk("div",{className:"meta",textContent:"Quantité : "+q+" · alerte quand il reste "+(+s.seuil||0)}));
var bt=mk("div",{className:"btns"});
function B(t,cl,fn){var z=mk("button",{type:"button",className:cl,textContent:t});z.addEventListener("click",fn);bt.appendChild(z)}
B("−1","alt",function(){s.q=q-1;store();drawStock();renderHome()});B("+1","alt",function(){s.q=q+1;store();drawStock();renderHome()});
B("Modifier","alt",function(){skEdit=s.id;$("sk-n").value=s.p;$("sk-q").value=q;$("sk-s").value=+s.seuil||0;$("sk-ok").textContent="Enregistrer";$("sk-n").focus()});
B("Retirer","del",function(){if(confirm("Retirer "+s.p+" du stock ?")){stk=stk.filter(function(z){return z.id!==s.id});store();drawStock();renderHome()}});
d.appendChild(bt);b.appendChild(d)})}
$("sk-btn").addEventListener("click",function(){skReset();drawStock();openM("m17")});
$("sk-cl").addEventListener("click",skReset);
$("sk-ok").addEventListener("click",function(){var p=$("sk-n").value.trim();if(!p){alert("Indique le nom du produit.");return}
var q=parseInt($("sk-q").value,10);if(!isFinite(q)){alert("Indique la quantité en stock.");return}
var se=parseInt($("sk-s").value,10);if(!isFinite(se)||se<0)se=2;
var ex=skEdit?stk.filter(function(z){return z.id===skEdit})[0]:stk.filter(function(z){return stockKey(z.p)===stockKey(p)})[0];
if(ex){ex.p=p;ex.q=q;ex.seuil=se}else stk.push({id:Date.now(),sk:1,p:p,q:q,seuil:se});
store();skReset();drawStock();renderHome()});

// --- Devis avant commande ---
function nextDv(){var n=(+lsg("pc_dv")||0)+1;lss("pc_dv",String(n));return"DV-"+("000"+n).slice(-Math.max(3,String(n).length))}
function formItems(){return fItems.filter(function(i){return String(i.p).trim()}).map(function(i){return{p:String(i.p).trim(),q:num(i.q)||1,t:num(i.t),g:i.g||guessG(i.p),s:i.n?"":String(i.s||"").trim(),n:!!i.n,co:String(i.co||"").trim()}})}
$("f-dv").addEventListener("click",function(){var its=formItems(),nom=$("f-nom").value.trim();if(!nom||!its.length){alert("Renseigne au moins le nom du client et un produit.");return}
var d={id:Date.now(),dv:1,num:nextDv(),nom:nom,tel:fixTel($("f-tel").value),ville:$("f-ville").value,zone:$("f-zone").value.trim(),adresse:$("f-adresse").value.trim(),echeance:$("f-echeance").value||"",lang:$("f-lang").value,items:its,note:$("f-note").value.trim(),date:today(),valid:7,total:0};
its.forEach(function(i){d.total+=i.t});qRemember(d.ville,d.zone);
if(fromDv){devis=devis.filter(function(z){return z.id!==fromDv});fromDv=0}
devis.push(d);store();$("m1").classList.remove("on");showRecuImg(d,{devis:true});renderHome()});
function drawDevis(){var b=$("dv-list");b.innerHTML="";
if(!devis.length)b.appendChild(mk("div",{className:"empty",textContent:"Aucun devis en attente. Appuie sur « Nouveau devis »."}));
devis.slice().sort(function(a,c){return c.id-a.id}).forEach(function(d){var until=addD(d.date,d.valid||7),exp=until<today();
var k=mk("div",{className:"card"});k.appendChild(mk("h3",{textContent:d.num+" · "+d.nom}));
k.appendChild(mk("div",{className:"meta",textContent:itemsS(d)}));
var r=mk("div",{className:"row"});r.innerHTML="<span>Total <b class='amt'></b></span><span></span>";r.querySelector("b").textContent=fmt(d.total)+" FCFA";r.lastChild.textContent=exp?"Expiré le "+dfr(until):"Valable jusqu'au "+dfr(until);if(exp)r.lastChild.style.color="var(--red)";k.appendChild(r);
var bt=mk("div",{className:"btns"});
function B(t,cl,fn){var z=mk("button",{type:"button",className:cl,textContent:t});z.addEventListener("click",fn);bt.appendChild(z)}
B("Transformer en commande","",function(){$("m16").classList.remove("on");openForm(null);$("f-nom").value=d.nom;$("f-tel").value=d.tel||"+237 ";$("f-ville").value=d.ville||$("f-ville").value;fillQ();$("f-adresse").value=d.adresse||"";$("f-zone").value=d.zone||"";$("f-lang").value=d.lang||"fr";$("f-note").value=d.note||"";
fItems=d.items.map(function(i){return{p:i.p,q:i.q,t:i.t,g:i.g,gm:!!i.g,s:i.s,n:i.n,co:i.co}});fromDv=d.id;drawItems();calcReste()});
B("Voir l'image","alt",function(){showRecuImg(d,{devis:true})});
B("Supprimer","del",function(){if(confirm("Supprimer le devis "+d.num+" ?")){devis=devis.filter(function(z){return z.id!==d.id});store();drawDevis();renderHome()}});
k.appendChild(bt);b.appendChild(k)})}
$("dv-btn").addEventListener("click",function(){drawDevis();openM("m16")});
$("dv-new").addEventListener("click",function(){$("m16").classList.remove("on");fromDv=0;openForm(null);$("mt").textContent="Nouveau devis (ou commande)"});

// --- Fiches clients ---
function clientList(){var m={},o=[];data.forEach(function(c){if(c.demo)return;var d=digits(c.tel),k=d.length>=9?d:c.vague,e=m[k];
if(!e){e=m[k]={k:k,nom:c.nom,tel:c.tel,id:c.vague,ville:"",adresse:"",zone:"",note:"",lang:"fr",ord:[],tot:0,paid:0,due:0,last:0};o.push(e)}
e.ord.push(c);if(c.id>=e.last){e.last=c.id;e.nom=c.nom;e.tel=c.tel;e.ville=c.ville||e.ville;e.adresse=c.adresse||e.adresse;e.zone=c.zone||e.zone;e.note=c.note||e.note;e.lang=c.lang||e.lang}
if(c.statut!=="Annulée"){e.tot+=num(c.total);e.paid+=num(c.acompte);e.due+=reste(c)}});
return o.sort(function(a,b){return b.last-a.last})}
function drawClients(){var q=noacc($("cl-q").value.trim()),b=$("cl-list"),all=clientList(),top=all.slice().sort(function(a,c){return c.tot-a.tot}).slice(0,3).map(function(e){return e.k});b.innerHTML="";
var l=all.filter(function(e){return!q||noacc([e.nom,e.tel,e.id,e.ville,e.adresse,e.zone,e.note].join(" ")).indexOf(q)>-1});
if(!l.length)b.appendChild(mk("div",{className:"empty",textContent:all.length?"Aucun client ne correspond.":"Aucun client pour le moment."}));
l.forEach(function(e){var k=mk("div",{className:"card"});k.appendChild(mk("h3",{textContent:(all.length>=4&&e.tot>0&&top.indexOf(e.k)>-1?"⭐ ":"")+e.nom}));
k.appendChild(mk("div",{className:"meta",textContent:e.id+" · "+fmtT(e.tel)+(e.zone?" · "+e.zone:"")}));
var r=mk("div",{className:"row"});r.innerHTML="<span>"+e.ord.length+" commande(s)</span><span>Total <b class='amt'></b></span><span>Reste <b class='left amt'></b></span>";var bs=r.querySelectorAll("b");bs[0].textContent=fmt(e.tot);bs[1].textContent=fmt(e.due);k.appendChild(r);
var z=mk("button",{type:"button",className:"alt",textContent:"Voir la fiche"});z.style.cssText="width:100%;margin-top:8px";z.addEventListener("click",function(){showClient(e)});k.appendChild(z);b.appendChild(k)})}
function showClient(e){$("cl-lw").hidden=true;var D=$("cl-det");D.hidden=false;D.innerHTML="";
D.appendChild(mk("h3",{textContent:e.nom}));D.appendChild(mk("div",{className:"meta",textContent:e.id+" · "+fmtT(e.tel)+(e.ville?" · "+e.ville:"")}));
var contact=mk("div",{className:"pc-client-contact",textContent:(e.adresse?"Adresse : "+e.adresse+" · ":"")+(e.zone?"Zone habituelle : "+e.zone:"")+(e.note?" · Notes : "+e.note:"")});D.appendChild(contact);
var g=mk("div",{className:"stats"});g.style.margin="10px 0";g.innerHTML="<div><span>Commandes</span><b class='nb'></b></div><div><span>Total dépensé</span><b></b></div><div><span>Déjà versé</span><b></b></div><div><span>Reste dû</span><b></b></div>";
var bs=g.querySelectorAll("b");bs[0].textContent=e.ord.length;bs[1].textContent=fmt(e.tot)+" F";bs[2].textContent=fmt(e.paid)+" F";bs[3].textContent=fmt(e.due)+" F";D.appendChild(g);
D.appendChild(mk("label",{textContent:"Langue des messages de ce client"}));
var ls=mk("select",{});[["fr","Français"],["en","English"]].forEach(function(o){ls.appendChild(mk("option",{value:o[0],textContent:o[1]}))});ls.value=e.lang;
ls.addEventListener("change",function(){e.lang=ls.value;e.ord.forEach(function(c){c.lang=ls.value});store()});D.appendChild(ls);
var bt=mk("div",{className:"btns"});
if(validTel(e.tel)){bt.appendChild(mk("a",{href:"https://api.whatsapp.com/send?phone="+digits(e.tel),target:"_blank",rel:"noopener",className:"btn",textContent:"WhatsApp"}));bt.appendChild(mk("a",{href:"tel:+"+digits(e.tel),className:"btnalt",textContent:"Appeler"}))}
var nw=mk("button",{type:"button",textContent:"Nouvelle commande"});nw.addEventListener("click",function(){$("m15").classList.remove("on");fromDv=0;openForm(null);$("f-nom").value=e.nom;$("f-tel").value=e.tel;if(e.ville){$("f-ville").value=e.ville;fillQ()}$("f-adresse").value=e.adresse||"";$("f-zone").value=e.zone;$("f-note").value=e.note||"";$("f-lang").value=e.lang});bt.appendChild(nw);
var bk=mk("button",{type:"button",className:"alt",textContent:"← Retour"});bk.addEventListener("click",function(){D.hidden=true;$("cl-lw").hidden=false});bt.appendChild(bk);D.appendChild(bt);
D.appendChild(mk("h3",{textContent:"Historique"}));D.lastChild.style.margin="14px 0 6px";
e.ord.slice().sort(function(a,c){return c.id-a.id}).forEach(function(c){var k=mk("div",{className:"card"});
k.appendChild(mk("div",{className:"meta",textContent:(c.id>1e12?dfr(cday(c))+" · ":"")+c.statut}));k.appendChild(mk("div",{textContent:itemsS(c)}));
var r=mk("div",{className:"row"});r.innerHTML="<span>Total <b class='amt'></b></span><span>Reste <b class='left amt'></b></span>";var b2=r.querySelectorAll("b");b2[0].textContent=fmt(c.total);b2[1].textContent=fmt(reste(c));k.appendChild(r);
var z=mk("button",{type:"button",className:"alt",textContent:"Reçu en image"});z.style.cssText="width:100%;margin-top:8px";z.addEventListener("click",function(){showRecuImg(c)});k.appendChild(z);D.appendChild(k)})}
$("cl-btn").addEventListener("click",function(){$("cl-det").hidden=true;$("cl-lw").hidden=false;$("cl-q").value="";drawClients();openM("m15")});
$("cl-q").addEventListener("input",drawClients);

// --- Tableau de bord d'accueil ---
function renderHome(){var h=$("home");if(!h)return;h.hidden=(view==="demo");if(view==="demo")return;
var td=today(),enc=0,nw=0,liv=0,livS=0,imp=0,impN=0;
data.forEach(function(c){if(c.demo)return;var x=dayInfo(c,td,td);enc+=x.py;if(x.cr)nw++;if(c.statut==="Annulée")return;
if(c.statut==="Arrivée à Douala"||c.statut==="Prête à livrer"){liv++;livS+=reste(c)}if(reste(c)>0){imp+=reste(c);impN++}});
var low=stk.filter(function(s){return(+s.q||0)<=(+s.seuil||0)}).length,wt=waitList().length,g=$("hm-g");g.innerHTML="";
function goList(q){qf=q;updChips();render();$("list").scrollIntoView({behavior:"smooth"})}
[["Encaissé aujourd'hui",fmt(enc)+" F","",0,function(){openBilan("j")}],
["Nouvelles commandes",String(nw),"aujourd'hui",1,function(){goList("")}],
["À livrer",String(liv),livS>0?fmt(livS)+" F à encaisser":"rien à encaisser",1,function(){goList("liv")},livS>0],
["Impayés",fmt(imp)+" F",impN+" client(s)",0,function(){goList("imp")}],
["Clients à relancer",String(wt),wt?"sans réponse":"personne en attente",1,function(){if(wt)$("w-see").click()}],
["Stock bas",String(low),stk.length?"sur "+stk.length+" produit(s)":"stock non suivi",1,function(){skReset();drawStock();openM("m17")}]].forEach(function(t){
var d=mk("div",{className:"tile"});d.setAttribute("role","button");d.tabIndex=0;d.appendChild(mk("span",{textContent:t[0]}));d.appendChild(mk("b",{className:t[3]?"nb":"",textContent:t[1]}));
var sm=mk("small",{textContent:t[2]});if(t[5]||t[0]==="Impayés")sm.className="amt";d.appendChild(sm);
d.addEventListener("click",t[4]);d.addEventListener("keydown",function(e){if(e.key==="Enter")t[4]()});g.appendChild(d)})}

// --- Mode discret : les montants sont floutés à l'écran ---
function applyPriv(){var on=lsg("pc_priv")==="1";document.body.classList.toggle("priv",on);$("priv").textContent=on?"🙈 Montants masqués":"👁 Mode discret"}
$("priv").addEventListener("click",function(){lss("pc_priv",lsg("pc_priv")==="1"?"0":"1");applyPriv()});

// --- Sauvegarde automatique + rappel ---
function bkFreq(){var f=lsg("pc_abf");return f===null?7:(+f||0)}
function snaps(){try{return JSON.parse(lsg("pc_snaps")||"[]")||[]}catch(e){return[]}}
function autoSnap(){if(lsg("pc_abc")==="0"||lsg("pc_asd")===today())return;var rows=pack().filter(function(c){return!c.demo});if(!cntOrders(rows))return;
var txt=JSON.stringify(rows),n=cntOrders(rows);
function put(s){var a=snaps();a.unshift(s);lss("pc_snaps",JSON.stringify(a.slice(0,3)));lss("pc_asd",today())}
if(lsg("pc_enc")==="1"){if(!ek)return;encBlob(ek,eSalt,txt).then(function(b){put({t:Date.now(),n:n,e:1,d:b})}).catch(function(){})}else put({t:Date.now(),n:n,d:txt})}
function backupNotify(){var t=+lsg("pc_bk")||0,fq=bkFreq();if(!fq||lsg("pc_abn")===today()||!data.some(function(c){return!c.demo}))return;
var d=t?Math.floor((Date.now()-t)/864e5):99;if(d<fq)return;lss("pc_abn",today());notify("Sauvegarde OrderPro","Fais une sauvegarde de tes commandes et envoie le fichier sur WhatsApp ou Google Drive.")}
function restoreSnap(s){function ap(t){var a;try{a=JSON.parse(t)}catch(e){alert("Copie illisible.");return}
if(!confirm("Remplacer les données actuelles par la copie du "+new Date(s.t).toLocaleDateString("fr-FR")+" ("+s.n+" commandes) ?"))return;
unpack(a);data.forEach(norm);store();refreshFilters();render();$("m18").classList.remove("on")}
if(s.e){if(!ek){alert("Déverrouille d'abord l'application.");return}decBlob(ek,s.d).then(ap,function(){alert("Copie illisible.")})}else ap(s.d)}
function drawAuto(){$("ab-f").value=String(bkFreq());$("ab-c").checked=lsg("pc_abc")!=="0";var b=$("ab-list");b.innerHTML="";var a=snaps();
if(!a.length){b.appendChild(mk("div",{className:"meta",textContent:"Aucune copie automatique pour le moment. La première est créée dès que tu as une commande."}));return}
a.forEach(function(s){var r=mk("div",{className:"row"});r.appendChild(mk("span",{textContent:new Date(s.t).toLocaleDateString("fr-FR")+" · "+s.n+" commande(s)"}));
var z=mk("button",{type:"button",className:"alt",textContent:"Restaurer"});z.style.padding="6px 10px";z.addEventListener("click",function(){restoreSnap(s)});r.appendChild(z);b.appendChild(r)})}
$("ab-btn").addEventListener("click",function(){autoSnap();drawAuto();openM("m18")});
$("ab-f").addEventListener("change",function(){lss("pc_abf",this.value);warn()});
$("ab-c").addEventListener("change",function(){lss("pc_abc",this.checked?"1":"0")});
$("ab-now").addEventListener("click",function(){$("save").click()});


// ===== DÉMARRAGE : chargement des données, verrouillage et affichage =====
function boot(){data.forEach(function(c){if(!c.demo&&c.vague==="Vague exemple"&&/^\+237 6700000/.test(c.tel||"")){c.demo=true;c.vague=DEMO}});data.forEach(norm);purgeTrash();applyPriv();refreshFilters();render();warn();bilanCheck()}
head();setMode(lsg("pc_mode")||"import");checkAct();
if(lsg("pc_enc")==="1"){$("m6").classList.add("on")}else{load();boot();if(lsg("pc_pin"))$("m6").classList.add("on")}
if(!lsg("pc_seen"))$("m3").classList.add("on");
setInterval(bilanCheck,60000);
})();

// ===== INSTALLATION (PWA) : service worker, bouton d'installation, aide iPhone =====
if("serviceWorker" in navigator){if(window.desktop){navigator.serviceWorker.getRegistrations().then(function(rs){if(!rs.length)return;return Promise.all(rs.map(function(r){return r.unregister()})).then(function(){location.reload()})}).catch(function(){})}else{window.addEventListener("load",function(){navigator.serviceWorker.register("service-worker.js").catch(function(){})})}}
(function(){var dp=null,bt=document.getElementById("inst"),hint=document.getElementById("ios-hint");
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent),standalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone;
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();dp=e;if(bt)bt.hidden=false});
if(bt)bt.addEventListener("click",function(){if(dp){dp.prompt();dp=null;bt.hidden=true}});
window.addEventListener("appinstalled",function(){if(bt)bt.hidden=true});
if(ios&&!standalone&&hint)hint.hidden=false})();
