<template>
  <nuxt-layout lang daisyui>
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
  </nuxt-layout>
</template>

<script setup>
const { language } = useParams();

const locales = {
  en: [
    "Sign in to our platform",
    "Your email",
    "Your password",
    "Remember me",
    "Lost Password?",
    "Login to your account",
    "Not registered?",
    "Create account",
  ],
  zh_CN: [
    "登录我们的平台",
    "您的邮箱",
    "您的密码",
    "记住我",
    "忘记密码？",
    "登录您的账户",
    "没有注册？",
    "创建账户",
  ],
  ja: [
    "プラットフォームにサインイン",
    "あなたのメール",
    "あなたのパスワード",
    "私を覚えている",
    "パスワードを紛失しましたか？",
    "アカウントにログイン",
    "登録されていませんか？",
    "アカウントの作成",
  ],
  ko: [
    "플랫폼에 로그인",
    "귀하의 이메일",
    "비밀번호",
    "나를 기억해",
    "비밀번호를 분실하셨습니까?",
    "계정에 로그인",
    "등록되지 않았습니까?",
    "계정 만들기",
  ],
};
</script>
