<template>
  <nuxt-layout daisyui lang>
    <div
      class="relative max-w-md mx-auto md:max-w-2xl min-w-0 break-words bg-base-100 w-full mb-6 shadow-lg rounded-xl mt-16"
    >
      <div class="px-6">
        <div class="flex flex-wrap justify-center">
          <div class="w-full flex justify-center">
            <img
              src="https://wcao.cc/r/a/avatar"
              class="shadow-xl flex-shrink-0 w-36 h-36 -top-16 rounded-full align-middle border-none absolute"
            />
          </div>
          <div class="w-full text-center mt-20">
            <div class="flex justify-center lg:pt-4 pt-8 pb-0">
              <div class="p-3 text-center">
                <span
                  class="text-xl font-bold block uppercase tracking-wide text-base-content text-opacity-70"
                >
                  {{ $faker.random.numeric(3) }}
                </span>
                <span class="text-sm text-base-content text-opacity-40">
                  {{ locales[language][0] }}
                </span>
              </div>
              <div class="p-3 text-center">
                <span
                  class="text-xl font-bold block uppercase tracking-wide text-base-content text-opacity-70"
                >
                  {{ $faker.random.numeric(3) }}
                </span>
                <span class="text-sm text-base-content text-opacity-40">
                  {{ locales[language][1] }}
                </span>
              </div>

              <div class="p-3 text-center">
                <span
                  class="text-xl font-bold block uppercase tracking-wide text-base-content text-opacity-70"
                >
                  {{ $faker.random.numeric(2) }}
                </span>
                <span class="text-sm text-base-content text-opacity-40">
                  {{ locales[language][2] }}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="text-center mt-2">
          <h3
            class="text-2xl text-base-content text-opacity-70 font-bold leading-normal mb-1"
          >
            {{ $faker.name.findName() }}
          </h3>
          <div
            class="text-xs mt-0 mb-2 text-base-content text-opacity-40 font-bold uppercase"
          >
            <i
              class="fas fa-map-marker-alt mr-2 text-base-content text-opacity-40 opacity-75"
            >
            </i>
            {{ $faker.word.adverb() }},{{ $faker.word.verb() }}
          </div>
        </div>
        <div
          class="mt-6 py-6 border-t border-base-content border-opacity-20 text-center"
        >
          <div class="flex flex-wrap justify-center">
            <div class="w-full px-4">
              <p
                class="font-light leading-relaxed text-base-content text-opacity-60 mb-4"
              >
                {{ $faker.commerce.productDescription() }}
              </p>
              <a href="javascript:;" class="btn">{{ locales[language][3] }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nuxt-layout>
</template>

<script setup>
const { language } = useParams();

const locales = {
  en: ["Photos", "Followers", "Following", "follow account"],
  zh_CN: ["相册", "关注我的", "我关注的", "关注我"],
  ja: ["写真", "フォロワー", "フォロー", "アカウントをフォロー"],
  ko: ["사진", "팔로워", "팔로잉", "계정 팔로우"],
};
</script>
