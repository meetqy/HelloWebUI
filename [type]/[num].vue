<template>
  <component is="wcao">
    <div class="w-full flex justify-center items-center">
      <component :is="currentElement"></component>
    </div>
  </component>
</template>

<script setup>
const route = useRoute();

const { num, type } = route.params;
const { mode } = route.query;

const currentElement = resolveComponent(type + num);

const htmlMode = useColorMode({
  selector: "#beauty-template",
  attribute: "data-theme",
});

htmlMode.value = mode;

console.log(htmlMode.value);
</script>
