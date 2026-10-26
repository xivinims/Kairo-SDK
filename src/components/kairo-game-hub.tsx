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
  Volume2,
  Mic2,
  ExternalLink,
  Workflow,
} from "lucide-react";
import {
  GAMES,
  SAMPLE_LOCALIZATION,
  chunkRows,
  buildLocalizedJson,
  detectEngineProfiles,
  exportTranslationPack,
  localizationProgress,
  parseJsonStrings,
  validateTranslation,
  exportDubbingManifest,
  parseDubbingJson,
  SAMPLE_DUBBING,
  VOICE_LOCALIZATION_CANDIDATES,
  AAA_LOCALIZATION_PROFILES,
  buildAaaProjectTemplate,
  type AaaLocalizationProfile,
  type DubbingProject,
  type GameEntry,
  type LocalizationProject,
} from "@/lib/gamehub";
import {
  buildLocalizedRedkitCsv,
  buildTranslationBatches,
  parseRedkitLocalizationCsv,
  runLocalizationQa,
} from "@/lib/redkit-localization";
import { ProductionStudio } from "./production-studio";

type View = "catalog" | "production" | "localize" | "dubbing" | "about";
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
  const [chunkSize,setChunkSize]=useState(120);
  const [notice,setNotice]=useState("");
  const [sourceJson,setSourceJson]=useState("");
  const [sourceCsv,setSourceCsv]=useState("");
  const [sourceKind,setSourceKind]=useState<"demo"|"json"|"redkit-csv">("demo");
  const [engineHints,setEngineHints]=useState<ReturnType<typeof detectEngineProfiles>>([]);
  const chunks=useMemo(()=>chunkRows(project.rows,chunkSize),[project.rows,chunkSize]);
  const invalid=project.rows.filter(r=>r.ptBR && !validateTranslation(r.source,r.ptBR).ok).length;
  const progress=useMemo(()=>localizationProgress(project.rows),[project.rows]);
  const qaIssues=useMemo(()=>runLocalizationQa(project.rows),[project.rows]);
  const qaErrors=qaIssues.filter(issue=>issue.severity==="erro").length;
  const batches=useMemo(()=>buildTranslationBatches(project.rows,chunkSize),[project.rows,chunkSize]);

  function importSource(file: File) {
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const raw=String(reader.result);
        const lower=file.name.toLowerCase();
        if(lower.endsWith(".csv")){
          const parsed=parseRedkitLocalizationCsv(raw);
          setSourceCsv(raw);
          setSourceJson("");
          setSourceKind("redkit-csv");
          setEngineHints([]);
          setProject({name:file.name,sourceLocale:"en",targetLocale:"pt-BR",rows:parsed.rows,glossary:{}});
          setNotice(`${parsed.rows.length} strings importadas do CSV do REDkit.`);
          return;
        }

        const rows=parseJsonStrings(raw);
        setSourceJson(raw);
        setSourceCsv("");
        setSourceKind("json");
        setEngineHints(detectEngineProfiles([file.name]));
        setProject({name:file.name,sourceLocale:"auto",targetLocale:"pt-BR",rows,glossary:{}});
        setNotice(`${rows.length} textos encontrados. Estrutura original preservada para exportação localizada.`);
      }catch{
        setNotice("Não consegui ler esse arquivo. Use JSON ou CSV exportado pela ferramenta oficial do jogo.");
      }
    };
    reader.readAsText(file);
  }

  function downloadText(content:string,name:string,type="application/json"){
    const blob=new Blob([content],{type});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function downloadPack(){
    downloadText(
      exportTranslationPack(project),
      `${project.name.replace(/\W+/g,"-").toLowerCase()}-ptbr.kairo-loc.json`,
    );
  }

  function downloadLocalizedJson(){
    if(!sourceJson)return;
    downloadText(
      buildLocalizedJson(sourceJson,project.rows),
      project.name.replace(/\.json$/i,"")+"-pt-BR.json",
    );
  }

  function downloadRedkitCsv(){
    if(!sourceCsv)return;
    downloadText(
      buildLocalizedRedkitCsv(sourceCsv,project.rows),
      project.name.replace(/\.csv$/i,"")+"-pt-BR.csv",
      "text/csv;charset=utf-8",
    );
  }

  function downloadBatch(index:number){
    const data={
      format:"kairo-translation-batch",
      version:1,
      targetLocale:"pt-BR",
      batch:index+1,
      totalBatches:batches.length,
      glossary:project.glossary,
      rules:[
        "Preserve placeholders, tags, ids e códigos exatamente.",
        "Traduza de forma natural para português brasileiro.",
        "Mantenha nomes próprios conforme o glossário.",
        "Não resuma nem omita frases.",
      ],
      strings:batches[index].map(row=>({...row,translation:""})),
    };
    downloadText(JSON.stringify(data,null,2),`batch-${String(index+1).padStart(4,"0")}-ptbr.json`);
  }

  return <section className="lab">
    <div className="lab-head">
      <div><span className="kicker">LABORATÓRIO DE LOCALIZAÇÃO</span><h2>Traduzir sem quebrar o jogo.</h2><p>JSON genérico e CSV oficial do REDkit. Trabalha por lotes, preserva ids e valida o projeto antes da reimportação.</p></div>
      <label className="import-button"><Upload size={16}/> Importar arquivo<input type="file" accept=".json,.csv,application/json,text/csv" hidden onChange={e=>e.target.files?.[0]&&importSource(e.target.files[0])}/></label>
    </div>

    <div className="lab-stats">
      <div><b>{project.rows.length}</b><span>strings</span></div>
      <div><b>{batches.length}</b><span>lotes pendentes</span></div>
      <div><b>{qaErrors}</b><span>erros de QA</span></div>
      <div><b>{progress.percent}%</b><span>válido em pt-BR</span></div>
    </div>

    <div className="format-banner">
      <b>{sourceKind==="redkit-csv"?"The Witcher 3 · REDkit CSV":sourceKind==="json"?"Projeto JSON":"Projeto de demonstração"}</b>
      <span>{sourceKind==="redkit-csv"?"Exporta de volta no formato CSV para reimportar no Localized Strings Editor.":"O Kairo mantém a estrutura original e cria um pacote PT-BR separado."}</span>
    </div>

    {engineHints.length>0&&<div className="engine-hints">{engineHints.map(engine=><span key={engine.id}><b>{engine.name}</b> · {engine.confidence}</span>)}</div>}

    <div className="lab-toolbar">
      <label>Strings por lote <input type="number" min={25} max={500} value={chunkSize} onChange={e=>setChunkSize(+e.target.value||120)}/></label>
      <div className="lab-actions">
        {batches.length>0&&<button onClick={()=>downloadBatch(0)}><Download size={15}/> Baixar próximo lote</button>}
        <button onClick={downloadPack}><Download size={15}/> Pacote Kairo</button>
        {sourceKind==="json"&&<button disabled={!sourceJson} onClick={downloadLocalizedJson}><Download size={15}/> JSON localizado</button>}
        {sourceKind==="redkit-csv"&&<button disabled={!sourceCsv||qaErrors>0} onClick={downloadRedkitCsv}><Download size={15}/> CSV para REDkit</button>}
      </div>
    </div>

    {notice&&<div className="notice">{notice}</div>}

    {qaIssues.length>0&&<details className="qa-panel">
      <summary>QA do projeto · {qaErrors} erros · {qaIssues.length-qaErrors} avisos</summary>
      <div>{qaIssues.slice(0,30).map((issue,index)=><p key={index} className={issue.severity}><b>{issue.rowId}</b> {issue.message}</p>)}</div>
      {qaIssues.length>30&&<small>Mostrando os primeiros 30 de {qaIssues.length} apontamentos.</small>}
    </details>}

    <div className="translation-list">{project.rows.slice(0,120).map((row,i)=>{
      const check=row.ptBR?validateTranslation(row.source,row.ptBR):{ok:true,missing:[]};
      return <div className="translation-row" key={row.id}>
        <div className="row-index">{i+1}</div>
        <div><small>{row.context||row.id}</small><p>{row.source}</p></div>
        <div>
          <textarea value={row.ptBR} placeholder="Tradução em português..." onChange={e=>setProject(p=>({...p,rows:p.rows.map(r=>r.id===row.id?{...r,ptBR:e.target.value}:r)}))}/>
          {!check.ok&&<span className="token-error">Faltando: {check.missing.join(", ")}</span>}
        </div>
      </div>;
    })}</div>
    {project.rows.length>120&&<p className="lab-foot">Mostrando 120 linhas na interface. O projeto mantém todas as {project.rows.length}.</p>}
  </section>;
}

function AaaProfiles() {
  function downloadTemplate(profile:AaaLocalizationProfile){
    const blob=new Blob([JSON.stringify(buildAaaProjectTemplate(profile),null,2)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=`${profile.id}-ptbr-kairo-project.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return <section className="aaa-profiles">
    <div className="aaa-head"><span className="kicker">JOGOS GRANDES · PERFIS OFICIAIS</span><h3>Alvos para localização completa</h3><p>Esses perfis trabalham contra uma cópia instalada legalmente e geram apenas o mod PT-BR. O Kairo não embute nem redistribui os arquivos originais do jogo.</p></div>
    <div className="aaa-grid">{AAA_LOCALIZATION_PROFILES.sort((a,b)=>a.priority-b.priority).map(profile=><article key={profile.id}>
      <div className="aaa-rank">{profile.priority}</div>
      <div><h4>{profile.title}</h4><p>{profile.ratingNote}</p></div>
      <dl><div><dt>Ferramenta</dt><dd>{profile.officialTool}</dd></div><div><dt>Voz</dt><dd>{profile.voiceSupport}</dd></div><div><dt>Localização</dt><dd>{profile.localizationSupport}</dd></div></dl>
      <div className="aaa-actions"><a href={profile.toolUrl} target="_blank" rel="noreferrer">Ferramenta oficial <ExternalLink size={12}/></a><button onClick={()=>downloadTemplate(profile)}><Download size={13}/> Criar projeto</button></div>
    </article>)}</div>
  </section>;
}

function DubbingLab() {
  const [project,setProject]=useState<DubbingProject>(SAMPLE_DUBBING);
  const [notice,setNotice]=useState("");
  const ready=project.cues.filter(c=>c.ptBR.trim()).length;

  function importDubbing(file:File){
    const reader=new FileReader();
    reader.onload=()=>{try{const parsed=parseDubbingJson(String(reader.result));setProject(parsed);setNotice(`${parsed.cues.length} falas carregadas.`)}catch{setNotice("Não consegui ler esse roteiro de dublagem.")}};
    reader.readAsText(file);
  }
  function preview(text:string){
    if(!("speechSynthesis" in window)||!text.trim())return;
    window.speechSynthesis.cancel();
    const utter=new SpeechSynthesisUtterance(text);
    utter.lang="pt-BR";
    utter.rate=.96;
    window.speechSynthesis.speak(utter);
  }
  function downloadManifest(){
    const blob=new Blob([exportDubbingManifest(project)],{type:"application/json"});
    const a=document.createElement("a");
    a.href=URL.createObjectURL(blob);
    a.download=project.name.replace(/\W+/g,"-").toLowerCase()+"-dublagem-ptbr.json";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return <section className="dub-lab">
    <div className="lab-head">
      <div><span className="kicker">DUBLAGEM PT-BR</span><h2>Troca de voz cena por cena.</h2><p>Importe um roteiro autorizado, adapte as falas e gere um manifesto que mapeia cada linha ao áudio PT-BR correspondente.</p></div>
      <label className="import-button"><Mic2 size={16}/> Importar roteiro<input type="file" accept=".json,application/json" hidden onChange={e=>e.target.files?.[0]&&importDubbing(e.target.files[0])}/></label>
    </div>
    <div className="lab-stats"><div><b>{project.cues.length}</b><span>falas</span></div><div><b>{ready}</b><span>adaptadas</span></div><div><b>{new Set(project.cues.map(c=>c.character)).size}</b><span>personagens</span></div><div><b>pt-BR</b><span>dublagem</span></div></div>
    {notice&&<div className="notice">{notice}</div>}
    <AaaProfiles/>
    <div className="candidate-strip">{VOICE_LOCALIZATION_CANDIDATES.map(game=><article key={game.id}><div><b>{game.title}</b><span>{game.engine} · {game.voiceActing}</span></div><p>{game.license}</p><a href={game.sourceUrl} target="_blank" rel="noreferrer">Fonte <ExternalLink size={12}/></a></article>)}</div>
    <div className="dub-toolbar"><p>Prévia usa a voz PT-BR disponível no aparelho. O manifesto final pode apontar para arquivos de dublagem produzidos externamente.</p><button onClick={downloadManifest}><Download size={15}/> Exportar manifesto</button></div>
    <div className="dub-list">{project.cues.map((cue,index)=><div className="dub-row" key={cue.id}>
      <div className="dub-meta"><span>{index+1}</span><b>{cue.character}</b><small>{cue.scene}</small></div>
      <div className="dub-source"><small>INGLÊS</small><p>{cue.sourceText}</p></div>
      <div className="dub-target"><small>PORTUGUÊS BRASIL</small><textarea value={cue.ptBR} onChange={e=>setProject(p=>({...p,cues:p.cues.map(c=>c.id===cue.id?{...c,ptBR:e.target.value}:c)}))}/><div className="dub-actions"><select value={cue.voice} onChange={e=>setProject(p=>({...p,cues:p.cues.map(c=>c.id===cue.id?{...c,voice:e.target.value as typeof cue.voice}:c)}))}><option value="neutra">Neutra</option><option value="clara">Clara</option><option value="suave">Suave</option><option value="grave">Grave</option><option value="energética">Energética</option></select><button onClick={()=>preview(cue.ptBR)}><Volume2 size={14}/> Prévia</button></div></div>
    </div>)}</div>
  </section>;
}

export function KairoGameHub() {
  const [view,setView]=useState<View>("catalog");
  const [activeGame,setActiveGame]=useState<GameEntry|null>(null);
  if(activeGame?.id==="coracoes-em-orbita")return <RomanceGame onExit={()=>setActiveGame(null)}/>;
  if(activeGame?.id==="neon-runner-br")return <NeonGame onExit={()=>setActiveGame(null)}/>;
  if(activeGame?.id==="cidade-sem-nome")return <CityGame onExit={()=>setActiveGame(null)}/>;

  const openGame=(game:GameEntry)=>{
    if(game.id==="projeto-atlas"){setView("localize");setActiveGame(null);return}
    setActiveGame(game);
  };

  return <div className="gamehub">
    <aside className="hub-sidebar"><div className="hub-brand"><div>K</div><span>Kairo <b>GameHub</b></span></div><nav>
      <button className={view==="catalog"?"active":""} onClick={()=>setView("catalog")}><Gamepad2/> Jogos</button>
      <button className={view==="production"?"active":""} onClick={()=>setView("production")}><Workflow/> Produção</button>
      <button className={view==="localize"?"active":""} onClick={()=>setView("localize")}><Languages/> Localizar</button>
      <button className={view==="dubbing"?"active":""} onClick={()=>setView("dubbing")}><Mic2/> Dublar</button>
      <button className={view==="about"?"active":""} onClick={()=>setView("about")}><BookOpen/> Projeto</button>
    </nav><div className="side-note"><ShieldCheck size={17}/><p>Conteúdo próprio ou autorizado. Tradução sem redistribuir arquivos protegidos de terceiros.</p></div></aside>
    <main className="hub-main">
      <header className="hub-top"><div><span className="kicker">KAIRO SDK · PT-BR FIRST</span><h1>{view==="catalog"?"Biblioteca":view==="production"?"Produção":view==="localize"?"Localização":view==="dubbing"?"Dublagem":"Projeto"}</h1></div><div className="pt-badge"><Languages size={15}/> Português Brasil</div></header>
      {view==="catalog"&&<><section className="hero-game"><div><span className="hero-pill"><Sparkles size={14}/> Original Kairo</span><h2>Jogos em português<br/><em>desde a primeira linha.</em></h2><p>Do arcade leve à narrativa longa. O mesmo hub organiza, executa e prepara pacotes de localização para projetos grandes.</p></div><div className="hero-orb"><span>BR</span></div></section><div className="catalog-head"><div><h2>Jogos disponíveis</h2><p>{GAMES.length} projetos na biblioteca</p></div></div><section className="hub-grid">{GAMES.map(g=><GameCard key={g.id} game={g} onPlay={openGame}/>)}</section></>}
      {view==="production"&&<ProductionStudio/>}
      {view==="localize"&&<LocalizationLab/>}
      {view==="dubbing"&&<DubbingLab/>}
      {view==="about"&&<section className="about-panel"><span className="kicker">NOVA DIREÇÃO</span><h2>Kairo agora também é uma plataforma de jogos e localização.</h2><p>O SDK foi reorganizado para hospedar jogos próprios, experiências narrativas, projetos grandes por pacotes e um fluxo de tradução PT-BR com validação de placeholders.</p><div className="about-grid"><div><CheckCircle2/><b>Jogos originais</b><span>Sem depender de assets externos.</span></div><div><Languages/><b>PT-BR nativo</b><span>Interface e conteúdo em português.</span></div><div><ShieldCheck/><b>Localização segura</b><span>Preserva tokens e trabalha com arquivos autorizados.</span></div></div></section>}
    </main>
  </div>;
}
