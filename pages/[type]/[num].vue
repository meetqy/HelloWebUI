<template>
  <component is="wcao">
    <div id="beauty-template" class="w-full">
      <component :is="currentElement"></component>
    </div>
  </component>
</template>

<script setup>
const route = useRoute();

const htmlMode = useColorMode({
  selector: "#beauty-template",
  attribute: "data-theme",
});

const { num, type } = route.params;
const { dark = false } = route.query;

htmlMode.value = dark ? "dark" : "light";

const currentElement = resolveComponent(type + num);
</script>
