<template>
  <div
    class="p-4 w-full rounded-box max-w-md bg-base-100 border border-base-200 shadow-md sm:p-6 lg:p-8"
  >
    <form class="space-y-6" action="#">
      <h5 class="text-xl font-medium text-base-content">
        {{ locales[language].a }}
      </h5>
      <div>
        <label
          for="email"
          class="block mb-2 text-sm font-medium text-base-content"
        >
          {{ locales[language].b }}
        </label>
        <input
          type="email"
          name="email"
          id="email"
          class="input input-bordered w-full"
          placeholder="name@company.com"
          required
        />
      </div>
      <div>
        <label
          for="password"
          class="block mb-2 text-sm font-medium text-base-content"
        >
          {{ locales[language].c }}
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
            {{ locales[language].d }}
          </label>
        </div>
        <a href="#" class="btn btn-link btn-xs capitalize">{{
          locales[language].e
        }}</a>
      </div>
      <button type="submit" class="btn btn-primary w-full capitalize">
        {{ locales[language].f }}
      </button>
      <div class="text-sm font-medium text-base-content text-opacity-70">
        {{ locales[language].g }}
        <a href="#" class="btn btn-link btn-xs capitalize">{{
          locales[language].h
        }}</a>
      </div>
    </form>
  </div>
</template>

<script setup>
const { language } = useRoute().params;

const locales = {
  en: {
    a: "Sign in to our platform",
    b: "Your email",
    c: "Your password",
    d: "Remember me",
    e: "Lost Password?",
    f: "Login to your account",
    g: "Not registered?",
    h: "Create account",
  },
  zh_CN: {
    a: "登录我们的平台",
    b: "您的邮箱",
    c: "您的密码",
    d: "记住我",
    e: "忘记密码？",
    f: "登录您的账户",
    g: "没有注册？",
    h: "创建账户",
  },
  ja: {
    a: "プラットフォームにサインイン",
    b: "あなたのメール",
    c: "あなたのパスワード",
    d: "私を覚えている",
    e: "パスワードを紛失しましたか？",
    f: "アカウントにログイン",
    g: "登録されていませんか？",
    h: "アカウントの作成",
  },
  ko: {
    a: "플랫폼에 로그인",
    b: "귀하의 이메일",
    c: "비밀번호",
    d: "나를 기억해",
    e: "비밀번호를 분실하셨습니까?",
    f: "계정에 로그인",
    g: "등록되지 않았습니까?",
    h: "계정 만들기",
  },
};
</script>
