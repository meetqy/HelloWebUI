<template>
  <div id="beauty-template">
    <component :is="currentElement"></component>
  </div>
</template>

<script setup>
const route = useRoute();

const htmlMode = useColorMode({
  selector: "#beauty-template",
  attribute: "data-theme",
});

const { num, type } = route.params;
const { dark = false } = route.query;
console.log(dark);

htmlMode.value = dark ? "dark" : "light";

const currentElement = resolveComponent(type + num);
</script>
