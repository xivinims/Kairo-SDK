import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Download,
  Gamepad2,
  Heart,
  Languages,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  GAMES,
  SAMPLE_LOCALIZATION,
  chunkRows,
  exportTranslationPack,
  parseJsonStrings,
  validateTranslation,
  type GameEntry,
  type LocalizationProject,
} from "@/lib/gamehub";

type View = "catalog" | "localize" | "about";
type Scene = { speaker: string; text: string; choices?: { label: string; next: number; affinity?: number }[] };

const ROMANCE_SCENES: Scene[] = [
  { speaker: "Nara", text: "Você chegou. Eu achei que a tempestade solar fosse atrasar seu módulo.", choices: [
    { label: "Eu prometi que viria.", next: 1, affinity: 1 },
    { label: "Quase perdi a coragem.", next: 2 },
  ]},
  { speaker: "Nara", text: "Então eu guardei a melhor vista da Terra pra gente. Quer ficar um pouco?", choices: [
    { label: "Quero. Me conta o que você anda desenhando.", next: 3, affinity: 1 },
    { label: "Primeiro, preciso respirar.", next: 4 },
  ]},
  { speaker: "Nara", text: "Coragem também é aparecer mesmo com medo. Isso conta muito.", choices: [
    { label: "Obrigado por entender.", next: 3, affinity: 1 },
    { label: "Vamos mudar de assunto.", next: 4 },
  ]},
  { speaker: "Nara", text: "Tenho desenhado a estação como se fosse uma cidade. E, ultimamente, você sempre aparece nas janelas.", choices: [
    { label: "Talvez eu goste de estar por perto.", next: 5, affinity: 1 },
    { label: "Isso é... surpreendentemente fofo.", next: 5, affinity: 1 },
  ]},
  { speaker: "Nara", text: "Tudo bem. A gente não precisa decidir nada hoje. Só ficar aqui já é suficiente.", choices: [
    { label: "Ficar aqui parece uma boa ideia.", next: 5, affinity: 1 },
  ]},
  { speaker: "Narrador", text: "A estação cruza a noite do Brasil em silêncio. Algumas histórias começam com uma grande declaração. Outras começam só com alguém escolhendo ficar." },
];

function RomanceGame({ onExit }: { onExit: () => void }) {
  const [scene, setScene] = useState(0);
  const [affinity, setAffinity] = useState(0);
  const current = ROMANCE_SCENES[scene];
  return <div className="game-stage romance-stage">
    <button className="stage-back" onClick={onExit}><ArrowLeft size={16}/> Catálogo</button>
    <div className="stars" />
    <div className="planet" />
    <div className="vn-box">
      <div className="vn-speaker">{current.speaker}</div>
      <p>{current.text}</p>
      <div className="vn-choices">
        {current.choices?.map((choice) => <button key={choice.label} onClick={() => {
          setAffinity((v) => v + (choice.affinity ?? 0));
          setScene(choice.next);
        }}>{choice.label}<ChevronRight size={15}/></button>)}
        {!current.choices && <button onClick={() => {setScene(0);setAffinity(0)}}>Jogar novamente <Heart size={15}/></button>}
      </div>
      <div className="affinity">Afinidade <span>{affinity}/4</span></div>
    </div>
  </div>;
}

function NeonGame({ onExit }: { onExit: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  useEffect(() => {
    const c = canvas.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf=0, t=0, y=220, target=220, alive=true, localScore=0;
    const pointer=(e:PointerEvent)=>{const r=c.getBoundingClientRect(); target=(e.clientY-r.top)*c.height/r.height};
    c.addEventListener("pointermove",pointer);c.addEventListener("pointerdown",pointer);
    const loop=()=>{raf=requestAnimationFrame(loop);t+=0.03; if(!alive)return;
      y+=(target-y)*.1;localScore++;if(localScore%12===0)setScore(Math.floor(localScore/12));
      ctx.fillStyle="#050711";ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle="#15304b";ctx.lineWidth=1;
      for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(i*90-(localScore%90),0);ctx.lineTo(i*90-(localScore%90),450);ctx.stroke()}
      for(let i=0;i<6;i++){const ox=c.width-((localScore*3+i*210)%1200), gap=100+((i*71)%210);ctx.fillStyle="#ff4f9a";ctx.fillRect(ox,0,24,gap);ctx.fillRect(ox,gap+110,24,c.height-gap-110);if(ox>110&&ox<160&&(y<gap||y>gap+110)){alive=false}}
      ctx.fillStyle="#62f3ff";ctx.beginPath();ctx.moveTo(120,y);ctx.lineTo(88,y-16);ctx.lineTo(88,y+16);ctx.closePath();ctx.fill();
      if(!alive){ctx.fillStyle="rgba(0,0,0,.65)";ctx.fillRect(0,0,c.width,c.height);ctx.fillStyle="white";ctx.textAlign="center";ctx.font="700 32px system-ui";ctx.fillText("Fim de corrida",c.width/2,210);ctx.font="16px system-ui";ctx.fillText("Toque para reiniciar",c.width/2,245)}
    };loop();
    const restart=()=>{if(!alive){alive=true;localScore=0;setScore(0);target=220;y=220}};c.addEventListener("pointerdown",restart);
    return()=>{cancelAnimationFrame(raf);c.removeEventListener("pointermove",pointer);c.removeEventListener("pointerdown",pointer);c.removeEventListener("pointerdown",restart)}
  },[]);
  return <div className="game-stage"><button className="stage-back" onClick={onExit}><ArrowLeft size={16}/> Catálogo</button><div className="game-score">Pontos <b>{score}</b></div><canvas ref={canvas} width={900} height={450} className="arcade-canvas"/><p className="stage-help">Mova o dedo ou o mouse para pilotar.</p></div>
}

function CityGame({ onExit }: { onExit: () => void }) {
  const clues=["Um bilhete preso à porta diz: “A praça lembra de tudo.”","Um rádio antigo repete uma sequência: 3, 1, 4.","Na praça, três bancos têm letras gravadas: L, U, Z.","Ao juntar as pistas, a palavra LUZ acende o letreiro do cinema."];
  const [n,setN]=useState(0);
  return <div className="game-stage city-stage"><button className="stage-back" onClick={onExit}><ArrowLeft size={16}/> Catálogo</button><div className="city-window"><div className="city-moon"/><div className="building b1"/><div className="building b2"/><div className="building b3"/></div><div className="clue-card"><span>Pista {n+1}/{clues.length}</span><p>{clues[n]}</p><button onClick={()=>setN((n+1)%clues.length)}>Investigar <Search size={15}/></button></div></div>
}

function GameCard({ game, onPlay }: { game: GameEntry; onPlay: (game: GameEntry) => void }) {
  return <article className="hub-card" style={{"--accent":game.accent} as React.CSSProperties}>
    <div className="hub-cover"><span className="cover-symbol">{game.cover}</span><div className="size-pill">{game.sizeClass} · {game.installSize}</div></div>
    <div className="hub-card-body"><div className="tag-row">{game.genre.map(g=><span key={g}>{g}</span>)}</div><h3>{game.title}</h3><p className="subtitle">{game.subtitle}</p><p>{game.description}</p>
    <button onClick={()=>onPlay(game)}>{game.status==="localização"?<Languages size={16}/>:<Play size={16}/>} {game.status==="localização"?"Abrir perfil":"Jogar agora"}</button></div>
  </article>;
}

function LocalizationLab() {
  const [project,setProject]=useState<LocalizationProject>(SAMPLE_LOCALIZATION);
  const [chunkSize,setChunkSize]=useState(200);
  const [notice,setNotice]=useState("");
  const chunks=useMemo(()=>chunkRows(project.rows,chunkSize),[project.rows,chunkSize]);
  const invalid=project.rows.filter(r=>r.ptBR && !validateTranslation(r.source,r.ptBR).ok).length;

  function importJson(file: File) {
    const reader=new FileReader();
    reader.onload=()=>{try{const rows=parseJsonStrings(String(reader.result));setProject({name:file.name,sourceLocale:"auto",targetLocale:"pt-BR",rows,glossary:{}});setNotice(`${rows.length} textos encontrados.`)}catch{setNotice("Não consegui ler esse JSON.")}};
    reader.readAsText(file);
  }
  function downloadPack(){
    const blob=new Blob([exportTranslationPack(project)],{type:"application/json"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${project.name.replace(/\W+/g,"-").toLowerCase()}-ptbr.kairo-loc.json`;a.click();URL.revokeObjectURL(a.href);
  }
  return <section className="lab">
    <div className="lab-head"><div><span className="kicker">LABORATÓRIO DE LOCALIZAÇÃO</span><h2>Traduzir sem quebrar o jogo.</h2><p>Importe textos autorizados, trabalhe por blocos e valide variáveis antes de exportar o pacote PT-BR.</p></div><label className="import-button"><Upload size={16}/> Importar JSON<input type="file" accept=".json,application/json" hidden onChange={e=>e.target.files?.[0]&&importJson(e.target.files[0])}/></label></div>
    <div className="lab-stats"><div><b>{project.rows.length}</b><span>strings</span></div><div><b>{chunks.length}</b><span>blocos</span></div><div><b>{invalid}</b><span>alertas</span></div><div><b>pt-BR</b><span>destino</span></div></div>
    <div className="lab-toolbar"><label>Strings por bloco <input type="number" min={25} max={1000} value={chunkSize} onChange={e=>setChunkSize(+e.target.value||200)}/></label><button onClick={downloadPack}><Download size={15}/> Exportar pacote</button></div>
    {notice&&<div className="notice">{notice}</div>}
    <div className="translation-list">{project.rows.slice(0,80).map((row,i)=>{const check=row.ptBR?validateTranslation(row.source,row.ptBR):{ok:true,missing:[]};return <div className="translation-row" key={row.id}><div className="row-index">{i+1}</div><div><small>{row.context||row.id}</small><p>{row.source}</p></div><div><textarea value={row.ptBR} placeholder="Tradução em português..." onChange={e=>setProject(p=>({...p,rows:p.rows.map(r=>r.id===row.id?{...r,ptBR:e.target.value}:r)}))}/>{!check.ok&&<span className="token-error">Faltando: {check.missing.join(", ")}</span>}</div></div>})}</div>
    {project.rows.length>80&&<p className="lab-foot">Mostrando 80 linhas na interface. O pacote mantém todas as {project.rows.length}.</p>}
  </section>;
}

export function KairoGameHub() {
  const [view,setView]=useState<View>("catalog");
  const [activeGame,setActiveGame]=useState<GameEntry|null>(null);
  if(activeGame?.id==="coracoes-em-orbita")return <RomanceGame onExit={()=>setActiveGame(null)}/>;
  if(activeGame?.id==="neon-runner-br")return <NeonGame onExit={()=>setActiveGame(null)}/>;
  if(activeGame?.id==="cidade-sem-nome")return <CityGame onExit={()=>setActiveGame(null)}/>;
  if(activeGame?.id==="projeto-atlas"){setActiveGame(null);setView("localize")}

  return <div className="gamehub">
    <aside className="hub-sidebar"><div className="hub-brand"><div>K</div><span>Kairo <b>GameHub</b></span></div><nav>
      <button className={view==="catalog"?"active":""} onClick={()=>setView("catalog")}><Gamepad2/> Jogos</button>
      <button className={view==="localize"?"active":""} onClick={()=>setView("localize")}><Languages/> Localizar</button>
      <button className={view==="about"?"active":""} onClick={()=>setView("about")}><BookOpen/> Projeto</button>
    </nav><div className="side-note"><ShieldCheck size={17}/><p>Conteúdo próprio ou autorizado. Tradução sem redistribuir arquivos protegidos de terceiros.</p></div></aside>
    <main className="hub-main">
      <header className="hub-top"><div><span className="kicker">KAIRO SDK · PT-BR FIRST</span><h1>{view==="catalog"?"Biblioteca":view==="localize"?"Localização":"Projeto"}</h1></div><div className="pt-badge"><Languages size={15}/> Português Brasil</div></header>
      {view==="catalog"&&<><section className="hero-game"><div><span className="hero-pill"><Sparkles size={14}/> Original Kairo</span><h2>Jogos em português<br/><em>desde a primeira linha.</em></h2><p>Do arcade leve à narrativa longa. O mesmo hub organiza, executa e prepara pacotes de localização para projetos grandes.</p></div><div className="hero-orb"><span>BR</span></div></section><div className="catalog-head"><div><h2>Jogos disponíveis</h2><p>{GAMES.length} projetos na biblioteca</p></div></div><section className="hub-grid">{GAMES.map(g=><GameCard key={g.id} game={g} onPlay={setActiveGame}/>)}</section></>}
      {view==="localize"&&<LocalizationLab/>}
      {view==="about"&&<section className="about-panel"><span className="kicker">NOVA DIREÇÃO</span><h2>Kairo agora também é uma plataforma de jogos e localização.</h2><p>O SDK foi reorganizado para hospedar jogos próprios, experiências narrativas, projetos grandes por pacotes e um fluxo de tradução PT-BR com validação de placeholders.</p><div className="about-grid"><div><CheckCircle2/><b>Jogos originais</b><span>Sem depender de assets externos.</span></div><div><Languages/><b>PT-BR nativo</b><span>Interface e conteúdo em português.</span></div><div><ShieldCheck/><b>Localização segura</b><span>Preserva tokens e trabalha com arquivos autorizados.</span></div></div></section>}
    </main>
  </div>;
}
