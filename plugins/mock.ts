import Mock from "mockjs";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      Mock,
      Random: Mock.Random,
    },
  };
});
