import mockjs from "mockjs";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      Mock: mockjs,
      Random: mockjs.Random,
    },
  };
});
