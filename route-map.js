/* Coordinate-only schematic: no map SDK, API keys, or external assets. */
(()=>{'use strict';
const P=window.VISIT_PLAN,$=id=>document.getElementById(id),colors=['','#176b91','#b05b36','#397d4c','#805398'];
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const origin=new URL(P.routes[0].legs[0].navigation).searchParams.get('from').split(',').map(Number);
const coords=s=>new URL(s.navigation).searchParams.get('to').split(',').map(Number);
const earthCos=Math.cos(origin[1]*Math.PI/180),position=c=>[(c[0]-origin[0])*earthCos*111.32,(c[1]-origin[1])*111.32];
let group=1,mode='all',zoom=1,selectStore,previous='',width=0;
const viewport=$('routeViewport'),svg=$('routeSvg');
function draw(){
 const W=Math.max(320,viewport.clientWidth),H=340;
 width=W;
 const selected=P.routes.filter(r=>mode==='all'||r.group===group);
 const nodes=selected.flatMap(r=>r.order.map((id,i)=>({id,group:r.group,n:i+1,store:P.stores[id-1],xy:position(coords(P.stores[id-1]))})));
 const xs=[0,...nodes.map(n=>n.xy[0])],ys=[0,...nodes.map(n=>n.xy[1])];
 const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const pad=44,scale=Math.min((W-2*pad)/Math.max(.1,maxX-minX),(H-2*pad)/Math.max(.1,maxY-minY));
 const x=v=>W/2+(v-(minX+maxX)/2)*scale,y=v=>H/2-(v-(minY+maxY)/2)*scale;
 const ox=x(0),oy=y(0);
 nodes.forEach(n=>{n.ax=x(n.xy[0]);n.ay=y(n.xy[1]);n.x=n.ax;n.y=n.ay});
 // Deterministic label repulsion; the tiny anchors retain true coordinates.
 // Displaced numbered labels have leader lines, never invented store locations.
 for(let iteration=0;iteration<240;iteration++){
  for(let i=0;i<nodes.length;i++){
   const a=nodes[i];a.x+=(a.ax-a.x)*.018;a.y+=(a.ay-a.y)*.018;
   for(let j=i+1;j<nodes.length;j++){
    const b=nodes[j];let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);
    if(d<.001){dx=Math.cos(i*2.4+j)*.01;dy=Math.sin(i*2.4+j)*.01;d=.01}
    if(d<29){const push=(29-d)*.53;dx=dx/d*push;dy=dy/d*push;a.x-=dx;a.y-=dy;b.x+=dx;b.y+=dy}
   }
   const dx=a.x-ox,dy=a.y-oy,d=Math.hypot(dx,dy);
   if(d<27){a.x+=((dx||1)/(d||1))*(27-d);a.y+=((dy||1)/(d||1))*(27-d)}
   a.x=Math.max(18,Math.min(W-18,a.x));a.y=Math.max(32,Math.min(H-22,a.y));
  }
 }
 let html=`<title>${mode==='all'?'四组总览':'第'+group+'组路线'}，点击编号查看门店</title><desc>北向上，按门店经纬度投影；虚线连接拜访顺序，不代表道路。数字标签在密集区域错位显示。</desc><defs>`;
 selected.forEach(r=>{html+=`<marker id="arrow-${r.group}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${colors[r.group]}"/></marker>`});
 html+='</defs>';
 selected.forEach(r=>{
  const routeNodes=r.order.map(id=>nodes.find(n=>n.id===id));
  const points=[{ax:ox,ay:oy},...routeNodes,{ax:ox,ay:oy}];
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];html+=`<line class="route-segment" data-route="${r.group}" x1="${a.ax.toFixed(2)}" y1="${a.ay.toFixed(2)}" x2="${b.ax.toFixed(2)}" y2="${b.ay.toFixed(2)}" stroke="${colors[r.group]}" stroke-width="1.6" stroke-dasharray="4 4" opacity=".55" marker-end="url(#arrow-${r.group})"/>`}
 });
 html+=`<g aria-label="北向上" fill="#67766f" transform="translate(${W-25},12)"><text x="0" y="10" text-anchor="middle" font-size="10">北</text><path d="M0 15L-3 23L0 21L3 23Z"/></g>`;
 nodes.forEach(n=>{html+=`<line x1="${n.ax.toFixed(2)}" y1="${n.ay.toFixed(2)}" x2="${n.x.toFixed(2)}" y2="${n.y.toFixed(2)}" stroke="${colors[n.group]}" stroke-width=".7" opacity=".5"/><circle cx="${n.ax.toFixed(2)}" cy="${n.ay.toFixed(2)}" r="2" fill="${colors[n.group]}"/>`});
 html+=`<g><rect x="${ox-6}" y="${oy-6}" width="12" height="12" fill="#15392f" stroke="white" stroke-width="1.5"/><text x="${Math.min(W-85,ox+10)}" y="${Math.min(H-10,oy+20)}" font-size="11" font-weight="600" fill="#15392f" stroke="#f2f5f4" stroke-width="4" paint-order="stroke">凯富科技园</text></g>`;
 nodes.forEach(n=>{html+=`<g class="route-node" role="button" tabindex="0" data-map-stop="${n.id}" aria-label="第${n.group}组第${n.n}站：${escape(n.store['门店名称'])}" transform="translate(${n.x.toFixed(2)},${n.y.toFixed(2)})"><title>第${n.group}组 · 第${n.n}站 · ${escape(n.store['门店名称'])}</title><circle r="12" fill="${colors[n.group]}" stroke="white" stroke-width="1.4"/><text text-anchor="middle" dominant-baseline="central" y=".5" font-size="10.5" fill="white">${n.n}</text></g>`});
 svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.setAttribute('aria-label',mode==='all'?'四组拜访路线示意图':'第'+group+'组拜访路线示意图');svg.innerHTML=html;
 applyZoom(false);
 $('mapAll').setAttribute('aria-pressed',String(mode==='all'));$('mapTeam').setAttribute('aria-pressed',String(mode==='team'));
 $('routeMapSubtitle').textContent=mode==='all'?'四组各10家 · 点图例查看单组':`第${group}组 · 起点 → 1—10站 → 返程`;
 document.querySelectorAll('[data-map-group]').forEach(b=>{const active=mode==='team'&&Number(b.dataset.mapGroup)===group;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});
 $('routeListTitle').textContent=`第${group}组拜访顺序（10家）`;
 const r=P.routes.find(r=>r.group===group);
 $('mapRouteList').innerHTML=r.order.map(id=>`<li><button data-list-stop="${id}">${escape(P.stores[id-1]['门店名称'])} ↓</button></li>`).join('');
}
function applyZoom(center=true){
 const cx=(viewport.scrollLeft+viewport.clientWidth/2)/(parseFloat(svg.style.width)||width),cy=(viewport.scrollTop+viewport.clientHeight/2)/(parseFloat(svg.style.height)||340);
 svg.style.width=(width*zoom)+'px';svg.style.height=(340*zoom)+'px';
 if(center){viewport.scrollLeft=cx*width*zoom-viewport.clientWidth/2;viewport.scrollTop=cy*340*zoom-viewport.clientHeight/2}
 $('mapZoomLabel').textContent=Math.round(zoom*100)+'% · '+(zoom>1?'滑动查看各点位':'可放大滑动');
 $('mapZoomOut').disabled=zoom<=1;$('mapZoomIn').disabled=zoom>=3;
}
function reset(){zoom=1;viewport.scrollLeft=0;viewport.scrollTop=0;applyZoom(false)}
function activate(id){selectStore?.(Number(id))}
window.VisitRouteMap={init(fn){
 selectStore=fn;
 $('mapAll').addEventListener('click',()=>{mode='all';reset();draw()});
 $('mapTeam').addEventListener('click',()=>{mode='team';reset();draw()});
 document.querySelectorAll('[data-map-group]').forEach(b=>b.addEventListener('click',()=>{mode='team';reset();const g=Number(b.dataset.mapGroup);if(g!==group)document.querySelector(`[data-group="${g}"]`).click();else draw();viewport.scrollIntoView({behavior:'smooth',block:'center'})}));
 svg.addEventListener('click',e=>{const node=e.target.closest('[data-map-stop]');if(node)activate(node.dataset.mapStop)});
 svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const node=e.target.closest('[data-map-stop]');if(node){e.preventDefault();activate(node.dataset.mapStop)}}});
 $('mapRouteList').addEventListener('click',e=>{const node=e.target.closest('[data-list-stop]');if(node)activate(node.dataset.listStop)});
 $('mapZoomIn').addEventListener('click',()=>{zoom=Math.min(3,zoom+.5);applyZoom()});
 $('mapZoomOut').addEventListener('click',()=>{zoom=Math.max(1,zoom-.5);applyZoom()});
 $('mapReset').addEventListener('click',reset);
 let timer;window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(()=>{if(width!==viewport.clientWidth){reset();draw()}},150)});
},render(g){const key=g+'-'+mode;if(key===previous&&width===viewport.clientWidth)return;group=g;previous=key;reset();draw()}};
})();
