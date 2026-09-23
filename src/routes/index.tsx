import { createFileRoute } from "@tanstack/react-router";
import { KairoGate } from "@/components/kairo-gate";

export const Route = createFileRoute("/")({
  component: KairoGate,
});
