/* REMATCH 밸런싱 검증 스크립트
   시나리오 × 전술 조합별로 다수의 경기를 시뮬레이션해 난이도를 측정한다.
   실행: node balance_test.js   (rematch.js와 harness.js가 같은 폴더에 있어야 함) */
const {api,setSlider}=require('./harness.js');
const N=1000;

function playOne(idx,{form,line,press,subs}){
  const S=api.SCENARIOS[idx];
  api.scen=S; api.formation=S.form||"4-3-3"; api.autoPick();
  api.starters.forEach(p=>{p.sta=p.maxSta;p.warned=false;});
  api.bench.forEach(p=>{p.sta=p.maxSta;});
  api.sim={min:S.startMin,score:[...S.score],mom:S.score[0]<S.score[1]?42:50,
    shots:0,onT:0,oppShots:0,subsLeft:3,possAcc:0,ticks:0,addedTime:4,oppMode:"normal"};
  if(S.startMin>0) api.starters.forEach(p=>{if(p.slot!=="GK")p.sta=Math.max(42,p.sta-(S.startMin*.42));});
  if(form&&form!==api.formation){api.formation=form;api.reflow();}
  setSlider(line,press);
  while(api.sim.min<90+api.sim.addedTime){
    api.tick(); if(api.sim.over)break;
    if(subs&&api.sim.subsLeft>0){ // 지친 선수 자동 교체
      const i=api.starters.findIndex(p=>p.slot!=="GK"&&p.sta<45);
      if(i>=0){
        const fresh=api.bench.filter(b=>b.slot!=="GK").sort((a,b)=>b.sta-a.sta)[0];
        if(fresh){const bi=api.bench.indexOf(fresh);api.bench[bi]=api.starters[i];api.starters[i]=fresh;api.sim.subsLeft--;}
      }
    }
  }
  return api.sim.score;
}
function measure(idx,opt){
  let W=0,D=0,L=0,g=0;
  for(let n=0;n<N;n++){const [k,o]=playOne(idx,opt);if(k>o)W++;else if(k===o)D++;else L++;g+=k+o;}
  return {W:W/N*100,D:D/N*100,L:L/N*100,goals:g/N};
}
const CASES=[
  ["개입 없음 (기본 대형 방치)",      {line:50,press:50,subs:false}],
  ["교체만 활용",                {line:50,press:50,subs:true}],
  ["적극 개입 (라인↑ 압박↑ + 교체)",  {line:70,press:68,subs:true}],
];
console.log(`REMATCH 밸런싱 검증 (각 ${N}경기)\n`);
for(const [idx,label,goal] of [[0,"남아공전 — 무승부 이상이면 32강 진출","진출"],[1,"멕시코전 — 승리해야 조 1위","승리"]]){
  console.log(`■ ${label}`);
  for(const [name,opt] of CASES){
    const r=measure(idx,opt);
    const rate = idx===0 ? r.W+r.D : r.W;
    console.log(`   ${name.padEnd(30)} ${goal} ${rate.toFixed(1)}%  (승 ${r.W.toFixed(0)} 무 ${r.D.toFixed(0)} 패 ${r.L.toFixed(0)} · 평균 ${r.goals.toFixed(2)}골)`);
  }
  console.log("");
}
