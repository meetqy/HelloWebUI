<template>
  <div class="max-w-2xl px-8 py-4 mx-auto bg-base-100 rounded-lg shadow-md">
    <div class="flex items-center justify-between">
      <span class="text-sm font-light text-base-content text-opacity-60">
        {{ $faker.date.month() }}
      </span>
      <a class="btn btn-primary btn-sm">{{ $faker.hacker.verb() }}</a>
    </div>

    <div class="mt-2">
      <a
        href="#"
        class="text-2xl font-bold text-base-content text-opacity-70 hover:underline"
      >
        {{ $faker.commerce.productName() }}
      </a>
      <p class="mt-2 text-base-content text-opacity-60">
        {{ $faker.commerce.productDescription() }}
      </p>
    </div>

    <div class="flex items-center justify-between mt-4">
      <a href="#" class="btn btn-link hover:underline capitalize">
        {{ $faker.hacker.verb() }}
      </a>

      <div class="flex items-center">
        <img
          class="hidden object-cover w-10 h-10 mx-4 rounded-full sm:block"
          src="https://wcao.cc/image-space/api/avatar?xxx "
          alt="avatar"
        />
        <a class="font-bold text-base-content text-opacity-70 cursor-pointer">
          {{ $faker.name.findName() }}
        </a>
      </div>
    </div>
  </div>
</template>
