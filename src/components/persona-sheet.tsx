import { useState, useRef, useEffect } from "react";
import {
  Check,
  ChevronLeft,
  Plus,
  SlidersHorizontal,
  Trash2,
  Upload,
  User,
  X,
} from "lucide-react";
import { useApp } from "@/lib/store";
import type { ChatPersona } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PersonaSheet() {
  const open = useApp((s) => s.personaSheetOpen);
  const initialMode = useApp((s) => s.personaSheetMode);
  const setOpen = useApp((s) => s.setPersonaSheet);
  const prefs = useApp((s) => s.prefs);
  const personas = (prefs.personas || []).filter(
    (p) => !p.isOriginal && p.id !== "original" && p.id !== "raphael" && p.id !== "kakeru",
  );
  const activePersonaId = prefs.activePersonaId;
  const setActivePersona = useApp((s) => s.setActivePersona);
  const addPersona = useApp((s) => s.addPersona);
  const updatePersona = useApp((s) => s.updatePersona);
  const deletePersona = useApp((s) => s.deletePersona);

  const [mode, setMode] = useState<"list" | "create" | "manage" | "edit">(initialMode || "list");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formAvatar, setFormAvatar] = useState("");
  const [formAge, setFormAge] = useState("");
  const [formGender, setFormGender] = useState("Masculino");
  const [formBio, setFormBio] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setMode(initialMode || "list");
      if (initialMode === "create") {
        setFormName("");
        setFormAvatar("");
        setFormAge("");
        setFormGender("Masculino");
        setFormBio("");
        setEditingId(null);
      }
    }
  }, [open, initialMode]);

  if (!open) return null;

  const handleClose = () => {
    setOpen(false);
    setMode("list");
    setEditingId(null);
  };

  const handleOpenCreate = () => {
    setFormName("");
    setFormAvatar("");
    setFormAge("");
    setFormGender("Masculino");
    setFormBio("");
    setMode("create");
  };

  const handleOpenEdit = (p: ChatPersona) => {
    setEditingId(p.id);
    setFormName(p.name);
    setFormAvatar(p.avatar);
    setFormAge(p.age);
    setFormGender(p.gender || "Masculino");
    setFormBio(p.bio);
    setMode("edit");
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCreate = () => {
    if (!formName.trim()) return;
    addPersona({
      name: formName.trim(),
      avatar: formAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
      age: formAge.trim(),
      gender: formGender,
      bio: formBio.trim(),
    });
    setMode("list");
  };

  const handleSaveEdit = () => {
    if (!editingId || !formName.trim()) return;
    updatePersona(editingId, {
      name: formName.trim(),
      avatar: formAvatar,
      age: formAge.trim(),
      gender: formGender,
      bio: formBio.trim(),
    });
    setMode("manage");
  };

  const getGenderBadge = (gender: string) => {
    const g = (gender || "").toLowerCase();
    if (g.includes("masc") || g.includes("♂") || g.includes("homem") || g.includes("ele")) {
      return { symbol: "♂", color: "text-blue-400 bg-[#162030]" };
    }
    if (g.includes("fem") || g.includes("♀") || g.includes("mulher") || g.includes("ela")) {
      return { symbol: "♀", color: "text-pink-400 bg-[#301625]" };
    }
    return { symbol: "⚧", color: "text-amber-400 bg-[#2b2416]" };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dimmed backdrop with blur */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
      />

      {/* Floating Card without thick borders, reduced radius, smaller size */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="persona-sheet-title"
        className="relative z-10 w-full max-w-[370px] rounded-2xl bg-[#17181f]/95 backdrop-blur-2xl p-4 text-white shadow-[0_20px_60px_rgba(0,0,0,0.9)] max-h-[75vh] overflow-y-auto no-scrollbar animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Top Header bar with close button */}
        <div className="flex items-center justify-between pb-3">
          <h2
            id="persona-sheet-title"
            className="text-[17px] font-bold tracking-tight text-white"
          >
            {mode === "create"
              ? "Novo Perfil"
              : mode === "edit"
                ? "Editar Perfil"
                : mode === "manage"
                  ? "Gerenciar Perfis"
                  : "Perfis & Personas"}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className="press flex size-7 items-center justify-center rounded-full bg-white/5 hover:bg-white/15 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* --- VIEW: LIST (Floating compact persona selector) --- */}
        {mode === "list" && (
          <div>
            <div className="flex items-center justify-between gap-2 mt-1 mb-3">
              <p className="text-[13px] text-zinc-400">
                Selecione o perfil que falará no chat:
              </p>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="press flex items-center gap-1 rounded-full bg-white/10 hover:bg-white/15 px-2.5 py-1 text-[12px] font-semibold text-white transition-all shadow-sm shrink-0"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
                Criar
              </button>
            </div>

            {/* Persona horizontal row - keeping the profile avatar sizes */}
            {personas.length === 0 ? (
              <div className="my-6 flex flex-col items-center justify-center text-center py-4 bg-white/[0.03] rounded-xl p-3">
                <div className="size-12 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 mb-2">
                  <User className="size-6" />
                </div>
                <p className="text-[13.5px] font-medium text-white">Nenhum perfil criado</p>
                <p className="text-[12px] text-zinc-400 mt-0.5">
                  Crie um perfil para personalizar como o chat se refere a você.
                </p>
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="press mt-3 flex items-center gap-1.5 rounded-full bg-blue-600 hover:bg-blue-500 px-3.5 py-1.5 text-[12.5px] font-medium text-white shadow-sm"
                >
                  <Plus className="size-3.5" />
                  Criar Primeiro Perfil
                </button>
              </div>
            ) : (
              <div className="my-4 flex items-start gap-4 overflow-x-auto no-scrollbar py-2 px-1">
                {personas.map((p) => {
                  const isActive = p.id === activePersonaId;
                  const badge = getGenderBadge(p.gender);

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setActivePersona(p.id)}
                      className="press group flex flex-col items-center min-w-[70px] shrink-0 text-center outline-none"
                    >
                      {/* Maintained circle size (70px) */}
                      <div className="relative size-[68px] rounded-full flex items-center justify-center transition-all duration-150 group-hover:scale-105">
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt={p.name}
                            className="size-full rounded-full object-cover shadow-md"
                          />
                        ) : (
                          <div className="size-full rounded-full bg-[#2a2a32] flex items-center justify-center shadow-md">
                            <User className="size-8 text-zinc-400" />
                          </div>
                        )}

                        {/* Gender Badge on bottom-right */}
                        {p.gender && (
                          <span
                            className={cn(
                              "absolute -bottom-1 -right-1 size-[20px] rounded-full border border-black/80 flex items-center justify-center text-[11px] font-bold shadow-md",
                              badge.color,
                            )}
                          >
                            {badge.symbol}
                          </span>
                        )}

                        {/* Selected checkmark overlay */}
                        {isActive && (
                          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                            <Check className="size-6 text-white stroke-[3] drop-shadow-md" />
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <span
                        className={cn(
                          "mt-2 max-w-[76px] truncate text-[13.5px] transition-colors",
                          isActive ? "text-white font-semibold" : "text-zinc-300 font-medium",
                        )}
                      >
                        {p.name}
                      </span>

                      {/* Subtitle if active */}
                      {isActive && (
                        <span className="text-[11px] text-blue-400 font-medium block -mt-0.5">
                          Ativo
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Bottom action: Gerenciar Persona */}
            {personas.length > 0 && (
              <div className="pt-2 flex justify-center border-t border-white/5 mt-2">
                <button
                  type="button"
                  onClick={() => setMode("manage")}
                  className="press flex items-center gap-1.5 rounded-full py-1.5 px-4 text-[13px] font-medium text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-all"
                >
                  <SlidersHorizontal className="size-3.5" />
                  Gerenciar Perfis
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: CREATE --- */}
        {mode === "create" && (
          <div className="space-y-3.5 mt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("list")}
                className="press flex items-center gap-1 text-zinc-400 hover:text-white text-[13px]"
              >
                <ChevronLeft className="size-4" />
                Voltar
              </button>
            </div>

            {/* Avatar upload */}
            <div className="flex items-center gap-3 py-1">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative size-16 rounded-full overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer border border-white/15 hover:border-blue-400 transition-all shrink-0"
              >
                {formAvatar ? (
                  <img
                    src={formAvatar}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <Upload className="size-5" />
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />

              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="press rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[12.5px] text-zinc-200"
                >
                  {formAvatar ? "Trocar foto" : "Carregar foto da galeria"}
                </button>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Foto do seu dispositivo
                </p>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[12.5px] font-medium text-zinc-300 mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ex: Arthur, Elena, Alex..."
                className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-[14px] text-white placeholder:text-zinc-500 outline-none focus:bg-white/[0.09]"
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12.5px] font-medium text-zinc-300 mb-1">
                  Idade
                </label>
                <input
                  type="text"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  placeholder="Ex: 21 anos"
                  className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-[14px] text-white placeholder:text-zinc-500 outline-none focus:bg-white/[0.09]"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-zinc-300 mb-1">
                  Gênero
                </label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value)}
                  className="w-full rounded-xl bg-[#23242c] px-2.5 py-2 text-[14px] text-white outline-none focus:bg-white/[0.09]"
                >
                  <option value="Masculino">Masculino ♂</option>
                  <option value="Feminino">Feminino ♀</option>
                  <option value="Não-binário">Não-binário ⚧</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[12.5px] font-medium text-zinc-300 mb-1">
                Biografia / Personalidade
              </label>
              <textarea
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                rows={2}
                placeholder="Ex: Calmo, observador, gosta de astronomia..."
                className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-[13.5px] text-white placeholder:text-zinc-500 outline-none resize-none leading-relaxed focus:bg-white/[0.09]"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("list")}
                className="press flex-1 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-[13.5px] font-medium text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!formName.trim()}
                onClick={handleSaveCreate}
                className="press flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-[13.5px] disabled:opacity-40"
              >
                Salvar
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW: MANAGE --- */}
        {mode === "manage" && (
          <div className="space-y-3 mt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMode("list")}
                className="press flex items-center gap-1 text-zinc-400 hover:text-white text-[13px]"
              >
                <ChevronLeft className="size-4" />
                Voltar
              </button>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="press text-blue-400 hover:text-blue-300 text-[13px] font-medium"
              >
                + Criar Novo
              </button>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
              {personas.map((p) => {
                const isActive = p.id === activePersonaId;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="relative size-10 rounded-full overflow-hidden shrink-0 bg-[#282830]">
                        {p.avatar ? (
                          <img src={p.avatar} alt={p.name} className="size-full object-cover" />
                        ) : (
                          <div className="size-full flex items-center justify-center">
                            <User className="size-5 text-zinc-400" />
                          </div>
                        )}
                        {isActive && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Check className="size-3.5 text-white stroke-[3]" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold text-[13.5px] truncate text-white">
                          {p.name}
                        </p>
                        <p className="text-[11.5px] text-zinc-400 truncate">
                          {p.age ? `${p.age} • ` : ""}{p.gender || "Perfil"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!isActive && (
                        <button
                          type="button"
                          onClick={() => setActivePersona(p.id)}
                          className="press px-2.5 py-1 text-[12px] font-medium rounded-full bg-white/10 hover:bg-white/15 text-zinc-200"
                        >
                          Usar
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(p)}
                        className="press p-1.5 text-zinc-400 hover:text-white rounded-lg"
                        title="Editar"
                      >
                        <SlidersHorizontal className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePersona(p.id)}
                        className="press p-1.5 text-zinc-400 hover:text-red-400 rounded-lg"
                        title="Excluir"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: EDIT --- */}
        {mode === "edit" && (
          <div className="space-y-3.5 mt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("manage")}
                className="press flex items-center gap-1 text-zinc-400 hover:text-white text-[13px]"
              >
                <ChevronLeft className="size-4" />
                Voltar
              </button>
            </div>

            {/* Avatar upload */}
            <div className="flex items-center gap-3 py-1">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative size-16 rounded-full overflow-hidden bg-black/40 flex items-center justify-center cursor-pointer border border-white/15 hover:border-blue-400 transition-all shrink-0"
              >
                {formAvatar ? (
                  <img
                    src={formAvatar}
                    alt="Preview"
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-zinc-400">
                    <Upload className="size-5" />
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageFile}
                className="hidden"
              />

              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="press rounded-full bg-white/10 hover:bg-white/15 px-3 py-1.5 text-[12.5px] text-zinc-200"
                >
                  Trocar foto da galeria
                </button>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-[12.5px] font-medium text-zinc-300 mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-[14px] text-white outline-none"
              />
            </div>

            {/* Age & Gender */}
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[12.5px] font-medium text-zinc-300 mb-1">
                  Idade
                </label>
                <input
                  type="text"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-[14px] text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-medium text-zinc-300 mb-1">
                  Gênero
                </label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value)}
                  className="w-full rounded-xl bg-[#23242c] px-2.5 py-2 text-[14px] text-white outline-none"
                >
                  <option value="Masculino">Masculino ♂</option>
                  <option value="Feminino">Feminino ♀</option>
                  <option value="Não-binário">Não-binário ⚧</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[12.5px] font-medium text-zinc-300 mb-1">
                Biografia / Personalidade
              </label>
              <textarea
                value={formBio}
                onChange={(e) => setFormBio(e.target.value)}
                rows={2}
                className="w-full rounded-xl bg-white/[0.06] px-3 py-2 text-[13.5px] text-white outline-none resize-none leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("manage")}
                className="press flex-1 h-9 rounded-xl bg-white/10 hover:bg-white/15 text-[13.5px] font-medium text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!formName.trim()}
                onClick={handleSaveEdit}
                className="press flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-[13.5px] disabled:opacity-40"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
