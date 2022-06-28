<template>
  <div class="max-w-2xl px-8 py-4 mx-auto bg-base-100 rounded-lg shadow-md">
    <div class="flex items-center justify-between">
      <span class="text-sm font-light text-base-content text-opacity-60">
        {{
          useLanguage(
            {
              en: "Mar 10, 2019",
              zh: "2019年5月10日",
            },
            $route
          )
        }}
      </span>
      <a class="btn btn-primary btn-sm">{{
        useLanguage(
          {
            en: $Random.title(1, 2),
            zh: $Random.cword(2, 4),
          },
          $route
        )
      }}</a>
    </div>

    <div class="mt-2">
      <a
        href="#"
        class="text-2xl font-bold text-base-content text-opacity-70 hover:underline"
      >
        {{
          useLanguage(
            {
              en: $Random.title(),
              zh: $Random.cparagraph(1),
            },
            $route
          )
        }}
      </a>
      <p class="mt-2 text-base-content text-opacity-60">
        {{
          useLanguage(
            {
              en: $Random.paragraph(1, 5),
              zh: $Random.cparagraph(1, 5),
            },
            $route
          )
        }}
      </p>
    </div>

    <div class="flex items-center justify-between mt-4">
      <a href="#" class="btn btn-link hover:underline capitalize">
        {{
          useLanguage(
            {
              en: "read more",
              zh: "阅读更多",
            },
            $route
          )
        }}
      </a>

      <div class="flex items-center">
        <img
          class="hidden object-cover w-10 h-10 mx-4 rounded-full sm:block"
          src="https://wcao.cc/image-space/api/avatar?xxx "
          alt="avatar"
        />
        <a class="font-bold text-base-content text-opacity-70 cursor-pointer">
          {{
            useLanguage(
              {
                en: $Random.name(),
                zh: $Random.cname(),
              },
              $route
            )
          }}
        </a>
      </div>
    </div>
  </div>
</template>
