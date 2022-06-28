<template>
  <div class="max-w-sm bg-base-100 rounded-lg border border-base-200 shadow-md">
    <a href="#">
      <div class="h-64 w-full overflow-hidden">
        <img
          class="rounded-t-lg"
          src="https://wcao.cc/image-space/api/girls?xxx"
          alt=""
        />
      </div>
    </a>
    <div class="p-5">
      <a href="#">
        <h5 class="mb-2 text-2xl font-bold tracking-tight text-base-content">
          {{
            useLanguage(
              { en: $Random.title(), zh: $Random.cparagraph(1) },
              $route
            )
          }}
        </h5>
      </a>
      <p class="mb-3 font-normal text-base-content text-opacity-80">
        {{
          useLanguage(
            { en: $Random.paragraph(1, 3), zh: $Random.cparagraph(1, 3) },
            $route
          )
        }}
      </p>
      <a
        href="#"
        class="inline-flex items-center py-2 px-3 text-sm font-medium text-center btn btn-primary capitalize"
      >
        {{
          useLanguage(
            { en: $Random.title(2, 3), zh: $Random.cword(2, 4) },
            $route
          )
        }}
        <svg
          class="ml-2 -mr-1 w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
            clip-rule="evenodd"
          ></path>
        </svg>
      </a>
    </div>
  </div>
</template>
