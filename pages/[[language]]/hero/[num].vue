<template>
  <component :is="Hero[params.num]" />
</template>

<script setup>
const { params } = useRoute();

const Hero = {
  1: resolveComponent("Hero1"),
};
</script>
