import { createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import appCss from "../styles.css?url";
import { KairoAgentApp } from "@/components/kairo-agent-app";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "Kairo Agent" },
      { name: "description", content: "Kairo — agente de IA." },
      { name: "theme-color", content: "#09090b" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: () => (
    <html lang="pt-BR" className="dark antialiased">
      <head><HeadContent /></head>
      <body>
        <KairoAgentApp />
        <Scripts />
      </body>
    </html>
  ),
});
