import { createFileRoute } from "@tanstack/react-router";
import { KairoAgentApp } from "@/components/kairo-agent-app";

export const Route = createFileRoute("/")({
  component: KairoAgentApp,
});
