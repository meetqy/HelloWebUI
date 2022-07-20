<template>
  <component :is="Section[params.num]" />
</template>

<script setup>
const { params } = useRoute();

const Section = {
  1: resolveComponent("Section1"),
  2: resolveComponent("Section2"),
  3: resolveComponent("Section3"),
  4: resolveComponent("Section4"),
  5: resolveComponent("Section5"),
};
</script>
