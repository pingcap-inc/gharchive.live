"use strict";(self.webpackChunkweb=self.webpackChunkweb||[]).push([[5392],{25017:(e,t,n)=>{n.d(t,{Z:()=>r});const r=(0,n(23097).P)("legend",{},"Legend")},62286:(e,t,n)=>{n.d(t,{D:()=>r});const r=(0,n(23097).P)("title",{},"Title")},41109:(e,t,n)=>{n.d(t,{C:()=>w});var r=n(67294),l=n(26432),a=n(19604),o=n(61953),i=n(36336),c=n(31470),s=n(91655),m=n(18661),d=n(62348),u=n(14850),h=n(6971),p=n(47135),E=n(61802);const f={cop:"distributed",batchCop:"distributed",tikv:"row",tiflash:"column"},v=e=>{if(!e)return e;for(const[t,n]of Object.entries(f))e=e.replace(new RegExp(t,"g"),n);return e},g=e=>{let{sql:t,query:n,params:f,open:g,onClose:y}=e;const[b,w]=(0,r.useState)(null),{data:Z,error:x}=(0,h.WV)(`${b??"undefined"}/${n}`,f,!1,g&&!!b&&(0,E.nf)(f)),k=(0,l.Z)(((e,t)=>{w(t)}));return r.createElement(r.Fragment,null,r.createElement(c.Z,{open:g,maxWidth:"xl",fullWidth:!0,onClose:y},r.createElement(i.Z,null,r.createElement(d.Z,{value:b,onChange:k},r.createElement(m.Z,{value:null,label:"SQL"}),r.createElement(m.Z,{value:"explain",label:"EXPLAIN"})),r.createElement("br",null),b?(0,E.nf)(x)?r.createElement(a.Z,{severity:"error"},"Request failed $",(0,p.e$)(x)):(0,E.Rw)(Z)?r.createElement(o.Z,{sx:{pt:.5}},r.createElement(s.Z,{width:"80%"}),r.createElement(s.Z,{width:"50%"}),r.createElement(s.Z,{width:"70%"})):r.createElement(o.Z,{sx:{overflowX:"scroll",color:"rgb(248, 248, 242)",backgroundColor:"rgb(40, 42, 54)",borderRadius:2,py:2},mb:2},r.createElement(o.Z,{display:"table",fontFamily:"monospace",fontSize:16,lineHeight:1,sx:{borderSpacing:"16px 0"}},r.createElement(o.Z,{display:"table-header-group"},r.createElement(o.Z,{display:"table-row"},Z.fields.map((e=>r.createElement(o.Z,{key:e.name,display:"table-cell"},e.name))))),r.createElement(o.Z,{display:"table-footer-group"},Z.data.map(((e,t)=>r.createElement(o.Z,{key:t,display:"table-row"},Z.fields.map((t=>r.createElement(o.Z,{key:v(t.name),display:"table-cell",whiteSpace:"pre"},v(e[t.name])))))))))):r.createElement(u.Z,{className:"language-sql"},t))))};var y=n(54225),b=n(96214);function w(e){const[t,n]=(0,r.useState)(!1),a=(0,l.Z)((()=>{n(!1)})),o=(0,l.Z)((()=>{n(!0)}));return{dialog:r.createElement(g,{query:(null==e?void 0:e.query)??"",sql:null==e?void 0:e.sql,params:null==e?void 0:e.params,open:(0,E.nf)(e)&&t,onClose:a}),button:r.createElement(y.Z,{size:"small",onClick:o,endIcon:r.createElement(b.Z,null),disabled:(0,E.Rw)(e)},"SHOW SQL"),show:t}}},46101:(e,t,n)=>{n.d(t,{Z:()=>a});var r=n(67294),l=n(61802);const a=(0,r.forwardRef)((function(e,t){let{offset:n=40,scrollTarget:a,onVisibleElementChange:s,children:m}=e;const d=(0,r.useRef)([]),u=(0,r.useRef)(),h=(0,r.useMemo)((()=>({scrollTo(e,t){const r=d.current[e],l=a??window;if(r){const e=c(r,l);l.scrollTo({top:e-n+10,behavior:t}),"smooth"!==t&&setTimeout((()=>{null==p.current||p.current()}),10)}}})),[a,n]),p=(0,r.useRef)();i(t,h),(0,r.useEffect)((()=>{d.current=d.current.slice(0,m.length)}),[m.length]),(0,r.useEffect)((()=>{let e=!1;const t=new Set,r=u.current=new IntersectionObserver((n=>{n.forEach((e=>{e.isIntersecting?t.add(e.target):t.delete(e.target)})),e?0===t.size&&(o.removeEventListener("scroll",i),e=!1):t.size>0&&(o.addEventListener("scroll",i,{passive:!0}),e=!0)})),o=a??window,i=()=>{let e,r,a=Number.MIN_VALUE,i=Number.MAX_VALUE;for(const s of t.values()){if((0,l.Rw)(s))continue;const t=c(s,o)-window.scrollY-n+s.offsetHeight;t<0?t>a&&(a=t,e=s):t<i&&(i=t,r=s)}const m=r??e;if(m){const e=E(m);"number"==typeof e&&(null==s||s(e,m))}};return p.current=i,d.current.forEach((e=>{e&&r.observe(e)})),()=>{var e;p.current=void 0,null==(e=u.current)||e.disconnect(),o.removeEventListener("scroll",i)}}),[a]);const E=(0,r.useMemo)((()=>{const e=new WeakMap;return function(t,n){if("number"==typeof n)e.set(t,n);else{if(null!==n)return e.get(t);e.delete(t)}}}),[]),f=(0,r.useCallback)((e=>t=>{const n=d.current[e];d.current[e]=t;const r=u.current;t&&E(t,e),r&&(n&&r.unobserve(n),t&&r.observe(t))}),[]),v=(0,r.useMemo)((()=>m.map(((e,t)=>(0,r.cloneElement)(e,{ref:o(f(t),e.ref)})))),[m]);return r.createElement(r.Fragment,null,v)}));function o(e,t){return n=>{i(e,n),i(t,n)}}function i(e,t){"function"==typeof e?e(t):e&&(e.current=t)}function c(e,t){let n=0,r=e;for(;r!==t&&(n+=r.offsetTop,r=r.offsetParent,!(0,l.Rw)(r)););return n}},97780:(e,t,n)=>{n.d(t,{Z:()=>m});var r=n(67294),l=n(70131),a=n(10981),o=n(95487),i=n(61953),c=n(81719);function s(e,t){let{children:n,id:c}=e;const s=(0,o.Z)(),{inView:m,ref:u}=(0,l.YD)({fallbackInView:!0});return r.createElement(i.Z,{component:"section",sx:{py:4},ref:t,position:"relative"},c&&r.createElement(d,{id:c}),r.createElement("div",{ref:u},r.createElement(a.Z.Provider,{value:{inView:s&&m}},n)))}const m=(0,r.forwardRef)(s),d=(0,c.ZP)("div")({display:"block",position:"relative",top:"-100px",width:1})},75697:(e,t,n)=>{n.d(t,{O:()=>o,Z:()=>r.Z});var r=n(97780),l=n(67294),a=n(29630);const o=e=>{let{title:t,description:n}=e;return l.createElement(l.Fragment,null,l.createElement(a.Z,{variant:"h2"},t),l.createElement(a.Z,{variant:"body2",sx:{mt:1,mb:4}},n))}},89959:(e,t,n)=>{n.r(t),n.d(t,{default:()=>Mt});var r=n(67294),l=n(88242),a=n(75697);const o={data:void 0,loading:!1,error:void 0},i=(0,r.createContext)({query:"",data:o}),c=(0,r.createContext)({login:"",loading:!0}),s=(i.Provider,c.Provider),m=()=>(0,r.useContext)(c);var d=n(6971),u=n(61802);const h=["issues","pull_requests","reviews","pushes","review_comments","issue_comments"];function p(e,t,n,r){return void 0===r&&(r={}),(0,d.WV)(e,{userId:t,...r},!1,(0,u.nf)(t)&&n)}const E=[{key:"all",label:"All Contributions"},{key:"pushes",label:"Pushes"},{key:"pull_requests",label:"Pull Requests"},{key:"reviews",label:"Reviews"},{key:"review_comments",label:"Review Comments"},{key:"issues",label:"Issues"},{key:"issue_comments",label:"Issue Comments"}],f=[{key:"last_72_hours",label:"Last 3 days"},{key:"last_7_days",label:"Last Week"},{key:"last_28_days",label:"Last Month"}];var v=n(10981),g=n(85529),y=n(39960),b=n(60338),w=n(52483),Z=n(50982),x=n(90796),k=n(11905),C=n(62286);const _="primary_LzMy",I="blue_w7qU",S="orange_CuVe",R="red_IVbB",z="purple_x3Hq",M=["#FDE0E6","#FFBABA","#FF849E","#D34764","#AD2440","#862035","#581220"],T="#FDE494",q="#2F92FF",F="#BCDAFF",W="#FF9D36",A=M[3],V="#34A352",D="#6940D0",B=[q,A,W,D],L=[V,A,W,T,q,F];var P=n(21832),$=n(25017),H=n(38705),N=n(23097),O=n(16550),U=n(41109),Y=n(61953);const X=(0,r.createContext)({}),Q=function(e){let{title:t,description:n,href:l,chart:a,repo:o,remoteData:i,loading:c=!1,children:s}=e;const{userId:d}=m(),h=(0,O.k6)(),{dialog:p,button:E}=(0,U.C)(i);return(0,r.useEffect)((()=>{var e,t,n;c?null==a||null==(e=a.current)||e.showLoading("default",{color:"rgb(255, 232, 149)",textColor:"rgb(255, 232, 149)",maskColor:"rgba(0, 0, 0, 0.3)"}):(null==a||null==(t=a.current)||t.hideLoading(),null==a||null==(n=a.current)||n.setOption({graphic:[{id:"no-data",type:"text",left:"center",top:"middle",style:{opacity:c||(0,u.uW)(null==i?void 0:i.data)?0:void 0,fontSize:16,fontWeight:"bold",text:"No relevant data yet",fill:"#7c7c7c"}}]}))}),[c]),(0,r.useEffect)((()=>{var e,t;null==a||null==(e=a.current)||e.resize({width:"auto"}),null==a||null==(t=a.current)||t.dispatchAction({type:"dataZoom",start:0,end:100})}),[d]),(0,r.useEffect)((()=>{if(o&&(0,u.nf)(a)&&(0,u.nf)(a.current)){const e=e=>{let t;t=/[xy]Axis/.test(e.componentType)?e.value:e.name,/^[^/]+\/[^/]+$/.test(t)&&h.push(`/analyze/${t}`)};return a.current.on("click",e),()=>{var t;null==(t=a.current)||t.off("click",e)}}}),[o]),r.createElement(Y.Z,{sx:{mb:4}},r.createElement(X.Provider,{value:{title:t,description:n,href:l}},r.createElement(Y.Z,{display:"flex",justifyContent:"flex-end"},E),s,p))},j=(0,N.P)("dataZoom",{type:"slider"},"DataZoom"),G=e=>{let{hideZoom:t=!1,scrollY:n}=e;const{title:l}=(0,r.useContext)(X);return r.createElement(r.Fragment,null,!!l&&r.createElement(C.D,{text:l,left:"center"}),r.createElement($.Z,{type:"scroll",orient:"horizontal",top:32}),r.createElement(P.r,{top:64,left:8,right:(0,u.z0)(n)?16:8,bottom:t?8:48,containLabel:!0}),r.createElement(H.Z,{trigger:"axis",axisPointer:{type:"shadow"}}),t?void 0:r.createElement(j,{id:"x",showDataShadow:!1}),(0,u.z0)(n)?r.createElement(j,{id:"y",yAxisIndex:0,showDataShadow:!1,showDetail:!1,maxValueSpan:10,minValueSpan:n,zoomLock:!0,handleStyle:{opacity:0},width:8}):void 0)};var J=n(2548);function K(e,t){return(0,r.useMemo)((()=>Array.from(e.reduce(((e,n)=>e.add(n[t])),new Set))),[e,t])}var ee=n(9144),te=n(44731),ne=n(29630),re=n(81719),le=n(91655),ae=n(88784);const oe=(0,r.forwardRef)((function(e,t){return r.createElement(a.Z,{id:"overview",ref:t},r.createElement(ie,null))})),ie=()=>{const{login:e,userId:t}=m(),{inView:n}=(0,r.useContext)(v.Z);return r.createElement(r.Fragment,null,r.createElement(ce,{login:e}),r.createElement(ee.Z,{direction:["column","column","row"],alignItems:"center",sx:{mt:4},gap:4},r.createElement(Y.Z,{flex:1},r.createElement(a.O,{title:"Overview",description:r.createElement(r.Fragment,null,"All results are calculated only by developer's ",r.createElement("b",null,"public activities")," showed on GitHub. See details in ",r.createElement(y.Z,{href:"https://gharchive.org",target:"_blank"},"gharchive"),"!")}),r.createElement(se,{userId:t,login:e,show:n}),r.createElement(me,{login:e,userId:t,show:n})),r.createElement(Y.Z,{flex:1,width:"100%"},r.createElement(de,{login:e,userId:t,show:n}))))},ce=e=>{let{login:t}=e;return r.createElement(ee.Z,{direction:"row",alignItems:"center",justifyContent:"flex-start",divider:r.createElement(ue,null)},r.createElement(te.Z,{src:`https://github.com/${t}.png`,sx:{width:72,height:72}}),r.createElement(ee.Z,{alignItems:"flex-start",justifyContent:"space-around"},r.createElement(ne.Z,{variant:"h3",component:"h1"},t),r.createElement(ee.Z,{direction:"row",alignItems:"center",justifyContent:"flex-start",sx:{mt:1}},r.createElement(g.g_Y,null),r.createElement(y.Z,{href:`https://github.com/${t}`,target:"_blank",style:{marginLeft:8}},`https://github.com/${t}`))))},se=e=>{let{userId:t,show:n}=e;const{data:l}=function(e,t){const{data:n,loading:r,error:l}=(0,d.WV)("personal-overview",{userId:e},!1,(0,u.nf)(e)&&t);return{data:null==n?void 0:n.data[0],loading:r,error:l}}(t,(0,u.nf)(t)&&n),a=(0,r.useMemo)((()=>e=>{let t,{field:n,icon:a,name:o,tooltip:i,dataColSpan:c,children:s}=e;return i&&(t=r.createElement(ae.Z,{title:i,arrow:!0},r.createElement(J.Z,{fontSize:"small",htmlColor:"#535353",sx:{verticalAlign:"text-bottom"}}))),r.createElement(he,{data:l,name:n,renderValue:s,dataColSpan:c},a," ",o," ",t)}),[l]);return r.createElement("table",{style:{marginTop:16,width:"100%",display:"table"}},r.createElement("colgroup",null,r.createElement("col",null),r.createElement("col",null),r.createElement("col",null),r.createElement("col",null)),r.createElement("thead",null),r.createElement("tbody",null,r.createElement(pe,null,r.createElement(a,{field:"star_repos",name:"Starred Repos",icon:r.createElement(g.r7p,{className:S}),tooltip:"We only display the total number of stars and ignore developers' unstarring or restarring behaviors."}),r.createElement(a,{field:"star_earned",name:"Star Earned",icon:r.createElement(g.r7p,{className:S}),tooltip:"We calculate the total number of stars earned in public repositories owned by the individual developer(without developers' unstarring or restarring behaviors)."})),r.createElement(pe,null,r.createElement(a,{field:"contribute_repos",name:"Contributed to",icon:r.createElement(g.H0r,{className:z})}),r.createElement(a,{field:"issues",name:"Issues",icon:r.createElement(g.hEv,{className:_})})),r.createElement(pe,null,r.createElement(a,{field:"pull_requests",name:"Pull Requests",icon:r.createElement(g.UWO,{className:R})}),r.createElement(a,{field:"code_reviews",name:"Code Reviews",icon:r.createElement(g.fg9,{className:I})})),r.createElement(pe,null,r.createElement(a,{name:"PR Code Changes",icon:r.createElement(g.UWO,{className:R}),tooltip:"Here is the code line changes in pull requests.",dataColSpan:2},((e,t)=>r.createElement(r.Fragment,null,r.createElement(fe,null,"+",t.code_additions),"\xa0 / \xa0",r.createElement(ve,null,"-",t.code_deletions)))))))},me=e=>{let{userId:t,show:n}=e;const{data:l}=p("personal-languages",t,n);return(0,u.Rw)(l)?r.createElement(le.Z,null):r.createElement(Y.Z,{mt:4},r.createElement(ne.Z,{variant:"h3"},"Most Used Languages \xa0",r.createElement(ae.Z,{title:"Here is the most used languages in pull requests.",arrow:!0},r.createElement(J.Z,{fontSize:"small",htmlColor:"#535353",sx:{verticalAlign:"text-bottom"}}))),r.createElement(ge,{sx:{mt:2}},l.data.slice(0,4).map(((e,t)=>r.createElement(ye,{key:e.language,sx:{width:e.percentage,backgroundColor:B[t%B.length]}})))),r.createElement(ee.Z,{sx:{mt:2},flexWrap:"wrap",rowGap:2,columnGap:4,flexDirection:"row"},l.data.slice(0,4).map(((e,t)=>r.createElement(be,{key:e.language,color:B[t%B.length],label:e.language,percent:e.percentage}))),l.data.length>4?r.createElement(be,{color:"#3c3c3c",label:"Others",percent:l.data.slice(4).reduce(((e,t)=>e+t.percentage),0)}):void 0))},de=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-contribution-trends",t,n),o=K((null==l?void 0:l.data)??[],"contribution_type"),i=(0,r.useRef)(null);return r.createElement(Q,{title:"Contribution Trends",remoteData:l,loading:a,chart:i},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:i},r.createElement(k.Z,null,r.createElement(C.D,{text:"Contribution Trends",left:"center"}),r.createElement(G,{hideZoom:!0}),r.createElement(w.Z.Time.X,null),r.createElement(w.Z.Value.Y,null),h.map(((e,t)=>r.createElement(x.e,{key:e,name:e,color:L[t%L.length],datasetId:e,encode:{x:"event_month",y:"cnt"},symbolSize:0,lineStyle:{width:1},areaStyle:{opacity:.15}})))),o.map((e=>r.createElement(Z.q,{key:e,id:e,fromDatasetId:"original",transform:{type:"filter",config:{value:e,dimension:"contribution_type"}}}))),r.createElement(Z.q,{id:"original",source:(null==l?void 0:l.data)??[]})))},ue=(0,re.ZP)("hr")({display:"block",width:1,maxWidth:1,minWidth:1,height:72,margin:0,padding:0,border:"none",background:"#3c3c3c",marginLeft:16,marginRight:16}),he=e=>{let{children:t,name:n,data:l,renderValue:a=(e=>e),dataColSpan:o}=e;const i=(0,u.Rw)(n)?l:null==l?void 0:l[n];return r.createElement(r.Fragment,null,r.createElement(Ee,{sx:{color:"#C4C4C4"}},t),r.createElement(Ee,{colSpan:o},r.createElement("b",null,(0,u.Rw)(l)?r.createElement(le.Z,{width:24,sx:{display:"inline-block"}}):a(i,l))))},pe=(0,re.ZP)("tr")({backgroundColor:"transparent !important",border:0}),Ee=(0,re.ZP)("td")({border:0}),fe=(0,re.ZP)("span")({color:"#57ab5a"}),ve=(0,re.ZP)("span")({color:"#e5534b"}),ge=(0,re.ZP)("ol")({display:"flex",height:6,borderRadius:3,overflow:"hidden",margin:0,padding:0,listStyle:"none",background:"#3c3c3c"}),ye=(0,re.ZP)("li")({display:"inline",height:6}),be=e=>{let{color:t,label:n,percent:l}=e;return r.createElement(ee.Z,{alignItems:"center",flexDirection:"row"},r.createElement(Y.Z,{component:"span",display:"block",bgcolor:t,width:6,height:6,borderRadius:3,mr:1}),r.createElement(ne.Z,{component:"span",variant:"body2",color:"#F9F9F9",fontWeight:"bold"},n),"\xa0",r.createElement(ne.Z,{component:"span",variant:"body2",color:"#C4C4C4"},(100*l).toPrecision(2),"%"))};var we=n(58316),Ze=n(54029),xe=n(26432),ke=n(31538),Ce=n(55343);const _e=Array(24).fill(0).map(((e,t)=>t)),Ie=Array(7).fill(0).map(((e,t)=>t)),Se=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],Re=Array(24).fill(0).map(((e,t)=>t)),ze=["#2C2C2C","#00480D","#017420","#34A352","#6CDE8C","#B5FFC9"],Me=(e,t)=>{const n=e/t;return 0===e?ze[0]:n<.2?ze[1]:n<.4?ze[2]:n<.6?ze[3]:n<.8?ze[4]:ze[5]},Te=e=>{let{title:t,size:n,gap:l,offset:a,data:o}=e;const i=(0,r.useMemo)((()=>o.reduce(((e,t)=>Math.max(e,t.cnt)),0)),[o]),c=(0,r.useMemo)((()=>24*n+23*l+28),[n,l]),s=(0,r.useMemo)((()=>7*n+6*l+40),[n,l]);return r.createElement(Y.Z,{sx:{overflow:"auto",maxWidth:"calc(100vw - 32px)"}},r.createElement("svg",{xmlns:"http://www.w3.org/2000/svg",width:c,height:s+36,viewBox:`-28 -36 ${c+28} ${s+36}`,display:"block"},r.createElement("g",{id:"title"},r.createElement("text",{textAnchor:"middle",x:c/2-14,y:-28,fontSize:14,fill:"#dadada",fontWeight:"bold"},t)),r.createElement("g",{id:"chart"},_e.map((e=>Ie.map((t=>r.createElement("rect",{key:`${e}-${t}`,x:e*(n+l),y:t*(n+l),width:n,height:n,rx:3,ry:3,fill:Me(0,0)}))))),o.map((e=>{let{dayofweek:t,cnt:o,hour:c,type:s}=e;return r.createElement("rect",{key:`${c}-${t}`,x:(24+c+a)%24*(n+l),y:t*(n+l),width:n,height:n,rx:3,ry:3,fill:Me(o,i)})}))),r.createElement("g",{id:"labels"},Se.map(((e,t)=>r.createElement("text",{key:e,y:t*(n+l)+n-6,x:-4,textAnchor:"end",fontSize:12,fill:"#aaa",fontFamily:"monospace"},e))),Re.map(((e,t)=>r.createElement("text",{key:e,y:-6,x:(24+t)%24*(n+l)+n/2,textAnchor:"middle",fontSize:12,fill:"#aaa",fontFamily:"monospace"},e)))),r.createElement("g",{id:"legend"},r.createElement("text",{fontSize:12,fill:"#dadada",x:"0",y:s-29,alignmentBaseline:"text-before-edge"},"less"),ze.map(((e,t)=>r.createElement("rect",{key:e,fill:e,x:36+t*(n+4),y:s-28,width:n,height:n,rx:3,ry:3}))),r.createElement("text",{fontSize:12,fill:"#dadada",x:48+ze.length*(n+4),y:s-28,alignmentBaseline:"text-before-edge"},"more"))))};var qe=n(74118),Fe=n(9566);const We=(0,r.forwardRef)((function(e,t){return r.createElement(a.Z,{id:"behaviour",ref:t},r.createElement(Ae,null))})),Ae=()=>{const{userId:e}=m(),{inView:t}=(0,r.useContext)(v.Z);return r.createElement(r.Fragment,null,r.createElement(a.O,{title:"Behaviour",description:"You can see the total contributions in different repositories since 2011, as well as check the status of different contribution categories type by type."}),r.createElement(Ve,{userId:e,show:t}),r.createElement(Ne,{userId:e,show:t}))},Ve=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-contributions-for-repos",t,n),o=K((null==l?void 0:l.data)??[],"type"),i=(0,r.useMemo)((()=>{const e=((null==l?void 0:l.data)??[]).reduce(((e,t)=>e.set(t.repo_name,(e.get(t.repo_name)??0)+t.cnt)),new Map);return Array.from(e.entries()).sort(((e,t)=>t[1]-e[1])).map((e=>e[0]))}),[l]),c=(0,r.useRef)(null);return(0,u.Rw)(l)?r.createElement(r.Fragment,null):r.createElement(Q,{title:"Type of total contributions",chart:c,repo:!0,remoteData:l,loading:a},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:c},r.createElement(k.Z,{dependencies:[i]},r.createElement(G,{hideZoom:!0,scrollY:10}),r.createElement(w.Z.Value.X,{minInterval:1}),r.createElement(w.Z.Category.Y,{data:i,inverse:!0,triggerEvent:!0}),Be.map(((e,t)=>r.createElement(qe.Q,{key:e,datasetId:e,encode:{x:"cnt",y:"repo_name",tooltip:["cnt"]},emphasis:{focus:"series"},name:e,stack:"0",barMaxWidth:10,color:L[t%L.length]}))),o.map((e=>r.createElement(Z.q,{key:e,id:e,fromDatasetId:"original",transform:{type:"filter",config:{value:e,dimension:"type"}}})))),r.createElement(Z.q,{id:"original",source:(null==l?void 0:l.data)??[]})))};function De(e){return(0,Fe.o)(e).replace(/^\w/g,(e=>e.toUpperCase())).replace(/-/g," ")}const Be=["pushes","issues","issue_comments","pull_requests","reviews","review_comments"],Le=["all","pushes","issues","issue_comments","pull_requests","reviews","review_comments"],Pe=[],$e=["last_1_year","last_3_year","all_times"],He=e=>`UTC ${e<0?e:`+${e}`}`;for(let Tt=-11;Tt<=14;Tt++)Pe.push(Tt);const Ne=e=>{let{userId:t,show:n}=e;const[l,a]=(0,r.useState)("last_1_year"),{data:o}=p("personal-contribution-time-distribution",t,n,{period:l}),[i,c]=(0,r.useState)("all"),[s,m]=(0,r.useState)(0),d=(0,xe.Z)((e=>{c(e.target.value)})),u=(0,xe.Z)((e=>{m(Number(e.target.value))})),h=(0,xe.Z)((e=>{a(e.target.value)})),E=(0,r.useMemo)((()=>((null==o?void 0:o.data)??[]).filter((e=>e.type===i))),[o,i]),f=(0,r.useMemo)((()=>`Contribution time distribution for ${i} (${He(s)})`),[i,s]);return r.createElement(Q,{title:f,remoteData:o},r.createElement(Y.Z,{mt:4,mx:"auto",width:"max-content"},r.createElement(Y.Z,{mb:2,width:"max-content"},r.createElement(Ce.Z,{variant:"standard",size:"small",sx:{minWidth:80}},r.createElement(we.Z,{id:"period-selector-label"},"Period"),r.createElement(Ze.Z,{labelId:"period-selector-label",value:l,onChange:h},$e.map((e=>r.createElement(ke.Z,{key:e,value:e},De(e)))))),r.createElement(Ce.Z,{variant:"standard",size:"small",sx:{minWidth:120,ml:2}},r.createElement(we.Z,{id:"event-type-selector-label"},"Contribution Type"),r.createElement(Ze.Z,{id:"event-type-selector-label",value:i,onChange:d},Le.map((e=>r.createElement(ke.Z,{key:e,value:e},De(e)))))),r.createElement(Ce.Z,{variant:"standard",size:"small",sx:{minWidth:80,ml:2}},r.createElement(we.Z,{id:"time-zone-selector-label"},"Time Zone"),r.createElement(Ze.Z,{labelId:"time-zone-selector-label",value:s,onChange:u},Pe.map((e=>r.createElement(ke.Z,{key:e,value:e},He(e))))))),r.createElement(Te,{size:18,gap:4,offset:s,data:E,title:f})))},Oe=(0,r.forwardRef)((function(e,t){return r.createElement(a.Z,{id:"star",ref:t},r.createElement(Ue,null))})),Ue=()=>{const{userId:e}=m(),{inView:t}=(0,r.useContext)(v.Z);return r.createElement(Y.Z,null,r.createElement(a.O,{title:"Star",description:"The total number of starred repositories and ignore developers' unstarring or restarring behavior since 2011."}),r.createElement(Ye,{userId:e,show:t}))},Ye=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-star-history",t,n),o=(0,r.useMemo)((()=>{const e=((null==l?void 0:l.data)??[]).reduce(((e,t)=>e.set(t.star_month,(e.get(t.star_month)??0)+t.cnt)),new Map);return Array.from(e.entries()).map((e=>{let[t,n]=e;return{star_month:t,cnt:n}}))}),[l]),i=(0,r.useRef)(null);return r.createElement(Q,{title:"Star History",chart:i,remoteData:l,loading:a},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:i},r.createElement(k.Z,null,r.createElement(G,null),r.createElement(w.Z.Time.X,{min:"2011-01-01"}),r.createElement(w.Z.Value.Y,null),r.createElement(qe.Q,{encode:{x:"star_month",y:"cnt"},color:L,barMaxWidth:10})),r.createElement(Z.q,{id:"original",source:o})))},Xe=[{name:"xs",description:"0-9 lines"},{name:"s",description:"10-29 lines"},{name:"m",description:"30-99 lines"},{name:"l",description:"100-499 lines"},{name:"xl",description:"500-999 lines"},{name:"xxl",description:"1000+ lines"}],Qe=(0,r.forwardRef)((function(e,t){return r.createElement(a.Z,{id:"code",ref:t},r.createElement(je,null))})),je=()=>{const{inView:e}=(0,r.useContext)(v.Z),{userId:t}=m();return r.createElement(r.Fragment,null,r.createElement(a.O,{title:"Code",description:"All contributions measured with code related events since 2011.  For example, the history of code submits which includes the pushes and commits, the pull request history which includes merged / un-merged pull requests, the size of pull requests and the code line changes in pull requests."}),r.createElement(Ge,{userId:t,show:e}),r.createElement(Je,{userId:t,show:e}),r.createElement(Ke,{userId:t,show:e}),r.createElement(et,{userId:t,show:e}))},Ge=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-pushes-and-commits",t,n),o=(0,r.useRef)(null);return r.createElement(Q,{title:"Code Submit History",chart:o,remoteData:l,loading:a},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:o},r.createElement(k.Z,null,r.createElement(G,null),r.createElement(w.Z.Time.X,{min:"2011-01-01"}),r.createElement(w.Z.Value.Y,null),r.createElement(qe.Q,{encode:{x:"event_month",y:"pushes"},name:"push",color:V,barMaxWidth:10}),r.createElement(qe.Q,{encode:{x:"event_month",y:"commits"},name:"commit",color:"#DDFCE5",barMaxWidth:10})),r.createElement(Z.q,{source:(null==l?void 0:l.data)??[]})))},Je=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-pull-request-action-history",t,n),o=(0,r.useRef)(null);return r.createElement(Q,{title:"Pull Request History",chart:o,remoteData:l,loading:a},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:o},r.createElement(k.Z,null,r.createElement(G,null),r.createElement(w.Z.Time.X,{min:"2011-01-01"}),r.createElement(w.Z.Value.Y,null),r.createElement(x.e,{datasetId:"source",encode:{x:"event_month",y:"opened_prs"},name:"Opened PRs",color:V,areaStyle:{opacity:.15},symbolSize:0,lineStyle:{width:1}}),r.createElement(x.e,{datasetId:"source",encode:{x:"event_month",y:"merged_prs"},name:"Merged PRs",color:D,areaStyle:{opacity:.15},symbolSize:0,lineStyle:{width:1}})),r.createElement(Z.q,{id:"original",source:(null==l?void 0:l.data)??[]}),(0,u.uW)(null==l?void 0:l.data)?r.createElement(Z.q,{id:"source",fromDatasetId:"original",transform:{type:"sort",config:{dimension:"event_month",order:"asc"}}}):void 0))},Ke=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-pull-request-size-history",t,n),o=(0,r.useRef)(null);return r.createElement(Q,{title:"Pull Request Size",chart:o,remoteData:l,loading:a},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:o},r.createElement(k.Z,null,r.createElement(G,null),r.createElement(w.Z.Time.X,{min:"2011-01-01"}),r.createElement(w.Z.Value.Y,null),Xe.reverse().map(((e,t)=>r.createElement(qe.Q,{id:e.name,key:e.name,encode:{x:"event_month",y:e.name},name:`${e.name} (${e.description})`,stack:"total",color:M.slice(0,6).reverse()[t]})))),r.createElement(Z.q,{source:(null==l?void 0:l.data)??[]})))},et=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-pull-request-code-changes-history",t,n),o=(0,r.useMemo)((()=>(null==l?void 0:l.data.map((e=>{let{additions:t,deletions:n,event_month:r,changes:l}=e;return{additions:t,deletions:-n,changes:l,event_month:r}})))??[]),[l]),i=(0,r.useRef)(null);return r.createElement(Q,{title:"Lines of changes in PRs",chart:i,remoteData:l,loading:a},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:i},r.createElement(k.Z,null,r.createElement(G,null),r.createElement(w.Z.Time.X,{min:"2011-01-01"}),r.createElement(w.Z.Value.Y,{id:"code"}),r.createElement(x.e,{color:"#57ab5a",id:"add",yAxisId:"code",encode:{x:"event_month",y:"additions"},name:"Additions",areaStyle:{},symbolSize:0,lineStyle:{width:0}}),r.createElement(x.e,{color:"#e5534b",id:"del",yAxisId:"code",encode:{x:"event_month",y:"deletions"},name:"Deletions",areaStyle:{},symbolSize:0,lineStyle:{width:0}})),r.createElement(Z.q,{source:o})))},tt=(0,r.forwardRef)((function(e,t){return r.createElement(a.Z,{id:"code-review",ref:t},r.createElement(nt,null))})),nt=()=>{const{inView:e}=(0,r.useContext)(v.Z),{userId:t}=m();return r.createElement(r.Fragment,null,r.createElement(a.O,{title:"Code Review",description:"The history about the number of code review times and comments in pull requests since 2011."}),r.createElement(rt,{show:e,userId:t}))},rt=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-pull-request-reviews-history",t,n),o=(0,r.useRef)(null);return r.createElement(Q,{title:"Code Review History",chart:o,remoteData:l,loading:a},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:o},r.createElement(k.Z,null,r.createElement(G,null),r.createElement(w.Z.Time.X,{min:"2011-01-01"}),r.createElement(w.Z.Value.Y,null),r.createElement(qe.Q,{encode:{x:"event_month",y:"reviews"},name:"review",color:W,barMaxWidth:10}),r.createElement(qe.Q,{encode:{x:"event_month",y:"review_comments"},name:"review comments",color:T,barMaxWidth:10})),r.createElement(Z.q,{source:(null==l?void 0:l.data)??[]})))},lt=(0,r.forwardRef)((function(e,t){return r.createElement(a.Z,{id:"issue",ref:t},r.createElement(at,null))})),at=()=>{const{inView:e}=(0,r.useContext)(v.Z),{userId:t}=m();return r.createElement(r.Fragment,null,r.createElement(a.O,{title:"Issue",description:"The history about the total number of issues and issue comments since 2011."}),r.createElement(ot,{show:e,userId:t}))},ot=e=>{let{userId:t,show:n}=e;const{data:l,loading:a}=p("personal-issues-history",t,n),o=(0,r.useRef)(null);return r.createElement(Q,{title:"Issue History",chart:o,remoteData:l,loading:a},r.createElement(b.zU,{init:{height:400,renderer:"canvas"},theme:"dark",ref:o},r.createElement(k.Z,null,r.createElement(G,null),r.createElement(w.Z.Time.X,{min:"2011-01-01"}),r.createElement(w.Z.Value.Y,null),r.createElement(qe.Q,{encode:{x:"event_month",y:"issues"},name:"issue",color:q,barMaxWidth:10}),r.createElement(qe.Q,{encode:{x:"event_month",y:"issue_comments"},name:"issue comments",color:F,barMaxWidth:10})),r.createElement(Z.q,{source:(null==l?void 0:l.data)??[]})))};var it=n(97780);const ct=(0,r.forwardRef)((function(e,t){return r.createElement(it.Z,{id:"activities",ref:t},r.createElement(a.O,{title:"Contribution Activities",description:r.createElement(r.Fragment,null,"All personal activities happened on ",r.createElement("b",null,"all public repositories")," in GitHub since 2011. You can check each specific activity type by type with a timeline.")}),r.createElement(st,null))})),st=()=>{const{inView:e}=(0,r.useContext)(v.Z),{userId:t}=m();return r.createElement(r.Fragment,null,r.createElement(dt,{show:e,userId:t}))},mt=(0,N.P)("series",{type:"scatter"},"Scatter"),dt=e=>{let{userId:t,show:n}=e;const[l,a]=(0,r.useState)("all"),[o,i]=(0,r.useState)("last_28_days"),{data:c,loading:s}=function(e,t,n,r){return(0,d.WV)("personal-contribution-in-diff-repos",{userId:e,activity_type:t,time_range:n,period:"last_28_days"===n?"day":"hour"},!1,(0,u.nf)(e)&&r)}(t,l,o,n),m=K((null==c?void 0:c.data)??[],"repo_name"),[h,p]=(v=o,(0,r.useMemo)((()=>{const e=new Date;let t;switch(e.setMinutes(0,0,0),v){case"last_72_hours":t=2592e5;break;case"last_7_days":t=6048e5;break;case"last_28_days":t=24192e5}return[new Date(e.getTime()-t),e]}),[v]));var v;const g=(0,r.useMemo)((()=>{var e;return null==(e=E.find((e=>{let{key:t}=e;return l===t})))?void 0:e.label}),[l]),y=(0,r.useMemo)((()=>{var e;return null==(e=f.find((e=>{let{key:t}=e;return o===t})))?void 0:e.label}),[o]),x=(0,r.useCallback)((e=>{let{value:t}=e;return`${t.event_period} ${t.cnt} ${g} on ${t.repo_name}`}),[g]),_=(0,xe.Z)((e=>{a(e.target.value)})),I=(0,xe.Z)((e=>{i(e.target.value)})),S=(0,r.useMemo)((()=>`${g??"undefined"} in ${y??"undefined"}`),[g,y]),R=(0,r.useRef)(null);return r.createElement(Q,{title:S,chart:R,repo:!0,remoteData:c,loading:s},r.createElement(Y.Z,{mb:2},r.createElement(Ce.Z,{variant:"standard",size:"small",sx:{minWidth:120}},r.createElement(we.Z,{id:"event-type-selector-label"},"Contribution type"),r.createElement(Ze.Z,{id:"event-type-selector-label",value:l,onChange:_},E.map((e=>{let{key:t,label:n}=e;return r.createElement(ke.Z,{key:t,value:t},n)})))),r.createElement(Ce.Z,{variant:"standard",size:"small",sx:{minWidth:120,ml:2}},r.createElement(we.Z,{id:"event-type-selector-label"},"Period"),r.createElement(Ze.Z,{id:"event-type-selector-label",value:o,onChange:I},f.map((e=>{let{key:t,label:n}=e;return r.createElement(ke.Z,{key:t,value:t},n)}))))),r.createElement(b.zU,{init:{height:240+30*m.length,renderer:"canvas"},theme:"dark",ref:R},r.createElement(k.Z,null,r.createElement($.Z,{type:"scroll",orient:"horizontal",top:32}),r.createElement(P.r,{top:64,left:8,right:8,bottom:8,containLabel:!0}),r.createElement(H.Z,{trigger:"item"}),r.createElement(w.Z.Category.Y,{axisTick:{show:!1},axisLine:{show:!1},triggerEvent:!0})),r.createElement(C.D,{text:S,left:"center"}),r.createElement(w.Z.Time.X,{min:h,max:p}),r.createElement(mt,{encode:{x:"event_period",y:"repo_name",value:"cnt"},symbolSize:e=>Math.min(5*e.cnt,60),tooltip:{formatter:x},color:T}),r.createElement(Z.q,{source:(null==c?void 0:c.data)??[]})))};var ut=n(58904),ht=n(95242),pt=n(35969),Et=n(241),ft=n(70918),vt=n(18661),gt=n(62348);const yt=(0,re.ZP)("div")({width:"100%",height:"calc(100vh - var(--ifm-navbar-height))",backgroundColor:"#242526"}),bt=(0,re.ZP)(Y.Z)({backgroundColor:"#242526",height:"36px"});function wt(e){let{value:t,type:n,scrollTo:l}=e;const a=(0,r.useMemo)((()=>Zt.findIndex((e=>e.id===t))),[t]);return"side"===n?r.createElement(yt,null,r.createElement(bt,null),r.createElement(gt.Z,{orientation:"vertical",value:t??"overview",sx:{".MuiTabs-flexContainer":{gap:"16px"},".MuiTab-root":{fontSize:14,textDecoration:"none",textTransform:"none",py:.5,pl:4.5,height:28,minHeight:28,alignItems:"flex-start"}},variant:"scrollable",scrollButtons:"auto"},kt(void 0,a,l))):r.createElement(ft.Z,{sx:{position:"fixed",bottom:0,left:0,right:0},elevation:3},r.createElement(pt.Z,{showLabels:!0,value:t??"overview"},Ct(void 0)))}const Zt=[{id:"divider-0",label:"Analytics",icon:r.createElement(ut.Z,{fontSize:"inherit",sx:{mr:.5}})},{id:"overview",label:"Overview"},{id:"behaviour",label:"Behaviour"},{id:"star",label:"Star"},{id:"code",label:"Code"},{id:"code-review",label:"Code Review"},{id:"issue",label:"Issue"},{id:"divider-1",label:"Monthly Stats",icon:r.createElement(ht.Z,{fontSize:"inherit",sx:{mr:.5}})},{id:"activities",label:"Contribution Activities"}],xt=(e,t)=>t>e&&t-e<=5,kt=(e,t,n)=>Zt.slice(0,e).map(((e,l)=>e.id.startsWith("divider-")?r.createElement(vt.Z,{key:e.id,label:r.createElement(ee.Z,{sx:{fontSize:16,fontWeight:"bold",pl:2,color:xt(l,t)?"primary.main":void 0},direction:"row",alignItems:"center"},e.icon,r.createElement("span",null,e.label)),disabled:!0,sx:{padding:"0 !important"}}):r.createElement(vt.Z,{key:e.id,label:e.label,value:e.id,icon:e.icon,disableRipple:!0,onClick:(0,xe.Z)((()=>{n(e.id)}))}))),Ct=e=>Zt.slice(0,e).map((e=>e.id.startsWith("divider-")?void 0:r.createElement(Et.Z,{key:e.id,label:e.label,value:e.id,icon:e.icon,disableRipple:!0,onClick:(0,xe.Z)((()=>{var t;null==(t=document.getElementById(e.id))||t.scrollIntoView()}))})));var _t=n(36336),It=n(61225),St=n(31389),Rt=n(46101);const zt=["overview","behaviour","star","code","code-review","issue","activities"];const Mt=()=>{const{login:e,userId:t,loading:n,error:a}=function(){const{params:{login:e}}=(0,O.$B)(),{data:t,isValidating:n,error:r}=(0,St.aF)(e);return{login:e,userId:null==t?void 0:t.id,loading:n,error:r}}(),o=zt.map((e=>(0,r.useRef)(null))),i=(0,It.Z)("(max-width:600px)"),c=i?void 0:"160px",[m,d]=(0,r.useState)(0),h=(0,r.useRef)(null),p=(0,r.useCallback)((e=>{const t=h.current;t&&t.scrollTo(zt.indexOf(e))}),[]),E=(0,r.useMemo)((()=>r.createElement(_t.Z,{maxWidth:"lg"},r.createElement(Rt.Z,{ref:h,offset:140,onVisibleElementChange:d},r.createElement(oe,{ref:o[0],key:zt[0]}),r.createElement(We,{ref:o[1],key:zt[1]}),r.createElement(Oe,{ref:o[2],key:zt[2]}),r.createElement(Qe,{ref:o[3],key:zt[3]}),r.createElement(tt,{ref:o[4],key:zt[4]}),r.createElement(lt,{ref:o[5],key:zt[5]}),r.createElement(ct,{ref:o[6],key:zt[6]})))),[]);return(0,u.nf)(a)?r.createElement(O.l_,{to:"/404"}):r.createElement(l.Z,{Side:()=>i?null:r.createElement(wt,{value:zt[m],type:"side",scrollTo:p}),sideWidth:c},r.createElement(s,{value:{login:e,userId:t,loading:n,error:a}},E,i?r.createElement(wt,{value:zt[m],type:"bottom",scrollTo:p}):void 0))}},8106:(e,t,n)=>{n.d(t,{Z:()=>i});var r=n(67294),l=n(86010),a=n(95999);const o={copyButtonCopied:"copyButtonCopied__QnY",copyButtonIcons:"copyButtonIcons_FhaS",copyButtonIcon:"copyButtonIcon_phi_",copyButtonSuccessIcon:"copyButtonSuccessIcon_FfTR"};function i(e){let{code:t,className:n}=e;const[i,c]=(0,r.useState)(!1),s=(0,r.useRef)(void 0),m=(0,r.useCallback)((()=>{var e;e=t,navigator.clipboard.writeText(e).catch(console.error),c(!0),s.current=window.setTimeout((()=>{c(!1)}),1e3)}),[t]);return(0,r.useEffect)((()=>()=>window.clearTimeout(s.current)),[]),r.createElement("button",{type:"button","aria-label":i?(0,a.I)({id:"theme.CodeBlock.copied",message:"Copied",description:"The copied button label on code blocks"}):(0,a.I)({id:"theme.CodeBlock.copyButtonAriaLabel",message:"Copy code to clipboard",description:"The ARIA label for copy code blocks button"}),title:(0,a.I)({id:"theme.CodeBlock.copy",message:"Copy",description:"The copy button label on code blocks"}),className:(0,l.Z)("clean-btn",n,o.copyButton,i&&o.copyButtonCopied),onClick:m},r.createElement("span",{className:o.copyButtonIcons,"aria-hidden":"true"},r.createElement("svg",{className:o.copyButtonIcon,viewBox:"0 0 24 24"},r.createElement("path",{d:"M19,21H8V7H19M19,5H8A2,2 0 0,0 6,7V21A2,2 0 0,0 8,23H19A2,2 0 0,0 21,21V7A2,2 0 0,0 19,5M16,1H4A2,2 0 0,0 2,3V17H4V3H16V1Z"})),r.createElement("svg",{className:o.copyButtonSuccessIcon,viewBox:"0 0 24 24"},r.createElement("path",{d:"M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"}))))}},88242:(e,t,n)=>{n.d(t,{Z:()=>c});var r=n(87462),l=n(37187),a=n(67294),o=n(61802),i=n(61953);function c(e){let{children:t,header:n,dark:c,sideWidth:s,Side:m,footer:d=!0,...u}=e;return(0,a.useLayoutEffect)((()=>{var e;const t=location.hash.replace(/^#/,"");null==(e=document.getElementById(t))||e.scrollIntoView()}),[]),a.createElement(l.Z,(0,r.Z)({},u,{customFooter:d,header:n,sideWidth:s,side:s&&(0,o.nf)(m)?a.createElement(i.Z,{component:"aside",width:s,position:"sticky",top:"calc(var(--ifm-navbar-height) + 76px)",height:0,zIndex:0},a.createElement(i.Z,{marginTop:"-76px",height:"calc(100vh - var(--ifm-navbar-height))"},a.createElement(m,null))):void 0}),a.createElement("div",{hidden:!0,style:{height:72}}),a.createElement("div",{style:{paddingLeft:s,paddingRight:s}},a.createElement("main",{style:{"--ifm-container-width-xl":"1200px"}},t)))}}}]);