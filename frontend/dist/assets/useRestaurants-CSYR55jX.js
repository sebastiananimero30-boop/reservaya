import{c as u,g as s}from"./index--0XYAIe4.js";import{u as o,b as c,c as y}from"./adapters-DJVXZyJM.js";/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const q=u("MapPin",[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]]);/**
 * @license lucide-react v0.417.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const z=u("Star",[["polygon",{points:"12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",key:"8f66p6"}]]);function l(e={}){const t={...e,category:e.category??e.categoria,zone:e.zone??e.zona,search:e.search};return delete t.categoria,delete t.zona,delete t.precio,Object.fromEntries(Object.entries(t).filter(([,a])=>a!=null&&a!==""))}const d=e=>s.get("/restaurants",{params:l(e)}).then(t=>t.data),g=e=>s.get(`/restaurants/${e}`).then(t=>t.data),b=(e,t,a,n)=>s.get(`/restaurants/${e}/availability`,{params:{date:t,time:a,guests:n}}).then(r=>r.data),p=()=>s.get("/categories").then(e=>e.data);function h(e){return{category:e.categoria||void 0,zone:e.zona||void 0,search:e.search||void 0}}function R(e={}){return o({queryKey:["restaurants",e],queryFn:async()=>d(h(e)).then(t=>{var a;return{data:(t.data??[]).map(c),total:t.total??((a=t.meta)==null?void 0:a.total)??0}})})}function F(e){return o({queryKey:["restaurant",e],queryFn:async()=>g(e).then(c),enabled:!!e})}function K(e,t,a,n){return o({queryKey:["availability",e,t,a,n],queryFn:async()=>b(e,t,a,n).then(r=>{const i=r.tables??r;return{time:a,tables:i.map(y)}}),enabled:!!(e&&t)})}function M(){return o({queryKey:["categories"],queryFn:async()=>p().then(e=>(e.data??e).map(a=>({id:a.id,nombre:a.name??a.nombre,slug:a.slug,icon:a.icon})))})}export{q as M,z as S,R as a,K as b,F as c,M as u};
