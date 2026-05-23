import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LRO Controle de Ferramentas",
    short_name: "LRO Ferramentas",
    description: "Sistema de controle e devolução de ferramentas da LRO Demolições",
    start_url: "/",
    display: "standalone",
    background_color: "#1e2026",
    theme_color: "#10b981",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
