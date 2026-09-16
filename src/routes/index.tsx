import { createFileRoute } from "@tanstack/react-router";
import { ClaudeApp } from "@/components/claude-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <ClaudeApp />;
}
