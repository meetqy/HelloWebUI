import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  app: {
    baseURL: "/beauty-template",
    head: {
      script: [
        {
          src: "https://cdnjs.cloudflare.com/ajax/libs/iframe-resizer/4.3.2/iframeResizer.contentWindow.js",
        },
      ],
    },
  },
  modules: ["@nuxtjs/strapi", "@nuxtjs/tailwindcss", "@vueuse/nuxt"],
  strapi: {
    url: "https://strapi.wcao.cc",
  },
  components: {
    global: true,
    dirs: ["~/components"],
  },
});
