import{k as K,l as ne,m as Q,i as S,p as T,q as re,s as $,v as se,x as ae,y as B,z as oe,_ as le,h as ie,u as ce,o as C,c as F,a as o,n as j,F as V,r as H,A as z,B as ue,e as de,w as fe,g as pe,t as M,f as he,C as me}from"./entry-c5beea7e.mjs";function I(e){return se()?(ae(e),!0):!1}var R;const k=typeof window!="undefined",ve=e=>typeof e=="string",L=()=>{};k&&((R=window==null?void 0:window.navigator)==null?void 0:R.userAgent)&&/iP(ad|hone|od)/.test(window.navigator.userAgent);function _e(e,t){function n(...r){e(()=>t.apply(this,r),{fn:t,thisArg:this,args:r})}return n}const Y=e=>e();function we(e=Y){const t=S(!0);function n(){t.value=!1}function r(){t.value=!0}return{isActive:t,pause:n,resume:r,eventFilter:(...a)=>{t.value&&e(...a)}}}function ge(e,t=!0){K()?re(e):t?e():Q(e)}function be(e,t=!0){K()?ne(e):t?e():Q(e)}function ye(e,t,n={}){const{immediate:r=!0}=n,s=S(!1);let a=null;function l(){a&&(clearTimeout(a),a=null)}function i(){s.value=!1,l()}function u(...h){l(),s.value=!0,a=setTimeout(()=>{s.value=!1,a=null,e(...h)},T(t))}return r&&(s.value=!0,k&&u()),I(i),{isPending:s,start:u,stop:i}}var W=Object.getOwnPropertySymbols,Oe=Object.prototype.hasOwnProperty,xe=Object.prototype.propertyIsEnumerable,Se=(e,t)=>{var n={};for(var r in e)Oe.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&W)for(var r of W(e))t.indexOf(r)<0&&xe.call(e,r)&&(n[r]=e[r]);return n};function Pe(e,t,n={}){const r=n,{eventFilter:s=Y}=r,a=Se(r,["eventFilter"]);return $(e,_e(s,t),a)}var ke=Object.defineProperty,je=Object.defineProperties,Ee=Object.getOwnPropertyDescriptors,N=Object.getOwnPropertySymbols,X=Object.prototype.hasOwnProperty,Z=Object.prototype.propertyIsEnumerable,U=(e,t,n)=>t in e?ke(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ce=(e,t)=>{for(var n in t||(t={}))X.call(t,n)&&U(e,n,t[n]);if(N)for(var n of N(t))Z.call(t,n)&&U(e,n,t[n]);return e},Fe=(e,t)=>je(e,Ee(t)),Me=(e,t)=>{var n={};for(var r in e)X.call(e,r)&&t.indexOf(r)<0&&(n[r]=e[r]);if(e!=null&&N)for(var r of N(e))t.indexOf(r)<0&&Z.call(e,r)&&(n[r]=e[r]);return n};function Ne(e,t,n={}){const r=n,{eventFilter:s}=r,a=Me(r,["eventFilter"]),{eventFilter:l,pause:i,resume:u,isActive:h}=we(s);return{stop:Pe(e,t,Fe(Ce({},a),{eventFilter:l})),pause:i,resume:u,isActive:h}}function Te(e){var t;const n=T(e);return(t=n==null?void 0:n.$el)!=null?t:n}const E=k?window:void 0;k&&window.document;const $e=k?window.navigator:void 0;k&&window.location;function ee(...e){let t,n,r,s;if(ve(e[0])?([n,r,s]=e,t=E):[t,n,r,s]=e,!t)return L;let a=L;const l=$(()=>Te(t),u=>{a(),u&&(u.addEventListener(n,r,s),a=()=>{u.removeEventListener(n,r,s),a=L})},{immediate:!0,flush:"post"}),i=()=>{l(),a()};return I(i),i}function Le(e,t={}){const{window:n=E}=t,r=Boolean(n&&"matchMedia"in n);let s;const a=S(!1),l=()=>{!r||(s||(s=n.matchMedia(e)),a.value=s.matches)};return ge(()=>{l(),s&&("addEventListener"in s?s.addEventListener("change",l):s.addListener(l),I(()=>{"removeEventListener"in s?s.removeEventListener("change",l):s.removeListener(l)}))}),a}function Be(e={}){const{navigator:t=$e,read:n=!1,source:r,copiedDuring:s=1500}=e,a=["copy","cut"],l=Boolean(t&&"clipboard"in t),i=S(""),u=S(!1),h=ye(()=>u.value=!1,s);function m(){t.clipboard.readText().then(d=>{i.value=d})}if(l&&n)for(const d of a)ee(d,m);async function _(d=T(r)){l&&d!=null&&(await t.clipboard.writeText(d),i.value=d,u.value=!0,h.start())}return{isSupported:l,text:i,copied:u,copy:_}}const A=typeof globalThis!="undefined"?globalThis:typeof window!="undefined"?window:typeof global!="undefined"?global:typeof self!="undefined"?self:{},D="__vueuse_ssr_handlers__";A[D]=A[D]||{};const Ae=A[D];function te(e,t){return Ae[e]||t}function De(e){return e==null?"any":e instanceof Set?"set":e instanceof Map?"map":e instanceof Date?"date":typeof e=="boolean"?"boolean":typeof e=="string"?"string":typeof e=="object"||Array.isArray(e)?"object":Number.isNaN(e)?"any":"number"}const Ie={boolean:{read:e=>e==="true",write:e=>String(e)},object:{read:e=>JSON.parse(e),write:e=>JSON.stringify(e)},number:{read:e=>Number.parseFloat(e),write:e=>String(e)},any:{read:e=>e,write:e=>String(e)},string:{read:e=>e,write:e=>String(e)},map:{read:e=>new Map(JSON.parse(e)),write:e=>JSON.stringify(Array.from(e.entries()))},set:{read:e=>new Set(JSON.parse(e)),write:e=>JSON.stringify(Array.from(e))},date:{read:e=>new Date(e),write:e=>e.toISOString()}};function Ve(e,t,n,r={}){var s;const{flush:a="pre",deep:l=!0,listenToStorageChanges:i=!0,writeDefaults:u=!0,shallow:h,window:m=E,eventFilter:_,onError:d=f=>{console.error(f)}}=r,w=(h?oe:S)(t);if(!n)try{n=te("getDefaultStorage",()=>{var f;return(f=E)==null?void 0:f.localStorage})()}catch(f){d(f)}if(!n)return w;const g=T(t),y=De(g),p=(s=r.serializer)!=null?s:Ie[y],{pause:b,resume:P}=Ne(w,()=>c(w.value),{flush:a,deep:l,eventFilter:_});return m&&i&&ee(m,"storage",O),O(),w;function c(f){try{f==null?n.removeItem(e):n.setItem(e,p.write(f))}catch(x){d(x)}}function v(f){if(!(f&&f.key!==e)){b();try{const x=f?f.newValue:n.getItem(e);return x==null?(u&&g!==null&&n.setItem(e,p.write(g)),g):typeof x!="string"?x:p.read(x)}catch(x){d(x)}finally{P()}}}function O(f){f&&f.key!==e||(w.value=v(f))}}function He(e){return Le("(prefers-color-scheme: dark)",e)}var ze=Object.defineProperty,J=Object.getOwnPropertySymbols,Re=Object.prototype.hasOwnProperty,We=Object.prototype.propertyIsEnumerable,q=(e,t,n)=>t in e?ze(e,t,{enumerable:!0,configurable:!0,writable:!0,value:n}):e[t]=n,Ue=(e,t)=>{for(var n in t||(t={}))Re.call(t,n)&&q(e,n,t[n]);if(J)for(var n of J(t))We.call(t,n)&&q(e,n,t[n]);return e};function Je(e={}){const{selector:t="html",attribute:n="class",window:r=E,storage:s,storageKey:a="vueuse-color-scheme",listenToStorageChanges:l=!0,storageRef:i}=e,u=Ue({auto:"",light:"light",dark:"dark"},e.modes||{}),h=He({window:r}),m=B(()=>h.value?"dark":"light"),_=i||(a==null?S("auto"):Ve(a,"auto",s,{window:r,listenToStorageChanges:l})),d=B({get(){return _.value==="auto"?m.value:_.value},set(p){_.value=p}}),w=te("updateHTMLAttrs",(p,b,P)=>{const c=r==null?void 0:r.document.querySelector(p);if(!!c)if(b==="class"){const v=P.split(/\s/g);Object.values(u).flatMap(O=>(O||"").split(/\s/g)).filter(Boolean).forEach(O=>{v.includes(O)?c.classList.add(O):c.classList.remove(O)})}else c.setAttribute(b,P)});function g(p){var b;w(t,n,(b=u[p])!=null?b:p)}function y(p){e.onChanged?e.onChanged(p,g):g(p)}return $(d,y,{flush:"post",immediate:!0}),be(()=>y(d.value)),d}var G;(function(e){e.UP="UP",e.RIGHT="RIGHT",e.DOWN="DOWN",e.LEFT="LEFT",e.NONE="NONE"})(G||(G={}));const qe=e=>`<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        href="https://cdn.jsdelivr.net/npm/daisyui@2.17.0/dist/full.css"
        rel="stylesheet"
        type="text/css"
      />
      <script src="https://cdn.tailwindcss.com"><\/script>
    </head>
    <body>
      <!-- \u66F4\u591A\u54CD\u5E94\u5F0F\u591A\u4E3B\u9898\u6A21\u677F: https://wcao.cc -->
      <!-- \u5207\u6362\u4E3B\u9898: <body data-theme='dark'> -->
      <!-- \u53EF\u7528\u4E3B\u9898\u5217\u8868: https://daisyui.com/docs/themes/ -->
      ${e}
    </body>
  </html>  
`,Ge={__name:"default",props:{lang:Boolean,daisyui:Boolean,middle:{type:Boolean,default:!0}},setup(e,{expose:t}){t();const n=e,{$faker:r}=ie(),s=ce(),{full:a}=s.query;let{language:l}=s.params;l||(l="en");const i=B(()=>{const c=s.path.split("/");return c.slice(c.length===4?2:1).join("/")}),u=()=>{const c="/beauty-template"+s.fullPath+"?full=true";window.open("https://wcao.cc"+c)},h=c=>{ue({titleTemplate:`[${m.value.icon} ${m.value.desc}] ${c.path.replace("/"+c.params.language,"").replace("/","")} - ${m.value.title}`})},m=S(),_=[{icon:"\u{1F1E8}\u{1F1F3}",text:"zh_CN",desc:"\u4E2D\u6587",title:"\u591A\u4E3B\u9898\u3001\u8BED\u8A00\u5207\u6362\u3001\u5728\u7EBF\u9884\u89C8\u6A21\u677F\uFF0C\u6240\u6709\u6A21\u677F\u57FA\u4E8Etailwindcss\u3001daisy ui\u3002"},{icon:"\u{1F1FA}\u{1F1F8}",text:"en",desc:"english",title:"Multiple themes, language switching, online preview templates, all templates are based on tailwindcss, daisy ui."},{icon:"\u{1F1EF}\u{1F1F5}",text:"ja",desc:"\u30B8\u30E3\u30D1\u30F3",title:"\u8907\u6570\u306E\u30C6\u30FC\u30DE\u3001\u8A00\u8A9E\u306E\u5207\u308A\u66FF\u3048\u3001\u30AA\u30F3\u30E9\u30A4\u30F3\u30D7\u30EC\u30D3\u30E5\u30FC\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u3001\u3059\u3079\u3066\u306E\u30C6\u30F3\u30D7\u30EC\u30FC\u30C8\u306F\u3001tailwindcss\u3001\u30C7\u30A4\u30B8\u30FCUI\u306B\u57FA\u3065\u3044\u3066\u3044\u307E\u3059\u3002"},{icon:"\u{1F1F0}\u{1F1F7}",text:"ko",desc:"\uD55C\uAD6D\uC5B4",title:"\uC5EC\uB7EC \uD14C\uB9C8, \uC5B8\uC5B4 \uC804\uD658, \uC628\uB77C\uC778 \uBBF8\uB9AC\uBCF4\uAE30 \uD15C\uD50C\uB9BF, \uBAA8\uB4E0 \uD15C\uD50C\uB9BF\uC740 tailwindcss, \uB370\uC774\uC9C0 UI\uB97C \uAE30\uBC18\uC73C\uB85C \uD569\uB2C8\uB2E4."}],d=c=>{m.value=_.filter(v=>v.text===c)[0]},{copy:w}=Be(),g=async()=>{const c=document.getElementById("template-wrapper");await w(qe(c.innerHTML)),alert("\u590D\u5236\u6210\u529F\uFF0C\u53EA\u9700\u8981\u7C98\u8D34\u5230\u4EFB\u610F\u4E00\u4E2Ahtml\u6587\u4EF6\u4E2D\uFF0C\u5373\u53EF\u5B8C\u7F8E\u590D\u523B\uFF01")},y=c=>{const v=c.split("_");v[1]&&(v[1]=v[1].toLocaleUpperCase()),r.setLocale(v.join("_"))};y(l),d(l),h(s),$(s,c=>{const v=c.params.language||"en";y(v),d(v),h(c)});const p=["light","dark","cupcake","bumblebee","emerald","corporate","synthwave","retro","cyberpunk","valentine","halloween","garden","forest","aqua","lofi","pastel","fantasy","wireframe","black","luxury","dracula","cmyk","autumn","business","acid","lemonade","night","coffee","winter"],b=Je({selector:"#beauty-template",attribute:"data-theme"}),P={props:n,$faker:r,route:s,full:a,language:l,url:i,openFull:u,setHead:h,curLang:m,langs:_,setCurLang:d,copy:w,onCopy:g,setLocale:y,themes:p,htmlMode:b};return Object.defineProperty(P,"__isScriptSetup",{enumerable:!1,value:!0}),P}},Ke={key:0,class:"drawer drawer-mobile"},Qe=o("input",{id:"my-drawer-2",type:"checkbox",class:"drawer-toggle"},null,-1),Ye={class:"drawer-content relative min-h-screen p-4"},Xe={class:"mockup-window border bg-base-100 shadow h-full relative"},Ze={class:"h-12 w-full absolute left-0 top-0 flex justify-end px-4 items-center border-b"},et=o("span",{class:"lowercase text-primary"},"daisy",-1),tt=o("span",{class:"!text-base-content uppercase"},"UI",-1),nt=[et,tt],rt=o("label",{tabindex:"0",class:"btn btn-sm m-1 capitalize"}," language ",-1),st={tabindex:"0",class:"dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 uppercase"},at={class:"flex"},ot={class:"ml-1"},lt={class:"badge badge-outline lowercase"},it=o("svg",{xmlns:"http://www.w3.org/2000/svg",class:"h-6 w-6",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2"},[o("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"})],-1),ct=[it],ut=o("svg",{xmlns:"http://www.w3.org/2000/svg",class:"h-6 w-6",fill:"none",viewBox:"0 0 24 24",stroke:"currentColor","stroke-width":"2"},[o("path",{"stroke-linecap":"round","stroke-linejoin":"round",d:"M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"})],-1),dt=[ut],ft={class:"w-full h-full overflow-y-scroll bg-neutral"},pt={class:"drawer-side"},ht=o("label",{for:"my-drawer-2",class:"drawer-overlay"},null,-1),mt={class:"menu p-4 overflow-y-auto w-72 bg-base-200 text-base-content scrollbar"},vt=["data-theme"],_t=["onClick"],wt=he('<div class="flex gap-1 h-4"><div class="bg-primary w-2 rounded"></div><div class="bg-secondary w-2 rounded"></div><div class="bg-accent w-2 rounded"></div><div class="bg-neutral w-2 rounded"></div></div>',1),gt={key:1,class:"flex justify-center items-center w-full min-h-screen bg-neutral-focus"};function bt(e,t,n,r,s,a){const l=me;return r.full?(C(),F("div",gt,[z(e.$slots,"default")])):(C(),F("div",Ke,[Qe,o("div",Ye,[o("div",Xe,[o("div",Ze,[o("button",{class:j(["btn btn-ghost btn-sm hover:bg-transparent font-light mr-2",{hidden:r.props.lang&&r.props.daisyui}])}," \u5B8C\u5584\u4E2D... ",2),o("div",{class:j(["btn btn-ghost hover:bg-transparent btn-sm",{hidden:!r.props.daisyui}])},nt,2),o("div",{class:j(["dropdown dropdown-end mr-2",{hidden:!r.props.lang}])},[rt,o("ul",st,[(C(),F(V,null,H(r.langs,i=>o("li",at,[de(l,{to:`/${i.text}/${r.url}`,class:"flex justify-between"},{default:fe(()=>[o("span",null,[pe(M(i.icon)+" ",1),o("span",ot,M(i.text),1)]),o("span",lt,M(i.desc),1)]),_:2},1032,["to"])])),64))])],2),o("div",{class:"btn btn-sm btn-ghost mr-2",onClick:r.onCopy},ct),o("button",{class:"btn btn-sm btn-ghost",onClick:r.openFull},dt)]),o("div",ft,[o("div",{class:j(["w-full min-h-full flex justify-center relative",{"items-center -mt-4":r.props.middle}]),id:"template-wrapper"},[z(e.$slots,"default")],2)])])]),o("div",pt,[ht,o("ul",mt,[(C(),F(V,null,H(r.themes,i=>o("li",{key:i,"data-theme":i,class:j(["my-2 shadow rounded-box",{"outline-dashed":r.htmlMode===i}])},[o("a",{href:"javascript:;",class:"flex justify-between hover:bg-transparent active:bg-transparent focus:bg-transparent",onClick:u=>r.htmlMode=i},[o("span",null,M(i),1),wt],8,_t)],10,vt)),64))])])]))}var Ot=le(Ge,[["render",bt]]);export{Ot as default};
