"use strict";Object.defineProperty(exports,"__esModule",{value:true});const t=(...t)=>{if(t.length===0)return t=>t;if(t.length===1)return t[0];return t.reduce((t,r)=>(...e)=>t(r(...e)))};const r=t=>Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t));const e=(t,r)=>{if(t===r)return true;if(t==null!==(r==null))return false;if(t==null)return true;const e=t.length;if(e!==r.length)return false;for(let n=0;n<e;n++){if(t[n]!==r[n])return false}return true};const n=(t,e)=>{if(t===e)return true;if(t==null!==(e==null))return false;if(t==null)return true;const n=r(t);const l=n.length;if(r(e).length!==l)return false;var u=true;var o=false;var s=undefined;try{for(var a=n[Symbol.iterator](),f;!(u=(f=a.next()).done);u=true){const r=f.value;if(t[r]!==e[r])return false}}catch(t){o=true;s=t}finally{try{if(!u&&a.return!=null){a.return()}}finally{if(o){throw s}}}return true};const l=(t,r)=>{const l=Array.isArray(t);if(l!==Array.isArray(r))return false;return l?e(t,r):n(t,r)};const u=(t,e)=>{const n={};const l={};const u=t.length;let o=0;while(o<u){l[t[o]]=true;o+=1}var s=true;var a=false;var f=undefined;try{for(var i=r(e)[Symbol.iterator](),c;!(s=(c=i.next()).done);s=true){const t=c.value;if(!(t in l))n[t]=e[t]}}catch(t){a=true;f=t}finally{try{if(!s&&i.return!=null){i.return()}}finally{if(a){throw f}}}return n};const o=t=>{const r=[];const e=t.length;let n=0;while(n<e){if(Array.isArray(t[n])){const e=o(t[n]);const l=e.length;let u=0;while(u<l){r[r.length]=e[u];u+=1}}else r[r.length]=t[n];n+=1}return r};const s="123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";const a=t=>{let r="";for(let e=0;e<t;e++)r+=s[Math.round(Math.random()*(s.length-1))];return r};exports.compose=t;exports.keys=r;exports.shallowEqual=l;exports.omit=u;exports.flatten=o;exports.genRandomId=a;
