<template>
  <div class="bg-base-200 w-full py-12">
    <div class="mx-auto container prose px-4 lg:px-0">
      <h1
        class="text-center text-3xl lg:text-5xl tracking-wider text-base-content text-opacity-90"
      >
        {{ locales[language][0] }}
      </h1>

      <div class="mt-12 lg:mt-24">
        <div
          v-for="n in 3"
          class="grid mb-12 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-8 overflow-hidden"
        >
          <div :class="n % 2 === 0 ? 'order-2' : 'order-1'">
            <img
              role="img"
              class="w-full rounded-t-box"
              :src="`https://wcao.cc/r/a/animal?${n}`"
            />
            <div class="py-4 px-8 w-full flex justify-between bg-primary">
              <p class="text-sm text-base-100 font-semibold tracking-wide">
                {{ $faker.name.findName() }}
              </p>
              <p class="text-sm text-base-100 font-semibold tracking-wide">
                {{ $Mock.mock("@datetime(yyyy-MM-dd)") }}
              </p>
            </div>
            <div class="bg-base-100 lg:px-10 px-4 lg:py-6 py-4 rounded-b-box">
              <h1
                class="lg:text-4xl text-base-content text-opacity-90 font-semibold tracking-wider"
              >
                {{ $faker.commerce.productName() }}
              </h1>
              <p
                class="text-base-content text-opacity-70 text-base lg:text-lg lg:leading-8 tracking-wide mt-6 lg:line-clamp-none line-clamp-3"
              >
                {{ $faker.commerce.productDescription() }}
                {{ $faker.commerce.productDescription() }}
                {{ $faker.commerce.productDescription() }}
                {{ $faker.commerce.productDescription() }}
              </p>

              <div class="w-full flex justify-end">
                <button
                  class="btn capitalize btn-primary btn-sm btn-link mt-10"
                >
                  <span class="text-base tracking-wide font-light mr-2">
                    Read more
                  </span>
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
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div
            class="grid lg:grid-cols-2 grid-rows-2 gap-8 grid-cols-1"
            :class="n % 2 === 0 ? 'order-1' : 'order-2'"
          >
            <div
              v-for="item in 4"
              class="rounded-box overflow-hidden bg-base-100 shadow"
            >
              <img
                class="w-full max-h-52"
                :src="`https://wcao.cc/r/a/animal?${item * n}`"
              />
              <div class="py-2 px-4 w-full flex justify-between bg-primary">
                <p class="text-sm text-base-100 font-semibold tracking-wide">
                  {{ $faker.name.findName() }}
                </p>
                <p class="text-sm text-base-100 font-semibold tracking-wide">
                  {{ $Mock.mock("@datetime(yyyy-MM-dd)") }}
                </p>
              </div>
              <div class="bg-base-100 px-3 lg:px-6 py-4">
                <h1
                  class="text-lg text-base-content text-opacity-90 font-semibold tracking-wider"
                >
                  {{ $faker.commerce.productName() }}
                </h1>
                <p
                  class="text-base-content line-clamp-3 text-opacity-70 text-sm lg:text-base lg:leading-8 pr-4 tracking-wide mt-2"
                >
                  {{ $faker.commerce.productDescription() }}...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const { language } = useParams();

const locales = {
  en: ["Welcome to my Blog."],
  zh_CN: ["欢迎来到我的博客。"],
  ja: ["私のブログへようこそ。"],
  ko: ["내 블로그에 오신 것을 환영합니다."],
};
</script>
