<template>
  <nuxt-layout daisyui lang>
    <div class="mx-auto max-w-lg">
      <div
        class="bg-base-100 rounded-lg p-6 text-base-content text-opacity-10 relative z-10"
        style="cursor: auto"
      >
        <div class="flex flex-wrap items-center">
          <div class="flex w-full h-48 md:h-64 lg:h-72 relative">
            <div class="w-8/12 pr-4 relative">
              <img
                src="https://p.wcao.cc/w300?1"
                class="w-full h-full object-cover object-top rounded-lg bg-base-100"
              />
            </div>

            <div class="w-4/12 h-full">
              <div class="flex flex-col w-full h-full">
                <div class="flex-1 pb-2">
                  <div class="w-full h-full relative">
                    <img
                      src="https://p.wcao.cc/w300?2"
                      class="absolute top-0 w-full h-full object-cover object-center rounded-lg bg-base-100"
                    />
                  </div>
                </div>

                <div class="flex-1 pt-2">
                  <div class="w-full h-full relative">
                    <img
                      src="https://p.wcao.cc/w300?3"
                      class="absolute top-0 w-full h-full object-cover object-bottom rounded-lg bg-base-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="w-full pt-8 flex flex-col justify-between">
            <div>
              <h2 class="font-bold text-xl text-base-content">
                {{ $faker.commerce.productName() }}
              </h2>

              <div class="flex flex-wrap text-center pt-4 mb-2">
                <div class="badge mr-2">
                  {{ $faker.word.verb() }}
                </div>
                <div class="badge mr-2">
                  {{ $faker.word.verb() }}
                </div>
                <div class="badge mr-2">
                  {{ $faker.word.verb() }}
                </div>
              </div>

              <p
                class="text-xs leading-relaxed text-base-content text-opacity-50"
              >
                {{ $faker.commerce.productDescription() }}
              </p>

              <ul
                class="text-xs mt-4 list-disc list-inside text-base-content text-opacity-50 leading-relaxed"
              >
                <li v-for="item in 4">
                  {{ $faker.commerce.productName() }}
                </li>
              </ul>
            </div>

            <div class="w-full sm:flex-1 grid gap-4 grid-cols-2 pt-6">
              <a
                href="javascript:;"
                class="btn capitalize text-base-content glass btn-info"
              >
                {{ $faker.word.adverb() }}
              </a>

              <button
                x-on:click="pay('Essential')"
                class="btn capitalize btn-success"
              >
                {{ $faker.word.adverb() }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </nuxt-layout>
</template>
