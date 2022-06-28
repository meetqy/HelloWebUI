<template>
  <div class="drawer drawer-mobile">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    <div
      class="drawer-content flex flex-col items-center justify-center relative"
    >
      <div
        class="h-12 bg-base-200 w-full absolute left-0 top-0 flex justify-end px-4 items-center"
      >
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-sm m-1 capitalize">language</label>
          <ul
            tabindex="0"
            class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 uppercase"
          >
            <li>
              <nuxt-link to="/zh/card/1">
                🇨🇳 <span class="ml-1">zh</span>
              </nuxt-link>
            </li>
            <li>
              <nuxt-link to="/en/card/1">
                🇺🇸 <span class="ml-1">en</span>
              </nuxt-link>
            </li>
          </ul>
        </div>
      </div>
      <NuxtPage />
    </div>
    <div class="drawer-side">
      <label for="my-drawer-2" class="drawer-overlay"></label>
      <ul
        class="menu p-4 overflow-y-auto w-72 bg-base-200 text-base-content scrollbar"
      >
        <li
          v-for="item in themes"
          :key="item"
          :data-theme="item"
          class="my-2 shadow rounded-box"
          :class="{ 'outline-dashed': htmlMode === item }"
        >
          <a
            href="javascript:;"
            class="flex justify-between hover:bg-transparent active:bg-transparent focus:bg-transparent"
            @click="htmlMode = item"
          >
            <span>{{ item }}</span>
            <div class="flex gap-1 h-4">
              <div class="bg-primary w-2 rounded"></div>
              <div class="bg-secondary w-2 rounded"></div>
              <div class="bg-accent w-2 rounded"></div>
              <div class="bg-neutral w-2 rounded"></div>
            </div>
          </a>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
];

const htmlMode = useColorMode({
  attribute: "data-theme",
});
</script>

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
