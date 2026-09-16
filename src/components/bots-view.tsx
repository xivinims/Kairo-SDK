import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  User,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { CustomBot } from "@/lib/types";

export function BotsView() {
  const bots = useApp((s) => s.customBots);
  const openBotCreation = useApp((s) => s.openBotCreation);
  const openBotEdit = useApp((s) => s.openBotEdit);
  const startBotChat = useApp((s) => s.startBotChat);
  const deleteBot = useApp((s) => s.deleteBot);
  const setView = useApp((s) => s.setView);

  return (
    <div className="flex h-full flex-col bg-[#0c0d12] text-white overflow-y-auto no-scrollbar">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 sticky top-0 bg-[#0c0d12]/90 backdrop-blur-xl z-20">
        <button
          type="button"
          onClick={() => setView("home")}
          className="press flex size-9 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-[17px] font-semibold text-white">Bots de IA</h1>
        <div className="size-9" />
      </div>

      <div className="flex-1 p-4 max-w-4xl mx-auto w-full space-y-6">
        <div className="rounded-[28px] bg-[#17181e] p-4.5 sm:p-5 border border-white/5 shadow-2xl">
          {/* Header row: "X Criações >" */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-baseline gap-2">
              <span className="text-[28px] font-bold text-white tracking-tight leading-none">
                {bots.length}
              </span>
              <span className="text-[16px] font-medium text-zinc-400">
                Criações
              </span>
            </div>
            <button
              type="button"
              onClick={() => openBotCreation()}
              className="press flex size-7 items-center justify-center rounded-full text-zinc-400 hover:text-white"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>

          {/* Horizontal scroll list of bots */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
            {/* '+' button card with 'Criar' below */}
            <button
              type="button"
              onClick={() => openBotCreation()}
              className="press group flex h-[155px] w-[115px] sm:h-[170px] sm:w-[125px] shrink-0 flex-col items-center justify-center rounded-[20px] bg-[#22232a] hover:bg-[#282932] border border-white/5 transition-all text-zinc-200 hover:text-white"
            >
              <div className="flex size-11 items-center justify-center rounded-full bg-white/5 group-hover:bg-white/10 transition-colors mb-2">
                <Plus className="size-7 stroke-[2.2] text-zinc-300 group-hover:text-white" />
              </div>
              <span className="text-[14px] font-medium text-zinc-200">
                Criar
              </span>
            </button>

            {/* Created bot cards */}
            {bots.map((bot) => (
              <div
                key={bot.id}
                className="group relative h-[155px] w-[115px] sm:h-[170px] sm:w-[125px] shrink-0 overflow-hidden rounded-[20px] bg-[#1e2029] border border-white/10 shadow-md cursor-pointer transition-all hover:scale-[1.02]"
                onClick={() => startBotChat(bot.id)}
              >
                {bot.photo ? (
                  <img
                    src={bot.photo}
                    alt={bot.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="size-full bg-gradient-to-b from-[#2a2c38] to-[#16171f] flex items-center justify-center">
                    <User className="size-10 text-zinc-500" />
                  </div>
                )}

                {/* Soft gradient bottom overlay */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                {/* iOS standard select for bot card actions */}
                <div
                  className="absolute top-2 right-2 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <select
                    defaultValue=""
                    style={{ fontSize: "16px" }}
                    aria-label={`Opções do Bot ${bot.name}`}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "chat") {
                        startBotChat(bot.id);
                      } else if (val === "edit") {
                        openBotEdit(bot);
                      } else if (val === "delete") {
                        deleteBot(bot.id);
                      }
                      e.target.value = "";
                    }}
                    className="h-7 w-8 rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md px-1 text-center font-bold border border-white/15 outline-none cursor-pointer appearance-none shadow-md"
                  >
                    <option value="" disabled hidden>
                      ···
                    </option>
                    <option value="chat" className="bg-[#1f2029] text-white">
                      Conversar
                    </option>
                    <option value="edit" className="bg-[#1f2029] text-white">
                      Editar bot
                    </option>
                    <option value="delete" className="bg-[#1f2029] text-red-400 font-semibold">
                      Apagar bot
                    </option>
                  </select>
                </div>

                {/* Name on bottom */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 z-10 text-left">
                  <span className="block truncate text-[13.5px] font-semibold text-white drop-shadow-sm">
                    {bot.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function BotCreationModal({
  onClose,
  editingBot,
}: {
  onClose: () => void;
  editingBot?: CustomBot | null;
}) {
  const addBot = useApp((s) => s.addBot);
  const updateBot = useApp((s) => s.updateBot);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(editingBot?.name || "");
  const [intro, setIntro] = useState(editingBot?.intro || "");
  const [personality, setPersonality] = useState(editingBot?.personality || "");
  const [welcomeMsg, setWelcomeMsg] = useState(editingBot?.welcomeMsg || "");
  const [scenario, setScenario] = useState(editingBot?.scenario || "");
  const [instructions, setInstructions] = useState(editingBot?.instructions || "");
  const [gender, setGender] = useState(editingBot?.gender || "Feminino");
  const [visibility, setVisibility] = useState("Público");
  const [photo, setPhoto] = useState<string>(editingBot?.photo || "");

  useEffect(() => {
    if (editingBot) {
      setName(editingBot.name || "");
      setIntro(editingBot.intro || "");
      setPersonality(editingBot.personality || "");
      setWelcomeMsg(editingBot.welcomeMsg || "");
      setScenario(editingBot.scenario || "");
      setInstructions(editingBot.instructions || "");
      setGender(editingBot.gender || "Feminino");
      setPhoto(editingBot.photo || "");
    } else {
      setName("");
      setIntro("");
      setPersonality("");
      setWelcomeMsg("");
      setScenario("");
      setInstructions("");
      setGender("Feminino");
      setPhoto("");
    }
  }, [editingBot]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingBot) {
      updateBot(editingBot.id, {
        name: name.trim(),
        gender,
        intro: intro.trim(),
        personality:
          personality.trim() || "Personalidade amigável, acolhedora e expressiva.",
        welcomeMsg: welcomeMsg.trim(),
        scenario: scenario.trim(),
        instructions: instructions.trim(),
        likes: scenario.trim(),
        photo:
          photo ||
          editingBot.photo ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      });
    } else {
      addBot({
        name: name.trim(),
        gender,
        intro: intro.trim(),
        personality:
          personality.trim() || "Personalidade amigável, acolhedora e expressiva.",
        welcomeMsg: welcomeMsg.trim(),
        scenario: scenario.trim(),
        instructions: instructions.trim(),
        likes: scenario.trim(),
        tags: [],
        photo:
          photo ||
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-bot-sheet"
        className="relative z-10 flex h-[92vh] sm:h-[88vh] w-full max-w-lg flex-col rounded-t-[32px] sm:rounded-[32px] bg-[#121318] text-white shadow-2xl overflow-hidden border border-white/10"
      >
        {/* Top Floating Controls: Back arrow, "Público/Privado" select, Image selector */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#121318]/90 backdrop-blur-md">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="press flex size-10 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white"
          >
            <ChevronLeft className="size-5" />
          </button>

          <span className="text-[15px] font-semibold text-white">
            {editingBot ? "Editar Bot de IA" : "Criar Bot de IA"}
          </span>

          {/* iOS style select for Visibility */}
          <div className="flex items-center rounded-full bg-[#1e2028] px-3.5 py-1.5 text-[13.5px] font-medium text-zinc-200 border border-white/5">
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              style={{ fontSize: "16px" }}
              className="bg-transparent text-white text-[14px] outline-none cursor-pointer"
            >
              <option value="Público" className="bg-[#1a1b22] text-white">
                Público
              </option>
              <option value="Privado" className="bg-[#1a1b22] text-white">
                Privado
              </option>
            </select>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSave}
          className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-6"
        >
          {/* Dashed Reference Image Card */}
          <div className="flex flex-col items-center justify-center pt-1">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative h-44 w-36 rounded-2xl border-2 border-dashed border-zinc-700 hover:border-zinc-500 bg-white/[0.02] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden group"
            >
              {photo ? (
                <img
                  src={photo}
                  alt="Imagem de referência"
                  className="size-full object-cover group-hover:opacity-90"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-3 text-center">
                  <Plus className="size-6 text-zinc-500 mb-1.5" />
                  <span className="text-[12.5px] font-medium text-zinc-400 leading-tight">
                    Imagem de referência
                  </span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Gender Selector: iOS style select */}
          <div>
            <label className="block text-[14px] font-semibold text-white mb-2">
              Gênero
            </label>
            <div className="rounded-2xl bg-[#1a1b22] border border-white/5 px-4 py-3 focus-within:border-white/20 transition-all">
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                style={{ fontSize: "16px" }}
                className="w-full bg-transparent text-white text-[16px] outline-none cursor-pointer"
              >
                <option value="Feminino" className="bg-[#1a1b22] text-white">
                  Feminino
                </option>
                <option value="Masculino" className="bg-[#1a1b22] text-white">
                  Masculino
                </option>
                <option value="Não binário" className="bg-[#1a1b22] text-white">
                  Não binário
                </option>
              </select>
            </div>
          </div>

          {/* Name Field */}
          <div>
            <span className="block text-center text-[13px] text-zinc-400 mb-2">
              Forneça um nome para mim
            </span>
            <div className="rounded-2xl bg-[#1a1b22] border border-white/5 px-4 py-3.5 focus-within:border-white/20 transition-all">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Meu Nome É..."
                className="w-full bg-transparent text-center text-[16px] font-medium text-white placeholder:text-zinc-500 outline-none"
              />
            </div>
          </div>

          {/* Minha Introdução * */}
          <div>
            <label className="block text-[14px] font-semibold text-white mb-2">
              Minha Introdução *
            </label>
            <div className="rounded-2xl bg-[#1a1b22] border border-white/5 p-4 focus-within:border-white/20 transition-all">
              <textarea
                rows={3}
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                placeholder="Este é o slogan no cartaz do filme! Capture a atenção do público em uma frase e deixe-os saber do que se trata este bot."
                className="w-full bg-transparent text-[14px] text-white placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Minha Personalidade * */}
          <div>
            <label className="block text-[14px] font-semibold text-white mb-2">
              Minha Personalidade *
            </label>
            <div className="rounded-2xl bg-[#1a1b22] border border-white/5 p-4 focus-within:border-white/20 transition-all">
              <textarea
                rows={4}
                required
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                placeholder="Dê uma alma: É cínico e tsundere, ou gentil e curador? Tem uma frase de efeito? Quanto mais detalhes, mais vívida a IA."
                className="w-full bg-transparent text-[14px] text-white placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Mensagem de boas-vindas * */}
          <div>
            <label className="block text-[14px] font-semibold text-white mb-2">
              Mensagem de boas-vindas *
            </label>
            <div className="rounded-2xl bg-[#1a1b22] border border-white/5 p-4 focus-within:border-white/20 transition-all">
              <textarea
                rows={4}
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                placeholder='A cortina se levanta—qual é a primeira coisa que diz? Isso define o tom para toda a interação. Por exemplo, "*Bebe café* Oh? Você de novo. Que más notícias você quer ouvir hoje?"'
                className="w-full bg-transparent text-[14px] text-white placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Cenário */}
          <div>
            <label className="block text-[14px] font-semibold text-white mb-2">
              Cenário
            </label>
            <div className="rounded-2xl bg-[#1a1b22] border border-white/5 p-4 focus-within:border-white/20 transition-all">
              <textarea
                rows={3}
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                placeholder="Defina o cenário. É uma cidade cyberpunk agitada? Uma floresta mágica? Ou uma sala de estar tranquila após uma discussão acalorada?"
                className="w-full bg-transparent text-[14px] text-white placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Instruções do Bot */}
          <div>
            <label className="block text-[14px] font-semibold text-white mb-2">
              Instruções do Bot
            </label>
            <div className="rounded-2xl bg-[#1a1b22] border border-white/5 p-4 focus-within:border-white/20 transition-all">
              <textarea
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Instruções e diretrizes de como este bot deve responder nas conversas e no RPG..."
                className="w-full bg-transparent text-[14px] text-white placeholder:text-zinc-500 outline-none resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Bottom Fixed Action Buttons: Cancelar & Publicar/Salvar */}
          <div className="pt-3 pb-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="press flex-1 rounded-full bg-[#1e2028] hover:bg-[#252834] py-3.5 text-[15px] font-medium text-white transition-all text-center border border-white/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="press flex-1 rounded-full bg-white hover:bg-zinc-200 py-3.5 text-[15px] font-semibold text-black transition-all text-center shadow-lg disabled:opacity-40"
            >
              {editingBot ? "Salvar alterações" : "Publicar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
