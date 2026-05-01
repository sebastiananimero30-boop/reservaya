import{c as s}from"./index-DTW2vbEk.js";import{u as n,a as o,b as i}from"./adapters-CkbSPliO.js";import{g as y,a as l,b as p,c as b}from"./restaurants-C_7uA0Kb.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=s("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=s("Star",[["polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",key:"8f66p6"}]]);function g(a){return{category:a.categoria||void 0,zone:a.zona||void 0,search:a.search||void 0}}function F(a={}){return n({queryKey:["restaurants",a],queryFn:async()=>y(g(a)).then(t=>{var e;return{data:(t.data??[]).map(o),total:t.total??((e=t.meta)==null?void 0:e.total)??0}})})}function R(a){return n({queryKey:["restaurant",a],queryFn:async()=>l(a).then(o),enabled:!!a})}function K(a,t,e,r){return n({queryKey:["availability",a,t,e,r],queryFn:async()=>p(a,t,e,r).then(u=>{const c=u.tables??u;return{time:e,tables:c.map(i)}}),enabled:!!(a&&t)})}function M(){return n({queryKey:["categories"],queryFn:async()=>b().then(a=>(a.data??a).map(e=>({id:e.id,nombre:e.name??e.nombre,slug:e.slug,icon:e.icon})))})}export{q as M,h as S,F as a,K as b,R as c,M as u};
