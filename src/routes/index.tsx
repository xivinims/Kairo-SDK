import { createFileRoute } from "@tanstack/react-router";
import { ZenoAgentApp } from "@/components/zeno-agent-app";

export const Route = createFileRoute("/")({
  component: ZenoAgentApp,
});
