/* 테스트 하네스 — 배포 파일(index.html)에 인라인된 게임 엔진을 Node 환경에서 실행한다.
   브라우저 DOM을 최소한으로 흉내 내어 시뮬레이션 로직만 떼어내 검증할 수 있게 한다. */
const fs = require('fs');
const path = require('path');

const elements = {};
function makeEl(id){
  return {
    id, innerHTML:"", textContent:"", value:"50", className:"", style:{}, dataset:{}, children:[],
    classList:{add(){},remove(){},toggle(){}},
    appendChild(c){this.children.push(c)}, prepend(c){this.children.unshift(c)}, removeChild(){this.children.pop()},
    querySelector(){return makeEl(id+"-q")}, querySelectorAll(){return []},
    getBoundingClientRect(){return {left:0,top:0,width:100,height:100,right:100,bottom:100}},
    addEventListener(){}, setPointerCapture(){}, onclick:null,
  };
}
global.document = {
  getElementById(id){ if(!elements[id]) elements[id] = makeEl(id); return elements[id]; },
  querySelectorAll(){ return { forEach(){} }; },
  createElement(){ return makeEl("new"); },
  addEventListener(ev, fn){ if(ev === "DOMContentLoaded") global.__init = fn; },
  body:{ appendChild(){} },
};
global.window = { scrollTo(){} };

// index.html에 인라인된 <script> 본문을 추출
const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if(!m) throw new Error("index.html에서 게임 스크립트를 찾지 못했습니다.");
let src = m[1];
// 타이머는 테스트에서 즉시 실행되도록 무력화
src = src.replace(/setInterval/g, '(()=>0)').replace(/clearInterval/g, '(()=>0)').replace(/setTimeout\(/g, '((f)=>f)(');
src += `\n;globalThis.__api = { SCENARIOS, SQUAD, FORMATIONS, roleAt,
  get scen(){return scen}, set scen(v){scen=v},
  get sim(){return sim}, set sim(v){sim=v},
  get formation(){return formation}, set formation(v){formation=v},
  get starters(){return starters}, get bench(){return bench}, get positions(){return positions},
  autoPick, reflow, tick, teamRating, oppRating };`;
eval(src);

module.exports = {
  api: global.__api,
  elements,
  setSlider(line, press){
    global.document.getElementById('sl-line').value = "" + line;
    global.document.getElementById('sl-press').value = "" + press;
  },
};
