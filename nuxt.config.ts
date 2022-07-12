import { defineNuxtConfig } from "nuxt";

// https://v3.nuxtjs.org/api/configuration/nuxt.config
export default defineNuxtConfig({
  app: {
    baseURL: "/beauty-template",
  },
  modules: ["@nuxtjs/strapi", "@nuxtjs/tailwindcss", "@vueuse/nuxt"],
  strapi: {
    url: "https://strapi.wcao.cc",
  },
});
