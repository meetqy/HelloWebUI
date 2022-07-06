<template>
  <div class="max-w-md bg-base-100 rounded-lg shadow-md">
    <a href="#" class="flex justify-center">
      <img
        class="rounded-t-lg w-full"
        src="https://wcao.cc/r/a/iwatch"
        alt="product image"
      />
    </a>
    <div class="px-5 pb-5 mt-8">
      <a href="#">
        <h5
          class="text-xl font-semibold tracking-tight text-base-content text-opacity-90"
        >
          Apple Watch Series 7 GPS {{ $faker.commerce.productName() }}
        </h5>
      </a>
      <div class="flex items-center mt-2.5 mb-5">
        <div class="rating">
          <input
            type="radio"
            name="rating-2"
            class="mask mask-star-2 bg-warning"
          />
          <input
            type="radio"
            name="rating-2"
            class="mask mask-star-2 bg-warning"
            checked
          />
          <input
            type="radio"
            name="rating-2"
            class="mask mask-star-2 bg-warning"
          />
          <input
            type="radio"
            name="rating-2"
            class="mask mask-star-2 bg-warning"
          />
          <input
            type="radio"
            name="rating-2"
            class="mask mask-star-2 bg-warning"
          />
        </div>
        <span class="badge badge-info ml-3"> 2.0 </span>
      </div>
      <div class="flex justify-between items-center">
        <span class="text-3xl font-bold text-base-content text-opacity-90">
          {{ language === "zh_CN" ? "￥" : "$" }}{{ $faker.commerce.price() }}
        </span>
        <a href="#" class="btn btn-primary capitalize">
          {{ $faker.word.verb() }}
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
const { language } = useRoute().params;
</script>
