import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "剋擇擇日",
    short_name: "剋擇擇日",
    description: "依《剋擇講義》擇吉：嫁娶、安牀、出行",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf9",
    theme_color: "#b91c1c",
    lang: "zh-Hant",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
