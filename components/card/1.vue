<template>
  <nuxt-layout lang daisyui>
    <div class="bg-base-100 rounded-lg border border-base-200 shadow-md">
      <div class="flex justify-end px-4 pt-4">
        <button
          id="dropdownButton"
          data-dropdown-toggle="dropdown"
          class="btn btn-ghost"
          type="button"
        >
          <svg
            class="w-6 h-6"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"
            ></path>
          </svg>
        </button>
      </div>
      <div class="flex flex-col items-center pb-10 px-24">
        <img
          class="mb-3 w-24 h-24 rounded-full shadow-lg"
          src="https://wcao.cc/image-space/api/avatar"
          alt="Bonnie image"
        />
        <h5 class="mb-1 text-xl font-medium text-base-content text-opacity-90">
          {{ $faker.name.findName() }}
        </h5>
        <span class="text-sm text-base-content text-opacity-50 text-center">
          {{ $faker.name.jobTitle() }}
        </span>
        <div class="flex mt-4 space-x-3 lg:mt-6">
          <a href="#" class="btn btn-sm capitalize">{{ $faker.word.verb() }}</a>
          <a href="#" class="btn btn-outline btn-sm capitalize">{{
            $faker.word.verb()
          }}</a>
        </div>
      </div>
    </div>
  </nuxt-layout>
</template>
