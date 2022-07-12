<template>
  <div class="drawer drawer-mobile" v-if="!full">
    <input id="my-drawer-2" type="checkbox" class="drawer-toggle" />
    <div class="drawer-content bg-base-200 relative pt-12 min-h-screen">
      <div
        class="h-12 w-full bg-base-100 shadow-md fixed left-0 top-0 flex justify-end px-4 items-center"
      >
        <button
          class="btn btn-ghost btn-sm hover:bg-transparent font-light mr-2"
          v-if="!props.lang || !props.daisyui"
        >
          完善中...
        </button>

        <div
          class="btn btn-ghost hover:bg-transparent btn-sm"
          v-if="props.daisyui"
        >
          <span class="lowercase text-primary">daisy</span>
          <span class="!text-base-content uppercase">UI</span>
        </div>

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

      <div
        id="template-wrapper"
        class="w-full flex justify-center"
        :class="{ 'items-center h-full -mt-12': props.middle }"
      >
        <slot></slot>
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
  <div class="flex justify-center w-full" v-else>
    <slot></slot>
  </div>
</template>

<script setup>
const props = defineProps({
  lang: Boolean,
  daisyui: Boolean,
  middle: {
    type: Boolean,
    default: true,
  },
});

const { $faker } = useNuxtApp();

const route = useRoute();
const { full } = route.query;
let { language } = route.params;
if (!language) {
  language = "en";
}

const url = computed(() => {
  const arr = route.path.split("/");
  return arr.slice(arr.length === 4 ? 2 : 1).join("/");
});

const setHead = (route) => {
  useHead({
    titleTemplate: `[${curLang.value.icon} ${curLang.value.desc}] ${route.path
      .replace("/" + route.params.language, "")
      .replace("/", "")} - ${curLang.value.title}`,
  });
};

const curLang = ref();
const langs = [
  {
    icon: "🇨🇳",
    text: "zh_CN",
    desc: "中文",
    title:
      "多主题、语言切换、在线预览模板，所有模板基于tailwindcss、daisy ui。",
  },
  {
    icon: "🇺🇸",
    text: "en",
    desc: "english",
    title:
      "Multiple themes, language switching, online preview templates, all templates are based on tailwindcss, daisy ui.",
  },
  {
    icon: "🇯🇵",
    text: "ja",
    desc: "ジャパン",
    title:
      "複数のテーマ、言語の切り替え、オンラインプレビューテンプレート、すべてのテンプレートは、tailwindcss、デイジーUIに基づいています。",
  },
  {
    icon: "🇰🇷",
    text: "ko",
    desc: "한국어",
    title:
      "여러 테마, 언어 전환, 온라인 미리보기 템플릿, 모든 템플릿은 tailwindcss, 데이지 UI를 기반으로 합니다.",
  },
];

const setCurLang = (language) => {
  curLang.value = langs.filter((item) => item.text === language)[0];
};

const { copy } = useClipboard();
const onCopy = async () => {
  const el = document.getElementById("template-wrapper");

  await copy(createHtml(el.innerHTML));
  alert("复制成功，只需要粘贴到任意一个html文件中，即可完美复刻！");
};

const setLocale = (language) => {
  const arr = language.split("_");
  if (arr[1]) {
    arr[1] = arr[1].toLocaleUpperCase();
  }

  $faker.setLocale(arr.join("_"));
};

setLocale(language);
setCurLang(language);
setHead(route);

watch(route, (val) => {
  const la = val.params.language || "en";
  setLocale(la);
  setCurLang(la);
  setHead(val);
});

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
