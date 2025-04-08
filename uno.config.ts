import {
  defineConfig,
  presetUno,
  presetWind,
  transformerDirectives,
  transformerVariantGroup,
  transformerCompileClass,
} from "unocss";

export default defineConfig({
  content: {
    filesystem: ["**/*.{html,js,ts,jsx,tsx,vue,svelte,astro}"],
  },
  presets: [
    // 基础预设
    presetUno(),
    presetWind(),
  ],
  transformers: [
    // 变体组 hover:(bg-gray-400 font-medium) -> hover:bg-gray-400 hover:font-medium
    transformerVariantGroup(),
    // 指令 @apply、@screen 和 theme()
    transformerDirectives(),
    // 编译样式 :uno: text-center sm:text-left -> uno-qlmcrp
    transformerCompileClass(),
  ],
  theme: {
    colors: {
      tw: {
        primary: "var(--primary)",
        secondary: "var(--secondary)",
        accent: "var(--accent)",
        dark: "var(--dark)",
        positive: "var(--positive)",
        negative: "var(--negative)",
        info: "var(--info)",
        warning: "var(--warning)",
      },
    },
    breakpoints: {
      xs: "320px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
  },
  shortcuts: [
    {
      center: "flex items-center justify-center",
      "center-x": "flex items-center",
      "center-y": "flex justify-center",
      between: "flex items-center justify-between",
      "absolute-x-center": "absolute left-50% -translate-x-50%",
      "absolute-y-center": "absolute top-50% -translate-y-50%",
      "absolute-center": "absolute left-50% top-50% -translate-x-50% -translate-y-50%",
      speed: "content-visibility-auto",
      "wh-full": "w-full h-full",
      "scroll-x": "overflow-y-hidden overflow-x-auto",
      "scroll-y": "overflow-x-hidden overflow-y-auto",
    },
    [/^btn-(.*)$/, ([, c]) => `bg-${c}-400 text-${c}-100 py-2 px-4 rounded-lg`],
  ],
  rules: [
    [/^wh-(\d+)$/, ([, d]) => ({ width: `${d}px`, height: `${d}px` })],
    [/^wh(\d+)$/, ([, d]) => ({ width: `${parseInt(d) / 4}rem`, height: `${parseInt(d) / 4}rem` })],
    [/^grid-auto-w-(\d+)$/, ([, d]) => ({ gridTemplateColumns: `repeat(auto-fill, ${d}px)` })],
    [/^grid-auto-h-(\d+)$/, ([, d]) => ({ gridTemplateRows: `repeat(auto-fill, ${d}px)` })],
  ],
});
