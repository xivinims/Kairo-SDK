import { useMemo, useState } from "react";
import {
  Activity,
  BookMarked,
  Boxes,
  CheckCircle2,
  Clock3,
  Download,
  FileAudio2,
  Languages,
  ListChecks,
  PlayCircle,
  Radio,
  ScanSearch,
  Subtitles,
} from "lucide-react";
import { AAA_LOCALIZATION_PROFILES } from "@/lib/gamehub";
import {
  createProductionProject,
  nextAction,
  overallProgress,
  productionHealth,
  stageProgress,
  type ProductionProject,
} from "@/lib/studio-core";
import {
  buildMemory,
  findMemoryMatches,
  type TranslationMemoryEntry,
} from "@/lib/translation-memory";
import {
  exportSrt,
  exportVtt,
  parseSrt,
  parseVtt,
  runSubtitleQa,
  type SubtitleCue,
} from "@/lib/subtitles";

function download(content:string,name:string,type="application/json"){
  const blob=new Blob([content],{type});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function ProductionStudio() {
  const [project,setProject]=useState<ProductionProject>(()=>createProductionProject("witcher-3","The Witcher 3: Wild Hunt"));
  const [memory,setMemory]=useState<TranslationMemoryEntry[]>([]);
  const [memoryQuery,setMemoryQuery]=useState("");
  const [subtitles,setSubtitles]=useState<SubtitleCue[]>([]);
  const [subtitleFormat,setSubtitleFormat]=useState<"srt"|"vtt">("srt");
  const [notice,setNotice]=useState("");

  const health=useMemo(()=>productionHealth(project),[project]);
  const subtitleIssues=useMemo(()=>runSubtitleQa(subtitles),[subtitles]);
  const matches=useMemo(()=>memoryQuery.trim()?findMemoryMatches(memoryQuery,memory,4):[],[memoryQuery,memory]);

  function chooseGame(gameId:string){
    const profile=AAA_LOCALIZATION_PROFILES.find(item=>item.id===gameId);
    if(profile) setProject(createProductionProject(profile.id,profile.title));
  }

  function exportProject(){
    download(JSON.stringify(project,null,2),`${project.id}-production.json`);
  }

  function importMemory(file:File){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const raw=JSON.parse(String(reader.result));
        const rows=Array.isArray(raw.strings)?raw.strings:[];
        const next=buildMemory(rows.map((row:any)=>({
          source:String(row.source??""),
          ptBR:String(row.translation??row.ptBR??""),
          context:row.context?String(row.context):undefined,
        })),project.gameId);
        setMemory(next);
        setNotice(`${next.length} entradas carregadas na memória de tradução.`);
      }catch{setNotice("Não consegui importar essa memória.")}
    };
    reader.readAsText(file);
  }

  function importSubtitle(file:File){
    const reader=new FileReader();
    reader.onload=()=>{
      try{
        const raw=String(reader.result);
        const isVtt=file.name.toLowerCase().endsWith(".vtt");
        const cues=isVtt?parseVtt(raw):parseSrt(raw);
        setSubtitleFormat(isVtt?"vtt":"srt");
        setSubtitles(cues);
        setNotice(`${cues.length} legendas carregadas.`);
      }catch{setNotice("Não consegui interpretar esse arquivo de legenda.")}
    };
    reader.readAsText(file);
  }

  function exportSubtitle(){
    if(!subtitles.length)return;
    if(subtitleFormat==="vtt") download(exportVtt(subtitles),"legendas-pt-BR.vtt","text/vtt");
    else download(exportSrt(subtitles),"legendas-pt-BR.srt","application/x-subrip");
  }

  return <section className="production-studio">
    <div className="studio-hero">
      <div><span className="kicker">KAIRO PRODUCTION STUDIO</span><h2>Do arquivo bruto ao mod PT-BR.</h2><p>Uma linha de produção para projetos com dezenas de milhares de strings, cenas, falas e legendas.</p></div>
      <div className="studio-progress"><b>{overallProgress(project)}%</b><span>{health.label}</span></div>
    </div>

    <div className="studio-game-picker">{AAA_LOCALIZATION_PROFILES.slice().sort((a,b)=>a.priority-b.priority).map(game=><button key={game.id} className={project.gameId===game.id?"active":""} onClick={()=>chooseGame(game.id)}>{game.title}</button>)}</div>

    <div className="studio-next"><Activity size={18}/><div><small>PRÓXIMA AÇÃO</small><p>{nextAction(project)}</p></div><button onClick={exportProject}><Download size={14}/> Manifesto</button></div>

    <div className="stage-grid">{project.stages.map(stage=><article key={stage.id}><div className="stage-icon">{stage.status==="concluido"?<CheckCircle2/>:<Clock3/>}</div><b>{stage.label}</b><span>{stageProgress(stage)}%</span><div className="stage-bar"><i style={{width:`${stageProgress(stage)}%`}}/></div></article>)}</div>

    <div className="studio-metrics">
      <article><Languages/><b>{project.stats.strings.toLocaleString("pt-BR")}</b><span>strings</span></article>
      <article><ListChecks/><b>{project.stats.translated.toLocaleString("pt-BR")}</b><span>traduzidas</span></article>
      <article><FileAudio2/><b>{project.stats.voiceCues.toLocaleString("pt-BR")}</b><span>falas de voz</span></article>
      <article><Boxes/><b>{project.stats.scenes.toLocaleString("pt-BR")}</b><span>cenas</span></article>
    </div>

    {notice&&<div className="notice">{notice}</div>}

    <div className="studio-tools">
      <article className="studio-tool">
        <div className="tool-title"><BookMarked/><div><b>Memória de tradução</b><span>Reutiliza traduções anteriores e encontra frases parecidas.</span></div></div>
        <label className="import-button">Importar pacote<input hidden type="file" accept=".json,application/json" onChange={e=>e.target.files?.[0]&&importMemory(e.target.files[0])}/></label>
        <input className="studio-search" value={memoryQuery} onChange={e=>setMemoryQuery(e.target.value)} placeholder="Teste uma frase em inglês..."/>
        <div className="memory-results">{matches.map((match,index)=><div key={index}><span>{Math.round(match.score*100)}%</span><p>{match.source}</p><b>{match.target}</b></div>)}</div>
        {!memory.length&&<p className="empty-tool">Importe um pacote Kairo já traduzido para construir a memória.</p>}
      </article>

      <article className="studio-tool">
        <div className="tool-title"><Subtitles/><div><b>Legendas SRT/VTT</b><span>Timing, velocidade de leitura e exportação PT-BR.</span></div></div>
        <label className="import-button">Importar legenda<input hidden type="file" accept=".srt,.vtt,text/vtt" onChange={e=>e.target.files?.[0]&&importSubtitle(e.target.files[0])}/></label>
        {subtitles.length>0&&<><div className="subtitle-summary"><span>{subtitles.length} cues</span><span>{subtitleIssues.filter(i=>i.severity==="erro").length} erros</span><span>{subtitleIssues.filter(i=>i.severity==="aviso").length} avisos</span></div>
        <div className="subtitle-editor">{subtitles.slice(0,8).map(cue=><div key={cue.id}><small>{cue.id}</small><p>{cue.source}</p><textarea value={cue.ptBR} placeholder="Legenda PT-BR" onChange={e=>setSubtitles(current=>current.map(item=>item.id===cue.id?{...item,ptBR:e.target.value}:item))}/></div>)}</div>
        <button className="studio-export" onClick={exportSubtitle}><Download size={14}/> Exportar {subtitleFormat.toUpperCase()}</button></>}
        {!subtitles.length&&<p className="empty-tool">Aceita SRT e WebVTT sem alterar os tempos originais.</p>}
      </article>
    </div>

    <div className="studio-capabilities">
      <div><ScanSearch/><b>Ingestão</b><span>CSV, JSON, SRT, VTT e manifests.</span></div>
      <div><BookMarked/><b>Memória</b><span>Busca exata e fuzzy por similaridade.</span></div>
      <div><Radio/><b>Dublagem</b><span>Fila por personagem, cena e duração.</span></div>
      <div><Subtitles/><b>Legendas</b><span>QA de leitura e sincronização.</span></div>
      <div><PlayCircle/><b>Empacotamento</b><span>Saída em mod separado do jogo base.</span></div>
    </div>
  </section>;
}
