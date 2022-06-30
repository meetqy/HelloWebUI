<template>
  <div class="drawer drawer-mobile" id="beauty-template">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    <div
      class="drawer-content bg-neutral-content flex flex-col items-center justify-center relative"
    >
      <div
        class="h-12 w-full bg-base-200 shadow-md absolute left-0 top-0 flex justify-end px-4 items-center"
      >
        <button class="btn btn-sm btn-ghost mr-2" @click="onCopy">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        </button>
        <div class="dropdown dropdown-end">
          <label tabindex="0" class="btn btn-sm m-1 capitalize">language</label>
          <ul
            tabindex="0"
            class="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52 uppercase"
          >
            <li v-for="item in langs" class="flex">
              <nuxt-link
                :to="`/${item.text}/${url}`"
                class="flex justify-between"
              >
                <span>
                  {{ item.icon }}
                  <span class="ml-1">{{ item.text }}</span>
                </span>
                <span class="badge badge-outline lowercase">
                  {{ item.desc }}
                </span>
              </nuxt-link>
            </li>
          </ul>
        </div>
      </div>

      <div id="template-wrapper">
        <NuxtPage />
      </div>
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
const url = computed(() => useRoute().path.split("/").slice(2, 4).join("/"));

const { $faker } = useNuxtApp();

const { copy } = useClipboard();

const onCopy = () => {
  const el = document.querySelector("#template-wrapper");
  copy(createHtml(el.innerHTML));
  alert("复制成功，只需要粘贴到任意一个html文件中，即可完美复刻！");
};

const setLocale = (language) => {
  const arr = language.split("_");
  if (arr[1]) {
    arr[1] = arr[1].toLocaleUpperCase();
  }
  $faker.setLocale(arr.join("_"));
};

const route = useRoute();
const { language } = route.params;
setLocale(language);

watch(route, (val) => {
  setLocale(val.params.language);
});

const langs = [
  {
    icon: "🇨🇳",
    text: "zh_CN",
    desc: "中文",
  },
  {
    icon: "🇺🇸",
    text: "en",
    desc: "english",
  },
  {
    icon: "🇯🇵",
    text: "ja",
    desc: "ジャパン",
  },
];

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
  selector: "#beauty-template",
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
