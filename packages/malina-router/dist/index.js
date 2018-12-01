"use strict";Object.defineProperty(exports,"__esModule",{value:true});function t(t){return t&&typeof t==="object"&&"default"in t?t["default"]:t}var e=require("malina-decorator");var o=require("malina-util");var r=require("malina");var n=t(require("path-to-regexp"));const s=t=>({push(e,o){t.push(e,o)},replace(e,o){t.replace(e,o)},forward(){t.forward()},back(){t.back()}});const i=t=>({history:t,control:s(t)});const l=Symbol("update");const c=Symbol("subscription");const a=o.compose(e.withHooks({create:t=>(e,o,r)=>{t();const{router:n}=o;o[c]=n.history.listen(r[l])},destroy:t=>(e,o,r)=>{if(c in o)o[c]();t()}}),e.withActions({[l]:t=>()=>({location:t})}));const u=e.mapState(t=>({router:t.router.control,location:t.location||t.router.history.location,...o.omit(["history","router"],t)}));const h=e.mapState(t=>({router:t.router.control,...o.omit(["history","router"],t)}));const f=Symbol("router");const p=o.compose(e.getContext(t=>f in t?{router:t[f]}:{}),e.withContext(t=>{if(t==null||!("history"in t)&&!("router"in t))throw new Error("History object must be provided to the top-level routing view");if("history"in t&&!("router"in t)){const e=i(t.history);return{[f]:e}}else return{}}));const y=o.compose(p,h);const d=o.compose(a,p,u);const m=new Map;const w=1e4;const g=(t,e)=>{const o=Object.keys(e);if(!o.every(t=>{const o=e[t];return typeof o!=="object"&&typeof o!=="function"}))return null;o.sort();return`${t}${o.map(t=>`${t}:${e[t]}`).join(",")}`};const v=(t,e)=>{const o=g(t,e);if(m.has(o))return m.get(o);else{const r=[];const s=n(t,r,e);const i={regexp:s,keys:r};if(m.size<w)m.set(o,i);return i}};const b=(t,e,o={})=>{const{regexp:r,keys:n}=v(e,o);const s=r.exec(t);if(!s)return null;const i=s.slice(1);const l=n.reduce((t,e,o)=>((t[e.name]=i[o]||null)||true)&&t,{});return l};const x=(t,e,o={})=>{let r=o.hash?t.hash:t.pathname;if(o.hash&&!r.startsWith("#"))r=`#${r}`;if(!o.hash&&!r.startsWith("/"))r=`/${r}`;return b(r,e,o)};const k=Symbol("route");const S=r.view((t,e,o=[])=>{const r=o[0];if(o.length>1)throw new Error("You must provide ony one child to Route it can be a render function or a jsx node");const n=x(t.location,t.path,{...t.options,hash:!!t.hash});return r instanceof Function?r(n):r},{[k]:true});const j=o.compose(e.withState({[k]:true}),d)(S);const $=(t,e=false)=>n=>{const s=r.isViewNode(n);let i=s&&n.tag.state!=null;let l=null;if(i){const t=n.tag.state;l=t instanceof Function?t(n.attrs):t;i=l[k]}if(i){const{attrs:r}=n;const{children:s}=n;const i=x(t,r.path,{...r.options,hash:!!r.hash});if(i==null)return null;if(s.length>1){if(e)throw new Error("You must provide ony one child to Route it can be a render function or a jsx node");if(Array.isArray(s)){return o.flatten(s.map($(t))).filter(t=>t!=null)}else return $(t)(s)}else if(s.length===1){const e=s[0];const r=e instanceof Function?e(i):e;if(Array.isArray(r)){return o.flatten(r.map($(t))).filter(t=>t!=null)}else return $(t)(r)}else return null}else if(!r.isTextNode(n)){const e=o.flatten(n.children.map($(t))).filter(t=>t!=null);return r.h(n.tag,n.attrs,e)}else return n};const A=d(r.view((t,e,o)=>{if(o.length===0)return null;const r=o.map($(t.location,true)).filter(t=>t!=null);if(r.length===0)return null;if(r.length>1)throw new Error("Only one root node is allowed inside Switch");return r[0]}));const C={to:null,target:null,replace:false,state:{}};const R={};R.handleClick=(t=>({router:e,to:o,target:r,replace:n,state:s})=>{if(o==null)return;const i=!!(t.metaKey||t.altKey||t.ctrlKey||t.shiftKey);if(!t.defaultPrevented&&t.button===0&&(!r||r==="_self")&&!i){t.preventDefault();const r=n?e.replace:e.push;r(o,s)}});var q=y(r.view(({to:t,...e},n,s)=>r.h("a",{href:t,onClick:n.handleClick,...o.omit(["router","replace","state"],e)},s),C,R));exports.Switch=A;exports.Route=j;exports.match=x;exports.Link=q;exports.withRouter=y;exports.connectRouter=d;
