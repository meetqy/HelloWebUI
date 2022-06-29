import { faker } from "~/faker/src";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      faker,
    },
  };
});
