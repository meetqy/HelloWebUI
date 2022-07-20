<template>
  <ul>
    <li v-for="item in routes">
      <nuxt-link
        :to="'/' + item.name.replace('language-', '').replace('-', '/')"
        >{{ item.name }}</nuxt-link
      >
    </li>
  </ul>
</template>

<script setup>
const { routes } = useRouter().options;
console.log(routes);
</script>
