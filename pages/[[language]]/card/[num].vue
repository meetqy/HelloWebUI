<template>
  <component :is="Card[params.num]" />
</template>

<script setup>
const { params } = useRoute();

const Card = {
  1: resolveComponent("Card1"),
  2: resolveComponent("Card2"),
  3: resolveComponent("Card3"),
  4: resolveComponent("Card4"),
  5: resolveComponent("Card5"),
  6: resolveComponent("Card6"),
  7: resolveComponent("Card7"),
  8: resolveComponent("Card8"),
  9: resolveComponent("Card9"),
  10: resolveComponent("Card10"),
  11: resolveComponent("Card11"),
  12: resolveComponent("Card12"),
  13: resolveComponent("Card13"),
  14: resolveComponent("Card14"),
  15: resolveComponent("Card15"),
  16: resolveComponent("Card16"),
  17: resolveComponent("Card17"),
};
</script>
