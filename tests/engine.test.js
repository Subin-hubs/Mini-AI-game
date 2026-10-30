const MG=require('../js/engine.js'),assert=require('assert');
const mk=rows=>{const g={tiles:[],nid:1,rs:{s:1}};rows.forEach((row,r)=>row.forEach((v,c)=>v&&g.tiles.push({id:g.nid++,v,r,c})));return g};
const rows=g=>{const o=[...Array(4)].map(()=>[0,0,0,0]);g.tiles.forEach(t=>o[t.r][t.c]=t.v);return o};
let g=mk([[2,2,2,2],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);let r=MG.move(g,3);
assert.deepStrictEqual(rows(g)[0],[4,4,0,0]);assert.strictEqual(r.gain,8);assert.strictEqual(r.merges,2);
g=mk([[4,2,2,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);MG.move(g,1);assert.deepStrictEqual(rows(g)[0],[0,0,4,4]);
g=mk([[2,0,0,0],[2,0,0,0],[4,0,0,0],[0,0,0,0]]);MG.move(g,0);assert.deepStrictEqual(rows(g).map(x=>x[0]),[4,4,0,0]);
g=mk([[2,0,0,0],[2,0,0,0],[4,0,0,0],[4,0,0,0]]);MG.move(g,2);assert.deepStrictEqual(rows(g).map(x=>x[0]),[0,0,4,8]);
g=mk([[2,4,8,16],[0,0,0,0],[0,0,0,0],[0,0,0,0]]);assert.strictEqual(MG.move(g,3).moved,false);
g=mk([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,4,2]]);assert.strictEqual(MG.canMove(g),false);
g=mk([[2,4,2,4],[4,2,4,2],[2,4,2,4],[4,2,2,2]]);assert.strictEqual(MG.canMove(g),true);
const a=MG.create(MG.hash('x'),'daily'),b=MG.create(MG.hash('x'),'daily');
for(let i=0;i<20;i++){[0,1,2,3].forEach(d=>{const x=MG.move(a,d),y=MG.move(b,d);if(x.moved){MG.spawn(a);MG.spawn(b)}})}
assert.deepStrictEqual(a.tiles.map(t=>[t.v,t.r,t.c]),b.tiles.map(t=>[t.v,t.r,t.c]));assert.strictEqual(a.rs.s,b.rs.s);
let n=0;for(let k=0;k<200;k++){const q=MG.create(k,'c');for(let i=0;i<400&&MG.canMove(q);i++){const x=MG.move(q,i%4);if(x.moved){MG.spawn(q);n++}
  assert.strictEqual(new Set(q.tiles.map(t=>t.r*4+t.c)).size,q.tiles.length)}}
console.log('engine tests passed ('+n+' random moves)');
