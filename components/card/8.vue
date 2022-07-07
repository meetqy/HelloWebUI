<template>
  <div
    class="p-4 w-full text-center bg-base-100 rounded-lg border shadow-md sm:p-8 max-w-xl"
  >
    <h5 class="mb-2 text-3xl font-bold text-base-content text-opacity-90">
      {{ locales[language][0] }}
    </h5>
    <p class="mb-5 text-base text-base-content text-opacity-50 sm:text-lg">
      {{ locales[language][1] }}
    </p>
    <div
      class="justify-center items-center space-y-4 sm:flex sm:space-y-0 sm:space-x-4"
    >
      <a href="#" class="btn capitalize btn-primary">
        <svg
          class="mr-3 w-7 h-7"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="apple"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 384 512"
        >
          <path
            fill="currentColor"
            d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
          ></path>
        </svg>
        <div class="text-left">
          <div class="mb-1 text-xs">{{ locales[language][2] }}</div>
          <div class="-mt-1 font-sans text-sm font-semibold">
            {{ locales[language][3] }}
          </div>
        </div>
      </a>
      <a href="#" class="btn capitalize btn-primary">
        <svg
          class="mr-3 w-7 h-7"
          aria-hidden="true"
          focusable="false"
          data-prefix="fab"
          data-icon="google-play"
          role="img"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
        >
          <path
            fill="currentColor"
            d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"
          ></path>
        </svg>
        <div class="text-left">
          <div class="mb-1 text-xs">{{ locales[language][4] }}</div>
          <div class="-mt-1 font-sans text-sm font-semibold">
            {{ locales[language][5] }}
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup>
const { language = "zh_CN" } = useRoute().params;

const locales = {
  en: [
    "Work fast from anywhere",
    "Stay up to date and move work forward with Flowbite on iOS & Android. Download the app today.",
    "Download on the",
    "Mac App Store",
    "Get in on",
    "Google Play",
  ],
  zh_CN: [
    "随时随地快速工作",
    "在 iOS 和 Android 上使用 Flowbite 保持最新并继续工作。立即下载该应用程序。",
    "下载到",
    "Mac 应用商店",
    "下载到",
    "Google Play",
  ],
  ja: [
    "どこからでも速く仕事ができる",
    "最新情報を入手し、iOSとAndroidでFlowbiteを使用して作業を進めてください。今すぐアプリをダウンロードしてください。",
    "ダウンロード",
    "MacAppStore",
    "乗って",
    "グーグルプレイ",
  ],
  ko: [
    "어디서나 빠르게 작업",
    "최신 상태를 유지하고 iOS 및 Android에서 Flowbite로 작업을 진행하세요. 지금 앱을 다운로드하세요.",
    "에서 다운로드",
    "맥 앱스토어",
    "타세요",
    "구글 플레이",
  ],
};
</script>
