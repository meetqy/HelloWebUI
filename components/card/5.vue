<template>
  <a
    href="#"
    class="flex flex-col items-center bg-base-100 rounded-lg border shadow-md md:flex-row md:max-w-xl hover:bg-base-200"
  >
    <img
      class="object-cover mt-4 sm:mt-0 w-full h-96 rounded-t-lg md:h-auto md:w-48 md:rounded-none md:rounded-l-lg"
      src="https://wcao.cc/image-space/api/ultraman-card?xxx"
      alt=""
    />
    <div class="flex flex-col justify-between p-4 leading-normal">
      <h5 class="mb-2 text-2xl font-bold tracking-tight text-base-content">
        {{ $faker.commerce.productName() }}
      </h5>
      <p class="mb-3 font-normal text-base-content text-opacity-80">
        {{ $faker.commerce.productDescription() }}
      </p>
    </div>
  </a>
</template>
