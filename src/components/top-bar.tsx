import { ChevronDown, Menu } from "lucide-react";
import { useApp } from "@/lib/store";
import { visibleModels } from "@/lib/types";

export function TopBar({
  right,
}: {
  right?: React.ReactNode;
}) {
  const setSidebar = useApp((s) => s.setSidebar);
  const model = useApp((s) => s.model);
  const setModel = useApp((s) => s.setModel);
  const remote = useApp((s) => s.remoteModels);
  const openSettings = useApp((s) => s.openSettings);
  const models = visibleModels(remote);

  return (
    <header className="relative z-30 flex items-center justify-between px-3.5 pb-2.5 pt-[max(10px,env(safe-area-inset-top))] bg-gradient-to-b from-black/60 via-black/20 to-transparent">
      <button
        type="button"
        aria-label="Menu"
        onClick={() => setSidebar(true)}
        className="press flex size-10 shrink-0 items-center justify-center rounded-full bg-white/[0.07] hover:bg-white/[0.14] backdrop-blur-xl text-white md:invisible transition-all"
      >
        <Menu className="size-5" strokeWidth={1.8} />
      </button>

      {/* iOS style standard select for model picker */}
      <div className="flex min-w-0 flex-1 justify-center">
        <div className="relative inline-flex items-center">
          <select
            suppressHydrationWarning
            value={model}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "none") {
                openSettings("api");
              } else {
                setModel(val);
              }
            }}
            style={{ fontSize: "16px" }}
            aria-label="Selecionar Modelo"
            className="appearance-none bg-white/[0.08] hover:bg-white/[0.13] backdrop-blur-xl text-white rounded-full pl-4 pr-9 py-1.5 text-[16px] font-medium outline-none cursor-pointer transition-all"
          >
            {models.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#181920] text-white">
                {m.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 size-4 text-blue-400"
            strokeWidth={2.4}
          />
        </div>
      </div>

      {right ?? <div className="size-10 shrink-0 invisible" />}
    </header>
  );
}
