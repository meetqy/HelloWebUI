<template>
  <component :is="Blog[params.num]" />
</template>

<script setup>
const { params } = useRoute();

const Blog = {
  1: resolveComponent("Blog1"),
  2: resolveComponent("Blog2"),
  3: resolveComponent("Blog3"),
  4: resolveComponent("Blog4"),
};
</script>
