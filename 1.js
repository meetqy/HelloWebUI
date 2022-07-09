const fs = require("fs");

for (let i = 9; i <= 17; i++) {
  fs.writeFileSync(
    `${i}.vue`,
    `<template>
    <nuxt-layout daisyui>
      <Card${i} />
    </nuxt-layout>
  </template>
  `
  );
}
