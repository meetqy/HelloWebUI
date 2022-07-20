<template>
  <nuxt-layout daisyui>
    <div
      class="p-4 max-w-md w-full bg-base-100 rounded-lg border shadow-md sm:p-8"
    >
      <h5 class="mb-4 text-xl font-medium text-base-content text-opacity-50">
        Standard plan
      </h5>
      <div class="flex items-baseline text-base-content text-opacity-90">
        <span class="text-3xl font-semibold">$</span>
        <span class="text-5xl font-extrabold tracking-tight">49</span>
        <span class="ml-1 text-xl font-normal text-base-content text-opacity-50"
          >/month</span
        >
      </div>
      <!-- List -->
      <ul role="list" class="my-7 space-y-5">
        <li class="flex space-x-3">
          <!-- Icon -->
          <svg
            class="flex-shrink-0 w-5 h-5 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span
            class="text-base font-normal leading-tight text-base-content text-opacity-50"
            >2 team members</span
          >
        </li>
        <li class="flex space-x-3">
          <!-- Icon -->
          <svg
            class="flex-shrink-0 w-5 h-5 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span
            class="text-base font-normal leading-tight text-base-content text-opacity-50"
            >20GB Cloud storage</span
          >
        </li>
        <li class="flex space-x-3">
          <!-- Icon -->
          <svg
            class="flex-shrink-0 w-5 h-5 text-primary"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span
            class="text-base font-normal leading-tight text-base-content text-opacity-50"
            >Integration help</span
          >
        </li>
        <li
          class="flex space-x-3 line-through decoration-base-content decoration-opacity-50"
        >
          <!-- Icon -->
          <svg
            class="flex-shrink-0 w-5 h-5 text-base-content text-opacity-40"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span
            class="text-base font-normal leading-tight text-base-content text-opacity-50"
            >Sketch Files</span
          >
        </li>
        <li
          class="flex space-x-3 line-through decoration-base-content decoration-opacity-50"
        >
          <!-- Icon -->
          <svg
            class="flex-shrink-0 w-5 h-5 text-base-content text-opacity-40"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span
            class="text-base font-normal leading-tight text-base-content text-opacity-50"
            >API Access</span
          >
        </li>
        <li
          class="flex space-x-3 line-through decoration-base-content decoration-opacity-50"
        >
          <!-- Icon -->
          <svg
            class="flex-shrink-0 w-5 h-5 text-base-content text-opacity-40"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span
            class="text-base font-normal leading-tight text-base-content text-opacity-50"
            >Complete documentation</span
          >
        </li>
        <li
          class="flex space-x-3 line-through decoration-base-content decoration-opacity-50"
        >
          <!-- Icon -->
          <svg
            class="flex-shrink-0 w-5 h-5 text-base-content text-opacity-40"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            ></path>
          </svg>
          <span
            class="text-base font-normal leading-tight text-base-content text-opacity-50"
            >24×7 phone &amp; email support</span
          >
        </li>
      </ul>
      <button type="button" class="btn capitalize btn-primary">
        Choose plan
      </button>
    </div>
  </nuxt-layout>
</template>
