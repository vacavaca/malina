"use strict";Object.defineProperty(exports,"__esModule",{value:true});function r(r){return r&&typeof r==="object"&&"default"in r?r["default"]:r}var t=r(require("seedrandom"));const e=(...r)=>{if(r.length===0)return r=>r;if(r.length===1)return r[0];return r.reduce((r,t)=>(...e)=>t(r(...e)))};const n=r=>Object.getOwnPropertyNames(r).concat(Object.getOwnPropertySymbols(r));const l=(r,t)=>{if(r===t)return true;if(r==null!==(t==null))return false;if(r==null)return true;const e=r.length;if(e!==t.length)return false;for(let n=0;n<e;n++){if(r[n]!==t[n])return false}return true};const u=(r,t)=>{if(r===t)return true;if(r==null!==(t==null))return false;if(r==null)return true;const e=n(r);const l=e.length;if(n(t).length!==l)return false;var u=true;var o=false;var s=undefined;try{for(var a=e[Symbol.iterator](),f;!(u=(f=a.next()).done);u=true){const e=f.value;if(r[e]!==t[e])return false}}catch(r){o=true;s=r}finally{try{if(!u&&a.return!=null){a.return()}}finally{if(o){throw s}}}return true};const o=(r,t)=>{const e=Array.isArray(r);if(e!==Array.isArray(t))return false;return e?l(r,t):u(r,t)};const s=(r,t)=>{const e={};const l={};const u=r.length;let o=0;while(o<u){l[r[o]]=true;o+=1}var s=true;var a=false;var f=undefined;try{for(var i=n(t)[Symbol.iterator](),c;!(s=(c=i.next()).done);s=true){const r=c.value;if(!(r in l))e[r]=t[r]}}catch(r){a=true;f=r}finally{try{if(!s&&i.return!=null){i.return()}}finally{if(a){throw f}}}return e};const a=r=>{const t=[];const e=r.length;let n=0;while(n<e){if(Array.isArray(r[n])){const e=a(r[n]);const l=e.length;let u=0;while(u<l){t[t.length]=e[u];u+=1}}else t[t.length]=r[n];n+=1}return t};const f="123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";class i{constructor(r=null){this.rng=r!=null?t(r):Math.random}double(){return this.rng()}id(r,t=null){let e="";for(let t=0;t<r;t++)e+=f[Math.round(this.rng()*(f.length-1))];return e}}exports.compose=e;exports.keys=n;exports.shallowEqual=o;exports.omit=s;exports.flatten=a;exports.Random=i;
