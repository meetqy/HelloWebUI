<template>
  <nuxt-layout daisyui lang>
    <section class="text-base-content text-opacity-60 bg-base-100">
      <div class="container px-5 py-24 mx-auto">
        <div class="flex flex-col text-center w-full mb-20">
          <h2 class="text-xs text-primary tracking-widest font-medium mb-1">
            {{ $faker.commerce.productMaterial() }}
          </h2>
          <h1
            class="sm:text-3xl text-2xl font-medium mb-4 text-base-content text-opacity-90"
          >
            {{ $faker.commerce.productName() }}
          </h1>
          <p class="lg:w-2/3 mx-auto leading-relaxed text-base">
            {{ $faker.commerce.productDescription() }}.
            {{ $faker.commerce.productDescription() }}.
            {{ $faker.commerce.productDescription() }}.
          </p>
        </div>

        <div class="flex flex-wrap">
          <div
            v-for="item in 4"
            class="xl:w-1/4 lg:w-1/2 md:w-full px-8 py-6 border-l border-base-content border-opacity-20"
          >
            <h2
              class="text-lg sm:text-xl text-base-content text-opacity-90 font-medium mb-2"
            >
              {{ $faker.commerce.productName() }}
            </h2>
            <p class="leading-relaxed text-base mb-4">
              {{ $faker.commerce.productDescription() }}
            </p>
            <a class="text-primary inline-flex items-center">
              {{ $faker.word.adverb() }}
              <svg
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                class="w-4 h-4 ml-2"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>

        <div class="flex justify-center mt-16">
          <button class="btn capitalize btn-primary">
            {{ $faker.word.preposition() }}
          </button>
        </div>
      </div>
    </section>
  </nuxt-layout>
</template>
