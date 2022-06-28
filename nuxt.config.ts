import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  app: {
    baseURL: "/beauty-template",
  },
  modules: ["@nuxtjs/tailwindcss", "@vueuse/nuxt"],
});
