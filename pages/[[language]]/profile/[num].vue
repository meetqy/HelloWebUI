<template>
  <component :is="Profile[params.num]" />
</template>

<script setup>
const { params } = useRoute();

const Profile = {
  1: resolveComponent("Profile1"),
};
</script>
