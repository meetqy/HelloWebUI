<template>
  <div
    class="p-4 w-full rounded-box max-w-md bg-base-100 border border-base-200 shadow-md sm:p-6 lg:p-8"
  >
    <form class="space-y-6" action="#">
      <h5 class="text-xl font-medium text-base-content">
        {{ locales[language][0] }}
      </h5>
      <div>
        <label
          for="email"
          class="block mb-2 text-sm font-medium text-base-content"
        >
          {{ locales[language][1] }}
        </label>
        <input
          type="email"
          name="email"
          id="email"
          class="input input-bordered w-full"
          placeholder="name@company[2]om"
          required
        />
      </div>
      <div>
        <label
          for="password"
          class="block mb-2 text-sm font-medium text-base-content"
        >
          {{ locales[language][2] }}
        </label>
        <input
          type="password"
          name="password"
          id="password"
          placeholder="••••••••"
          class="input input-bordered w-full"
          required
        />
      </div>
      <div class="flex items-start justify-between">
        <div class="flex items-start">
          <input
            id="remember"
            type="checkbox"
            value=""
            class="checkbox checkbox-sm rounded-box"
            required
          />
          <label
            for="remember"
            class="ml-2 text-sm font-medium text-base-content"
          >
            {{ locales[language][3] }}
          </label>
        </div>
        <a href="#" class="btn btn-link btn-xs capitalize">{{
          locales[language][4]
        }}</a>
      </div>
      <button type="submit" class="btn btn-primary w-full capitalize">
        {{ locales[language][5] }}
      </button>
      <div class="text-sm font-medium text-base-content text-opacity-70">
        {{ locales[language][6] }}
        <a href="#" class="btn btn-link btn-xs capitalize">{{
          locales[language][7]
        }}</a>
      </div>
    </form>
  </div>
</template>

<script setup>
const { language } = useRoute().params;

const locales = await getLocales("Card", 6);
</script>
