"use strict";Object.defineProperty(exports,"__esModule",{value:true});var e=require("malina-util");class t{constructor(e,t,s,n){this.template=e;this.state=t;this.actions=s;this.hooks=n}}const s=(e,s=null,n=null,i=null)=>new t(e instanceof Function?e:()=>e,s,n,i);const n=t;class i{constructor(e,t={},s=[]){if(e==null)throw new Error("JSX tag empty ");this.tag=e;this.attrs=t;this.children=s}toString(){const e=typeof this.tag==="string"?this.tag:"View";return`${e} ${JSON.stringify(this.attrs||{})}${this.children.length>0?`\n${this.children.map(e=>{if(e==null)return"\t''";const t=e.toString();return t.split("\n").map(e=>`\t${e}`).join("\n")}).join("\n")}`:""}`}}const r=e=>e instanceof i&&e.tag instanceof n;const o=e=>e instanceof i&&!r(e);const a=e=>typeof e==="string";const l=(e,t,...s)=>{const n=s.length===1&&Array.isArray(s[0])?s[0]:s;return new i(e,t,n)};const h=e=>`on${e[0].toUpperCase()}${e.substr(1)}`;const c=e=>{const t=e.toLowerCase();return t.startsWith("on")?t.substr(2):t};class d{constructor({isSvg:e=false}){this.isSvg=e}}const u=e=>Array.isArray(e)&&e.length===2&&e[0]instanceof Function;const f=(e,t)=>u(e)&&u(t)&&e[0]===t[0]&&e[1]===t[1];let m=false;let p=[];const w=()=>new d({});const y=()=>new d({isSvg:true});const v=e=>e.length===0;const g=(e,t)=>e.tag===t.tag;const A=e=>e.every((t,s)=>s===0||!r(t)||!r(e[s-1])||t.attrs.key||!g(t,e[s-1]));class N{constructor(e,t){const{tag:s,attrs:n,children:i}=e;const r=s.state instanceof Function?s.state(n):s.state;const o=s.actions instanceof Function?s.actions(n):s.actions;const a=s.hooks instanceof Function?s.hooks(n):s.hooks;this.template=s.template;this.state={...r||{},...n||{}};this.actions=this.bindActions(o||{});this.children=i;this.hooks=a||{};this.renderingContext=t||w();this.templateLock=false;this.updateLock=false;this.element=null;this.node=null;this.innerViews=new Map;this.parametrizedEventListeners=new Map;this.scheduledActions=[];this.mounted=false;this.destroyed=false;this.trackedActionUpdate=false;this.callHook("create")}static instantiate(e,t=null){if(!r(e))throw new Error("View can only be instantiated from view-nodes");return new N(e,t)}mount(e,t){const s=e.ownerDocument;if(this.destroyed)return;let n=false;if(!m){m=true;n=true}const i=this.renderTemplate();if(Array.isArray(i))throw new Error("View can only have one root element");if(o(i)){if(i.tag==="svg")this.renderingContext=y();const s=this.mountNodeElement(e,t,i,[]);this.element=s}else if(r(i)){const s=this.instantiateInnerView(i,[]);s.mount(e,t);this.element=s.element}else{const n=s.createTextNode(`${i!=null?i:""}`);this.element=n;const r=e.childNodes[t]||null;e.insertBefore(n,r)}this.node=i;this.mounted=true;for(const[e,t]of this.scheduledActions)this.callAction(e,...t);this.scheduledActions=[];if(n){for(const e of p)e();this.callHook("mount");m=false}else p.push(()=>this.callHook("mount"))}update(e=null,t=null){if(this.destroyed)throw new Error("View has been destroyed");const s=this.updateState(e);const n=this.updateChildrenState(t);const i=this.state!==s||this.children!==n;this.state=s;this.children=n;if(this.mounted&&i){this.refresh();this.callHook("update")}return i}refresh(){const e=this.renderTemplate();const t=this.node;this.node=e;this.patch(this.element,t,e,[])}unmount(e){this.mounted=false;if(o(this.node))this.destroyInnerViews(this.node,[]);else if(r(this.node))this.destroyInnerView([]);if(e)this.element.remove();this.callHook("unmount");this.element=null}destroy(e){this.unmount(e);this.callHook("destroy");this.destroyed=true}static getPathKey(e){return e.join(".")}static getAttrKey(e,t){return`${t}.${N.getPathKey(e)}`}renderTemplate(){this.templateLock=true;try{let e=this.template(this.state,this.actions,this.children);if(Array.isArray(e)){if(e.length!==1)throw new Error("Only one root element must be rendered for a view");e=e[0]}e=e!=null?e:"";return e}finally{this.templateLock=false}}bindActions(t){const s={};for(const n of e.keys(t)){const e=t[n];if(e instanceof Function)s[n]=((...e)=>this.callAction(t[n],...e));else s[n]=this.bindActions(e)}return s}callAction(e,...t){if(this.templateLock)throw new Error("Actions can't be called while rendering view template");if(this.mounted){const s=!this.updateLock;this.updateLock=true;const n=e(...t)(this.state,this.actions);if(n instanceof Promise){this.updateLock=false;if(this.trackedActionUpdate)this.refresh();this.trackedActionUpdate=false;return(async()=>{const e=await n;if(!this.destroyed)this.update(e);return this.state})()}else{if(s){if(!this.destroyed&&this.mounted){const e=this.update(n);if(!e&&this.trackedActionUpdate)this.refresh();this.trackedActionUpdate=false}else if(!this.destroyed)this.state=this.updateState(n)}else{const e=this.updateState(n);this.trackedActionUpdate=this.trackedActionUpdate||this.state!==e;this.state=e}this.updateLock=false;return this.state}}else this.scheduledActions.push([e,t])}updateState(t=null){if(t==null||t===this.state)return this.state;const s=t!==null?{...this.state,...t}:this.state;return!e.shallowEqual(this.state,s)?s:this.state}updateChildrenState(t=null){if(t===null||t===null)return this.children;const s=this.children==null||this.children.length===0;const n=t.length===0;if(s!==n)return t;else return!e.shallowEqual(this.children,t)?t:this.children}callHook(e){if(e in this.hooks)this.hooks[e](this.element,this.state,this.actions)}patch(e,t,s,n){if(t===s)return;if(o(t)){if(s==null)this.patchFromNodeToNone(e,t,n);else if(o(s))this.patchFromNodeToNode(e,t,s,n);else if(r(s))this.patchFromNodeToView(e,t,s,n);else this.patchFromNodeToText(e,t,s,n)}else if(r(t)){if(s==null)this.patchFromViewToNone(e,t,n);else if(o(s))this.patchFromViewToNode(e,t,s,n);else if(r(s))this.patchFromViewToView(e,t,s,n);else this.patchFromViewToText(e,t,s,n)}else{if(s==null)this.patchFromTextToNone(e,n);else if(o(s))this.patchFromTextToNode(e,s,n);else if(r(s))this.patchFromTextToView(e,s,n);else this.patchTextNodes(e,t,s,n)}}patchFromTextToNone(e,t){if(v(t))throw new Error("Root element deleted during patch");e.parentNode.removeChild(e)}patchTextNodes(e,t,s,n){if(t!==s){const t=e.ownerDocument.createTextNode(`${s}`);e.replaceWith(t);if(v(n))this.element=t}}patchFromTextToNode(e,t,s){const n=this.createNodeElement(e.ownerDocument,t,s);e.replaceWith(n);if(v(s))this.element=n}patchFromTextToView(e,t,s){const n=this.instantiateInnerView(t,s);const i=Array.from(e.parentNode.childNodes).findIndex(t=>t===e);const r=e.parentNode;e.remove();n.mount(r,i);if(v(s))this.element=n.element}patchFromNodeToNone(e,t,s){if(v(s))throw new Error("Root element deleted during patch");this.removeParametrizedListeners(t,s);this.destroyInnerViews(t,s);e.remove()}patchFromNodeToText(e,t,s,n){this.removeParametrizedListeners(t,n);this.destroyInnerViews(t,n);const i=e.ownerDocument.createTextNode(`${s}`);e.replaceWith(i);if(v(n))this.element=i}patchFromNodeToNode(e,t,s,n){if(t===s)return;if(t.tag===s.tag){this.updateAttributes(e,t,s,n);this.updateChildren(e,t,s,n)}else{this.removeParametrizedListeners(t,n);this.destroyInnerViews(t,n);const i=this.createNodeElement(e.ownerDocument,s,n);e.replaceWith(i);if(v(n))this.element=i}}patchFromNodeToView(e,t,s,n){this.removeParametrizedListeners(t,n);this.destroyInnerViews(t,n);const i=this.instantiateInnerView(s,n);const r=Array.from(e.parentNode.childNodes).findIndex(t=>t===e);const o=e.parentNode;e.remove();i.mount(o,r);if(v(n))this.element=i.element}patchFromViewToNone(e,t,s){if(v(s))throw new Error("Root element deleted during patch");this.destroyInnerView(s);e.remove()}patchFromViewToText(e,t,s,n){this.destroyInnerView(n);const i=e.ownerDocument.createTextNode(`${s}`);e.replaceWith(i);if(v(n))this.element=i}patchFromViewToNode(e,t,s,n){this.destroyInnerView(n);const i=this.createNodeElement(e.ownerDocument,s,n);e.replaceWith(i);if(v(n))this.element=i}patchFromViewToView(e,t,s,n){if(t===s)return;if(g(t,s)&&t.attrs.key===s.attrs.key){const e=this.getInstantiatedView(n);e.update(s.attrs,s.children)}else{this.destroyInnerView(n);const t=this.instantiateInnerView(s,n);const i=Array.from(e.parentNode.childNodes).findIndex(t=>t===e);const r=e.parentNode;e.remove();t.mount(r,i);if(v(n))this.element=t.element}}unmountPatch(){this.mounted=false;this.callHook("unmount");this.element=null}destroyInnerViews(e,t){for(const s in e.children){const n=t.concat([s]);const i=e.children[s];if(r(i))this.destroyInnerView(n);else if(o(i))this.destroyInnerViews(i,n)}}destroyInnerView(e){const t=this.getInstantiatedView(e);t.destroy(false);this.removeInstantiatedView(e)}createNodeElement(e,t,s){let n;if(this.renderingContext.isSvg)n=e.createElementNS("http://www.w3.org/2000/svg",t.tag);else n=e.createElement(t.tag);this.refreshAttributes(n,t,s);this.refreshChildren(n,t,s);return n}mountNodeElement(e,t,s,n){const i=e.ownerDocument;let r;if(this.renderingContext.isSvg)r=i.createElementNS("http://www.w3.org/2000/svg",s.tag);else r=i.createElement(s.tag);this.refreshAttributes(r,s,n);const o=e.childNodes[t]||null;e.insertBefore(r,o);this.refreshChildren(r,s,n,true);return r}refreshAttributes(e,t,s){for(const n in t.attrs){const i=t.attrs[n];this.addAttribute(e,n,i,s)}}updateAttributes(e,t,s,n){if(t===s)return;for(const i in s.attrs){const r=s.attrs[i];if(i in t.attrs){const s=t.attrs[i];this.updateAttribute(e,i,s,r,n)}else this.addAttribute(e,i,r,n)}for(const i in t.attrs){if(!(i in s.attrs))this.removeAttribute(e,i,t.attrs[i],n)}}addAttribute(e,t,s,n){if(t==="style"){for(const t in s)this.setStyleProp(e,t,s[t]||"")}else if(s instanceof Function)this.addEventListener(e,c(t),s);else if(u(s)){const i=this.createParametrizedListener(s[0],s[1],n,t);const r=c(t);this.addEventListener(e,r,i)}else if(t==="data"&&s!=null&&typeof s==="object"){for(const t in s)e.dataset[t]=s[t]}else if(t!=="focus"&&t in e&&!this.renderingContext.isSvg&&s!=null)e[t]=s;else if(typeof s==="boolean"){if(t==="focus"&&e.focus&&e.blur){if(s)e.focus();else e.blur()}else e.setattribute(t,t)}else if(s!=null)e.setAttribute(t,s)}updateAttribute(e,t,s,n,i){if(s===n)return;if(f(s,n))return;if(t==="style"){for(const t in s){if(!(t in n))this.removeStyleProp(e,t)}for(const t in n){const s=n[t]||"";this.setStyleProp(e,t,s)}}else if(n instanceof Function){this.removeAttribute(e,t,s,i);this.addAttribute(e,t,n,i)}else if(u(n)){this.removeAttribute(e,t,s,i);this.addAttribute(e,t,n,i)}else if(t==="data"){const t=s!=null&&typeof s==="object";const i=n!=null&&typeof n==="object";if(t&&i){for(const t in s){if(!(t in n))delete e.dataset[t]}for(const t in n)e.dataset[t]=n[t]}else if(t&&!i){for(const t in e.dataset)delete e.dataset[t]}else if(!t&&i){for(const t in n)e.dataset[t]=n[t]}}else if(t!=="focus"&&t in e&&!this.renderingContext.isSvg)e[t]=n;else if(typeof s==="boolean"){if(t==="focus"){if(e.focus&&e.blur){if(n)e.focus();else e.blur()}}else{if(n)e.setAttribute(t,t);else e.removeAttribute(t)}}else{if(n!=null)e.setAttribute(t,n);else e.removeAttribute(n)}}removeAttribute(e,t,s,n){if(t==="style")e.style.cssText="";else if(s instanceof Function){const n=c(t);this.removeEventListener(e,n,s)}else if(u(s)){const s=this.getParametrizedListener(n,t);const i=c(t);this.removeEventListener(e,i,s)}else if(t==="data"&&s!=null&&typeof s==="object"){for(const t in e.dataset)delete e.dataset[t]}else if(t!=="focus"&&t in e&&!this.renderingContext.isSvg)e[t]=undefined;else if(typeof s==="boolean"){if(t==="focus"&&e.blur)e.blur();else e.removeAttribute(t)}else if(s!=null)e.removeAttribute(t)}setStyleProp(e,t,s){if(t[0]==="-"){const n=s.indexOf("!important");let i=s;if(n!==-1)i=n!==s.slice(0,n)+s.slice(n+10);i=i.trim().replace(/;$/,"");e.style.setProperty(t,i)}else e.style[t]=s}removeStyleProp(e,t){if(t[0]==="-")e.style.removeProperty(t);else delete e.style[t]}addEventListener(e,t,s){if(e.addEventListener)e.addEventListener(t,s);else if(e.attachEvent)e.attachEvent(h(t),s);else{const n=e[t]&&e[t].listeners||[];if(e[t]!=null)e[t].listeners=n.concat(s);else{const i=(...s)=>e[t].listeners.map(e=>e(...s));i.listeners=n.concat(s);e[t]=i}}}removeEventListener(e,t,s){if(e.removeEventListener)e.removeEventListener(t,s);else if(e.detachEvent)e.detachEvent(h(t),s);else{if(e[t]!=null&&e[t].listeners!=null)e[t].listeners=e[t].listener.filter(e=>e!==s)}}refreshChildren(e,t,s,n=false){if(!A(t.children))throw new Error("Every view node in an array must have an unique 'key' attribute");for(const i in t.children){const r=t.children[i];const o=s.concat([i]);this.addChildren(e,r,i,o,n)}}addChildren(e,t,s=null,n,i=false){if(o(t)){if(i)this.mountNodeElement(e,null,t,n);else{const s=this.createNodeElement(e.ownerDocument,t,n);e.appendChild(s)}}else if(r(t)){const i=this.instantiateInnerView(t,n);i.mount(e,s)}else if(t!=null){const s=e.ownerDocument.createTextNode(`${t}`);e.appendChild(s)}}updateChildren(e,t,s,n){if(t===s)return;if(!A(s.children))throw new Error("Every view node in an array must have an unique 'key' attribute");const i=Math.max(t.children.length,s.children.length);let r=0;for(let o=0;o<i;o++){const i=e.childNodes[o-r];const a=t.children[o];const l=o in s.children?s.children[o]:null;const h=n.concat([o]);if(a!=null){this.patch(i,a,l,h);if(l==null)r+=1}else{this.addChildren(e,l,o,h);r-=1}}}instantiateInnerView(e,t){const s=N.getPathKey(t);const n=N.instantiate(e,this.renderingContext);this.innerViews.set(s,{view:n,path:t.slice()});return n}getInstantiatedView(e){const t=N.getPathKey(e);const s=this.innerViews.get(t);return s!=null?s.view:null}removeInstantiatedView(e){const t=N.getPathKey(e);this.innerViews.delete(t)}getParametrizedListener(e,t){const s=N.getAttrKey(e,t);return this.parametrizedEventListeners.get(s)}hasParametrizedListener(e,t){const s=N.getAttrKey(e,t);return this.parametrizedEventListeners.has(s)}createParametrizedListener(e,t,s,n){const i=(...s)=>e(...t,...s);const r=N.getAttrKey(s,n);this.parametrizedEventListeners.set(r,i);return i}removeParametrizedListeners(e,t){for(const s in e.attrs){if(this.hasParametrizedListener(t,s))this.removeParametrizedListener(t,s)}for(const s in e.children){const n=t.concat([s]);const i=e.children[s];if(o(i))this.removeParametrizedListeners(i,n)}}removeParametrizedListener(e,t){const s=N.getAttrKey(e,t);this.parametrizedEventListeners.delete(s)}}const V=(e,t,n=0)=>{let i=t;if(o(t))i=l(s(t));const r=e.ownerDocument.defaultView;const a=e instanceof r.SVGElement?y():w();const h=N.instantiate(i,a);h.mount(e,n);return h};const b=e=>t=>{let i;if(t instanceof n)i=t;else if(typeof t==="string")i=s((e,s,n)=>l(t,e,n));else i=s(t);const r=e(i);if(r instanceof n)return r;else return s(r)};exports.view=s;exports.h=l;exports.isElementNode=o;exports.isViewNode=r;exports.isTextNode=a;exports.Node=i;exports.mount=V;exports.decorator=b;
