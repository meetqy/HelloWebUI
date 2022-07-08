<template>
  <div id="beauty-template">
    <nuxt-page />
  </div>
</template>
<style lang="postcss">
.scrollbar {
  /* 滚动槽 */
  &::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  &::-webkit-scrollbar-track {
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.06);
  }
  /* 滚动条滑块 */
  &::-webkit-scrollbar-thumb {
    border-radius: 3px;
    background: rgba(0, 0, 0, 0.12);
  }
}
</style>
