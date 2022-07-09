import{u as c}from"./language-d539864c.mjs";import{_ as r,o as i,c as d,a as t,t as o,d as m}from"./entry-43f5e220.mjs";const _={__name:"6",setup(n,{expose:s}){s();const{language:l}=c(),a={language:l,locales:{en:["Sign in to our platform","Your email","Your password","Remember me","Lost Password?","Login to your account","Not registered?","Create account"],zh_CN:["\u767B\u5F55\u6211\u4EEC\u7684\u5E73\u53F0","\u60A8\u7684\u90AE\u7BB1","\u60A8\u7684\u5BC6\u7801","\u8BB0\u4F4F\u6211","\u5FD8\u8BB0\u5BC6\u7801\uFF1F","\u767B\u5F55\u60A8\u7684\u8D26\u6237","\u6CA1\u6709\u6CE8\u518C\uFF1F","\u521B\u5EFA\u8D26\u6237"],ja:["\u30D7\u30E9\u30C3\u30C8\u30D5\u30A9\u30FC\u30E0\u306B\u30B5\u30A4\u30F3\u30A4\u30F3","\u3042\u306A\u305F\u306E\u30E1\u30FC\u30EB","\u3042\u306A\u305F\u306E\u30D1\u30B9\u30EF\u30FC\u30C9","\u79C1\u3092\u899A\u3048\u3066\u3044\u308B","\u30D1\u30B9\u30EF\u30FC\u30C9\u3092\u7D1B\u5931\u3057\u307E\u3057\u305F\u304B\uFF1F","\u30A2\u30AB\u30A6\u30F3\u30C8\u306B\u30ED\u30B0\u30A4\u30F3","\u767B\u9332\u3055\u308C\u3066\u3044\u307E\u305B\u3093\u304B\uFF1F","\u30A2\u30AB\u30A6\u30F3\u30C8\u306E\u4F5C\u6210"],ko:["\uD50C\uB7AB\uD3FC\uC5D0 \uB85C\uADF8\uC778","\uADC0\uD558\uC758 \uC774\uBA54\uC77C","\uBE44\uBC00\uBC88\uD638","\uB098\uB97C \uAE30\uC5B5\uD574","\uBE44\uBC00\uBC88\uD638\uB97C \uBD84\uC2E4\uD558\uC168\uC2B5\uB2C8\uAE4C?","\uACC4\uC815\uC5D0 \uB85C\uADF8\uC778","\uB4F1\uB85D\uB418\uC9C0 \uC54A\uC558\uC2B5\uB2C8\uAE4C?","\uACC4\uC815 \uB9CC\uB4E4\uAE30"]}};return Object.defineProperty(a,"__isScriptSetup",{enumerable:!1,value:!0}),a}},u={class:"p-4 w-full rounded-box max-w-md bg-base-100 border border-base-200 shadow-md sm:p-6 lg:p-8"},b={class:"space-y-6",action:"#"},p={class:"text-xl font-medium text-base-content"},f={for:"email",class:"block mb-2 text-sm font-medium text-base-content"},x=t("input",{type:"email",name:"email",id:"email",class:"input input-bordered w-full",placeholder:"name@company[2]om",required:""},null,-1),h={for:"password",class:"block mb-2 text-sm font-medium text-base-content"},g=t("input",{type:"password",name:"password",id:"password",placeholder:"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",class:"input input-bordered w-full",required:""},null,-1),w={class:"flex items-start justify-between"},y={class:"flex items-start"},k=t("input",{id:"remember",type:"checkbox",value:"",class:"checkbox checkbox-sm rounded-box",required:""},null,-1),v={for:"remember",class:"ml-2 text-sm font-medium text-base-content"},z={href:"#",class:"btn btn-link btn-xs capitalize"},N={type:"submit",class:"btn btn-primary w-full capitalize"},S={class:"text-sm font-medium text-base-content text-opacity-70"},j={href:"#",class:"btn btn-link btn-xs capitalize"};function q(n,s,l,e,a,B){return i(),d("div",u,[t("form",b,[t("h5",p,o(e.locales[e.language][0]),1),t("div",null,[t("label",f,o(e.locales[e.language][1]),1),x]),t("div",null,[t("label",h,o(e.locales[e.language][2]),1),g]),t("div",w,[t("div",y,[k,t("label",v,o(e.locales[e.language][3]),1)]),t("a",z,o(e.locales[e.language][4]),1)]),t("button",N,o(e.locales[e.language][5]),1),t("div",S,[m(o(e.locales[e.language][6])+" ",1),t("a",j,o(e.locales[e.language][7]),1)])])])}var L=r(_,[["render",q]]);export{L as default};