const fs = require("fs");

for (let i = 1; i <= 17; i++) {
  fs.writeFileSync(
    `${i}.vue`,
    `<template>
    <nuxt-layout>
      <Card${i} />
    </nuxt-layout>
  </template>
  `
  );
}
