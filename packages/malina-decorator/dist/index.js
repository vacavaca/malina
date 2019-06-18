"use strict";Object.defineProperty(exports,"__esModule",{value:true});var t=require("malina");var e=require("malina-util");function n(t,e,n,r,s,o,i){try{var a=t[o](i);var l=a.value}catch(t){n(t);return}if(a.done){e(l)}else{Promise.resolve(l).then(r,s)}}function r(t){return function(){var e=this,r=arguments;return new Promise(function(s,o){var i=t.apply(e,r);function a(t){n(i,s,o,a,l,"next",t)}function l(t){n(i,s,o,a,l,"throw",t)}a(undefined)})}}function s(t,e,n){if(e in t){Object.defineProperty(t,e,{value:n,enumerable:true,configurable:true,writable:true})}else{t[e]=n}return t}function o(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};var r=Object.keys(n);if(typeof Object.getOwnPropertySymbols==="function"){r=r.concat(Object.getOwnPropertySymbols(n).filter(function(t){return Object.getOwnPropertyDescriptor(n,t).enumerable}))}r.forEach(function(e){s(t,e,n[e])})}return t}const i=t=>t;const a=t=>e=>{if(t instanceof Function)return t(e)||{};else return t||{}};const l=(...e)=>t.decorator(n=>new t.Declaration(n.template,t=>{if(n.behavior instanceof Function)n.behavior(t);for(var r=0;r<e.length;r++){const n=e[r];n(t)}},n.actions));const c=t=>l(e=>{e.state=o({},a(t)(e.state),e.state)});const u=e=>t.decorator(n=>new t.Declaration(n.template,n.behavior,o({},n.actions||{},e||{})));const f=t=>l(e=>{if("create"in t)t.create(e);if("mount"in t)e.onMount(t.mount);if("update"in t)e.onUpdate(t.update);if("unmount"in t)e.onUnmount(t.unmount);if("destroy"in t)e.onDestroy(t.destroy)});const d=e=>t.decorator(n=>new t.Declaration(e,n.behavior,n.actions));const h=e=>t.decorator(n=>new t.Declaration(t=>{const r=()=>{return n.template(t)};return e(r)(t)},n.behavior,n.actions));const m=(e=i)=>t.decorator(n=>t.template(({state:r,children:s})=>t.h(n,e(r),s)));const p=(t={})=>m(n=>{const r={};var s=true;var o=false;var i=undefined;try{for(var a=e.keys(t)[Symbol.iterator](),l;!(s=(l=a.next()).done);s=true){const e=l.value;if(e in n)r[t[e]]=n[e]}}catch(t){o=true;i=t}finally{try{if(!s&&a.return!=null){a.return()}}finally{if(o){throw i}}}return r});const v=()=>t.warn(`Too many views are decorated with the same decorator, you are probably leaking view declarations i.e. declaring new views while running or rendering!\n\nKeep in mind that due to the declarative style of this library it's recommended to declare all your views statically, in the top-level scope of your modules.`);const y=(e,n=false,r=1e4)=>{const s=new Map;const o=n?r*2:r;return t.decorator(r=>{const i=r.id;if(s.has(i))return s.get(i);else{let a=e(r);if(s.size<o){s.set(i,a);if(n)s.set(a.id,a)}if(t.isDevelopment&&s.size>=o*.9)v();return a}})};class w{constructor(){this.listenerCounter=0;this.listeners={}}subscribe(t){const e=++this.listenerCounter;this.listeners[e]=t;return()=>delete this.listeners[e]}notify(...t){for(const e in this.listeners)this.listeners[e](...t)}}const b=Symbol.for("__malina_context");class g{constructor(t={}){this.value=t;this.emitter=new w}subscribe(t){return this.emitter.subscribe(t)}update(t,n=false){const r=o({},this.value,t);if(e.shallowEqual(this.value,r))return;this.value=r;if(!n)this.emitter.notify(this.value)}get(){return this.value}}const x=y(h(t=>({state:e})=>{const n=e[b];const r=t();if(n!=null)return _(n)(r);else return r}),true);const _=e=>n=>{if(!Array.isArray(n)){if(t.isViewNode(n)){const r=o({[b]:e},n.attrs!=null?n.attrs:{});return t.h(x(n.tag),r,n.children.map(_(e)))}else if(t.isElementNode(n))return t.h(n.tag,n.attrs,n.children.map(_(e)));else if(n instanceof Function)return(...t)=>_(e)(n(...t));else return n}else return n.map(_(e))};const S=t=>t;const C=(t=S)=>{const n=e=>{const n=t(e);const r=typeof n;if(r!=="object")throw new Error(`Context must be an object, got ${r}`);return n};return e.compose(x,f({create:t=>{if(!(b in t.state)){const e=new g(n(t));t.state[b]=e}else{const e=t.state[b];e.update(n(t))}},update:t=>{const e=t.state[b];e.update(n(t))}}))};const E=Symbol.for("__malina_context_subscription");const N=t=>({context:t});const k=(t=N)=>e.compose(f({create:e=>{let n=e.state[b];if(n!=null){e.state=o({},e.state,t(n.value)||{});e.state[E]=n.subscribe(n=>{e.update(o({},t(n)))})}},update:e=>{let n=e.state[b];if(n!=null)e.state=o({},e.state,t(n.value)||{})},destroy:({state:t})=>{if(E in t)t[E]()}}));const O=Symbol.for("__malina_styles");const A=Symbol.for("__malina_styles_attribute");const F=Symbol.for("__malina_styles_update");const R=Symbol.for("__malina_styles_update_attribute");const j=(t,n)=>{if(n==null||e.keys(n).length===0)return t||{};else if(t==null||e.keys(t).length===0)return n||{};else return o({},n||{},t||{})};const D=(t,e)=>{if(e!=null)return e;else return t};const M=(e,n)=>r=>{if(t.isElementNode(r)){if(r.attrs!=null&&n in r.attrs){const s=(r.attrs[n]||"").split(" ").filter(t=>t.length>0);const i=(r.attrs.class||"").split(" ").filter(t=>t.length>0);const a=s.map(t=>e[t]).filter(t=>t!=null).concat(i).join(" ");const l=o({},r.attrs);delete l[n];if(a.length>0)l.class=a;return t.h(r.tag,l,r.children.map(M(e,n)))}else return t.h(r.tag,r.attrs,r.children.map(M(e,n)))}else if(t.isViewNode(r)){const s=o({},r.attrs||null,{[F]:e,[R]:n});return t.h(r.tag,s,r.children.map(M(e,n)))}else return r};const $=y(e.compose(h(t=>({state:e})=>{const n=e||{},r=n[O],s=n[A];const o=e||{},i=o[F],a=o[R];const l=j(r,i);const c=D(s,a);const u=t();return M(l,c)(u)})),true);const P=(t,n="styleName")=>e.compose($,f({create:({state:e})=>{e[O]=j(e[O],t);e[A]=D(e[A],n)}}));const q=Symbol.for("__malina_ids");const U=Symbol.for("__malina-decorator.id.random");const V=t.getGlobal();let I;if(V!=null&&U in V)I=V[U];else{I=new e.Random("malina-decorator.id-seed");if(V!=null)V[U]=I}const L=(e,n,r)=>s=>{if(r==null)return s;if(Array.isArray(s))return s.map(L(e,n,r.ids));else if(t.isElementNode(s)){let a=s.attrs;const l=`${n}Id`;const c=`${n}HtmlFor`;const u=[];if(l in s.attrs){const t=s.attrs[l];a=o({},s.attrs,{id:t});delete a[l]}else if("id"in s.attrs)u.push("id");if(c in s.attrs){const t=s.attrs[c];a=o({},s.attrs,{for:t});delete a[c]}else if("htmlFor"in s.attrs)u.push("htmlFor");for(var i=0;i<u.length;i++){const n=u[i];const l=s.attrs[n];a=o({},s.attrs);if(l in r.ids)a[n]=r.ids[l];else{let s;if(t.isDevelopment){let t=++r.id;s=`${t}`;while(s.length<e)s=`0${s}`}else s=I.id(e);const o=`${l}_${s}`;r.ids[l]=o;a[n]=o}}return t.h(s.tag,a,s.children.map(L(e,n,r)))}else return s};const T=(t=4,n="real")=>e.compose(k(t=>q in t?{[q]:t[q]}:{}),C(({state:t})=>{if(!(q in t)){const e={ids:{},id:0};t[q]=e;return{[q]:e}}else return{}}),h(e=>r=>L(t,n,r.state[q])(e())));const z=(t,e)=>{let n=t;var r=true;var s=false;var o=undefined;try{for(var i=e[Symbol.iterator](),a;!(r=(a=i.next()).done);r=true){const t=a.value;if(n==null)break;n=n.childNodes[t]||null}}catch(t){s=true;o=t}finally{try{if(!r&&i.return!=null){i.return()}}finally{if(s){throw o}}}return n};const G=Symbol.for("__malina_refs");const H=t=>t.join(".");const B=new Set;const K=1e4;const W=e=>t.warn(`Incorrect use of refs:\n\n${e}\n\nViews can only handle its own refs. When a ref passed to a child-node inside another view-node it will be ignored`);const J=(e,n,r=null)=>{const s=t.isElementNode(n);const o=t.isViewNode(n);if(s&&e in n.attrs){if(r!=null&&B.size<K)B.add(r.tag.id);W(r||n);return true}else if(s||o&&!B.has(n.tag.id)){let t=false;var i=true;var a=false;var l=undefined;try{for(var c=n.children[Symbol.iterator](),u;!(i=(u=c.next()).done);i=true){const s=u.value;t=J(e,s,o?n:r);if(t)break}}catch(t){a=true;l=t}finally{try{if(!i&&c.return!=null){c.return()}}finally{if(a){throw l}}}return t}else return false};const Q=(t,e,n,r)=>e.children.map((e,s)=>{const o=n.concat([s]);return X(t,e,o,r).node});const X=(n,r,s,o)=>{const i=t.isElementNode(r);if(i&&n in r.attrs){const i=r.attrs[n];if(!(i instanceof Function)&&typeof i!=="string")throw new Error("Ref consumer must be a function or a string");o.set(H(s),{path:s,consumer:i});const a=Q(n,r,s,o);const l=t.h(r.tag,e.omit([n],r.attrs),a);return{refs:o,node:l}}else if(i){const e=Q(n,r,s,o);const i=t.h(r.tag,r.attrs,e);return{refs:o,node:i}}else if(t.isDevelopment&&t.isViewNode(r)&&!B.has(r.tag.id))J(n,r,r);return{refs:o,node:r}};const Y=(t,e)=>{const n=new Map;if(Array.isArray(e)){const r=[];for(const s in e){const o=[s];r.push(X(t,e,o,n).node)}return{refs:n,node:r}}else return X(t,e,[],n)};const Z=(t,{path:e,consumer:n})=>{const r=z(t.element,e);if(r==null)throw new Error("Internal error: element not found by ref");if(n instanceof Function)n(r);else t.state[n]=r};const tt=(t,e,n)=>{var r=true;var s=false;var o=undefined;try{for(var i=n.keys()[Symbol.iterator](),a;!(r=(a=i.next()).done);r=true){const r=a.value;if(e==null||!e.has(r))Z(t,n.get(r));else{const s=e.get(r);const o=n.get(r);if(s.consumer!==o.consumer)Z(t,o)}}}catch(t){s=true;o=t}finally{try{if(!r&&i.return!=null){i.return()}}finally{if(s){throw o}}}};const et=(t,e)=>{var n=true;var r=false;var s=undefined;try{for(var o=e.values()[Symbol.iterator](),i;!(n=(i=o.next()).done);n=true){const e=i.value.consumer;if(e instanceof Function)e(null);else t.state[e]=null}}catch(t){r=true;s=t}finally{try{if(!n&&o.return!=null){o.return()}}finally{if(r){throw s}}}};const nt=(t="ref")=>e.compose(h(e=>n=>{const r=e();const s=Y(t,r),o=s.refs,i=s.node;n.state[G].next=o;return i}),f({create:t=>{t.state[G]={prev:null,next:null}},mount:t=>{tt(t,t.state[G].prev,t.state[G].next);t.state[G].prev=t.state[G].next},update:t=>{tt(t,t.state[G].prev,t.state[G].next);t.state[G].prev=t.state[G].next},unmount:t=>{et(t,t.state[G].next);t.state[G].prev=null}}));const rt={};rt.finishUpdate=(t=>({state:n})=>{const r=o({},n.store,t);if(!e.shallowEqual(n.store,r))return{store:r}});rt.update=(t=>(function(){var e=r(function*({state:e,actions:n}){let r=o({},e.store);let s=t;if(t instanceof Function)s=t(r);if(s instanceof Promise)s=yield s;if(s!=null)yield n.finishUpdate(s)});return function(t){return e.apply(this,arguments)}})());const st=t=>(function(){var e=r(function*(...e){const n=yield t(...e);return n.store});return function(){return e.apply(this,arguments)}})();const ot=Symbol.for("__malina_store");const it=e.compose(C(({state:t,actions:e})=>({[ot]:{state:t.store,update:st(e.update)}})));const at=t.view(d(({state:e,children:n})=>t.h(e.view,e.passed,n)),c({store:null}),u(rt),it);const lt=e=>t.decorator(n=>({state:r,children:s})=>t.h(at,{store:e,passed:r,view:n},s));const ct=(...t)=>({});const ut=(t=ct,e=ct)=>k(n=>{if(ot in n){const r=n[ot];const s=t!=null?t:ct;const i=e!=null?e:ct;return o({},s(r.state),i(r.update))}else return{}});const ft=t=>n=>{const r={};var s=true;var o=false;var i=undefined;try{for(var a=e.keys(t)[Symbol.iterator](),l;!(s=(l=a.next()).done);s=true){const e=l.value;const s=t[e];if(s instanceof Function)r[e]=((...t)=>n(s(...t)));else r[e]=ft(s)(n)}}catch(t){o=true;i=t}finally{try{if(!s&&a.return!=null){a.return()}}finally{if(o){throw i}}}return r};const dt=t=>t.split("-").length>=2;const ht=t=>{if(!dt(t))throw new Error(`"${t}" is not valid custom element name`)};const mt=(e,n,r,{shadow:s="open",observe:o=[]})=>(class extends e.HTMLElement{constructor(...t){const n=super(...t);this.view=null;this.childObserver=new e.MutationObserver(this.handleChildMutations.bind(this));this.expectedRemove=[];this.waitingChildren=true;return n}static get observedAttributes(){return o||[]}connectedCallback(){if(this.view==null){const c=this.attachShadow({mode:s});const u={};var r=true;var o=false;var i=undefined;try{for(var a=this.attributes[Symbol.iterator](),l;!(r=(l=a.next()).done);r=true){const t=l.value;u[t.name]=t.value}}catch(t){o=true;i=t}finally{try{if(!r&&a.return!=null){a.return()}}finally{if(o){throw i}}}const f=Array.from(this.childNodes);this.view=t.instantiate(e.document,t.h(n,u,f));const d=this.view.render();c.appendChild(d.content)}this.view.attach(this.shadowRoot);this.childObserver.observe(this,{childList:true})}disconnectedCallback(){this.childObserver.disconnect();this.view.unmount()}attributeChangedCallback(t,e,n){if(this.view!=null){this.view.update({[t]:n})}}destroy(){this.view.destroy()}handleChildMutations(t){var e=true;var n=false;var r=undefined;try{for(var s=t[Symbol.iterator](),o;!(e=(o=s.next()).done);e=true){const t=o.value;if(t.type==="childList"){this.updateChildren(t);break}}}catch(t){n=true;r=t}finally{try{if(!e&&s.return!=null){s.return()}}finally{if(n){throw r}}}}updateChildren(t){if(this.waitingChildren){this.waitingChildren=false;const t=Array.from(this.childNodes);this.expectedRemove=t;this.view.update(null,t)}else{const e=this.expectedRemove.length;if(e!==t.removedNodes.length){this.waitingChildren=true;this.updateChildren(t);return}for(let n=0;n<e;n++){const e=this.expectedRemove[n];const r=t.removedNodes[n];if(e!==r){this.waitingChildren=true;this.updateChildren(t);return}}this.waitingChildren=true;this.expectedRemove=null}}});const pt=h(t=>n=>{const r=t();if(r.tag!=="template")throw new Error("Root element of a web-component must be a 'template' element");if(e.keys(r.attrs).length>0)throw new Error("Root element of a web-component must not have any attributes");return r});const vt=(e,n,r={})=>{ht(n);return t.decorator(t=>{if("customElements"in e){const s=mt(e,pt(t),n,r);e.customElements.define(n,s);return s}return null})};const yt=()=>{const e=t.getGlobal();if(!("window"in e))throw new Error('"window" not found in global scope');return e.window};const wt=(...t)=>{if(t.length===1){const e=yt();return vt(e,t[0])}else if(t.length===2){if(typeof t[0]==="string"){const e=yt();return vt(e,t[0],t[1])}else return vt(t[0],t[1])}else return vt(t[0],t[1],t[2])};exports.withBehavior=l;exports.withState=c;exports.withActions=u;exports.withLifecycle=f;exports.withTemplate=d;exports.mapTemplate=h;exports.mapState=m;exports.renameState=p;exports.withContext=C;exports.getContext=k;exports.cssModules=P;exports.withUniqIds=T;exports.withRefs=nt;exports.withStore=lt;exports.connect=ut;exports.bindActions=ft;exports.webComponent=wt;
