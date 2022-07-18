<template>
  <section class="bg-base-100 w-full">
    <div class="container pr-6 lg:pl-0 pl-6 py-8 mx-auto">
      <div class="lg:flex">
        <div class="dropdown lg:w-64 w-full mr-8 inline-block lg:dropdown-open">
          <label tabindex="0" class="btn btn-square lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              class="inline-block w-5 h-5 stroke-current"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              ></path>
            </svg>
          </label>

          <ul
            class="dropdown-content bg-base-100 !z-[9999] shadow lg:shadow-none menu w-full rounded-box lg:rounded-none"
          >
            <li v-for="(item, i) in navs" :key="i">
              <a
                :class="{ 'active capitalize': cur == i }"
                @click.stop="cur = i"
                href="javascript:;"
              >
                {{ item }}
              </a>
            </li>
          </ul>
        </div>

        <div class="mt-6 lg:mt-0 lg:px-2 lg:w-4/5">
          <div
            class="flex items-center justify-between text-sm tracking-widest uppercase"
          >
            <p class="text-base-content text-opacity-50">
              {{ locales[language][0] }}
            </p>
            <div class="flex items-center">
              <p class="text-base-content text-opacity-50">
                {{ locales[language][1] }}
              </p>
              <select
                class="font-medium ml-2 capitalize text-base-content text-opacity-70 bg-transparent focus:outline-none"
              >
                <option value="#">{{ locales[language][2] }}</option>
                <option value="#">{{ locales[language][3] }}</option>
                <option value="#">{{ locales[language][4] }}</option>
              </select>
            </div>
          </div>

          <div
            class="grid grid-cols-1 gap-8 mt-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            <div
              v-for="item in 8"
              class="flex flex-col items-center justify-center w-full max-w-lg mx-auto"
            >
              <img
                class="object-cover w-full rounded-md h-72 xl:h-80"
                :src="`https://p.wcao.cc/w500?${item}`"
                alt="T-Shirt"
              />
              <h4
                class="mt-2 text-lg font-medium text-base-content text-opacity-70 uppercase"
              >
                {{ $faker.word.noun() }}
              </h4>
              <p class="text-primary my-2">${{ $faker.commerce.price() }}</p>

              <button class="btn capitalize btn-primary btn-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  class="w-5 h-5 mx-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
                  />
                </svg>
                <span>{{ locales[language][5] }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const { $faker } = useNuxtApp();
const { language } = useParams();

const navs = ref(Array.from(new Array(8)).map(() => `${$faker.word.verb()}`));

const cur = ref(1);

const locales = {
  en: ["8 items", "sort", "recommended", "size", "price", "Add to cart"],
  zh_CN: ["共8个", "排序", "推荐", "尺寸", "价格", "加入购物车"],
  ja: ["8アイテム", "選別", "おすすめされた", "サイズ", "価格", "カートに追加"],
  ko: ["8개 항목", "종류", "추천", "크기", "가격", "장바구니에 추가"],
};
</script>
