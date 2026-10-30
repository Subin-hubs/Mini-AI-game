/* MERGE LAB engine: pure game logic (no DOM). Tiles: {id,v,r,c}. */
const MG = {
  hash(s){let h=2166136261;for(const ch of s){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0},
  rng(st){st.s=(st.s+0x6D2B79F5)>>>0;let t=st.s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296},
  create(seed,mode){const g={mode,tiles:[],nid:1,score:0,rs:{s:seed>>>0},moves:0,merges:0,undos:3,prev:null,won:false,over:false,time:60,run:false,ms:[]};MG.spawn(g);MG.spawn(g);return g},
  spawn(g){const used=new Set(g.tiles.map(t=>t.r*4+t.c)),free=[];for(let i=0;i<16;i++)if(!used.has(i))free.push(i);
    if(!free.length)return null;const i=free[Math.floor(MG.rng(g.rs)*free.length)],v=MG.rng(g.rs)<0.9?2:4;
    const t={id:g.nid++,v,r:i>>2,c:i&3,n:1};g.tiles.push(t);return t},
  /* d: 0 up, 1 right, 2 down, 3 left. Each tile merges at most once per move. */
  move(g,d){const [dr,dc]=[[-1,0],[0,1],[1,0],[0,-1]][d],cell={};
    g.tiles.forEach(t=>{cell[t.r*4+t.c]=t;t.m=0;t.n=0});
    const ord=[...g.tiles].sort((a,b)=>(b.r*dr+b.c*dc)-(a.r*dr+a.c*dc));
    let moved=false,gain=0,merges=0;const gone=[];
    for(const t of ord){delete cell[t.r*4+t.c];let r=t.r,c=t.c,merged=false;
      for(;;){const nr=r+dr,nc=c+dc;if(nr<0||nr>3||nc<0||nc>3)break;const o=cell[nr*4+nc];
        if(!o){r=nr;c=nc;continue}
        if(o.v===t.v&&!o.m){o.v*=2;o.m=1;gain+=o.v;merges++;gone.push(t);r=o.r;c=o.c;merged=true}
        break}
      if(r!==t.r||c!==t.c)moved=true;
      t.r=r;t.c=c;if(!merged)cell[r*4+c]=t}
    g.tiles=g.tiles.filter(t=>!gone.includes(t));
    return{moved,gain,merges,gone}},
  canMove(g){if(g.tiles.length<16)return true;const m={};g.tiles.forEach(t=>m[t.r*4+t.c]=t.v);
    for(let r=0;r<4;r++)for(let c=0;c<4;c++){const v=m[r*4+c];if((c<3&&m[r*4+c+1]===v)||(r<3&&m[(r+1)*4+c]===v))return true}return false},
  maxTile(g){return g.tiles.reduce((a,t)=>Math.max(a,t.v),0)}
};
if(typeof module!=='undefined')module.exports=MG;
