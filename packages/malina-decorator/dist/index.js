"use strict";Object.defineProperty(exports,"__esModule",{value:true});var e=require("malina");var t=require("malina-util");function n(e,t,n,r,s,o,i){try{var l=e[o](i);var a=l.value}catch(e){n(e);return}if(l.done){t(a)}else{Promise.resolve(a).then(r,s)}}function r(e){return function(){var t=this,r=arguments;return new Promise(function(s,o){var i=e.apply(t,r);function l(e){n(i,s,o,l,a,"next",e)}function a(e){n(i,s,o,l,a,"throw",e)}l(undefined)})}}function s(e,t,n){if(t in e){Object.defineProperty(e,t,{value:n,enumerable:true,configurable:true,writable:true})}else{e[t]=n}return e}function o(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);if(t)r=r.filter(function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable});n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=arguments[t]!=null?arguments[t]:{};if(t%2){o(n,true).forEach(function(t){s(e,t,n[t])})}else if(Object.getOwnPropertyDescriptors){Object.defineProperties(e,Object.getOwnPropertyDescriptors(n))}else{o(n).forEach(function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))})}}return e}const l=Symbol.for("__malina_styles");const a=Symbol.for("__malina_styles_attribute");const c=Symbol.for("__malina_styles_update");const u=Symbol.for("__malina_styles_update_attribute");const f=(e,n)=>{if(n==null||t.keys(n).length===0)return e||{};else if(e==null||t.keys(e).length===0)return n||{};else return i({},n||{},{},e||{})};const d=(e,t)=>{if(t!=null)return t;else return e};const h=(t,n)=>r=>{if(e.isElementNode(r)){if(r.attrs!=null&&n in r.attrs){const s=(r.attrs[n]||"").split(" ").filter(e=>e.length>0);const o=(r.attrs.class||"").split(" ").filter(e=>e.length>0);const l=s.map(e=>t[e]).filter(e=>e!=null).concat(o).join(" ");const a=i({},r.attrs);delete a[n];if(l.length>0)a.class=l;return e.h(r.tag,a,r.children.map(h(t,n)))}else return e.h(r.tag,r.attrs,r.children.map(h(t,n)))}else if(e.isViewNode(r)){const s=i({},r.attrs||null,{[c]:t,[u]:n});return e.h(r.tag,s,r.children.map(h(t,n)))}else return r};const m=t.compose(e.mapTemplate(e=>({state:t})=>{const n=t||{},r=n[l],s=n[a];const o=t||{},i=o[c],m=o[u];const p=f(r,i);const v=d(s,m);const y=e();return h(p,v)(y)}));const p=(n,r="styleName")=>t.compose(m,e.withLifecycle({create:({state:e})=>{e[l]=f(e[l],n);e[a]=d(e[a],r)}}));const v=Symbol.for("__malina_ids");const y=Symbol.for("__malina-decorator.id.random");const w=e.getGlobal();let b;if(w!=null&&y in w)b=w[y];else{b=new t.Random("malina-decorator.id-seed");if(w!=null)w[y]=b}const g=(t,n)=>r=>{if(n==null)return r;if(Array.isArray(r))return r.map(g(t,n.ids));else if(e.isElementNode(r)||t.views&&e.isViewNode(r)){let l=r.attrs;const a=`${t.realPrefix}Id`;const c=`${t.realPrefix}For`;const u=[];if(a in r.attrs){const e=r.attrs[a];l=i({},r.attrs,{id:e});delete l[a]}else if("id"in r.attrs)u.push("id");if(c in r.attrs){const e=r.attrs[c];l=i({},r.attrs,{for:e});delete l[c]}else if("for"in r.attrs)u.push("for");for(var s=0,o=u;s<o.length;s++){const a=o[s];const c=r.attrs[a];l=i({},r.attrs);if(c in n.ids)l[a]=n.ids[c];else{let r;if(e.isDevelopment){let e=++n.ref.id;r=`${e}`;while(r.length<t.length)r=`0${r}`}else r=b.id(t.length);const s=`${c}_${r}`;n.ids[c]=s;l[a]=s}}return e.h(r.tag,l,r.children.map(g(t,n)))}else return r};const x=(e={})=>({length:e.length||4,realPrefix:e.realPrefix||"html",views:e.views||false});const _=n=>t.compose(e.getContext(e=>v in e?{[v]:e[v]}:{}),e.withContext(({state:e})=>{if(!(v in e)){const t={id:0};e[v]=t;return{[v]:t}}else return{}}),e.mapTemplate(e=>t=>g(x(n),{ref:t.state[v],ids:{}})(e())));const C=(e,t)=>{let n=e;var r=true;var s=false;var o=undefined;try{for(var i=t[Symbol.iterator](),l;!(r=(l=i.next()).done);r=true){const e=l.value;if(n==null)break;n=n.childNodes[e]||null}}catch(e){s=true;o=e}finally{try{if(!r&&i.return!=null){i.return()}}finally{if(s){throw o}}}return n};const O=Symbol.for("__malina_refs");const S=e=>e.join(".");const E=new Set;const P=1e4;const N=t=>e.warn(`Incorrect use of refs:\n\n${t}\n\nViews can only handle its own refs. When a ref passed to a child-node inside another view-node it will be ignored`);const j=(t,n,r=null)=>{const s=e.isElementNode(n);const o=e.isViewNode(n);if(s&&t in n.attrs){if(r!=null&&E.size<P)E.add(r.tag.id);N(r||n);return true}else if(s||o&&!E.has(n.tag.id)){let e=false;var i=true;var l=false;var a=undefined;try{for(var c=n.children[Symbol.iterator](),u;!(i=(u=c.next()).done);i=true){const s=u.value;e=j(t,s,o?n:r);if(e)break}}catch(e){l=true;a=e}finally{try{if(!i&&c.return!=null){c.return()}}finally{if(l){throw a}}}return e}else return false};const k=(e,t,n,r)=>t.children.map((t,s)=>{const o=n.concat([s]);return A(e,t,o,r).node});const A=(n,r,s,o)=>{const i=e.isElementNode(r);if(i&&n in r.attrs){const i=r.attrs[n];if(!(i instanceof Function)&&typeof i!=="string")throw new Error("Ref consumer must be a function or a string");o.set(S(s),{path:s,consumer:i});const l=k(n,r,s,o);const a=e.h(r.tag,t.omit([n],r.attrs),l);return{refs:o,node:a}}else if(i){const t=k(n,r,s,o);const i=e.h(r.tag,r.attrs,t);return{refs:o,node:i}}else if(e.isDevelopment&&e.isViewNode(r)&&!E.has(r.tag.id))j(n,r,r);return{refs:o,node:r}};const R=(e,t)=>{const n=new Map;if(Array.isArray(t)){const r=[];for(const s in t){const o=[s];r.push(A(e,t,o,n).node)}return{refs:n,node:r}}else return A(e,t,[],n)};const M=(e,{path:t,consumer:n})=>{const r=C(e.element,t);if(r==null)throw new Error("Internal error: element not found by ref");if(n instanceof Function)n(r);else e.state[n]=r};const $=(e,t,n)=>{var r=true;var s=false;var o=undefined;try{for(var i=n.keys()[Symbol.iterator](),l;!(r=(l=i.next()).done);r=true){const r=l.value;if(t==null||!t.has(r))M(e,n.get(r));else{const s=t.get(r);const o=n.get(r);if(s.consumer!==o.consumer)M(e,o)}}}catch(e){s=true;o=e}finally{try{if(!r&&i.return!=null){i.return()}}finally{if(s){throw o}}}};const D=(e,t)=>{var n=true;var r=false;var s=undefined;try{for(var o=t.values()[Symbol.iterator](),i;!(n=(i=o.next()).done);n=true){const t=i.value.consumer;if(t instanceof Function)t(null);else e.state[t]=null}}catch(e){r=true;s=e}finally{try{if(!n&&o.return!=null){o.return()}}finally{if(r){throw s}}}};const T=(n="ref")=>t.compose(e.mapTemplate(e=>t=>{const r=e();const s=R(n,r),o=s.refs,i=s.node;t.state[O].next=o;return i}),e.withLifecycle({create:e=>{e.state[O]={prev:null,next:null}},mount:e=>{$(e,e.state[O].prev,e.state[O].next);e.state[O].prev=e.state[O].next},update:e=>{$(e,e.state[O].prev,e.state[O].next);e.state[O].prev=e.state[O].next},unmount:e=>{D(e,e.state[O].next);e.state[O].prev=null}}));const F={};F.finishUpdate=(e=>({state:n})=>{const r=i({},n.store,{},e);if(!t.shallowEqual(n.store,r))return{store:r}});F.update=(e=>(function(){var t=r(function*({state:t,actions:n}){let r=i({},t.store);let s=e;if(e instanceof Function)s=e(r);if(s instanceof Promise)s=yield s;if(s!=null)yield n.finishUpdate(s)});return function(e){return t.apply(this,arguments)}})());const L=e=>(function(){var t=r(function*(...t){const n=yield e(...t);return n.store});return function(){return t.apply(this,arguments)}})();const V=Symbol.for("__malina_store");const q=t.compose(e.withContext(({state:e,actions:t})=>({[V]:{state:e.store,update:t.update}})));const I=e.view(e.withTemplate(({children:e})=>e),e.withState({store:null}),e.withActions(F),q);const U=t=>e.decorator(n=>({state:r,children:s})=>e.h(I,{store:t},e.h(n,r,s)));const z=(...e)=>({});const G=(t=z,n=z)=>e.getContext(e=>{if(V in e){const r=e[V];const s=t!=null?t:z;const o=n!=null?n:z;return i({},s(r.state)||{},{},o(r.update)||{})}else return{}});const H=e=>t.memoize(n=>{const r=L(n);const s={};var o=true;var i=false;var l=undefined;try{for(var a=t.keys(e)[Symbol.iterator](),c;!(o=(c=a.next()).done);o=true){const t=c.value;const o=e[t];if(o instanceof Function)s[t]=((...e)=>r(o(...e)));else s[t]=H(o)(n)}}catch(e){i=true;l=e}finally{try{if(!o&&a.return!=null){a.return()}}finally{if(i){throw l}}}return s});const W=e=>e instanceof e.ownerDocument.defaultView.HTMLTemplateElement;const B=e=>e.split("-").length>=2;const J=e=>{if(!B(e))throw new Error(`"${e}" is not valid custom element name`)};const K=(n,r,s,{shadow:o="open",observe:i={}})=>(class extends n.HTMLElement{constructor(...e){const t=super(...e);this.view=null;this.childObserver=new n.MutationObserver(this.handleChildMutations.bind(this));this.expectedRemove=[];this.waitingChildren=true;return t}static get observedAttributes(){return i!=null?Array.isArray(i)?i:t.keys(i):[]}connectedCallback(){if(this.view==null){const u=this.attachShadow({mode:o});const f={};var t=true;var s=false;var l=undefined;try{for(var a=this.attributes[Symbol.iterator](),c;!(t=(c=a.next()).done);t=true){const e=c.value;if(i!=null&&e.name in i)f[i[e.name]]=e.value;else f[e.name]=e.value}}catch(e){s=true;l=e}finally{try{if(!t&&a.return!=null){a.return()}}finally{if(s){throw l}}}const d=Array.from(this.childNodes);this.view=e.instantiate(n.document,e.h(r,f,d));const h=this.view.render();if(!W(h))throw new Error("Root element of a web-component must be a 'template' element");if(h.hasAttributes())throw new Error("Root element of a web-component must not have any attributes");u.appendChild(h.content)}this.view.attach(this.shadowRoot);this.childObserver.observe(this,{childList:true})}disconnectedCallback(){this.childObserver.disconnect();this.view.unmount()}attributeChangedCallback(e,t,n){if(this.view!=null){if(i!=null&&e in i)this.view.update({[i[e]]:n});else this.view.update({[e]:n})}}destroy(){this.view.destroy()}handleChildMutations(e){var t=true;var n=false;var r=undefined;try{for(var s=e[Symbol.iterator](),o;!(t=(o=s.next()).done);t=true){const e=o.value;if(e.type==="childList"){this.updateChildren(e);break}}}catch(e){n=true;r=e}finally{try{if(!t&&s.return!=null){s.return()}}finally{if(n){throw r}}}}updateChildren(e){if(this.waitingChildren){this.waitingChildren=false;const e=Array.from(this.childNodes);this.expectedRemove=e;this.view.update(null,e)}else{const t=this.expectedRemove.length;if(t!==e.removedNodes.length){this.waitingChildren=true;this.updateChildren(e);return}for(let n=0;n<t;n++){const t=this.expectedRemove[n];const r=e.removedNodes[n];if(t!==r){this.waitingChildren=true;this.updateChildren(e);return}}this.waitingChildren=true;this.expectedRemove=null}}});const Q=(t,n,r={})=>{J(n);return e.decorator(e=>{if("customElements"in t){const s=K(t,e,n,r);t.customElements.define(n,s);return s}return null})};const X=()=>{const t=e.getGlobal();if(!("window"in t))throw new Error('"window" not found in global scope');return t.window};const Y=(...e)=>{if(e.length===1){const t=X();return Q(t,e[0])}else if(e.length===2){if(typeof e[0]==="string"){const t=X();return Q(t,e[0],e[1])}else return Q(e[0],e[1])}else return Q(e[0],e[1],e[2])};exports.cssModules=p;exports.withUniqIds=_;exports.withRefs=T;exports.withStore=U;exports.connect=G;exports.bindActions=H;exports.webComponent=Y;
