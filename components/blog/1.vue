<template>
  <section class="bg-base-200 text-base-content w-full">
    <div class="container max-w-6xl p-6 mx-auto space-y-6 sm:space-y-12">
      <a
        href="#"
        class="block max-w-sm gap-3 mx-auto sm:max-w-full lg:grid lg:grid-cols-12 bg-base-100 rounded overflow-hidden shadow"
      >
        <img
          src="https://wcao.cc/r/a/animal?7"
          alt=""
          class="object-cover w-full h-64 rounded-l sm:h-96 lg:col-span-7 bg-base-300 overflow-hidden"
        />
        <div class="p-6 space-y-2 lg:col-span-5">
          <h3 class="text-2xl font-semibold sm:text-4xl">
            {{ $faker.commerce.productName() }}
          </h3>
          <span class="text-xs text-base-content text-opacity-50">{{
            $Random.datetime("yyyy-MM-dd")
          }}</span>
          <p class="text-base-content/70 overflow-hidden">
            {{ $faker.commerce.productDescription() }}
          </p>
        </div>
      </a>
      <div
        class="grid justify-center grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <a
          v-for="item in 6"
          href="#"
          class="max-w-sm mx-auto bg-base-100 shadow overflow-hidden rounded"
        >
          <img
            role="presentation"
            class="object-cover w-full rounded-t h-44 bg-base-300"
            :src="`https://wcao.cc/r/a/animal?${item}`"
          />
          <div class="p-6 space-y-2">
            <h3 class="text-2xl font-semibold">
              {{ $faker.commerce.productName() }}
            </h3>
            <span class="text-xs text-base-content text-opacity-50">
              {{ $Random.datetime("yyyy-MM-dd") }}
            </span>
            <p class="text-base-content/70">
              {{ $faker.commerce.productDescription() }}
            </p>
          </div>
        </a>
      </div>
      <div class="flex justify-center">
        <button
          type="button"
          class="btn btn-ghost normal-case font-light btn-sm text-base-content/50"
        >
          {{ locales[language][0] }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
const { language } = useParams();

const locales = {
  en: ["Load more posts..."],
  zh_CN: ["加载更多..."],
  ja: ["さらに投稿を読み込む..."],
  ko: ["더 많은 게시물 로드..."],
};
</script>
