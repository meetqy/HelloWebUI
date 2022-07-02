export const createHtml = (str: string) => {
  return `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link
        href="https://cdn.jsdelivr.net/npm/daisyui@2.17.0/dist/full.css"
        rel="stylesheet"
        type="text/css"
      />
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body>
      <!-- 更多响应式多主题模板: https://wcao.cc -->
      <!-- 切换主题: <body data-theme='dark'> -->
      <!-- 可用主题列表: https://daisyui.com/docs/themes/ -->
      ${str}
    </body>
  </html>  
`;
};
