"use strict";Object.defineProperty(exports,"__esModule",{value:true});var t=require("malina");var e=require("malina-util");function n(t,e,n,r,s,o,i){try{var l=t[o](i);var a=l.value}catch(t){n(t);return}if(l.done){e(a)}else{Promise.resolve(a).then(r,s)}}function r(t){return function(){var e=this,r=arguments;return new Promise(function(s,o){var i=t.apply(e,r);function l(t){n(i,s,o,l,a,"next",t)}function a(t){n(i,s,o,l,a,"throw",t)}l(undefined)})}}function s(t,e,n){if(e in t){Object.defineProperty(t,e,{value:n,enumerable:true,configurable:true,writable:true})}else{t[e]=n}return t}function o(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);if(e)r=r.filter(function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable});n.push.apply(n,r)}return n}function i(t){for(var e=1;e<arguments.length;e++){var n=arguments[e]!=null?arguments[e]:{};if(e%2){o(n,true).forEach(function(e){s(t,e,n[e])})}else if(Object.getOwnPropertyDescriptors){Object.defineProperties(t,Object.getOwnPropertyDescriptors(n))}else{o(n).forEach(function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))})}}return t}const l=Symbol.for("__malina_styles");const a=Symbol.for("__malina_styles_attribute");const c=Symbol.for("__malina_styles_update");const u=Symbol.for("__malina_styles_update_attribute");const f=(t,n)=>{if(n==null||e.keys(n).length===0)return t||{};else if(t==null||e.keys(t).length===0)return n||{};else return i({},n||{},{},t||{})};const d=(t,e)=>{if(e!=null)return e;else return t};const h=(e,n)=>r=>{if(t.isElementNode(r)){if(r.attrs!=null&&n in r.attrs){const s=(r.attrs[n]||"").split(" ").filter(t=>t.length>0);const o=(r.attrs.class||"").split(" ").filter(t=>t.length>0);const l=s.map(t=>e[t]).filter(t=>t!=null).concat(o).join(" ");const a=i({},r.attrs);delete a[n];if(l.length>0)a.class=l;return t.h(r.tag,a,r.children.map(h(e,n)))}else return t.h(r.tag,r.attrs,r.children.map(h(e,n)))}else if(t.isViewNode(r)){const s=i({},r.attrs||null,{[c]:e,[u]:n});return t.h(r.tag,s,r.children.map(h(e,n)))}else return r};const m=e.compose(t.mapTemplate(t=>({state:e})=>{const n=e||{},r=n[l],s=n[a];const o=e||{},i=o[c],m=o[u];const p=f(r,i);const v=d(s,m);const y=t();return h(p,v)(y)}));const p=(n,r="styleName")=>e.compose(m,t.withLifecycle({create:({state:t})=>{t[l]=f(t[l],n);t[a]=d(t[a],r)}}));const v=Symbol.for("__malina_ids");const y=Symbol.for("__malina-decorator.id.random");const w=t.getGlobal();let b;if(w!=null&&y in w)b=w[y];else{b=new e.Random("malina-decorator.id-seed");if(w!=null)w[y]=b}const g=(e,n,r)=>s=>{if(r==null)return s;if(Array.isArray(s))return s.map(g(e,n,r.ids));else if(t.isElementNode(s)){let a=s.attrs;const c=`${n}Id`;const u=`${n}HtmlFor`;const f=[];if(c in s.attrs){const t=s.attrs[c];a=i({},s.attrs,{id:t});delete a[c]}else if("id"in s.attrs)f.push("id");if(u in s.attrs){const t=s.attrs[u];a=i({},s.attrs,{for:t});delete a[u]}else if("htmlFor"in s.attrs)f.push("htmlFor");for(var o=0,l=f;o<l.length;o++){const n=l[o];const c=s.attrs[n];a=i({},s.attrs);if(c in r.ids)a[n]=r.ids[c];else{let s;if(t.isDevelopment){let t=++r.id;s=`${t}`;while(s.length<e)s=`0${s}`}else s=b.id(e);const o=`${c}_${s}`;r.ids[c]=o;a[n]=o}}return t.h(s.tag,a,s.children.map(g(e,n,r)))}else return s};const x=(n=4,r="real")=>e.compose(t.getContext(t=>v in t?{[v]:t[v]}:{}),t.withContext(({state:t})=>{if(!(v in t)){const e={ids:{},id:0};t[v]=e;return{[v]:e}}else return{}}),t.mapTemplate(t=>e=>g(n,r,e.state[v])(t())));const _=(t,e)=>{let n=t;var r=true;var s=false;var o=undefined;try{for(var i=e[Symbol.iterator](),l;!(r=(l=i.next()).done);r=true){const t=l.value;if(n==null)break;n=n.childNodes[t]||null}}catch(t){s=true;o=t}finally{try{if(!r&&i.return!=null){i.return()}}finally{if(s){throw o}}}return n};const C=Symbol.for("__malina_refs");const O=t=>t.join(".");const S=new Set;const E=1e4;const j=e=>t.warn(`Incorrect use of refs:\n\n${e}\n\nViews can only handle its own refs. When a ref passed to a child-node inside another view-node it will be ignored`);const N=(e,n,r=null)=>{const s=t.isElementNode(n);const o=t.isViewNode(n);if(s&&e in n.attrs){if(r!=null&&S.size<E)S.add(r.tag.id);j(r||n);return true}else if(s||o&&!S.has(n.tag.id)){let t=false;var i=true;var l=false;var a=undefined;try{for(var c=n.children[Symbol.iterator](),u;!(i=(u=c.next()).done);i=true){const s=u.value;t=N(e,s,o?n:r);if(t)break}}catch(t){l=true;a=t}finally{try{if(!i&&c.return!=null){c.return()}}finally{if(l){throw a}}}return t}else return false};const P=(t,e,n,r)=>e.children.map((e,s)=>{const o=n.concat([s]);return k(t,e,o,r).node});const k=(n,r,s,o)=>{const i=t.isElementNode(r);if(i&&n in r.attrs){const i=r.attrs[n];if(!(i instanceof Function)&&typeof i!=="string")throw new Error("Ref consumer must be a function or a string");o.set(O(s),{path:s,consumer:i});const l=P(n,r,s,o);const a=t.h(r.tag,e.omit([n],r.attrs),l);return{refs:o,node:a}}else if(i){const e=P(n,r,s,o);const i=t.h(r.tag,r.attrs,e);return{refs:o,node:i}}else if(t.isDevelopment&&t.isViewNode(r)&&!S.has(r.tag.id))N(n,r,r);return{refs:o,node:r}};const A=(t,e)=>{const n=new Map;if(Array.isArray(e)){const r=[];for(const s in e){const o=[s];r.push(k(t,e,o,n).node)}return{refs:n,node:r}}else return k(t,e,[],n)};const R=(t,{path:e,consumer:n})=>{const r=_(t.element,e);if(r==null)throw new Error("Internal error: element not found by ref");if(n instanceof Function)n(r);else t.state[n]=r};const F=(t,e,n)=>{var r=true;var s=false;var o=undefined;try{for(var i=n.keys()[Symbol.iterator](),l;!(r=(l=i.next()).done);r=true){const r=l.value;if(e==null||!e.has(r))R(t,n.get(r));else{const s=e.get(r);const o=n.get(r);if(s.consumer!==o.consumer)R(t,o)}}}catch(t){s=true;o=t}finally{try{if(!r&&i.return!=null){i.return()}}finally{if(s){throw o}}}};const M=(t,e)=>{var n=true;var r=false;var s=undefined;try{for(var o=e.values()[Symbol.iterator](),i;!(n=(i=o.next()).done);n=true){const e=i.value.consumer;if(e instanceof Function)e(null);else t.state[e]=null}}catch(t){r=true;s=t}finally{try{if(!n&&o.return!=null){o.return()}}finally{if(r){throw s}}}};const $=(n="ref")=>e.compose(t.mapTemplate(t=>e=>{const r=t();const s=A(n,r),o=s.refs,i=s.node;e.state[C].next=o;return i}),t.withLifecycle({create:t=>{t.state[C]={prev:null,next:null}},mount:t=>{F(t,t.state[C].prev,t.state[C].next);t.state[C].prev=t.state[C].next},update:t=>{F(t,t.state[C].prev,t.state[C].next);t.state[C].prev=t.state[C].next},unmount:t=>{M(t,t.state[C].next);t.state[C].prev=null}}));const D={};D.finishUpdate=(t=>({state:n})=>{const r=i({},n.store,{},t);if(!e.shallowEqual(n.store,r))return{store:r}});D.update=(t=>(function(){var e=r(function*({state:e,actions:n}){let r=i({},e.store);let s=t;if(t instanceof Function)s=t(r);if(s instanceof Promise)s=yield s;if(s!=null)yield n.finishUpdate(s)});return function(t){return e.apply(this,arguments)}})());const T=t=>(function(){var e=r(function*(...e){const n=yield t(...e);return n.store});return function(){return e.apply(this,arguments)}})();const L=Symbol.for("__malina_store");const V=e.compose(t.withContext(({state:t,actions:e})=>({[L]:{state:t.store,update:e.update}})));const q=t.view(t.withTemplate(({state:e,children:n})=>t.h(e.view,e.passed,n)),t.withState({store:null}),t.withActions(D),V);const I=e=>t.decorator(n=>({state:r,children:s})=>t.h(q,{store:e,passed:r,view:n},s));const H=(...t)=>({});const U=(e=H,n=H)=>t.getContext(t=>{if(L in t){const r=t[L];const s=e!=null?e:H;const o=n!=null?n:H;return i({},s(r.state)||{},{},o(r.update)||{})}else return{}});const z=t=>e.memoize(n=>{const r=T(n);const s={};var o=true;var i=false;var l=undefined;try{for(var a=e.keys(t)[Symbol.iterator](),c;!(o=(c=a.next()).done);o=true){const e=c.value;const o=t[e];if(o instanceof Function)s[e]=((...t)=>r(o(...t)));else s[e]=z(o)(n)}}catch(t){i=true;l=t}finally{try{if(!o&&a.return!=null){a.return()}}finally{if(i){throw l}}}return s});const G=t=>t instanceof t.ownerDocument.defaultView.HTMLTemplateElement;const W=t=>t.split("-").length>=2;const B=t=>{if(!W(t))throw new Error(`"${t}" is not valid custom element name`)};const J=(n,r,s,{shadow:o="open",observe:i={}})=>(class extends n.HTMLElement{constructor(...t){const e=super(...t);this.view=null;this.childObserver=new n.MutationObserver(this.handleChildMutations.bind(this));this.expectedRemove=[];this.waitingChildren=true;return e}static get observedAttributes(){return i!=null?Array.isArray(i)?i:e.keys(i):[]}connectedCallback(){if(this.view==null){const u=this.attachShadow({mode:o});const f={};var e=true;var s=false;var l=undefined;try{for(var a=this.attributes[Symbol.iterator](),c;!(e=(c=a.next()).done);e=true){const t=c.value;if(i!=null&&t.name in i)f[i[t.name]]=t.value;else f[t.name]=t.value}}catch(t){s=true;l=t}finally{try{if(!e&&a.return!=null){a.return()}}finally{if(s){throw l}}}const d=Array.from(this.childNodes);this.view=t.instantiate(n.document,t.h(r,f,d));const h=this.view.render();if(!G(h))throw new Error("Root element of a web-component must be a 'template' element");if(h.hasAttributes())throw new Error("Root element of a web-component must not have any attributes");u.appendChild(h.content)}this.view.attach(this.shadowRoot);this.childObserver.observe(this,{childList:true})}disconnectedCallback(){this.childObserver.disconnect();this.view.unmount()}attributeChangedCallback(t,e,n){if(this.view!=null){if(i!=null&&t in i)this.view.update({[i[t]]:n});else this.view.update({[t]:n})}}destroy(){this.view.destroy()}handleChildMutations(t){var e=true;var n=false;var r=undefined;try{for(var s=t[Symbol.iterator](),o;!(e=(o=s.next()).done);e=true){const t=o.value;if(t.type==="childList"){this.updateChildren(t);break}}}catch(t){n=true;r=t}finally{try{if(!e&&s.return!=null){s.return()}}finally{if(n){throw r}}}}updateChildren(t){if(this.waitingChildren){this.waitingChildren=false;const t=Array.from(this.childNodes);this.expectedRemove=t;this.view.update(null,t)}else{const e=this.expectedRemove.length;if(e!==t.removedNodes.length){this.waitingChildren=true;this.updateChildren(t);return}for(let n=0;n<e;n++){const e=this.expectedRemove[n];const r=t.removedNodes[n];if(e!==r){this.waitingChildren=true;this.updateChildren(t);return}}this.waitingChildren=true;this.expectedRemove=null}}});const K=(e,n,r={})=>{B(n);return t.decorator(t=>{if("customElements"in e){const s=J(e,t,n,r);e.customElements.define(n,s);return s}return null})};const Q=()=>{const e=t.getGlobal();if(!("window"in e))throw new Error('"window" not found in global scope');return e.window};const X=(...t)=>{if(t.length===1){const e=Q();return K(e,t[0])}else if(t.length===2){if(typeof t[0]==="string"){const e=Q();return K(e,t[0],t[1])}else return K(t[0],t[1])}else return K(t[0],t[1],t[2])};exports.cssModules=p;exports.withUniqIds=x;exports.withRefs=$;exports.withStore=I;exports.connect=U;exports.bindActions=z;exports.webComponent=X;
