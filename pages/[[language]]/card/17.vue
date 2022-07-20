<template>
  <nuxt-layout daisyui lang>
    <article
      class="mb-4 break-inside rounded-xl bg-base-100 flex flex-col bg-clip-border max-w-xl"
    >
      <div class="flex p-6 items-center justify-between">
        <div class="flex">
          <a class="inline-block mr-4" href="#">
            <img
              class="rounded-full max-w-none w-14 h-14"
              src="https://wcao.cc/r/a/avatar"
            />
          </a>
          <div class="flex flex-col">
            <div class="flex items-center">
              <a class="inline-block text-lg font-bold mr-2" href="#">
                {{ $faker.name.findName() }}
              </a>
              <span class="text-accent-focus text-opacity-50">
                {{ $Random.natural(1, 59) }} {{ locales[language][0] }}
              </span>
            </div>
            <div class="text-accent-focus text-opacity-50">
              {{ $faker.name.jobType() }}
            </div>
          </div>
        </div>
      </div>
      <div class="p-6 bg-primary bg-opacity-50">
        <h2 class="text-3xl font-extrabold text-base-100">
          {{ $faker.commerce.productDescription() }}
        </h2>
      </div>
      <div class="p-6">
        <div class="flex justify-between items-center">
          <a class="inline-flex items-center" href="#">
            <span class="-m-1 rounded-full border-2 border-base-100">
              <img class="w-6" src="https://wcao.cc/r/a/emoji" />
            </span>
            <span class="-m-1 rounded-full border-2 border-base-100">
              <img class="w-6" src="https://wcao.cc/r/a/emoji?12" />
            </span>
            <span class="-m-1 rounded-full border-2 border-base-100">
              <img class="w-6" src="https://wcao.cc/r/a/emoji?13" />
            </span>
            <span class="text-lg font-bold ml-3">
              {{ $Random.natural(10, 999) }}
            </span>
          </a>
          <a class="ml-auto" href="#">
            {{ $Random.natural(1, 99) }} {{ locales[language][1] }}
          </a>
        </div>
        <div class="mt-6 mb-6 h-px bg-accent-focus bg-opacity-20"></div>
        <div class="flex items-center justify-between mb-6">
          <button class="btn capitalize btn-ghost">
            {{ locales[language][2] }}
          </button>
          <button class="btn capitalize btn-ghost">
            {{ locales[language][3] }}
          </button>
          <button class="btn capitalize btn-ghost">
            {{ locales[language][4] }}
          </button>
        </div>
        <div class="relative">
          <input
            class="input w-full input-md bg-accent-content bg-opacity-10"
            type="text"
            :placeholder="locales[language][5]"
          />
          <span class="flex absolute right-3 top-2/4 -mt-3 items-center">
            <svg
              class="mr-2"
              style="width: 26px; height: 26px"
              viewBox="0 0 24 24"
            >
              <path
                fill="currentColor"
                d="M20,12A8,8 0 0,0 12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12M22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2A10,10 0 0,1 22,12M10,9.5C10,10.3 9.3,11 8.5,11C7.7,11 7,10.3 7,9.5C7,8.7 7.7,8 8.5,8C9.3,8 10,8.7 10,9.5M17,9.5C17,10.3 16.3,11 15.5,11C14.7,11 14,10.3 14,9.5C14,8.7 14.7,8 15.5,8C16.3,8 17,8.7 17,9.5M12,17.23C10.25,17.23 8.71,16.5 7.81,15.42L9.23,14C9.68,14.72 10.75,15.23 12,15.23C13.25,15.23 14.32,14.72 14.77,14L16.19,15.42C15.29,16.5 13.75,17.23 12,17.23Z"
              ></path>
            </svg>
            <svg
              class="fill-primary"
              style="width: 24px; height: 24px"
              viewBox="0 0 24 24"
            >
              <path d="M2,21L23,12L2,3V10L17,12L2,14V21Z"></path>
            </svg>
          </span>
        </div>
      </div>
    </article>
  </nuxt-layout>
</template>
<script setup>
const { language } = useParams();

const locales = {
  en: [
    "minutes ago",
    "comentarios",
    "Me gusta",
    "Comentar",
    "Compartir",
    "Write a comment",
  ],
  zh_CN: ["分钟前", "评论", "我喜欢", "评论数", "比较器", "写评论"],
  ja: [
    "数分前",
    "コメンタリオス",
    "私グスタ",
    "コメンター",
    "コンパートメント",
    "コメントを書く",
  ],
  ko: ["몇분 전에", "논평", "나 구스타", "논평", "콤파르티르", "코멘트 쓰기"],
};
</script>
