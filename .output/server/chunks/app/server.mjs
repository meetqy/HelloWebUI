import { v as vue_cjs_prod, r as require$$0, s as serverRenderer } from '../handlers/renderer.mjs';
import { hasProtocol, isEqual, withBase, withQuery, joinURL } from 'ufo';
import { u as useRuntimeConfig$1 } from '../nitro/node-server.mjs';
import 'h3';
import 'unenv/runtime/mock/proxy';
import 'stream';
import 'node-fetch-native/polyfill';
import 'http';
import 'https';
import 'destr';
import 'ohmyfetch';
import 'radix3';
import 'unenv/runtime/fetch/index';
import 'hookable';
import 'scule';
import 'ohash';
import 'unstorage';
import 'fs';
import 'pathe';
import 'url';

const suspectProtoRx = /"(?:_|\\u005[Ff])(?:_|\\u005[Ff])(?:p|\\u0070)(?:r|\\u0072)(?:o|\\u006[Ff])(?:t|\\u0074)(?:o|\\u006[Ff])(?:_|\\u005[Ff])(?:_|\\u005[Ff])"\s*:/;
const suspectConstructorRx = /"(?:c|\\u0063)(?:o|\\u006[Ff])(?:n|\\u006[Ee])(?:s|\\u0073)(?:t|\\u0074)(?:r|\\u0072)(?:u|\\u0075)(?:c|\\u0063)(?:t|\\u0074)(?:o|\\u006[Ff])(?:r|\\u0072)"\s*:/;
const JsonSigRx = /^["{[]|^-?[0-9][0-9.]{0,14}$/;
function jsonParseTransform(key, value) {
  if (key === "__proto__" || key === "constructor") {
    return;
  }
  return value;
}
function destr(val) {
  if (typeof val !== "string") {
    return val;
  }
  const _lval = val.toLowerCase();
  if (_lval === "true") {
    return true;
  }
  if (_lval === "false") {
    return false;
  }
  if (_lval === "null") {
    return null;
  }
  if (_lval === "nan") {
    return NaN;
  }
  if (_lval === "infinity") {
    return Infinity;
  }
  if (_lval === "undefined") {
    return void 0;
  }
  if (!JsonSigRx.test(val)) {
    return val;
  }
  try {
    if (suspectProtoRx.test(val) || suspectConstructorRx.test(val)) {
      return JSON.parse(val, jsonParseTransform);
    }
    return JSON.parse(val);
  } catch (_e) {
    return val;
  }
}
class FetchError extends Error {
  constructor() {
    super(...arguments);
    this.name = "FetchError";
  }
}
function createFetchError(request, error, response) {
  let message = "";
  if (request && response) {
    message = `${response.status} ${response.statusText} (${request.toString()})`;
  }
  if (error) {
    message = `${error.message} (${message})`;
  }
  const fetchError = new FetchError(message);
  Object.defineProperty(fetchError, "request", { get() {
    return request;
  } });
  Object.defineProperty(fetchError, "response", { get() {
    return response;
  } });
  Object.defineProperty(fetchError, "data", { get() {
    return response && response._data;
  } });
  return fetchError;
}
const payloadMethods = new Set(Object.freeze(["PATCH", "POST", "PUT", "DELETE"]));
function isPayloadMethod(method = "GET") {
  return payloadMethods.has(method.toUpperCase());
}
function isJSONSerializable(val) {
  if (val === void 0) {
    return false;
  }
  const t = typeof val;
  if (t === "string" || t === "number" || t === "boolean" || t === null) {
    return true;
  }
  if (t !== "object") {
    return false;
  }
  if (Array.isArray(val)) {
    return true;
  }
  return val.constructor && val.constructor.name === "Object" || typeof val.toJSON === "function";
}
const textTypes = /* @__PURE__ */ new Set([
  "image/svg",
  "application/xml",
  "application/xhtml",
  "application/html"
]);
const JSON_RE = /^application\/(?:[\w!#$%&*`\-.^~]*\+)?json(;.+)?$/i;
function detectResponseType(_contentType = "") {
  if (!_contentType) {
    return "json";
  }
  const contentType = _contentType.split(";").shift();
  if (JSON_RE.test(contentType)) {
    return "json";
  }
  if (textTypes.has(contentType) || contentType.startsWith("text/")) {
    return "text";
  }
  return "blob";
}
const retryStatusCodes = /* @__PURE__ */ new Set([
  408,
  409,
  425,
  429,
  500,
  502,
  503,
  504
]);
function createFetch(globalOptions) {
  const { fetch: fetch2, Headers: Headers2 } = globalOptions;
  function onError(ctx) {
    if (ctx.options.retry !== false) {
      const retries = typeof ctx.options.retry === "number" ? ctx.options.retry : isPayloadMethod(ctx.options.method) ? 0 : 1;
      const responseCode = ctx.response && ctx.response.status || 500;
      if (retries > 0 && retryStatusCodes.has(responseCode)) {
        return $fetchRaw(ctx.request, {
          ...ctx.options,
          retry: retries - 1
        });
      }
    }
    const err = createFetchError(ctx.request, ctx.error, ctx.response);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(err, $fetchRaw);
    }
    throw err;
  }
  const $fetchRaw = async function $fetchRaw2(_request, _opts = {}) {
    const ctx = {
      request: _request,
      options: { ...globalOptions.defaults, ..._opts },
      response: void 0,
      error: void 0
    };
    if (ctx.options.onRequest) {
      await ctx.options.onRequest(ctx);
    }
    if (typeof ctx.request === "string") {
      if (ctx.options.baseURL) {
        ctx.request = withBase(ctx.request, ctx.options.baseURL);
      }
      if (ctx.options.params) {
        ctx.request = withQuery(ctx.request, ctx.options.params);
      }
      if (ctx.options.body && isPayloadMethod(ctx.options.method)) {
        if (isJSONSerializable(ctx.options.body)) {
          ctx.options.body = typeof ctx.options.body === "string" ? ctx.options.body : JSON.stringify(ctx.options.body);
          ctx.options.headers = new Headers2(ctx.options.headers);
          if (!ctx.options.headers.has("content-type")) {
            ctx.options.headers.set("content-type", "application/json");
          }
          if (!ctx.options.headers.has("accept")) {
            ctx.options.headers.set("accept", "application/json");
          }
        }
      }
    }
    ctx.response = await fetch2(ctx.request, ctx.options).catch(async (error) => {
      ctx.error = error;
      if (ctx.options.onRequestError) {
        await ctx.options.onRequestError(ctx);
      }
      return onError(ctx);
    });
    const responseType = (ctx.options.parseResponse ? "json" : ctx.options.responseType) || detectResponseType(ctx.response.headers.get("content-type") || "");
    if (responseType === "json") {
      const data = await ctx.response.text();
      const parseFn = ctx.options.parseResponse || destr;
      ctx.response._data = parseFn(data);
    } else {
      ctx.response._data = await ctx.response[responseType]();
    }
    if (ctx.options.onResponse) {
      await ctx.options.onResponse(ctx);
    }
    if (!ctx.response.ok) {
      if (ctx.options.onResponseError) {
        await ctx.options.onResponseError(ctx);
      }
    }
    return ctx.response.ok ? ctx.response : onError(ctx);
  };
  const $fetch2 = function $fetch22(request, opts) {
    return $fetchRaw(request, opts).then((r) => r._data);
  };
  $fetch2.raw = $fetchRaw;
  $fetch2.create = (defaultOptions = {}) => createFetch({
    ...globalOptions,
    defaults: {
      ...globalOptions.defaults,
      ...defaultOptions
    }
  });
  return $fetch2;
}
const _globalThis$2 = function() {
  if (typeof globalThis !== "undefined") {
    return globalThis;
  }
  if (typeof self !== "undefined") {
    return self;
  }
  if (typeof global !== "undefined") {
    return global;
  }
  throw new Error("unable to locate global object");
}();
const fetch = _globalThis$2.fetch || (() => Promise.reject(new Error("[ohmyfetch] global.fetch is not supported!")));
const Headers = _globalThis$2.Headers;
const $fetch = createFetch({ fetch, Headers });
const appConfig = useRuntimeConfig$1().app;
const baseURL = () => appConfig.baseURL;
function flatHooks(configHooks, hooks = {}, parentName) {
  for (const key in configHooks) {
    const subHook = configHooks[key];
    const name2 = parentName ? `${parentName}:${key}` : key;
    if (typeof subHook === "object" && subHook !== null) {
      flatHooks(subHook, hooks, name2);
    } else if (typeof subHook === "function") {
      hooks[name2] = subHook;
    }
  }
  return hooks;
}
function serialCaller(hooks, args) {
  return hooks.reduce((promise, hookFn) => promise.then(() => hookFn.apply(void 0, args)), Promise.resolve(null));
}
function parallelCaller(hooks, args) {
  return Promise.all(hooks.map((hook) => hook.apply(void 0, args)));
}
class Hookable {
  constructor() {
    this._hooks = {};
    this._deprecatedHooks = {};
    this.hook = this.hook.bind(this);
    this.callHook = this.callHook.bind(this);
    this.callHookWith = this.callHookWith.bind(this);
  }
  hook(name2, fn) {
    if (!name2 || typeof fn !== "function") {
      return () => {
      };
    }
    const originalName = name2;
    let deprecatedHookObj;
    while (this._deprecatedHooks[name2]) {
      const deprecatedHook = this._deprecatedHooks[name2];
      if (typeof deprecatedHook === "string") {
        deprecatedHookObj = { to: deprecatedHook };
      } else {
        deprecatedHookObj = deprecatedHook;
      }
      name2 = deprecatedHookObj.to;
    }
    if (deprecatedHookObj) {
      if (!deprecatedHookObj.message) {
        console.warn(`${originalName} hook has been deprecated` + (deprecatedHookObj.to ? `, please use ${deprecatedHookObj.to}` : ""));
      } else {
        console.warn(deprecatedHookObj.message);
      }
    }
    this._hooks[name2] = this._hooks[name2] || [];
    this._hooks[name2].push(fn);
    return () => {
      if (fn) {
        this.removeHook(name2, fn);
        fn = null;
      }
    };
  }
  hookOnce(name2, fn) {
    let _unreg;
    let _fn = (...args) => {
      _unreg();
      _unreg = null;
      _fn = null;
      return fn(...args);
    };
    _unreg = this.hook(name2, _fn);
    return _unreg;
  }
  removeHook(name2, fn) {
    if (this._hooks[name2]) {
      const idx = this._hooks[name2].indexOf(fn);
      if (idx !== -1) {
        this._hooks[name2].splice(idx, 1);
      }
      if (this._hooks[name2].length === 0) {
        delete this._hooks[name2];
      }
    }
  }
  deprecateHook(name2, deprecated2) {
    this._deprecatedHooks[name2] = deprecated2;
  }
  deprecateHooks(deprecatedHooks) {
    Object.assign(this._deprecatedHooks, deprecatedHooks);
  }
  addHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    const removeFns = Object.keys(hooks).map((key) => this.hook(key, hooks[key]));
    return () => {
      removeFns.splice(0, removeFns.length).forEach((unreg) => unreg());
    };
  }
  removeHooks(configHooks) {
    const hooks = flatHooks(configHooks);
    for (const key in hooks) {
      this.removeHook(key, hooks[key]);
    }
  }
  callHook(name2, ...args) {
    return serialCaller(this._hooks[name2] || [], args);
  }
  callHookParallel(name2, ...args) {
    return parallelCaller(this._hooks[name2] || [], args);
  }
  callHookWith(caller, name2, ...args) {
    return caller(this._hooks[name2] || [], args);
  }
}
function createHooks() {
  return new Hookable();
}
function createContext() {
  let currentInstance = null;
  let isSingleton = false;
  const checkConflict = (instance) => {
    if (currentInstance && currentInstance !== instance) {
      throw new Error("Context conflict");
    }
  };
  return {
    use: () => currentInstance,
    set: (instance, replace) => {
      if (!replace) {
        checkConflict(instance);
      }
      currentInstance = instance;
      isSingleton = true;
    },
    unset: () => {
      currentInstance = null;
      isSingleton = false;
    },
    call: (instance, cb) => {
      checkConflict(instance);
      currentInstance = instance;
      try {
        return cb();
      } finally {
        if (!isSingleton) {
          currentInstance = null;
        }
      }
    },
    async callAsync(instance, cb) {
      currentInstance = instance;
      const onRestore = () => {
        currentInstance = instance;
      };
      const onLeave = () => currentInstance === instance ? onRestore : void 0;
      asyncHandlers.add(onLeave);
      try {
        const r = cb();
        if (!isSingleton) {
          currentInstance = null;
        }
        return await r;
      } finally {
        asyncHandlers.delete(onLeave);
      }
    }
  };
}
function createNamespace() {
  const contexts = {};
  return {
    get(key) {
      if (!contexts[key]) {
        contexts[key] = createContext();
      }
      contexts[key];
      return contexts[key];
    }
  };
}
const _globalThis$1 = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof global !== "undefined" ? global : {};
const globalKey$1 = "__unctx__";
const defaultNamespace = _globalThis$1[globalKey$1] || (_globalThis$1[globalKey$1] = createNamespace());
const getContext = (key) => defaultNamespace.get(key);
const asyncHandlersKey = "__unctx_async_handlers__";
const asyncHandlers = _globalThis$1[asyncHandlersKey] || (_globalThis$1[asyncHandlersKey] = /* @__PURE__ */ new Set());
function createMock(name2, overrides = {}) {
  const fn = function() {
  };
  fn.prototype.name = name2;
  const props = {};
  return new Proxy(fn, {
    get(_target, prop) {
      if (prop === "caller") {
        return null;
      }
      if (prop === "__createMock__") {
        return createMock;
      }
      if (prop in overrides) {
        return overrides[prop];
      }
      return props[prop] = props[prop] || createMock(`${name2}.${prop.toString()}`);
    },
    apply(_target, _this, _args) {
      return createMock(`${name2}()`);
    },
    construct(_target, _args, _newT) {
      return createMock(`[${name2}]`);
    },
    enumerate(_target) {
      return [];
    }
  });
}
const mockContext = createMock("mock");
function mock(warning) {
  console.warn(warning);
  return mockContext;
}
const unsupported = /* @__PURE__ */ new Set([
  "store",
  "spa",
  "fetchCounters"
]);
const todo = /* @__PURE__ */ new Set([
  "isHMR",
  "base",
  "payload",
  "from",
  "next",
  "error",
  "redirect",
  "redirected",
  "enablePreview",
  "$preview",
  "beforeNuxtRender",
  "beforeSerialize"
]);
const routerKeys = ["route", "params", "query"];
const staticFlags = {
  isClient: false,
  isServer: true,
  isDev: false,
  isStatic: void 0,
  target: "server",
  modern: false
};
const legacyPlugin = (nuxtApp) => {
  nuxtApp._legacyContext = new Proxy(nuxtApp, {
    get(nuxt, p) {
      if (unsupported.has(p)) {
        return mock(`Accessing ${p} is not supported in Nuxt 3.`);
      }
      if (todo.has(p)) {
        return mock(`Accessing ${p} is not yet supported in Nuxt 3.`);
      }
      if (routerKeys.includes(p)) {
        if (!("$router" in nuxtApp)) {
          return mock("vue-router is not being used in this project.");
        }
        switch (p) {
          case "route":
            return nuxt.$router.currentRoute.value;
          case "params":
          case "query":
            return nuxt.$router.currentRoute.value[p];
        }
      }
      if (p === "$config" || p === "env") {
        return useRuntimeConfig();
      }
      if (p in staticFlags) {
        return staticFlags[p];
      }
      if (p === "ssrContext") {
        return nuxt._legacyContext;
      }
      if (nuxt.ssrContext && p in nuxt.ssrContext) {
        return nuxt.ssrContext[p];
      }
      if (p === "nuxt") {
        return nuxt.payload;
      }
      if (p === "nuxtState") {
        return nuxt.payload.data;
      }
      if (p in nuxtApp.vueApp) {
        return nuxtApp.vueApp[p];
      }
      if (p in nuxtApp) {
        return nuxtApp[p];
      }
      return mock(`Accessing ${p} is not supported in Nuxt3.`);
    }
  });
};
const nuxtAppCtx = getContext("nuxt-app");
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  const nuxtApp = {
    provide: void 0,
    globalName: "nuxt",
    payload: vue_cjs_prod.reactive({
      data: {},
      state: {},
      _errors: {},
      ...{ serverRendered: true }
    }),
    isHydrating: false,
    _asyncDataPromises: {},
    ...options
  };
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name2, value) => {
    const $name = "$" + name2;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  if (nuxtApp.ssrContext) {
    nuxtApp.ssrContext.nuxt = nuxtApp;
  }
  {
    nuxtApp.ssrContext = nuxtApp.ssrContext || {};
    nuxtApp.ssrContext.payload = nuxtApp.payload;
  }
  {
    nuxtApp.payload.config = {
      public: options.ssrContext.runtimeConfig.public,
      app: options.ssrContext.runtimeConfig.app
    };
  }
  const runtimeConfig = options.ssrContext.runtimeConfig;
  const compatibilityConfig = new Proxy(runtimeConfig, {
    get(target, prop) {
      var _a;
      if (prop === "public") {
        return target.public;
      }
      return (_a = target[prop]) != null ? _a : target.public[prop];
    },
    set(target, prop, value) {
      {
        return false;
      }
    }
  });
  nuxtApp.provide("config", compatibilityConfig);
  return nuxtApp;
}
async function applyPlugin(nuxtApp, plugin) {
  if (typeof plugin !== "function") {
    return;
  }
  const { provide: provide2 } = await callWithNuxt(nuxtApp, plugin, [nuxtApp]) || {};
  if (provide2 && typeof provide2 === "object") {
    for (const key in provide2) {
      nuxtApp.provide(key, provide2[key]);
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  for (const plugin of plugins2) {
    await applyPlugin(nuxtApp, plugin);
  }
}
function normalizePlugins(_plugins2) {
  let needsLegacyContext = false;
  const plugins2 = _plugins2.map((plugin) => {
    if (typeof plugin !== "function") {
      return () => {
      };
    }
    if (isLegacyPlugin(plugin)) {
      needsLegacyContext = true;
      return (nuxtApp) => plugin(nuxtApp._legacyContext, nuxtApp.provide);
    }
    return plugin;
  });
  if (needsLegacyContext) {
    plugins2.unshift(legacyPlugin);
  }
  return plugins2;
}
function defineNuxtPlugin(plugin) {
  plugin[NuxtPluginIndicator] = true;
  return plugin;
}
function isLegacyPlugin(plugin) {
  return !plugin[NuxtPluginIndicator];
}
function callWithNuxt(nuxt, setup, args) {
  const fn = () => args ? setup(...args) : setup();
  {
    return nuxtAppCtx.callAsync(nuxt, fn);
  }
}
function useNuxtApp() {
  const vm = vue_cjs_prod.getCurrentInstance();
  if (!vm) {
    const nuxtAppInstance = nuxtAppCtx.use();
    if (!nuxtAppInstance) {
      throw new Error("nuxt instance unavailable");
    }
    return nuxtAppInstance;
  }
  return vm.appContext.app.$nuxt;
}
function useRuntimeConfig() {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
var vueRouter_cjs_prod = {};
/*!
  * vue-router v4.0.16
  * (c) 2022 Eduardo San Martin Morote
  * @license MIT
  */
(function(exports) {
  Object.defineProperty(exports, "__esModule", { value: true });
  var vue = require$$0;
  const hasSymbol = typeof Symbol === "function" && typeof Symbol.toStringTag === "symbol";
  const PolySymbol = (name2) => hasSymbol ? Symbol(name2) : "_vr_" + name2;
  const matchedRouteKey = /* @__PURE__ */ PolySymbol("rvlm");
  const viewDepthKey = /* @__PURE__ */ PolySymbol("rvd");
  const routerKey = /* @__PURE__ */ PolySymbol("r");
  const routeLocationKey = /* @__PURE__ */ PolySymbol("rl");
  const routerViewLocationKey = /* @__PURE__ */ PolySymbol("rvl");
  function isESModule(obj) {
    return obj.__esModule || hasSymbol && obj[Symbol.toStringTag] === "Module";
  }
  const assign = Object.assign;
  function applyToParams(fn, params) {
    const newParams = {};
    for (const key in params) {
      const value = params[key];
      newParams[key] = Array.isArray(value) ? value.map(fn) : fn(value);
    }
    return newParams;
  }
  const noop2 = () => {
  };
  const TRAILING_SLASH_RE = /\/$/;
  const removeTrailingSlash = (path) => path.replace(TRAILING_SLASH_RE, "");
  function parseURL(parseQuery2, location2, currentLocation = "/") {
    let path, query = {}, searchString = "", hash = "";
    const searchPos = location2.indexOf("?");
    const hashPos = location2.indexOf("#", searchPos > -1 ? searchPos : 0);
    if (searchPos > -1) {
      path = location2.slice(0, searchPos);
      searchString = location2.slice(searchPos + 1, hashPos > -1 ? hashPos : location2.length);
      query = parseQuery2(searchString);
    }
    if (hashPos > -1) {
      path = path || location2.slice(0, hashPos);
      hash = location2.slice(hashPos, location2.length);
    }
    path = resolveRelativePath(path != null ? path : location2, currentLocation);
    return {
      fullPath: path + (searchString && "?") + searchString + hash,
      path,
      query,
      hash
    };
  }
  function stringifyURL(stringifyQuery2, location2) {
    const query = location2.query ? stringifyQuery2(location2.query) : "";
    return location2.path + (query && "?") + query + (location2.hash || "");
  }
  function stripBase(pathname, base) {
    if (!base || !pathname.toLowerCase().startsWith(base.toLowerCase()))
      return pathname;
    return pathname.slice(base.length) || "/";
  }
  function isSameRouteLocation(stringifyQuery2, a, b) {
    const aLastIndex = a.matched.length - 1;
    const bLastIndex = b.matched.length - 1;
    return aLastIndex > -1 && aLastIndex === bLastIndex && isSameRouteRecord(a.matched[aLastIndex], b.matched[bLastIndex]) && isSameRouteLocationParams(a.params, b.params) && stringifyQuery2(a.query) === stringifyQuery2(b.query) && a.hash === b.hash;
  }
  function isSameRouteRecord(a, b) {
    return (a.aliasOf || a) === (b.aliasOf || b);
  }
  function isSameRouteLocationParams(a, b) {
    if (Object.keys(a).length !== Object.keys(b).length)
      return false;
    for (const key in a) {
      if (!isSameRouteLocationParamsValue(a[key], b[key]))
        return false;
    }
    return true;
  }
  function isSameRouteLocationParamsValue(a, b) {
    return Array.isArray(a) ? isEquivalentArray(a, b) : Array.isArray(b) ? isEquivalentArray(b, a) : a === b;
  }
  function isEquivalentArray(a, b) {
    return Array.isArray(b) ? a.length === b.length && a.every((value, i) => value === b[i]) : a.length === 1 && a[0] === b;
  }
  function resolveRelativePath(to, from) {
    if (to.startsWith("/"))
      return to;
    if (!to)
      return from;
    const fromSegments = from.split("/");
    const toSegments = to.split("/");
    let position = fromSegments.length - 1;
    let toPosition;
    let segment;
    for (toPosition = 0; toPosition < toSegments.length; toPosition++) {
      segment = toSegments[toPosition];
      if (position === 1 || segment === ".")
        continue;
      if (segment === "..")
        position--;
      else
        break;
    }
    return fromSegments.slice(0, position).join("/") + "/" + toSegments.slice(toPosition - (toPosition === toSegments.length ? 1 : 0)).join("/");
  }
  var NavigationType;
  (function(NavigationType2) {
    NavigationType2["pop"] = "pop";
    NavigationType2["push"] = "push";
  })(NavigationType || (NavigationType = {}));
  var NavigationDirection;
  (function(NavigationDirection2) {
    NavigationDirection2["back"] = "back";
    NavigationDirection2["forward"] = "forward";
    NavigationDirection2["unknown"] = "";
  })(NavigationDirection || (NavigationDirection = {}));
  const START = "";
  function normalizeBase(base) {
    if (!base) {
      {
        base = "/";
      }
    }
    if (base[0] !== "/" && base[0] !== "#")
      base = "/" + base;
    return removeTrailingSlash(base);
  }
  const BEFORE_HASH_RE = /^[^#]+#/;
  function createHref(base, location2) {
    return base.replace(BEFORE_HASH_RE, "#") + location2;
  }
  const computeScrollPosition = () => ({
    left: window.pageXOffset,
    top: window.pageYOffset
  });
  let createBaseLocation = () => location.protocol + "//" + location.host;
  function createCurrentLocation(base, location2) {
    const { pathname, search, hash } = location2;
    const hashPos = base.indexOf("#");
    if (hashPos > -1) {
      let slicePos = hash.includes(base.slice(hashPos)) ? base.slice(hashPos).length : 1;
      let pathFromHash = hash.slice(slicePos);
      if (pathFromHash[0] !== "/")
        pathFromHash = "/" + pathFromHash;
      return stripBase(pathFromHash, "");
    }
    const path = stripBase(pathname, base);
    return path + search + hash;
  }
  function useHistoryListeners(base, historyState, currentLocation, replace) {
    let listeners = [];
    let teardowns = [];
    let pauseState = null;
    const popStateHandler = ({ state: state2 }) => {
      const to = createCurrentLocation(base, location);
      const from = currentLocation.value;
      const fromState = historyState.value;
      let delta = 0;
      if (state2) {
        currentLocation.value = to;
        historyState.value = state2;
        if (pauseState && pauseState === from) {
          pauseState = null;
          return;
        }
        delta = fromState ? state2.position - fromState.position : 0;
      } else {
        replace(to);
      }
      listeners.forEach((listener) => {
        listener(currentLocation.value, from, {
          delta,
          type: NavigationType.pop,
          direction: delta ? delta > 0 ? NavigationDirection.forward : NavigationDirection.back : NavigationDirection.unknown
        });
      });
    };
    function pauseListeners() {
      pauseState = currentLocation.value;
    }
    function listen(callback) {
      listeners.push(callback);
      const teardown = () => {
        const index = listeners.indexOf(callback);
        if (index > -1)
          listeners.splice(index, 1);
      };
      teardowns.push(teardown);
      return teardown;
    }
    function beforeUnloadListener() {
      const { history: history2 } = window;
      if (!history2.state)
        return;
      history2.replaceState(assign({}, history2.state, { scroll: computeScrollPosition() }), "");
    }
    function destroy() {
      for (const teardown of teardowns)
        teardown();
      teardowns = [];
      window.removeEventListener("popstate", popStateHandler);
      window.removeEventListener("beforeunload", beforeUnloadListener);
    }
    window.addEventListener("popstate", popStateHandler);
    window.addEventListener("beforeunload", beforeUnloadListener);
    return {
      pauseListeners,
      listen,
      destroy
    };
  }
  function buildState(back, current, forward, replaced = false, computeScroll = false) {
    return {
      back,
      current,
      forward,
      replaced,
      position: window.history.length,
      scroll: computeScroll ? computeScrollPosition() : null
    };
  }
  function useHistoryStateNavigation(base) {
    const { history: history2, location: location2 } = window;
    const currentLocation = {
      value: createCurrentLocation(base, location2)
    };
    const historyState = { value: history2.state };
    if (!historyState.value) {
      changeLocation(currentLocation.value, {
        back: null,
        current: currentLocation.value,
        forward: null,
        position: history2.length - 1,
        replaced: true,
        scroll: null
      }, true);
    }
    function changeLocation(to, state2, replace2) {
      const hashIndex = base.indexOf("#");
      const url = hashIndex > -1 ? (location2.host && document.querySelector("base") ? base : base.slice(hashIndex)) + to : createBaseLocation() + base + to;
      try {
        history2[replace2 ? "replaceState" : "pushState"](state2, "", url);
        historyState.value = state2;
      } catch (err) {
        {
          console.error(err);
        }
        location2[replace2 ? "replace" : "assign"](url);
      }
    }
    function replace(to, data) {
      const state2 = assign({}, history2.state, buildState(historyState.value.back, to, historyState.value.forward, true), data, { position: historyState.value.position });
      changeLocation(to, state2, true);
      currentLocation.value = to;
    }
    function push(to, data) {
      const currentState = assign({}, historyState.value, history2.state, {
        forward: to,
        scroll: computeScrollPosition()
      });
      changeLocation(currentState.current, currentState, true);
      const state2 = assign({}, buildState(currentLocation.value, to, null), { position: currentState.position + 1 }, data);
      changeLocation(to, state2, false);
      currentLocation.value = to;
    }
    return {
      location: currentLocation,
      state: historyState,
      push,
      replace
    };
  }
  function createWebHistory(base) {
    base = normalizeBase(base);
    const historyNavigation = useHistoryStateNavigation(base);
    const historyListeners = useHistoryListeners(base, historyNavigation.state, historyNavigation.location, historyNavigation.replace);
    function go(delta, triggerListeners = true) {
      if (!triggerListeners)
        historyListeners.pauseListeners();
      history.go(delta);
    }
    const routerHistory = assign({
      location: "",
      base,
      go,
      createHref: createHref.bind(null, base)
    }, historyNavigation, historyListeners);
    Object.defineProperty(routerHistory, "location", {
      enumerable: true,
      get: () => historyNavigation.location.value
    });
    Object.defineProperty(routerHistory, "state", {
      enumerable: true,
      get: () => historyNavigation.state.value
    });
    return routerHistory;
  }
  function createMemoryHistory(base = "") {
    let listeners = [];
    let queue = [START];
    let position = 0;
    base = normalizeBase(base);
    function setLocation(location2) {
      position++;
      if (position === queue.length) {
        queue.push(location2);
      } else {
        queue.splice(position);
        queue.push(location2);
      }
    }
    function triggerListeners(to, from, { direction: direction2, delta }) {
      const info = {
        direction: direction2,
        delta,
        type: NavigationType.pop
      };
      for (const callback of listeners) {
        callback(to, from, info);
      }
    }
    const routerHistory = {
      location: START,
      state: {},
      base,
      createHref: createHref.bind(null, base),
      replace(to) {
        queue.splice(position--, 1);
        setLocation(to);
      },
      push(to, data) {
        setLocation(to);
      },
      listen(callback) {
        listeners.push(callback);
        return () => {
          const index = listeners.indexOf(callback);
          if (index > -1)
            listeners.splice(index, 1);
        };
      },
      destroy() {
        listeners = [];
        queue = [START];
        position = 0;
      },
      go(delta, shouldTrigger = true) {
        const from = this.location;
        const direction2 = delta < 0 ? NavigationDirection.back : NavigationDirection.forward;
        position = Math.max(0, Math.min(position + delta, queue.length - 1));
        if (shouldTrigger) {
          triggerListeners(this.location, from, {
            direction: direction2,
            delta
          });
        }
      }
    };
    Object.defineProperty(routerHistory, "location", {
      enumerable: true,
      get: () => queue[position]
    });
    return routerHistory;
  }
  function createWebHashHistory(base) {
    base = location.host ? base || location.pathname + location.search : "";
    if (!base.includes("#"))
      base += "#";
    return createWebHistory(base);
  }
  function isRouteLocation(route) {
    return typeof route === "string" || route && typeof route === "object";
  }
  function isRouteName(name2) {
    return typeof name2 === "string" || typeof name2 === "symbol";
  }
  const START_LOCATION_NORMALIZED = {
    path: "/",
    name: void 0,
    params: {},
    query: {},
    hash: "",
    fullPath: "/",
    matched: [],
    meta: {},
    redirectedFrom: void 0
  };
  const NavigationFailureSymbol = /* @__PURE__ */ PolySymbol("nf");
  exports.NavigationFailureType = void 0;
  (function(NavigationFailureType) {
    NavigationFailureType[NavigationFailureType["aborted"] = 4] = "aborted";
    NavigationFailureType[NavigationFailureType["cancelled"] = 8] = "cancelled";
    NavigationFailureType[NavigationFailureType["duplicated"] = 16] = "duplicated";
  })(exports.NavigationFailureType || (exports.NavigationFailureType = {}));
  const ErrorTypeMessages = {
    [1]({ location: location2, currentLocation }) {
      return `No match for
 ${JSON.stringify(location2)}${currentLocation ? "\nwhile being at\n" + JSON.stringify(currentLocation) : ""}`;
    },
    [2]({ from, to }) {
      return `Redirected from "${from.fullPath}" to "${stringifyRoute(to)}" via a navigation guard.`;
    },
    [4]({ from, to }) {
      return `Navigation aborted from "${from.fullPath}" to "${to.fullPath}" via a navigation guard.`;
    },
    [8]({ from, to }) {
      return `Navigation cancelled from "${from.fullPath}" to "${to.fullPath}" with a new navigation.`;
    },
    [16]({ from, to }) {
      return `Avoided redundant navigation to current location: "${from.fullPath}".`;
    }
  };
  function createRouterError(type, params) {
    {
      return assign(new Error(ErrorTypeMessages[type](params)), {
        type,
        [NavigationFailureSymbol]: true
      }, params);
    }
  }
  function isNavigationFailure(error, type) {
    return error instanceof Error && NavigationFailureSymbol in error && (type == null || !!(error.type & type));
  }
  const propertiesToLog = ["params", "query", "hash"];
  function stringifyRoute(to) {
    if (typeof to === "string")
      return to;
    if ("path" in to)
      return to.path;
    const location2 = {};
    for (const key of propertiesToLog) {
      if (key in to)
        location2[key] = to[key];
    }
    return JSON.stringify(location2, null, 2);
  }
  const BASE_PARAM_PATTERN = "[^/]+?";
  const BASE_PATH_PARSER_OPTIONS = {
    sensitive: false,
    strict: false,
    start: true,
    end: true
  };
  const REGEX_CHARS_RE = /[.+*?^${}()[\]/\\]/g;
  function tokensToParser(segments, extraOptions) {
    const options = assign({}, BASE_PATH_PARSER_OPTIONS, extraOptions);
    const score = [];
    let pattern = options.start ? "^" : "";
    const keys = [];
    for (const segment of segments) {
      const segmentScores = segment.length ? [] : [90];
      if (options.strict && !segment.length)
        pattern += "/";
      for (let tokenIndex = 0; tokenIndex < segment.length; tokenIndex++) {
        const token = segment[tokenIndex];
        let subSegmentScore = 40 + (options.sensitive ? 0.25 : 0);
        if (token.type === 0) {
          if (!tokenIndex)
            pattern += "/";
          pattern += token.value.replace(REGEX_CHARS_RE, "\\$&");
          subSegmentScore += 40;
        } else if (token.type === 1) {
          const { value, repeatable, optional, regexp } = token;
          keys.push({
            name: value,
            repeatable,
            optional
          });
          const re2 = regexp ? regexp : BASE_PARAM_PATTERN;
          if (re2 !== BASE_PARAM_PATTERN) {
            subSegmentScore += 10;
            try {
              new RegExp(`(${re2})`);
            } catch (err) {
              throw new Error(`Invalid custom RegExp for param "${value}" (${re2}): ` + err.message);
            }
          }
          let subPattern = repeatable ? `((?:${re2})(?:/(?:${re2}))*)` : `(${re2})`;
          if (!tokenIndex)
            subPattern = optional && segment.length < 2 ? `(?:/${subPattern})` : "/" + subPattern;
          if (optional)
            subPattern += "?";
          pattern += subPattern;
          subSegmentScore += 20;
          if (optional)
            subSegmentScore += -8;
          if (repeatable)
            subSegmentScore += -20;
          if (re2 === ".*")
            subSegmentScore += -50;
        }
        segmentScores.push(subSegmentScore);
      }
      score.push(segmentScores);
    }
    if (options.strict && options.end) {
      const i = score.length - 1;
      score[i][score[i].length - 1] += 0.7000000000000001;
    }
    if (!options.strict)
      pattern += "/?";
    if (options.end)
      pattern += "$";
    else if (options.strict)
      pattern += "(?:/|$)";
    const re = new RegExp(pattern, options.sensitive ? "" : "i");
    function parse(path) {
      const match = path.match(re);
      const params = {};
      if (!match)
        return null;
      for (let i = 1; i < match.length; i++) {
        const value = match[i] || "";
        const key = keys[i - 1];
        params[key.name] = value && key.repeatable ? value.split("/") : value;
      }
      return params;
    }
    function stringify(params) {
      let path = "";
      let avoidDuplicatedSlash = false;
      for (const segment of segments) {
        if (!avoidDuplicatedSlash || !path.endsWith("/"))
          path += "/";
        avoidDuplicatedSlash = false;
        for (const token of segment) {
          if (token.type === 0) {
            path += token.value;
          } else if (token.type === 1) {
            const { value, repeatable, optional } = token;
            const param = value in params ? params[value] : "";
            if (Array.isArray(param) && !repeatable)
              throw new Error(`Provided param "${value}" is an array but it is not repeatable (* or + modifiers)`);
            const text = Array.isArray(param) ? param.join("/") : param;
            if (!text) {
              if (optional) {
                if (segment.length < 2 && segments.length > 1) {
                  if (path.endsWith("/"))
                    path = path.slice(0, -1);
                  else
                    avoidDuplicatedSlash = true;
                }
              } else
                throw new Error(`Missing required param "${value}"`);
            }
            path += text;
          }
        }
      }
      return path;
    }
    return {
      re,
      score,
      keys,
      parse,
      stringify
    };
  }
  function compareScoreArray(a, b) {
    let i = 0;
    while (i < a.length && i < b.length) {
      const diff = b[i] - a[i];
      if (diff)
        return diff;
      i++;
    }
    if (a.length < b.length) {
      return a.length === 1 && a[0] === 40 + 40 ? -1 : 1;
    } else if (a.length > b.length) {
      return b.length === 1 && b[0] === 40 + 40 ? 1 : -1;
    }
    return 0;
  }
  function comparePathParserScore(a, b) {
    let i = 0;
    const aScore = a.score;
    const bScore = b.score;
    while (i < aScore.length && i < bScore.length) {
      const comp = compareScoreArray(aScore[i], bScore[i]);
      if (comp)
        return comp;
      i++;
    }
    if (Math.abs(bScore.length - aScore.length) === 1) {
      if (isLastScoreNegative(aScore))
        return 1;
      if (isLastScoreNegative(bScore))
        return -1;
    }
    return bScore.length - aScore.length;
  }
  function isLastScoreNegative(score) {
    const last = score[score.length - 1];
    return score.length > 0 && last[last.length - 1] < 0;
  }
  const ROOT_TOKEN = {
    type: 0,
    value: ""
  };
  const VALID_PARAM_RE = /[a-zA-Z0-9_]/;
  function tokenizePath(path) {
    if (!path)
      return [[]];
    if (path === "/")
      return [[ROOT_TOKEN]];
    if (!path.startsWith("/")) {
      throw new Error(`Invalid path "${path}"`);
    }
    function crash(message) {
      throw new Error(`ERR (${state2})/"${buffer}": ${message}`);
    }
    let state2 = 0;
    let previousState = state2;
    const tokens = [];
    let segment;
    function finalizeSegment() {
      if (segment)
        tokens.push(segment);
      segment = [];
    }
    let i = 0;
    let char;
    let buffer = "";
    let customRe = "";
    function consumeBuffer() {
      if (!buffer)
        return;
      if (state2 === 0) {
        segment.push({
          type: 0,
          value: buffer
        });
      } else if (state2 === 1 || state2 === 2 || state2 === 3) {
        if (segment.length > 1 && (char === "*" || char === "+"))
          crash(`A repeatable param (${buffer}) must be alone in its segment. eg: '/:ids+.`);
        segment.push({
          type: 1,
          value: buffer,
          regexp: customRe,
          repeatable: char === "*" || char === "+",
          optional: char === "*" || char === "?"
        });
      } else {
        crash("Invalid state to consume buffer");
      }
      buffer = "";
    }
    function addCharToBuffer() {
      buffer += char;
    }
    while (i < path.length) {
      char = path[i++];
      if (char === "\\" && state2 !== 2) {
        previousState = state2;
        state2 = 4;
        continue;
      }
      switch (state2) {
        case 0:
          if (char === "/") {
            if (buffer) {
              consumeBuffer();
            }
            finalizeSegment();
          } else if (char === ":") {
            consumeBuffer();
            state2 = 1;
          } else {
            addCharToBuffer();
          }
          break;
        case 4:
          addCharToBuffer();
          state2 = previousState;
          break;
        case 1:
          if (char === "(") {
            state2 = 2;
          } else if (VALID_PARAM_RE.test(char)) {
            addCharToBuffer();
          } else {
            consumeBuffer();
            state2 = 0;
            if (char !== "*" && char !== "?" && char !== "+")
              i--;
          }
          break;
        case 2:
          if (char === ")") {
            if (customRe[customRe.length - 1] == "\\")
              customRe = customRe.slice(0, -1) + char;
            else
              state2 = 3;
          } else {
            customRe += char;
          }
          break;
        case 3:
          consumeBuffer();
          state2 = 0;
          if (char !== "*" && char !== "?" && char !== "+")
            i--;
          customRe = "";
          break;
        default:
          crash("Unknown state");
          break;
      }
    }
    if (state2 === 2)
      crash(`Unfinished custom RegExp for param "${buffer}"`);
    consumeBuffer();
    finalizeSegment();
    return tokens;
  }
  function createRouteRecordMatcher(record, parent, options) {
    const parser = tokensToParser(tokenizePath(record.path), options);
    const matcher = assign(parser, {
      record,
      parent,
      children: [],
      alias: []
    });
    if (parent) {
      if (!matcher.record.aliasOf === !parent.record.aliasOf)
        parent.children.push(matcher);
    }
    return matcher;
  }
  function createRouterMatcher(routes2, globalOptions) {
    const matchers = [];
    const matcherMap = /* @__PURE__ */ new Map();
    globalOptions = mergeOptions({ strict: false, end: true, sensitive: false }, globalOptions);
    function getRecordMatcher(name2) {
      return matcherMap.get(name2);
    }
    function addRoute(record, parent, originalRecord) {
      const isRootAdd = !originalRecord;
      const mainNormalizedRecord = normalizeRouteRecord(record);
      mainNormalizedRecord.aliasOf = originalRecord && originalRecord.record;
      const options = mergeOptions(globalOptions, record);
      const normalizedRecords = [
        mainNormalizedRecord
      ];
      if ("alias" in record) {
        const aliases = typeof record.alias === "string" ? [record.alias] : record.alias;
        for (const alias of aliases) {
          normalizedRecords.push(assign({}, mainNormalizedRecord, {
            components: originalRecord ? originalRecord.record.components : mainNormalizedRecord.components,
            path: alias,
            aliasOf: originalRecord ? originalRecord.record : mainNormalizedRecord
          }));
        }
      }
      let matcher;
      let originalMatcher;
      for (const normalizedRecord of normalizedRecords) {
        const { path } = normalizedRecord;
        if (parent && path[0] !== "/") {
          const parentPath = parent.record.path;
          const connectingSlash = parentPath[parentPath.length - 1] === "/" ? "" : "/";
          normalizedRecord.path = parent.record.path + (path && connectingSlash + path);
        }
        matcher = createRouteRecordMatcher(normalizedRecord, parent, options);
        if (originalRecord) {
          originalRecord.alias.push(matcher);
        } else {
          originalMatcher = originalMatcher || matcher;
          if (originalMatcher !== matcher)
            originalMatcher.alias.push(matcher);
          if (isRootAdd && record.name && !isAliasRecord(matcher))
            removeRoute(record.name);
        }
        if ("children" in mainNormalizedRecord) {
          const children = mainNormalizedRecord.children;
          for (let i = 0; i < children.length; i++) {
            addRoute(children[i], matcher, originalRecord && originalRecord.children[i]);
          }
        }
        originalRecord = originalRecord || matcher;
        insertMatcher(matcher);
      }
      return originalMatcher ? () => {
        removeRoute(originalMatcher);
      } : noop2;
    }
    function removeRoute(matcherRef) {
      if (isRouteName(matcherRef)) {
        const matcher = matcherMap.get(matcherRef);
        if (matcher) {
          matcherMap.delete(matcherRef);
          matchers.splice(matchers.indexOf(matcher), 1);
          matcher.children.forEach(removeRoute);
          matcher.alias.forEach(removeRoute);
        }
      } else {
        const index = matchers.indexOf(matcherRef);
        if (index > -1) {
          matchers.splice(index, 1);
          if (matcherRef.record.name)
            matcherMap.delete(matcherRef.record.name);
          matcherRef.children.forEach(removeRoute);
          matcherRef.alias.forEach(removeRoute);
        }
      }
    }
    function getRoutes() {
      return matchers;
    }
    function insertMatcher(matcher) {
      let i = 0;
      while (i < matchers.length && comparePathParserScore(matcher, matchers[i]) >= 0 && (matcher.record.path !== matchers[i].record.path || !isRecordChildOf(matcher, matchers[i])))
        i++;
      matchers.splice(i, 0, matcher);
      if (matcher.record.name && !isAliasRecord(matcher))
        matcherMap.set(matcher.record.name, matcher);
    }
    function resolve(location2, currentLocation) {
      let matcher;
      let params = {};
      let path;
      let name2;
      if ("name" in location2 && location2.name) {
        matcher = matcherMap.get(location2.name);
        if (!matcher)
          throw createRouterError(1, {
            location: location2
          });
        name2 = matcher.record.name;
        params = assign(paramsFromLocation(currentLocation.params, matcher.keys.filter((k) => !k.optional).map((k) => k.name)), location2.params);
        path = matcher.stringify(params);
      } else if ("path" in location2) {
        path = location2.path;
        matcher = matchers.find((m) => m.re.test(path));
        if (matcher) {
          params = matcher.parse(path);
          name2 = matcher.record.name;
        }
      } else {
        matcher = currentLocation.name ? matcherMap.get(currentLocation.name) : matchers.find((m) => m.re.test(currentLocation.path));
        if (!matcher)
          throw createRouterError(1, {
            location: location2,
            currentLocation
          });
        name2 = matcher.record.name;
        params = assign({}, currentLocation.params, location2.params);
        path = matcher.stringify(params);
      }
      const matched = [];
      let parentMatcher = matcher;
      while (parentMatcher) {
        matched.unshift(parentMatcher.record);
        parentMatcher = parentMatcher.parent;
      }
      return {
        name: name2,
        path,
        params,
        matched,
        meta: mergeMetaFields(matched)
      };
    }
    routes2.forEach((route) => addRoute(route));
    return { addRoute, resolve, removeRoute, getRoutes, getRecordMatcher };
  }
  function paramsFromLocation(params, keys) {
    const newParams = {};
    for (const key of keys) {
      if (key in params)
        newParams[key] = params[key];
    }
    return newParams;
  }
  function normalizeRouteRecord(record) {
    return {
      path: record.path,
      redirect: record.redirect,
      name: record.name,
      meta: record.meta || {},
      aliasOf: void 0,
      beforeEnter: record.beforeEnter,
      props: normalizeRecordProps(record),
      children: record.children || [],
      instances: {},
      leaveGuards: /* @__PURE__ */ new Set(),
      updateGuards: /* @__PURE__ */ new Set(),
      enterCallbacks: {},
      components: "components" in record ? record.components || {} : { default: record.component }
    };
  }
  function normalizeRecordProps(record) {
    const propsObject = {};
    const props = record.props || false;
    if ("component" in record) {
      propsObject.default = props;
    } else {
      for (const name2 in record.components)
        propsObject[name2] = typeof props === "boolean" ? props : props[name2];
    }
    return propsObject;
  }
  function isAliasRecord(record) {
    while (record) {
      if (record.record.aliasOf)
        return true;
      record = record.parent;
    }
    return false;
  }
  function mergeMetaFields(matched) {
    return matched.reduce((meta2, record) => assign(meta2, record.meta), {});
  }
  function mergeOptions(defaults, partialOptions) {
    const options = {};
    for (const key in defaults) {
      options[key] = key in partialOptions ? partialOptions[key] : defaults[key];
    }
    return options;
  }
  function isRecordChildOf(record, parent) {
    return parent.children.some((child) => child === record || isRecordChildOf(record, child));
  }
  const HASH_RE = /#/g;
  const AMPERSAND_RE = /&/g;
  const SLASH_RE = /\//g;
  const EQUAL_RE = /=/g;
  const IM_RE = /\?/g;
  const PLUS_RE = /\+/g;
  const ENC_BRACKET_OPEN_RE = /%5B/g;
  const ENC_BRACKET_CLOSE_RE = /%5D/g;
  const ENC_CARET_RE = /%5E/g;
  const ENC_BACKTICK_RE = /%60/g;
  const ENC_CURLY_OPEN_RE = /%7B/g;
  const ENC_PIPE_RE = /%7C/g;
  const ENC_CURLY_CLOSE_RE = /%7D/g;
  const ENC_SPACE_RE = /%20/g;
  function commonEncode(text) {
    return encodeURI("" + text).replace(ENC_PIPE_RE, "|").replace(ENC_BRACKET_OPEN_RE, "[").replace(ENC_BRACKET_CLOSE_RE, "]");
  }
  function encodeHash(text) {
    return commonEncode(text).replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
  }
  function encodeQueryValue(text) {
    return commonEncode(text).replace(PLUS_RE, "%2B").replace(ENC_SPACE_RE, "+").replace(HASH_RE, "%23").replace(AMPERSAND_RE, "%26").replace(ENC_BACKTICK_RE, "`").replace(ENC_CURLY_OPEN_RE, "{").replace(ENC_CURLY_CLOSE_RE, "}").replace(ENC_CARET_RE, "^");
  }
  function encodeQueryKey(text) {
    return encodeQueryValue(text).replace(EQUAL_RE, "%3D");
  }
  function encodePath(text) {
    return commonEncode(text).replace(HASH_RE, "%23").replace(IM_RE, "%3F");
  }
  function encodeParam(text) {
    return text == null ? "" : encodePath(text).replace(SLASH_RE, "%2F");
  }
  function decode(text) {
    try {
      return decodeURIComponent("" + text);
    } catch (err) {
    }
    return "" + text;
  }
  function parseQuery(search) {
    const query = {};
    if (search === "" || search === "?")
      return query;
    const hasLeadingIM = search[0] === "?";
    const searchParams = (hasLeadingIM ? search.slice(1) : search).split("&");
    for (let i = 0; i < searchParams.length; ++i) {
      const searchParam = searchParams[i].replace(PLUS_RE, " ");
      const eqPos = searchParam.indexOf("=");
      const key = decode(eqPos < 0 ? searchParam : searchParam.slice(0, eqPos));
      const value = eqPos < 0 ? null : decode(searchParam.slice(eqPos + 1));
      if (key in query) {
        let currentValue = query[key];
        if (!Array.isArray(currentValue)) {
          currentValue = query[key] = [currentValue];
        }
        currentValue.push(value);
      } else {
        query[key] = value;
      }
    }
    return query;
  }
  function stringifyQuery(query) {
    let search = "";
    for (let key in query) {
      const value = query[key];
      key = encodeQueryKey(key);
      if (value == null) {
        if (value !== void 0) {
          search += (search.length ? "&" : "") + key;
        }
        continue;
      }
      const values = Array.isArray(value) ? value.map((v) => v && encodeQueryValue(v)) : [value && encodeQueryValue(value)];
      values.forEach((value2) => {
        if (value2 !== void 0) {
          search += (search.length ? "&" : "") + key;
          if (value2 != null)
            search += "=" + value2;
        }
      });
    }
    return search;
  }
  function normalizeQuery(query) {
    const normalizedQuery = {};
    for (const key in query) {
      const value = query[key];
      if (value !== void 0) {
        normalizedQuery[key] = Array.isArray(value) ? value.map((v) => v == null ? null : "" + v) : value == null ? value : "" + value;
      }
    }
    return normalizedQuery;
  }
  function useCallbacks() {
    let handlers2 = [];
    function add(handler) {
      handlers2.push(handler);
      return () => {
        const i = handlers2.indexOf(handler);
        if (i > -1)
          handlers2.splice(i, 1);
      };
    }
    function reset() {
      handlers2 = [];
    }
    return {
      add,
      list: () => handlers2,
      reset
    };
  }
  function registerGuard(record, name2, guard) {
    const removeFromList = () => {
      record[name2].delete(guard);
    };
    vue.onUnmounted(removeFromList);
    vue.onDeactivated(removeFromList);
    vue.onActivated(() => {
      record[name2].add(guard);
    });
    record[name2].add(guard);
  }
  function onBeforeRouteLeave(leaveGuard) {
    const activeRecord = vue.inject(matchedRouteKey, {}).value;
    if (!activeRecord) {
      return;
    }
    registerGuard(activeRecord, "leaveGuards", leaveGuard);
  }
  function onBeforeRouteUpdate(updateGuard) {
    const activeRecord = vue.inject(matchedRouteKey, {}).value;
    if (!activeRecord) {
      return;
    }
    registerGuard(activeRecord, "updateGuards", updateGuard);
  }
  function guardToPromiseFn(guard, to, from, record, name2) {
    const enterCallbackArray = record && (record.enterCallbacks[name2] = record.enterCallbacks[name2] || []);
    return () => new Promise((resolve, reject) => {
      const next = (valid) => {
        if (valid === false)
          reject(createRouterError(4, {
            from,
            to
          }));
        else if (valid instanceof Error) {
          reject(valid);
        } else if (isRouteLocation(valid)) {
          reject(createRouterError(2, {
            from: to,
            to: valid
          }));
        } else {
          if (enterCallbackArray && record.enterCallbacks[name2] === enterCallbackArray && typeof valid === "function")
            enterCallbackArray.push(valid);
          resolve();
        }
      };
      const guardReturn = guard.call(record && record.instances[name2], to, from, next);
      let guardCall = Promise.resolve(guardReturn);
      if (guard.length < 3)
        guardCall = guardCall.then(next);
      guardCall.catch((err) => reject(err));
    });
  }
  function extractComponentsGuards(matched, guardType, to, from) {
    const guards = [];
    for (const record of matched) {
      for (const name2 in record.components) {
        let rawComponent = record.components[name2];
        if (guardType !== "beforeRouteEnter" && !record.instances[name2])
          continue;
        if (isRouteComponent(rawComponent)) {
          const options = rawComponent.__vccOpts || rawComponent;
          const guard = options[guardType];
          guard && guards.push(guardToPromiseFn(guard, to, from, record, name2));
        } else {
          let componentPromise = rawComponent();
          guards.push(() => componentPromise.then((resolved) => {
            if (!resolved)
              return Promise.reject(new Error(`Couldn't resolve component "${name2}" at "${record.path}"`));
            const resolvedComponent = isESModule(resolved) ? resolved.default : resolved;
            record.components[name2] = resolvedComponent;
            const options = resolvedComponent.__vccOpts || resolvedComponent;
            const guard = options[guardType];
            return guard && guardToPromiseFn(guard, to, from, record, name2)();
          }));
        }
      }
    }
    return guards;
  }
  function isRouteComponent(component) {
    return typeof component === "object" || "displayName" in component || "props" in component || "__vccOpts" in component;
  }
  function useLink(props) {
    const router = vue.inject(routerKey);
    const currentRoute = vue.inject(routeLocationKey);
    const route = vue.computed(() => router.resolve(vue.unref(props.to)));
    const activeRecordIndex = vue.computed(() => {
      const { matched } = route.value;
      const { length } = matched;
      const routeMatched = matched[length - 1];
      const currentMatched = currentRoute.matched;
      if (!routeMatched || !currentMatched.length)
        return -1;
      const index = currentMatched.findIndex(isSameRouteRecord.bind(null, routeMatched));
      if (index > -1)
        return index;
      const parentRecordPath = getOriginalPath(matched[length - 2]);
      return length > 1 && getOriginalPath(routeMatched) === parentRecordPath && currentMatched[currentMatched.length - 1].path !== parentRecordPath ? currentMatched.findIndex(isSameRouteRecord.bind(null, matched[length - 2])) : index;
    });
    const isActive = vue.computed(() => activeRecordIndex.value > -1 && includesParams(currentRoute.params, route.value.params));
    const isExactActive = vue.computed(() => activeRecordIndex.value > -1 && activeRecordIndex.value === currentRoute.matched.length - 1 && isSameRouteLocationParams(currentRoute.params, route.value.params));
    function navigate(e = {}) {
      if (guardEvent(e)) {
        return router[vue.unref(props.replace) ? "replace" : "push"](vue.unref(props.to)).catch(noop2);
      }
      return Promise.resolve();
    }
    return {
      route,
      href: vue.computed(() => route.value.href),
      isActive,
      isExactActive,
      navigate
    };
  }
  const RouterLinkImpl = /* @__PURE__ */ vue.defineComponent({
    name: "RouterLink",
    compatConfig: { MODE: 3 },
    props: {
      to: {
        type: [String, Object],
        required: true
      },
      replace: Boolean,
      activeClass: String,
      exactActiveClass: String,
      custom: Boolean,
      ariaCurrentValue: {
        type: String,
        default: "page"
      }
    },
    useLink,
    setup(props, { slots }) {
      const link = vue.reactive(useLink(props));
      const { options } = vue.inject(routerKey);
      const elClass = vue.computed(() => ({
        [getLinkClass(props.activeClass, options.linkActiveClass, "router-link-active")]: link.isActive,
        [getLinkClass(props.exactActiveClass, options.linkExactActiveClass, "router-link-exact-active")]: link.isExactActive
      }));
      return () => {
        const children = slots.default && slots.default(link);
        return props.custom ? children : vue.h("a", {
          "aria-current": link.isExactActive ? props.ariaCurrentValue : null,
          href: link.href,
          onClick: link.navigate,
          class: elClass.value
        }, children);
      };
    }
  });
  const RouterLink = RouterLinkImpl;
  function guardEvent(e) {
    if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey)
      return;
    if (e.defaultPrevented)
      return;
    if (e.button !== void 0 && e.button !== 0)
      return;
    if (e.currentTarget && e.currentTarget.getAttribute) {
      const target = e.currentTarget.getAttribute("target");
      if (/\b_blank\b/i.test(target))
        return;
    }
    if (e.preventDefault)
      e.preventDefault();
    return true;
  }
  function includesParams(outer, inner) {
    for (const key in inner) {
      const innerValue = inner[key];
      const outerValue = outer[key];
      if (typeof innerValue === "string") {
        if (innerValue !== outerValue)
          return false;
      } else {
        if (!Array.isArray(outerValue) || outerValue.length !== innerValue.length || innerValue.some((value, i) => value !== outerValue[i]))
          return false;
      }
    }
    return true;
  }
  function getOriginalPath(record) {
    return record ? record.aliasOf ? record.aliasOf.path : record.path : "";
  }
  const getLinkClass = (propClass, globalClass, defaultClass) => propClass != null ? propClass : globalClass != null ? globalClass : defaultClass;
  const RouterViewImpl = /* @__PURE__ */ vue.defineComponent({
    name: "RouterView",
    inheritAttrs: false,
    props: {
      name: {
        type: String,
        default: "default"
      },
      route: Object
    },
    compatConfig: { MODE: 3 },
    setup(props, { attrs, slots }) {
      const injectedRoute = vue.inject(routerViewLocationKey);
      const routeToDisplay = vue.computed(() => props.route || injectedRoute.value);
      const depth = vue.inject(viewDepthKey, 0);
      const matchedRouteRef = vue.computed(() => routeToDisplay.value.matched[depth]);
      vue.provide(viewDepthKey, depth + 1);
      vue.provide(matchedRouteKey, matchedRouteRef);
      vue.provide(routerViewLocationKey, routeToDisplay);
      const viewRef = vue.ref();
      vue.watch(() => [viewRef.value, matchedRouteRef.value, props.name], ([instance, to, name2], [oldInstance, from, oldName]) => {
        if (to) {
          to.instances[name2] = instance;
          if (from && from !== to && instance && instance === oldInstance) {
            if (!to.leaveGuards.size) {
              to.leaveGuards = from.leaveGuards;
            }
            if (!to.updateGuards.size) {
              to.updateGuards = from.updateGuards;
            }
          }
        }
        if (instance && to && (!from || !isSameRouteRecord(to, from) || !oldInstance)) {
          (to.enterCallbacks[name2] || []).forEach((callback) => callback(instance));
        }
      }, { flush: "post" });
      return () => {
        const route = routeToDisplay.value;
        const matchedRoute = matchedRouteRef.value;
        const ViewComponent = matchedRoute && matchedRoute.components[props.name];
        const currentName = props.name;
        if (!ViewComponent) {
          return normalizeSlot(slots.default, { Component: ViewComponent, route });
        }
        const routePropsOption = matchedRoute.props[props.name];
        const routeProps = routePropsOption ? routePropsOption === true ? route.params : typeof routePropsOption === "function" ? routePropsOption(route) : routePropsOption : null;
        const onVnodeUnmounted = (vnode) => {
          if (vnode.component.isUnmounted) {
            matchedRoute.instances[currentName] = null;
          }
        };
        const component = vue.h(ViewComponent, assign({}, routeProps, attrs, {
          onVnodeUnmounted,
          ref: viewRef
        }));
        return normalizeSlot(slots.default, { Component: component, route }) || component;
      };
    }
  });
  function normalizeSlot(slot, data) {
    if (!slot)
      return null;
    const slotContent = slot(data);
    return slotContent.length === 1 ? slotContent[0] : slotContent;
  }
  const RouterView = RouterViewImpl;
  function createRouter(options) {
    const matcher = createRouterMatcher(options.routes, options);
    const parseQuery$1 = options.parseQuery || parseQuery;
    const stringifyQuery$1 = options.stringifyQuery || stringifyQuery;
    const routerHistory = options.history;
    const beforeGuards = useCallbacks();
    const beforeResolveGuards = useCallbacks();
    const afterGuards = useCallbacks();
    const currentRoute = vue.shallowRef(START_LOCATION_NORMALIZED);
    let pendingLocation = START_LOCATION_NORMALIZED;
    const normalizeParams = applyToParams.bind(null, (paramValue) => "" + paramValue);
    const encodeParams = applyToParams.bind(null, encodeParam);
    const decodeParams = applyToParams.bind(null, decode);
    function addRoute(parentOrRoute, route) {
      let parent;
      let record;
      if (isRouteName(parentOrRoute)) {
        parent = matcher.getRecordMatcher(parentOrRoute);
        record = route;
      } else {
        record = parentOrRoute;
      }
      return matcher.addRoute(record, parent);
    }
    function removeRoute(name2) {
      const recordMatcher = matcher.getRecordMatcher(name2);
      if (recordMatcher) {
        matcher.removeRoute(recordMatcher);
      }
    }
    function getRoutes() {
      return matcher.getRoutes().map((routeMatcher) => routeMatcher.record);
    }
    function hasRoute(name2) {
      return !!matcher.getRecordMatcher(name2);
    }
    function resolve(rawLocation, currentLocation) {
      currentLocation = assign({}, currentLocation || currentRoute.value);
      if (typeof rawLocation === "string") {
        const locationNormalized = parseURL(parseQuery$1, rawLocation, currentLocation.path);
        const matchedRoute2 = matcher.resolve({ path: locationNormalized.path }, currentLocation);
        const href2 = routerHistory.createHref(locationNormalized.fullPath);
        return assign(locationNormalized, matchedRoute2, {
          params: decodeParams(matchedRoute2.params),
          hash: decode(locationNormalized.hash),
          redirectedFrom: void 0,
          href: href2
        });
      }
      let matcherLocation;
      if ("path" in rawLocation) {
        matcherLocation = assign({}, rawLocation, {
          path: parseURL(parseQuery$1, rawLocation.path, currentLocation.path).path
        });
      } else {
        const targetParams = assign({}, rawLocation.params);
        for (const key in targetParams) {
          if (targetParams[key] == null) {
            delete targetParams[key];
          }
        }
        matcherLocation = assign({}, rawLocation, {
          params: encodeParams(rawLocation.params)
        });
        currentLocation.params = encodeParams(currentLocation.params);
      }
      const matchedRoute = matcher.resolve(matcherLocation, currentLocation);
      const hash = rawLocation.hash || "";
      matchedRoute.params = normalizeParams(decodeParams(matchedRoute.params));
      const fullPath = stringifyURL(stringifyQuery$1, assign({}, rawLocation, {
        hash: encodeHash(hash),
        path: matchedRoute.path
      }));
      const href = routerHistory.createHref(fullPath);
      return assign({
        fullPath,
        hash,
        query: stringifyQuery$1 === stringifyQuery ? normalizeQuery(rawLocation.query) : rawLocation.query || {}
      }, matchedRoute, {
        redirectedFrom: void 0,
        href
      });
    }
    function locationAsObject(to) {
      return typeof to === "string" ? parseURL(parseQuery$1, to, currentRoute.value.path) : assign({}, to);
    }
    function checkCanceledNavigation(to, from) {
      if (pendingLocation !== to) {
        return createRouterError(8, {
          from,
          to
        });
      }
    }
    function push(to) {
      return pushWithRedirect(to);
    }
    function replace(to) {
      return push(assign(locationAsObject(to), { replace: true }));
    }
    function handleRedirectRecord(to) {
      const lastMatched = to.matched[to.matched.length - 1];
      if (lastMatched && lastMatched.redirect) {
        const { redirect } = lastMatched;
        let newTargetLocation = typeof redirect === "function" ? redirect(to) : redirect;
        if (typeof newTargetLocation === "string") {
          newTargetLocation = newTargetLocation.includes("?") || newTargetLocation.includes("#") ? newTargetLocation = locationAsObject(newTargetLocation) : { path: newTargetLocation };
          newTargetLocation.params = {};
        }
        return assign({
          query: to.query,
          hash: to.hash,
          params: to.params
        }, newTargetLocation);
      }
    }
    function pushWithRedirect(to, redirectedFrom) {
      const targetLocation = pendingLocation = resolve(to);
      const from = currentRoute.value;
      const data = to.state;
      const force = to.force;
      const replace2 = to.replace === true;
      const shouldRedirect = handleRedirectRecord(targetLocation);
      if (shouldRedirect)
        return pushWithRedirect(assign(locationAsObject(shouldRedirect), {
          state: data,
          force,
          replace: replace2
        }), redirectedFrom || targetLocation);
      const toLocation = targetLocation;
      toLocation.redirectedFrom = redirectedFrom;
      let failure;
      if (!force && isSameRouteLocation(stringifyQuery$1, from, targetLocation)) {
        failure = createRouterError(16, { to: toLocation, from });
        handleScroll();
      }
      return (failure ? Promise.resolve(failure) : navigate(toLocation, from)).catch((error) => isNavigationFailure(error) ? isNavigationFailure(error, 2) ? error : markAsReady(error) : triggerError(error, toLocation, from)).then((failure2) => {
        if (failure2) {
          if (isNavigationFailure(failure2, 2)) {
            return pushWithRedirect(assign(locationAsObject(failure2.to), {
              state: data,
              force,
              replace: replace2
            }), redirectedFrom || toLocation);
          }
        } else {
          failure2 = finalizeNavigation(toLocation, from, true, replace2, data);
        }
        triggerAfterEach(toLocation, from, failure2);
        return failure2;
      });
    }
    function checkCanceledNavigationAndReject(to, from) {
      const error = checkCanceledNavigation(to, from);
      return error ? Promise.reject(error) : Promise.resolve();
    }
    function navigate(to, from) {
      let guards;
      const [leavingRecords, updatingRecords, enteringRecords] = extractChangingRecords(to, from);
      guards = extractComponentsGuards(leavingRecords.reverse(), "beforeRouteLeave", to, from);
      for (const record of leavingRecords) {
        record.leaveGuards.forEach((guard) => {
          guards.push(guardToPromiseFn(guard, to, from));
        });
      }
      const canceledNavigationCheck = checkCanceledNavigationAndReject.bind(null, to, from);
      guards.push(canceledNavigationCheck);
      return runGuardQueue(guards).then(() => {
        guards = [];
        for (const guard of beforeGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = extractComponentsGuards(updatingRecords, "beforeRouteUpdate", to, from);
        for (const record of updatingRecords) {
          record.updateGuards.forEach((guard) => {
            guards.push(guardToPromiseFn(guard, to, from));
          });
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = [];
        for (const record of to.matched) {
          if (record.beforeEnter && !from.matched.includes(record)) {
            if (Array.isArray(record.beforeEnter)) {
              for (const beforeEnter of record.beforeEnter)
                guards.push(guardToPromiseFn(beforeEnter, to, from));
            } else {
              guards.push(guardToPromiseFn(record.beforeEnter, to, from));
            }
          }
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        to.matched.forEach((record) => record.enterCallbacks = {});
        guards = extractComponentsGuards(enteringRecords, "beforeRouteEnter", to, from);
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).then(() => {
        guards = [];
        for (const guard of beforeResolveGuards.list()) {
          guards.push(guardToPromiseFn(guard, to, from));
        }
        guards.push(canceledNavigationCheck);
        return runGuardQueue(guards);
      }).catch((err) => isNavigationFailure(err, 8) ? err : Promise.reject(err));
    }
    function triggerAfterEach(to, from, failure) {
      for (const guard of afterGuards.list())
        guard(to, from, failure);
    }
    function finalizeNavigation(toLocation, from, isPush, replace2, data) {
      const error = checkCanceledNavigation(toLocation, from);
      if (error)
        return error;
      const isFirstNavigation = from === START_LOCATION_NORMALIZED;
      const state2 = {};
      if (isPush) {
        if (replace2 || isFirstNavigation)
          routerHistory.replace(toLocation.fullPath, assign({
            scroll: isFirstNavigation && state2 && state2.scroll
          }, data));
        else
          routerHistory.push(toLocation.fullPath, data);
      }
      currentRoute.value = toLocation;
      handleScroll();
      markAsReady();
    }
    let removeHistoryListener;
    function setupListeners() {
      if (removeHistoryListener)
        return;
      removeHistoryListener = routerHistory.listen((to, _from, info) => {
        const toLocation = resolve(to);
        const shouldRedirect = handleRedirectRecord(toLocation);
        if (shouldRedirect) {
          pushWithRedirect(assign(shouldRedirect, { replace: true }), toLocation).catch(noop2);
          return;
        }
        pendingLocation = toLocation;
        const from = currentRoute.value;
        navigate(toLocation, from).catch((error) => {
          if (isNavigationFailure(error, 4 | 8)) {
            return error;
          }
          if (isNavigationFailure(error, 2)) {
            pushWithRedirect(error.to, toLocation).then((failure) => {
              if (isNavigationFailure(failure, 4 | 16) && !info.delta && info.type === NavigationType.pop) {
                routerHistory.go(-1, false);
              }
            }).catch(noop2);
            return Promise.reject();
          }
          if (info.delta)
            routerHistory.go(-info.delta, false);
          return triggerError(error, toLocation, from);
        }).then((failure) => {
          failure = failure || finalizeNavigation(toLocation, from, false);
          if (failure) {
            if (info.delta) {
              routerHistory.go(-info.delta, false);
            } else if (info.type === NavigationType.pop && isNavigationFailure(failure, 4 | 16)) {
              routerHistory.go(-1, false);
            }
          }
          triggerAfterEach(toLocation, from, failure);
        }).catch(noop2);
      });
    }
    let readyHandlers = useCallbacks();
    let errorHandlers = useCallbacks();
    let ready;
    function triggerError(error, to, from) {
      markAsReady(error);
      const list = errorHandlers.list();
      if (list.length) {
        list.forEach((handler) => handler(error, to, from));
      } else {
        console.error(error);
      }
      return Promise.reject(error);
    }
    function isReady() {
      if (ready && currentRoute.value !== START_LOCATION_NORMALIZED)
        return Promise.resolve();
      return new Promise((resolve2, reject) => {
        readyHandlers.add([resolve2, reject]);
      });
    }
    function markAsReady(err) {
      if (!ready) {
        ready = !err;
        setupListeners();
        readyHandlers.list().forEach(([resolve2, reject]) => err ? reject(err) : resolve2());
        readyHandlers.reset();
      }
      return err;
    }
    function handleScroll(to, from, isPush, isFirstNavigation) {
      return Promise.resolve();
    }
    const go = (delta) => routerHistory.go(delta);
    const installedApps = /* @__PURE__ */ new Set();
    const router = {
      currentRoute,
      addRoute,
      removeRoute,
      hasRoute,
      getRoutes,
      resolve,
      options,
      push,
      replace,
      go,
      back: () => go(-1),
      forward: () => go(1),
      beforeEach: beforeGuards.add,
      beforeResolve: beforeResolveGuards.add,
      afterEach: afterGuards.add,
      onError: errorHandlers.add,
      isReady,
      install(app2) {
        const router2 = this;
        app2.component("RouterLink", RouterLink);
        app2.component("RouterView", RouterView);
        app2.config.globalProperties.$router = router2;
        Object.defineProperty(app2.config.globalProperties, "$route", {
          enumerable: true,
          get: () => vue.unref(currentRoute)
        });
        const reactiveRoute = {};
        for (const key in START_LOCATION_NORMALIZED) {
          reactiveRoute[key] = vue.computed(() => currentRoute.value[key]);
        }
        app2.provide(routerKey, router2);
        app2.provide(routeLocationKey, vue.reactive(reactiveRoute));
        app2.provide(routerViewLocationKey, currentRoute);
        const unmountApp = app2.unmount;
        installedApps.add(app2);
        app2.unmount = function() {
          installedApps.delete(app2);
          if (installedApps.size < 1) {
            pendingLocation = START_LOCATION_NORMALIZED;
            removeHistoryListener && removeHistoryListener();
            removeHistoryListener = null;
            currentRoute.value = START_LOCATION_NORMALIZED;
            ready = false;
          }
          unmountApp();
        };
      }
    };
    return router;
  }
  function runGuardQueue(guards) {
    return guards.reduce((promise, guard) => promise.then(() => guard()), Promise.resolve());
  }
  function extractChangingRecords(to, from) {
    const leavingRecords = [];
    const updatingRecords = [];
    const enteringRecords = [];
    const len = Math.max(from.matched.length, to.matched.length);
    for (let i = 0; i < len; i++) {
      const recordFrom = from.matched[i];
      if (recordFrom) {
        if (to.matched.find((record) => isSameRouteRecord(record, recordFrom)))
          updatingRecords.push(recordFrom);
        else
          leavingRecords.push(recordFrom);
      }
      const recordTo = to.matched[i];
      if (recordTo) {
        if (!from.matched.find((record) => isSameRouteRecord(record, recordTo))) {
          enteringRecords.push(recordTo);
        }
      }
    }
    return [leavingRecords, updatingRecords, enteringRecords];
  }
  function useRouter2() {
    return vue.inject(routerKey);
  }
  function useRoute2() {
    return vue.inject(routeLocationKey);
  }
  exports.RouterLink = RouterLink;
  exports.RouterView = RouterView;
  exports.START_LOCATION = START_LOCATION_NORMALIZED;
  exports.createMemoryHistory = createMemoryHistory;
  exports.createRouter = createRouter;
  exports.createRouterMatcher = createRouterMatcher;
  exports.createWebHashHistory = createWebHashHistory;
  exports.createWebHistory = createWebHistory;
  exports.isNavigationFailure = isNavigationFailure;
  exports.matchedRouteKey = matchedRouteKey;
  exports.onBeforeRouteLeave = onBeforeRouteLeave;
  exports.onBeforeRouteUpdate = onBeforeRouteUpdate;
  exports.parseQuery = parseQuery;
  exports.routeLocationKey = routeLocationKey;
  exports.routerKey = routerKey;
  exports.routerViewLocationKey = routerViewLocationKey;
  exports.stringifyQuery = stringifyQuery;
  exports.useLink = useLink;
  exports.useRoute = useRoute2;
  exports.useRouter = useRouter2;
  exports.viewDepthKey = viewDepthKey;
})(vueRouter_cjs_prod);
const useState = (key, init) => {
  const nuxt = useNuxtApp();
  const state2 = vue_cjs_prod.toRef(nuxt.payload.state, key);
  if (state2.value === void 0 && init) {
    const initialValue = init();
    if (vue_cjs_prod.isRef(initialValue)) {
      nuxt.payload.state[key] = initialValue;
      return initialValue;
    }
    state2.value = initialValue;
  }
  return state2;
};
const useError = () => {
  const nuxtApp = useNuxtApp();
  return useState("error", () => nuxtApp.ssrContext.error);
};
const throwError = (_err) => {
  const nuxtApp = useNuxtApp();
  useError();
  const err = typeof _err === "string" ? new Error(_err) : _err;
  nuxtApp.callHook("app:error", err);
  {
    nuxtApp.ssrContext.error = nuxtApp.ssrContext.error || err;
  }
  return err;
};
const MIMES = {
  html: "text/html",
  json: "application/json"
};
const defer = typeof setImmediate !== "undefined" ? setImmediate : (fn) => fn();
function send(event, data, type) {
  if (type) {
    defaultContentType(event, type);
  }
  return new Promise((resolve) => {
    defer(() => {
      event.res.end(data);
      resolve(void 0);
    });
  });
}
function defaultContentType(event, type) {
  if (type && !event.res.getHeader("Content-Type")) {
    event.res.setHeader("Content-Type", type);
  }
}
function sendRedirect(event, location2, code = 302) {
  event.res.statusCode = code;
  event.res.setHeader("Location", location2);
  return send(event, "Redirecting to " + location2, MIMES.html);
}
class H3Error extends Error {
  constructor() {
    super(...arguments);
    this.statusCode = 500;
    this.statusMessage = "Internal Server Error";
  }
}
function createError(input) {
  var _a;
  if (typeof input === "string") {
    return new H3Error(input);
  }
  if (input instanceof H3Error) {
    return input;
  }
  const err = new H3Error((_a = input.message) != null ? _a : input.statusMessage, input.cause ? { cause: input.cause } : void 0);
  if (input.statusCode) {
    err.statusCode = input.statusCode;
  }
  if (input.statusMessage) {
    err.statusMessage = input.statusMessage;
  }
  if (input.data) {
    err.data = input.data;
  }
  return err;
}
const useRouter = () => {
  var _a;
  return (_a = useNuxtApp()) == null ? void 0 : _a.$router;
};
const useRoute = () => {
  return useNuxtApp()._route;
};
const navigateTo = (to, options = {}) => {
  if (!to) {
    to = "/";
  }
  const router = useRouter();
  {
    const nuxtApp = useNuxtApp();
    if (nuxtApp.ssrContext && nuxtApp.ssrContext.event) {
      const redirectLocation = joinURL(useRuntimeConfig().app.baseURL, router.resolve(to).fullPath || "/");
      return nuxtApp.callHook("app:redirected").then(() => sendRedirect(nuxtApp.ssrContext.event, redirectLocation, options.redirectCode || 302));
    }
  }
  return options.replace ? router.replace(to) : router.push(to);
};
const firstNonUndefined = (...args) => args.find((arg) => arg !== void 0);
const DEFAULT_EXTERNAL_REL_ATTRIBUTE = "noopener noreferrer";
function defineNuxtLink(options) {
  const componentName = options.componentName || "NuxtLink";
  const checkPropConflicts = (props, main, sub) => {
  };
  return vue_cjs_prod.defineComponent({
    name: componentName,
    props: {
      to: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      href: {
        type: [String, Object],
        default: void 0,
        required: false
      },
      target: {
        type: String,
        default: void 0,
        required: false
      },
      rel: {
        type: String,
        default: void 0,
        required: false
      },
      noRel: {
        type: Boolean,
        default: void 0,
        required: false
      },
      activeClass: {
        type: String,
        default: void 0,
        required: false
      },
      exactActiveClass: {
        type: String,
        default: void 0,
        required: false
      },
      replace: {
        type: Boolean,
        default: void 0,
        required: false
      },
      ariaCurrentValue: {
        type: String,
        default: void 0,
        required: false
      },
      external: {
        type: Boolean,
        default: void 0,
        required: false
      },
      custom: {
        type: Boolean,
        default: void 0,
        required: false
      }
    },
    setup(props, { slots }) {
      const router = useRouter();
      const to = vue_cjs_prod.computed(() => {
        checkPropConflicts();
        return props.to || props.href || "";
      });
      const isExternal = vue_cjs_prod.computed(() => {
        if (props.external) {
          return true;
        }
        if (props.target && props.target !== "_self") {
          return true;
        }
        if (typeof to.value === "object") {
          return false;
        }
        return to.value === "" || hasProtocol(to.value, true);
      });
      return () => {
        var _a, _b, _c;
        if (!isExternal.value) {
          return vue_cjs_prod.h(vue_cjs_prod.resolveComponent("RouterLink"), {
            to: to.value,
            activeClass: props.activeClass || options.activeClass,
            exactActiveClass: props.exactActiveClass || options.exactActiveClass,
            replace: props.replace,
            ariaCurrentValue: props.ariaCurrentValue
          }, slots.default);
        }
        const href = typeof to.value === "object" ? (_b = (_a = router.resolve(to.value)) == null ? void 0 : _a.href) != null ? _b : null : to.value || null;
        const target = props.target || null;
        checkPropConflicts();
        const rel = props.noRel ? null : firstNonUndefined(props.rel, options.externalRelAttribute, href ? DEFAULT_EXTERNAL_REL_ATTRIBUTE : "") || null;
        return vue_cjs_prod.h("a", { href, rel, target }, (_c = slots.default) == null ? void 0 : _c.call(slots));
      };
    }
  });
}
const __nuxt_component_0 = defineNuxtLink({ componentName: "NuxtLink" });
var shared_cjs_prod = {};
Object.defineProperty(shared_cjs_prod, "__esModule", { value: true });
function makeMap(str, expectsLowerCase) {
  const map = /* @__PURE__ */ Object.create(null);
  const list = str.split(",");
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true;
  }
  return expectsLowerCase ? (val) => !!map[val.toLowerCase()] : (val) => !!map[val];
}
const PatchFlagNames = {
  [1]: `TEXT`,
  [2]: `CLASS`,
  [4]: `STYLE`,
  [8]: `PROPS`,
  [16]: `FULL_PROPS`,
  [32]: `HYDRATE_EVENTS`,
  [64]: `STABLE_FRAGMENT`,
  [128]: `KEYED_FRAGMENT`,
  [256]: `UNKEYED_FRAGMENT`,
  [512]: `NEED_PATCH`,
  [1024]: `DYNAMIC_SLOTS`,
  [2048]: `DEV_ROOT_FRAGMENT`,
  [-1]: `HOISTED`,
  [-2]: `BAIL`
};
const slotFlagsText = {
  [1]: "STABLE",
  [2]: "DYNAMIC",
  [3]: "FORWARDED"
};
const GLOBALS_WHITE_LISTED = "Infinity,undefined,NaN,isFinite,isNaN,parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt";
const isGloballyWhitelisted = /* @__PURE__ */ makeMap(GLOBALS_WHITE_LISTED);
const range = 2;
function generateCodeFrame(source, start = 0, end = source.length) {
  let lines = source.split(/(\r?\n)/);
  const newlineSequences = lines.filter((_, idx) => idx % 2 === 1);
  lines = lines.filter((_, idx) => idx % 2 === 0);
  let count = 0;
  const res = [];
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + (newlineSequences[i] && newlineSequences[i].length || 0);
    if (count >= start) {
      for (let j = i - range; j <= i + range || end > count; j++) {
        if (j < 0 || j >= lines.length)
          continue;
        const line = j + 1;
        res.push(`${line}${" ".repeat(Math.max(3 - String(line).length, 0))}|  ${lines[j]}`);
        const lineLength = lines[j].length;
        const newLineSeqLength = newlineSequences[j] && newlineSequences[j].length || 0;
        if (j === i) {
          const pad = start - (count - (lineLength + newLineSeqLength));
          const length = Math.max(1, end > count ? lineLength - pad : end - start);
          res.push(`   |  ` + " ".repeat(pad) + "^".repeat(length));
        } else if (j > i) {
          if (end > count) {
            const length = Math.max(Math.min(end - count, lineLength), 1);
            res.push(`   |  ` + "^".repeat(length));
          }
          count += lineLength + newLineSeqLength;
        }
      }
      break;
    }
  }
  return res.join("\n");
}
const specialBooleanAttrs = `itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,readonly`;
const isSpecialBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs);
const isBooleanAttr = /* @__PURE__ */ makeMap(specialBooleanAttrs + `,async,autofocus,autoplay,controls,default,defer,disabled,hidden,loop,open,required,reversed,scoped,seamless,checked,muted,multiple,selected`);
function includeBooleanAttr(value) {
  return !!value || value === "";
}
const unsafeAttrCharRE = /[>/="'\u0009\u000a\u000c\u0020]/;
const attrValidationCache = {};
function isSSRSafeAttrName(name2) {
  if (attrValidationCache.hasOwnProperty(name2)) {
    return attrValidationCache[name2];
  }
  const isUnsafe = unsafeAttrCharRE.test(name2);
  if (isUnsafe) {
    console.error(`unsafe attribute name: ${name2}`);
  }
  return attrValidationCache[name2] = !isUnsafe;
}
const propsToAttrMap = {
  acceptCharset: "accept-charset",
  className: "class",
  htmlFor: "for",
  httpEquiv: "http-equiv"
};
const isNoUnitNumericStyleProp = /* @__PURE__ */ makeMap(`animation-iteration-count,border-image-outset,border-image-slice,border-image-width,box-flex,box-flex-group,box-ordinal-group,column-count,columns,flex,flex-grow,flex-positive,flex-shrink,flex-negative,flex-order,grid-row,grid-row-end,grid-row-span,grid-row-start,grid-column,grid-column-end,grid-column-span,grid-column-start,font-weight,line-clamp,line-height,opacity,order,orphans,tab-size,widows,z-index,zoom,fill-opacity,flood-opacity,stop-opacity,stroke-dasharray,stroke-dashoffset,stroke-miterlimit,stroke-opacity,stroke-width`);
const isKnownHtmlAttr = /* @__PURE__ */ makeMap(`accept,accept-charset,accesskey,action,align,allow,alt,async,autocapitalize,autocomplete,autofocus,autoplay,background,bgcolor,border,buffered,capture,challenge,charset,checked,cite,class,code,codebase,color,cols,colspan,content,contenteditable,contextmenu,controls,coords,crossorigin,csp,data,datetime,decoding,default,defer,dir,dirname,disabled,download,draggable,dropzone,enctype,enterkeyhint,for,form,formaction,formenctype,formmethod,formnovalidate,formtarget,headers,height,hidden,high,href,hreflang,http-equiv,icon,id,importance,integrity,ismap,itemprop,keytype,kind,label,lang,language,loading,list,loop,low,manifest,max,maxlength,minlength,media,min,multiple,muted,name,novalidate,open,optimum,pattern,ping,placeholder,poster,preload,radiogroup,readonly,referrerpolicy,rel,required,reversed,rows,rowspan,sandbox,scope,scoped,selected,shape,size,sizes,slot,span,spellcheck,src,srcdoc,srclang,srcset,start,step,style,summary,tabindex,target,title,translate,type,usemap,value,width,wrap`);
const isKnownSvgAttr = /* @__PURE__ */ makeMap(`xmlns,accent-height,accumulate,additive,alignment-baseline,alphabetic,amplitude,arabic-form,ascent,attributeName,attributeType,azimuth,baseFrequency,baseline-shift,baseProfile,bbox,begin,bias,by,calcMode,cap-height,class,clip,clipPathUnits,clip-path,clip-rule,color,color-interpolation,color-interpolation-filters,color-profile,color-rendering,contentScriptType,contentStyleType,crossorigin,cursor,cx,cy,d,decelerate,descent,diffuseConstant,direction,display,divisor,dominant-baseline,dur,dx,dy,edgeMode,elevation,enable-background,end,exponent,fill,fill-opacity,fill-rule,filter,filterRes,filterUnits,flood-color,flood-opacity,font-family,font-size,font-size-adjust,font-stretch,font-style,font-variant,font-weight,format,from,fr,fx,fy,g1,g2,glyph-name,glyph-orientation-horizontal,glyph-orientation-vertical,glyphRef,gradientTransform,gradientUnits,hanging,height,href,hreflang,horiz-adv-x,horiz-origin-x,id,ideographic,image-rendering,in,in2,intercept,k,k1,k2,k3,k4,kernelMatrix,kernelUnitLength,kerning,keyPoints,keySplines,keyTimes,lang,lengthAdjust,letter-spacing,lighting-color,limitingConeAngle,local,marker-end,marker-mid,marker-start,markerHeight,markerUnits,markerWidth,mask,maskContentUnits,maskUnits,mathematical,max,media,method,min,mode,name,numOctaves,offset,opacity,operator,order,orient,orientation,origin,overflow,overline-position,overline-thickness,panose-1,paint-order,path,pathLength,patternContentUnits,patternTransform,patternUnits,ping,pointer-events,points,pointsAtX,pointsAtY,pointsAtZ,preserveAlpha,preserveAspectRatio,primitiveUnits,r,radius,referrerPolicy,refX,refY,rel,rendering-intent,repeatCount,repeatDur,requiredExtensions,requiredFeatures,restart,result,rotate,rx,ry,scale,seed,shape-rendering,slope,spacing,specularConstant,specularExponent,speed,spreadMethod,startOffset,stdDeviation,stemh,stemv,stitchTiles,stop-color,stop-opacity,strikethrough-position,strikethrough-thickness,string,stroke,stroke-dasharray,stroke-dashoffset,stroke-linecap,stroke-linejoin,stroke-miterlimit,stroke-opacity,stroke-width,style,surfaceScale,systemLanguage,tabindex,tableValues,target,targetX,targetY,text-anchor,text-decoration,text-rendering,textLength,to,transform,transform-origin,type,u1,u2,underline-position,underline-thickness,unicode,unicode-bidi,unicode-range,units-per-em,v-alphabetic,v-hanging,v-ideographic,v-mathematical,values,vector-effect,version,vert-adv-y,vert-origin-x,vert-origin-y,viewBox,viewTarget,visibility,width,widths,word-spacing,writing-mode,x,x-height,x1,x2,xChannelSelector,xlink:actuate,xlink:arcrole,xlink:href,xlink:role,xlink:show,xlink:title,xlink:type,xml:base,xml:lang,xml:space,y,y1,y2,yChannelSelector,z,zoomAndPan`);
function normalizeStyle(value) {
  if (isArray(value)) {
    const res = {};
    for (let i = 0; i < value.length; i++) {
      const item = value[i];
      const normalized = isString$1(item) ? parseStringStyle(item) : normalizeStyle(item);
      if (normalized) {
        for (const key in normalized) {
          res[key] = normalized[key];
        }
      }
    }
    return res;
  } else if (isString$1(value)) {
    return value;
  } else if (isObject$1(value)) {
    return value;
  }
}
const listDelimiterRE = /;(?![^(]*\))/g;
const propertyDelimiterRE = /:(.+)/;
function parseStringStyle(cssText) {
  const ret = {};
  cssText.split(listDelimiterRE).forEach((item) => {
    if (item) {
      const tmp = item.split(propertyDelimiterRE);
      tmp.length > 1 && (ret[tmp[0].trim()] = tmp[1].trim());
    }
  });
  return ret;
}
function stringifyStyle(styles) {
  let ret = "";
  if (!styles || isString$1(styles)) {
    return ret;
  }
  for (const key in styles) {
    const value = styles[key];
    const normalizedKey = key.startsWith(`--`) ? key : hyphenate(key);
    if (isString$1(value) || typeof value === "number" && isNoUnitNumericStyleProp(normalizedKey)) {
      ret += `${normalizedKey}:${value};`;
    }
  }
  return ret;
}
function normalizeClass(value) {
  let res = "";
  if (isString$1(value)) {
    res = value;
  } else if (isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const normalized = normalizeClass(value[i]);
      if (normalized) {
        res += normalized + " ";
      }
    }
  } else if (isObject$1(value)) {
    for (const name2 in value) {
      if (value[name2]) {
        res += name2 + " ";
      }
    }
  }
  return res.trim();
}
function normalizeProps(props) {
  if (!props)
    return null;
  let { class: klass, style } = props;
  if (klass && !isString$1(klass)) {
    props.class = normalizeClass(klass);
  }
  if (style) {
    props.style = normalizeStyle(style);
  }
  return props;
}
const HTML_TAGS = "html,body,base,head,link,meta,style,title,address,article,aside,footer,header,h1,h2,h3,h4,h5,h6,nav,section,div,dd,dl,dt,figcaption,figure,picture,hr,img,li,main,ol,p,pre,ul,a,b,abbr,bdi,bdo,br,cite,code,data,dfn,em,i,kbd,mark,q,rp,rt,ruby,s,samp,small,span,strong,sub,sup,time,u,var,wbr,area,audio,map,track,video,embed,object,param,source,canvas,script,noscript,del,ins,caption,col,colgroup,table,thead,tbody,td,th,tr,button,datalist,fieldset,form,input,label,legend,meter,optgroup,option,output,progress,select,textarea,details,dialog,menu,summary,template,blockquote,iframe,tfoot";
const SVG_TAGS = "svg,animate,animateMotion,animateTransform,circle,clipPath,color-profile,defs,desc,discard,ellipse,feBlend,feColorMatrix,feComponentTransfer,feComposite,feConvolveMatrix,feDiffuseLighting,feDisplacementMap,feDistanceLight,feDropShadow,feFlood,feFuncA,feFuncB,feFuncG,feFuncR,feGaussianBlur,feImage,feMerge,feMergeNode,feMorphology,feOffset,fePointLight,feSpecularLighting,feSpotLight,feTile,feTurbulence,filter,foreignObject,g,hatch,hatchpath,image,line,linearGradient,marker,mask,mesh,meshgradient,meshpatch,meshrow,metadata,mpath,path,pattern,polygon,polyline,radialGradient,rect,set,solidcolor,stop,switch,symbol,text,textPath,title,tspan,unknown,use,view";
const VOID_TAGS = "area,base,br,col,embed,hr,img,input,link,meta,param,source,track,wbr";
const isHTMLTag = /* @__PURE__ */ makeMap(HTML_TAGS);
const isSVGTag = /* @__PURE__ */ makeMap(SVG_TAGS);
const isVoidTag = /* @__PURE__ */ makeMap(VOID_TAGS);
const escapeRE = /["'&<>]/;
function escapeHtml(string) {
  const str = "" + string;
  const match = escapeRE.exec(str);
  if (!match) {
    return str;
  }
  let html = "";
  let escaped;
  let index;
  let lastIndex = 0;
  for (index = match.index; index < str.length; index++) {
    switch (str.charCodeAt(index)) {
      case 34:
        escaped = "&quot;";
        break;
      case 38:
        escaped = "&amp;";
        break;
      case 39:
        escaped = "&#39;";
        break;
      case 60:
        escaped = "&lt;";
        break;
      case 62:
        escaped = "&gt;";
        break;
      default:
        continue;
    }
    if (lastIndex !== index) {
      html += str.slice(lastIndex, index);
    }
    lastIndex = index + 1;
    html += escaped;
  }
  return lastIndex !== index ? html + str.slice(lastIndex, index) : html;
}
const commentStripRE = /^-?>|<!--|-->|--!>|<!-$/g;
function escapeHtmlComment(src) {
  return src.replace(commentStripRE, "");
}
function looseCompareArrays(a, b) {
  if (a.length !== b.length)
    return false;
  let equal = true;
  for (let i = 0; equal && i < a.length; i++) {
    equal = looseEqual(a[i], b[i]);
  }
  return equal;
}
function looseEqual(a, b) {
  if (a === b)
    return true;
  let aValidType = isDate(a);
  let bValidType = isDate(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? a.getTime() === b.getTime() : false;
  }
  aValidType = isSymbol(a);
  bValidType = isSymbol(b);
  if (aValidType || bValidType) {
    return a === b;
  }
  aValidType = isArray(a);
  bValidType = isArray(b);
  if (aValidType || bValidType) {
    return aValidType && bValidType ? looseCompareArrays(a, b) : false;
  }
  aValidType = isObject$1(a);
  bValidType = isObject$1(b);
  if (aValidType || bValidType) {
    if (!aValidType || !bValidType) {
      return false;
    }
    const aKeysCount = Object.keys(a).length;
    const bKeysCount = Object.keys(b).length;
    if (aKeysCount !== bKeysCount) {
      return false;
    }
    for (const key in a) {
      const aHasKey = a.hasOwnProperty(key);
      const bHasKey = b.hasOwnProperty(key);
      if (aHasKey && !bHasKey || !aHasKey && bHasKey || !looseEqual(a[key], b[key])) {
        return false;
      }
    }
  }
  return String(a) === String(b);
}
function looseIndexOf(arr, val) {
  return arr.findIndex((item) => looseEqual(item, val));
}
const toDisplayString = (val) => {
  return isString$1(val) ? val : val == null ? "" : isArray(val) || isObject$1(val) && (val.toString === objectToString || !isFunction(val.toString)) ? JSON.stringify(val, replacer, 2) : String(val);
};
const replacer = (_key, val) => {
  if (val && val.__v_isRef) {
    return replacer(_key, val.value);
  } else if (isMap(val)) {
    return {
      [`Map(${val.size})`]: [...val.entries()].reduce((entries, [key, val2]) => {
        entries[`${key} =>`] = val2;
        return entries;
      }, {})
    };
  } else if (isSet(val)) {
    return {
      [`Set(${val.size})`]: [...val.values()]
    };
  } else if (isObject$1(val) && !isArray(val) && !isPlainObject(val)) {
    return String(val);
  }
  return val;
};
const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const NOOP = () => {
};
const NO = () => false;
const onRE = /^on[^a-z]/;
const isOn = (key) => onRE.test(key);
const isModelListener = (key) => key.startsWith("onUpdate:");
const extend = Object.assign;
const remove = (arr, el) => {
  const i = arr.indexOf(el);
  if (i > -1) {
    arr.splice(i, 1);
  }
};
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (val, key) => hasOwnProperty.call(val, key);
const isArray = Array.isArray;
const isMap = (val) => toTypeString(val) === "[object Map]";
const isSet = (val) => toTypeString(val) === "[object Set]";
const isDate = (val) => toTypeString(val) === "[object Date]";
const isFunction = (val) => typeof val === "function";
const isString$1 = (val) => typeof val === "string";
const isSymbol = (val) => typeof val === "symbol";
const isObject$1 = (val) => val !== null && typeof val === "object";
const isPromise = (val) => {
  return isObject$1(val) && isFunction(val.then) && isFunction(val.catch);
};
const objectToString = Object.prototype.toString;
const toTypeString = (value) => objectToString.call(value);
const toRawType = (value) => {
  return toTypeString(value).slice(8, -1);
};
const isPlainObject = (val) => toTypeString(val) === "[object Object]";
const isIntegerKey = (key) => isString$1(key) && key !== "NaN" && key[0] !== "-" && "" + parseInt(key, 10) === key;
const isReservedProp = /* @__PURE__ */ makeMap(",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted");
const isBuiltInDirective = /* @__PURE__ */ makeMap("bind,cloak,else-if,else,for,html,if,model,on,once,pre,show,slot,text,memo");
const cacheStringFunction = (fn) => {
  const cache = /* @__PURE__ */ Object.create(null);
  return (str) => {
    const hit = cache[str];
    return hit || (cache[str] = fn(str));
  };
};
const camelizeRE = /-(\w)/g;
const camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : "");
});
const hyphenateRE = /\B([A-Z])/g;
const hyphenate = cacheStringFunction((str) => str.replace(hyphenateRE, "-$1").toLowerCase());
const capitalize = cacheStringFunction((str) => str.charAt(0).toUpperCase() + str.slice(1));
const toHandlerKey = cacheStringFunction((str) => str ? `on${capitalize(str)}` : ``);
const hasChanged = (value, oldValue) => !Object.is(value, oldValue);
const invokeArrayFns = (fns, arg) => {
  for (let i = 0; i < fns.length; i++) {
    fns[i](arg);
  }
};
const def = (obj, key, value) => {
  Object.defineProperty(obj, key, {
    configurable: true,
    enumerable: false,
    value
  });
};
const toNumber = (val) => {
  const n = parseFloat(val);
  return isNaN(n) ? val : n;
};
let _globalThis;
const getGlobalThis = () => {
  return _globalThis || (_globalThis = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof commonjsGlobal !== "undefined" ? commonjsGlobal : {});
};
const identRE = /^[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*$/;
function genPropsAccessExp(name2) {
  return identRE.test(name2) ? `__props.${name2}` : `__props[${JSON.stringify(name2)}]`;
}
shared_cjs_prod.EMPTY_ARR = EMPTY_ARR;
shared_cjs_prod.EMPTY_OBJ = EMPTY_OBJ;
shared_cjs_prod.NO = NO;
shared_cjs_prod.NOOP = NOOP;
shared_cjs_prod.PatchFlagNames = PatchFlagNames;
shared_cjs_prod.camelize = camelize;
shared_cjs_prod.capitalize = capitalize;
shared_cjs_prod.def = def;
shared_cjs_prod.escapeHtml = escapeHtml;
shared_cjs_prod.escapeHtmlComment = escapeHtmlComment;
shared_cjs_prod.extend = extend;
shared_cjs_prod.genPropsAccessExp = genPropsAccessExp;
shared_cjs_prod.generateCodeFrame = generateCodeFrame;
shared_cjs_prod.getGlobalThis = getGlobalThis;
shared_cjs_prod.hasChanged = hasChanged;
shared_cjs_prod.hasOwn = hasOwn;
shared_cjs_prod.hyphenate = hyphenate;
shared_cjs_prod.includeBooleanAttr = includeBooleanAttr;
shared_cjs_prod.invokeArrayFns = invokeArrayFns;
shared_cjs_prod.isArray = isArray;
shared_cjs_prod.isBooleanAttr = isBooleanAttr;
shared_cjs_prod.isBuiltInDirective = isBuiltInDirective;
shared_cjs_prod.isDate = isDate;
var isFunction_1 = shared_cjs_prod.isFunction = isFunction;
shared_cjs_prod.isGloballyWhitelisted = isGloballyWhitelisted;
shared_cjs_prod.isHTMLTag = isHTMLTag;
shared_cjs_prod.isIntegerKey = isIntegerKey;
shared_cjs_prod.isKnownHtmlAttr = isKnownHtmlAttr;
shared_cjs_prod.isKnownSvgAttr = isKnownSvgAttr;
shared_cjs_prod.isMap = isMap;
shared_cjs_prod.isModelListener = isModelListener;
shared_cjs_prod.isNoUnitNumericStyleProp = isNoUnitNumericStyleProp;
shared_cjs_prod.isObject = isObject$1;
shared_cjs_prod.isOn = isOn;
shared_cjs_prod.isPlainObject = isPlainObject;
shared_cjs_prod.isPromise = isPromise;
shared_cjs_prod.isReservedProp = isReservedProp;
shared_cjs_prod.isSSRSafeAttrName = isSSRSafeAttrName;
shared_cjs_prod.isSVGTag = isSVGTag;
shared_cjs_prod.isSet = isSet;
shared_cjs_prod.isSpecialBooleanAttr = isSpecialBooleanAttr;
shared_cjs_prod.isString = isString$1;
shared_cjs_prod.isSymbol = isSymbol;
shared_cjs_prod.isVoidTag = isVoidTag;
shared_cjs_prod.looseEqual = looseEqual;
shared_cjs_prod.looseIndexOf = looseIndexOf;
shared_cjs_prod.makeMap = makeMap;
shared_cjs_prod.normalizeClass = normalizeClass;
shared_cjs_prod.normalizeProps = normalizeProps;
shared_cjs_prod.normalizeStyle = normalizeStyle;
shared_cjs_prod.objectToString = objectToString;
shared_cjs_prod.parseStringStyle = parseStringStyle;
shared_cjs_prod.propsToAttrMap = propsToAttrMap;
shared_cjs_prod.remove = remove;
shared_cjs_prod.slotFlagsText = slotFlagsText;
shared_cjs_prod.stringifyStyle = stringifyStyle;
shared_cjs_prod.toDisplayString = toDisplayString;
shared_cjs_prod.toHandlerKey = toHandlerKey;
shared_cjs_prod.toNumber = toNumber;
shared_cjs_prod.toRawType = toRawType;
shared_cjs_prod.toTypeString = toTypeString;
function useHead(meta2) {
  const resolvedMeta = isFunction_1(meta2) ? vue_cjs_prod.computed(meta2) : meta2;
  useNuxtApp()._useHead(resolvedMeta);
}
const preload = defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.mixin({
    beforeCreate() {
      const { _registeredComponents } = this.$nuxt.ssrContext;
      const { __moduleIdentifier } = this.$options;
      _registeredComponents.add(__moduleIdentifier);
    }
  });
});
const components = {};
function _47Users_47meetqy_47Desktop_47nuxt_45temp_47_46nuxt_47components_46plugin_46mjs(nuxtApp) {
  for (const name2 in components) {
    nuxtApp.vueApp.component(name2, components[name2]);
    nuxtApp.vueApp.component("Lazy" + name2, components[name2]);
  }
}
var __defProp = Object.defineProperty;
var __defProps = Object.defineProperties;
var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};
var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
var PROVIDE_KEY = `usehead`;
var HEAD_COUNT_KEY = `head:count`;
var HEAD_ATTRS_KEY = `data-head-attrs`;
var SELF_CLOSING_TAGS = ["meta", "link", "base"];
var createElement = (tag, attrs, document2) => {
  const el = document2.createElement(tag);
  for (const key of Object.keys(attrs)) {
    let value = attrs[key];
    if (key === "key" || value === false) {
      continue;
    }
    if (key === "children") {
      el.textContent = value;
    } else {
      el.setAttribute(key, value);
    }
  }
  return el;
};
var htmlEscape = (str) => str.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
var stringifyAttrs = (attributes) => {
  const handledAttributes = [];
  for (let [key, value] of Object.entries(attributes)) {
    if (key === "children" || key === "key") {
      continue;
    }
    if (value === false || value == null) {
      continue;
    }
    let attribute = htmlEscape(key);
    if (value !== true) {
      attribute += `="${htmlEscape(String(value))}"`;
    }
    handledAttributes.push(attribute);
  }
  return handledAttributes.length > 0 ? " " + handledAttributes.join(" ") : "";
};
function isEqualNode(oldTag, newTag) {
  if (oldTag instanceof HTMLElement && newTag instanceof HTMLElement) {
    const nonce = newTag.getAttribute("nonce");
    if (nonce && !oldTag.getAttribute("nonce")) {
      const cloneTag = newTag.cloneNode(true);
      cloneTag.setAttribute("nonce", "");
      cloneTag.nonce = nonce;
      return nonce === oldTag.nonce && oldTag.isEqualNode(cloneTag);
    }
  }
  return oldTag.isEqualNode(newTag);
}
var getTagKey = (props) => {
  const names = ["key", "id", "name", "property"];
  for (const n of names) {
    const value = typeof props.getAttribute === "function" ? props.hasAttribute(n) ? props.getAttribute(n) : void 0 : props[n];
    if (value !== void 0) {
      return { name: n, value };
    }
  }
};
var acceptFields = [
  "title",
  "meta",
  "link",
  "base",
  "style",
  "script",
  "htmlAttrs",
  "bodyAttrs"
];
var headObjToTags = (obj) => {
  const tags = [];
  for (const key of Object.keys(obj)) {
    if (obj[key] == null)
      continue;
    if (key === "title") {
      tags.push({ tag: key, props: { children: obj[key] } });
    } else if (key === "base") {
      tags.push({ tag: key, props: __spreadValues({ key: "default" }, obj[key]) });
    } else if (acceptFields.includes(key)) {
      const value = obj[key];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          tags.push({ tag: key, props: item });
        });
      } else if (value) {
        tags.push({ tag: key, props: value });
      }
    }
  }
  return tags;
};
var setAttrs = (el, attrs) => {
  const existingAttrs = el.getAttribute(HEAD_ATTRS_KEY);
  if (existingAttrs) {
    for (const key of existingAttrs.split(",")) {
      if (!(key in attrs)) {
        el.removeAttribute(key);
      }
    }
  }
  const keys = [];
  for (const key in attrs) {
    const value = attrs[key];
    if (value == null)
      continue;
    if (value === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
    keys.push(key);
  }
  if (keys.length) {
    el.setAttribute(HEAD_ATTRS_KEY, keys.join(","));
  } else {
    el.removeAttribute(HEAD_ATTRS_KEY);
  }
};
var updateElements = (document2 = window.document, type, tags) => {
  var _a;
  const head = document2.head;
  let headCountEl = head.querySelector(`meta[name="${HEAD_COUNT_KEY}"]`);
  const headCount = headCountEl ? Number(headCountEl.getAttribute("content")) : 0;
  const oldElements = [];
  if (headCountEl) {
    for (let i = 0, j = headCountEl.previousElementSibling; i < headCount; i++, j = (j == null ? void 0 : j.previousElementSibling) || null) {
      if (((_a = j == null ? void 0 : j.tagName) == null ? void 0 : _a.toLowerCase()) === type) {
        oldElements.push(j);
      }
    }
  } else {
    headCountEl = document2.createElement("meta");
    headCountEl.setAttribute("name", HEAD_COUNT_KEY);
    headCountEl.setAttribute("content", "0");
    head.append(headCountEl);
  }
  let newElements = tags.map((tag) => createElement(tag.tag, tag.props, document2));
  newElements = newElements.filter((newEl) => {
    for (let i = 0; i < oldElements.length; i++) {
      const oldEl = oldElements[i];
      if (isEqualNode(oldEl, newEl)) {
        oldElements.splice(i, 1);
        return false;
      }
    }
    return true;
  });
  oldElements.forEach((t) => {
    var _a2;
    return (_a2 = t.parentNode) == null ? void 0 : _a2.removeChild(t);
  });
  newElements.forEach((t) => {
    head.insertBefore(t, headCountEl);
  });
  headCountEl.setAttribute("content", "" + (headCount - oldElements.length + newElements.length));
};
var createHead = () => {
  let allHeadObjs = [];
  let previousTags = /* @__PURE__ */ new Set();
  const head = {
    install(app2) {
      app2.config.globalProperties.$head = head;
      app2.provide(PROVIDE_KEY, head);
    },
    get headTags() {
      const deduped = [];
      allHeadObjs.forEach((objs) => {
        const tags = headObjToTags(objs.value);
        tags.forEach((tag) => {
          if (tag.tag === "meta" || tag.tag === "base" || tag.tag === "script") {
            const key = getTagKey(tag.props);
            if (key) {
              let index = -1;
              for (let i = 0; i < deduped.length; i++) {
                const prev = deduped[i];
                const prevValue = prev.props[key.name];
                const nextValue = tag.props[key.name];
                if (prev.tag === tag.tag && prevValue === nextValue) {
                  index = i;
                  break;
                }
              }
              if (index !== -1) {
                deduped.splice(index, 1);
              }
            }
          }
          deduped.push(tag);
        });
      });
      return deduped;
    },
    addHeadObjs(objs) {
      allHeadObjs.push(objs);
    },
    removeHeadObjs(objs) {
      allHeadObjs = allHeadObjs.filter((_objs) => _objs !== objs);
    },
    updateDOM(document2 = window.document) {
      let title2;
      let htmlAttrs = {};
      let bodyAttrs = {};
      const actualTags = {};
      for (const tag of head.headTags) {
        if (tag.tag === "title") {
          title2 = tag.props.children;
          continue;
        }
        if (tag.tag === "htmlAttrs") {
          Object.assign(htmlAttrs, tag.props);
          continue;
        }
        if (tag.tag === "bodyAttrs") {
          Object.assign(bodyAttrs, tag.props);
          continue;
        }
        actualTags[tag.tag] = actualTags[tag.tag] || [];
        actualTags[tag.tag].push(tag);
      }
      if (title2 !== void 0) {
        document2.title = title2;
      }
      setAttrs(document2.documentElement, htmlAttrs);
      setAttrs(document2.body, bodyAttrs);
      const tags = /* @__PURE__ */ new Set([...Object.keys(actualTags), ...previousTags]);
      for (const tag of tags) {
        updateElements(document2, tag, actualTags[tag] || []);
      }
      previousTags.clear();
      Object.keys(actualTags).forEach((i) => previousTags.add(i));
    }
  };
  return head;
};
var tagToString = (tag) => {
  let attrs = stringifyAttrs(tag.props);
  if (SELF_CLOSING_TAGS.includes(tag.tag)) {
    return `<${tag.tag}${attrs}>`;
  }
  return `<${tag.tag}${attrs}>${tag.props.children || ""}</${tag.tag}>`;
};
var renderHeadToString = (head) => {
  const tags = [];
  let titleTag = "";
  let htmlAttrs = {};
  let bodyAttrs = {};
  for (const tag of head.headTags) {
    if (tag.tag === "title") {
      titleTag = tagToString(tag);
    } else if (tag.tag === "htmlAttrs") {
      Object.assign(htmlAttrs, tag.props);
    } else if (tag.tag === "bodyAttrs") {
      Object.assign(bodyAttrs, tag.props);
    } else {
      tags.push(tagToString(tag));
    }
  }
  tags.push(`<meta name="${HEAD_COUNT_KEY}" content="${tags.length}">`);
  return {
    get headTags() {
      return titleTag + tags.join("");
    },
    get htmlAttrs() {
      return stringifyAttrs(__spreadProps(__spreadValues({}, htmlAttrs), {
        [HEAD_ATTRS_KEY]: Object.keys(htmlAttrs).join(",")
      }));
    },
    get bodyAttrs() {
      return stringifyAttrs(__spreadProps(__spreadValues({}, bodyAttrs), {
        [HEAD_ATTRS_KEY]: Object.keys(bodyAttrs).join(",")
      }));
    }
  };
};
function isObject(val) {
  return val !== null && typeof val === "object";
}
function _defu(baseObj, defaults, namespace = ".", merger) {
  if (!isObject(defaults)) {
    return _defu(baseObj, {}, namespace, merger);
  }
  const obj = Object.assign({}, defaults);
  for (const key in baseObj) {
    if (key === "__proto__" || key === "constructor") {
      continue;
    }
    const val = baseObj[key];
    if (val === null || val === void 0) {
      continue;
    }
    if (merger && merger(obj, key, val, namespace)) {
      continue;
    }
    if (Array.isArray(val) && Array.isArray(obj[key])) {
      obj[key] = val.concat(obj[key]);
    } else if (isObject(val) && isObject(obj[key])) {
      obj[key] = _defu(val, obj[key], (namespace ? `${namespace}.` : "") + key.toString(), merger);
    } else {
      obj[key] = val;
    }
  }
  return obj;
}
function createDefu(merger) {
  return (...args) => args.reduce((p, c) => _defu(p, c, "", merger), {});
}
const defu = createDefu();
const _47Users_47meetqy_47Desktop_47nuxt_45temp_47node_modules_47nuxt_47dist_47head_47runtime_47lib_47vueuse_45head_46plugin = defineNuxtPlugin((nuxtApp) => {
  const head = createHead();
  nuxtApp.vueApp.use(head);
  nuxtApp.hooks.hookOnce("app:mounted", () => {
    vue_cjs_prod.watchEffect(() => {
      head.updateDOM();
    });
  });
  const titleTemplate = vue_cjs_prod.ref();
  nuxtApp._useHead = (_meta) => {
    const meta2 = vue_cjs_prod.ref(_meta);
    if ("titleTemplate" in meta2.value) {
      titleTemplate.value = meta2.value.titleTemplate;
    }
    const headObj = vue_cjs_prod.computed(() => {
      const overrides = { meta: [] };
      if (titleTemplate.value && "title" in meta2.value) {
        overrides.title = typeof titleTemplate.value === "function" ? titleTemplate.value(meta2.value.title) : titleTemplate.value.replace(/%s/g, meta2.value.title);
      }
      if (meta2.value.charset) {
        overrides.meta.push({ key: "charset", charset: meta2.value.charset });
      }
      if (meta2.value.viewport) {
        overrides.meta.push({ name: "viewport", content: meta2.value.viewport });
      }
      return defu(overrides, meta2.value);
    });
    head.addHeadObjs(headObj);
    {
      return;
    }
  };
  {
    nuxtApp.ssrContext.renderMeta = () => renderHeadToString(head);
  }
});
const removeUndefinedProps = (props) => Object.fromEntries(Object.entries(props).filter(([, value]) => value !== void 0));
const setupForUseMeta = (metaFactory, renderChild) => (props, ctx) => {
  useHead(() => metaFactory({ ...removeUndefinedProps(props), ...ctx.attrs }, ctx));
  return () => {
    var _a, _b;
    return renderChild ? (_b = (_a = ctx.slots).default) == null ? void 0 : _b.call(_a) : null;
  };
};
const globalProps = {
  accesskey: String,
  autocapitalize: String,
  autofocus: {
    type: Boolean,
    default: void 0
  },
  class: String,
  contenteditable: {
    type: Boolean,
    default: void 0
  },
  contextmenu: String,
  dir: String,
  draggable: {
    type: Boolean,
    default: void 0
  },
  enterkeyhint: String,
  exportparts: String,
  hidden: {
    type: Boolean,
    default: void 0
  },
  id: String,
  inputmode: String,
  is: String,
  itemid: String,
  itemprop: String,
  itemref: String,
  itemscope: String,
  itemtype: String,
  lang: String,
  nonce: String,
  part: String,
  slot: String,
  spellcheck: {
    type: Boolean,
    default: void 0
  },
  style: String,
  tabindex: String,
  title: String,
  translate: String
};
const Script = vue_cjs_prod.defineComponent({
  name: "Script",
  inheritAttrs: false,
  props: {
    ...globalProps,
    async: Boolean,
    crossorigin: {
      type: [Boolean, String],
      default: void 0
    },
    defer: Boolean,
    integrity: String,
    nomodule: Boolean,
    nonce: String,
    referrerpolicy: String,
    src: String,
    type: String,
    charset: String,
    language: String
  },
  setup: setupForUseMeta((script) => ({
    script: [script]
  }))
});
const Link = vue_cjs_prod.defineComponent({
  name: "Link",
  inheritAttrs: false,
  props: {
    ...globalProps,
    as: String,
    crossorigin: String,
    disabled: Boolean,
    href: String,
    hreflang: String,
    imagesizes: String,
    imagesrcset: String,
    integrity: String,
    media: String,
    prefetch: {
      type: Boolean,
      default: void 0
    },
    referrerpolicy: String,
    rel: String,
    sizes: String,
    title: String,
    type: String,
    methods: String,
    target: String
  },
  setup: setupForUseMeta((link) => ({
    link: [link]
  }))
});
const Base = vue_cjs_prod.defineComponent({
  name: "Base",
  inheritAttrs: false,
  props: {
    ...globalProps,
    href: String,
    target: String
  },
  setup: setupForUseMeta((base) => ({
    base
  }))
});
const Title = vue_cjs_prod.defineComponent({
  name: "Title",
  inheritAttrs: false,
  setup: setupForUseMeta((_, { slots }) => {
    var _a, _b, _c;
    const title2 = ((_c = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) == null ? void 0 : _b[0]) == null ? void 0 : _c.children) || null;
    return {
      title: title2
    };
  })
});
const Meta = vue_cjs_prod.defineComponent({
  name: "Meta",
  inheritAttrs: false,
  props: {
    ...globalProps,
    charset: String,
    content: String,
    httpEquiv: String,
    name: String
  },
  setup: setupForUseMeta((meta2) => ({
    meta: [meta2]
  }))
});
const Style = vue_cjs_prod.defineComponent({
  name: "Style",
  inheritAttrs: false,
  props: {
    ...globalProps,
    type: String,
    media: String,
    nonce: String,
    title: String,
    scoped: {
      type: Boolean,
      default: void 0
    }
  },
  setup: setupForUseMeta((props, { slots }) => {
    var _a, _b, _c;
    const style = { ...props };
    const textContent = (_c = (_b = (_a = slots.default) == null ? void 0 : _a.call(slots)) == null ? void 0 : _b[0]) == null ? void 0 : _c.children;
    if (textContent) {
      style.children = textContent;
    }
    return {
      style: [style]
    };
  })
});
const Head = vue_cjs_prod.defineComponent({
  name: "Head",
  inheritAttrs: false,
  setup: (_props, ctx) => () => {
    var _a, _b;
    return (_b = (_a = ctx.slots).default) == null ? void 0 : _b.call(_a);
  }
});
const Html = vue_cjs_prod.defineComponent({
  name: "Html",
  inheritAttrs: false,
  props: {
    ...globalProps,
    manifest: String,
    version: String,
    xmlns: String
  },
  setup: setupForUseMeta((htmlAttrs) => ({ htmlAttrs }), true)
});
const Body = vue_cjs_prod.defineComponent({
  name: "Body",
  inheritAttrs: false,
  props: globalProps,
  setup: setupForUseMeta((bodyAttrs) => ({ bodyAttrs }), true)
});
const Components = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Script,
  Link,
  Base,
  Title,
  Meta,
  Style,
  Head,
  Html,
  Body
}, Symbol.toStringTag, { value: "Module" }));
const metaConfig = { "globalMeta": { "charset": "utf-8", "viewport": "width=device-width, initial-scale=1", "meta": [], "link": [], "style": [], "script": [] } };
const metaMixin = {
  created() {
    const instance = vue_cjs_prod.getCurrentInstance();
    if (!instance) {
      return;
    }
    const options = instance.type;
    if (!options || !("head" in options)) {
      return;
    }
    const nuxtApp = useNuxtApp();
    const source = typeof options.head === "function" ? vue_cjs_prod.computed(() => options.head(nuxtApp)) : options.head;
    useHead(source);
  }
};
const _47Users_47meetqy_47Desktop_47nuxt_45temp_47node_modules_47nuxt_47dist_47head_47runtime_47plugin = defineNuxtPlugin((nuxtApp) => {
  useHead(vue_cjs_prod.markRaw({ title: "", ...metaConfig.globalMeta }));
  nuxtApp.vueApp.mixin(metaMixin);
  for (const name2 in Components) {
    nuxtApp.vueApp.component(name2, Components[name2]);
  }
});
const interpolatePath = (route, match) => {
  return match.path.replace(/(:\w+)\([^)]+\)/g, "$1").replace(/(:\w+)[?+*]/g, "$1").replace(/:\w+/g, (r) => {
    var _a;
    return ((_a = route.params[r.slice(1)]) == null ? void 0 : _a.toString()) || "";
  });
};
const generateRouteKey = (override, routeProps) => {
  var _a;
  const matchedRoute = routeProps.route.matched.find((m) => m.components.default === routeProps.Component.type);
  const source = (_a = override != null ? override : matchedRoute == null ? void 0 : matchedRoute.meta.key) != null ? _a : interpolatePath(routeProps.route, matchedRoute);
  return typeof source === "function" ? source(routeProps.route) : source;
};
const wrapInKeepAlive = (props, children) => {
  return { default: () => children };
};
const Fragment = {
  setup(_props, { slots }) {
    return () => {
      var _a;
      return (_a = slots.default) == null ? void 0 : _a.call(slots);
    };
  }
};
const _wrapIf = (component, props, slots) => {
  return { default: () => props ? vue_cjs_prod.h(component, props === true ? {} : props, slots) : vue_cjs_prod.h(Fragment, {}, slots) };
};
const isNestedKey = Symbol("isNested");
const NuxtPage = vue_cjs_prod.defineComponent({
  name: "NuxtPage",
  inheritAttrs: false,
  props: {
    name: {
      type: String
    },
    route: {
      type: Object
    },
    pageKey: {
      type: [Function, String],
      default: null
    }
  },
  setup(props, { attrs }) {
    const nuxtApp = useNuxtApp();
    const isNested = vue_cjs_prod.inject(isNestedKey, false);
    vue_cjs_prod.provide(isNestedKey, true);
    return () => {
      return vue_cjs_prod.h(vueRouter_cjs_prod.RouterView, { name: props.name, route: props.route, ...attrs }, {
        default: (routeProps) => {
          var _a;
          return routeProps.Component && _wrapIf(vue_cjs_prod.Transition, (_a = routeProps.route.meta.pageTransition) != null ? _a : defaultPageTransition, wrapInKeepAlive(routeProps.route.meta.keepalive, isNested && nuxtApp.isHydrating ? vue_cjs_prod.h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) : vue_cjs_prod.h(vue_cjs_prod.Suspense, {
            onPending: () => nuxtApp.callHook("page:start", routeProps.Component),
            onResolve: () => nuxtApp.callHook("page:finish", routeProps.Component)
          }, { default: () => vue_cjs_prod.h(routeProps.Component, { key: generateRouteKey(props.pageKey, routeProps) }) }))).default();
        }
      });
    };
  }
});
const defaultPageTransition = { name: "page", mode: "out-in" };
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const meta$2 = void 0;
const meta$1 = void 0;
const meta = void 0;
const routes = [
  {
    name: "language-card-1",
    path: "/:language/card/1",
    file: "/Users/meetqy/Desktop/nuxt-temp/pages/[language]/card/1.vue",
    children: [],
    meta: meta$2,
    alias: [],
    component: () => Promise.resolve().then(function() {
      return _1$1;
    })
  },
  {
    name: "language-card-2",
    path: "/:language/card/2",
    file: "/Users/meetqy/Desktop/nuxt-temp/pages/[language]/card/2.vue",
    children: [],
    meta: meta$1,
    alias: [],
    component: () => Promise.resolve().then(function() {
      return _2$1;
    })
  },
  {
    name: "language-card-3",
    path: "/:language/card/3",
    file: "/Users/meetqy/Desktop/nuxt-temp/pages/[language]/card/3.vue",
    children: [],
    meta,
    alias: [],
    component: () => Promise.resolve().then(function() {
      return _3$1;
    })
  }
];
const configRouterOptions = {};
const routerOptions = {
  ...configRouterOptions
};
const globalMiddleware = [];
const namedMiddleware = {};
const _47Users_47meetqy_47Desktop_47nuxt_45temp_47node_modules_47nuxt_47dist_47pages_47runtime_47router = defineNuxtPlugin(async (nuxtApp) => {
  nuxtApp.vueApp.component("NuxtPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtNestedPage", NuxtPage);
  nuxtApp.vueApp.component("NuxtChild", NuxtPage);
  const baseURL2 = useRuntimeConfig().app.baseURL;
  const routerHistory = vueRouter_cjs_prod.createMemoryHistory(baseURL2);
  const initialURL = nuxtApp.ssrContext.url;
  const router = vueRouter_cjs_prod.createRouter({
    ...routerOptions,
    history: routerHistory,
    routes
  });
  nuxtApp.vueApp.use(router);
  const previousRoute = vue_cjs_prod.shallowRef(router.currentRoute.value);
  router.afterEach((_to, from) => {
    previousRoute.value = from;
  });
  Object.defineProperty(nuxtApp.vueApp.config.globalProperties, "previousRoute", {
    get: () => previousRoute.value
  });
  const route = {};
  for (const key in router.currentRoute.value) {
    route[key] = vue_cjs_prod.computed(() => router.currentRoute.value[key]);
  }
  const _activeRoute = vue_cjs_prod.shallowRef(router.resolve(initialURL));
  const syncCurrentRoute = () => {
    _activeRoute.value = router.currentRoute.value;
  };
  nuxtApp.hook("page:finish", syncCurrentRoute);
  router.afterEach((to, from) => {
    var _a, _b, _c, _d;
    if (((_b = (_a = to.matched[0]) == null ? void 0 : _a.components) == null ? void 0 : _b.default) === ((_d = (_c = from.matched[0]) == null ? void 0 : _c.components) == null ? void 0 : _d.default)) {
      syncCurrentRoute();
    }
  });
  const activeRoute = {};
  for (const key in _activeRoute.value) {
    activeRoute[key] = vue_cjs_prod.computed(() => _activeRoute.value[key]);
  }
  nuxtApp._route = vue_cjs_prod.reactive(route);
  nuxtApp._activeRoute = vue_cjs_prod.reactive(activeRoute);
  nuxtApp._middleware = nuxtApp._middleware || {
    global: [],
    named: {}
  };
  useError();
  try {
    if (true) {
      await router.push(initialURL);
    }
    await router.isReady();
  } catch (error2) {
    callWithNuxt(nuxtApp, throwError, [error2]);
  }
  router.beforeEach(async (to, from) => {
    var _a;
    to.meta = vue_cjs_prod.reactive(to.meta);
    nuxtApp._processingMiddleware = true;
    const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
    for (const component of to.matched) {
      const componentMiddleware = component.meta.middleware;
      if (!componentMiddleware) {
        continue;
      }
      if (Array.isArray(componentMiddleware)) {
        for (const entry2 of componentMiddleware) {
          middlewareEntries.add(entry2);
        }
      } else {
        middlewareEntries.add(componentMiddleware);
      }
    }
    for (const entry2 of middlewareEntries) {
      const middleware = typeof entry2 === "string" ? nuxtApp._middleware.named[entry2] || await ((_a = namedMiddleware[entry2]) == null ? void 0 : _a.call(namedMiddleware).then((r) => r.default || r)) : entry2;
      if (!middleware) {
        throw new Error(`Unknown route middleware: '${entry2}'.`);
      }
      const result = await callWithNuxt(nuxtApp, middleware, [to, from]);
      {
        if (result === false || result instanceof Error) {
          const error2 = result || createError({
            statusMessage: `Route navigation aborted: ${initialURL}`
          });
          return callWithNuxt(nuxtApp, throwError, [error2]);
        }
      }
      if (result || result === false) {
        return result;
      }
    }
  });
  router.afterEach(async (to) => {
    delete nuxtApp._processingMiddleware;
    if (to.matched.length === 0) {
      callWithNuxt(nuxtApp, throwError, [createError({
        statusCode: 404,
        statusMessage: `Page not found: ${to.fullPath}`
      })]);
    } else if (to.matched[0].name === "404" && nuxtApp.ssrContext) {
      nuxtApp.ssrContext.res.statusCode = 404;
    } else {
      const currentURL = to.fullPath || "/";
      if (!isEqual(currentURL, initialURL)) {
        await callWithNuxt(nuxtApp, navigateTo, [currentURL]);
      }
    }
  });
  nuxtApp.hooks.hookOnce("app:created", async () => {
    try {
      await router.replace({
        ...router.resolve(initialURL),
        name: void 0,
        force: true
      });
    } catch (error2) {
      callWithNuxt(nuxtApp, throwError, [error2]);
    }
  });
  return { provide: { router } };
});
class FakerError extends Error {
}
function deprecated(opts) {
  let message = `[@faker-js/faker]: ${opts.deprecated} is deprecated`;
  if (opts.since) {
    message += ` since v${opts.since}`;
  }
  if (opts.until) {
    message += ` and will be removed in v${opts.until}`;
  }
  if (opts.proposed) {
    message += `. Please use ${opts.proposed} instead.`;
  }
  console.warn(`${message}.`);
}
class Address {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Address.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  zipCode(format) {
    if (format == null) {
      const localeFormat = this.faker.definitions.address.postcode;
      if (typeof localeFormat === "string") {
        format = localeFormat;
      } else {
        format = this.faker.helpers.arrayElement(localeFormat);
      }
    }
    return this.faker.helpers.replaceSymbols(format);
  }
  zipCodeByState(state2) {
    var _a;
    const zipRange = (_a = this.faker.definitions.address.postcode_by_state) == null ? void 0 : _a[state2];
    if (zipRange) {
      return String(this.faker.datatype.number(zipRange));
    }
    return this.zipCode();
  }
  city(format) {
    if (format != null) {
      deprecated({
        deprecated: "faker.address.city(format)",
        proposed: "faker.address.city() or faker.fake(format)",
        since: "7.0",
        until: "8.0"
      });
    }
    const formats2 = this.faker.definitions.address.city;
    if (typeof format !== "number") {
      format = this.faker.datatype.number(formats2.length - 1);
    }
    return this.faker.fake(formats2[format]);
  }
  cityPrefix() {
    deprecated({
      deprecated: "faker.address.cityPrefix()",
      proposed: "faker.address.city() or faker.fake('{{address.city_prefix}}')",
      since: "7.2",
      until: "8.0"
    });
    return this.faker.helpers.arrayElement(this.faker.definitions.address.city_prefix);
  }
  citySuffix() {
    deprecated({
      deprecated: "faker.address.citySuffix()",
      proposed: "faker.address.city() or faker.fake('{{address.city_suffix}}')",
      since: "7.2",
      until: "8.0"
    });
    return this.faker.helpers.arrayElement(this.faker.definitions.address.city_suffix);
  }
  cityName() {
    return this.faker.helpers.arrayElement(this.faker.definitions.address.city_name);
  }
  buildingNumber() {
    const format = this.faker.helpers.arrayElement(this.faker.definitions.address.building_number);
    return this.faker.helpers.replaceSymbolWithNumber(format);
  }
  street() {
    const format = this.faker.helpers.arrayElement(this.faker.definitions.address.street);
    return this.faker.fake(format);
  }
  streetName() {
    if (this.faker.definitions.address.street_name == null) {
      deprecated({
        deprecated: "faker.address.streetName() without address.street_name definitions",
        proposed: "faker.address.street() or provide address.street_name definitions",
        since: "7.0",
        until: "8.0"
      });
      return this.street();
    }
    return this.faker.helpers.arrayElement(this.faker.definitions.address.street_name);
  }
  streetAddress(useFullAddress = false) {
    const formats2 = this.faker.definitions.address.street_address;
    const format = formats2[useFullAddress ? "full" : "normal"];
    return this.faker.fake(format);
  }
  streetSuffix() {
    return this.faker.helpers.arrayElement(this.faker.definitions.address.street_suffix);
  }
  streetPrefix() {
    return this.faker.helpers.arrayElement(this.faker.definitions.address.street_prefix);
  }
  secondaryAddress() {
    return this.faker.helpers.replaceSymbolWithNumber(this.faker.helpers.arrayElement(this.faker.definitions.address.secondary_address));
  }
  county() {
    return this.faker.helpers.arrayElement(this.faker.definitions.address.county);
  }
  country() {
    return this.faker.helpers.arrayElement(this.faker.definitions.address.country);
  }
  countryCode(alphaCode = "alpha-2") {
    const key = alphaCode === "alpha-3" ? "country_code_alpha_3" : "country_code";
    return this.faker.helpers.arrayElement(this.faker.definitions.address[key]);
  }
  state() {
    return this.faker.helpers.arrayElement(this.faker.definitions.address.state);
  }
  stateAbbr() {
    return this.faker.helpers.arrayElement(this.faker.definitions.address.state_abbr);
  }
  latitude(max = 90, min = -90, precision = 4) {
    return this.faker.datatype.number({
      min,
      max,
      precision: parseFloat(`${0 .toPrecision(precision)}1`)
    }).toFixed(precision);
  }
  longitude(max = 180, min = -180, precision = 4) {
    return this.faker.datatype.number({
      max,
      min,
      precision: parseFloat(`${0 .toPrecision(precision)}1`)
    }).toFixed(precision);
  }
  direction(useAbbr = false) {
    if (!useAbbr) {
      return this.faker.helpers.arrayElement(this.faker.definitions.address.direction);
    }
    return this.faker.helpers.arrayElement(this.faker.definitions.address.direction_abbr);
  }
  cardinalDirection(useAbbr = false) {
    if (!useAbbr) {
      return this.faker.helpers.arrayElement(this.faker.definitions.address.direction.slice(0, 4));
    }
    return this.faker.helpers.arrayElement(this.faker.definitions.address.direction_abbr.slice(0, 4));
  }
  ordinalDirection(useAbbr = false) {
    if (!useAbbr) {
      return this.faker.helpers.arrayElement(this.faker.definitions.address.direction.slice(4, 8));
    }
    return this.faker.helpers.arrayElement(this.faker.definitions.address.direction_abbr.slice(4, 8));
  }
  nearbyGPSCoordinate(coordinate, radius = 10, isMetric = false) {
    if (coordinate === void 0) {
      return [this.latitude(), this.longitude()];
    }
    const angleRadians = this.faker.datatype.float({
      min: 0,
      max: 2 * Math.PI,
      precision: 1e-5
    });
    const radiusMetric = isMetric ? radius : radius * 1.60934;
    const errorCorrection = 0.995;
    const distanceInKm = this.faker.datatype.float({
      min: 0,
      max: radiusMetric,
      precision: 1e-3
    }) * errorCorrection;
    const kmPerDegree = 4e4 / 360;
    const distanceInDegree = distanceInKm / kmPerDegree;
    const newCoordinate = [
      coordinate[0] + Math.sin(angleRadians) * distanceInDegree,
      coordinate[1] + Math.cos(angleRadians) * distanceInDegree
    ];
    newCoordinate[0] = newCoordinate[0] % 180;
    if (newCoordinate[0] < -90 || newCoordinate[0] > 90) {
      newCoordinate[0] = Math.sign(newCoordinate[0]) * 180 - newCoordinate[0];
      newCoordinate[1] += 180;
    }
    newCoordinate[1] = (newCoordinate[1] % 360 + 540) % 360 - 180;
    return [newCoordinate[0].toFixed(4), newCoordinate[1].toFixed(4)];
  }
  timeZone() {
    return this.faker.helpers.arrayElement(this.faker.definitions.address.time_zone);
  }
}
class Animal {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Animal.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  dog() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.dog);
  }
  cat() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.cat);
  }
  snake() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.snake);
  }
  bear() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.bear);
  }
  lion() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.lion);
  }
  cetacean() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.cetacean);
  }
  horse() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.horse);
  }
  bird() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.bird);
  }
  cow() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.cow);
  }
  fish() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.fish);
  }
  crocodilia() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.crocodilia);
  }
  insect() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.insect);
  }
  rabbit() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.rabbit);
  }
  type() {
    return this.faker.helpers.arrayElement(this.faker.definitions.animal.type);
  }
}
const CSS_SPACES = [
  "sRGB",
  "display-p3",
  "rec2020",
  "a98-rgb",
  "prophoto-rgb",
  "rec2020"
];
const CSS_FUNCTIONS = [
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "hwb",
  "cmyk",
  "lab",
  "lch",
  "color"
];
function formatHexColor(hexColor, options) {
  switch (options == null ? void 0 : options.casing) {
    case "upper":
      hexColor = hexColor.toUpperCase();
      break;
    case "lower":
      hexColor = hexColor.toLowerCase();
      break;
  }
  if (options == null ? void 0 : options.prefix) {
    hexColor = options.prefix + hexColor;
  }
  return hexColor;
}
function toBinary(values) {
  const binary = values.map((value) => {
    const isFloat = value % 1 !== 0;
    if (isFloat) {
      const buffer = new ArrayBuffer(4);
      new DataView(buffer).setFloat32(0, value);
      const bytes = new Uint8Array(buffer);
      return toBinary(Array.from(bytes)).split(" ").join("");
    }
    return (value >>> 0).toString(2).padStart(8, "0");
  });
  return binary.join(" ");
}
function toCSS(values, cssFunction = "rgb", space2 = "sRGB") {
  const percentage = (value) => Math.round(value * 100);
  switch (cssFunction) {
    case "rgba":
      return `rgba(${values[0]}, ${values[1]}, ${values[2]}, ${values[3]})`;
    case "color":
      return `color(${space2} ${values[0]} ${values[1]} ${values[2]})`;
    case "cmyk":
      return `cmyk(${percentage(values[0])}%, ${percentage(values[1])}%, ${percentage(values[2])}%, ${percentage(values[3])}%)`;
    case "hsl":
      return `hsl(${values[0]}deg ${percentage(values[1])}% ${percentage(values[2])}%)`;
    case "hsla":
      return `hsl(${values[0]}deg ${percentage(values[1])}% ${percentage(values[2])}% / ${percentage(values[3])})`;
    case "hwb":
      return `hwb(${values[0]} ${percentage(values[1])}% ${percentage(values[2])}%)`;
    case "lab":
      return `lab(${percentage(values[0])}% ${values[1]} ${values[2]})`;
    case "lch":
      return `lch(${percentage(values[0])}% ${values[1]} ${values[2]})`;
    case "rgb":
    default:
      return `rgb(${values[0]}, ${values[1]}, ${values[2]})`;
  }
}
function toColorFormat(values, format, cssFunction = "rgb", space2 = "sRGB") {
  switch (format) {
    case "css":
      return toCSS(values, cssFunction, space2);
    case "binary":
      return toBinary(values);
    default:
      return values;
  }
}
class Color {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Color.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  human() {
    return this.faker.helpers.arrayElement(this.faker.definitions.color.human);
  }
  space() {
    return this.faker.helpers.arrayElement(this.faker.definitions.color.space);
  }
  cssSupportedFunction() {
    return this.faker.helpers.arrayElement(CSS_FUNCTIONS);
  }
  cssSupportedSpace() {
    return this.faker.helpers.arrayElement(CSS_SPACES);
  }
  rgb(options) {
    const {
      format = "hex",
      includeAlpha = false,
      prefix: prefix2 = "#",
      casing = "lower"
    } = options || {};
    options = { format, includeAlpha, prefix: prefix2, casing };
    let color2;
    let cssFunction = "rgb";
    if (format === "hex") {
      color2 = this.faker.datatype.hexadecimal(includeAlpha ? 8 : 6).slice(2);
      color2 = formatHexColor(color2, options);
      return color2;
    }
    color2 = Array.from({ length: 3 }).map(() => this.faker.datatype.number({ min: 0, max: 255 }));
    if (includeAlpha) {
      color2.push(this.faker.datatype.float({ min: 0, max: 1, precision: 0.01 }));
      cssFunction = "rgba";
    }
    return toColorFormat(color2, format, cssFunction);
  }
  cmyk(options) {
    const color2 = Array.from({ length: 4 }).map(() => this.faker.datatype.float({ min: 0, max: 1, precision: 0.01 }));
    return toColorFormat(color2, (options == null ? void 0 : options.format) || "decimal", "cmyk");
  }
  hsl(options) {
    const hsl = [this.faker.datatype.number({ min: 0, max: 360 })];
    for (let i = 0; i < ((options == null ? void 0 : options.includeAlpha) ? 3 : 2); i++) {
      hsl.push(this.faker.datatype.float({ min: 0, max: 1, precision: 0.01 }));
    }
    return toColorFormat(hsl, (options == null ? void 0 : options.format) || "decimal", (options == null ? void 0 : options.includeAlpha) ? "hsla" : "hsl");
  }
  hwb(options) {
    const hsl = [this.faker.datatype.number({ min: 0, max: 360 })];
    for (let i = 0; i < 2; i++) {
      hsl.push(this.faker.datatype.float({ min: 0, max: 1, precision: 0.01 }));
    }
    return toColorFormat(hsl, (options == null ? void 0 : options.format) || "decimal", "hwb");
  }
  lab(options) {
    const lab = [
      this.faker.datatype.float({ min: 0, max: 1, precision: 1e-6 })
    ];
    for (let i = 0; i < 2; i++) {
      lab.push(this.faker.datatype.float({ min: -100, max: 100, precision: 1e-4 }));
    }
    return toColorFormat(lab, (options == null ? void 0 : options.format) || "decimal", "lab");
  }
  lch(options) {
    const lch = [
      this.faker.datatype.float({ min: 0, max: 1, precision: 1e-6 })
    ];
    for (let i = 0; i < 2; i++) {
      lch.push(this.faker.datatype.number({ min: 0, max: 230, precision: 0.1 }));
    }
    return toColorFormat(lch, (options == null ? void 0 : options.format) || "decimal", "lch");
  }
  colorByCSSColorSpace(options) {
    if ((options == null ? void 0 : options.format) === "css" && !(options == null ? void 0 : options.space)) {
      options = { ...options, space: "sRGB" };
    }
    const color2 = Array.from({ length: 3 }).map(() => this.faker.datatype.float({ min: 0, max: 1, precision: 1e-4 }));
    return toColorFormat(color2, (options == null ? void 0 : options.format) || "decimal", "color", options == null ? void 0 : options.space);
  }
}
class Commerce {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Commerce.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  color() {
    deprecated({
      deprecated: "faker.commerce.color()",
      proposed: "faker.color.human()",
      since: "7.0",
      until: "8.0"
    });
    return this.faker.color.human();
  }
  department() {
    return this.faker.helpers.arrayElement(this.faker.definitions.commerce.department);
  }
  productName() {
    return `${this.productAdjective()} ${this.productMaterial()} ${this.product()}`;
  }
  price(min = 1, max = 1e3, dec = 2, symbol = "") {
    if (min < 0 || max < 0) {
      return `${symbol}${0}`;
    }
    const randValue = this.faker.datatype.number({ max, min });
    return symbol + (Math.round(randValue * Math.pow(10, dec)) / Math.pow(10, dec)).toFixed(dec);
  }
  productAdjective() {
    return this.faker.helpers.arrayElement(this.faker.definitions.commerce.product_name.adjective);
  }
  productMaterial() {
    return this.faker.helpers.arrayElement(this.faker.definitions.commerce.product_name.material);
  }
  product() {
    return this.faker.helpers.arrayElement(this.faker.definitions.commerce.product_name.product);
  }
  productDescription() {
    return this.faker.helpers.arrayElement(this.faker.definitions.commerce.product_description);
  }
}
class Company {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Company.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  suffixes() {
    return this.faker.definitions.company.suffix.slice(0);
  }
  companyName(format) {
    const formats2 = [
      "{{name.lastName}} {{company.companySuffix}}",
      "{{name.lastName}} - {{name.lastName}}",
      "{{name.lastName}}, {{name.lastName}} and {{name.lastName}}"
    ];
    if (typeof format !== "number") {
      format = this.faker.datatype.number(formats2.length - 1);
    }
    return this.faker.fake(formats2[format]);
  }
  companySuffix() {
    return this.faker.helpers.arrayElement(this.suffixes());
  }
  catchPhrase() {
    return this.faker.fake("{{company.catchPhraseAdjective}} {{company.catchPhraseDescriptor}} {{company.catchPhraseNoun}}");
  }
  bs() {
    return this.faker.fake("{{company.bsBuzz}} {{company.bsAdjective}} {{company.bsNoun}}");
  }
  catchPhraseAdjective() {
    return this.faker.helpers.arrayElement(this.faker.definitions.company.adjective);
  }
  catchPhraseDescriptor() {
    return this.faker.helpers.arrayElement(this.faker.definitions.company.descriptor);
  }
  catchPhraseNoun() {
    return this.faker.helpers.arrayElement(this.faker.definitions.company.noun);
  }
  bsAdjective() {
    return this.faker.helpers.arrayElement(this.faker.definitions.company.bs_adjective);
  }
  bsBuzz() {
    return this.faker.helpers.arrayElement(this.faker.definitions.company.bs_verb);
  }
  bsNoun() {
    return this.faker.helpers.arrayElement(this.faker.definitions.company.bs_noun);
  }
}
class Database {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Database.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  column() {
    return this.faker.helpers.arrayElement(this.faker.definitions.database.column);
  }
  type() {
    return this.faker.helpers.arrayElement(this.faker.definitions.database.type);
  }
  collation() {
    return this.faker.helpers.arrayElement(this.faker.definitions.database.collation);
  }
  engine() {
    return this.faker.helpers.arrayElement(this.faker.definitions.database.engine);
  }
  mongodbObjectId() {
    return this.faker.datatype.hexadecimal(24).replace("0x", "").toLowerCase();
  }
}
class Datatype {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Datatype.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  number(options = 99999) {
    var _a;
    if (typeof options === "number") {
      options = { max: options };
    }
    const { min = 0, precision = 1 } = options;
    const max = (_a = options.max) != null ? _a : min + 99999;
    if (max === min) {
      return min;
    }
    if (max < min) {
      throw new FakerError(`Max ${max} should be greater than min ${min}.`);
    }
    const randomNumber = Math.floor(this.faker.mersenne.rand(max / precision + 1, min / precision));
    return randomNumber / (1 / precision);
  }
  float(options) {
    if (typeof options === "number") {
      options = {
        precision: options
      };
    }
    options = options || {};
    const opts = {};
    for (const p in options) {
      opts[p] = options[p];
    }
    if (opts.precision == null) {
      opts.precision = 0.01;
    }
    return this.number(opts);
  }
  datetime(options = {}) {
    const minMax = 864e13;
    let min = typeof options === "number" ? void 0 : options.min;
    let max = typeof options === "number" ? options : options.max;
    if (min == null || min < minMax * -1) {
      min = Date.UTC(1990, 0);
    }
    if (max == null || max > minMax) {
      max = Date.UTC(2100, 0);
    }
    return new Date(this.number({ min, max }));
  }
  string(length = 10) {
    const maxLength = Math.pow(2, 20);
    if (length >= maxLength) {
      length = maxLength;
    }
    const charCodeOption = {
      min: 33,
      max: 125
    };
    let returnString = "";
    for (let i = 0; i < length; i++) {
      returnString += String.fromCharCode(this.number(charCodeOption));
    }
    return returnString;
  }
  uuid() {
    const RFC4122_TEMPLATE = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
    const replacePlaceholders = (placeholder) => {
      const random = this.number({ min: 0, max: 15 });
      const value = placeholder === "x" ? random : random & 3 | 8;
      return value.toString(16);
    };
    return RFC4122_TEMPLATE.replace(/[xy]/g, replacePlaceholders);
  }
  boolean() {
    return !!this.number(1);
  }
  hexadecimal(length = 1) {
    let wholeString = "";
    for (let i = 0; i < length; i++) {
      wholeString += this.faker.helpers.arrayElement([
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "a",
        "b",
        "c",
        "d",
        "e",
        "f",
        "A",
        "B",
        "C",
        "D",
        "E",
        "F"
      ]);
    }
    return `0x${wholeString}`;
  }
  json() {
    const properties = ["foo", "bar", "bike", "a", "b", "name", "prop"];
    const returnObject = {};
    properties.forEach((prop) => {
      returnObject[prop] = this.boolean() ? this.string() : this.number();
    });
    return JSON.stringify(returnObject);
  }
  array(length = 10) {
    return Array.from({ length }).map(() => this.boolean() ? this.string() : this.number());
  }
  bigInt(options) {
    var _a, _b;
    let min;
    let max;
    if (typeof options === "object") {
      min = BigInt((_a = options.min) != null ? _a : 0);
      max = BigInt((_b = options.max) != null ? _b : min + BigInt(999999999999999));
    } else {
      min = BigInt(0);
      max = BigInt(options != null ? options : 999999999999999);
    }
    if (max === min) {
      return min;
    }
    if (max < min) {
      throw new FakerError(`Max ${max} should be larger then min ${min}.`);
    }
    const delta = max - min;
    const offset = BigInt(this.faker.random.numeric(delta.toString(10).length, {
      allowLeadingZeros: true
    })) % (delta + BigInt(1));
    return min + offset;
  }
}
function toDate(date2) {
  date2 = new Date(date2);
  if (isNaN(date2.valueOf())) {
    date2 = new Date();
  }
  return date2;
}
class _Date {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(_Date.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  past(years, refDate) {
    const date2 = toDate(refDate);
    const range2 = {
      min: 1e3,
      max: (years || 1) * 365 * 24 * 3600 * 1e3
    };
    let past = date2.getTime();
    past -= this.faker.datatype.number(range2);
    date2.setTime(past);
    return date2;
  }
  future(years, refDate) {
    const date2 = toDate(refDate);
    const range2 = {
      min: 1e3,
      max: (years || 1) * 365 * 24 * 3600 * 1e3
    };
    let future = date2.getTime();
    future += this.faker.datatype.number(range2);
    date2.setTime(future);
    return date2;
  }
  between(from, to) {
    const fromMs = toDate(from).getTime();
    const toMs = toDate(to).getTime();
    const dateOffset = this.faker.datatype.number(toMs - fromMs);
    return new Date(fromMs + dateOffset);
  }
  betweens(from, to, num = 3) {
    const dates = [];
    while (dates.length < num) {
      dates.push(this.between(from, to));
    }
    return dates.sort((a, b) => a.getTime() - b.getTime());
  }
  recent(days, refDate) {
    const date2 = toDate(refDate);
    const range2 = {
      min: 1e3,
      max: (days || 1) * 24 * 3600 * 1e3
    };
    let future = date2.getTime();
    future -= this.faker.datatype.number(range2);
    date2.setTime(future);
    return date2;
  }
  soon(days, refDate) {
    const date2 = toDate(refDate);
    const range2 = {
      min: 1e3,
      max: (days || 1) * 24 * 3600 * 1e3
    };
    let future = date2.getTime();
    future += this.faker.datatype.number(range2);
    date2.setTime(future);
    return date2;
  }
  month(options) {
    var _a, _b;
    const abbr = (_a = options == null ? void 0 : options.abbr) != null ? _a : false;
    const context = (_b = options == null ? void 0 : options.context) != null ? _b : false;
    const source = this.faker.definitions.date.month;
    let type;
    if (abbr) {
      if (context && source["abbr_context"] != null) {
        type = "abbr_context";
      } else {
        type = "abbr";
      }
    } else if (context && source["wide_context"] != null) {
      type = "wide_context";
    } else {
      type = "wide";
    }
    return this.faker.helpers.arrayElement(source[type]);
  }
  weekday(options) {
    var _a, _b;
    const abbr = (_a = options == null ? void 0 : options.abbr) != null ? _a : false;
    const context = (_b = options == null ? void 0 : options.context) != null ? _b : false;
    const source = this.faker.definitions.date.weekday;
    let type;
    if (abbr) {
      if (context && source["abbr_context"] != null) {
        type = "abbr_context";
      } else {
        type = "abbr";
      }
    } else if (context && source["wide_context"] != null) {
      type = "wide_context";
    } else {
      type = "wide";
    }
    return this.faker.helpers.arrayElement(source[type]);
  }
  birthdate(options = {}) {
    var _a, _b, _c, _d;
    const mode = options.mode === "age" ? "age" : "year";
    const refDate = toDate(options.refDate);
    const refYear = refDate.getUTCFullYear();
    let min;
    let max;
    if (mode === "age") {
      min = new Date(refDate).setUTCFullYear(refYear - ((_a = options.max) != null ? _a : 80) - 1);
      max = new Date(refDate).setUTCFullYear(refYear - ((_b = options.min) != null ? _b : 18));
    } else {
      min = new Date(Date.UTC(0, 0, 2)).setUTCFullYear((_c = options.min) != null ? _c : refYear - 80);
      max = new Date(Date.UTC(0, 11, 30)).setUTCFullYear((_d = options.max) != null ? _d : refYear - 18);
    }
    if (max < min) {
      throw new FakerError(`Max ${max} should be larger then min ${min}.`);
    }
    return new Date(this.faker.datatype.number({ min, max }));
  }
}
class Fake {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Fake.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  fake(str) {
    if (typeof str !== "string" || str.length === 0) {
      throw new FakerError("string parameter is required!");
    }
    const start = str.search(/{{[a-z]/);
    const end = str.indexOf("}}", start);
    if (start === -1 || end === -1) {
      return str;
    }
    const token = str.substring(start + 2, end + 2);
    let method = token.replace("}}", "").replace("{{", "");
    const regExp = /\(([^)]+)\)/;
    const matches = regExp.exec(method);
    let parameters = "";
    if (matches) {
      method = method.replace(regExp, "");
      parameters = matches[1];
    }
    const parts = method.split(".");
    let currentModuleOrMethod = this.faker;
    let currentDefinitions = this.faker.definitions;
    for (const part of parts) {
      currentModuleOrMethod = currentModuleOrMethod == null ? void 0 : currentModuleOrMethod[part];
      currentDefinitions = currentDefinitions == null ? void 0 : currentDefinitions[part];
    }
    let fn;
    if (typeof currentModuleOrMethod === "function") {
      fn = currentModuleOrMethod;
    } else if (Array.isArray(currentDefinitions)) {
      fn = () => this.faker.helpers.arrayElement(currentDefinitions);
    } else {
      throw new FakerError(`Invalid module method or definition: ${method}
- faker.${method} is not a function
- faker.definitions.${method} is not an array`);
    }
    fn = fn.bind(this);
    let params;
    try {
      params = JSON.parse(parameters);
    } catch (err) {
      params = parameters;
    }
    let result;
    if (typeof params === "string" && params.length === 0) {
      result = String(fn());
    } else {
      result = String(fn(params));
    }
    const res = str.substring(0, start) + result + str.substring(end + 2);
    if (res === "") {
      return "";
    }
    return this.fake(res);
  }
}
const iban = {
  alpha: [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z"
  ],
  formats: [
    {
      country: "AL",
      total: 28,
      bban: [
        {
          type: "n",
          count: 8
        },
        {
          type: "c",
          count: 16
        }
      ],
      format: "ALkk bbbs sssx cccc cccc cccc cccc"
    },
    {
      country: "AD",
      total: 24,
      bban: [
        {
          type: "n",
          count: 8
        },
        {
          type: "c",
          count: 12
        }
      ],
      format: "ADkk bbbb ssss cccc cccc cccc"
    },
    {
      country: "AT",
      total: 20,
      bban: [
        {
          type: "n",
          count: 5
        },
        {
          type: "n",
          count: 11
        }
      ],
      format: "ATkk bbbb bccc cccc cccc"
    },
    {
      country: "AZ",
      total: 28,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 20
        }
      ],
      format: "AZkk bbbb cccc cccc cccc cccc cccc"
    },
    {
      country: "BH",
      total: 22,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "c",
          count: 14
        }
      ],
      format: "BHkk bbbb cccc cccc cccc cc"
    },
    {
      country: "BE",
      total: 16,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "n",
          count: 9
        }
      ],
      format: "BEkk bbbc cccc ccxx"
    },
    {
      country: "BA",
      total: 20,
      bban: [
        {
          type: "n",
          count: 6
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "BAkk bbbs sscc cccc ccxx"
    },
    {
      country: "BR",
      total: 29,
      bban: [
        {
          type: "n",
          count: 13
        },
        {
          type: "n",
          count: 10
        },
        {
          type: "a",
          count: 1
        },
        {
          type: "c",
          count: 1
        }
      ],
      format: "BRkk bbbb bbbb ssss sccc cccc ccct n"
    },
    {
      country: "BG",
      total: 22,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 6
        },
        {
          type: "c",
          count: 8
        }
      ],
      format: "BGkk bbbb ssss ddcc cccc cc"
    },
    {
      country: "CR",
      total: 22,
      bban: [
        {
          type: "n",
          count: 1
        },
        {
          type: "n",
          count: 3
        },
        {
          type: "n",
          count: 14
        }
      ],
      format: "CRkk xbbb cccc cccc cccc cc"
    },
    {
      country: "HR",
      total: 21,
      bban: [
        {
          type: "n",
          count: 7
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "HRkk bbbb bbbc cccc cccc c"
    },
    {
      country: "CY",
      total: 28,
      bban: [
        {
          type: "n",
          count: 8
        },
        {
          type: "c",
          count: 16
        }
      ],
      format: "CYkk bbbs ssss cccc cccc cccc cccc"
    },
    {
      country: "CZ",
      total: 24,
      bban: [
        {
          type: "n",
          count: 10
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "CZkk bbbb ssss sscc cccc cccc"
    },
    {
      country: "DK",
      total: 18,
      bban: [
        {
          type: "n",
          count: 4
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "DKkk bbbb cccc cccc cc"
    },
    {
      country: "DO",
      total: 28,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 20
        }
      ],
      format: "DOkk bbbb cccc cccc cccc cccc cccc"
    },
    {
      country: "TL",
      total: 23,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "TLkk bbbc cccc cccc cccc cxx"
    },
    {
      country: "EE",
      total: 20,
      bban: [
        {
          type: "n",
          count: 4
        },
        {
          type: "n",
          count: 12
        }
      ],
      format: "EEkk bbss cccc cccc cccx"
    },
    {
      country: "FO",
      total: 18,
      bban: [
        {
          type: "n",
          count: 4
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "FOkk bbbb cccc cccc cx"
    },
    {
      country: "FI",
      total: 18,
      bban: [
        {
          type: "n",
          count: 6
        },
        {
          type: "n",
          count: 8
        }
      ],
      format: "FIkk bbbb bbcc cccc cx"
    },
    {
      country: "FR",
      total: 27,
      bban: [
        {
          type: "n",
          count: 10
        },
        {
          type: "c",
          count: 11
        },
        {
          type: "n",
          count: 2
        }
      ],
      format: "FRkk bbbb bggg ggcc cccc cccc cxx"
    },
    {
      country: "GE",
      total: 22,
      bban: [
        {
          type: "a",
          count: 2
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "GEkk bbcc cccc cccc cccc cc"
    },
    {
      country: "DE",
      total: 22,
      bban: [
        {
          type: "n",
          count: 8
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "DEkk bbbb bbbb cccc cccc cc"
    },
    {
      country: "GI",
      total: 23,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "c",
          count: 15
        }
      ],
      format: "GIkk bbbb cccc cccc cccc ccc"
    },
    {
      country: "GR",
      total: 27,
      bban: [
        {
          type: "n",
          count: 7
        },
        {
          type: "c",
          count: 16
        }
      ],
      format: "GRkk bbbs sssc cccc cccc cccc ccc"
    },
    {
      country: "GL",
      total: 18,
      bban: [
        {
          type: "n",
          count: 4
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "GLkk bbbb cccc cccc cc"
    },
    {
      country: "GT",
      total: 28,
      bban: [
        {
          type: "c",
          count: 4
        },
        {
          type: "c",
          count: 4
        },
        {
          type: "c",
          count: 16
        }
      ],
      format: "GTkk bbbb mmtt cccc cccc cccc cccc"
    },
    {
      country: "HU",
      total: 28,
      bban: [
        {
          type: "n",
          count: 8
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "HUkk bbbs sssk cccc cccc cccc cccx"
    },
    {
      country: "IS",
      total: 26,
      bban: [
        {
          type: "n",
          count: 6
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "ISkk bbbb sscc cccc iiii iiii ii"
    },
    {
      country: "IE",
      total: 22,
      bban: [
        {
          type: "c",
          count: 4
        },
        {
          type: "n",
          count: 6
        },
        {
          type: "n",
          count: 8
        }
      ],
      format: "IEkk aaaa bbbb bbcc cccc cc"
    },
    {
      country: "IL",
      total: 23,
      bban: [
        {
          type: "n",
          count: 6
        },
        {
          type: "n",
          count: 13
        }
      ],
      format: "ILkk bbbn nncc cccc cccc ccc"
    },
    {
      country: "IT",
      total: 27,
      bban: [
        {
          type: "a",
          count: 1
        },
        {
          type: "n",
          count: 10
        },
        {
          type: "c",
          count: 12
        }
      ],
      format: "ITkk xaaa aabb bbbc cccc cccc ccc"
    },
    {
      country: "JO",
      total: 30,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 4
        },
        {
          type: "n",
          count: 18
        }
      ],
      format: "JOkk bbbb nnnn cccc cccc cccc cccc cc"
    },
    {
      country: "KZ",
      total: 20,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "c",
          count: 13
        }
      ],
      format: "KZkk bbbc cccc cccc cccc"
    },
    {
      country: "XK",
      total: 20,
      bban: [
        {
          type: "n",
          count: 4
        },
        {
          type: "n",
          count: 12
        }
      ],
      format: "XKkk bbbb cccc cccc cccc"
    },
    {
      country: "KW",
      total: 30,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "c",
          count: 22
        }
      ],
      format: "KWkk bbbb cccc cccc cccc cccc cccc cc"
    },
    {
      country: "LV",
      total: 21,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "c",
          count: 13
        }
      ],
      format: "LVkk bbbb cccc cccc cccc c"
    },
    {
      country: "LB",
      total: 28,
      bban: [
        {
          type: "n",
          count: 4
        },
        {
          type: "c",
          count: 20
        }
      ],
      format: "LBkk bbbb cccc cccc cccc cccc cccc"
    },
    {
      country: "LI",
      total: 21,
      bban: [
        {
          type: "n",
          count: 5
        },
        {
          type: "c",
          count: 12
        }
      ],
      format: "LIkk bbbb bccc cccc cccc c"
    },
    {
      country: "LT",
      total: 20,
      bban: [
        {
          type: "n",
          count: 5
        },
        {
          type: "n",
          count: 11
        }
      ],
      format: "LTkk bbbb bccc cccc cccc"
    },
    {
      country: "LU",
      total: 20,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "c",
          count: 13
        }
      ],
      format: "LUkk bbbc cccc cccc cccc"
    },
    {
      country: "MK",
      total: 19,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "c",
          count: 10
        },
        {
          type: "n",
          count: 2
        }
      ],
      format: "MKkk bbbc cccc cccc cxx"
    },
    {
      country: "MT",
      total: 31,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 5
        },
        {
          type: "c",
          count: 18
        }
      ],
      format: "MTkk bbbb ssss sccc cccc cccc cccc ccc"
    },
    {
      country: "MR",
      total: 27,
      bban: [
        {
          type: "n",
          count: 10
        },
        {
          type: "n",
          count: 13
        }
      ],
      format: "MRkk bbbb bsss sscc cccc cccc cxx"
    },
    {
      country: "MU",
      total: 30,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 4
        },
        {
          type: "n",
          count: 15
        },
        {
          type: "a",
          count: 3
        }
      ],
      format: "MUkk bbbb bbss cccc cccc cccc 000d dd"
    },
    {
      country: "MC",
      total: 27,
      bban: [
        {
          type: "n",
          count: 10
        },
        {
          type: "c",
          count: 11
        },
        {
          type: "n",
          count: 2
        }
      ],
      format: "MCkk bbbb bsss sscc cccc cccc cxx"
    },
    {
      country: "MD",
      total: 24,
      bban: [
        {
          type: "c",
          count: 2
        },
        {
          type: "c",
          count: 18
        }
      ],
      format: "MDkk bbcc cccc cccc cccc cccc"
    },
    {
      country: "ME",
      total: 22,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "n",
          count: 15
        }
      ],
      format: "MEkk bbbc cccc cccc cccc xx"
    },
    {
      country: "NL",
      total: 18,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "NLkk bbbb cccc cccc cc"
    },
    {
      country: "NO",
      total: 15,
      bban: [
        {
          type: "n",
          count: 4
        },
        {
          type: "n",
          count: 7
        }
      ],
      format: "NOkk bbbb cccc ccx"
    },
    {
      country: "PK",
      total: 24,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "PKkk bbbb cccc cccc cccc cccc"
    },
    {
      country: "PS",
      total: 29,
      bban: [
        {
          type: "c",
          count: 4
        },
        {
          type: "n",
          count: 9
        },
        {
          type: "n",
          count: 12
        }
      ],
      format: "PSkk bbbb xxxx xxxx xccc cccc cccc c"
    },
    {
      country: "PL",
      total: 28,
      bban: [
        {
          type: "n",
          count: 8
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "PLkk bbbs sssx cccc cccc cccc cccc"
    },
    {
      country: "PT",
      total: 25,
      bban: [
        {
          type: "n",
          count: 8
        },
        {
          type: "n",
          count: 13
        }
      ],
      format: "PTkk bbbb ssss cccc cccc cccx x"
    },
    {
      country: "QA",
      total: 29,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "c",
          count: 21
        }
      ],
      format: "QAkk bbbb cccc cccc cccc cccc cccc c"
    },
    {
      country: "RO",
      total: 24,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "c",
          count: 16
        }
      ],
      format: "ROkk bbbb cccc cccc cccc cccc"
    },
    {
      country: "SM",
      total: 27,
      bban: [
        {
          type: "a",
          count: 1
        },
        {
          type: "n",
          count: 10
        },
        {
          type: "c",
          count: 12
        }
      ],
      format: "SMkk xaaa aabb bbbc cccc cccc ccc"
    },
    {
      country: "SA",
      total: 24,
      bban: [
        {
          type: "n",
          count: 2
        },
        {
          type: "c",
          count: 18
        }
      ],
      format: "SAkk bbcc cccc cccc cccc cccc"
    },
    {
      country: "RS",
      total: 22,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "n",
          count: 15
        }
      ],
      format: "RSkk bbbc cccc cccc cccc xx"
    },
    {
      country: "SK",
      total: 24,
      bban: [
        {
          type: "n",
          count: 10
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "SKkk bbbb ssss sscc cccc cccc"
    },
    {
      country: "SI",
      total: 19,
      bban: [
        {
          type: "n",
          count: 5
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "SIkk bbss sccc cccc cxx"
    },
    {
      country: "ES",
      total: 24,
      bban: [
        {
          type: "n",
          count: 10
        },
        {
          type: "n",
          count: 10
        }
      ],
      format: "ESkk bbbb gggg xxcc cccc cccc"
    },
    {
      country: "SE",
      total: 24,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "n",
          count: 17
        }
      ],
      format: "SEkk bbbc cccc cccc cccc cccc"
    },
    {
      country: "CH",
      total: 21,
      bban: [
        {
          type: "n",
          count: 5
        },
        {
          type: "c",
          count: 12
        }
      ],
      format: "CHkk bbbb bccc cccc cccc c"
    },
    {
      country: "TN",
      total: 24,
      bban: [
        {
          type: "n",
          count: 5
        },
        {
          type: "n",
          count: 15
        }
      ],
      format: "TNkk bbss sccc cccc cccc cccc"
    },
    {
      country: "TR",
      total: 26,
      bban: [
        {
          type: "n",
          count: 5
        },
        {
          type: "n",
          count: 1
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "TRkk bbbb bxcc cccc cccc cccc cc"
    },
    {
      country: "AE",
      total: 23,
      bban: [
        {
          type: "n",
          count: 3
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "AEkk bbbc cccc cccc cccc ccc"
    },
    {
      country: "GB",
      total: 22,
      bban: [
        {
          type: "a",
          count: 4
        },
        {
          type: "n",
          count: 6
        },
        {
          type: "n",
          count: 8
        }
      ],
      format: "GBkk bbbb ssss sscc cccc cc"
    },
    {
      country: "VG",
      total: 24,
      bban: [
        {
          type: "c",
          count: 4
        },
        {
          type: "n",
          count: 16
        }
      ],
      format: "VGkk bbbb cccc cccc cccc cccc"
    }
  ],
  iso3166: [
    "AD",
    "AE",
    "AF",
    "AG",
    "AI",
    "AL",
    "AM",
    "AO",
    "AQ",
    "AR",
    "AS",
    "AT",
    "AU",
    "AW",
    "AX",
    "AZ",
    "BA",
    "BB",
    "BD",
    "BE",
    "BF",
    "BG",
    "BH",
    "BI",
    "BJ",
    "BL",
    "BM",
    "BN",
    "BO",
    "BQ",
    "BR",
    "BS",
    "BT",
    "BV",
    "BW",
    "BY",
    "BZ",
    "CA",
    "CC",
    "CD",
    "CF",
    "CG",
    "CH",
    "CI",
    "CK",
    "CL",
    "CM",
    "CN",
    "CO",
    "CR",
    "CU",
    "CV",
    "CW",
    "CX",
    "CY",
    "CZ",
    "DE",
    "DJ",
    "DK",
    "DM",
    "DO",
    "DZ",
    "EC",
    "EE",
    "EG",
    "EH",
    "ER",
    "ES",
    "ET",
    "FI",
    "FJ",
    "FK",
    "FM",
    "FO",
    "FR",
    "GA",
    "GB",
    "GD",
    "GE",
    "GF",
    "GG",
    "GH",
    "GI",
    "GL",
    "GM",
    "GN",
    "GP",
    "GQ",
    "GR",
    "GS",
    "GT",
    "GU",
    "GW",
    "GY",
    "HK",
    "HM",
    "HN",
    "HR",
    "HT",
    "HU",
    "ID",
    "IE",
    "IL",
    "IM",
    "IN",
    "IO",
    "IQ",
    "IR",
    "IS",
    "IT",
    "JE",
    "JM",
    "JO",
    "JP",
    "KE",
    "KG",
    "KH",
    "KI",
    "KM",
    "KN",
    "KP",
    "KR",
    "KW",
    "KY",
    "KZ",
    "LA",
    "LB",
    "LC",
    "LI",
    "LK",
    "LR",
    "LS",
    "LT",
    "LU",
    "LV",
    "LY",
    "MA",
    "MC",
    "MD",
    "ME",
    "MF",
    "MG",
    "MH",
    "MK",
    "ML",
    "MM",
    "MN",
    "MO",
    "MP",
    "MQ",
    "MR",
    "MS",
    "MT",
    "MU",
    "MV",
    "MW",
    "MX",
    "MY",
    "MZ",
    "NA",
    "NC",
    "NE",
    "NF",
    "NG",
    "NI",
    "NL",
    "NO",
    "NP",
    "NR",
    "NU",
    "NZ",
    "OM",
    "PA",
    "PE",
    "PF",
    "PG",
    "PH",
    "PK",
    "PL",
    "PM",
    "PN",
    "PR",
    "PS",
    "PT",
    "PW",
    "PY",
    "QA",
    "RE",
    "RO",
    "RS",
    "RU",
    "RW",
    "SA",
    "SB",
    "SC",
    "SD",
    "SE",
    "SG",
    "SH",
    "SI",
    "SJ",
    "SK",
    "SL",
    "SM",
    "SN",
    "SO",
    "SR",
    "SS",
    "ST",
    "SV",
    "SX",
    "SY",
    "SZ",
    "TC",
    "TD",
    "TF",
    "TG",
    "TH",
    "TJ",
    "TK",
    "TL",
    "TM",
    "TN",
    "TO",
    "TR",
    "TT",
    "TV",
    "TW",
    "TZ",
    "UA",
    "UG",
    "UM",
    "US",
    "UY",
    "UZ",
    "VA",
    "VC",
    "VE",
    "VG",
    "VI",
    "VN",
    "VU",
    "WF",
    "WS",
    "XK",
    "YE",
    "YT",
    "ZA",
    "ZM",
    "ZW"
  ],
  mod97: (digitStr) => {
    let m = 0;
    for (let i = 0; i < digitStr.length; i++) {
      m = (m * 10 + +digitStr[i]) % 97;
    }
    return m;
  },
  pattern10: ["01", "02", "03", "04", "05", "06", "07", "08", "09"],
  pattern100: ["001", "002", "003", "004", "005", "006", "007", "008", "009"],
  toDigitString: (str) => str.replace(/[A-Z]/gi, (match) => String(match.toUpperCase().charCodeAt(0) - 55))
};
class Finance {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Finance.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  account(length) {
    length = length || 8;
    let template = "";
    for (let i = 0; i < length; i++) {
      template += "#";
    }
    length = null;
    return this.faker.helpers.replaceSymbolWithNumber(template);
  }
  accountName() {
    return [
      this.faker.helpers.arrayElement(this.faker.definitions.finance.account_type),
      "Account"
    ].join(" ");
  }
  routingNumber() {
    const routingNumber = this.faker.helpers.replaceSymbolWithNumber("########");
    let sum = 0;
    for (let i = 0; i < routingNumber.length; i += 3) {
      sum += Number(routingNumber[i]) * 3;
      sum += Number(routingNumber[i + 1]) * 7;
      sum += Number(routingNumber[i + 2]) || 0;
    }
    return `${routingNumber}${Math.ceil(sum / 10) * 10 - sum}`;
  }
  mask(length, parens, ellipsis) {
    length = length || 4;
    parens = parens == null ? true : parens;
    ellipsis = ellipsis == null ? true : ellipsis;
    let template = "";
    for (let i = 0; i < length; i++) {
      template = `${template}#`;
    }
    template = ellipsis ? ["...", template].join("") : template;
    template = parens ? ["(", template, ")"].join("") : template;
    template = this.faker.helpers.replaceSymbolWithNumber(template);
    return template;
  }
  amount(min = 0, max = 1e3, dec = 2, symbol = "", autoFormat) {
    const randValue = this.faker.datatype.number({
      max,
      min,
      precision: Math.pow(10, -dec)
    });
    let formattedString;
    if (autoFormat) {
      formattedString = randValue.toLocaleString(void 0, {
        minimumFractionDigits: dec
      });
    } else {
      formattedString = randValue.toFixed(dec);
    }
    return symbol + formattedString;
  }
  transactionType() {
    return this.faker.helpers.arrayElement(this.faker.definitions.finance.transaction_type);
  }
  currencyCode() {
    return this.faker.helpers.objectValue(this.faker.definitions.finance.currency)["code"];
  }
  currencyName() {
    return this.faker.helpers.objectKey(this.faker.definitions.finance.currency);
  }
  currencySymbol() {
    let symbol;
    while (!symbol) {
      symbol = this.faker.helpers.objectValue(this.faker.definitions.finance.currency)["symbol"];
    }
    return symbol;
  }
  bitcoinAddress() {
    const addressLength = this.faker.datatype.number({ min: 25, max: 34 });
    let address2 = this.faker.helpers.arrayElement(["1", "3"]);
    for (let i = 0; i < addressLength - 1; i++)
      address2 += this.faker.helpers.arrayElement("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ".split(""));
    return address2;
  }
  litecoinAddress() {
    const addressLength = this.faker.datatype.number({ min: 26, max: 33 });
    let address2 = this.faker.helpers.arrayElement(["L", "M", "3"]);
    for (let i = 0; i < addressLength - 1; i++)
      address2 += this.faker.helpers.arrayElement("123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ".split(""));
    return address2;
  }
  creditCardNumber(issuer = "") {
    let format;
    const localeFormat = this.faker.definitions.finance.credit_card;
    const normalizedIssuer = issuer.toLowerCase();
    if (normalizedIssuer in localeFormat) {
      format = this.faker.helpers.arrayElement(localeFormat[normalizedIssuer]);
    } else if (issuer.match(/#/)) {
      format = issuer;
    } else {
      const formats2 = this.faker.helpers.objectValue(localeFormat);
      format = this.faker.helpers.arrayElement(formats2);
    }
    format = format.replace(/\//g, "");
    return this.faker.helpers.replaceCreditCardSymbols(format);
  }
  creditCardCVV() {
    let cvv = "";
    for (let i = 0; i < 3; i++) {
      cvv += this.faker.datatype.number({ max: 9 }).toString();
    }
    return cvv;
  }
  creditCardIssuer() {
    return this.faker.helpers.objectKey(this.faker.definitions.finance.credit_card);
  }
  pin(length = 4) {
    if (length < 1) {
      throw new FakerError("minimum length is 1");
    }
    return Array.from({ length }, () => this.faker.datatype.number(9)).join("");
  }
  ethereumAddress() {
    const address2 = this.faker.datatype.hexadecimal(40).toLowerCase();
    return address2;
  }
  iban(formatted = false, countryCode) {
    const ibanFormat = countryCode ? iban.formats.find((f) => f.country === countryCode) : this.faker.helpers.arrayElement(iban.formats);
    if (!ibanFormat) {
      throw new FakerError(`Country code ${countryCode} not supported.`);
    }
    let s = "";
    let count = 0;
    for (const bban of ibanFormat.bban) {
      let c = bban.count;
      count += bban.count;
      while (c > 0) {
        if (bban.type === "a") {
          s += this.faker.helpers.arrayElement(iban.alpha);
        } else if (bban.type === "c") {
          if (this.faker.datatype.number(100) < 80) {
            s += this.faker.datatype.number(9);
          } else {
            s += this.faker.helpers.arrayElement(iban.alpha);
          }
        } else {
          if (c >= 3 && this.faker.datatype.number(100) < 30) {
            if (this.faker.datatype.boolean()) {
              s += this.faker.helpers.arrayElement(iban.pattern100);
              c -= 2;
            } else {
              s += this.faker.helpers.arrayElement(iban.pattern10);
              c--;
            }
          } else {
            s += this.faker.datatype.number(9);
          }
        }
        c--;
      }
      s = s.substring(0, count);
    }
    let checksum = 98 - iban.mod97(iban.toDigitString(`${s}${ibanFormat.country}00`));
    if (checksum < 10) {
      checksum = `0${checksum}`;
    }
    const result = `${ibanFormat.country}${checksum}${s}`;
    return formatted ? result.match(/.{1,4}/g).join(" ") : result;
  }
  bic() {
    const vowels = ["A", "E", "I", "O", "U"];
    const prob = this.faker.datatype.number(100);
    return [
      this.faker.helpers.replaceSymbols("???"),
      this.faker.helpers.arrayElement(vowels),
      this.faker.helpers.arrayElement(iban.iso3166),
      this.faker.helpers.replaceSymbols("?"),
      "1",
      prob < 10 ? this.faker.helpers.replaceSymbols(`?${this.faker.helpers.arrayElement(vowels)}?`) : prob < 40 ? this.faker.helpers.replaceSymbols("###") : ""
    ].join("");
  }
  transactionDescription() {
    const amount = this.amount();
    const company2 = this.faker.company.companyName();
    const transactionType = this.transactionType();
    const account = this.account();
    const card = this.mask();
    const currency2 = this.currencyCode();
    return `${transactionType} transaction at ${company2} using card ending with ***${card} for ${currency2} ${amount} in account ***${account}`;
  }
}
class Git {
  constructor(faker2) {
    this.faker = faker2;
    this.hexChars = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
      "a",
      "b",
      "c",
      "d",
      "e",
      "f"
    ];
    for (const name2 of Object.getOwnPropertyNames(Git.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  branch() {
    const noun2 = this.faker.hacker.noun().replace(" ", "-");
    const verb2 = this.faker.hacker.verb().replace(" ", "-");
    return `${noun2}-${verb2}`;
  }
  commitEntry(options = {}) {
    var _a;
    const lines = [`commit ${this.faker.git.commitSha()}`];
    if (options.merge || this.faker.datatype.number({ min: 0, max: 4 }) === 0) {
      lines.push(`Merge: ${this.shortSha()} ${this.shortSha()}`);
    }
    lines.push(`Author: ${this.faker.name.firstName()} ${this.faker.name.lastName()} <${this.faker.internet.email()}>`, `Date: ${this.faker.date.recent().toString()}`, "", `\xA0\xA0\xA0\xA0${this.commitMessage()}`, "");
    const eolOption = (_a = options.eol) != null ? _a : "CRLF";
    const eolChar = eolOption === "CRLF" ? "\r\n" : "\n";
    const entry2 = lines.join(eolChar);
    return entry2;
  }
  commitMessage() {
    return `${this.faker.hacker.verb()} ${this.faker.hacker.adjective()} ${this.faker.hacker.noun()}`;
  }
  commitSha() {
    let commit = "";
    for (let i = 0; i < 40; i++) {
      commit += this.faker.helpers.arrayElement(this.hexChars);
    }
    return commit;
  }
  shortSha() {
    let shortSha = "";
    for (let i = 0; i < 7; i++) {
      shortSha += this.faker.helpers.arrayElement(this.hexChars);
    }
    return shortSha;
  }
}
class Hacker {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Hacker.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  abbreviation() {
    return this.faker.helpers.arrayElement(this.faker.definitions.hacker.abbreviation);
  }
  adjective() {
    return this.faker.helpers.arrayElement(this.faker.definitions.hacker.adjective);
  }
  noun() {
    return this.faker.helpers.arrayElement(this.faker.definitions.hacker.noun);
  }
  verb() {
    return this.faker.helpers.arrayElement(this.faker.definitions.hacker.verb);
  }
  ingverb() {
    return this.faker.helpers.arrayElement(this.faker.definitions.hacker.ingverb);
  }
  phrase() {
    const data = {
      abbreviation: this.abbreviation,
      adjective: this.adjective,
      ingverb: this.ingverb,
      noun: this.noun,
      verb: this.verb
    };
    const phrase2 = this.faker.helpers.arrayElement(this.faker.definitions.hacker.phrase);
    return this.faker.helpers.mustache(phrase2, data);
  }
}
function luhnCheckValue(str) {
  const checksum = luhnChecksum(str.replace(/L?$/, "0"));
  return checksum === 0 ? 0 : 10 - checksum;
}
function luhnChecksum(str) {
  str = str.replace(/[\s-]/g, "");
  let sum = 0;
  let alternate = false;
  for (let i = str.length - 1; i >= 0; i--) {
    let n = parseInt(str.substring(i, i + 1));
    if (alternate) {
      n *= 2;
      if (n > 9) {
        n = n % 10 + 1;
      }
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10;
}
class Helpers {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Helpers.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  slugify(string = "") {
    return string.replace(/ /g, "-").replace(/[^\一-龠\ぁ-ゔ\ァ-ヴー\w\.\-]+/g, "");
  }
  replaceSymbolWithNumber(string = "", symbol = "#") {
    let str = "";
    for (let i = 0; i < string.length; i++) {
      if (string.charAt(i) === symbol) {
        str += this.faker.datatype.number(9);
      } else if (string.charAt(i) === "!") {
        str += this.faker.datatype.number({ min: 2, max: 9 });
      } else {
        str += string.charAt(i);
      }
    }
    return str;
  }
  replaceSymbols(string = "") {
    const alpha = [
      "A",
      "B",
      "C",
      "D",
      "E",
      "F",
      "G",
      "H",
      "I",
      "J",
      "K",
      "L",
      "M",
      "N",
      "O",
      "P",
      "Q",
      "R",
      "S",
      "T",
      "U",
      "V",
      "W",
      "X",
      "Y",
      "Z"
    ];
    let str = "";
    for (let i = 0; i < string.length; i++) {
      if (string.charAt(i) === "#") {
        str += this.faker.datatype.number(9);
      } else if (string.charAt(i) === "?") {
        str += this.arrayElement(alpha);
      } else if (string.charAt(i) === "*") {
        str += this.faker.datatype.boolean() ? this.arrayElement(alpha) : this.faker.datatype.number(9);
      } else {
        str += string.charAt(i);
      }
    }
    return str;
  }
  replaceCreditCardSymbols(string = "6453-####-####-####-###L", symbol = "#") {
    string = this.regexpStyleStringParse(string);
    string = this.replaceSymbolWithNumber(string, symbol);
    const checkNum = luhnCheckValue(string);
    return string.replace("L", String(checkNum));
  }
  repeatString(string = "", num = 0) {
    let text = "";
    for (let i = 0; i < num; i++) {
      text += string.toString();
    }
    return text;
  }
  regexpStyleStringParse(string = "") {
    const RANGE_REP_REG = /(.)\{(\d+)\,(\d+)\}/;
    const REP_REG = /(.)\{(\d+)\}/;
    const RANGE_REG = /\[(\d+)\-(\d+)\]/;
    let min;
    let max;
    let tmp;
    let repetitions;
    let token = string.match(RANGE_REP_REG);
    while (token != null) {
      min = parseInt(token[2]);
      max = parseInt(token[3]);
      if (min > max) {
        tmp = max;
        max = min;
        min = tmp;
      }
      repetitions = this.faker.datatype.number({ min, max });
      string = string.slice(0, token.index) + this.repeatString(token[1], repetitions) + string.slice(token.index + token[0].length);
      token = string.match(RANGE_REP_REG);
    }
    token = string.match(REP_REG);
    while (token != null) {
      repetitions = parseInt(token[2]);
      string = string.slice(0, token.index) + this.repeatString(token[1], repetitions) + string.slice(token.index + token[0].length);
      token = string.match(REP_REG);
    }
    token = string.match(RANGE_REG);
    while (token != null) {
      min = parseInt(token[1]);
      max = parseInt(token[2]);
      if (min > max) {
        tmp = max;
        max = min;
        min = tmp;
      }
      string = string.slice(0, token.index) + this.faker.datatype.number({ min, max }).toString() + string.slice(token.index + token[0].length);
      token = string.match(RANGE_REG);
    }
    return string;
  }
  shuffle(o) {
    if (o == null || o.length === 0) {
      return o || [];
    }
    for (let i = o.length - 1; i > 0; --i) {
      const j = this.faker.datatype.number(i);
      const x = o[i];
      o[i] = o[j];
      o[j] = x;
    }
    return o;
  }
  uniqueArray(source, length) {
    if (Array.isArray(source)) {
      const set2 = new Set(source);
      const array = Array.from(set2);
      return this.shuffle(array).splice(0, length);
    }
    const set = /* @__PURE__ */ new Set();
    try {
      if (typeof source === "function") {
        while (set.size < length) {
          set.add(source());
        }
      }
    } catch {
    }
    return Array.from(set);
  }
  mustache(str, data) {
    if (str == null) {
      return "";
    }
    for (const p in data) {
      const re = new RegExp(`{{${p}}}`, "g");
      const value = data[p];
      if (typeof value === "string") {
        str = str.replace(re, value);
      } else {
        str = str.replace(re, value);
      }
    }
    return str;
  }
  maybe(callback, options = {}) {
    const { probability = 0.5 } = options;
    if (this.faker.datatype.float({ min: 0, max: 1 }) < probability) {
      return callback();
    }
    return void 0;
  }
  objectKey(object) {
    const array = Object.keys(object);
    return this.arrayElement(array);
  }
  objectValue(object) {
    const key = this.faker.helpers.objectKey(object);
    return object[key];
  }
  arrayElement(array = ["a", "b", "c"]) {
    const index = array.length > 1 ? this.faker.datatype.number({ max: array.length - 1 }) : 0;
    return array[index];
  }
  arrayElements(array = ["a", "b", "c"], count) {
    if (typeof count !== "number") {
      count = array.length === 0 ? 0 : this.faker.datatype.number({ min: 1, max: array.length });
    } else if (count > array.length) {
      count = array.length;
    } else if (count < 0) {
      count = 0;
    }
    const arrayCopy = array.slice(0);
    let i = array.length;
    const min = i - count;
    let temp;
    let index;
    while (i-- > min) {
      index = Math.floor((i + 1) * this.faker.datatype.float({ min: 0, max: 0.99 }));
      temp = arrayCopy[index];
      arrayCopy[index] = arrayCopy[i];
      arrayCopy[i] = temp;
    }
    return arrayCopy.slice(min);
  }
}
class LoremPicsum {
  constructor(faker2) {
    this.faker = faker2;
  }
  image(width, height, grayscale, blur) {
    return this.imageUrl(width, height, grayscale, blur);
  }
  imageGrayscale(width, height, grayscale) {
    return this.imageUrl(width, height, grayscale);
  }
  imageBlurred(width, height, blur) {
    return this.imageUrl(width, height, void 0, blur);
  }
  imageRandomSeeded(width, height, grayscale, blur, seed) {
    return this.imageUrl(width, height, grayscale, blur, seed);
  }
  avatar() {
    deprecated({
      deprecated: "faker.image.lorempicsum.avatar()",
      proposed: "faker.internet.avatar()",
      since: "7.3",
      until: "8.0"
    });
    return this.faker.internet.avatar();
  }
  imageUrl(width, height, grayscale, blur, seed) {
    width = width || 640;
    height = height || 480;
    let url = "https://picsum.photos";
    if (seed) {
      url += `/seed/${seed}`;
    }
    url += `/${width}/${height}`;
    if (grayscale && blur) {
      return `${url}?grayscale&blur=${blur}`;
    }
    if (grayscale) {
      return `${url}?grayscale`;
    }
    if (blur) {
      return `${url}?blur=${blur}`;
    }
    return url;
  }
}
class Lorempixel {
  constructor(faker2) {
    this.faker = faker2;
  }
  image(width, height, randomize) {
    const categories = [
      "abstract",
      "animals",
      "business",
      "cats",
      "city",
      "food",
      "nightlife",
      "fashion",
      "people",
      "nature",
      "sports",
      "technics",
      "transport"
    ];
    return this[this.faker.helpers.arrayElement(categories)](width, height, randomize);
  }
  avatar() {
    deprecated({
      deprecated: "faker.image.lorempixel.avatar()",
      proposed: "faker.internet.avatar()",
      since: "7.3",
      until: "8.0"
    });
    return this.faker.internet.avatar();
  }
  imageUrl(width, height, category, randomize) {
    width = width || 640;
    height = height || 480;
    let url = `https://lorempixel.com/${width}/${height}`;
    if (category != null) {
      url += `/${category}`;
    }
    if (randomize) {
      url += `?${this.faker.datatype.number()}`;
    }
    return url;
  }
  abstract(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "abstract", randomize);
  }
  animals(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "animals", randomize);
  }
  business(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "business", randomize);
  }
  cats(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "cats", randomize);
  }
  city(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "city", randomize);
  }
  food(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "food", randomize);
  }
  nightlife(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "nightlife", randomize);
  }
  fashion(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "fashion", randomize);
  }
  people(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "people", randomize);
  }
  nature(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "nature", randomize);
  }
  sports(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "sports", randomize);
  }
  technics(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "technics", randomize);
  }
  transport(width, height, randomize) {
    return this.faker.image.lorempixel.imageUrl(width, height, "transport", randomize);
  }
}
class Unsplash {
  constructor(faker2) {
    this.faker = faker2;
  }
  get categories() {
    deprecated({
      deprecated: "faker.image.unsplash.categories",
      since: "7.3",
      until: "8.0"
    });
    return ["food", "nature", "people", "technology", "objects", "buildings"];
  }
  image(width, height, keyword) {
    return this.imageUrl(width, height, void 0, keyword);
  }
  avatar() {
    deprecated({
      deprecated: "faker.image.unsplash.avatar()",
      proposed: "faker.internet.avatar()",
      since: "7.3",
      until: "8.0"
    });
    return this.faker.internet.avatar();
  }
  imageUrl(width, height, category, keyword) {
    width = width || 640;
    height = height || 480;
    let url = "https://source.unsplash.com";
    if (category != null) {
      url += `/category/${category}`;
    }
    url += `/${width}x${height}`;
    if (keyword != null) {
      const keywordFormat = /^([A-Za-z0-9].+,[A-Za-z0-9]+)$|^([A-Za-z0-9]+)$/;
      if (keywordFormat.test(keyword)) {
        url += `?${keyword}`;
      }
    }
    return url;
  }
  food(width, height, keyword) {
    return this.faker.image.unsplash.imageUrl(width, height, "food", keyword);
  }
  people(width, height, keyword) {
    return this.faker.image.unsplash.imageUrl(width, height, "people", keyword);
  }
  nature(width, height, keyword) {
    return this.faker.image.unsplash.imageUrl(width, height, "nature", keyword);
  }
  technology(width, height, keyword) {
    return this.faker.image.unsplash.imageUrl(width, height, "technology", keyword);
  }
  objects(width, height, keyword) {
    return this.faker.image.unsplash.imageUrl(width, height, "objects", keyword);
  }
  buildings(width, height, keyword) {
    return this.faker.image.unsplash.imageUrl(width, height, "buildings", keyword);
  }
}
class Image {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Image.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
    this.lorempixel = new Lorempixel(this.faker);
    this.unsplash = new Unsplash(this.faker);
    this.lorempicsum = new LoremPicsum(this.faker);
  }
  image(width, height, randomize) {
    const categories = [
      "abstract",
      "animals",
      "business",
      "cats",
      "city",
      "food",
      "nightlife",
      "fashion",
      "people",
      "nature",
      "sports",
      "technics",
      "transport"
    ];
    return this[this.faker.helpers.arrayElement(categories)](width, height, randomize);
  }
  avatar() {
    return this.faker.internet.avatar();
  }
  imageUrl(width, height, category, randomize) {
    width = width || 640;
    height = height || 480;
    let url = `https://loremflickr.com/${width}/${height}`;
    if (category != null) {
      url += `/${category}`;
    }
    if (randomize) {
      url += `?${this.faker.datatype.number()}`;
    }
    return url;
  }
  abstract(width, height, randomize) {
    return this.imageUrl(width, height, "abstract", randomize);
  }
  animals(width, height, randomize) {
    return this.imageUrl(width, height, "animals", randomize);
  }
  business(width, height, randomize) {
    return this.imageUrl(width, height, "business", randomize);
  }
  cats(width, height, randomize) {
    return this.imageUrl(width, height, "cats", randomize);
  }
  city(width, height, randomize) {
    return this.imageUrl(width, height, "city", randomize);
  }
  food(width, height, randomize) {
    return this.imageUrl(width, height, "food", randomize);
  }
  nightlife(width, height, randomize) {
    return this.imageUrl(width, height, "nightlife", randomize);
  }
  fashion(width, height, randomize) {
    return this.imageUrl(width, height, "fashion", randomize);
  }
  people(width, height, randomize) {
    return this.imageUrl(width, height, "people", randomize);
  }
  nature(width, height, randomize) {
    return this.imageUrl(width, height, "nature", randomize);
  }
  sports(width, height, randomize) {
    return this.imageUrl(width, height, "sports", randomize);
  }
  technics(width, height, randomize) {
    return this.imageUrl(width, height, "technics", randomize);
  }
  transport(width, height, randomize) {
    return this.imageUrl(width, height, "transport", randomize);
  }
  dataUri(width, height, color2 = "grey") {
    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" baseProfile="full" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color2}"/><text x="${width / 2}" y="${height / 2}" font-size="20" alignment-baseline="middle" text-anchor="middle" fill="white">${width}x${height}</text></svg>`;
    const rawPrefix = "data:image/svg+xml;charset=UTF-8,";
    return rawPrefix + encodeURIComponent(svgString);
  }
}
function generate(faker2) {
  function rnd(a, b) {
    a = a || 0;
    b = b || 100;
    if (typeof b === "number" && typeof a === "number") {
      return faker2.datatype.number({ min: a, max: b });
    }
    if (Array.isArray(a)) {
      return faker2.helpers.arrayElement(a);
    }
    if (a && typeof a === "object") {
      return ((obj) => {
        const rand = rnd(0, 100) / 100;
        let min = 0;
        let max = 0;
        let return_val;
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            max = obj[key] + min;
            return_val = key;
            if (rand >= min && rand <= max) {
              break;
            }
            min = min + obj[key];
          }
        }
        return return_val;
      })(a);
    }
    throw new TypeError(`Invalid arguments passed to rnd. (${b ? `${a}, ${b}` : a})`);
  }
  function randomLang() {
    return rnd([
      "AB",
      "AF",
      "AN",
      "AR",
      "AS",
      "AZ",
      "BE",
      "BG",
      "BN",
      "BO",
      "BR",
      "BS",
      "CA",
      "CE",
      "CO",
      "CS",
      "CU",
      "CY",
      "DA",
      "DE",
      "EL",
      "EN",
      "EO",
      "ES",
      "ET",
      "EU",
      "FA",
      "FI",
      "FJ",
      "FO",
      "FR",
      "FY",
      "GA",
      "GD",
      "GL",
      "GV",
      "HE",
      "HI",
      "HR",
      "HT",
      "HU",
      "HY",
      "ID",
      "IS",
      "IT",
      "JA",
      "JV",
      "KA",
      "KG",
      "KO",
      "KU",
      "KW",
      "KY",
      "LA",
      "LB",
      "LI",
      "LN",
      "LT",
      "LV",
      "MG",
      "MK",
      "MN",
      "MO",
      "MS",
      "MT",
      "MY",
      "NB",
      "NE",
      "NL",
      "NN",
      "NO",
      "OC",
      "PL",
      "PT",
      "RM",
      "RO",
      "RU",
      "SC",
      "SE",
      "SK",
      "SL",
      "SO",
      "SQ",
      "SR",
      "SV",
      "SW",
      "TK",
      "TR",
      "TY",
      "UK",
      "UR",
      "UZ",
      "VI",
      "VO",
      "YI",
      "ZH"
    ]);
  }
  function randomBrowserAndOS() {
    const browser2 = rnd({
      chrome: 0.45132810566,
      iexplorer: 0.27477061836,
      firefox: 0.19384170608,
      safari: 0.06186781118,
      opera: 0.01574236955
    });
    const os = {
      chrome: { win: 0.89, mac: 0.09, lin: 0.02 },
      firefox: { win: 0.83, mac: 0.16, lin: 0.01 },
      opera: { win: 0.91, mac: 0.03, lin: 0.06 },
      safari: { win: 0.04, mac: 0.96 },
      iexplorer: ["win"]
    };
    return [browser2, rnd(os[browser2])];
  }
  function randomProc(arch) {
    const procs = {
      lin: ["i686", "x86_64"],
      mac: { Intel: 0.48, PPC: 0.01, "U; Intel": 0.48, "U; PPC": 0.01 },
      win: ["", "WOW64", "Win64; x64"]
    };
    return rnd(procs[arch]);
  }
  function randomRevision(dots) {
    let return_val = "";
    for (let x = 0; x < dots; x++) {
      return_val += `.${rnd(0, 9)}`;
    }
    return return_val;
  }
  const version_string = {
    net() {
      return [rnd(1, 4), rnd(0, 9), rnd(1e4, 99999), rnd(0, 9)].join(".");
    },
    nt() {
      return `${rnd(5, 6)}.${rnd(0, 3)}`;
    },
    ie() {
      return rnd(7, 11);
    },
    trident() {
      return `${rnd(3, 7)}.${rnd(0, 1)}`;
    },
    osx(delim) {
      return [10, rnd(5, 10), rnd(0, 9)].join(delim || ".");
    },
    chrome() {
      return [rnd(13, 39), 0, rnd(800, 899), 0].join(".");
    },
    presto() {
      return `2.9.${rnd(160, 190)}`;
    },
    presto2() {
      return `${rnd(10, 12)}.00`;
    },
    safari() {
      return `${rnd(531, 538)}.${rnd(0, 2)}.${rnd(0, 2)}`;
    }
  };
  const browser = {
    firefox(arch) {
      const firefox_ver = `${rnd(5, 15)}${randomRevision(2)}`, gecko_ver = `Gecko/20100101 Firefox/${firefox_ver}`, proc = randomProc(arch), os_ver = arch === "win" ? `(Windows NT ${version_string.nt()}${proc ? `; ${proc}` : ""}` : arch === "mac" ? `(Macintosh; ${proc} Mac OS X ${version_string.osx()}` : `(X11; Linux ${proc}`;
      return `Mozilla/5.0 ${os_ver}; rv:${firefox_ver.slice(0, -2)}) ${gecko_ver}`;
    },
    iexplorer() {
      const ver = version_string.ie();
      if (ver >= 11) {
        return `Mozilla/5.0 (Windows NT 6.${rnd(1, 3)}; Trident/7.0; ${rnd([
          "Touch; ",
          ""
        ])}rv:11.0) like Gecko`;
      }
      return `Mozilla/5.0 (compatible; MSIE ${ver}.0; Windows NT ${version_string.nt()}; Trident/${version_string.trident()}${rnd(0, 1) === 1 ? `; .NET CLR ${version_string.net()}` : ""})`;
    },
    opera(arch) {
      const presto_ver = ` Presto/${version_string.presto()} Version/${version_string.presto2()})`, os_ver = arch === "win" ? `(Windows NT ${version_string.nt()}; U; ${randomLang()}${presto_ver}` : arch === "lin" ? `(X11; Linux ${randomProc(arch)}; U; ${randomLang()}${presto_ver}` : `(Macintosh; Intel Mac OS X ${version_string.osx()} U; ${randomLang()} Presto/${version_string.presto()} Version/${version_string.presto2()})`;
      return `Opera/${rnd(9, 14)}.${rnd(0, 99)} ${os_ver}`;
    },
    safari(arch) {
      const safari = version_string.safari(), ver = `${rnd(4, 7)}.${rnd(0, 1)}.${rnd(0, 10)}`, os_ver = arch === "mac" ? `(Macintosh; ${randomProc("mac")} Mac OS X ${version_string.osx("_")} rv:${rnd(2, 6)}.0; ${randomLang()}) ` : `(Windows; U; Windows NT ${version_string.nt()})`;
      return `Mozilla/5.0 ${os_ver}AppleWebKit/${safari} (KHTML, like Gecko) Version/${ver} Safari/${safari}`;
    },
    chrome(arch) {
      const safari = version_string.safari(), os_ver = arch === "mac" ? `(Macintosh; ${randomProc("mac")} Mac OS X ${version_string.osx("_")}) ` : arch === "win" ? `(Windows; U; Windows NT ${version_string.nt()})` : `(X11; Linux ${randomProc(arch)}`;
      return `Mozilla/5.0 ${os_ver} AppleWebKit/${safari} (KHTML, like Gecko) Chrome/${version_string.chrome()} Safari/${safari}`;
    }
  };
  const random = randomBrowserAndOS();
  return browser[random[0]](random[1]);
}
class Internet {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Internet.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  avatar() {
    return `https://cloudflare-ipfs.com/ipfs/Qmd3W5DuhgHirLHGVixi6V76LhCkZUz6pnFt5AJBiyvHye/avatar/${this.faker.datatype.number(1249)}.jpg`;
  }
  email(firstName, lastName, provider, options) {
    provider = provider || this.faker.helpers.arrayElement(this.faker.definitions.internet.free_email);
    let localPart = this.faker.helpers.slugify(this.userName(firstName, lastName));
    if (options == null ? void 0 : options.allowSpecialCharacters) {
      const usernameChars = "._-".split("");
      const specialChars = ".!#$%&'*+-/=?^_`{|}~".split("");
      localPart = localPart.replace(this.faker.helpers.arrayElement(usernameChars), this.faker.helpers.arrayElement(specialChars));
    }
    return `${localPart}@${provider}`;
  }
  exampleEmail(firstName, lastName, options) {
    const provider = this.faker.helpers.arrayElement(this.faker.definitions.internet.example_email);
    return this.email(firstName, lastName, provider, options);
  }
  userName(firstName, lastName) {
    let result;
    firstName = firstName || this.faker.name.firstName();
    lastName = lastName || this.faker.name.lastName();
    switch (this.faker.datatype.number(2)) {
      case 0:
        result = `${firstName}${this.faker.datatype.number(99)}`;
        break;
      case 1:
        result = firstName + this.faker.helpers.arrayElement([".", "_"]) + lastName;
        break;
      case 2:
        result = `${firstName}${this.faker.helpers.arrayElement([
          ".",
          "_"
        ])}${lastName}${this.faker.datatype.number(99)}`;
        break;
    }
    result = result.toString().replace(/'/g, "");
    result = result.replace(/ /g, "");
    return result;
  }
  protocol() {
    const protocols = ["http", "https"];
    return this.faker.helpers.arrayElement(protocols);
  }
  httpMethod() {
    const httpMethods = [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "PATCH"
    ];
    return this.faker.helpers.arrayElement(httpMethods);
  }
  httpStatusCode(options = {}) {
    const {
      types = Object.keys(this.faker.definitions.internet.http_status_code)
    } = options;
    const httpStatusCodeType = this.faker.helpers.arrayElement(types);
    return this.faker.helpers.arrayElement(this.faker.definitions.internet.http_status_code[httpStatusCodeType]);
  }
  url() {
    return `${this.protocol()}://${this.domainName()}`;
  }
  domainName() {
    return `${this.domainWord()}.${this.domainSuffix()}`;
  }
  domainSuffix() {
    return this.faker.helpers.arrayElement(this.faker.definitions.internet.domain_suffix);
  }
  domainWord() {
    return `${this.faker.word.adjective()}-${this.faker.word.noun()}`.replace(/([\\~#&*{}/:<>?|\"'])/gi, "").replace(/\s/g, "-").replace(/-{2,}/g, "-").toLowerCase();
  }
  ip() {
    return this.ipv4();
  }
  ipv4() {
    const randNum = () => {
      return this.faker.datatype.number(255).toFixed(0);
    };
    const result = [];
    for (let i = 0; i < 4; i++) {
      result[i] = randNum();
    }
    return result.join(".");
  }
  ipv6() {
    const randHash = () => {
      let result2 = "";
      for (let i = 0; i < 4; i++) {
        result2 += this.faker.helpers.arrayElement([
          "0",
          "1",
          "2",
          "3",
          "4",
          "5",
          "6",
          "7",
          "8",
          "9",
          "a",
          "b",
          "c",
          "d",
          "e",
          "f"
        ]);
      }
      return result2;
    };
    const result = [];
    for (let i = 0; i < 8; i++) {
      result[i] = randHash();
    }
    return result.join(":");
  }
  port() {
    return this.faker.datatype.number({ min: 0, max: 65535 });
  }
  userAgent() {
    return generate(this.faker);
  }
  color(redBase = 0, greenBase = 0, blueBase = 0) {
    const colorFromBase = (base) => Math.floor((this.faker.datatype.number(256) + base) / 2).toString(16).padStart(2, "0");
    const red = colorFromBase(redBase);
    const green = colorFromBase(greenBase);
    const blue = colorFromBase(blueBase);
    return `#${red}${green}${blue}`;
  }
  mac(sep) {
    let i;
    let mac = "";
    let validSep = ":";
    if (["-", ""].indexOf(sep) !== -1) {
      validSep = sep;
    }
    for (i = 0; i < 12; i++) {
      mac += this.faker.datatype.number(15).toString(16);
      if (i % 2 === 1 && i !== 11) {
        mac += validSep;
      }
    }
    return mac;
  }
  password(len = 15, memorable = false, pattern = /\w/, prefix2 = "") {
    const vowel = /[aeiouAEIOU]$/;
    const consonant = /[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]$/;
    const _password = (length, memorable2, pattern2, prefix22) => {
      if (prefix22.length >= length) {
        return prefix22;
      }
      if (memorable2) {
        if (prefix22.match(consonant)) {
          pattern2 = vowel;
        } else {
          pattern2 = consonant;
        }
      }
      const n = this.faker.datatype.number(94) + 33;
      let char = String.fromCharCode(n);
      if (memorable2) {
        char = char.toLowerCase();
      }
      if (!char.match(pattern2)) {
        return _password(length, memorable2, pattern2, prefix22);
      }
      return _password(length, memorable2, pattern2, prefix22 + char);
    };
    return _password(len, memorable, pattern, prefix2);
  }
  emoji(options = {}) {
    const {
      types = Object.keys(this.faker.definitions.internet.emoji)
    } = options;
    const emojiType = this.faker.helpers.arrayElement(types);
    return this.faker.helpers.arrayElement(this.faker.definitions.internet.emoji[emojiType]);
  }
}
class Lorem {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Lorem.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  word(length) {
    const hasRightLength = (word2) => word2.length === length;
    let properLengthWords;
    if (length == null) {
      properLengthWords = this.faker.definitions.lorem.words;
    } else {
      properLengthWords = this.faker.definitions.lorem.words.filter(hasRightLength);
    }
    return this.faker.helpers.arrayElement(properLengthWords);
  }
  words(num = 3) {
    const words2 = [];
    for (let i = 0; i < num; i++) {
      words2.push(this.word());
    }
    return words2.join(" ");
  }
  sentence(wordCount) {
    if (wordCount == null) {
      wordCount = this.faker.datatype.number({ min: 3, max: 10 });
    }
    const sentence = this.words(wordCount);
    return `${sentence.charAt(0).toUpperCase() + sentence.slice(1)}.`;
  }
  slug(wordCount) {
    const words2 = this.words(wordCount);
    return this.faker.helpers.slugify(words2);
  }
  sentences(sentenceCount, separator = " ") {
    if (sentenceCount == null) {
      sentenceCount = this.faker.datatype.number({ min: 2, max: 6 });
    }
    const sentences = [];
    for (sentenceCount; sentenceCount > 0; sentenceCount--) {
      sentences.push(this.sentence());
    }
    return sentences.join(separator);
  }
  paragraph(sentenceCount = 3) {
    return this.sentences(sentenceCount + this.faker.datatype.number(3));
  }
  paragraphs(paragraphCount = 3, separator = "\n") {
    const paragraphs = [];
    for (paragraphCount; paragraphCount > 0; paragraphCount--) {
      paragraphs.push(this.paragraph());
    }
    return paragraphs.join(separator);
  }
  text() {
    const methods = [
      "word",
      "words",
      "sentence",
      "sentences",
      "paragraph",
      "paragraphs",
      "lines"
    ];
    const method = this.faker.helpers.arrayElement(methods);
    return `${this[method]()}`;
  }
  lines(lineCount) {
    if (lineCount == null) {
      lineCount = this.faker.datatype.number({ min: 1, max: 5 });
    }
    return this.sentences(lineCount, "\n");
  }
}
class MersenneTwister19937 {
  constructor() {
    this.N = 624;
    this.M = 397;
    this.MATRIX_A = 2567483615;
    this.UPPER_MASK = 2147483648;
    this.LOWER_MASK = 2147483647;
    this.mt = new Array(this.N);
    this.mti = this.N + 1;
    this.mag01 = [0, this.MATRIX_A];
  }
  unsigned32(n1) {
    return n1 < 0 ? (n1 ^ this.UPPER_MASK) + this.UPPER_MASK : n1;
  }
  subtraction32(n1, n2) {
    return n1 < n2 ? this.unsigned32(4294967296 - (n2 - n1) & 4294967295) : n1 - n2;
  }
  addition32(n1, n2) {
    return this.unsigned32(n1 + n2 & 4294967295);
  }
  multiplication32(n1, n2) {
    let sum = 0;
    for (let i = 0; i < 32; ++i) {
      if (n1 >>> i & 1) {
        sum = this.addition32(sum, this.unsigned32(n2 << i));
      }
    }
    return sum;
  }
  initGenrand(seed) {
    this.mt[0] = this.unsigned32(seed & 4294967295);
    for (this.mti = 1; this.mti < this.N; this.mti++) {
      this.mt[this.mti] = this.addition32(this.multiplication32(1812433253, this.unsigned32(this.mt[this.mti - 1] ^ this.mt[this.mti - 1] >>> 30)), this.mti);
      this.mt[this.mti] = this.unsigned32(this.mt[this.mti] & 4294967295);
    }
  }
  initByArray(initKey, keyLength) {
    this.initGenrand(19650218);
    let i = 1;
    let j = 0;
    let k = this.N > keyLength ? this.N : keyLength;
    for (; k; k--) {
      this.mt[i] = this.addition32(this.addition32(this.unsigned32(this.mt[i] ^ this.multiplication32(this.unsigned32(this.mt[i - 1] ^ this.mt[i - 1] >>> 30), 1664525)), initKey[j]), j);
      this.mt[i] = this.unsigned32(this.mt[i] & 4294967295);
      i++;
      j++;
      if (i >= this.N) {
        this.mt[0] = this.mt[this.N - 1];
        i = 1;
      }
      if (j >= keyLength) {
        j = 0;
      }
    }
    for (k = this.N - 1; k; k--) {
      this.mt[i] = this.subtraction32(this.unsigned32(this.mt[i] ^ this.multiplication32(this.unsigned32(this.mt[i - 1] ^ this.mt[i - 1] >>> 30), 1566083941)), i);
      this.mt[i] = this.unsigned32(this.mt[i] & 4294967295);
      i++;
      if (i >= this.N) {
        this.mt[0] = this.mt[this.N - 1];
        i = 1;
      }
    }
    this.mt[0] = 2147483648;
  }
  genrandInt32() {
    let y;
    if (this.mti >= this.N) {
      let kk;
      if (this.mti === this.N + 1) {
        this.initGenrand(5489);
      }
      for (kk = 0; kk < this.N - this.M; kk++) {
        y = this.unsigned32(this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.unsigned32(this.mt[kk + this.M] ^ y >>> 1 ^ this.mag01[y & 1]);
      }
      for (; kk < this.N - 1; kk++) {
        y = this.unsigned32(this.mt[kk] & this.UPPER_MASK | this.mt[kk + 1] & this.LOWER_MASK);
        this.mt[kk] = this.unsigned32(this.mt[kk + (this.M - this.N)] ^ y >>> 1 ^ this.mag01[y & 1]);
      }
      y = this.unsigned32(this.mt[this.N - 1] & this.UPPER_MASK | this.mt[0] & this.LOWER_MASK);
      this.mt[this.N - 1] = this.unsigned32(this.mt[this.M - 1] ^ y >>> 1 ^ this.mag01[y & 1]);
      this.mti = 0;
    }
    y = this.mt[this.mti++];
    y = this.unsigned32(y ^ y >>> 11);
    y = this.unsigned32(y ^ y << 7 & 2636928640);
    y = this.unsigned32(y ^ y << 15 & 4022730752);
    y = this.unsigned32(y ^ y >>> 18);
    return y;
  }
  genrandInt31() {
    return this.genrandInt32() >>> 1;
  }
  genrandReal1() {
    return this.genrandInt32() * (1 / 4294967295);
  }
  genrandReal2() {
    return this.genrandInt32() * (1 / 4294967296);
  }
  genrandReal3() {
    return (this.genrandInt32() + 0.5) * (1 / 4294967296);
  }
  genrandRes53() {
    const a = this.genrandInt32() >>> 5, b = this.genrandInt32() >>> 6;
    return (a * 67108864 + b) * (1 / 9007199254740992);
  }
}
class Mersenne {
  constructor() {
    this.gen = new MersenneTwister19937();
    this.gen.initGenrand(new Date().getTime() % 1e9);
    for (const name2 of Object.getOwnPropertyNames(Mersenne.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  rand(max = 32768, min = 0) {
    if (min > max) {
      const temp = min;
      min = max;
      max = temp;
    }
    return Math.floor(this.gen.genrandReal2() * (max - min) + min);
  }
  seed(S) {
    if (typeof S !== "number") {
      throw new FakerError(`seed(S) must take numeric argument; is ${typeof S}`);
    }
    this.gen.initGenrand(S);
  }
  seed_array(A) {
    if (typeof A !== "object") {
      throw new FakerError(`seed_array(A) must take array of numbers; is ${typeof A}`);
    }
    this.gen.initByArray(A, A.length);
  }
}
class Music {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Music.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  genre() {
    return this.faker.helpers.arrayElement(this.faker.definitions.music.genre);
  }
  songName() {
    return this.faker.helpers.arrayElement(this.faker.definitions.music.song_name);
  }
}
function selectDefinition(faker2, gender2, {
  generic,
  female,
  male
} = {}) {
  let values;
  switch (gender2) {
    case "female":
      values = female;
      break;
    case "male":
      values = male;
      break;
    default:
      values = generic;
      break;
  }
  if (values == null) {
    if (female != null && male != null) {
      values = faker2.helpers.arrayElement([female, male]);
    } else {
      values = generic;
    }
  }
  return faker2.helpers.arrayElement(values);
}
class Name {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Name.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  firstName(gender2) {
    const { first_name: first_name2, female_first_name: female_first_name2, male_first_name: male_first_name2 } = this.faker.definitions.name;
    return selectDefinition(this.faker, gender2, {
      generic: first_name2,
      female: female_first_name2,
      male: male_first_name2
    });
  }
  lastName(gender2) {
    const { last_name: last_name2, female_last_name, male_last_name } = this.faker.definitions.name;
    return selectDefinition(this.faker, gender2, {
      generic: last_name2,
      female: female_last_name,
      male: male_last_name
    });
  }
  middleName(gender2) {
    const { middle_name: middle_name2, female_middle_name: female_middle_name2, male_middle_name: male_middle_name2 } = this.faker.definitions.name;
    return selectDefinition(this.faker, gender2, {
      generic: middle_name2,
      female: female_middle_name2,
      male: male_middle_name2
    });
  }
  findName(firstName, lastName, gender2) {
    const normalizedGender = gender2 != null ? gender2 : this.faker.helpers.arrayElement(["female", "male"]);
    firstName = firstName || this.firstName(normalizedGender);
    lastName = lastName || this.lastName(normalizedGender);
    const nameParts = [];
    const prefix2 = this.faker.helpers.maybe(() => this.prefix(gender2), {
      probability: 0.125
    });
    if (prefix2) {
      nameParts.push(prefix2);
    }
    nameParts.push(firstName);
    nameParts.push(lastName);
    const suffix2 = this.faker.helpers.maybe(() => this.suffix(), {
      probability: 0.125
    });
    if (suffix2) {
      nameParts.push(suffix2);
    }
    const fullName = nameParts.join(" ");
    return fullName;
  }
  gender(binary) {
    if (binary) {
      return this.faker.helpers.arrayElement(this.faker.definitions.name.binary_gender);
    }
    return this.faker.helpers.arrayElement(this.faker.definitions.name.gender);
  }
  prefix(gender2) {
    const { prefix: prefix2, female_prefix, male_prefix } = this.faker.definitions.name;
    return selectDefinition(this.faker, gender2, {
      generic: prefix2,
      female: female_prefix,
      male: male_prefix
    });
  }
  suffix() {
    return this.faker.helpers.arrayElement(this.faker.definitions.name.suffix);
  }
  jobTitle() {
    return `${this.jobDescriptor()} ${this.jobArea()} ${this.jobType()}`;
  }
  jobDescriptor() {
    return this.faker.helpers.arrayElement(this.faker.definitions.name.title.descriptor);
  }
  jobArea() {
    return this.faker.helpers.arrayElement(this.faker.definitions.name.title.level);
  }
  jobType() {
    return this.faker.helpers.arrayElement(this.faker.definitions.name.title.job);
  }
}
class Phone {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Phone.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  phoneNumber(format) {
    deprecated({
      deprecated: "faker.phone.phoneNumber()",
      proposed: "faker.phone.number()",
      since: "7.3",
      until: "8.0"
    });
    return this.faker.phone.number(format);
  }
  number(format) {
    format = format != null ? format : this.faker.helpers.arrayElement(this.faker.definitions.phone_number.formats);
    return this.faker.helpers.replaceSymbolWithNumber(format);
  }
  phoneNumberFormat(phoneFormatsArrayIndex = 0) {
    deprecated({
      deprecated: "faker.phone.phoneNumberFormat()",
      proposed: "faker.phone.phoneNumber() or faker.helpers.replaceSymbolWithNumber(format)",
      since: "7.0",
      until: "8.0"
    });
    return this.faker.helpers.replaceSymbolWithNumber(this.faker.definitions.phone_number.formats[phoneFormatsArrayIndex]);
  }
  phoneFormats() {
    deprecated({
      deprecated: "faker.phone.phoneFormats()",
      proposed: "faker.phone.phoneNumber()",
      since: "7.0",
      until: "8.0"
    });
    return this.faker.helpers.arrayElement(this.faker.definitions.phone_number.formats);
  }
  imei() {
    return this.faker.helpers.replaceCreditCardSymbols("##-######-######-L", "#");
  }
}
const UPPER_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const LOWER_CHARS = "abcdefghijklmnopqrstuvwxyz".split("");
const DIGIT_CHARS = "0123456789".split("");
function arrayRemove(arr, values) {
  values.forEach((value) => {
    arr = arr.filter((ele) => ele !== value);
  });
  return arr;
}
class Random {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Random.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  word() {
    const wordMethods = [
      this.faker.commerce.department,
      this.faker.commerce.productName,
      this.faker.commerce.productAdjective,
      this.faker.commerce.productMaterial,
      this.faker.commerce.product,
      this.faker.color.human,
      this.faker.company.catchPhraseAdjective,
      this.faker.company.catchPhraseDescriptor,
      this.faker.company.catchPhraseNoun,
      this.faker.company.bsAdjective,
      this.faker.company.bsBuzz,
      this.faker.company.bsNoun,
      this.faker.address.streetSuffix,
      this.faker.address.county,
      this.faker.address.country,
      this.faker.address.state,
      this.faker.finance.accountName,
      this.faker.finance.transactionType,
      this.faker.finance.currencyName,
      this.faker.hacker.noun,
      this.faker.hacker.verb,
      this.faker.hacker.adjective,
      this.faker.hacker.ingverb,
      this.faker.hacker.abbreviation,
      this.faker.name.jobDescriptor,
      this.faker.name.jobArea,
      this.faker.name.jobType
    ];
    const bannedChars = [
      "!",
      "#",
      "%",
      "&",
      "*",
      ")",
      "(",
      "+",
      "=",
      ".",
      "<",
      ">",
      "{",
      "}",
      "[",
      "]",
      ":",
      ";",
      "'",
      '"',
      "_",
      "-"
    ];
    let result;
    do {
      const randomWordMethod = this.faker.helpers.arrayElement(wordMethods);
      result = randomWordMethod();
    } while (!result || bannedChars.some((char) => result.includes(char)));
    return this.faker.helpers.arrayElement(result.split(" "));
  }
  words(count) {
    const words2 = [];
    if (count == null) {
      count = this.faker.datatype.number({ min: 1, max: 3 });
    }
    for (let i = 0; i < count; i++) {
      words2.push(this.word());
    }
    return words2.join(" ");
  }
  locale() {
    return this.faker.helpers.arrayElement(Object.keys(this.faker.locales));
  }
  alpha(options = {}) {
    if (typeof options === "number") {
      options = {
        count: options
      };
    }
    const { count = 1, upcase } = options;
    let { bannedChars = [] } = options;
    if (typeof bannedChars === "string") {
      bannedChars = bannedChars.split("");
    }
    if (count <= 0) {
      return "";
    }
    const {
      casing = upcase ? "upper" : "lower"
    } = options;
    if (upcase != null) {
      deprecated({
        deprecated: "faker.random.alpha({ upcase: true })",
        proposed: "faker.random.alpha({ casing: 'upper' })",
        since: "7.0",
        until: "8.0"
      });
    }
    let charsArray;
    switch (casing) {
      case "upper":
        charsArray = [...UPPER_CHARS];
        break;
      case "lower":
        charsArray = [...LOWER_CHARS];
        break;
      case "mixed":
      default:
        charsArray = [...LOWER_CHARS, ...UPPER_CHARS];
        break;
    }
    charsArray = arrayRemove(charsArray, bannedChars);
    if (charsArray.length === 0) {
      throw new FakerError("Unable to generate string, because all possible characters are banned.");
    }
    return Array.from({ length: count }, () => this.faker.helpers.arrayElement(charsArray)).join("");
  }
  alphaNumeric(count = 1, options = {}) {
    if (count <= 0) {
      return "";
    }
    const {
      casing = "lower"
    } = options;
    let { bannedChars = [] } = options;
    if (typeof bannedChars === "string") {
      bannedChars = bannedChars.split("");
    }
    let charsArray = [...DIGIT_CHARS];
    switch (casing) {
      case "upper":
        charsArray.push(...UPPER_CHARS);
        break;
      case "lower":
        charsArray.push(...LOWER_CHARS);
        break;
      case "mixed":
      default:
        charsArray.push(...LOWER_CHARS, ...UPPER_CHARS);
        break;
    }
    charsArray = arrayRemove(charsArray, bannedChars);
    if (charsArray.length === 0) {
      throw new FakerError("Unable to generate string, because all possible characters are banned.");
    }
    return Array.from({ length: count }, () => this.faker.helpers.arrayElement(charsArray)).join("");
  }
  numeric(length = 1, options = {}) {
    if (length <= 0) {
      return "";
    }
    const { allowLeadingZeros = false } = options;
    let { bannedDigits = [] } = options;
    if (typeof bannedDigits === "string") {
      bannedDigits = bannedDigits.split("");
    }
    const allowedDigits = DIGIT_CHARS.filter((digit) => !bannedDigits.includes(digit));
    if (allowedDigits.length === 0 || allowedDigits.length === 1 && !allowLeadingZeros && allowedDigits[0] === "0") {
      throw new FakerError("Unable to generate numeric string, because all possible digits are banned.");
    }
    let result = "";
    if (!allowLeadingZeros && !bannedDigits.includes("0")) {
      result += this.faker.helpers.arrayElement(allowedDigits.filter((digit) => digit !== "0"));
    }
    while (result.length < length) {
      result += this.faker.helpers.arrayElement(allowedDigits);
    }
    return result;
  }
}
class Science {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Science.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  chemicalElement() {
    return this.faker.helpers.arrayElement(this.faker.definitions.science.chemicalElement);
  }
  unit() {
    return this.faker.helpers.arrayElement(this.faker.definitions.science.unit);
  }
}
const commonFileTypes = ["video", "audio", "image", "text", "application"];
const commonMimeTypes = [
  "application/pdf",
  "audio/mpeg",
  "audio/wav",
  "image/png",
  "image/jpeg",
  "image/gif",
  "video/mp4",
  "video/mpeg",
  "text/html"
];
class System {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(System.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  fileName() {
    const str = this.faker.random.words().toLowerCase().replace(/\W/g, "_");
    return `${str}.${this.fileExt()}`;
  }
  commonFileName(ext) {
    const str = this.faker.random.words().toLowerCase().replace(/\W/g, "_");
    return `${str}.${ext || this.commonFileExt()}`;
  }
  mimeType() {
    const mimeTypeKeys = Object.keys(this.faker.definitions.system.mimeTypes);
    return this.faker.helpers.arrayElement(mimeTypeKeys);
  }
  commonFileType() {
    return this.faker.helpers.arrayElement(commonFileTypes);
  }
  commonFileExt() {
    return this.fileExt(this.faker.helpers.arrayElement(commonMimeTypes));
  }
  fileType() {
    const typeSet = /* @__PURE__ */ new Set();
    const mimeTypes2 = this.faker.definitions.system.mimeTypes;
    Object.keys(mimeTypes2).forEach((m) => {
      const type = m.split("/")[0];
      typeSet.add(type);
    });
    const types = Array.from(typeSet);
    return this.faker.helpers.arrayElement(types);
  }
  fileExt(mimeType) {
    if (typeof mimeType === "string") {
      const mimes = this.faker.definitions.system.mimeTypes;
      return this.faker.helpers.arrayElement(mimes[mimeType].extensions);
    }
    const mimeTypes2 = this.faker.definitions.system.mimeTypes;
    const extensionSet = /* @__PURE__ */ new Set();
    Object.keys(mimeTypes2).forEach((m) => {
      if (mimeTypes2[m].extensions instanceof Array) {
        mimeTypes2[m].extensions.forEach((ext) => {
          extensionSet.add(ext);
        });
      }
    });
    const extensions = Array.from(extensionSet);
    return this.faker.helpers.arrayElement(extensions);
  }
  directoryPath() {
    const paths = this.faker.definitions.system.directoryPaths;
    return this.faker.helpers.arrayElement(paths);
  }
  filePath() {
    return `${this.directoryPath()}/${this.fileName()}`;
  }
  semver() {
    return [
      this.faker.datatype.number(9),
      this.faker.datatype.number(9),
      this.faker.datatype.number(9)
    ].join(".");
  }
}
const GLOBAL_UNIQUE_STORE = {};
const GLOBAL_UNIQUE_EXCLUDE = [];
function defaultCompare(obj, key) {
  if (obj[key] === void 0) {
    return -1;
  }
  return 0;
}
function errorMessage(startTime, now, code, store, currentIterations) {
  console.error("Error", code);
  console.log(`Found ${Object.keys(store).length} unique entries before throwing error.
retried: ${currentIterations}
total time: ${now - startTime}ms`);
  throw new FakerError(`${code} for uniqueness check.

May not be able to generate any more unique values with current settings.
Try adjusting maxTime or maxRetries parameters for faker.unique().`);
}
function exec(method, args, options = {}) {
  var _a;
  const now = new Date().getTime();
  const {
    startTime = new Date().getTime(),
    maxTime = 50,
    maxRetries = 50,
    compare = defaultCompare,
    store = GLOBAL_UNIQUE_STORE
  } = options;
  let { exclude = GLOBAL_UNIQUE_EXCLUDE } = options;
  options.currentIterations = (_a = options.currentIterations) != null ? _a : 0;
  if (!Array.isArray(exclude)) {
    exclude = [exclude];
  }
  if (now - startTime >= maxTime) {
    return errorMessage(startTime, now, `Exceeded maxTime: ${maxTime}`, store, options.currentIterations);
  }
  if (options.currentIterations >= maxRetries) {
    return errorMessage(startTime, now, `Exceeded maxRetries: ${maxRetries}`, store, options.currentIterations);
  }
  const result = method.apply(this, args);
  if (compare(store, result) === -1 && exclude.indexOf(result) === -1) {
    store[result] = result;
    options.currentIterations = 0;
    return result;
  } else {
    options.currentIterations++;
    return exec(method, args, {
      ...options,
      startTime,
      maxTime,
      maxRetries,
      compare,
      exclude
    });
  }
}
class Unique {
  constructor() {
    for (const name2 of Object.getOwnPropertyNames(Unique.prototype)) {
      if (name2 === "constructor" || name2 === "maxTime" || name2 === "maxRetries" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  unique(method, args, options = {}) {
    const { maxTime = 50, maxRetries = 50 } = options;
    return exec(method, args, {
      ...options,
      startTime: new Date().getTime(),
      maxTime,
      maxRetries,
      currentIterations: 0
    });
  }
}
class Vehicle {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Vehicle.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  vehicle() {
    return `${this.manufacturer()} ${this.model()}`;
  }
  manufacturer() {
    return this.faker.helpers.arrayElement(this.faker.definitions.vehicle.manufacturer);
  }
  model() {
    return this.faker.helpers.arrayElement(this.faker.definitions.vehicle.model);
  }
  type() {
    return this.faker.helpers.arrayElement(this.faker.definitions.vehicle.type);
  }
  fuel() {
    return this.faker.helpers.arrayElement(this.faker.definitions.vehicle.fuel);
  }
  vin() {
    const bannedChars = ["o", "i", "q", "O", "I", "Q"];
    return `${this.faker.random.alphaNumeric(10, {
      casing: "upper",
      bannedChars
    })}${this.faker.random.alpha({
      count: 1,
      casing: "upper",
      bannedChars
    })}${this.faker.random.alphaNumeric(1, {
      casing: "upper",
      bannedChars
    })}${this.faker.datatype.number({ min: 1e4, max: 99999 })}`.toUpperCase();
  }
  color() {
    return this.faker.color.human();
  }
  vrm() {
    return `${this.faker.random.alpha({
      count: 2,
      casing: "upper"
    })}${this.faker.datatype.number({
      min: 0,
      max: 9
    })}${this.faker.datatype.number({
      min: 0,
      max: 9
    })}${this.faker.random.alpha({ count: 3, casing: "upper" })}`.toUpperCase();
  }
  bicycle() {
    return this.faker.helpers.arrayElement(this.faker.definitions.vehicle.bicycle_type);
  }
}
function filterWordListByLength(options) {
  if (!options.length) {
    return options.wordList;
  }
  const wordListWithLengthFilter = options.wordList.filter((word2) => word2.length === options.length);
  return wordListWithLengthFilter.length > 0 ? wordListWithLengthFilter : [...options.wordList];
}
class Word {
  constructor(faker2) {
    this.faker = faker2;
    for (const name2 of Object.getOwnPropertyNames(Word.prototype)) {
      if (name2 === "constructor" || typeof this[name2] !== "function") {
        continue;
      }
      this[name2] = this[name2].bind(this);
    }
  }
  adjective(length) {
    return this.faker.helpers.arrayElement(filterWordListByLength({
      wordList: this.faker.definitions.word.adjective,
      length
    }));
  }
  adverb(length) {
    return this.faker.helpers.arrayElement(filterWordListByLength({
      wordList: this.faker.definitions.word.adverb,
      length
    }));
  }
  conjunction(length) {
    return this.faker.helpers.arrayElement(filterWordListByLength({
      wordList: this.faker.definitions.word.conjunction,
      length
    }));
  }
  interjection(length) {
    return this.faker.helpers.arrayElement(filterWordListByLength({
      wordList: this.faker.definitions.word.interjection,
      length
    }));
  }
  noun(length) {
    return this.faker.helpers.arrayElement(filterWordListByLength({
      wordList: this.faker.definitions.word.noun,
      length
    }));
  }
  preposition(length) {
    return this.faker.helpers.arrayElement(filterWordListByLength({
      wordList: this.faker.definitions.word.preposition,
      length
    }));
  }
  verb(length) {
    return this.faker.helpers.arrayElement(filterWordListByLength({
      wordList: this.faker.definitions.word.verb,
      length
    }));
  }
}
const metadataKeys = [
  "title",
  "separator"
];
class Faker {
  constructor(opts) {
    var _a;
    this.definitions = this.initDefinitions();
    this.fake = new Fake(this).fake;
    this.unique = new Unique().unique;
    this.mersenne = new Mersenne();
    this.random = new Random(this);
    this.helpers = new Helpers(this);
    this.datatype = new Datatype(this);
    this.address = new Address(this);
    this.animal = new Animal(this);
    this.color = new Color(this);
    this.commerce = new Commerce(this);
    this.company = new Company(this);
    this.database = new Database(this);
    this.date = new _Date(this);
    this.finance = new Finance(this);
    this.git = new Git(this);
    this.hacker = new Hacker(this);
    this.image = new Image(this);
    this.internet = new Internet(this);
    this.lorem = new Lorem(this);
    this.music = new Music(this);
    this.name = new Name(this);
    this.phone = new Phone(this);
    this.science = new Science(this);
    this.system = new System(this);
    this.vehicle = new Vehicle(this);
    this.word = new Word(this);
    if (!opts) {
      throw new FakerError("Options with at least one entry in locales must be provided");
    }
    if (Object.keys((_a = opts.locales) != null ? _a : {}).length === 0) {
      throw new FakerError("At least one entry in locales must be provided in the locales parameter");
    }
    this.locales = opts.locales;
    this.locale = opts.locale || "en";
    this.localeFallback = opts.localeFallback || "en";
  }
  get locale() {
    return this._locale;
  }
  set locale(locale) {
    if (!this.locales[locale]) {
      throw new FakerError(`Locale ${locale} is not supported. You might want to add the requested locale first to \`faker.locales\`.`);
    }
    this._locale = locale;
  }
  get localeFallback() {
    return this._localeFallback;
  }
  set localeFallback(localeFallback) {
    if (!this.locales[localeFallback]) {
      throw new FakerError(`Locale ${localeFallback} is not supported. You might want to add the requested locale first to \`faker.locales\`.`);
    }
    this._localeFallback = localeFallback;
  }
  initDefinitions() {
    const resolveBaseData = (key) => {
      var _a;
      return (_a = this.locales[this.locale][key]) != null ? _a : this.locales[this.localeFallback][key];
    };
    const resolveModuleData = (module, entry2) => {
      var _a, _b, _c;
      return (_c = (_a = this.locales[this.locale][module]) == null ? void 0 : _a[entry2]) != null ? _c : (_b = this.locales[this.localeFallback][module]) == null ? void 0 : _b[entry2];
    };
    const moduleLoader = (module) => {
      if (resolveBaseData(module)) {
        return new Proxy({}, {
          get(target, entry2) {
            return resolveModuleData(module, entry2);
          }
        });
      } else {
        return void 0;
      }
    };
    return new Proxy({}, {
      get(target, module) {
        let result = target[module];
        if (result) {
          return result;
        } else if (metadataKeys.includes(module)) {
          return resolveBaseData(module);
        } else {
          result = moduleLoader(module);
          target[module] = result;
          return result;
        }
      }
    });
  }
  seed(seed = Math.ceil(Math.random() * Number.MAX_SAFE_INTEGER)) {
    if (Array.isArray(seed) && seed.length) {
      this.mersenne.seed_array(seed);
    } else if (!Array.isArray(seed) && !isNaN(seed)) {
      this.mersenne.seed(seed);
    }
    return seed;
  }
  setLocale(locale) {
    this.locale = locale;
  }
}
const city$2 = [
  "{{address.city_prefix}}{{name.first_name}}{{address.city_suffix}}",
  "{{name.first_name}}{{address.city_suffix}}",
  "{{address.city_prefix}}{{name.last_name}}{{address.city_suffix}}",
  "{{name.last_name}}{{address.city_suffix}}"
];
const city_prefix$2 = ["\u5317", "\u6771", "\u897F", "\u5357", "\u65B0", "\u6E56", "\u6E2F"];
const city_suffix$2 = ["\u5E02", "\u533A", "\u753A", "\u6751"];
const country$1 = [
  "\u30A2\u30D5\u30EA\u30AB",
  "\u5357\u6975\u5927\u9678",
  "\u30A2\u30B8\u30A2",
  "\u30E8\u30FC\u30ED\u30C3\u30D1",
  "\u5317\u30A2\u30E1\u30EA\u30AB",
  "\u5357\u30A2\u30E1\u30EA\u30AB",
  "\u5357\u6975",
  "\u5317\u6975",
  "\u30A2\u30D5\u30AC\u30CB\u30B9\u30BF\u30F3",
  "\u30A2\u30EB\u30D0\u30CB\u30A2",
  "\u30A2\u30EB\u30B8\u30A7\u30EA\u30A2",
  "\u30A2\u30E1\u30EA\u30AB",
  "\u7C73\u56FD",
  "\u30A2\u30F3\u30B4\u30E9",
  "\u30A2\u30EB\u30BC\u30F3\u30C1\u30F3",
  "\u30AA\u30FC\u30B9\u30C8\u30E9\u30EA\u30A2",
  "\u6FE0\u6D32",
  "\u30AA\u30FC\u30B9\u30C8\u30EA\u30A2",
  "\u30D0\u30CF\u30DE",
  "\u30D0\u30FC\u30EC\u30FC\u30F3",
  "\u30D0\u30F3\u30B0\u30E9\u30C7\u30B7\u30E5",
  "\u30D0\u30EB\u30D0\u30C9\u30B9",
  "\u30D9\u30EB\u30AE\u30FC",
  "\u30D9\u30EA\u30FC\u30BA",
  "\u30D6\u30FC\u30BF\u30F3",
  "\u30DC\u30EA\u30D3\u30A2",
  "\u30DC\u30B9\u30CB\u30E4\u30FB",
  "\u30D8\u30EB\u30C4\u30A7\u30B4\u30D3\u30CA",
  "\u30DC\u30C4\u30EF\u30CA",
  "\u30D6\u30E9\u30B8\u30EB",
  "\u30D6\u30EB\u30CD\u30A4",
  "\u30D6\u30EB\u30AC\u30EA\u30A2",
  "\u30AB\u30F3\u30DC\u30B8\u30A2",
  "\u30AB\u30E1\u30EB\u30FC\u30F3",
  "\u30AB\u30CA\u30C0",
  "\u4E2D\u592E\u30A2\u30D5\u30EA\u30AB",
  "\u30C1\u30E3\u30C9",
  "\u30C1\u30EA",
  "\u4E2D\u56FD",
  "\u30B3\u30ED\u30F3\u30D3\u30A2",
  "\u30B3\u30F3\u30B4",
  "\u30B3\u30B9\u30BF\u30EA\u30AB",
  "\u30AF\u30ED\u30A2\u30C1\u30A2",
  "\u30AD\u30E5\u30FC\u30D0",
  "\u30AD\u30D7\u30ED\u30B9",
  "\u30C1\u30A7\u30B3",
  "\u30C7\u30F3\u30DE\u30FC\u30AF",
  "\u30C9\u30DF\u30CB\u30AB\u5171\u548C\u56FD",
  "\u30A8\u30AF\u30A2\u30C9\u30EB",
  "\u30A8\u30B8\u30D7\u30C8",
  "\u30A8\u30EB\u30B5\u30EB\u30D0\u30C9\u30EB",
  "\u8D64\u9053\u30AE\u30CB\u30A2",
  "\u30A8\u30B9\u30C8\u30CB\u30A2",
  "\u30A8\u30C1\u30AA\u30D4\u30A2",
  "\u30D5\u30A3\u30B8\u30FC",
  "\u30D5\u30A3\u30F3\u30E9\u30F3\u30C9",
  "\u30D5\u30E9\u30F3\u30B9",
  "\u30AC\u30F3\u30D3\u30A2",
  "\u30C9\u30A4\u30C4",
  "\u30AC\u30FC\u30CA",
  "\u82F1\u56FD",
  "\u30A4\u30AE\u30EA\u30B9",
  "\u30AE\u30EA\u30B7\u30E3",
  "\u30B0\u30EA\u30FC\u30F3\u30E9\u30F3\u30C9",
  "\u30B0\u30EC\u30CA\u30C0",
  "\u30B0\u30A2\u30C6\u30DE\u30E9",
  "\u30AE\u30CB\u30A2",
  "\u30AC\u30A4\u30E4\u30CA",
  "\u30CF\u30A4\u30C1",
  "\u30AA\u30E9\u30F3\u30C0",
  "\u30DB\u30F3\u30B8\u30A7\u30E9\u30B9",
  "\u9999\u6E2F",
  "\u30CF\u30F3\u30AC\u30EA\u30FC",
  "\u30A2\u30A4\u30B9\u30E9\u30F3\u30C9",
  "\u30A4\u30F3\u30C9",
  "\u30A4\u30F3\u30C9\u30CD\u30B7\u30A2",
  "\u30A4\u30E9\u30F3",
  "\u30A4\u30E9\u30AF",
  "\u30A2\u30A4\u30EB\u30E9\u30F3\u30C9",
  "\u30A4\u30B9\u30E9\u30A8\u30EB",
  "\u30A4\u30BF\u30EA\u30A2",
  "\u30B8\u30E3\u30DE\u30A4\u30AB",
  "\u65E5\u672C",
  "\u30E8\u30EB\u30C0\u30F3",
  "\u30B1\u30CB\u30A2",
  "\u30B3\u30BD\u30DC",
  "\u30AF\u30A6\u30A7\u30FC\u30C8",
  "\u30E9\u30AA\u30B9",
  "\u30E9\u30C8\u30D3\u30A2",
  "\u30EC\u30D0\u30CE\u30F3",
  "\u30EA\u30D9\u30EA\u30A2",
  "\u30EA\u30D3\u30A2",
  "\u30EA\u30C8\u30A2\u30CB\u30A2",
  "\u30EB\u30AF\u30BB\u30F3\u30D6\u30EB\u30AF",
  "\u30DE\u30AB\u30AA",
  "\u30DE\u30C0\u30AC\u30B9\u30AB\u30EB",
  "\u30DE\u30E9\u30A6\u30A3",
  "\u30DE\u30EC\u30FC\u30B7\u30A2",
  "\u30DE\u30EB\u30BF",
  "\u30E2\u30EB\u30B8\u30D6",
  "\u30E2\u30FC\u30EA\u30B7\u30E3\u30B9",
  "\u30E1\u30AD\u30B7\u30B3",
  "\u30E2\u30EB\u30C9\u30D0",
  "\u30E2\u30CA\u30B3",
  "\u8499\u53E4",
  "\u30E2\u30F3\u30B4\u30EB",
  "\u30E2\u30ED\u30C3\u30B3",
  "\u30E2\u30B6\u30F3\u30D3\u30FC\u30AF",
  "\u30DF\u30E3\u30F3\u30DE\u30FC",
  "\u30CA\u30DF\u30D3\u30A2",
  "\u30CD\u30D1\u30FC\u30EB",
  "\u30CB\u30E5\u30FC\u30AE\u30CB\u30A2",
  "\u30CB\u30E5\u30FC\u30B8\u30FC\u30E9\u30F3\u30C9",
  "\u30CB\u30AB\u30E9\u30B0\u30A2",
  "\u30CA\u30A4\u30B8\u30A7\u30EA\u30A2",
  "\u5317\u671D\u9BAE",
  "\u30CE\u30EB\u30A6\u30A7\u30FC",
  "\u30AA\u30FC\u30DE\u30F3",
  "\u30D1\u30AD\u30B9\u30BF\u30F3",
  "\u30D1\u30EC\u30B9\u30C1\u30CA",
  "\u30D1\u30CA\u30DE",
  "\u30D1\u30D7\u30A2\u30CB\u30E5\u30FC\u30AE\u30CB\u30A2",
  "\u30D1\u30E9\u30B0\u30A2\u30A4",
  "\u30DA\u30EB\u30FC",
  "\u30D5\u30A3\u30EA\u30D4\u30F3",
  "\u30DD\u30FC\u30E9\u30F3\u30C9",
  "\u30DD\u30EB\u30C8\u30AC\u30EB",
  "\u30AB\u30BF\u30FC\u30EB",
  "\u30EB\u30FC\u30DE\u30CB\u30A2",
  "\u30ED\u30B7\u30A2",
  "\u30EB\u30EF\u30F3\u30C0",
  "\u30B5\u30A6\u30B8\u30A2\u30E9\u30D3\u30A2",
  "\u30B9\u30B3\u30C3\u30C8\u30E9\u30F3\u30C9",
  "\u30BB\u30CD\u30AC\u30EB",
  "\u30BB\u30A4\u30B7\u30A7\u30EB",
  "\u30B7\u30F3\u30AC\u30DD\u30FC\u30EB",
  "\u30B9\u30ED\u30D0\u30AD\u30A2",
  "\u30B9\u30ED\u30D9\u30CB\u30A2",
  "\u30BD\u30ED\u30E2\u30F3\u8AF8\u5CF6",
  "\u30BD\u30DE\u30EA\u30A2",
  "\u5357\u30A2\u30D5\u30EA\u30AB",
  "\u97D3\u56FD",
  "\u30B9\u30DA\u30A4\u30F3",
  "\u30B9\u30EA\u30E9\u30F3\u30AB",
  "\u30B9\u30FC\u30C0\u30F3",
  "\u30B9\u30A6\u30A7\u30FC\u30C7\u30F3",
  "\u30B9\u30A4\u30B9",
  "\u30B7\u30EA\u30A2",
  "\u30BF\u30D2\u30C1",
  "\u53F0\u6E7E",
  "\u30BF\u30F3\u30B6\u30CB\u30A2",
  "\u30BF\u30A4",
  "\u30C8\u30EA\u30CB\u30C0\u30FC\u30C9\u30FB\u30C8\u30D0\u30B4",
  "\u30C1\u30E5\u30CB\u30B8\u30A2",
  "\u30C8\u30EB\u30B3",
  "\u30A6\u30AC\u30F3\u30C0",
  "\u30A6\u30AF\u30E9\u30A4\u30CA",
  "\u30A2\u30E9\u30D6\u9996\u9577\u56FD\u9023\u90A6",
  "\u30A6\u30EB\u30B0\u30A2\u30A4",
  "\u30D0\u30C1\u30AB\u30F3",
  "\u30D9\u30CD\u30BA\u30A8\u30E9",
  "\u30D9\u30C8\u30CA\u30E0",
  "\u30A6\u30A7\u30FC\u30EB\u30BA",
  "\u30A4\u30A8\u30E1\u30F3",
  "\u30B6\u30A4\u30FC\u30EB",
  "\u30B6\u30F3\u30D3\u30A2",
  "\u30B8\u30F3\u30D0\u30D6\u30A8"
];
const postcode$2 = ["###-####"];
const state$2 = [
  "\u5317\u6D77\u9053",
  "\u9752\u68EE\u770C",
  "\u5CA9\u624B\u770C",
  "\u5BAE\u57CE\u770C",
  "\u79CB\u7530\u770C",
  "\u5C71\u5F62\u770C",
  "\u798F\u5CF6\u770C",
  "\u8328\u57CE\u770C",
  "\u6803\u6728\u770C",
  "\u7FA4\u99AC\u770C",
  "\u57FC\u7389\u770C",
  "\u5343\u8449\u770C",
  "\u6771\u4EAC\u90FD",
  "\u795E\u5948\u5DDD\u770C",
  "\u65B0\u6F5F\u770C",
  "\u5BCC\u5C71\u770C",
  "\u77F3\u5DDD\u770C",
  "\u798F\u4E95\u770C",
  "\u5C71\u68A8\u770C",
  "\u9577\u91CE\u770C",
  "\u5C90\u961C\u770C",
  "\u9759\u5CA1\u770C",
  "\u611B\u77E5\u770C",
  "\u4E09\u91CD\u770C",
  "\u6ECB\u8CC0\u770C",
  "\u4EAC\u90FD\u5E9C",
  "\u5927\u962A\u5E9C",
  "\u5175\u5EAB\u770C",
  "\u5948\u826F\u770C",
  "\u548C\u6B4C\u5C71\u770C",
  "\u9CE5\u53D6\u770C",
  "\u5CF6\u6839\u770C",
  "\u5CA1\u5C71\u770C",
  "\u5E83\u5CF6\u770C",
  "\u5C71\u53E3\u770C",
  "\u5FB3\u5CF6\u770C",
  "\u9999\u5DDD\u770C",
  "\u611B\u5A9B\u770C",
  "\u9AD8\u77E5\u770C",
  "\u798F\u5CA1\u770C",
  "\u4F50\u8CC0\u770C",
  "\u9577\u5D0E\u770C",
  "\u718A\u672C\u770C",
  "\u5927\u5206\u770C",
  "\u5BAE\u5D0E\u770C",
  "\u9E7F\u5150\u5CF6\u770C",
  "\u6C96\u7E04\u770C"
];
const state_abbr$2 = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
  "31",
  "32",
  "33",
  "34",
  "35",
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47"
];
const street$2 = [
  "{{name.first_name}}{{address.street_suffix}}",
  "{{name.last_name}}{{address.street_suffix}}"
];
const address$2 = {
  city: city$2,
  city_prefix: city_prefix$2,
  city_suffix: city_suffix$2,
  country: country$1,
  postcode: postcode$2,
  state: state$2,
  state_abbr: state_abbr$2,
  street: street$2
};
const formats$4 = ["090-####-####", "080-####-####", "070-####-####"];
const cell_phone$1 = {
  formats: formats$4
};
const supplemental$1 = [
  "\u304A\u3069\u308A\u3070",
  "\u6599\u7406\u4EBA",
  "\u3044\u3061",
  "\u3084\u3076\u308C\u308B",
  "\u8F9E\u5100\u3059\u308B",
  "\u902E\u6355",
  "\u8272\u5F69",
  "\u59BB",
  "\u304D\u3065\u304F",
  "\u306F\u304D\u3060\u3059",
  "\u6B6F",
  "\u61B6\u6E2C",
  "\u3059\u3080",
  "\u58A8",
  "\u80C3\u8178",
  "\u99C6\u3051\u51FA\u3059",
  "\u681E",
  "\u3075\u3086\u304B\u3044",
  "\u8C6A\u83EF",
  "\u5199\u3059",
  "\u3080\u3061\u3064\u3058\u3087",
  "\u3054\u3089\u304F",
  "\u53EF\u611B\u3044",
  "\u3075\u3058\u3087",
  "\u3067\u3093\u305B\u3093\u3073\u3087\u3046",
  "\u3044\u3061\u306B\u3061",
  "\u3064\u3044\u305F\u3061",
  "\u5F7C\u5973",
  "\u3072\u3081\u3055\u307E",
  "\u89E3\u8AAC",
  "\u3059\u3044\u304C\u3089",
  "\u7D04",
  "\u4E26",
  "\u3053\u3063\u305B\u3064",
  "\u3042\u3089\u3058\u304A",
  "\u3042\u3089\u3057\u304A",
  "\u66F8\u67B6",
  "\u52DD\u624B",
  "\u304E\u305B\u3044",
  "\u3053\u304F\u3072\u3093",
  "\u5ACC",
  "\u535A\u7269\u9928",
  "\u3057\u3093\u3057",
  "\u5E33\u7C3F",
  "\u521D\u3081\u306B",
  "\u7A7A\u304D\u74F6",
  "\u3075\u3066\u3044",
  "\u898B\u8FD4\u3059",
  "\u307B\u3093\u308B\u3044\u3060",
  "\u3055\u308F",
  "\u60AA\u6C17",
  "\u307B\u3093\u305D\u3046",
  "\u8B19\u865A",
  "\u8010\u706B",
  "\u307C\u3046\u308A\u3087\u304F",
  "\u6F54\u3044",
  "\u3051\u3059",
  "\u7DE0\u307E\u308B",
  "\u3061\u3087\u3046\u308A\u3087\u304F",
  "\u306E\u3046\u3057",
  "\u66B4\u8D70",
  "\u83EF\u9053",
  "\u57FA\u76E4",
  "\u5EC3\u68C4",
  "\u304B\u3056\u308B",
  "\u304F\u3089",
  "\u6C0F\u540D",
  "\u304C\u305E\u3046",
  "\u3075\u304D\u3064",
  "\u3053\u3046\u3070\u3093",
  "\u304B\u3093\u3055\u3044",
  "\u3072\u3068\u3054\u307F",
  "\u69CB\u3048\u308B",
  "\u305F\u3059",
  "\u3068\u3080",
  "\u3059\u307F",
  "\u3081\u3044\u3088",
  "\u5E1D",
  "\u304B\u3093\u3048\u3093",
  "\u305F\u3073",
  "\u6A21\u578B",
  "\u51AC\u4F11\u307F",
  "\u8A87\u5F35",
  "\u4F55\u5343",
  "\u305D\u3046\u3060\u3093",
  "\u3057\u3063\u3077\u3046",
  "\u306F\u3084\u3066",
  "\u307B\u3069\u3046",
  "\u6575",
  "\u3072\u3075",
  "\u706B",
  "\u58C1",
  "\u5F31\u70B9",
  "\u304B\u3044\u305D\u304F",
  "\u6CA1\u982D",
  "\u8CB4\u8CD3",
  "\u3055\u3044\u3052\u3064",
  "\u76DB\u308A\u4E0A\u304C\u308B",
  "\u67F1",
  "\u3072\u306F\u3093",
  "\u8F2A\u90ED",
  "\u3053\u3065\u3064\u307F",
  "\u6247",
  "\u6027\u75C5",
  "\u6FC3\u7D3A",
  "\u6D17\u6D44\u5264",
  "\u821E\u8E0F",
  "\u3064\u304E",
  "\u3057\u3081\u308B",
  "\u5EF6\u9577",
  "\u3057\u3064",
  "\u3056\u305B\u304D",
  "\u3082\u304F\u3072\u3087\u3046",
  "\u5B9D\u304F\u3058",
  "\u52A3\u60AA",
  "\u306F\u306A\u307F",
  "\u540C\u97F3\u7570\u7FA9\u8A9E",
  "\u305F\u3044\u307B\u3046",
  "\u6176\u5F14",
  "\u758E\u5916",
  "\u308C\u3044\u3066\u3093",
  "\u6B7B\u306C",
  "\u3055\u3068",
  "\u7169\u3044",
  "\u643A\u5E2F",
  "\u304B\u3044\u305B\u3044",
  "\u54FA\u80B2",
  "\u656C\u8A9E",
  "\u3068\u3046\u3068\u3044",
  "\u3068\u3046\u3072\u3087\u3046\u3059\u308B",
  "\u9811\u5F35\u308C",
  "\u308C\u3044\u305B\u3044",
  "\u86C7",
  "\u3044\u3057\u3083\u308A\u3087\u3046",
  "\u30A2\u30E1\u30EA\u30AB\u88FD",
  "\u5149\u5E74",
  "\u793E\u54E1",
  "\u3082\u3088\u3046",
  "\u304E\u3083\u304F\u3057\u3085\u3046",
  "\u7532\u4E59",
  "\u3075\u304F\u3057",
  "\u3078\u3044\u305B\u3044",
  "\u3066\u3093\u306E\u3046",
  "\u5E74\u6B21",
  "\u4E8C\u5DFB",
  "\u304C\u304F\u3075",
  "\u3057\u3069\u3046",
  "\u3088\u3059\u307F",
  "\u304A\u304A\u3054\u3048",
  "\u304B\u3064\u3050",
  "\u5730\u4E0B\u8857",
  "\u306F\u304F\u3058\u3093",
  "\u9593\u63A5",
  "\u305B\u3063\u3068\u304F",
  "\u3064\u3046\u3053\u3093",
  "\u3073\u3093\u307C\u3046",
  "\u5DDD\u5E95",
  "\u3053\u3046\u3048\u3093",
  "\u3046\u3054\u304D",
  "\u516D",
  "\u4E7E\u71E5",
  "\u6D17\u6FEF\u5C4B",
  "\u306A\u305E",
  "\u3075\u3058\u3093",
  "\u5BFE\u5FDC",
  "\u9806\u5E8F",
  "\u9996",
  "\u3080\u308C\u308B",
  "\u3057\u3081\u308B",
  "\u79FB\u3059",
  "\u5206\u3051\u308B",
  "\u3057\u3087\u3046\u3052\u304D",
  "\u304E\u3087\u3046\u3057",
  "\u3042\u307E\u3044",
  "\u3058\u3087\u3046\u304D\u3085\u3046",
  "\u305F\u3093\u308C\u3093",
  "\u304B\u3051\u3053\u3080",
  "\u7D20\u6750",
  "\u53D7\u4ED8",
  "\u3044\u307E\u307E\u3067",
  "\u308A\u3087\u3053\u3046",
  "\u6E80\u6F6E",
  "\u3082\u3061\u3044\u308B",
  "\u3042\u308F\u308C",
  "\u8CC0\u72B6",
  "\u8A70\u3081\u8FBC\u3080",
  "\u6570\u3048\u308B",
  "\u305A\u3044\u3058",
  "\u3044\u3063\u3071\u304F",
  "\u8074\u8005",
  "\u305D\u3046\u3050\u3046",
  "\u3068\u3046\u3055\u304F",
  "\u601D\u3044\u9063\u308A",
  "\u92ED\u3044",
  "\u8C9E\u64CD",
  "\u539F\u56E0",
  "\u8C61\u7259",
  "\u6B4C\u8B21",
  "\u4F1A\u8B70",
  "\u5F85\u9047",
  "\u306A\u304B\u3088\u3057",
  "\u304A\u306A\u304B",
  "\u308A\u308A\u3057\u3044",
  "\u304A\u304A\u3061\u304C\u3044",
  "\u8CDB\u6210",
  "\u5954\u653E",
  "\u975E\u96E3",
  "\u3088\u3046\u3058",
  "\u932F\u4E71",
  "\u3058\u3053",
  "\u524D",
  "\u7D2F\u9032",
  "\u7DCA\u5F35\u3059\u308B",
  "\u304E\u3058\u3085\u304F",
  "\u3046\u3061",
  "\u60AA\u970A",
  "\u67A2\u8EF8",
  "\u5B50\u5B88\u6B4C",
  "\u308A\u3085\u3046\u304D",
  "\u96C4\u72AC",
  "\u307F\u305A\u3044\u308D",
  "\u5927\u9593\u9055\u3044",
  "\u8D70\u308A\u56DE\u308B",
  "\u305D\u3093\u3051\u3044",
  "\u3057\u3063\u307A\u3044",
  "\u3066\u3093\u3057",
  "\u75C5\u9662",
  "\u6B8B\u696D",
  "\u3072\u3093\u3057\u3064",
  "\u3051\u3093\u3057\u3085\u3046\u305B\u3044",
  "\u6905\u5B50",
  "\u3044\u3055\u304E\u3088\u3044",
  "\u6795",
  "\u5893",
  "\u6D17\u5264",
  "\u305F\u3044\u304C\u3044",
  "\u3058\u3057\u3087",
  "\u526F\u5927\u7D71\u9818",
  "\u77AC\u304F",
  "\u3075\u3058\u5C71",
  "\u3075\u304F\u305B\u3093",
  "\u6F2C\u7269",
  "\u306F\u3093\u3051\u3093",
  "\u611B\u3059\u308B",
  "\u306D\u3093\u304C\u3093",
  "\u306D\u3093\u3058",
  "\u3044\u304D\u3069\u304A\u308A",
  "\u304A\u3068\u3053\u306E\u3053",
  "\u4EC1",
  "\u9DB4",
  "\u65BD\u8A2D",
  "\u8ACB\u3051\u308B",
  "\u62D2\u5426",
  "\u3046\u307F",
  "\u79FB\u8B72",
  "\u6EB6\u5CA9",
  "\u6027\u683C",
  "\u3058\u3057\u3093",
  "\u88CF\u53E3",
  "\u3075\u305F\u305F\u3073",
  "\u733F\u771F\u4F3C",
  "\u3057\u3081\u3089\u305B\u308B",
  "\u307F\u304D",
  "\u3064\u3050\u306A\u3046",
  "\u3057\u3093\u3058\u3085\u304F",
  "\u3053\u305B\u304D",
  "\u3088\u304F\u3042\u3064",
  "\u61C7\u8AC7",
  "\u6307\u5B9A\u3059\u308B",
  "\u5C02\u9580",
  "\u4E00\u751F",
  "\u5E73\u58CC",
  "\u6EDD",
  "\u3058\u3069\u3046\u3057",
  "\u7740\u304F",
  "\u6CE5\u68D2",
  "\u69CB\u3048",
  "\u304D\u3058\u3085\u3064",
  "\u3057\u3087\u3072\u3087\u3046",
  "\u8CA8\u5E63",
  "\u597D\u5947\u5FC3",
  "\u7687\u592A\u5B50\u5983",
  "\u304B\u3044\u307B\u3046\u3059\u308B",
  "\u4E3B\u306B",
  "\u80CC\u5E83",
  "\u3061\u3093\u307F",
  "\u3088\u305D\u304F",
  "\u306A\u3064\u304B\u3057\u3044",
  "\u304C\u3093\u3044",
  "\u3061\u3087\u3046\u3057\u3083",
  "\u7121\u6575",
  "\u6240",
  "\u3060\u3044\u304C\u304F\u3044\u3093\u305B\u3044",
  "\u5DE6\u53F3",
  "\u306E\u3080",
  "\u611B\u56FD\u5FC3",
  "\u6851\u539F",
  "\u3069\u3046\u306F\u3093\u3059\u308B",
  "\u3044\u3063\u304B\u3044",
  "\u306A\u307F\u3060",
  "\u304F\u307E\u3082\u3068\u3051\u3093",
  "\u4E3B\u89B3\u7684",
  "\u666E\u6BB5",
  "\u3053\u3053\u308D\u307F\u308B",
  "\u3075\u304F\u3076\u304F\u308D",
  "\u3066\u3093\u3077\u304F",
  "\u305B\u3044\u3081\u3044",
  "\u306F\u306A\u306E\u3042\u306A",
  "\u307F\u304E\u3066",
  "\u89AA\u5B50\u4E3C",
  "\u53CD\u5247",
  "\u3057\u3085\u3046\u308A",
  "\u304B\u304F\u306B\u3093",
  "\u751F\u3048\u308B",
  "\u3051\u3080\u3057",
  "\u3059\u3051\u308B",
  "\u306E\u305E\u3044\u3066",
  "\u548C\u5C1A",
  "\u3048\u3093\u3061\u3087\u3046\u3059\u308B",
  "\u3053\u3046\u3068\u3046",
  "\u306A\u3052\u3059\u3066\u308B",
  "\u306A\u307E\u3051\u3082\u306E",
  "\u3042\u3044",
  "\u304D\u3068\u304F",
  "\u5BE9\u5224",
  "\u6016\u3044",
  "\u3053\u305F\u3048\u308B",
  "\u6BD4\u8F03",
  "\u3086\u306B\u3085\u3046",
  "\u66F2",
  "\u3061\u3093\u3082\u304F",
  "\u7834\u7523",
  "\u8FEB\u308B",
  "\u3042\u308F",
  "\u8F9B\u5B50",
  "\u7CF8",
  "\u65E9\u3005",
  "\u904B\u547D",
  "\u9320",
  "\u306E\u3046\u307F\u3093",
  "\u590F",
  "\u91CE\u7363",
  "\u8A66\u9A13",
  "\u6570\u8A5E",
  "\u6BCE\u65E5",
  "\u304E\u305B\u3044\u3057\u3083",
  "\u3088\u304F\u3057",
  "\u305B\u3093",
  "\u304A\u308D\u3057",
  "\u3086\u308C\u308B",
  "\u3044\u3057",
  "\u3048\u308B",
  "\u3054\u3089\u3093",
  "\u3070\u3044",
  "\u305F\u3044",
  "\u62D8\u7F6E",
  "\u3046\u3089\u304E\u308A",
  "\u7AF6\u8247",
  "\u304B\u3050",
  "\u6094\u3057\u3044",
  "\u306B\u3085\u3046\u305B\u304D",
  "\u305F\u3081\u306B",
  "\u3075\u3046\u3075",
  "\u3061\u3087\u3046\u305B\u3093",
  "\u7834\u58CA",
  "\u56F0\u96E3",
  "\u307E\u3093\u3048\u3064",
  "\u79FB\u52D5",
  "\u3057\u3042\u3064",
  "\u3042\u307E\u308B",
  "\u9999\u308A",
  "\u3044\u306A\u304B",
  "\u901A\u3059",
  "\u307B\u3046\u304D",
  "\u6804\u8A89",
  "\u3061\u3081\u3044\u3066\u304D",
  "\u304A\u3068\u308D\u3048\u308B",
  "\u3044\u3057\u305A\u3048",
  "\u77E5\u308A\u5408\u3044",
  "\u8CA8\u7269\u8239",
  "\u9178\u3063\u3071\u3044",
  "\u3081\u3044\u308F\u304F\u3081\u30FC\u308B",
  "\u3081\u3044\u308F\u304F\u30E1\u30FC\u30EB",
  "\u3068\u3046\u307B\u3046",
  "\u3066\u3089",
  "\u305C\u3093\u306B\u307B\u3093",
  "\u4E03\u3064",
  "\u6697\u3044",
  "\u3066\u306E\u3053\u3046",
  "\u3057\u3093\u305E\u3046",
  "\u4EF0\u3005\u3057\u3044",
  "\u3055\u3093\u304E\u3087\u3046",
  "\u516C\u5171",
  "\u5E74\u984D",
  "\u304B\u308F\u3055\u304D",
  "\u65E5\u520A",
  "\u3061\u3087\u3046",
  "\u7E2E\u5C0F",
  "\u3044\u3063\u3053",
  "\u4E0D\u6CC1",
  "\u4EBA\u67C4",
  "\u306F\u3044",
  "\u539F\u6F5C",
  "\u3064\u307F",
  "\u304B\u3093\u304B\u3064",
  "\u305E\u3046\u3048\u3093",
  "\u96D1\u8CBB",
  "\u304A\u304F\u308C\u308B",
  "\u9762\u5012\u81ED\u3044",
  "\u3057\u3087\u3046\u3058\u3087\u3046",
  "\u305F\u304A\u3059",
  "\u9806\u756A",
  "\u5929\u7687",
  "\u3057\u3085\u3044\u3093",
  "\u52D5\u63FA",
  "\u4E59",
  "\u3055\u308F\u3084\u304B",
  "\u3068\u3046",
  "\u671B\u307F",
  "\u4E00\u4EBA\u5A18",
  "\u304B\u304F",
  "\u304B\u3069",
  "\u306D\u3093\u304C\u3058\u3087\u3046",
  "\u3061\u3087\u304F\u305B\u3064",
  "\u305B\u3093\u3058\u3087\u3046",
  "\u71C3\u3084\u3059",
  "\u3075\u304B\u306E\u3046",
  "\u8CB7\u3044\u7269",
  "\u98A8\u6F6E",
  "\u6C96\u7E04",
  "\u3044\u304B",
  "\u3053\u3046\u304F\u3046\u307C\u304B\u3093",
  "\u304B\u304F\u308C\u308B",
  "\u304D\u307C\u3046\u3059\u308B",
  "\u5A92\u4ECB",
  "\u308C\u3044\u305E\u3046\u3053",
  "\u51B7\u9177",
  "\u7D1B\u3089\u308F\u3057\u3044",
  "\u305B\u3093\u3052\u3093",
  "\u5BB6\u5177",
  "\u7E41\u8302",
  "\u306A\u3055\u3051\u306A\u3044",
  "\u304D\u305A\u3064\u304F",
  "\u7A7A\u304D\u7F36",
  "\u7985\u5BFA",
  "\u5927\u6587\u5B57",
  "\u706B\u846C",
  "\u96F0\u56F2\u6C17",
  "\u5316\u7CA7",
  "\u5FCD\u8005",
  "\u3075\u3093\u3057\u3083",
  "\u9650\u308B",
  "\u3061\u3085\u3046\u3068\u306F\u3093\u3071",
  "\u306F\u305A\u304B\u3057\u3081\u308B",
  "\u4F55\u5EA6",
  "\u98A8\u8239",
  "\u3053\u3046\u304E\u3087\u3046",
  "\u304B\u304F\u3057\u3085\u3046",
  "\u3057\u308A\u3064",
  "\u3053\u3044",
  "\u3042\u304C\u308B",
  "\u6559\u3048\u308B",
  "\u7A0B",
  "\u5FD8\u308C\u7269",
  "\u8972\u6483",
  "\u304B\u3044\u3053\u308D\u304F",
  "\u6708\u520A",
  "\u3068\u306A\u3048\u308B",
  "\u305B\u3093\u306E\u3046",
  "\u55B6\u696D\u4E2D",
  "\u306A\u304C\u3055\u304D",
  "\u3052\u3093\u307E\u3044",
  "\u4E8C\u3064",
  "\u9AEA\u306E\u6BDB",
  "\u308D\u304F\u304A\u3093",
  "\u533F\u540D",
  "\u9AD8\u702C",
  "\u3057\u304D\u304D\u3093",
  "\u3075\u304B\u3076\u3093",
  "\u6012\u9CF4\u308B",
  "\u798F\u7949",
  "\u3042\u3055\u306D\u307C\u3046",
  "\u308A\u3083\u304F\u3054",
  "\u3057\u3056\u3044",
  "\u904B",
  "\u529B",
  "\u306D\u3070\u308B",
  "\u3064\u304F\u308B",
  "\u308F\u304B\u3081",
  "\u304A\u3046\u3057\u3085\u3046",
  "\u3084\u3059\u3044",
  "\u3048",
  "\u304B\u305B\u304E",
  "\u3042\u3089\u304B\u3058\u3081",
  "\u304B\u3093\u305B\u3064",
  "\u6065\u305A\u304B\u3057\u304C\u308B",
  "\u7126\u304C\u3059",
  "\u306F\u3044\u304D",
  "\u306F\u304B\u308B",
  "\u56F3\u8AAC",
  "\u3069\u3046\u3081\u3044",
  "\u3088\u3046\u3058",
  "\u3075\u306D\u3093\u3054\u307F",
  "\u3075\u306D\u3093\u30B4\u30DF",
  "\u93AE\u3081\u308B",
  "\u3057\u3085\u304F\u3093"
];
const words$1 = [
  "\u3064\u304E\u3064\u304E",
  "\u85AC",
  "\u5F53\u3066\u5B57",
  "\u3057\u3087\u304F\u3093",
  "\u9593\u9694",
  "\u98FD\u304F\u307E\u3067\u3082",
  "\u3042\u3073\u308B",
  "\u96C7\u7528",
  "\u304B\u3093\u3069\u3046\u3059\u308B",
  "\u3058\u3058\u3087\u3067\u3093",
  "\u8D85\u97F3\u6CE2",
  "\u3058\u3085\u3046\u3069\u3046",
  "\u9762",
  "\u5148\u9031",
  "\u3057\u3087\u3046\u304C\u3063\u3053\u3046",
  "\u907F\u3051\u308B",
  "\u3075\u305D\u304F",
  "\u307E\u304E\u3089\u3059",
  "\u9589\u3081\u308B",
  "\u305F\u307E\u3054",
  "\u3053\u308F\u3059",
  "\u5E95",
  "\u301C\u4EAD",
  "\u3057\u3083\u304F\u3084",
  "\u3057\u3083\u3063\u304B",
  "\u3072\u304D\u3056\u3093",
  "\u5272\u308A\u7BB8",
  "\u3053\u3046\u305E\u304F",
  "\u679C\u3066\u308B",
  "\u3064\u306A\u3072\u304D",
  "\u6F02\u3046",
  "\u6F20\u7136",
  "\u3057\u3087\u3046\u308A\u3083\u304F",
  "\u6E1B\u4FF8",
  "\u3055\u3044\u307C\u3046",
  "\u3055\u3044\u307B\u3046",
  "\u5E73\u5B89",
  "\u5C01\u7B52",
  "\u65E7\u59D3",
  "\u3088\u308F\u3088\u308F\u3057\u3044",
  "\u5473\u564C",
  "\u307C\u304D\u3093",
  "\u304F\u3064\u3058\u3087\u304F",
  "\u7D79\u7CF8",
  "\u3061\u304D\u3085\u3046",
  "\u304B\u305C",
  "\u534A\u984D",
  "\u304B\u3093\u305D\u304F",
  "\u3076\u3093",
  "\u3075\u3093",
  "\u305F\u308C\u308B",
  "\u5EC9\u4FA1",
  "\u305A\u3044\u3076\u3093",
  "\u5C48\u3080",
  "\u304B\u3093\u308A\u3087\u3046\u3066\u304D",
  "\u3059\u3093\u304B",
  "\u6BBB",
  "\u64EC\u88C5",
  "\u3046\u3048\u308B",
  "\u305F\u3044\u3055",
  "\u3042\u3064\u3044",
  "\u3052\u3044\u3072\u3093\u304B\u3093",
  "\u6D0B\u670D",
  "\u5927\u4E08\u592B",
  "\u5BDF\u77E5",
  "\u3057\u3048\u3093\u3059\u308B",
  "\u4ED5\u65B9\u304C\u306A\u3044",
  "\u5FB3\u5DDD",
  "\u3061\u3089\u304B\u3059",
  "\u3053\u304F\u3075\u304F\u3059\u308B",
  "\u3076\u305D\u3046",
  "\u3053\u3046\u3064\u3046",
  "\u9006",
  "\u99AC\u9E7F\u99AC\u9E7F\u3057\u3044",
  "\u5207\u8FEB",
  "\u4E0D\u5065\u5EB7",
  "\u5B66\u9662",
  "\u90FD\u5408",
  "\u5099\u3048\u308B",
  "\u3078\u3044\u304C\u3044",
  "\u306F\u3058\u3081\u3066",
  "\u8F38\u51FA",
  "\u8FF7\u8DEF",
  "\u6BCD",
  "\u3072\u304B\u304F\u3059\u308B",
  "\u306F\u306A\u3062",
  "\u306F\u306A\u3058",
  "\u3080\u3053\u3046",
  "\u306D\u3093\u3058\u3085\u3046",
  "\u81EA\u5B85",
  "\u8A98\u60D1",
  "\u3061\u3048\u3093",
  "\u592A\u308B",
  "\u3061\u304B\u304F",
  "\u5974\u3089",
  "\u5800\u5DDD",
  "\u3061\u304C\u3044",
  "\u305F\u3044\u3053\u3046\u3059\u308B",
  "\u904B\u3076",
  "\u72EC\u88C1",
  "\u306F\u3063\u307D\u3046",
  "\u3068\u3061\u3087\u3046",
  "\u5148\u305A",
  "\u306F\u3093\u305D\u3046",
  "\u305B\u3044\u3058\u3087\u3046",
  "\u3057\u3087\u3046\u3058\u3087\u3046",
  "\u304B\u3093\u3058\u308B",
  "\u4F53\u91CD",
  "\u4E0A\u624B",
  "\u539F\u6CB9",
  "\u3056\u305C\u3093",
  "\u65E2\u306B",
  "\u83EF\u3084\u304B",
  "\u4ED5\u4E8B",
  "\u3042\u3089\u3059",
  "\u3086\u308B\u3080",
  "\u304D\u3087\u3046\u3069\u3046",
  "\u958B\u9589",
  "\u60B2\u3057\u307F",
  "\u3057\u3083\u3053",
  "\u306D\u3070\u308A",
  "\u3088\u3046\u3044",
  "\u304A\u308A\u3081",
  "\u4F10\u63A1",
  "\u725B\u4E73",
  "\u79D8\u3081\u308B",
  "\u53F3\u7FFC",
  "\u4F1D\u7D71",
  "\u304D\u3072\u3093",
  "\u3084\u3055\u3057\u3044",
  "\u307B",
  "\u8B66\u5B98",
  "\u5DE6\u624B",
  "\u5168\u65E5\u672C",
  "\u3080\u305C\u3044",
  "\u3054\u3075\u304F",
  "\u304B\u3044\u305F\u304F",
  "\u6483\u3064",
  "\u3057\u3042\u3068\u308B\u3057",
  "\u30B7\u30A2\u30C8\u30EB\u3057",
  "\u3061\u3087\u3055\u304F\u3051\u3093",
  "\u3058\u304E\u3059\u308B",
  "\u8B5C\u9762",
  "\u8CAB\u304F",
  "\u7D04\u3059\u308B",
  "\u63D0\u6848\u3059\u308B",
  "\u54C0\u308C\u3080",
  "\u8FF7\u5B50",
  "\u304D\u3087\u3046\u304D",
  "\u3054\u3046\u3051\u3093",
  "\u305B\u3093\u305F\u304F\u3059\u308B",
  "\u3057\u3085\u3057\u3087\u3046",
  "\u6C5F\u6238",
  "\u72C2\u3046",
  "\u52A9\u624B",
  "\u65B0\u5A5A\u65C5\u884C",
  "\u691C\u67FB",
  "\u8272\u3005",
  "\u304B\u3076\u3057\u304D\u3057\u3058\u3087\u3046",
  "\u685C\u8272",
  "\u666E\u53CA",
  "\u96F6\u3059",
  "\u3057\u3057\u3087\u304F",
  "\u304D\u3085\u3046\u308A\u3087\u3046",
  "\u304A\u3093\u3068\u3046",
  "\u3057\u3087\u3046\u3086",
  "\u6CA1\u843D",
  "\u4EBA\u6027",
  "\u3051\u3044\u304B\u3093",
  "\u96FB\u8A71",
  "\u304A\u76C6",
  "\u304D\u3044\u308D",
  "\u3084\u3057\u306A\u3046",
  "\u934B",
  "\u906E\u65AD",
  "\u304B\u308F\u304B\u3059",
  "\u5BEE\u751F",
  "\u9762\u7A4D",
  "\u3068\u3046\u304D",
  "\u3075\u304F\u3078\u3044",
  "\u306A\u3044\u3057\u3087\u3070\u306A\u3057",
  "\u4E0D\u601D\u8B70",
  "\u3053\u306E\u9803",
  "\u304A\u304B\u306D",
  "\u6BBA\u4EBA\u8005",
  "\u304B\u3044\u305E\u304F",
  "\u6B6F\u3092\u78E8\u304F",
  "\u5E97",
  "\u306F\u306A\u306F\u3060",
  "\u30D5\u30E9\u30F3\u30B9\u8A9E",
  "\u8A55\u4FA1",
  "\u4E5D\u65E5",
  "\u3055\u3044\u3070\u3093",
  "\u63A8\u5968",
  "\u51FA\u7248",
  "\u6068\u307F",
  "\u6C17\u6301\u3061\u3044\u3044",
  "\u9ED9\u308B",
  "\u306F\u308A\u3044",
  "\u51DD\u56FA",
  "\u5091\u4F5C",
  "\u9B45\u529B",
  "\u3050\u3093",
  "\u53F3\u5229\u304D",
  "\u307E\u307B\u3046\u3064\u304B\u3044",
  "\u5FA9\u65E7",
  "\u304B\u304F\u3058\u3063\u3051\u3093",
  "\u3058\u304D\u3057\u3087\u3046\u305D\u3046",
  "\u3042\u308C\u308B",
  "\u304D\u3087\u3046\u306F\u3093\u3057\u3083",
  "\u305F\u3044\u308A\u304F",
  "\u3052\u3093\u3081\u3064",
  "\u4FF5",
  "\u3080\u3089\u3055\u304D\u3044\u308D",
  "\u75C5\u5E8A",
  "\u7C73\u5175",
  "\u307E\u3064\u308A",
  "\u587E\u751F",
  "\u89AA\u5207",
  "\u3081\u3044\u304C\u3089",
  "\u6838\u5B9F\u9A13",
  "\u306A\u304A\u3055\u3089",
  "\u9B54\u8853",
  "\u304C\u3044\u3088\u3046",
  "\u304B\u3093\u305C\u3093",
  "\u305B\u3044\u304B\u3093",
  "\u679C\u6A39",
  "\u301C\u7CFB",
  "\u307B\u306B\u3085\u3046\u3073\u3093",
  "\u3058\u3087\u3046\u3060\u3093",
  "\u8CE2\u660E",
  "\u307F\u306A\u3068",
  "\u3082\u306F\u3093",
  "\u3053\u3046\u3061\u3087\u304F",
  "\u6CF3\u3050",
  "\u91CD\u3044",
  "\u65E5\u6CA1",
  "\u7881",
  "\u304B\u3064",
  "\u3069\u3046\u3051\u3064",
  "\u8FD1\u8996",
  "\u914D\u616E",
  "\u306E\u304D",
  "\u5165\u6C5F",
  "\u3068\u3081\u308B",
  "\u6687",
  "\u66F8\u304D\u65B9",
  "\u80C3",
  "\u308A\u3087\u3046\u3069",
  "\u96E3\u3057\u3044",
  "\u6D6E\u4E16\u7D75",
  "\u559C\u5287",
  "\u3068\u3046\u3055\u3093",
  "\u306F\u3093\u3060\u3093\u3059\u308B",
  "\u3053\u3046\u305B\u3044",
  "\u5927\u4ECF",
  "\u63FA\u3055\u3076\u308B",
  "\u3044\u3058\u3093",
  "\u6A5F\u5ACC",
  "\u9ED2\u677F",
  "\u3048\u304D\u3073\u3087\u3046",
  "\u59A5\u5354\u3059\u308B",
  "\u3064\u3046\u3084\u304F",
  "\u4E57\u305B\u308B",
  "\u3051\u3057\u304D",
  "\u5E8A",
  "\u54C1\u8A5E",
  "\u6D88\u3059",
  "\u91D1\u7E1B\u308A",
  "\u3058\u3085\u3046\u3089\u3044",
  "\u6025\u9A30",
  "\u5341\u53F0",
  "\u7A93",
  "\u96D1\u97F3",
  "\u304D\u3087\u3060\u3044",
  "\u920D\u5668",
  "\u798D\u6839",
  "\u304B\u305F\u307F\u3061",
  "\u5C71\u8475",
  "\u5E97\u8217",
  "\u6E26\u5DFB\u304D",
  "\u304A\u3068\u3068\u3044",
  "\u3044\u3063\u3055\u304F\u3058\u3064",
  "\u6551\u6025\u8ECA",
  "\u99AC",
  "\u3053\u308D\u3059",
  "\u307C\u304F\u3057",
  "\u305B\u3063\u3077\u304F",
  "\u305F\u3066",
  "\u304A\u3069\u308D\u304F",
  "\u3084\u3055\u3044",
  "\u3058\u305E\u3046",
  "\u3053\u306F\u3093",
  "\u3044\u304F",
  "\u81EA\u7ACB",
  "\u304B\u3063\u3053\u3046",
  "\u8131\u7A0E",
  "\u59CB\u307E\u308B",
  "\u5B66\u8005",
  "\u304B\u3044",
  "\u3072\u304D\u3055\u304F",
  "\u9577\u5504",
  "\u4E0B\u7740",
  "\u3088\u304F\u3052\u3064",
  "\u4F11\u65E5",
  "\u4EE5\u4E0B",
  "\u5EC3\u589F",
  "\u90E8\u9996",
  "\u58CA\u3059",
  "\u3080\u304F",
  "\u59D4\u54E1",
  "\u5F85\u5408",
  "\u9802\u304F",
  "\u3088\u307C\u3046",
  "\u58EE\u5E74",
  "\u65AC\u6BBA",
  "\u3061\u3085\u3046\u3082\u3093\u3059\u308B",
  "\u3058\u3063\u304B\u3093",
  "\u5883",
  "\u65BD\u884C",
  "\u3064\u304F",
  "\u6D3B\u7528",
  "\u3076\u304D",
  "\u304B\u3044\u3058\u3085\u3046",
  "\u4EBA\u53E3",
  "\u307C\u3046\u305A",
  "\u305D\u3042\u304F",
  "\u3080\u307C\u3046",
  "\u767D\u83CA",
  "\u308A\u3083\u304F\u305A",
  "\u6C5A\u3059",
  "\u3059\u3044\u305B\u3093",
  "\u3042\u3089\u305D\u3046",
  "\u9AD8\u5024",
  "\u3042\u3046",
  "\u305B\u3044\u3057\u3093",
  "\u6307\u7D0B",
  "\u8D85\u301C",
  "\u3046\u3048\u308B",
  "\u3064\u307E\u308B",
  "\u9756\u56FD\u795E\u793E",
  "\u3068\u308A\u3042\u3048\u305A",
  "\u3068\u3075",
  "\u305F\u304F\u3059",
  "\u3058\u3087\u3046\u3058\u3085\u3093",
  "\u7F8A\u6BDB",
  "\u6D45\u3044",
  "\u9589\u3058\u308B",
  "\u6226\u6CA1",
  "\u3042\u3063\u3068\u3046\u3059\u308B",
  "\u3072\u304C\u3044",
  "\u91CF",
  "\u3058\u3087\u3046\u304D",
  "\u8AA4\u7528",
  "\u307B\u3046\u305B\u304D",
  "\u3064\u3070\u3055",
  "\u53F7",
  "\u3051\u3044\u3080\u3057\u3087",
  "\u96FB\u6E90",
  "\u52C7\u6C17",
  "\u3075\u304B\u3055",
  "\u306F\u3060\u304B",
  "\u305F\u3044\u3084\u304F",
  "\u304D\u3087\u3046\u3057\u3064",
  "\u9000\u304F",
  "\u3055\u304D\u307E\u308F\u308A",
  "\u3053\u3046\u304A\u3064",
  "\u7121\u7CD6",
  "\u3075\u3055\u3044",
  "\u3068\u304F\u306B",
  "\u3081\u3044\u3057",
  "\u307F\u3064",
  "\u307B\u3093\u3089\u3044",
  "\u307E\u3082\u308B",
  "\u3042\u3064\u304B\u3044",
  "\u65E5\u6B27",
  "\u5929\u4E95",
  "\u307F\u3055\u304D",
  "\u304A\u304D\u3083\u304F\u3055\u3093",
  "\u306B\u3093\u3044",
  "\u304D\u3087\u3046\u304B\u3044",
  "\u3044\u3064\u9803",
  "\u304B\u3093",
  "\u3057\u304D\u3082\u3046",
  "\u7279\u6B8A",
  "\u540C\u50DA",
  "\u8840\u6DB2",
  "\u3058\u3076\u3093",
  "\u3057\u3087\u3046\u304B\u3059\u308B",
  "\u790E",
  "\u307F\u306A\u3082\u3068",
  "\u8ED2",
  "\u3076\u3063\u304D\u3087\u3046",
  "\u3057\u305A\u3080",
  "\u305F\u3089\u3059",
  "\u6182\u3044",
  "\u7DCF\u62EC",
  "\u3082\u3046\u3059",
  "\u66B4\u529B",
  "\u3057\u3070\u3075",
  "\u3044\u305F\u305A\u3089",
  "\u7C73\u56FD",
  "\u9B54\u6CD5",
  "\u3053\u3068\u3070\u3064\u304D",
  "\u7A92\u606F",
  "\u5504\u3046",
  "\u91D1",
  "\u304D\u3082\u3061",
  "\u8A93\u3044",
  "\u3069\u308D",
  "\u8A71",
  "\u5947\u8972",
  "\u5DE1\u56DE",
  "\u5931\u3046",
  "\u9686\u8D77",
  "\u6295\u8CC7",
  "\u82BD",
  "\u3042\u304F\u308C\u3044",
  "\u5949\u4ED5",
  "\u3072\u3093\u304D\u3083\u304F",
  "\u3072\u3093\u304B\u304F",
  "\u307E\u3064",
  "\u305B\u3093\u308A\u3085\u3046",
  "\u3060\u3044\u3069\u3053\u308D",
  "\u3044\u3046",
  "\u3053\u3044\u306C",
  "\u306A\u3093\u3079\u3044",
  "\u3055\u304F\u306B\u3085\u3046",
  "\u30D5\u30E9\u30F3\u30B9\u4EBA",
  "\u304D\u3052\u3093\u3054",
  "\u3053\u304F\u307F\u3093",
  "\u4EA4\u932F",
  "\u597D\u304D",
  "\u4E00\u6587\u5B57",
  "\u307B\u3046\u3052\u3093",
  "\u5730\u9762",
  "\u3060\u304F\u308A\u3085\u3046",
  "\u898B\u5F53\u305F\u308B",
  "\u6D78\u3059",
  "\u3042\u3057\u304F\u3073",
  "\u5F31\u866B",
  "\u9001\u308B",
  "\u907A\u5931",
  "\u3042\u304A\u3044",
  "\u3061\u3042\u3093",
  "\u5B9C\u3057\u304F",
  "\u3042\u3089\u3042\u3089\u3057\u3044",
  "\u304B\u304A\u3064\u304D",
  "\u304B\u3061\u3085\u3046",
  "\u304C\u3093\u3070\u308B",
  "\u82B8\u8005",
  "\u9673\u5217\u5BA4",
  "\u5F25\u751F",
  "\u660E\u6CBB",
  "\u3081\u3044\u3057\u3087",
  "\u3054\u3058\u3085\u3046",
  "\u6E08\u307E\u3059",
  "\u7121\u99C4",
  "\u7D42\u70B9",
  "\u305E\u304F\u3054",
  "\u639B\u3051\u308B",
  "\u307B\u3046\u3057\u3085\u3046",
  "\u9A0E\u5175",
  "\u6DB2\u4F53",
  "\u4E0B\u3055\u3044",
  "\u3051\u3044\u3058\u3070\u3093",
  "\u674F",
  "\u5408\u3046",
  "\u75BE\u8D70",
  "\u308A\u3085\u3046\u3053\u3046\u3054",
  "\u51FA\u304B\u3051\u308B",
  "\u306F\u3061\u307E\u304D",
  "\u624B\u4F5C\u308A",
  "\u308C\u3064\u3042\u304F",
  "\u3046\u3093\u304C\u3044\u3044",
  "\u306F\u3061\u306E\u3059",
  "\u30CF\u30C1\u306E\u3059",
  "\u8272\u76F2",
  "\u5F62",
  "\u5E0C\u671B\u3059\u308B",
  "\u3053\u3046\u305B\u3044",
  "\u3044\u3061\u3060\u3044",
  "\u6625\u4F11\u307F",
  "\u7E1B\u308B",
  "\u91D1\u661F",
  "\u305D\u3093\u3056\u3044",
  "\u9632\u72AF",
  "\u5927\u5C09",
  "\u8001\u9F62",
  "\u5DEE\u3057\u4E0A\u3052\u308B",
  "\u72A0\u7272",
  "\u306B\u308B",
  "\u554F\u984C",
  "\u53CC",
  "\u5B89\u6CF0",
  "\u305B\u3093\u3058\u3087\u3046\u3056\u3044",
  "\u7D99\u627F",
  "\u304B\u3093\u3057\u3093",
  "\u4E3C",
  "\u3056\u3093\u3074\u3093",
  "\u305D\u3060\u3066\u308B",
  "\u305F\u3064",
  "\u4E0D\u53EF\u6B20",
  "\u5831\u3058\u308B",
  "\u6291\u5236",
  "\u3051\u3044\u3051\u3093\u3057\u3083",
  "\u304D\u3087\u3046\u3075",
  "\u305B\u3044\u305E\u3046",
  "\u304D\u3093\u304F"
];
const lorem$1 = {
  supplemental: supplemental$1,
  words: words$1
};
const first_name$2 = [
  "\u3064\u3080\u304E",
  "\u308A\u3093",
  "\u3048\u307E",
  "\u3053\u3053\u308D",
  "\u3053\u3053\u3084",
  "\u307F\u3086",
  "\u308A\u3087\u3046",
  "\u3042\u304A\u3044",
  "\u304B\u306E",
  "\u304B\u3048\u3067",
  "\u3068\u3089\u307E\u3055",
  "\u3052\u3093",
  "\u3044\u3076\u304D",
  "\u3042\u304A",
  "\u304B\u306A\u305F",
  "\u3072\u3087\u3046\u304C",
  "\u308A\u3087\u3046",
  "\u305D\u3046\u305F",
  "\u3086\u3044\u3068",
  "\u3053\u305F\u308D\u3046"
];
const last_name$2 = [
  "\u30B5\u30C8\u30A6",
  "\u30B9\u30BA\u30AD",
  "\u30BF\u30AB\u30CF\u30B7",
  "\u30BF\u30CA\u30AB",
  "\u30EF\u30BF\u30CA\u30D9",
  "\u30A4\u30C8\u30A6",
  "\u30CA\u30AB\u30E0\u30E9",
  "\u30B3\u30D0\u30E4\u30B7",
  "\u30E4\u30DE\u30E2\u30C8",
  "\u30AB\u30C8\u30A6",
  "\u30E8\u30B7\u30C0",
  "\u30E4\u30DE\u30C0",
  "\u4F50\u3005\u6728",
  "\u30B5\u30B5\u30AD",
  "\u30E4\u30DE\u30B0\u30C1",
  "\u30B5\u30A4\u30C8\u30A6",
  "\u30B7\u30DF\u30BA",
  "\u30E4\u30DE\u30B6\u30AD",
  "\u30CA\u30AB\u30B8\u30DE",
  "\u30E2\u30EA"
];
const title$2 = {
  descriptor: [
    "\u925B",
    "\u30B7\u30CB\u30A2",
    "\u76F4\u63A5",
    "\u300C\u4F01\u696D\u300D",
    "\u52D5\u7684",
    "\u672A\u6765",
    "\u88FD\u54C1",
    "\u5168\u56FD",
    "\u300C\u5730\u57DF\u300D",
    "\u533A\u57DF",
    "\u300C\u4E2D\u592E\u300D",
    "\u30B0\u30ED\u30FC\u30D0\u30EB",
    "\u304A\u5BA2\u69D8",
    "\u300C\u6295\u8CC7\u5BB6\u300D",
    "\u52D5\u7684",
    "\u56FD\u969B\u7684",
    "\u907A\u7523",
    "\u524D\u65B9",
    "\u5185\u90E8",
    "\u4EBA\u9593",
    "\u30C1\u30FC\u30D5",
    "\u4E3B\u8981"
  ],
  level: [
    "\u300C\u30BD\u30EA\u30E5\u30FC\u30B7\u30E7\u30F3\u300D",
    "\u30D7\u30ED\u30B0\u30E9\u30E0",
    "\u30D6\u30E9\u30F3\u30C9",
    "\u5B89\u5168",
    "\u30EA\u30B5\u30FC\u30C1",
    "\u30DE\u30FC\u30B1\u30C6\u30A3\u30F3\u30B0",
    "\u300C\u6307\u4EE4\u300D",
    "\u5B9F\u88C5",
    "\u7D71\u5408",
    "\u300C\u6A5F\u80FD\u6027\u300D",
    "\u5FDC\u7B54",
    "\u30D1\u30E9\u30C0\u30A4\u30E0",
    "\u6226\u8853",
    "\u8EAB\u5143",
    "\u300C\u5E02\u5834\u300D",
    "\u30B0\u30EB\u30FC\u30D7",
    "\u5206\u5272",
    "\u300C\u30A2\u30D7\u30EA\u30B1\u30FC\u30B7\u30E7\u30F3\u300D",
    "\u6700\u9069\u5316",
    "\u30AA\u30DA\u30EC\u30FC\u30B7\u30E7\u30F3",
    "\u30A4\u30F3\u30D5\u30E9\u30B9\u30C8\u30E9\u30AF\u30C1\u30E3\u30FC",
    "\u300C\u30A4\u30F3\u30C8\u30E9\u30CD\u30C3\u30C8\u300D",
    "\u300C\u30B3\u30DF\u30E5\u30CB\u30B1\u30FC\u30B7\u30E7\u30F3\u300D"
  ],
  job: [
    "\u300C\u30B9\u30FC\u30D1\u30FC\u30D0\u30A4\u30B6\u30FC\u300D",
    "\u4EF2\u9593,\u540C\u50DA",
    "\u30A8\u30B0\u30BC\u30AF\u30C6\u30A3\u30D6",
    "\u300C\u30EA\u30A8\u30BE\u30F3\u300D",
    "\u5F79\u54E1",
    "\u30DE\u30CD\u30B8\u30E3\u30FC",
    "\u30A8\u30F3\u30B8\u30CB\u30A2",
    "\u30B9\u30DA\u30B7\u30E3\u30EA\u30B9\u30C8",
    "\u76E3\u7763",
    "\u30B3\u30FC\u30C7\u30A3\u30CD\u30FC\u30BF\u30FC",
    "\u300C\u7BA1\u7406\u8005\u300D",
    "\u5EFA\u7BC9\u5BB6",
    "\u300C\u30A2\u30CA\u30EA\u30B9\u30C8\u300D",
    "\u30C7\u30B6\u30A4\u30CA\u30FC",
    "\u30D7\u30E9\u30F3\u30CA\u30FC",
    "\u300C\u30AA\u30FC\u30B1\u30B9\u30C8\u30EC\u30FC\u30BF\u30FC\u300D",
    "\u300C\u6280\u8853\u8005\u300D",
    "\u30C7\u30D9\u30ED\u30C3\u30D1\u30FC",
    "\u30D7\u30ED\u30C7\u30E5\u30FC\u30B5\u30FC",
    "\u30B3\u30F3\u30B5\u30EB\u30BF\u30F3\u30C8",
    "\u30A2\u30B7\u30B9\u30BF\u30F3\u30C8",
    "\u300C\u30D5\u30A1\u30B7\u30EA\u30C6\u30FC\u30BF\u30FC\u300D",
    "\u30A8\u30FC\u30B8\u30A7\u30F3\u30C8",
    "\u4EE3\u8868",
    "\u300C\u30B9\u30C8\u30E9\u30C6\u30B8\u30B9\u30C8\u300D"
  ]
};
const name$2 = {
  female_first_name: last_name$2,
  first_name: last_name$2,
  last_name: first_name$2,
  male_first_name: last_name$2,
  title: title$2,
  binary_gender: [],
  female_middle_name: [],
  male_middle_name: [],
  middle_name: [],
  gender: [],
  prefix: [],
  suffix: [],
  name: []
};
const formats$3 = ["0####-#-####", "0###-##-####", "0##-###-####", "0#-####-####"];
const phone_number$2 = {
  formats: formats$3
};
const adjective$4 = [
  "\u653E\u68C4\u3055\u308C\u305F",
  "\u6709\u80FD",
  "\u7D76\u5BFE\u306E",
  "\u53EF\u611B\u3044",
  "\u5192\u967A",
  "\u30A2\u30AB\u30C7\u30DF\u30C3\u30AF",
  "\u8A31\u5BB9\u3067\u304D\u308B",
  "\u300C\u826F\u3044\u30EC\u30D3\u30E5\u30FC\u300D",
  "\u7D42\u4E86",
  "\u6B63\u78BA",
  "\u75DB\u307F",
  "\u300C\u9178\u6027\u300D",
  "\u66F2\u82B8",
  "\u30DD\u30B8\u30C6\u30A3\u30D6",
  "\u5B9F\u969B",
  "\u300C\u719F\u7DF4\u3057\u305F\u300D",
  "\u5370\u8C61\u7684",
  "\u611F\u5606",
  "\u300C\u30C6\u30A3\u30FC\u30F3\u30A8\u30A4\u30B8\u30E3\u30FC\u300D",
  "\u53EF\u611B\u3044",
  "\u5D07\u62DD",
  "\u9AD8\u5EA6",
  "\u6050\u308C",
  "\u300C\u611B\u60C5\u6DF1\u3044\u300D",
  "\u5E74",
  "\u91CD\u3044",
  "\u6311\u767A",
  "\u300C\u30A2\u30B8\u30E3\u30A4\u30EB\u300D",
  "\u8208\u596E\u3057\u305F",
  "\u300C\u82E6\u3057\u3081\u3089\u308C\u305F\u300D",
  "\u9069\u5207",
  "\u534A\u958B\u304D",
  "\u30D1\u30CB\u30C3\u30AF",
  "\u8B66\u5831",
  "\u8B66\u5831",
  "\u300C\u758E\u5916\u300D",
  "\u4F4F\u3080",
  "\u5168\u3066",
  "\u300C\u5229\u4ED6\u7684\u300D",
  "\u3059\u3070\u3089\u3057\u3044",
  "\u91CE\u5FC3\u7684",
  "\u9069\u5207",
  "\u300C\u9762\u767D\u304C\u3063\u3066\u300D",
  "\u9762\u767D\u3044",
  "\u300C\u56FA\u5B9A\u300D",
  "\u53E4\u4EE3",
  "\u5929\u4F7F",
  "\u6012\u308A",
  "\u300C\u82E6\u3057\u3081\u3089\u308C\u305F\u300D",
  "\u30A2\u30CB\u30E1\u30FC\u30B7\u30E7\u30F3",
  "\u300C\u6BCE\u5E74\u300D",
  "\u4ED6\u306E",
  "\u30A2\u30F3\u30C6\u30A3\u30FC\u30AF",
  "\u6C17\u306B\u306A\u308B",
  "\u3069\u308C\u304B",
  "\u61F8\u5FF5",
  "\u9069\u5207",
  "\u7C21\u5358",
  "\u300C\u5317\u6975\u300D",
  "\u300C\u5E72\u3070\u3064\u300D",
  "\u300C\u82B3\u9999\u65CF\u300D",
  "\u300C\u82B8\u8853\u7684\u300D",
  "\u6065\u305A\u304B\u3057\u304B\u3063\u305F",
  "\u78BA\u8A8D",
  "\u3059\u3070\u3089\u3057\u3044",
  "\u300C\u30B9\u30DD\u30FC\u30C4\u300D",
  "\u4ED8\u968F\u306E",
  "\u6C17\u3092\u3064\u3051\u308D",
  "\u9B45\u529B\u7684",
  "\u6DF1\u523B",
  "\u672C\u5F53\u306B",
  "\u300C\u627F\u8A8D\u300D",
  "\u300C\u81EA\u52D5\u300D",
  "\u3088\u304F\u6DF1\u3044",
  "\u5E73\u5747",
  "\u300C\u77E5\u3063\u3066\u3044\u305F\u300D",
  "\u300C\u9A5A\u304F\u3079\u304D\u300D",
  "\u6700\u60AA",
  "\u6C17\u307E\u305A\u3044",
  "\u5B50\u4F9B\u3063\u307D\u3044",
  "\u60AA\u3044",
  "\u623B\u308B",
  "\u3086\u308B\u3044",
  "\u88F8",
  "\u4E0D\u6BDB",
  "\u300C\u57FA\u672C\u300D",
  "\u7F8E\u3057\u3044",
  "\u9045\u3044",
  "\u611B\u3055\u308C\u3057\u8005",
  "\u597D\u307E\u3057\u3044",
  "\u300C\u3088\u308A\u826F\u3044\u3082\u306E\u300D",
  "\u6700\u9AD8\u306E",
  "\u7D20\u6674\u3089\u3057\u304B\u3063\u305F",
  "\u5927\u304D\u3044",
  "\u300C\u5FC3\u306E\u5E83\u3044\u300D",
  "\u300C\u751F\u5206\u89E3\u6027\u300D",
  "\u300C\u4E00\u53E3\u30B5\u30A4\u30BA\u300D",
  "\u82E6\u3044",
  "\u9ED2"
];
const adverb$2 = [
  "\u7570\u5E38\u306A",
  "\u4E0D\u5728",
  "\u300C\u5076\u7136\u300D",
  "\u9178",
  "\u5B9F\u969B\u306B",
  "\u5192\u967A",
  "\u305D\u308C\u3067",
  "\u307B\u3068\u3093\u3069",
  "\u3044\u3064\u3082",
  "\u300C\u6012\u3063\u3066\u300D",
  "1\u5E74\u5F53\u305F\u308A",
  "\u6C17\u306B\u306A\u308B",
  "\u50B2\u6162",
  "\u6C17\u307E\u305A\u3044",
  "\u304A\u3063\u3068\u3063\u3068",
  "\u30B7\u30E3\u30A4",
  "\u7F8E\u3057\u3055",
  "\u82E6\u3044",
  "\u300C\u8584\u6697\u3044\u300D",
  "\u300C\u76F2\u76EE\u7684\u306B\u300D",
  "\u5E78\u305B\u306B",
  "\u300C\u30EC\u30C8\u30EA\u30C3\u30AF\u306B\u300D",
  "\u5927\u80C6\u306A",
  "\u300C\u52C7\u6562\u306B\u300D",
  "\u300C\u7C21\u5358\u306B\u300D",
  "\u660E\u308B\u3044",
  "\u300C\u6D3B\u767A\u300D",
  "\u300C\u5E83\u304F\u300D",
  "\u5FD9\u3057\u3044",
  "\u843D\u3061\u7740\u3044\u3066",
  "\u6C17\u3092\u3064\u3051\u3066",
  "\u4E0D\u6CE8\u610F",
  "\u6CE8\u610F\u6DF1\u3044",
  "\u3082\u3061\u308D\u3093\u3067\u3059",
  "\u300C\u559C\u3093\u3067\u300D",
  "\u660E\u3089\u304B\u306B",
  "\u982D\u304C\u3044\u3044",
  "\u8FD1\u3044",
  "\u300C\u540C\u8EF8\u300D",
  "\u30AB\u30E9\u30D5\u30EB",
  "\u3044\u3064\u3082\u306E",
  "\u300C\u7D99\u7D9A\u7684\u306B\u300D",
  "\u843D\u3061\u7740\u3044\u3066",
  "\u6B63\u3057\u3044",
  "\u300C\u52C7\u6562\u306B\u300D",
  "\u30AF\u30ED\u30B9",
  "\u6B8B\u9177",
  "\u300C\u4E0D\u601D\u8B70\u306A\u3053\u3068\u306B\u300D",
  "\u6BCE\u65E5",
  "\u300C\u7D76\u5999\u300D",
  "\u30CF\u30CB\u30FC",
  "\u6D6E\u6C17",
  "\u6DF1\u3044",
  "\u300C\u6311\u767A\u7684\u300D",
  "\u300C\u610F\u56F3\u7684\u306B\u300D",
  "\u300C\u559C\u3093\u3067\u300D",
  "\u6DF1\u523B",
  "\u6F20\u7136\u3068",
  "\u5BB9\u7591\u8005",
  "\u5922",
  "\u7C21\u5358\u306B",
  "\u300C\u6075\u307F\u300D",
  "\u300C\u5143\u6C17\u300D",
  "\u300C\u5927\u3044\u306B\u300D",
  "\u300C\u7A4D\u6975\u7684\u306B\u300D",
  "\u540C\u3058",
  "\u7279\u306B",
  "\u5E73",
  "\u5E73",
  "\u6700\u5F8C\u306B",
  "\u4E01\u5EA6",
  "\u8208\u596E\u3057\u305F",
  "\u975E\u5E38\u306B",
  "\u3068\u3066\u3082",
  "\u5FE0\u5B9F",
  "\u6709\u540D",
  "\u9060\u3044",
  "\u65E9\u304F",
  "\u81F4\u547D\u7684"
];
const conjunction$2 = [
  "\u623B\u308B",
  "\u7D50\u5C40",
  "\u305D\u308C\u3067\u3082",
  "\u3068",
  "\u306A\u306E\u3067",
  "\u3057\u305F\u304C\u3063\u3066",
  "\u304B\u306E\u3088\u3046\u306B",
  "\u300C\u3082\u3057\u3042\u308C\u3070\u300D",
  "\u300C\u53EF\u80FD\u306A\u9650\u308A\u300D",
  "\u3059\u3050\u306B",
  "\u304A\u6C17\u306B\u5165\u308A",
  "\u306A\u305C\u306A\u3089",
  "\u524D\u65B9",
  "\u3057\u304B\u3057",
  "\u305D\u308C\u3067",
  "\u5E73",
  "\u305D\u308C\u3067\u3082",
  "\u305D\u308C\u3067\u3082",
  "\u3084\u3063\u3068",
  "\u70BA\u306B",
  "\u4F8B\u3048\u3070",
  "\u307E\u305F",
  "\u3057\u305F\u304C\u3063\u3066",
  "\u3067\u3082",
  "\u3082\u3057\u3082",
  "\u3082\u3057\u3082",
  "\u300C\u3082\u3057\u305D\u3046\u306A\u3089\u300D",
  "\u300C\u3044\u3064\u300D",
  "\u307E\u305F",
  "\u5B9F\u969B\u306B",
  "\u306A\u305C\u306A\u3089",
  "\u306A\u305C\u306A\u3089",
  "\u3068\u3053\u308D\u3067",
  "\u78BA\u304B\u306B",
  "\u4EE3\u308F\u308A\u306F",
  "\u306A\u306E\u3067",
  "\u300C\u5C11\u306A\u3044\u300D",
  "\u300C\u540C\u69D8\u306B\u300D",
  "\u540C\u6642\u306B",
  "\u307E\u305F\u306F",
  "\u4ECA",
  "\u4ECA\u5F8C",
  "\u4ECA",
  "\u300C\u4ECA\u3044\u3064\u300D",
  "\u4E00\u5EA6",
  "\u307E\u305F",
  "\u3082\u3057\u3082",
  "\u63D0\u4F9B\u3055\u308C\u305F",
  "\u305D\u308C\u4EE5\u5916\u306E",
  "\u4EE5\u6765",
  "\u305D\u308C\u3067",
  "\u3068\u306A\u308B\u3053\u3068\u306B\u3088\u3063\u3066",
  "\u3082\u3057\u3082",
  "\u305D\u308C\u304B",
  "\u3067\u3082",
  "\u305D\u308C\u307E\u3067",
  "\u3044\u3064\u3067\u3082",
  "\u3067\u3082",
  "\u3069\u3053\u3067\u3082",
  "\u3069\u308C\u306E",
  "\u8AB0",
  "\u3067\u3082"
];
const interjection$2 = [
  "\u300C\u30D7\u30FC\u3055\u3093\u300D",
  "\u304A\u30FC",
  "\u30D0\u30AB",
  "\u300C\u30CA\u30F3\u30BB\u30F3\u30B9\u300D",
  "\u300Cshush\u300D",
  "\u308F\u304A",
  "\u300C\u3088\u3056\u300D",
  "\u300Cshush\u300D",
  "\u300Cshush\u300D",
  "\u30D0\u30AB",
  "\u795E",
  "\u30D1\u30D5",
  "\u300C\u3048\u3048\u3068\u300D",
  "\u4F55",
  "\u300C\u3046\u30FC\u3093\u300D",
  "\u300Cbrr\u300D",
  "\u300C\u3048\u3048\u3068\u300D",
  "\u300C\u30E4\u30D5\u30FC\u300D",
  "\u300C\u3042\u306F\u300D",
  "\u300C\u30A6\u30FC\u30D5\u30FC\u300D",
  "\u300C\u30C9\u30E9\u30C3\u30C8\u300D",
  "\u300C\u304C\u300D",
  "\u300C\u3048\u3048\u3068\u300D",
  "\u300Cpsst\u300D",
  "\u4F55",
  "\u4F55",
  "\u300C\u30A8\u30D4\u300D",
  "\u304A\u3063\u3068\u3063\u3068",
  "\u304A\u3063\u3068\u3063\u3068",
  "\u300C\u30D7\u30FC\u3055\u3093\u300D",
  "\u300Cgadzooks\u300D",
  "\u300C\u3048\u3048\u3068\u300D",
  "\u4F55",
  "\u300C\u3048\u3048\u3068\u300D",
  "\u300Ctsk\u300D",
  "\u300C\u75DB\u3044\u300D",
  "\u96FB\u8A71",
  "\u78BA\u8A8D",
  "\u300C\u3048\u3048\u3068\u300D",
  "\u795E",
  "\u300C\u30CF\u30F3\u30D5\u300D",
  "\u9B5A",
  "\u300C\u30BE\u30FC\u30A4\u300D",
  "\u300C\u3048\u3048\u3068\u300D",
  "\u60AA\u3044",
  "\u30B3\u30A4\u30F3",
  "\u300C\u3048\u3048\u3068\u300D"
];
const noun$4 = [
  "\u300CATM\u300D",
  "CD",
  "\u300CSUV\u300D",
  "\u30C6\u30EC\u30D3",
  "\u300C\u30C4\u30C1\u30D6\u30BF\u300D",
  "\u300C\u305D\u308D\u3070\u3093\u300D",
  "\u4FEE\u9053\u9662",
  "\u7565\u8A9E",
  "\u8179\u90E8",
  "\u80FD\u529B",
  "\u300C\u969C\u5BB3\u7B49\u300D",
  "\u5EC3\u6B62",
  "\u4E2D\u7D76",
  "\u5EC3\u6B62",
  "\u4E0D\u5728",
  "\u30EA\u30C3\u30C1",
  "\u4E71\u7528",
  "\u5B66\u8005",
  "\u30AB\u30EC\u30C3\u30B8",
  "\u30A2\u30AF\u30BB\u30EB",
  "\u30A2\u30AF\u30BB\u30EB",
  "\u30A2\u30AF\u30BB\u30F3\u30C8",
  "\u300C\u53D7\u3051\u5165\u308C\u300D",
  "\u300C\u4F7F\u7528\u6A29\u300D",
  "\u4ED8\u5C5E\u54C1",
  "\u4E8B\u4EF6",
  "\u6B62\u307E\u308B",
  "\u300C\u4F34\u4FB6\u300D",
  "\u6210\u679C",
  "\u300C\u4F1A\u3046\u300D",
  "\u306B\u3088\u308B\u3068",
  "\u30A2\u30B3\u30FC\u30C7\u30A3\u30AA\u30F3",
  "\u30A2\u30AB\u30A6\u30F3\u30C8",
  "\u300C\u8AAC\u660E\u8CAC\u4EFB\u300D",
  "\u300C\u4F1A\u8A08\u300D",
  "\u300C\u4F1A\u8A08\u300D",
  "\u6B63\u78BA\u3055",
  "\u300C\u544A\u767A\u300D",
  "\u30A2\u30BB\u30C6\u30FC\u30C8",
  "\u6210\u679C",
  "\u300C\u9054\u6210\u8005\u300D",
  "\u9178",
  "\u8A8D\u3081\u308B",
  "\u300C\u3069\u3093\u3050\u308A\u300D",
  "\u97F3\u97FF",
  "\u77E5\u308A\u5408\u3044",
  "\u5F97\u308B",
  "\u30A8\u30FC\u30AB\u30FC",
  "\u300C\u30A2\u30AF\u30EA\u30EB\u7E4A\u7DAD\u300D",
  "\u884C\u52D5",
  "\u30A2\u30AF\u30B7\u30E7\u30F3",
  "\u300C\u30A2\u30AF\u30C6\u30A3\u30D9\u30FC\u30B7\u30E7\u30F3\u300D",
  "\u300C\u6D3B\u52D5\u5BB6\u300D",
  "\u30A2\u30AF\u30C6\u30A3\u30D3\u30C6\u30A3",
  "\u4FF3\u512A",
  "\u4FF3\u512A",
  "\u937C",
  "\u300C\u5BA3\u4F1D\u3059\u308B\u300D",
  "\u9069\u5FDC\u3059\u308B",
  "\u30A2\u30C0\u30D7\u30BF",
  "\u300C\u4E2D\u6BD2\u300D",
  "\u8FFD\u52A0",
  "\u4F4F\u6240",
  "\u5F62\u5BB9\u8A5E",
  "\u8ABF\u6574",
  "\u300C\u7BA1\u7406\u300D",
  "\u300C\u7BA1\u7406\u300D",
  "\u300C\u7BA1\u7406\u30B9\u30BF\u30C3\u30D5\u300D",
  "\u611F\u5606",
  "\u5165\u5834\u6599",
  "\u300Cadobe\u300D",
  "\u4F7F\u7528\u3059\u308B",
  "\u300C\u30A2\u30C9\u30EC\u30CA\u30EA\u30F3\u300D",
  "\u300C\u30A2\u30C9\u30EC\u30CA\u30EA\u30F3\u300D",
  "\u300C\u30A2\u30EB\u30C0\u30EB\u30C8\u300D",
  "\u5927\u4EBA",
  "\u9032\u6357",
  "\u9032\u6357",
  "\u30A2\u30C9\u30D0\u30F3\u30C6\u30FC\u30B8"
];
const preposition$2 = [
  "1",
  "\u5F8C\u308D\u306B",
  "\u30DC\u30FC\u30C8\u306B\u4E57\u3063\u3066",
  "\u7D04",
  "\u305D\u306E\u4E0A",
  "\u4E0D\u5728",
  "\u300C\u30D1\u30B9\u30B9\u30EB\u30FC\u300D",
  "\u524D",
  "\u623B\u308B",
  "\u300C\u53CD\u5BFE\u3059\u308B\u300D",
  "\u5E73\u884C",
  "\u305D\u308C\u4EE5\u5916",
  "\u306E\u4E2D",
  "\u771F\u3093\u4E2D",
  "\u306E\u4E2D",
  "\u306E",
  "1",
  "\u5E73\u548C\u7684",
  "\u300C\u53CD\u5BFE\u3059\u308B\u300D",
  "\u3061\u3087\u3046\u3069\u3044\u3044",
  "\u300CApud\u300D",
  "\u7D04",
  "\u306A\u306E\u3067",
  "\u305D\u308C\u4EE5\u5916",
  "\u30AF\u30ED\u30B9",
  "\u5B58\u5728",
  "\u300C\u53CD\u5BFE\u3059\u308B\u300D",
  "\u300C\u4E0A\u306B\u300D",
  "\u7981\u6B62",
  "\u524D\u65B9",
  "\u5F8C\u308D\u306B",
  "\u4EE5\u4E0B",
  "\u4E0B",
  "\u305D\u308C\u4EE5\u5916",
  "\u306E\u4ED6\u306B",
  "\u306E\u9593\u306B",
  "\u8D85\u3048\u305F",
  "\u3057\u304B\u3057",
  "\u300C\u901A\u308A\u629C\u3051\u308B\u300D",
  "\u7D04",
  "\u7D04",
  "\u691C\u8A0E",
  "\u3067\u3082",
  "\u4E0B",
  "\u9650\u76EE",
  "\u306E\u4ED6\u306B",
  "\u4F8B\u5916",
  "\u300C\u9664\u5916\u3059\u308B\u300D",
  "\u4E0D\u5408\u683C",
  "\u4EE5\u4E0B",
  "\u70BA\u306B",
  "\u524D\u65B9",
  "\u304B\u3089",
  "\u300C\u4E0E\u3048\u3089\u308C\u305F\u300D",
  "\u5B58\u5728",
  "\u542B\u3080",
  "\u306E",
  "\u5165\u308B",
  "\u300C\u5C11\u306A\u3044\u300D",
  "\u304A\u6C17\u306B\u5165\u308A",
  "\u771F\u3093\u4E2D",
  "\u771F\u3093\u4E2D",
  "\u6E1B\u3089\u3059",
  "\u578B",
  "\u8FD1\u304F",
  "\u6B21",
  "\u305D\u308C\u3067\u3082",
  "\u306E",
  "\u96E2\u308C\u308B",
  "\u512A\u308C\u307E\u3057\u305F",
  "\u5230\u7740",
  "\u53CD\u5BFE",
  "\u5916\u51FA",
  "\u5916\u90E8\u306E",
  "\u8D85\u3048\u305F",
  "\u30DA\u30FC\u30B9",
  "\u904E\u53BB",
  "\u6BCE\u65E5",
  "\u8FFD\u52A0",
  "\u89AA\u611B\u306A\u308B",
  "\u300C\u30AF\u30A2\u300D",
  "\u7D04",
  "\u5186\u5F62",
  "\u306A\u3057",
  "\u4FDD\u5B58",
  "\u4EE5\u6765",
  "\u6BD4\u8F03",
  "\u3053\u308C",
  "\u5408\u683C",
  "\u3044\u3064\u3082",
  "\u305D\u308C\u307E\u3067",
  "\u6642\u4EE3",
  "\u306B",
  "\u306B\u5411\u304B\u3063\u3066",
  "\u306B\u5411\u304B\u3063\u3066",
  "\u4E0B",
  "\u4E0B",
  "\u9055\u3046",
  "\u305D\u308C\u307E\u3067",
  "\u5230\u7740",
  "\u4E0A",
  "\u305D\u306E\u4E0A",
  "\u6BD4\u8F03\u7684",
  "\u5408\u683C",
  "\u300C\u526F\u300D",
  "\u3068",
  "\u4E2D\u8EAB",
  "\u3044\u3044\u3048",
  "\u4FA1\u5024"
];
const verb$3 = [
  "\u653E\u68C4\u3059\u308B",
  "abase",
  "\u300C\u8870\u5F31\u300D",
  "\u300C\u7701\u7565\u5F62\u300D",
  "\u300C\u9000\u4F4D\u300D",
  "\u62C9\u81F4",
  "abet",
  "\u300C\u5ACC\u3044\u300D",
  "\u300C\u5F93\u3046\u300D",
  "abjure",
  "abnegate",
  "\u300Cabolish\u300D",
  "abominate",
  "\u30A2\u30DC\u30FC\u30C8",
  "\u300C\u305F\u304F\u3055\u3093\u300D",
  "\u300C\u6469\u8017\u300D",
  "\u300C\u30A2\u30D6\u30EA\u30C3\u30B8\u300D",
  "\u300C\u5EC3\u6B62\u300D",
  "abscond",
  "\u300C\u30A2\u30D6\u30BB\u30A4\u30EA\u30F3\u30B0\u300D",
  "\u4E0D\u5728",
  "\u300C\u89E3\u6563\u300D",
  "\u5438\u53CE\u3059\u308B",
  "\u300C\u68C4\u6A29\u300D",
  "\u6982\u8981",
  "\u4E71\u7528",
  "\u300C\u30A2\u30D0\u30C3\u30C8\u300D",
  "\u300C\u30A2\u30AF\u30BB\u30B9\u300D",
  "\u300C\u52A0\u901F\u3059\u308B\u300D",
  "\u30A2\u30AF\u30BB\u30F3\u30C8",
  "\u30A2\u30AF\u30BB\u30F3\u30C8",
  "\u53D7\u3051\u5165\u308C\u308B",
  "\u30A2\u30AF\u30BB\u30B9",
  "\u300C\u30A2\u30AF\u30BB\u30B5\u30EA\u30FC\u300D",
  "accessorize",
  "\u79F0\u8CDB",
  "\u300C\u9806\u5FDC\u300D",
  "\u300C\u9806\u5FDC\u300D",
  "\u300C\u9806\u5FDC\u300D",
  "\u53CE\u5BB9",
  "\u540C\u884C",
  "\u9054\u6210",
  "\u30A2\u30B3\u30FC\u30C9",
  "accost",
  "\u30A2\u30AB\u30A6\u30F3\u30C8",
  "accouter",
  "accoutre",
  "\u300C\u30AF\u30EC\u30B8\u30C3\u30C8\u300D",
  "\u300C\u767A\u751F\u3059\u308B\u300D",
  "\u300C\u6587\u5316\u5909\u5BB9\u300D",
  "\u300C\u84C4\u7A4D\u3059\u308B\u300D",
  "\u300C\u975E\u96E3\u300D",
  "\u300C\u6163\u308C\u308B\u300D",
  "\u30A8\u30FC\u30B9",
  "\u75DB\u307F",
  "\u6210\u3057\u9042\u3052\u308B",
  "\u300C\u9178\u6027\u5316\u300D",
  "\u8A8D\u3081\u307E\u3059",
  "\u300C\u77E5\u4EBA\u300D",
  "\u300C\u9ED9\u8A8D\u300D",
  "\u53D6\u5F97",
  "\u300C\u7121\u7F6A\u300D",
  "\u884C\u70BA",
  "\u30A2\u30AF\u30B7\u30E7\u30F3",
  "\u6D3B\u6027\u5316",
  "\u300C\u5B9F\u969B\u300D",
  "\u300C\u5B9F\u73FE\u300D",
  "\u300C\u4F5C\u52D5\u300D",
  "\u9069\u5FDC\u3059\u308B",
  "\u8FFD\u52A0",
  "addle",
  "\u4F4F\u6240",
  "adduce",
  "\u9075\u5B88\u3059\u308B",
  "\u300C\u96A3\u63A5\u300D",
  "\u300C\u5EF6\u671F\u300D",
  "\u300C\u88C1\u304D\u300D",
  "\u300C\u88C1\u5B9A\u300D",
  "adjure",
  "\u8ABF\u6574",
  "\u300C\u7BA1\u7406\u3059\u308B\u300D",
  "\u61A7\u308C",
  "\u8A8D\u3081\u308B",
  "\u300C\u5FE0\u544A\u300D",
  "\u63A1\u7528",
  "\u5D07\u62DD\u3057\u307E\u3059",
  "\u98FE\u308B",
  "\u300C\u5438\u7740\u300D",
  "\u300C\u7C97\u60AA\u54C1\u300D",
  "adumbrate",
  "\u524D\u9032",
  "\u30A2\u30C9\u30D0\u30F3\u30C6\u30FC\u30B8",
  "\u300C\u5BA3\u4F1D\u300D",
  "\u300C\u30A2\u30C9\u30D0\u30A4\u30B9\u300D",
  "\u63D0\u5531\u3059\u308B",
  "\u300C\u30A8\u30A2\u30EC\u30FC\u30C8\u300D",
  "\u5F71\u97FF",
  "\u300C\u30A2\u30D5\u30A3\u30EA\u30A8\u30A4\u30C8\u300D",
  "\u300C\u78BA\u8A8D\u3059\u308B\u300D",
  "\u63A5\u8F9E",
  "\u82E6\u3057\u3081\u308B",
  "\u4F59\u88D5\u3042\u308B",
  "\u300Cafforest\u300D",
  "\u4FAE\u8FB1",
  "\u5E74",
  "\u300C\u96C6\u584A\u300D",
  "\u300C\u60AA\u5316\u3055\u305B\u308B\u300D",
  "\u96C6\u8A08",
  "\u300C\u304B\u304D\u6DF7\u305C\u308B\u300D",
  "\u300C\u82E6\u60B6\u300D",
  "\u300C\u82E6\u60B6\u300D",
  "\u540C\u610F",
  "\u63F4\u52A9",
  "ail",
  "\u6A19\u7684",
  "\u7A7A\u6C17",
  "\u30A8\u30A2\u30D6\u30E9\u30B7",
  "\u300C\u30A8\u30A2\u30C9\u30ED\u30C3\u30D7\u300D",
  "\u822A\u7A7A\u8CA8\u7269",
  "\u300C\u30A8\u30A2\u30EA\u30D5\u30C8\u300D",
  "\u8B66\u5831",
  "\u300C\u30A2\u30E9\u30FC\u30C8\u300D",
  "\u300C\u758E\u5916\u300D",
  "\u300C\u964D\u308A\u308B\u300D",
  "\u6574\u5217",
  "\u548C\u3089\u3052\u308B"
];
const word$2 = {
  adjective: adjective$4,
  adverb: adverb$2,
  conjunction: conjunction$2,
  interjection: interjection$2,
  noun: noun$4,
  preposition: preposition$2,
  verb: verb$3
};
const department$2 = [
  "\u672C",
  "\u6620\u753B",
  "\u97F3\u697D",
  "\u30B2\u30FC\u30E0",
  "\u30A8\u30EC\u30AF\u30C8\u30ED\u30CB\u30AF\u30B9",
  "\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u30FC",
  "\u5BB6",
  "\u516C\u5712",
  "\u30C4\u30FC\u30EB",
  "\u8CB7\u3044\u7269",
  "\u5065\u5EB7",
  "\u7F8E\u3057\u3055",
  "\u304A\u3082\u3061\u3083",
  "\u30AD\u30C3\u30BA",
  "\u8D64\u3061\u3083\u3093",
  "\u8863\u985E",
  "\u9774",
  "\u30B8\u30E5\u30A8\u30EA\u30FC",
  "\u300C\u30B9\u30DD\u30FC\u30C4\u300D",
  "\u5C4B\u5916",
  "\u300C\u81EA\u52D5\u8ECA\u300D",
  "\u300C\u30A4\u30F3\u30C0\u30B9\u30C8\u30EA\u30A2\u30EB\u300D"
];
const product_description$2 = [
  "\u4EBA\u9593\u5DE5\u5B66\u306B\u57FA\u3065\u3044\u305F\u30A8\u30B0\u30BC\u30AF\u30C6\u30A3\u30D6\u30C1\u30A7\u30A2\u306F\u3001\u63A5\u7740\u3055\u308C\u305F\u9ED2\u9769\u3068PVC\u30D1\u30C3\u30C9\u5165\u308A\u306E\u30B7\u30FC\u30C8\u3068\u80CC\u3082\u305F\u308C\u3067\u88C5\u98FE\u3055\u308C\u3066\u304A\u308A\u3001\u4E00\u65E5\u4E2D\u5FEB\u9069\u3067\u30B5\u30DD\u30FC\u30C8\u3055\u308C\u307E\u3059\u3002",
  "\u81EA\u52D5\u8ECA\u306E\u30EC\u30A4\u30A2\u30A6\u30C8\u306F\u3001\u30A8\u30F3\u30B8\u30F3\u5F8C\u90E8\u306B\u30C8\u30E9\u30F3\u30B9\u30A2\u30AF\u30B9\u30EB\u30BF\u30A4\u30D7\u306E\u30C8\u30E9\u30F3\u30B9\u30DF\u30C3\u30B7\u30E7\u30F3\u304C\u53D6\u308A\u4ED8\u3051\u3089\u308C\u3001\u56DB\u8F2A\u99C6\u52D5\u306E\u30D5\u30ED\u30F3\u30C8\u30A8\u30F3\u30B8\u30F3\u30C7\u30B6\u30A4\u30F3\u3067\u69CB\u6210\u3055\u308C\u3066\u3044\u307E\u3059\u3002",
  "\u65B0\u3057\u3044ABC139370\u300113.3\u3001\u7B2C5\u4E16\u4EE3CoreA5-8250U\u30018 GB RAM\u3001256 GB SSD\u3001\u96FB\u6E90UHD\u30B0\u30E9\u30D5\u30A3\u30C3\u30AF\u30B9\u3001OS 10\u30DB\u30FC\u30E0\u3001OS Office A\uFF06J 2016",
  "Dev Byte\u306E\u30B9\u30EA\u30E0\u3067\u30B7\u30F3\u30D7\u30EB\u306AMaple\u30B2\u30FC\u30DF\u30F3\u30B0\u30AD\u30FC\u30DC\u30FC\u30C9\u306B\u306F\u3001\u6D17\u7DF4\u3055\u308C\u305F\u30DC\u30C7\u30A3\u3068\u30B9\u30DE\u30FC\u30C8\u306A\u6A5F\u80FD\u3092\u5B9F\u73FE\u3059\u308B7\u8272RGBLED\u30D0\u30C3\u30AF\u30E9\u30A4\u30C8\u304C\u4ED8\u5C5E\u3057\u3066\u3044\u307E\u3059\u3002",
  "Apollotech B340\u306F\u3001\u4FE1\u983C\u6027\u306E\u9AD8\u3044\u63A5\u7D9A\u300112\u304B\u6708\u306E\u30D0\u30C3\u30C6\u30EA\u30FC\u5BFF\u547D\u3001\u30E2\u30C0\u30F3\u306A\u30C7\u30B6\u30A4\u30F3\u3092\u5099\u3048\u305F\u624B\u9803\u306A\u4FA1\u683C\u306E\u30EF\u30A4\u30E4\u30EC\u30B9\u30DE\u30A6\u30B9\u3067\u3059\u3002",
  "\u9577\u5D0E\u30E9\u30F3\u30C0\u30FC\u306F\u30011984\u5E74\u306EABC800J\u304B\u3089\u59CB\u307E\u3063\u305F\u9577\u5D0E\u30B9\u30DD\u30FC\u30C4\u30D0\u30A4\u30AF\u306E\u3044\u304F\u3064\u304B\u306E\u30B7\u30EA\u30FC\u30BA\u306E\u5546\u6A19\u540D\u3067\u3059\u3002",
  "\u30B5\u30C3\u30AB\u30FC\u306F\u30C8\u30EC\u30FC\u30CB\u30F3\u30B0\u3084\u30EC\u30AF\u30EA\u30A8\u30FC\u30B7\u30E7\u30F3\u306E\u76EE\u7684\u306B\u9069\u3057\u3066\u3044\u307E\u3059",
  "\u30AB\u30FC\u30DC\u30CA\u30A4\u30C8\u30A6\u30A7\u30D6\u30B4\u30FC\u30EB\u30AD\u30FC\u30D1\u30FC\u30B0\u30ED\u30FC\u30D6\u306F\u4EBA\u9593\u5DE5\u5B66\u7684\u306B\u8A2D\u8A08\u3055\u308C\u3066\u304A\u308A\u3001\u7C21\u5358\u306B\u30D5\u30A3\u30C3\u30C8\u3057\u307E\u3059",
  "\u30DC\u30B9\u30C8\u30F3\u306E\u6700\u5148\u7AEF\u306E\u30B3\u30F3\u30D7\u30EC\u30C3\u30B7\u30E7\u30F3\u30A6\u30A7\u30A2\u30C6\u30AF\u30CE\u30ED\u30B8\u30FC\u306F\u3001\u7B4B\u8089\u306E\u9178\u7D20\u5316\u3092\u4FC3\u9032\u3057\u3001\u6D3B\u52D5\u7684\u306A\u7B4B\u8089\u3092\u5B89\u5B9A\u3055\u305B\u307E\u3059",
  "\u65B0\u3057\u3044\u7BC4\u56F2\u306E\u30D5\u30A9\u30FC\u30DE\u30EB\u30B7\u30E3\u30C4\u306F\u3001\u3042\u306A\u305F\u3092\u5FF5\u982D\u306B\u7F6E\u3044\u3066\u8A2D\u8A08\u3055\u308C\u3066\u3044\u307E\u3059\u3002 \u3042\u306A\u305F\u3092\u969B\u7ACB\u305F\u305B\u308B\u30D5\u30A3\u30C3\u30C8\u611F\u3068\u30B9\u30BF\u30A4\u30EA\u30F3\u30B0\u3067",
  "\u5929\u7136\u6210\u5206\u306E\u30A8\u30AD\u30B5\u30A4\u30C6\u30A3\u30F3\u30B0\u306A\u30DF\u30C3\u30AF\u30B9\u3092\u6301\u3063\u3066\u3044\u308B\u30A2\u30C3\u30D7\u30EB\u30CA\u30C1\u30E5\u30E9\u30EC\u306E\u7F8E\u3057\u3044\u7BC4\u56F2\u3002 100\uFF05\u5929\u7136\u6210\u5206\u306E\u826F\u3055\u3067",
  "\u30A2\u30F3\u30C7\u30A3\u306E\u9774\u306F\u3001\u8010\u4E45\u6027\u3060\u3051\u3067\u306A\u304F\u3001\u30C8\u30EC\u30F3\u30C9\u3001\u6700\u3082\u30B9\u30BF\u30A4\u30EA\u30C3\u30B7\u30E5\u306A\u9774\u3068\u30B5\u30F3\u30C0\u30EB\u306E\u7BC4\u56F2\u3092\u5FF5\u982D\u306B\u7F6E\u3044\u3066\u8A2D\u8A08\u3055\u308C\u3066\u3044\u307E\u3059"
];
const product_name$2 = {
  adjective: [
    "\u5C0F\u3055\u306A",
    "\u300C\u4EBA\u9593\u5DE5\u5B66\u7684\u300D",
    "\u300C\u96FB\u5B50\u300D",
    "\u300C\u7D20\u6734\u300D",
    "\u77E5\u7684",
    "\u7D20\u6575",
    "\u4FE1\u3058\u3089\u308C\u306A\u3044",
    "\u30A8\u30EC\u30AC\u30F3\u30C8",
    "\u7D20\u6674\u3089\u3057\u3044",
    "\u5B9F\u7528\u7684",
    "\u30E2\u30C0\u30F3",
    "\u300C\u30EA\u30B5\u30A4\u30AF\u30EB\u300D",
    "\u300C\u306A\u3081\u3089\u304B\u306A\u300D",
    "\u300C\u30AA\u30FC\u30C0\u30FC\u30E1\u30A4\u30C9\u300D",
    "\u7D20\u6674\u3089\u3057\u3044",
    "\u30B8\u30A7\u30CD\u30EA\u30C3\u30AF",
    "\u624B\u4F5C\u308A",
    "\u624B\u4F5C\u308A",
    "\u30AA\u30EA\u30A8\u30F3\u30BF\u30EB",
    "\u300C\u30E9\u30A4\u30BB\u30F3\u30B9\u300D",
    "\u8C6A\u83EF\u306A",
    "\u300C\u6D17\u7DF4\u3055\u308C\u305F\u300D",
    "\u300C\u30D6\u30E9\u30F3\u30C9\u306A\u3057\u300D",
    "\u7F8E\u5473\u3057\u3044"
  ],
  material: [
    "\u92FC",
    "\u30D6\u30ED\u30F3\u30BA",
    "\u6728\u88FD",
    "\u30B3\u30F3\u30AF\u30EA\u30FC\u30C8",
    "\u30D7\u30E9\u30B9\u30C1\u30C3\u30AF",
    "\u30B3\u30C3\u30C8\u30F3",
    "\u82B1\u5D17\u5CA9",
    "\u30B4\u30E0",
    "\u91D1\u5C5E",
    "\u67D4\u3089\u304B\u3044",
    "\u65B0\u9BAE",
    "\u51CD\u3063\u305F"
  ],
  product: [
    "\u6905\u5B50",
    "\u8ECA",
    "\u30B3\u30F3\u30D4\u30E5\u30FC\u30BF\u30FC",
    "\u30AD\u30FC\u30DC\u30FC\u30C9",
    "\u306D\u305A\u307F",
    "\u81EA\u8EE2\u8ECA",
    "\u30DC\u30FC\u30EB",
    "\u624B\u888B",
    "\u300C\u30D1\u30F3\u30C4\u300D",
    "\u30B7\u30E3\u30C4",
    "\u30C6\u30FC\u30D6\u30EB",
    "\u9774",
    "\u5E3D\u5B50",
    "\u300C\u30BF\u30AA\u30EB\u300D",
    "\u77F3\u9E78",
    "\u30B7\u30FC\u30C1\u30AD\u30F3",
    "\u9D8F",
    "\u9B5A",
    "\u30C1\u30FC\u30BA",
    "\u30D9\u30FC\u30B3\u30F3",
    "\u30D4\u30B6",
    "\u30B5\u30E9\u30C0",
    "\u30BD\u30FC\u30BB\u30FC\u30B8",
    "\u300C\u30C1\u30C3\u30D7\u30B9\u300D"
  ]
};
const commerce$2 = {
  department: department$2,
  product_description: product_description$2,
  product_name: product_name$2
};
const ja = {
  title: "Japanese",
  address: address$2,
  cell_phone: cell_phone$1,
  lorem: lorem$1,
  name: name$2,
  phone_number: phone_number$2,
  word: word$2,
  commerce: commerce$2
};
const building_number$1 = ["#####", "####", "###", "##", "#"];
const city$1 = ["{{address.city_prefix}}{{address.city_suffix}}"];
const city_prefix$1 = [
  "\u957F",
  "\u4E0A",
  "\u5357",
  "\u897F",
  "\u5317",
  "\u8BF8",
  "\u5B81",
  "\u73E0",
  "\u6B66",
  "\u8861",
  "\u6210",
  "\u798F",
  "\u53A6",
  "\u8D35",
  "\u5409",
  "\u6D77",
  "\u592A",
  "\u6D4E",
  "\u5B89",
  "\u5409",
  "\u5305"
];
const city_suffix$1 = [
  "\u6C99\u5E02",
  "\u4EAC\u5E02",
  "\u5B81\u5E02",
  "\u5B89\u5E02",
  "\u4E61\u53BF",
  "\u6D77\u5E02",
  "\u7801\u5E02",
  "\u6C49\u5E02",
  "\u9633\u5E02",
  "\u90FD\u5E02",
  "\u5DDE\u5E02",
  "\u95E8\u5E02",
  "\u9633\u5E02",
  "\u53E3\u5E02",
  "\u539F\u5E02",
  "\u5357\u5E02",
  "\u5FBD\u5E02",
  "\u6797\u5E02",
  "\u5934\u5E02"
];
const default_country$1 = ["\u4E2D\u56FD"];
const postcode$1 = ["######"];
const state$1 = [
  "\u5317\u4EAC\u5E02",
  "\u4E0A\u6D77\u5E02",
  "\u5929\u6D25\u5E02",
  "\u91CD\u5E86\u5E02",
  "\u9ED1\u9F99\u6C5F\u7701",
  "\u5409\u6797\u7701",
  "\u8FBD\u5B81\u7701",
  "\u5185\u8499\u53E4",
  "\u6CB3\u5317\u7701",
  "\u65B0\u7586",
  "\u7518\u8083\u7701",
  "\u9752\u6D77\u7701",
  "\u9655\u897F\u7701",
  "\u5B81\u590F",
  "\u6CB3\u5357\u7701",
  "\u5C71\u4E1C\u7701",
  "\u5C71\u897F\u7701",
  "\u5B89\u5FBD\u7701",
  "\u6E56\u5317\u7701",
  "\u6E56\u5357\u7701",
  "\u6C5F\u82CF\u7701",
  "\u56DB\u5DDD\u7701",
  "\u8D35\u5DDE\u7701",
  "\u4E91\u5357\u7701",
  "\u5E7F\u897F\u7701",
  "\u897F\u85CF",
  "\u6D59\u6C5F\u7701",
  "\u6C5F\u897F\u7701",
  "\u5E7F\u4E1C\u7701",
  "\u798F\u5EFA\u7701",
  "\u53F0\u6E7E\u7701",
  "\u6D77\u5357\u7701",
  "\u9999\u6E2F",
  "\u6FB3\u95E8"
];
const state_abbr$1 = [
  "\u4EAC",
  "\u6CAA",
  "\u6D25",
  "\u6E1D",
  "\u9ED1",
  "\u5409",
  "\u8FBD",
  "\u8499",
  "\u5180",
  "\u65B0",
  "\u7518",
  "\u9752",
  "\u9655",
  "\u5B81",
  "\u8C6B",
  "\u9C81",
  "\u664B",
  "\u7696",
  "\u9102",
  "\u6E58",
  "\u82CF",
  "\u5DDD",
  "\u9ED4",
  "\u6EC7",
  "\u6842",
  "\u85CF",
  "\u6D59",
  "\u8D63",
  "\u7CA4",
  "\u95FD",
  "\u53F0",
  "\u743C",
  "\u6E2F",
  "\u6FB3"
];
const street$1 = ["{{name.last_name}}{{address.street_suffix}}"];
const street_address$1 = {
  normal: "{{address.street}}{{address.buildingNumber}}\u53F7",
  full: "{{address.street}}{{address.buildingNumber}}\u53F7 {{address.secondaryAddress}}"
};
const street_suffix$1 = ["\u5DF7", "\u8857", "\u8DEF", "\u6865", "\u4FAC", "\u65C1", "\u4E2D\u5FC3", "\u680B"];
const address$1 = {
  building_number: building_number$1,
  city: city$1,
  city_prefix: city_prefix$1,
  city_suffix: city_suffix$1,
  default_country: default_country$1,
  postcode: postcode$1,
  state: state$1,
  state_abbr: state_abbr$1,
  street: street$1,
  street_address: street_address$1,
  street_suffix: street_suffix$1
};
const first_name$1 = [
  "\u7ECD\u9F50",
  "\u535A\u6587",
  "\u6893\u6668",
  "\u80E4\u7965",
  "\u745E\u9716",
  "\u660E\u54F2",
  "\u5929\u7FCA",
  "\u51EF\u745E",
  "\u5065\u96C4",
  "\u8000\u6770",
  "\u6F47\u7136",
  "\u5B50\u6DB5",
  "\u8D8A\u5F6C",
  "\u94B0\u8F69",
  "\u667A\u8F89",
  "\u81F4\u8FDC",
  "\u4FCA\u9A70",
  "\u96E8\u6CFD",
  "\u70E8\u78CA",
  "\u665F\u777F",
  "\u6587\u660A",
  "\u4FEE\u6D01",
  "\u9ECE\u6615",
  "\u8FDC\u822A",
  "\u65ED\u5C27",
  "\u9E3F\u6D9B",
  "\u4F1F\u797A",
  "\u8363\u8F69",
  "\u8D8A\u6CFD",
  "\u6D69\u5B87",
  "\u747E\u745C",
  "\u7693\u8F69",
  "\u64CE\u82CD",
  "\u64CE\u5B87",
  "\u5FD7\u6CFD",
  "\u5B50\u8F69",
  "\u777F\u6E0A",
  "\u5F18\u6587",
  "\u54F2\u701A",
  "\u96E8\u6CFD",
  "\u6977\u745E",
  "\u5EFA\u8F89",
  "\u664B\u9E4F",
  "\u5929\u78CA",
  "\u7ECD\u8F89",
  "\u6CFD\u6D0B",
  "\u946B\u78CA",
  "\u9E4F\u714A",
  "\u660A\u5F3A",
  "\u4F1F\u5BB8",
  "\u535A\u8D85",
  "\u541B\u6D69",
  "\u5B50\u9A9E",
  "\u9E4F\u6D9B",
  "\u708E\u5F6C",
  "\u9E64\u8F69",
  "\u8D8A\u5F6C",
  "\u98CE\u534E",
  "\u9756\u742A",
  "\u660E\u8F89",
  "\u4F1F\u8BDA",
  "\u660E\u8F69",
  "\u5065\u67CF",
  "\u4FEE\u6770",
  "\u5FD7\u6CFD",
  "\u5F18\u6587",
  "\u5CFB\u7199",
  "\u5609\u61FF",
  "\u715C\u57CE",
  "\u61FF\u8F69",
  "\u70E8\u4F1F",
  "\u82D1\u535A",
  "\u4F1F\u6CFD",
  "\u71A0\u5F64",
  "\u9E3F\u714A",
  "\u535A\u6D9B",
  "\u70E8\u9716",
  "\u70E8\u534E",
  "\u715C\u797A",
  "\u667A\u5BB8",
  "\u6B63\u8C6A",
  "\u660A\u7136",
  "\u660E\u6770",
  "\u7ACB\u8BDA",
  "\u7ACB\u8F69",
  "\u7ACB\u8F89",
  "\u5CFB\u7199",
  "\u5F18\u6587",
  "\u71A0\u5F64",
  "\u9E3F\u714A",
  "\u70E8\u9716",
  "\u54F2\u701A",
  "\u946B\u9E4F",
  "\u660A\u5929",
  "\u601D\u806A",
  "\u5C55\u9E4F",
  "\u7B11\u611A",
  "\u5FD7\u5F3A",
  "\u70AB\u660E",
  "\u96EA\u677E",
  "\u601D\u6E90",
  "\u667A\u6E0A",
  "\u601D\u6DFC",
  "\u6653\u5578",
  "\u5929\u5B87",
  "\u6D69\u7136",
  "\u6587\u8F69",
  "\u9E6D\u6D0B",
  "\u632F\u5BB6",
  "\u4E50\u9A79",
  "\u6653\u535A",
  "\u6587\u535A",
  "\u660A\u7131",
  "\u7ACB\u679C",
  "\u91D1\u946B",
  "\u9526\u7A0B",
  "\u5609\u7199",
  "\u9E4F\u98DE",
  "\u5B50\u9ED8",
  "\u601D\u8FDC",
  "\u6D69\u8F69",
  "\u8BED\u5802",
  "\u806A\u5065",
  "\u660E",
  "\u6587",
  "\u679C",
  "\u601D",
  "\u9E4F",
  "\u9A70",
  "\u6D9B",
  "\u742A",
  "\u6D69",
  "\u822A",
  "\u5F6C"
];
const last_name$1 = [
  "\u738B",
  "\u674E",
  "\u5F20",
  "\u5218",
  "\u9648",
  "\u6768",
  "\u9EC4",
  "\u5434",
  "\u8D75",
  "\u5468",
  "\u5F90",
  "\u5B59",
  "\u9A6C",
  "\u6731",
  "\u80E1",
  "\u6797",
  "\u90ED",
  "\u4F55",
  "\u9AD8",
  "\u7F57",
  "\u90D1",
  "\u6881",
  "\u8C22",
  "\u5B8B",
  "\u5510",
  "\u8BB8",
  "\u9093",
  "\u51AF",
  "\u97E9",
  "\u66F9",
  "\u66FE",
  "\u5F6D",
  "\u8427",
  "\u8521",
  "\u6F58",
  "\u7530",
  "\u8463",
  "\u8881",
  "\u4E8E",
  "\u4F59",
  "\u53F6",
  "\u848B",
  "\u675C",
  "\u82CF",
  "\u9B4F",
  "\u7A0B",
  "\u5415",
  "\u4E01",
  "\u6C88",
  "\u4EFB",
  "\u59DA",
  "\u5362",
  "\u5085",
  "\u949F",
  "\u59DC",
  "\u5D14",
  "\u8C2D",
  "\u5ED6",
  "\u8303",
  "\u6C6A",
  "\u9646",
  "\u91D1",
  "\u77F3",
  "\u6234",
  "\u8D3E",
  "\u97E6",
  "\u590F",
  "\u90B1",
  "\u65B9",
  "\u4FAF",
  "\u90B9",
  "\u718A",
  "\u5B5F",
  "\u79E6",
  "\u767D",
  "\u6C5F",
  "\u960E",
  "\u859B",
  "\u5C39",
  "\u6BB5",
  "\u96F7",
  "\u9ECE",
  "\u53F2",
  "\u9F99",
  "\u9676",
  "\u8D3A",
  "\u987E",
  "\u6BDB",
  "\u90DD",
  "\u9F9A",
  "\u90B5",
  "\u4E07",
  "\u94B1",
  "\u4E25",
  "\u8D56",
  "\u8983",
  "\u6D2A",
  "\u6B66",
  "\u83AB",
  "\u5B54",
  "\u6B27\u9633",
  "\u6155\u5BB9",
  "\u53F8\u9A6C",
  "\u4EE4\u72D0",
  "\u4EF2\u5B59",
  "\u949F\u79BB",
  "\u957F\u5B59",
  "\u5B87\u6587",
  "\u53F8\u5F92",
  "\u9C9C\u4E8E",
  "\u53F8\u7A7A"
];
const title$1 = {
  descriptor: [
    "\u5E26\u9886",
    "\u9AD8\u7EA7\u7684",
    "\u76F4\u63A5\u7684",
    "\u516C\u53F8\u7684",
    "\u52A8\u6001\u7684",
    "\u672A\u6765",
    "\u4EA7\u54C1",
    "\u56FD\u5BB6\u7684",
    "\u533A\u57DF",
    "\u533A",
    "\u4E2D\u592E",
    "\u5168\u7403\u7684",
    "\u987E\u5BA2",
    "\u6295\u8D44\u8005",
    "\u52A8\u6001\u7684",
    "\u56FD\u9645\u7684",
    "\u9057\u4EA7",
    "\u5411\u524D",
    "\u5185\u90E8\u7684",
    "\u4EBA\u7C7B",
    "\u9996\u5E2D",
    "\u4E3B\u8981\u7684"
  ],
  level: [
    "\u89E3\u51B3\u65B9\u6848",
    "\u7A0B\u5E8F",
    "\u724C",
    "\u5B89\u5168",
    "\u7814\u7A76",
    "\u8425\u9500",
    "\u6307\u4EE4",
    "\u6267\u884C",
    "\u4E00\u4F53\u5316",
    "\u529F\u80FD\u6027",
    "\u56DE\u590D",
    "\u8303\u4F8B",
    "\u7B56\u7565",
    "\u8EAB\u4EFD",
    "\u5E02\u573A",
    "\u56E2\u4F53",
    "\u5206\u914D",
    "\u5E94\u7528\u7A0B\u5E8F",
    "\u4F18\u5316",
    "\u64CD\u4F5C",
    "\u57FA\u7840\u8BBE\u65BD",
    "\u5185\u8054\u7F51",
    "\u901A\u8BAF",
    "\u7F51\u7EDC",
    "\u54C1\u724C",
    "\u8D28\u91CF",
    "\u4FDD\u8BC1",
    "\u6D41\u52A8\u6027",
    "\u5E10\u6237",
    "\u6570\u636E",
    "\u6709\u521B\u9020\u529B\u7684",
    "\u914D\u7F6E",
    "\u95EE\u8D23\u5236",
    "\u4E92\u52A8",
    "\u56E0\u7D20",
    "\u53EF\u7528\u6027",
    "\u5EA6\u91CF\u6807\u51C6"
  ],
  job: [
    "\u5BFC\u5E08",
    "\u8054\u7CFB",
    "\u7BA1\u7406\u4EBA\u5458",
    "\u8054\u7EDC",
    "\u5B98",
    "\u7ECF\u7406",
    "\u5DE5\u7A0B\u5E08",
    "\u4E13\u5BB6",
    "\u5BFC\u5411\u5668",
    "\u534F\u8C03\u5458",
    "\u884C\u653F\u4EBA\u5458",
    "\u5EFA\u7B51\u5E08",
    "\u5206\u6790\u5E08",
    "\u8BBE\u8BA1\u5E08",
    "\u89C4\u5212\u5E08",
    "\u534F\u8C03\u5458",
    "\u6280\u672F\u5458",
    "\u5F00\u53D1\u5546",
    "\u5236\u4F5C\u4EBA",
    "\u987E\u95EE",
    "\u52A9\u624B",
    "\u5F15\u5BFC\u8005",
    "\u4EE3\u7406\u4EBA",
    "\u4EE3\u8868",
    "\u6218\u7565\u5BB6"
  ]
};
const name$1 = {
  female_first_name: last_name$1,
  first_name: last_name$1,
  last_name: first_name$1,
  male_first_name: last_name$1,
  title: title$1,
  binary_gender: [],
  female_middle_name: [],
  male_middle_name: [],
  middle_name: [],
  gender: [],
  prefix: [],
  suffix: [],
  name: []
};
const formats$2 = ["0##-########", "0###-########", "1##########"];
const phone_number$1 = {
  formats: formats$2
};
const department$1 = [
  "\u4E66\u7C4D",
  "\u7535\u5F71",
  "\u97F3\u4E50",
  "\u6E38\u620F",
  "\u7535\u5B50\u4EA7\u54C1",
  "\u7535\u8111",
  "\u5BB6",
  "\u82B1\u56ED",
  "\u5DE5\u5177",
  "\u6742\u8D27\u5E97",
  "\u5065\u5EB7",
  "\u7F8E\u597D\u7684\u4E8B",
  "\u73A9\u5177",
  "\u5C0F\u5B69",
  "\u5357\u6D77"
];
const product_description$1 = [
  "\u4ECE\u539F\u6750\u6599\u5230\u52A0\u5DE5\u54C1\uFF0C\u4E3A\u60A8\u63D0\u4F9B\u4E00\u5207\u98DF\u54C1\u3002 \u53CC\u65E5\u98DF\u54C1\u7ECF\u8425\u98DF\u6750\u8303\u56F4\u5E7F\u6CDB\uFF0C\u65E2\u6709\u7802\u7CD6\u3001\u9762\u7C89\u7B49\u539F\u6750\u6599\uFF0C\u4E5F\u6709\u5373\u4E70\u5373\u5403\u7684\u52A0\u5DE5. \u98DF\u54C1",
  "\u56FE\u602A\u517D\u4F5C\u56FE\u795E\u5668,\u63D0\u4F9B3056\u5F20\u514D\u8D39\u5546\u54C1\u4ECB\u7ECD\u56FE\u7247,\u5546\u54C1\u4ECB\u7ECD\u6A21\u677F\u8BBE\u8BA1,\u5546\u54C1\u4ECB\u7ECD\u80CC\u666F\u7D20\u6750\u4E0B\u8F7D,\u4F9B\u4F60\u8FDB\u884C\u5728\u7EBF\u56FE\u7247\u8BBE\u8BA1\u5236\u4F5C\u3002",
  "\u53BB\u54EA\u513F\u8D2D\u4E70\u5546\u54C1\u4ECB\u7ECD\u5C55\u793A\u724C\uFF1F\u5F53\u7136\u6765\u6DD8\u5B9D\u6D77\u5916\uFF0C\u6DD8\u5B9D\u5F53\u524D\u6709167\u4EF6\u5546\u54C1\u4ECB\u7ECD\u5C55\u793A\u724C\u76F8\u5173\u7684\u5546\u54C1\u5728\u552E\u3002",
  "\u4EAC\u4E1CJD.COM\u7535\u8111\u6574\u673A,\u4E13\u4E1A\u63D0\u4F9B\u7535\u8111-\u7B14\u8BB0\u672C_\u6E38\u620F\u672C_\u8D85\u6781\u672C_\u53F0\u5F0F\u673A_\u4E00\u4F53\u673A_\u670D\u52A1\u5668_\u5DE5\u4F5C\u7AD9_\u5E73\u677F\u7535\u8111\u7684\u6700\u65B0\u62A5\u4EF7\u3001\u4FC3\u9500\u3001\u8BC4\u8BBA\u3001\u5BFC\u8D2D\u3001\u56FE\u7247\u7B49\u76F8\u5173\u4FE1\u606F!\u4E3A\u60A8\u63D0\u4F9B\u6109\u60A6\u7684\u7F51\u4E0A\u8D2D\u7269 ",
  " \u592A\u5E73\u6D0B\u7535\u8111\u7F51\u63D0\u4F9B\u7B14\u8BB0\u672C\u7535\u8111\u5927\u5168\u5168\u9762\u670D\u52A1\u4FE1\u606F\uFF0C\u5305\u542B\u7B14\u8BB0\u672C\u7535\u8111\u62A5\u4EF7\u3001\u53C2\u6570\u3001\u8BC4\u6D4B\u3001\u6BD4\u8F83\u3001\u70B9\u8BC4\u3001\u8BBA\u575B\u7B49\uFF0C\u5E2E\u60A8\u5168\u9762\u4E86\u89E3\u7B14\u8BB0\u672C\u7535\u8111\u3002",
  "ZOL\u624B\u673A\u7248\u4E3A\u60A8\u63D0\u4F9B\u7B14\u8BB0\u672C\u7535\u8111\u4FE1\u606F,\u5305\u62EC\u7B14\u8BB0\u672C\u7535\u8111\u62A5\u4EF7,\u7B14\u8BB0\u672C\u7535\u8111\u53C2\u6570,\u7B14\u8BB0\u672C\u7535\u8111\u8BC4\u6D4B,\u7B14\u8BB0\u672C\u7535\u8111\u56FE\u7247,\u7B14\u8BB0\u672C\u7535\u8111\u70B9\u8BC4\u7B49\u8BE6\u7EC6\u5185\u5BB9,\u4E3A\u60A8\u8D2D\u4E70\u7B14\u8BB0\u672C\u7535\u8111\u63D0\u4F9B\u6700\u6709\u4EF7\u503C\u7684"
];
const product_name$1 = {
  adjective: [
    "\u5C0F\u7684",
    "\u4EBA\u4F53\u5DE5\u7A0B\u5B66",
    "\u7535\u5B50",
    "Rustic",
    "\u4E61\u6751",
    "\u534E\u4E3D\u7684",
    "\u96BE\u4EE5\u7F6E\u4FE1\u7684"
  ],
  material: ["\u575A\u5F3A\u7684", "\u9752\u94DC\u8272", "\u6728\u5236\u7684", "\u6DF7\u51DD\u571F", "\u5851\u6599", "\u68C9\u5236\u7684"],
  product: [
    "\u6905\u5B50",
    "\u8F66\u5B50",
    "\u7535\u8111",
    "\u952E\u76D8",
    "\u9F20\u6807",
    "\u81EA\u884C\u8F66",
    "\u68D2\u7403",
    "\u91D1\u5B50",
    "\u889C\u5B50",
    "\u8868\u683C",
    "\u978B\u5B50",
    "\u5E3D\u5B50"
  ]
};
const commerce$1 = {
  department: department$1,
  product_description: product_description$1,
  product_name: product_name$1
};
const month$1 = {
  wide: [
    "\u4E00\u6708",
    "\u4E8C\u6708",
    "\u4E09\u6708",
    "\u56DB\u6708",
    "\u4E94\u6708",
    "\u516D\u6708",
    "\u4E03\u6708",
    "\u516B\u6708",
    "\u4E5D\u6708",
    "\u5341\u6708",
    "\u5341\u4E00\u6708",
    "\u5341\u4E8C\u6708"
  ],
  wide_context: [
    "\u4E00\u6708",
    "\u4E8C\u6708",
    "\u4E09\u6708",
    "\u56DB\u6708",
    "\u4E94\u6708",
    "\u516D\u6708",
    "\u4E03\u6708",
    "\u516B\u6708",
    "\u4E5D\u6708",
    "\u5341\u6708",
    "\u5341\u4E00\u6708",
    "\u5341\u4E8C\u6708"
  ]
};
const weekday$1 = {
  wide: ["\u661F\u671F\u5929", "\u661F\u671F\u4E00", "\u661F\u671F\u4E8C", "\u661F\u671F\u4E09", "\u661F\u671F\u4E09", "\u661F\u671F\u4E94", "\u661F\u671F\u516D"],
  wide_context: [
    "\u661F\u671F\u5929",
    "\u661F\u671F\u4E00",
    "\u661F\u671F\u4E8C",
    "\u661F\u671F\u4E09",
    "\u661F\u671F\u4E09",
    "\u661F\u671F\u4E94",
    "\u661F\u671F\u516D"
  ]
};
const date$1 = {
  month: month$1,
  weekday: weekday$1
};
const adjective$3 = [
  "\u5F03",
  "\u6709\u80FD\u529B\u7684",
  "\u7EDD\u5BF9",
  "\u53EF\u7231",
  "\u5192\u9669",
  "\u5B66\u672F\u7684",
  "\u53EF\u63A5\u53D7\u7684",
  "\u597D\u8BC4",
  "\u5B8C\u6210",
  "\u51C6\u786E\u7684",
  "\u75BC\u75DB",
  "\u9178\u6027",
  "\u6742\u6280",
  "\u79EF\u6781\u7684",
  "\u5B9E\u9645\u7684",
  "\u719F\u7EC3",
  "\u4EE4\u4EBA\u94A6\u4F69",
  "\u94A6\u4F69",
  "\u9752\u5C11\u5E74",
  "\u53EF\u7231",
  "\u5D07\u62DC",
  "\u5148\u8FDB\u7684",
  "\u5BB3\u6015",
  "\u4EB2\u70ED",
  "\u8001",
  "\u52A0\u91CD",
  "\u6311\u8845\u7684",
  "\u654F\u6377",
  "\u6FC0\u52A8",
  "\u82E6\u607C",
  "\u5408\u9002\u7684",
  "\u534A\u5F00",
  "\u60CA\u614C",
  "\u8B66\u62A5",
  "\u8B66\u62A5",
  "\u5F02\u5316",
  "\u6D3B",
  "\u5168\u90E8",
  "\u5229\u4ED6",
  "\u60CA\u4EBA",
  "\u96C4\u5FC3\u52C3\u52C3",
  "\u5145\u8DB3",
  "\u9017\u4E50",
  "\u6709\u8DA3",
  "\u951A\u5B9A",
  "\u53E4\u8001\u7684",
  "\u5929\u4F7F",
  "\u751F\u6C14\u7684",
  "\u82E6\u607C",
  "\u52A8\u753B",
  "\u5E74\u5EA6\u7684",
  "\u5176\u4ED6",
  "\u53E4\u8463",
  "\u7126\u8651\u7684",
  "\u4EFB\u4F55",
  "\u5FE7\u8651",
  "\u5408\u9002\u7684",
  "\u6613\u4E8E",
  "\u5317\u6781",
  "\u5E72\u65F1",
  "\u82B3\u9999",
  "\u827A\u672F\u7684",
  "\u7F9E\u6127",
  "\u4FDD\u8BC1",
  "\u60CA\u4EBA",
  "\u8FD0\u52A8",
  "\u968F\u9644\u7684",
  "\u7EC6\u5FC3",
  "\u5438\u5F15\u4EBA\u7684",
  "\u4E25\u8083",
  "\u771F\u6B63\u7684",
  "\u6388\u6743",
  "\u81EA\u52A8\u7684",
  "\u8D2A\u5A6A",
  "\u5E73\u5747",
  "\u77E5\u9053\u7684",
  "\u60CA\u4EBA\u7684",
  "\u53EF\u6015",
  "\u5C34\u5C2C\u7684",
  "\u5E7C\u7A1A",
  "\u574F\u7684",
  "\u80CC\u90E8",
  "\u5BBD\u677E",
  "\u88F8",
  "\u8352\u829C",
  "\u57FA\u672C\u7684",
  "\u7F8E\u4E3D\u7684",
  "\u8FDF\u6765\u7684",
  "\u5FC3\u7231",
  "\u6709\u5229",
  "\u66F4\u597D\u7684",
  "\u6700\u597D\u7684",
  "\u7740\u8FF7",
  "\u5927\u7684",
  "\u5FC3\u80F8\u5BBD\u5E7F",
  "\u53EF\u751F\u7269\u964D\u89E3",
  "\u4E00\u53E3\u5927\u5C0F",
  "\u82E6\u7684",
  "\u9ED1\u8272\u7684"
];
const adverb$1 = [
  "\u5F02\u5E38",
  "\u5FC3\u4E0D\u5728\u7109",
  "\u5076\u7136",
  "\u9178",
  "\u5B9E\u9645\u4E0A",
  "\u5192\u9669",
  "\u7136\u540E",
  "\u51E0\u4E4E",
  "\u603B\u662F",
  "\u6124\u6012\u5730",
  "\u6BCF\u5E74",
  "\u7126\u6025",
  "\u50B2\u6162",
  "\u5C34\u5C2C",
  "\u7CDF\u7CD5",
  "\u5BB3\u7F9E",
  "\u7F8E\u4E3D",
  "\u82E6\u6DA9",
  "\u9EEF\u6DE1",
  "\u76F2\u76EE\u5730",
  "\u5E78\u798F\u5730",
  "\u5938\u5938\u5176\u8C08",
  "\u5927\u80C6",
  "\u52C7\u6562\u5730",
  "\u7B80\u8981\u5730",
  "\u660E\u4EAE\u5730",
  "\u8F7B\u5FEB",
  "\u5BBD\u5E7F\u5730",
  "\u5FD9",
  "\u51B7\u9759",
  "\u5C0F\u5FC3",
  "\u4E0D\u5C0F\u5FC3",
  "\u8C28\u614E",
  "\u5F53\u7136",
  "\u6109\u5FEB\u5730",
  "\u6E05\u695A\u5730",
  "\u806A\u660E",
  "\u5BC6\u5207",
  "\u54C4\u7740",
  "\u4E94\u989C\u516D\u8272",
  "\u901A\u5E38",
  "\u4E0D\u65AD\u5730",
  "\u51B7\u9759",
  "\u6B63\u786E",
  "\u52C7\u6562\u5730",
  "\u4EA4\u53C9",
  "\u6B8B\u9177",
  "\u597D\u5947\u5730",
  "\u65E5\u5E38\u7684",
  "\u7CBE\u81F4",
  "\u4EB2\u7231\u7684",
  "\u6B3A\u9A97",
  "\u6DF1",
  "\u6311\u8845",
  "\u6545\u610F\u5730",
  "\u6109\u5FEB\u5730",
  "\u8BA4\u771F",
  "\u4F9D\u7A00",
  "\u6000\u7591",
  "\u68A6\u5E7B",
  "\u5BB9\u6613\u5730",
  "\u4F18\u96C5",
  "\u7CBE\u529B\u5145\u6C9B",
  "\u6781\u5927\u5730",
  "\u8E0A\u8DC3",
  "\u4E00\u6837",
  "\u5C24\u5176",
  "\u751A\u81F3",
  "\u5747\u5300",
  "\u6700\u7EC8",
  "\u786E\u5207\u5730",
  "\u5174\u594B\u5730",
  "\u6781\u5176",
  "\u76F8\u5F53",
  "\u5FE0\u5B9E",
  "\u8457\u540D",
  "\u8FDC\u7684",
  "\u5FEB\u901F\u5730",
  "\u81F4\u547D"
];
const conjunction$1 = [
  "\u540E",
  "\u6BD5\u7ADF",
  "\u867D\u7136",
  "\u548C",
  "\u4F5C\u4E3A",
  "\u56E0\u6B64",
  "\u4EFF\u4F5B",
  "\u53EA\u8981",
  "\u5C3D\u53EF\u80FD",
  "\u7ACB\u523B",
  "\u597D\u50CF",
  "\u56E0\u4E3A",
  "\u524D",
  "\u4F46",
  "\u6240\u4EE5",
  "\u751A\u81F3",
  "\u5373\u4F7F",
  "\u867D\u7136",
  "\u6700\u540E",
  "\u4E3A\u4E86",
  "\u4F8B\u5982",
  "\u6B64\u5916",
  "\u56E0\u6B64",
  "\u7136\u800C",
  "\u5982\u679C",
  "\u8981\u662F",
  "\u5982\u679C\u90A3\u4E48",
  "\u5982\u679C\u4EC0\u4E48\u65F6\u5019",
  "\u6B64\u5916",
  "\u5B9E\u9645\u4E0A",
  "\u4E3A\u4E86\u4F7F",
  "\u56E0\u4E3A",
  "\u987A\u4FBF",
  "\u7684\u786E",
  "\u53CD\u800C",
  "\u6B63\u5982",
  "\u514D\u5F97",
  "\u540C\u6837\u5730",
  "\u540C\u65F6",
  "\u4E5F\u4E0D",
  "\u73B0\u5728",
  "\u4ECE\u73B0\u5728\u5F00\u59CB",
  "\u73B0\u5728",
  "\u73B0\u5728\uFF0C\u5F53",
  "\u4E00\u6B21",
  "\u6216\u8005",
  "\u5047\u5982",
  "\u524D\u63D0\u662F",
  "\u800C\u4E0D\u662F",
  "\u81EA\u4ECE",
  "\u6240\u4EE5",
  "\u4EE5\u4FBF",
  "\u5047\u5982",
  "\u90A3",
  "\u5C3D\u7BA1",
  "\u76F4\u5230",
  "\u6BCF\u5F53",
  "\u7136\u800C",
  "\u65E0\u8BBA\u5728\u54EA\u91CC",
  "\u54EA\u4E2A",
  "\u8C01",
  "\u7136\u800C"
];
const interjection$1 = [
  "\u5478",
  "\u54E6",
  "\u7B28\u86CB",
  "\u5E9F\u8BDD",
  "\u5618",
  "\u54C7",
  "\u7EA6\u624E",
  "\u5618",
  "\u5618",
  "\u50BB\u74DC",
  "\u5929\u54EA",
  "\u5657",
  "\u5443",
  "\u554A",
  "\u767E\u80DC",
  "brr",
  "\u55EF",
  "\u96C5\u864E",
  "\u554A\u54C8",
  "\u545C\u545C",
  "\u5FB7\u62C9\u7279",
  "\u560E",
  "\u55EF",
  "psst",
  "\u554A",
  "\u554A",
  "\u4F0A\u76AE",
  "\u54CE\u5440",
  "\u54CE\u5440",
  "\u5478",
  "gadzooks",
  "\u5443",
  "\u54C8",
  "\u55EF",
  "\u5567\u5567",
  "\u54CE\u54DF",
  "\u547C",
  "\u786E\u8BA4",
  "\u55EF",
  "\u5929\u54EA",
  "\u54FC",
  "\u9C7C",
  "\u4F50\u4F0A",
  "\u5443",
  "\u574F",
  "\u94B1\u5E01",
  "\u55EF"
];
const noun$3 = [
  "\u81EA\u52A8\u53D6\u6B3E\u673A",
  "\u5149\u76D8",
  "\u8D8A\u91CE\u8F66",
  "\u7535\u89C6",
  "\u571F\u8C5A",
  "\u7B97\u76D8",
  "\u4FEE\u9053\u9662",
  "\u7F29\u5199",
  "\u8179\u90E8",
  "\u80FD\u529B",
  "\u7D0A\u4E71 etc",
  "\u5E9F\u9664",
  "\u6D41\u4EA7",
  "\u5E9F\u9664",
  "\u7F3A\u5E2D",
  "\u4E30\u5BCC",
  "\u8650\u5F85",
  "\u5B66\u8005",
  "\u5B66\u9662",
  "\u4FC3\u8FDB\u5242",
  "\u52A0\u901F\u5668",
  "\u53E3\u97F3",
  "\u9A8C\u6536",
  "\u4F7F\u7528\u6743",
  "\u914D\u9970",
  "\u4E8B\u6545",
  "\u4F4F\u5BBF",
  "\u4F34\u594F\u8005",
  "\u6210\u5C31",
  "\u7B26\u5408",
  "\u6309\u7167",
  "\u624B\u98CE\u7434",
  "\u5E10\u6237",
  "\u95EE\u8D23\u5236",
  "\u4F1A\u8BA1",
  "\u4F1A\u8BA1",
  "\u51C6\u786E\u6027",
  "\u6307\u63A7",
  "\u918B\u9178\u76D0",
  "\u6210\u5C31",
  "\u6210\u5C31\u8005",
  "\u9178",
  "\u627F\u8BA4",
  "\u6A61\u5B50",
  "\u58F0\u5B66",
  "\u719F\u4EBA",
  "\u83B7\u5F97",
  "\u82F1\u4EA9",
  "\u4E19\u70EF\u9178\u7EA4\u7EF4",
  "\u884C\u4E3A",
  "\u884C\u52A8",
  "\u6FC0\u6D3B",
  "\u6D3B\u52A8\u5BB6",
  "\u6D3B\u52A8",
  "\u6F14\u5458",
  "\u6F14\u5458",
  "\u9488\u523A",
  "\u5E7F\u544A",
  "\u9002\u5E94",
  "\u9002\u914D\u5668",
  "\u763E",
  "\u6DFB\u52A0",
  "\u5730\u5740",
  "\u5F62\u5BB9\u8BCD",
  "\u8C03\u6574",
  "\u884C\u653F",
  "\u884C\u653F",
  "\u884C\u653F\u4EBA\u5458",
  "\u94A6\u4F69",
  "\u5F55\u53D6",
  "\u571F\u576F",
  "\u91C7\u7528",
  "\u80BE\u4E0A\u817A\u7D20",
  "\u80BE\u4E0A\u817A\u7D20",
  "\u6210\u4EBA",
  "\u6210\u5E74",
  "\u8FDB\u6B65",
  "\u8FDB\u6B65",
  "\u4F18\u52BF"
];
const preposition$1 = [
  "\u4E00\u4E2A",
  "\u540E\u9762",
  "\u8239\u4E0A",
  "\u5173\u4E8E",
  "\u4EE5\u4E0A",
  "\u7F3A\u5E2D\u7684",
  "\u7A7F\u8FC7",
  "\u4E4B\u524D",
  "\u540E",
  "\u53CD\u5BF9",
  "\u6CBF\u7740",
  "\u65C1\u8FB9",
  "\u4E4B\u4E2D",
  "\u4E2D\u95F4",
  "\u4E4B\u4E2D",
  "\u5176\u4E2D",
  "\u4E00\u4E2A",
  "\u5B89\u5B81",
  "\u53CD\u5BF9",
  "\u6070\u5982\u5176\u5206",
  "\u963F\u666E\u5FB7",
  "\u5927\u7EA6",
  "\u4F5C\u4E3A",
  "\u5728\u65C1\u8FB9",
  "\u8DE8\u8D8A",
  "\u5728",
  "\u53CD\u5BF9",
  "\u5728\u9876\u4E0A",
  "\u7981\u6B62",
  "\u524D",
  "\u5728\u540E\u9762",
  "\u4EE5\u4E0B",
  "\u4E0B\u9762",
  "\u65C1",
  "\u9664\u4E86",
  "\u4E4B\u95F4",
  "\u8D85\u8FC7",
  "\u4F46",
  "\u7ECF\u8FC7",
  "\u5927\u7EA6",
  "\u5173\u4E8E",
  "\u8003\u8651",
  "\u5C3D\u7BA1",
  "\u4E0B",
  "\u671F\u95F4",
  "\u9664\u4E86",
  "\u4F8B\u5916",
  "\u6392\u9664",
  "\u5931\u8D25",
  "\u4E0B\u5217\u7684",
  "\u4E3A\u4E86",
  "\u524D\u950B",
  "\u4ECE",
  "\u7ED9\u5B9A",
  "\u5728",
  "\u5305\u542B",
  "\u91CC\u9762",
  "\u8FDB\u5165",
  "\u514D\u5F97",
  "\u559C\u6B22",
  "\u4E2D",
  "\u4E2D\u95F4",
  "\u51CF",
  "\u6A21",
  "\u9760\u8FD1",
  "\u4E0B\u4E00\u4E2A",
  "\u867D\u7136",
  "\u7684",
  "\u79BB\u5F00",
  "\u4E0A",
  "\u5230",
  "\u5BF9\u9762\u7684",
  "\u51FA\u53BB",
  "\u5916\u90E8",
  "\u8D85\u8FC7",
  "\u6B65\u4F10",
  "\u8FC7\u53BB\u7684",
  "\u6BCF",
  "\u52A0",
  "\u4EB2",
  "qua",
  "\u5173\u4E8E",
  "\u5706\u5F62\u7684",
  "\u65E0",
  "\u8282\u7701",
  "\u81EA\u4ECE",
  "\u6BD4",
  "\u8FD9",
  "\u901A\u8FC7",
  "\u59CB\u7EC8",
  "\u76F4\u5230",
  "\u300A\u65F6\u4EE3\u300B",
  "\u81F3",
  "\u671D\u5411",
  "\u5411",
  "\u5728\u4E0B\u9762",
  "\u4E0B",
  "\u4E0D\u540C",
  "\u76F4\u5230",
  "\u5230",
  "\u5411\u4E0A",
  "\u4E4B\u4E0A",
  "\u76F8\u5BF9",
  "\u901A\u8FC7",
  "\u526F",
  "\u548C",
  "\u5185",
  "\u6CA1\u6709",
  "\u503C\u5F97"
];
const verb$2 = [
  "\u653E\u5F03",
  "\u5351\u9119",
  "\u51CF\u8F7B",
  "\u7F29\u5199",
  "\u653E\u5F03",
  "\u62D0",
  "\u52A9\u957F",
  "\u75DB\u6068",
  "\u9075\u5B88",
  "\u5F03\u7EDD",
  "\u820D\u5F03",
  "\u5E9F\u9664",
  "\u9119\u5F03",
  "\u4E2D\u6B62",
  "\u76DB\u4EA7",
  "\u7814\u78E8",
  "\u5220\u8282",
  "\u5E9F\u9664",
  "\u6F5C\u9003",
  "\u7EF3\u7D22",
  "\u7F3A\u5E2D\u7684",
  "\u5F00\u8131",
  "\u5438\u6536",
  "\u5F03\u6743",
  "\u62BD\u8C61\u7684",
  "\u8650\u5F85",
  "\u90BB\u63A5",
  "\u540C\u610F",
  "\u52A0\u901F",
  "\u53E3\u97F3",
  "\u5F3A\u8C03",
  "\u63A5\u53D7",
  "\u4F7F\u7528\u6743",
  "\u914D\u9970",
  "\u914D\u9970",
  "\u6B22\u547C",
  "\u9002\u5E94",
  "\u9002\u5E94",
  "\u9002\u5E94",
  "\u5BB9\u7EB3",
  "\u966A\u4F34",
  "\u5B8C\u6210",
  "\u7B26\u5408",
  "\u62DB\u547C",
  "\u5E10\u6237",
  "\u7535\u8111",
  "\u793C\u8282",
  "\u8BA4\u53EF",
  "\u7D2F\u79EF",
  "\u9002\u5E94",
  "\u79EF\u7D2F",
  "\u6307\u63A7",
  "\u4E60\u60EF",
  "\u9AD8\u624B",
  "\u75BC\u75DB",
  "\u8FBE\u5230",
  "\u9178\u5316",
  "\u627F\u8BA4",
  "\u76F8\u8BC6",
  "\u9ED8\u8BB8",
  "\u83B7\u5F97",
  "\u5F00\u91CA",
  "\u884C\u4E3A",
  "\u884C\u52A8",
  "\u542F\u7528",
  "\u5B9E\u73B0",
  "\u5B9E\u73B0",
  "\u542F\u52A8",
  "\u9002\u5E94",
  "\u6DFB\u52A0",
  "\u52A0",
  "\u5730\u5740",
  "\u5F15\u7528",
  "\u575A\u6301",
  "\u6BD7",
  "\u4F11\u4F1A",
  "\u5BA3\u5224",
  "\u88C1\u5B9A",
  "\u88C1\u51B3",
  "\u8C03\u6574",
  "\u7BA1\u7406",
  "\u94A6\u4F69",
  "\u627F\u8BA4",
  "\u8C0F",
  "\u91C7\u7EB3",
  "\u5D07\u62DC",
  "\u88C5\u9970",
  "\u5438\u6536",
  "\u63BA\u6742",
  "\u9884\u793A",
  "\u8FDB\u6B65",
  "\u4F18\u52BF",
  "\u5E7F\u544A",
  "\u5EFA\u8BAE",
  "\u63D0\u5021",
  "\u901A\u6C14",
  "\u5F71\u54CD",
  "\u9644\u5C5E",
  "\u786E\u8BA4"
];
const word$1 = {
  adjective: adjective$3,
  adverb: adverb$1,
  conjunction: conjunction$1,
  interjection: interjection$1,
  noun: noun$3,
  preposition: preposition$1,
  verb: verb$2
};
const zh_CN = {
  title: "Chinese",
  address: address$1,
  name: name$1,
  phone_number: phone_number$1,
  commerce: commerce$1,
  date: date$1,
  word: word$1
};
const building_number = ["#####", "####", "###"];
const city = [
  "{{address.city_prefix}} {{name.first_name}}{{address.city_suffix}}",
  "{{address.city_prefix}} {{name.first_name}}",
  "{{name.first_name}}{{address.city_suffix}}",
  "{{name.last_name}}{{address.city_suffix}}",
  "{{address.city_name}}"
];
const city_name = [
  "Abilene",
  "Akron",
  "Alafaya",
  "Alameda",
  "Albany",
  "Albany",
  "Albany",
  "Albuquerque",
  "Alexandria",
  "Alexandria",
  "Alhambra",
  "Aliso Viejo",
  "Allen",
  "Allentown",
  "Aloha",
  "Alpharetta",
  "Altadena",
  "Altamonte Springs",
  "Altoona",
  "Amarillo",
  "Ames",
  "Anaheim",
  "Anchorage",
  "Anderson",
  "Ankeny",
  "Ann Arbor",
  "Annandale",
  "Antelope",
  "Antioch",
  "Apex",
  "Apopka",
  "Apple Valley",
  "Apple Valley",
  "Appleton",
  "Arcadia",
  "Arden-Arcade",
  "Arecibo",
  "Arlington",
  "Arlington",
  "Arlington",
  "Arlington Heights",
  "Arvada",
  "Ashburn",
  "Asheville",
  "Aspen Hill",
  "Atascocita",
  "Athens-Clarke County",
  "Atlanta",
  "Attleboro",
  "Auburn",
  "Auburn",
  "Augusta-Richmond County",
  "Aurora",
  "Aurora",
  "Austin",
  "Avondale",
  "Azusa",
  "Bakersfield",
  "Baldwin Park",
  "Baltimore",
  "Barnstable Town",
  "Bartlett",
  "Bartlett",
  "Baton Rouge",
  "Battle Creek",
  "Bayamon",
  "Bayonne",
  "Baytown",
  "Beaumont",
  "Beaumont",
  "Beavercreek",
  "Beaverton",
  "Bedford",
  "Bel Air South",
  "Bell Gardens",
  "Belleville",
  "Bellevue",
  "Bellevue",
  "Bellflower",
  "Bellingham",
  "Bend",
  "Bentonville",
  "Berkeley",
  "Berwyn",
  "Bethesda",
  "Bethlehem",
  "Billings",
  "Biloxi",
  "Binghamton",
  "Birmingham",
  "Bismarck",
  "Blacksburg",
  "Blaine",
  "Bloomington",
  "Bloomington",
  "Bloomington",
  "Blue Springs",
  "Boca Raton",
  "Boise City",
  "Bolingbrook",
  "Bonita Springs",
  "Bossier City",
  "Boston",
  "Bothell",
  "Boulder",
  "Bountiful",
  "Bowie",
  "Bowling Green",
  "Boynton Beach",
  "Bozeman",
  "Bradenton",
  "Brandon",
  "Brentwood",
  "Brentwood",
  "Bridgeport",
  "Bristol",
  "Brockton",
  "Broken Arrow",
  "Brookhaven",
  "Brookline",
  "Brooklyn Park",
  "Broomfield",
  "Brownsville",
  "Bryan",
  "Buckeye",
  "Buena Park",
  "Buffalo",
  "Buffalo Grove",
  "Burbank",
  "Burien",
  "Burke",
  "Burleson",
  "Burlington",
  "Burlington",
  "Burnsville",
  "Caguas",
  "Caldwell",
  "Camarillo",
  "Cambridge",
  "Camden",
  "Canton",
  "Cape Coral",
  "Carlsbad",
  "Carmel",
  "Carmichael",
  "Carolina",
  "Carrollton",
  "Carson",
  "Carson City",
  "Cary",
  "Casa Grande",
  "Casas Adobes",
  "Casper",
  "Castle Rock",
  "Castro Valley",
  "Catalina Foothills",
  "Cathedral City",
  "Catonsville",
  "Cedar Hill",
  "Cedar Park",
  "Cedar Rapids",
  "Centennial",
  "Centreville",
  "Ceres",
  "Cerritos",
  "Champaign",
  "Chandler",
  "Chapel Hill",
  "Charleston",
  "Charleston",
  "Charlotte",
  "Charlottesville",
  "Chattanooga",
  "Cheektowaga",
  "Chesapeake",
  "Chesterfield",
  "Cheyenne",
  "Chicago",
  "Chico",
  "Chicopee",
  "Chino",
  "Chino Hills",
  "Chula Vista",
  "Cicero",
  "Cincinnati",
  "Citrus Heights",
  "Clarksville",
  "Clearwater",
  "Cleveland",
  "Cleveland",
  "Cleveland Heights",
  "Clifton",
  "Clovis",
  "Coachella",
  "Coconut Creek",
  "Coeur d'Alene",
  "College Station",
  "Collierville",
  "Colorado Springs",
  "Colton",
  "Columbia",
  "Columbia",
  "Columbia",
  "Columbus",
  "Columbus",
  "Columbus",
  "Commerce City",
  "Compton",
  "Concord",
  "Concord",
  "Concord",
  "Conroe",
  "Conway",
  "Coon Rapids",
  "Coral Gables",
  "Coral Springs",
  "Corona",
  "Corpus Christi",
  "Corvallis",
  "Costa Mesa",
  "Council Bluffs",
  "Country Club",
  "Covina",
  "Cranston",
  "Cupertino",
  "Cutler Bay",
  "Cuyahoga Falls",
  "Cypress",
  "Dale City",
  "Dallas",
  "Daly City",
  "Danbury",
  "Danville",
  "Danville",
  "Davenport",
  "Davie",
  "Davis",
  "Dayton",
  "Daytona Beach",
  "DeKalb",
  "DeSoto",
  "Dearborn",
  "Dearborn Heights",
  "Decatur",
  "Decatur",
  "Deerfield Beach",
  "Delano",
  "Delray Beach",
  "Deltona",
  "Denton",
  "Denver",
  "Des Moines",
  "Des Plaines",
  "Detroit",
  "Diamond Bar",
  "Doral",
  "Dothan",
  "Downers Grove",
  "Downey",
  "Draper",
  "Dublin",
  "Dublin",
  "Dubuque",
  "Duluth",
  "Dundalk",
  "Dunwoody",
  "Durham",
  "Eagan",
  "East Hartford",
  "East Honolulu",
  "East Lansing",
  "East Los Angeles",
  "East Orange",
  "East Providence",
  "Eastvale",
  "Eau Claire",
  "Eden Prairie",
  "Edina",
  "Edinburg",
  "Edmond",
  "El Cajon",
  "El Centro",
  "El Dorado Hills",
  "El Monte",
  "El Paso",
  "Elgin",
  "Elizabeth",
  "Elk Grove",
  "Elkhart",
  "Ellicott City",
  "Elmhurst",
  "Elyria",
  "Encinitas",
  "Enid",
  "Enterprise",
  "Erie",
  "Escondido",
  "Euclid",
  "Eugene",
  "Euless",
  "Evanston",
  "Evansville",
  "Everett",
  "Everett",
  "Fairfield",
  "Fairfield",
  "Fall River",
  "Fargo",
  "Farmington",
  "Farmington Hills",
  "Fayetteville",
  "Fayetteville",
  "Federal Way",
  "Findlay",
  "Fishers",
  "Flagstaff",
  "Flint",
  "Florence-Graham",
  "Florin",
  "Florissant",
  "Flower Mound",
  "Folsom",
  "Fond du Lac",
  "Fontana",
  "Fort Collins",
  "Fort Lauderdale",
  "Fort Myers",
  "Fort Pierce",
  "Fort Smith",
  "Fort Wayne",
  "Fort Worth",
  "Fountain Valley",
  "Fountainebleau",
  "Framingham",
  "Franklin",
  "Frederick",
  "Freeport",
  "Fremont",
  "Fresno",
  "Frisco",
  "Fullerton",
  "Gainesville",
  "Gaithersburg",
  "Galveston",
  "Garden Grove",
  "Gardena",
  "Garland",
  "Gary",
  "Gastonia",
  "Georgetown",
  "Germantown",
  "Gilbert",
  "Gilroy",
  "Glen Burnie",
  "Glendale",
  "Glendale",
  "Glendora",
  "Glenview",
  "Goodyear",
  "Grand Forks",
  "Grand Island",
  "Grand Junction",
  "Grand Prairie",
  "Grand Rapids",
  "Grapevine",
  "Great Falls",
  "Greeley",
  "Green Bay",
  "Greensboro",
  "Greenville",
  "Greenville",
  "Greenwood",
  "Gresham",
  "Guaynabo",
  "Gulfport",
  "Hacienda Heights",
  "Hackensack",
  "Haltom City",
  "Hamilton",
  "Hammond",
  "Hampton",
  "Hanford",
  "Harlingen",
  "Harrisburg",
  "Harrisonburg",
  "Hartford",
  "Hattiesburg",
  "Haverhill",
  "Hawthorne",
  "Hayward",
  "Hemet",
  "Hempstead",
  "Henderson",
  "Hendersonville",
  "Hesperia",
  "Hialeah",
  "Hicksville",
  "High Point",
  "Highland",
  "Highlands Ranch",
  "Hillsboro",
  "Hilo",
  "Hoboken",
  "Hoffman Estates",
  "Hollywood",
  "Homestead",
  "Honolulu",
  "Hoover",
  "Houston",
  "Huntersville",
  "Huntington",
  "Huntington Beach",
  "Huntington Park",
  "Huntsville",
  "Hutchinson",
  "Idaho Falls",
  "Independence",
  "Indianapolis",
  "Indio",
  "Inglewood",
  "Iowa City",
  "Irondequoit",
  "Irvine",
  "Irving",
  "Jackson",
  "Jackson",
  "Jacksonville",
  "Jacksonville",
  "Janesville",
  "Jefferson City",
  "Jeffersonville",
  "Jersey City",
  "Johns Creek",
  "Johnson City",
  "Joliet",
  "Jonesboro",
  "Joplin",
  "Jupiter",
  "Jurupa Valley",
  "Kalamazoo",
  "Kannapolis",
  "Kansas City",
  "Kansas City",
  "Kearny",
  "Keller",
  "Kendale Lakes",
  "Kendall",
  "Kenner",
  "Kennewick",
  "Kenosha",
  "Kent",
  "Kentwood",
  "Kettering",
  "Killeen",
  "Kingsport",
  "Kirkland",
  "Kissimmee",
  "Knoxville",
  "Kokomo",
  "La Crosse",
  "La Habra",
  "La Mesa",
  "La Mirada",
  "Lacey",
  "Lafayette",
  "Lafayette",
  "Laguna Niguel",
  "Lake Charles",
  "Lake Elsinore",
  "Lake Forest",
  "Lake Havasu City",
  "Lake Ridge",
  "Lakeland",
  "Lakeville",
  "Lakewood",
  "Lakewood",
  "Lakewood",
  "Lakewood",
  "Lakewood",
  "Lancaster",
  "Lancaster",
  "Lansing",
  "Laredo",
  "Largo",
  "Las Cruces",
  "Las Vegas",
  "Lauderhill",
  "Lawrence",
  "Lawrence",
  "Lawrence",
  "Lawton",
  "Layton",
  "League City",
  "Lee's Summit",
  "Leesburg",
  "Lehi",
  "Lehigh Acres",
  "Lenexa",
  "Levittown",
  "Levittown",
  "Lewisville",
  "Lexington-Fayette",
  "Lincoln",
  "Lincoln",
  "Linden",
  "Little Rock",
  "Littleton",
  "Livermore",
  "Livonia",
  "Lodi",
  "Logan",
  "Lombard",
  "Lompoc",
  "Long Beach",
  "Longmont",
  "Longview",
  "Lorain",
  "Los Angeles",
  "Louisville/Jefferson County",
  "Loveland",
  "Lowell",
  "Lubbock",
  "Lynchburg",
  "Lynn",
  "Lynwood",
  "Macon-Bibb County",
  "Madera",
  "Madison",
  "Madison",
  "Malden",
  "Manchester",
  "Manhattan",
  "Mansfield",
  "Mansfield",
  "Manteca",
  "Maple Grove",
  "Margate",
  "Maricopa",
  "Marietta",
  "Marysville",
  "Mayaguez",
  "McAllen",
  "McKinney",
  "McLean",
  "Medford",
  "Medford",
  "Melbourne",
  "Memphis",
  "Menifee",
  "Mentor",
  "Merced",
  "Meriden",
  "Meridian",
  "Mesa",
  "Mesquite",
  "Metairie",
  "Methuen Town",
  "Miami",
  "Miami Beach",
  "Miami Gardens",
  "Middletown",
  "Middletown",
  "Midland",
  "Midland",
  "Midwest City",
  "Milford",
  "Millcreek",
  "Milpitas",
  "Milwaukee",
  "Minneapolis",
  "Minnetonka",
  "Minot",
  "Miramar",
  "Mishawaka",
  "Mission",
  "Mission Viejo",
  "Missoula",
  "Missouri City",
  "Mobile",
  "Modesto",
  "Moline",
  "Monroe",
  "Montebello",
  "Monterey Park",
  "Montgomery",
  "Moore",
  "Moreno Valley",
  "Morgan Hill",
  "Mount Pleasant",
  "Mount Prospect",
  "Mount Vernon",
  "Mountain View",
  "Muncie",
  "Murfreesboro",
  "Murray",
  "Murrieta",
  "Nampa",
  "Napa",
  "Naperville",
  "Nashua",
  "Nashville-Davidson",
  "National City",
  "New Bedford",
  "New Braunfels",
  "New Britain",
  "New Brunswick",
  "New Haven",
  "New Orleans",
  "New Rochelle",
  "New York",
  "Newark",
  "Newark",
  "Newark",
  "Newport Beach",
  "Newport News",
  "Newton",
  "Niagara Falls",
  "Noblesville",
  "Norfolk",
  "Normal",
  "Norman",
  "North Bethesda",
  "North Charleston",
  "North Highlands",
  "North Las Vegas",
  "North Lauderdale",
  "North Little Rock",
  "North Miami",
  "North Miami Beach",
  "North Port",
  "North Richland Hills",
  "Norwalk",
  "Norwalk",
  "Novato",
  "Novi",
  "O'Fallon",
  "Oak Lawn",
  "Oak Park",
  "Oakland",
  "Oakland Park",
  "Ocala",
  "Oceanside",
  "Odessa",
  "Ogden",
  "Oklahoma City",
  "Olathe",
  "Olympia",
  "Omaha",
  "Ontario",
  "Orange",
  "Orem",
  "Orland Park",
  "Orlando",
  "Oro Valley",
  "Oshkosh",
  "Overland Park",
  "Owensboro",
  "Oxnard",
  "Palatine",
  "Palm Bay",
  "Palm Beach Gardens",
  "Palm Coast",
  "Palm Desert",
  "Palm Harbor",
  "Palm Springs",
  "Palmdale",
  "Palo Alto",
  "Paradise",
  "Paramount",
  "Parker",
  "Parma",
  "Pasadena",
  "Pasadena",
  "Pasco",
  "Passaic",
  "Paterson",
  "Pawtucket",
  "Peabody",
  "Pearl City",
  "Pearland",
  "Pembroke Pines",
  "Pensacola",
  "Peoria",
  "Peoria",
  "Perris",
  "Perth Amboy",
  "Petaluma",
  "Pflugerville",
  "Pharr",
  "Philadelphia",
  "Phoenix",
  "Pico Rivera",
  "Pine Bluff",
  "Pine Hills",
  "Pinellas Park",
  "Pittsburg",
  "Pittsburgh",
  "Pittsfield",
  "Placentia",
  "Plainfield",
  "Plainfield",
  "Plano",
  "Plantation",
  "Pleasanton",
  "Plymouth",
  "Pocatello",
  "Poinciana",
  "Pomona",
  "Pompano Beach",
  "Ponce",
  "Pontiac",
  "Port Arthur",
  "Port Charlotte",
  "Port Orange",
  "Port St. Lucie",
  "Portage",
  "Porterville",
  "Portland",
  "Portland",
  "Portsmouth",
  "Potomac",
  "Poway",
  "Providence",
  "Provo",
  "Pueblo",
  "Quincy",
  "Racine",
  "Raleigh",
  "Rancho Cordova",
  "Rancho Cucamonga",
  "Rancho Palos Verdes",
  "Rancho Santa Margarita",
  "Rapid City",
  "Reading",
  "Redding",
  "Redlands",
  "Redmond",
  "Redondo Beach",
  "Redwood City",
  "Reno",
  "Renton",
  "Reston",
  "Revere",
  "Rialto",
  "Richardson",
  "Richland",
  "Richmond",
  "Richmond",
  "Rio Rancho",
  "Riverside",
  "Riverton",
  "Riverview",
  "Roanoke",
  "Rochester",
  "Rochester",
  "Rochester Hills",
  "Rock Hill",
  "Rockford",
  "Rocklin",
  "Rockville",
  "Rockwall",
  "Rocky Mount",
  "Rogers",
  "Rohnert Park",
  "Rosemead",
  "Roseville",
  "Roseville",
  "Roswell",
  "Roswell",
  "Round Rock",
  "Rowland Heights",
  "Rowlett",
  "Royal Oak",
  "Sacramento",
  "Saginaw",
  "Salem",
  "Salem",
  "Salina",
  "Salinas",
  "Salt Lake City",
  "Sammamish",
  "San Angelo",
  "San Antonio",
  "San Bernardino",
  "San Bruno",
  "San Buenaventura (Ventura)",
  "San Clemente",
  "San Diego",
  "San Francisco",
  "San Jacinto",
  "San Jose",
  "San Juan",
  "San Leandro",
  "San Luis Obispo",
  "San Marcos",
  "San Marcos",
  "San Mateo",
  "San Rafael",
  "San Ramon",
  "San Tan Valley",
  "Sandy",
  "Sandy Springs",
  "Sanford",
  "Santa Ana",
  "Santa Barbara",
  "Santa Clara",
  "Santa Clarita",
  "Santa Cruz",
  "Santa Fe",
  "Santa Maria",
  "Santa Monica",
  "Santa Rosa",
  "Santee",
  "Sarasota",
  "Savannah",
  "Sayreville",
  "Schaumburg",
  "Schenectady",
  "Scottsdale",
  "Scranton",
  "Seattle",
  "Severn",
  "Shawnee",
  "Sheboygan",
  "Shoreline",
  "Shreveport",
  "Sierra Vista",
  "Silver Spring",
  "Simi Valley",
  "Sioux City",
  "Sioux Falls",
  "Skokie",
  "Smyrna",
  "Smyrna",
  "Somerville",
  "South Bend",
  "South Gate",
  "South Hill",
  "South Jordan",
  "South San Francisco",
  "South Valley",
  "South Whittier",
  "Southaven",
  "Southfield",
  "Sparks",
  "Spokane",
  "Spokane Valley",
  "Spring",
  "Spring Hill",
  "Spring Valley",
  "Springdale",
  "Springfield",
  "Springfield",
  "Springfield",
  "Springfield",
  "Springfield",
  "St. Charles",
  "St. Clair Shores",
  "St. Cloud",
  "St. Cloud",
  "St. George",
  "St. Joseph",
  "St. Louis",
  "St. Louis Park",
  "St. Paul",
  "St. Peters",
  "St. Petersburg",
  "Stamford",
  "State College",
  "Sterling Heights",
  "Stillwater",
  "Stockton",
  "Stratford",
  "Strongsville",
  "Suffolk",
  "Sugar Land",
  "Summerville",
  "Sunnyvale",
  "Sunrise",
  "Sunrise Manor",
  "Surprise",
  "Syracuse",
  "Tacoma",
  "Tallahassee",
  "Tamarac",
  "Tamiami",
  "Tampa",
  "Taunton",
  "Taylor",
  "Taylorsville",
  "Temecula",
  "Tempe",
  "Temple",
  "Terre Haute",
  "Texas City",
  "The Hammocks",
  "The Villages",
  "The Woodlands",
  "Thornton",
  "Thousand Oaks",
  "Tigard",
  "Tinley Park",
  "Titusville",
  "Toledo",
  "Toms River",
  "Tonawanda",
  "Topeka",
  "Torrance",
  "Town 'n' Country",
  "Towson",
  "Tracy",
  "Trenton",
  "Troy",
  "Troy",
  "Trujillo Alto",
  "Tuckahoe",
  "Tucson",
  "Tulare",
  "Tulsa",
  "Turlock",
  "Tuscaloosa",
  "Tustin",
  "Twin Falls",
  "Tyler",
  "Union City",
  "Union City",
  "University",
  "Upland",
  "Urbana",
  "Urbandale",
  "Utica",
  "Vacaville",
  "Valdosta",
  "Vallejo",
  "Vancouver",
  "Victoria",
  "Victorville",
  "Vineland",
  "Virginia Beach",
  "Visalia",
  "Vista",
  "Waco",
  "Waipahu",
  "Waldorf",
  "Walnut Creek",
  "Waltham",
  "Warner Robins",
  "Warren",
  "Warwick",
  "Washington",
  "Waterbury",
  "Waterloo",
  "Watsonville",
  "Waukegan",
  "Waukesha",
  "Wauwatosa",
  "Wellington",
  "Wesley Chapel",
  "West Allis",
  "West Babylon",
  "West Covina",
  "West Des Moines",
  "West Hartford",
  "West Haven",
  "West Jordan",
  "West Lafayette",
  "West New York",
  "West Palm Beach",
  "West Sacramento",
  "West Seneca",
  "West Valley City",
  "Westfield",
  "Westland",
  "Westminster",
  "Westminster",
  "Weston",
  "Weymouth Town",
  "Wheaton",
  "Wheaton",
  "White Plains",
  "Whittier",
  "Wichita",
  "Wichita Falls",
  "Wilmington",
  "Wilmington",
  "Wilson",
  "Winston-Salem",
  "Woodbury",
  "Woodland",
  "Worcester",
  "Wylie",
  "Wyoming",
  "Yakima",
  "Yonkers",
  "Yorba Linda",
  "York",
  "Youngstown",
  "Yuba City",
  "Yucaipa",
  "Yuma"
];
const city_prefix = [
  "North",
  "East",
  "West",
  "South",
  "New",
  "Lake",
  "Port",
  "Fort"
];
const city_suffix = [
  "town",
  "ton",
  "land",
  "ville",
  "berg",
  "burgh",
  "boro",
  "borough",
  "bury",
  "view",
  "port",
  "mouth",
  "stad",
  "stead",
  "furt",
  "chester",
  "cester",
  "mouth",
  "fort",
  "field",
  "haven",
  "side",
  "shire",
  "worth"
];
const country = [
  "Afghanistan",
  "Albania",
  "Algeria",
  "American Samoa",
  "Andorra",
  "Angola",
  "Anguilla",
  "Antarctica (the territory South of 60 deg S)",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Aruba",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bermuda",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Bouvet Island (Bouvetoya)",
  "Brazil",
  "British Indian Ocean Territory (Chagos Archipelago)",
  "Brunei Darussalam",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Cayman Islands",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Christmas Island",
  "Cocos (Keeling) Islands",
  "Colombia",
  "Comoros",
  "Congo",
  "Cook Islands",
  "Costa Rica",
  "Cote d'Ivoire",
  "Croatia",
  "Cuba",
  "Cyprus",
  "Czech Republic",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Ethiopia",
  "Faroe Islands",
  "Falkland Islands (Malvinas)",
  "Fiji",
  "Finland",
  "France",
  "French Guiana",
  "French Polynesia",
  "French Southern Territories",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Gibraltar",
  "Greece",
  "Greenland",
  "Grenada",
  "Guadeloupe",
  "Guam",
  "Guatemala",
  "Guernsey",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Heard Island and McDonald Islands",
  "Holy See (Vatican City State)",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Isle of Man",
  "Israel",
  "Italy",
  "Jamaica",
  "Japan",
  "Jersey",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Democratic People's Republic of Korea",
  "Republic of Korea",
  "Kuwait",
  "Kyrgyz Republic",
  "Lao People's Democratic Republic",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libyan Arab Jamahiriya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macao",
  "Macedonia",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Martinique",
  "Mauritania",
  "Mauritius",
  "Mayotte",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Montserrat",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands Antilles",
  "Netherlands",
  "New Caledonia",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Niue",
  "Norfolk Island",
  "Northern Mariana Islands",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestinian Territory",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Pitcairn Islands",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Qatar",
  "Reunion",
  "Romania",
  "Russian Federation",
  "Rwanda",
  "Saint Barthelemy",
  "Saint Helena",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Martin",
  "Saint Pierre and Miquelon",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Sao Tome and Principe",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Slovakia (Slovak Republic)",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Georgia and the South Sandwich Islands",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Svalbard & Jan Mayen Islands",
  "Swaziland",
  "Sweden",
  "Switzerland",
  "Syrian Arab Republic",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tokelau",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Turks and Caicos Islands",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States of America",
  "United States Minor Outlying Islands",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Venezuela",
  "Vietnam",
  "Virgin Islands, British",
  "Virgin Islands, U.S.",
  "Wallis and Futuna",
  "Western Sahara",
  "Yemen",
  "Zambia",
  "Zimbabwe"
];
const country_code = [
  "AD",
  "AE",
  "AF",
  "AG",
  "AI",
  "AL",
  "AM",
  "AO",
  "AQ",
  "AR",
  "AS",
  "AT",
  "AU",
  "AW",
  "AX",
  "AZ",
  "BA",
  "BB",
  "BD",
  "BE",
  "BF",
  "BG",
  "BH",
  "BI",
  "BJ",
  "BL",
  "BM",
  "BN",
  "BO",
  "BQ",
  "BR",
  "BS",
  "BT",
  "BV",
  "BW",
  "BY",
  "BZ",
  "CA",
  "CC",
  "CD",
  "CF",
  "CG",
  "CH",
  "CI",
  "CK",
  "CL",
  "CM",
  "CN",
  "CO",
  "CR",
  "CU",
  "CV",
  "CW",
  "CX",
  "CY",
  "CZ",
  "DE",
  "DJ",
  "DK",
  "DM",
  "DO",
  "DZ",
  "EC",
  "EE",
  "EG",
  "EH",
  "ER",
  "ES",
  "ET",
  "FI",
  "FJ",
  "FK",
  "FM",
  "FO",
  "FR",
  "GA",
  "GB",
  "GD",
  "GE",
  "GF",
  "GG",
  "GH",
  "GI",
  "GL",
  "GM",
  "GN",
  "GP",
  "GQ",
  "GR",
  "GS",
  "GT",
  "GU",
  "GW",
  "GY",
  "HK",
  "HM",
  "HN",
  "HR",
  "HT",
  "HU",
  "ID",
  "IE",
  "IL",
  "IM",
  "IN",
  "IO",
  "IQ",
  "IR",
  "IS",
  "IT",
  "JE",
  "JM",
  "JO",
  "JP",
  "KE",
  "KG",
  "KH",
  "KI",
  "KM",
  "KN",
  "KP",
  "KR",
  "KW",
  "KY",
  "KZ",
  "LA",
  "LB",
  "LC",
  "LI",
  "LK",
  "LR",
  "LS",
  "LT",
  "LU",
  "LV",
  "LY",
  "MA",
  "MC",
  "MD",
  "ME",
  "MF",
  "MG",
  "MH",
  "MK",
  "ML",
  "MM",
  "MN",
  "MO",
  "MP",
  "MQ",
  "MR",
  "MS",
  "MT",
  "MU",
  "MV",
  "MW",
  "MX",
  "MY",
  "MZ",
  "NA",
  "NC",
  "NE",
  "NF",
  "NG",
  "NI",
  "NL",
  "NO",
  "NP",
  "NR",
  "NU",
  "NZ",
  "OM",
  "PA",
  "PE",
  "PF",
  "PG",
  "PH",
  "PK",
  "PL",
  "PM",
  "PN",
  "PR",
  "PS",
  "PT",
  "PW",
  "PY",
  "QA",
  "RE",
  "RO",
  "RS",
  "RU",
  "RW",
  "SA",
  "SB",
  "SC",
  "SD",
  "SE",
  "SG",
  "SH",
  "SI",
  "SJ",
  "SK",
  "SL",
  "SM",
  "SN",
  "SO",
  "SR",
  "SS",
  "ST",
  "SV",
  "SX",
  "SY",
  "SZ",
  "TC",
  "TD",
  "TF",
  "TG",
  "TH",
  "TJ",
  "TK",
  "TL",
  "TM",
  "TN",
  "TO",
  "TR",
  "TT",
  "TV",
  "TW",
  "TZ",
  "UA",
  "UG",
  "UM",
  "US",
  "UY",
  "UZ",
  "VA",
  "VC",
  "VE",
  "VG",
  "VI",
  "VN",
  "VU",
  "WF",
  "WS",
  "YE",
  "YT",
  "ZA",
  "ZM",
  "ZW"
];
const country_code_alpha_3 = [
  "BGD",
  "BEL",
  "BFA",
  "BGR",
  "BIH",
  "BRB",
  "WLF",
  "BLM",
  "BMU",
  "BRN",
  "BOL",
  "BHR",
  "BDI",
  "BEN",
  "BTN",
  "JAM",
  "BVT",
  "BWA",
  "WSM",
  "BES",
  "BRA",
  "BHS",
  "JEY",
  "BLR",
  "BLZ",
  "RUS",
  "RWA",
  "SRB",
  "TLS",
  "REU",
  "TKM",
  "TJK",
  "ROU",
  "TKL",
  "GNB",
  "GUM",
  "GTM",
  "SGS",
  "GRC",
  "GNQ",
  "GLP",
  "JPN",
  "GUY",
  "GGY",
  "GUF",
  "GEO",
  "GRD",
  "GBR",
  "GAB",
  "SLV",
  "GIN",
  "GMB",
  "GRL",
  "GIB",
  "GHA",
  "OMN",
  "TUN",
  "JOR",
  "HRV",
  "HTI",
  "HUN",
  "HKG",
  "HND",
  "HMD",
  "VEN",
  "PRI",
  "PSE",
  "PLW",
  "PRT",
  "SJM",
  "PRY",
  "IRQ",
  "PAN",
  "PYF",
  "PNG",
  "PER",
  "PAK",
  "PHL",
  "PCN",
  "POL",
  "SPM",
  "ZMB",
  "ESH",
  "EST",
  "EGY",
  "ZAF",
  "ECU",
  "ITA",
  "VNM",
  "SLB",
  "ETH",
  "SOM",
  "ZWE",
  "SAU",
  "ESP",
  "ERI",
  "MNE",
  "MDA",
  "MDG",
  "MAF",
  "MAR",
  "MCO",
  "UZB",
  "MMR",
  "MLI",
  "MAC",
  "MNG",
  "MHL",
  "MKD",
  "MUS",
  "MLT",
  "MWI",
  "MDV",
  "MTQ",
  "MNP",
  "MSR",
  "MRT",
  "IMN",
  "UGA",
  "TZA",
  "MYS",
  "MEX",
  "ISR",
  "FRA",
  "IOT",
  "SHN",
  "FIN",
  "FJI",
  "FLK",
  "FSM",
  "FRO",
  "NIC",
  "NLD",
  "NOR",
  "NAM",
  "VUT",
  "NCL",
  "NER",
  "NFK",
  "NGA",
  "NZL",
  "NPL",
  "NRU",
  "NIU",
  "COK",
  "XKX",
  "CIV",
  "CHE",
  "COL",
  "CHN",
  "CMR",
  "CHL",
  "CCK",
  "CAN",
  "COG",
  "CAF",
  "COD",
  "CZE",
  "CYP",
  "CXR",
  "CRI",
  "CUW",
  "CPV",
  "CUB",
  "SWZ",
  "SYR",
  "SXM",
  "KGZ",
  "KEN",
  "SSD",
  "SUR",
  "KIR",
  "KHM",
  "KNA",
  "COM",
  "STP",
  "SVK",
  "KOR",
  "SVN",
  "PRK",
  "KWT",
  "SEN",
  "SMR",
  "SLE",
  "SYC",
  "KAZ",
  "CYM",
  "SGP",
  "SWE",
  "SDN",
  "DOM",
  "DMA",
  "DJI",
  "DNK",
  "VGB",
  "DEU",
  "YEM",
  "DZA",
  "USA",
  "URY",
  "MYT",
  "UMI",
  "LBN",
  "LCA",
  "LAO",
  "TUV",
  "TWN",
  "TTO",
  "TUR",
  "LKA",
  "LIE",
  "LVA",
  "TON",
  "LTU",
  "LUX",
  "LBR",
  "LSO",
  "THA",
  "ATF",
  "TGO",
  "TCD",
  "TCA",
  "LBY",
  "VAT",
  "VCT",
  "ARE",
  "AND",
  "ATG",
  "AFG",
  "AIA",
  "VIR",
  "ISL",
  "IRN",
  "ARM",
  "ALB",
  "AGO",
  "ATA",
  "ASM",
  "ARG",
  "AUS",
  "AUT",
  "ABW",
  "IND",
  "ALA",
  "AZE",
  "IRL",
  "IDN",
  "UKR",
  "QAT",
  "MOZ"
];
const county = [
  "Avon",
  "Bedfordshire",
  "Berkshire",
  "Borders",
  "Buckinghamshire",
  "Cambridgeshire"
];
const default_country = ["United States of America"];
const direction = [
  "North",
  "East",
  "South",
  "West",
  "Northeast",
  "Northwest",
  "Southeast",
  "Southwest"
];
const direction_abbr = ["N", "E", "S", "W", "NE", "NW", "SE", "SW"];
const postcode = ["#####", "#####-####"];
const secondary_address = ["Apt. ###", "Suite ###"];
const state = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming"
];
const state_abbr = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY"
];
const street = [
  "{{name.first_name}} {{address.street_suffix}}",
  "{{name.last_name}} {{address.street_suffix}}"
];
const street_address = {
  normal: "{{address.buildingNumber}} {{address.street}}",
  full: "{{address.buildingNumber}} {{address.street}} {{address.secondaryAddress}}"
};
const street_suffix = [
  "Alley",
  "Avenue",
  "Branch",
  "Bridge",
  "Brook",
  "Brooks",
  "Burg",
  "Burgs",
  "Bypass",
  "Camp",
  "Canyon",
  "Cape",
  "Causeway",
  "Center",
  "Centers",
  "Circle",
  "Circles",
  "Cliff",
  "Cliffs",
  "Club",
  "Common",
  "Corner",
  "Corners",
  "Course",
  "Court",
  "Courts",
  "Cove",
  "Coves",
  "Creek",
  "Crescent",
  "Crest",
  "Crossing",
  "Crossroad",
  "Curve",
  "Dale",
  "Dam",
  "Divide",
  "Drive",
  "Drive",
  "Drives",
  "Estate",
  "Estates",
  "Expressway",
  "Extension",
  "Extensions",
  "Fall",
  "Falls",
  "Ferry",
  "Field",
  "Fields",
  "Flat",
  "Flats",
  "Ford",
  "Fords",
  "Forest",
  "Forge",
  "Forges",
  "Fork",
  "Forks",
  "Fort",
  "Freeway",
  "Garden",
  "Gardens",
  "Gateway",
  "Glen",
  "Glens",
  "Green",
  "Greens",
  "Grove",
  "Groves",
  "Harbor",
  "Harbors",
  "Haven",
  "Heights",
  "Highway",
  "Hill",
  "Hills",
  "Hollow",
  "Inlet",
  "Inlet",
  "Island",
  "Island",
  "Islands",
  "Islands",
  "Isle",
  "Isle",
  "Junction",
  "Junctions",
  "Key",
  "Keys",
  "Knoll",
  "Knolls",
  "Lake",
  "Lakes",
  "Land",
  "Landing",
  "Lane",
  "Light",
  "Lights",
  "Loaf",
  "Lock",
  "Locks",
  "Locks",
  "Lodge",
  "Lodge",
  "Loop",
  "Mall",
  "Manor",
  "Manors",
  "Meadow",
  "Meadows",
  "Mews",
  "Mill",
  "Mills",
  "Mission",
  "Mission",
  "Motorway",
  "Mount",
  "Mountain",
  "Mountain",
  "Mountains",
  "Mountains",
  "Neck",
  "Orchard",
  "Oval",
  "Overpass",
  "Park",
  "Parks",
  "Parkway",
  "Parkways",
  "Pass",
  "Passage",
  "Path",
  "Pike",
  "Pine",
  "Pines",
  "Place",
  "Plain",
  "Plains",
  "Plains",
  "Plaza",
  "Plaza",
  "Point",
  "Points",
  "Port",
  "Port",
  "Ports",
  "Ports",
  "Prairie",
  "Prairie",
  "Radial",
  "Ramp",
  "Ranch",
  "Rapid",
  "Rapids",
  "Rest",
  "Ridge",
  "Ridges",
  "River",
  "Road",
  "Road",
  "Roads",
  "Roads",
  "Route",
  "Row",
  "Rue",
  "Run",
  "Shoal",
  "Shoals",
  "Shore",
  "Shores",
  "Skyway",
  "Spring",
  "Springs",
  "Springs",
  "Spur",
  "Spurs",
  "Square",
  "Square",
  "Squares",
  "Squares",
  "Station",
  "Station",
  "Stravenue",
  "Stravenue",
  "Stream",
  "Stream",
  "Street",
  "Street",
  "Streets",
  "Summit",
  "Summit",
  "Terrace",
  "Throughway",
  "Trace",
  "Track",
  "Trafficway",
  "Trail",
  "Trail",
  "Tunnel",
  "Tunnel",
  "Turnpike",
  "Turnpike",
  "Underpass",
  "Union",
  "Unions",
  "Valley",
  "Valleys",
  "Via",
  "Viaduct",
  "View",
  "Views",
  "Village",
  "Village",
  "Villages",
  "Ville",
  "Vista",
  "Vista",
  "Walk",
  "Walks",
  "Wall",
  "Way",
  "Ways",
  "Well",
  "Wells"
];
const time_zone = [
  "Pacific/Midway",
  "Pacific/Pago_Pago",
  "Pacific/Honolulu",
  "America/Juneau",
  "America/Los_Angeles",
  "America/Tijuana",
  "America/Denver",
  "America/Phoenix",
  "America/Chihuahua",
  "America/Mazatlan",
  "America/Chicago",
  "America/Regina",
  "America/Mexico_City",
  "America/Mexico_City",
  "America/Monterrey",
  "America/Guatemala",
  "America/New_York",
  "America/Indiana/Indianapolis",
  "America/Bogota",
  "America/Lima",
  "America/Lima",
  "America/Halifax",
  "America/Caracas",
  "America/La_Paz",
  "America/Santiago",
  "America/St_Johns",
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "America/Guyana",
  "America/Godthab",
  "Atlantic/South_Georgia",
  "Atlantic/Azores",
  "Atlantic/Cape_Verde",
  "Europe/Dublin",
  "Europe/London",
  "Europe/Lisbon",
  "Europe/London",
  "Africa/Casablanca",
  "Africa/Monrovia",
  "Etc/UTC",
  "Europe/Belgrade",
  "Europe/Bratislava",
  "Europe/Budapest",
  "Europe/Ljubljana",
  "Europe/Prague",
  "Europe/Sarajevo",
  "Europe/Skopje",
  "Europe/Warsaw",
  "Europe/Zagreb",
  "Europe/Brussels",
  "Europe/Copenhagen",
  "Europe/Madrid",
  "Europe/Paris",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/Berlin",
  "Europe/Rome",
  "Europe/Stockholm",
  "Europe/Vienna",
  "Africa/Algiers",
  "Europe/Bucharest",
  "Africa/Cairo",
  "Europe/Helsinki",
  "Europe/Kiev",
  "Europe/Riga",
  "Europe/Sofia",
  "Europe/Tallinn",
  "Europe/Vilnius",
  "Europe/Athens",
  "Europe/Istanbul",
  "Europe/Minsk",
  "Asia/Jerusalem",
  "Africa/Harare",
  "Africa/Johannesburg",
  "Europe/Moscow",
  "Europe/Moscow",
  "Europe/Moscow",
  "Asia/Kuwait",
  "Asia/Riyadh",
  "Africa/Nairobi",
  "Asia/Baghdad",
  "Asia/Tehran",
  "Asia/Muscat",
  "Asia/Muscat",
  "Asia/Baku",
  "Asia/Tbilisi",
  "Asia/Yerevan",
  "Asia/Kabul",
  "Asia/Yekaterinburg",
  "Asia/Karachi",
  "Asia/Karachi",
  "Asia/Tashkent",
  "Asia/Kolkata",
  "Asia/Kolkata",
  "Asia/Kolkata",
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Dhaka",
  "Asia/Colombo",
  "Asia/Almaty",
  "Asia/Novosibirsk",
  "Asia/Rangoon",
  "Asia/Bangkok",
  "Asia/Bangkok",
  "Asia/Jakarta",
  "Asia/Krasnoyarsk",
  "Asia/Shanghai",
  "Asia/Chongqing",
  "Asia/Hong_Kong",
  "Asia/Urumqi",
  "Asia/Kuala_Lumpur",
  "Asia/Singapore",
  "Asia/Taipei",
  "Australia/Perth",
  "Asia/Irkutsk",
  "Asia/Ulaanbaatar",
  "Asia/Seoul",
  "Asia/Tokyo",
  "Asia/Tokyo",
  "Asia/Tokyo",
  "Asia/Yakutsk",
  "Australia/Darwin",
  "Australia/Adelaide",
  "Australia/Melbourne",
  "Australia/Melbourne",
  "Australia/Sydney",
  "Australia/Brisbane",
  "Australia/Hobart",
  "Asia/Vladivostok",
  "Pacific/Guam",
  "Pacific/Port_Moresby",
  "Asia/Magadan",
  "Asia/Magadan",
  "Pacific/Noumea",
  "Pacific/Fiji",
  "Asia/Kamchatka",
  "Pacific/Majuro",
  "Pacific/Auckland",
  "Pacific/Auckland",
  "Pacific/Tongatapu",
  "Pacific/Fakaofo",
  "Pacific/Apia"
];
const address = {
  building_number,
  city,
  city_name,
  city_prefix,
  city_suffix,
  country,
  country_code,
  country_code_alpha_3,
  county,
  default_country,
  direction,
  direction_abbr,
  postcode,
  secondary_address,
  state,
  state_abbr,
  street,
  street_address,
  street_suffix,
  time_zone
};
const bear = [
  "Giant panda",
  "Spectacled bear",
  "Sun bear",
  "Sloth bear",
  "American black bear",
  "Asian black bear",
  "Brown bear",
  "Polar bear"
];
const bird = [
  "Red-throated Loon",
  "Arctic Loon",
  "Pacific Loon",
  "Common Loon",
  "Yellow-billed Loon",
  "Least Grebe",
  "Pied-billed Grebe",
  "Horned Grebe",
  "Red-necked Grebe",
  "Eared Grebe",
  "Western Grebe",
  "Clark's Grebe",
  "Yellow-nosed Albatross",
  "Shy Albatross",
  "Black-browed Albatross",
  "Wandering Albatross",
  "Laysan Albatross",
  "Black-footed Albatross",
  "Short-tailed Albatross",
  "Northern Fulmar",
  "Herald Petrel",
  "Murphy's Petrel",
  "Mottled Petrel",
  "Black-capped Petrel",
  "Cook's Petrel",
  "Stejneger's Petrel",
  "White-chinned Petrel",
  "Streaked Shearwater",
  "Cory's Shearwater",
  "Pink-footed Shearwater",
  "Flesh-footed Shearwater",
  "Greater Shearwater",
  "Wedge-tailed Shearwater",
  "Buller's Shearwater",
  "Sooty Shearwater",
  "Short-tailed Shearwater",
  "Manx Shearwater",
  "Black-vented Shearwater",
  "Audubon's Shearwater",
  "Little Shearwater",
  "Wilson's Storm-Petrel",
  "White-faced Storm-Petrel",
  "European Storm-Petrel",
  "Fork-tailed Storm-Petrel",
  "Leach's Storm-Petrel",
  "Ashy Storm-Petrel",
  "Band-rumped Storm-Petrel",
  "Wedge-rumped Storm-Petrel",
  "Black Storm-Petrel",
  "Least Storm-Petrel",
  "White-tailed Tropicbird",
  "Red-billed Tropicbird",
  "Red-tailed Tropicbird",
  "Masked Booby",
  "Blue-footed Booby",
  "Brown Booby",
  "Red-footed Booby",
  "Northern Gannet",
  "American White Pelican",
  "Brown Pelican",
  "Brandt's Cormorant",
  "Neotropic Cormorant",
  "Double-crested Cormorant",
  "Great Cormorant",
  "Red-faced Cormorant",
  "Pelagic Cormorant",
  "Anhinga",
  "Magnificent Frigatebird",
  "Great Frigatebird",
  "Lesser Frigatebird",
  "American Bittern",
  "Yellow Bittern",
  "Least Bittern",
  "Great Blue Heron",
  "Great Egret",
  "Chinese Egret",
  "Little Egret",
  "Western Reef-Heron",
  "Snowy Egret",
  "Little Blue Heron",
  "Tricolored Heron",
  "Reddish Egret",
  "Cattle Egret",
  "Green Heron",
  "Black-crowned Night-Heron",
  "Yellow-crowned Night-Heron",
  "White Ibis",
  "Scarlet Ibis",
  "Glossy Ibis",
  "White-faced Ibis",
  "Roseate Spoonbill",
  "Jabiru",
  "Wood Stork",
  "Black Vulture",
  "Turkey Vulture",
  "California Condor",
  "Greater Flamingo",
  "Black-bellied Whistling-Duck",
  "Fulvous Whistling-Duck",
  "Bean Goose",
  "Pink-footed Goose",
  "Greater White-fronted Goose",
  "Lesser White-fronted Goose",
  "Emperor Goose",
  "Snow Goose",
  "Ross's Goose",
  "Canada Goose",
  "Brant",
  "Barnacle Goose",
  "Mute Swan",
  "Trumpeter Swan",
  "Tundra Swan",
  "Whooper Swan",
  "Muscovy Duck",
  "Wood Duck",
  "Gadwall",
  "Falcated Duck",
  "Eurasian Wigeon",
  "American Wigeon",
  "American Black Duck",
  "Mallard",
  "Mottled Duck",
  "Spot-billed Duck",
  "Blue-winged Teal",
  "Cinnamon Teal",
  "Northern Shoveler",
  "White-cheeked Pintail",
  "Northern Pintail",
  "Garganey",
  "Baikal Teal",
  "Green-winged Teal",
  "Canvasback",
  "Redhead",
  "Common Pochard",
  "Ring-necked Duck",
  "Tufted Duck",
  "Greater Scaup",
  "Lesser Scaup",
  "Steller's Eider",
  "Spectacled Eider",
  "King Eider",
  "Common Eider",
  "Harlequin Duck",
  "Labrador Duck",
  "Surf Scoter",
  "White-winged Scoter",
  "Black Scoter",
  "Oldsquaw",
  "Bufflehead",
  "Common Goldeneye",
  "Barrow's Goldeneye",
  "Smew",
  "Hooded Merganser",
  "Common Merganser",
  "Red-breasted Merganser",
  "Masked Duck",
  "Ruddy Duck",
  "Osprey",
  "Hook-billed Kite",
  "Swallow-tailed Kite",
  "White-tailed Kite",
  "Snail Kite",
  "Mississippi Kite",
  "Bald Eagle",
  "White-tailed Eagle",
  "Steller's Sea-Eagle",
  "Northern Harrier",
  "Sharp-shinned Hawk",
  "Cooper's Hawk",
  "Northern Goshawk",
  "Crane Hawk",
  "Gray Hawk",
  "Common Black-Hawk",
  "Harris's Hawk",
  "Roadside Hawk",
  "Red-shouldered Hawk",
  "Broad-winged Hawk",
  "Short-tailed Hawk",
  "Swainson's Hawk",
  "White-tailed Hawk",
  "Zone-tailed Hawk",
  "Red-tailed Hawk",
  "Ferruginous Hawk",
  "Rough-legged Hawk",
  "Golden Eagle",
  "Collared Forest-Falcon",
  "Crested Caracara",
  "Eurasian Kestrel",
  "American Kestrel",
  "Merlin",
  "Eurasian Hobby",
  "Aplomado Falcon",
  "Gyrfalcon",
  "Peregrine Falcon",
  "Prairie Falcon",
  "Plain Chachalaca",
  "Chukar",
  "Himalayan Snowcock",
  "Gray Partridge",
  "Ring-necked Pheasant",
  "Ruffed Grouse",
  "Sage Grouse",
  "Spruce Grouse",
  "Willow Ptarmigan",
  "Rock Ptarmigan",
  "White-tailed Ptarmigan",
  "Blue Grouse",
  "Sharp-tailed Grouse",
  "Greater Prairie-chicken",
  "Lesser Prairie-chicken",
  "Wild Turkey",
  "Mountain Quail",
  "Scaled Quail",
  "California Quail",
  "Gambel's Quail",
  "Northern Bobwhite",
  "Montezuma Quail",
  "Yellow Rail",
  "Black Rail",
  "Corn Crake",
  "Clapper Rail",
  "King Rail",
  "Virginia Rail",
  "Sora",
  "Paint-billed Crake",
  "Spotted Rail",
  "Purple Gallinule",
  "Azure Gallinule",
  "Common Moorhen",
  "Eurasian Coot",
  "American Coot",
  "Limpkin",
  "Sandhill Crane",
  "Common Crane",
  "Whooping Crane",
  "Double-striped Thick-knee",
  "Northern Lapwing",
  "Black-bellied Plover",
  "European Golden-Plover",
  "American Golden-Plover",
  "Pacific Golden-Plover",
  "Mongolian Plover",
  "Collared Plover",
  "Snowy Plover",
  "Wilson's Plover",
  "Common Ringed Plover",
  "Semipalmated Plover",
  "Piping Plover",
  "Little Ringed Plover",
  "Killdeer",
  "Mountain Plover",
  "Eurasian Dotterel",
  "Eurasian Oystercatcher",
  "American Oystercatcher",
  "Black Oystercatcher",
  "Black-winged Stilt",
  "Black-necked Stilt",
  "American Avocet",
  "Northern Jacana",
  "Common Greenshank",
  "Greater Yellowlegs",
  "Lesser Yellowlegs",
  "Marsh Sandpiper",
  "Spotted Redshank",
  "Wood Sandpiper",
  "Green Sandpiper",
  "Solitary Sandpiper",
  "Willet",
  "Wandering Tattler",
  "Gray-tailed Tattler",
  "Common Sandpiper",
  "Spotted Sandpiper",
  "Terek Sandpiper",
  "Upland Sandpiper",
  "Little Curlew",
  "Eskimo Curlew",
  "Whimbrel",
  "Bristle-thighed Curlew",
  "Far Eastern Curlew",
  "Slender-billed Curlew",
  "Eurasian Curlew",
  "Long-billed Curlew",
  "Black-tailed Godwit",
  "Hudsonian Godwit",
  "Bar-tailed Godwit",
  "Marbled Godwit",
  "Ruddy Turnstone",
  "Black Turnstone",
  "Surfbird",
  "Great Knot",
  "Red Knot",
  "Sanderling",
  "Semipalmated Sandpiper",
  "Western Sandpiper",
  "Red-necked Stint",
  "Little Stint",
  "Temminck's Stint",
  "Long-toed Stint",
  "Least Sandpiper",
  "White-rumped Sandpiper",
  "Baird's Sandpiper",
  "Pectoral Sandpiper",
  "Sharp-tailed Sandpiper",
  "Purple Sandpiper",
  "Rock Sandpiper",
  "Dunlin",
  "Curlew Sandpiper",
  "Stilt Sandpiper",
  "Spoonbill Sandpiper",
  "Broad-billed Sandpiper",
  "Buff-breasted Sandpiper",
  "Ruff",
  "Short-billed Dowitcher",
  "Long-billed Dowitcher",
  "Jack Snipe",
  "Common Snipe",
  "Pin-tailed Snipe",
  "Eurasian Woodcock",
  "American Woodcock",
  "Wilson's Phalarope",
  "Red-necked Phalarope",
  "Red Phalarope",
  "Oriental Pratincole",
  "Great Skua",
  "South Polar Skua",
  "Pomarine Jaeger",
  "Parasitic Jaeger",
  "Long-tailed Jaeger",
  "Laughing Gull",
  "Franklin's Gull",
  "Little Gull",
  "Black-headed Gull",
  "Bonaparte's Gull",
  "Heermann's Gull",
  "Band-tailed Gull",
  "Black-tailed Gull",
  "Mew Gull",
  "Ring-billed Gull",
  "California Gull",
  "Herring Gull",
  "Yellow-legged Gull",
  "Thayer's Gull",
  "Iceland Gull",
  "Lesser Black-backed Gull",
  "Slaty-backed Gull",
  "Yellow-footed Gull",
  "Western Gull",
  "Glaucous-winged Gull",
  "Glaucous Gull",
  "Great Black-backed Gull",
  "Sabine's Gull",
  "Black-legged Kittiwake",
  "Red-legged Kittiwake",
  "Ross's Gull",
  "Ivory Gull",
  "Gull-billed Tern",
  "Caspian Tern",
  "Royal Tern",
  "Elegant Tern",
  "Sandwich Tern",
  "Roseate Tern",
  "Common Tern",
  "Arctic Tern",
  "Forster's Tern",
  "Least Tern",
  "Aleutian Tern",
  "Bridled Tern",
  "Sooty Tern",
  "Large-billed Tern",
  "White-winged Tern",
  "Whiskered Tern",
  "Black Tern",
  "Brown Noddy",
  "Black Noddy",
  "Black Skimmer",
  "Dovekie",
  "Common Murre",
  "Thick-billed Murre",
  "Razorbill",
  "Great Auk",
  "Black Guillemot",
  "Pigeon Guillemot",
  "Long-billed Murrelet",
  "Marbled Murrelet",
  "Kittlitz's Murrelet",
  "Xantus's Murrelet",
  "Craveri's Murrelet",
  "Ancient Murrelet",
  "Cassin's Auklet",
  "Parakeet Auklet",
  "Least Auklet",
  "Whiskered Auklet",
  "Crested Auklet",
  "Rhinoceros Auklet",
  "Atlantic Puffin",
  "Horned Puffin",
  "Tufted Puffin",
  "Rock Dove",
  "Scaly-naped Pigeon",
  "White-crowned Pigeon",
  "Red-billed Pigeon",
  "Band-tailed Pigeon",
  "Oriental Turtle-Dove",
  "European Turtle-Dove",
  "Eurasian Collared-Dove",
  "Spotted Dove",
  "White-winged Dove",
  "Zenaida Dove",
  "Mourning Dove",
  "Passenger Pigeon",
  "Inca Dove",
  "Common Ground-Dove",
  "Ruddy Ground-Dove",
  "White-tipped Dove",
  "Key West Quail-Dove",
  "Ruddy Quail-Dove",
  "Budgerigar",
  "Monk Parakeet",
  "Carolina Parakeet",
  "Thick-billed Parrot",
  "White-winged Parakeet",
  "Red-crowned Parrot",
  "Common Cuckoo",
  "Oriental Cuckoo",
  "Black-billed Cuckoo",
  "Yellow-billed Cuckoo",
  "Mangrove Cuckoo",
  "Greater Roadrunner",
  "Smooth-billed Ani",
  "Groove-billed Ani",
  "Barn Owl",
  "Flammulated Owl",
  "Oriental Scops-Owl",
  "Western Screech-Owl",
  "Eastern Screech-Owl",
  "Whiskered Screech-Owl",
  "Great Horned Owl",
  "Snowy Owl",
  "Northern Hawk Owl",
  "Northern Pygmy-Owl",
  "Ferruginous Pygmy-Owl",
  "Elf Owl",
  "Burrowing Owl",
  "Mottled Owl",
  "Spotted Owl",
  "Barred Owl",
  "Great Gray Owl",
  "Long-eared Owl",
  "Short-eared Owl",
  "Boreal Owl",
  "Northern Saw-whet Owl",
  "Lesser Nighthawk",
  "Common Nighthawk",
  "Antillean Nighthawk",
  "Common Pauraque",
  "Common Poorwill",
  "Chuck-will's-widow",
  "Buff-collared Nightjar",
  "Whip-poor-will",
  "Jungle Nightjar",
  "Black Swift",
  "White-collared Swift",
  "Chimney Swift",
  "Vaux's Swift",
  "White-throated Needletail",
  "Common Swift",
  "Fork-tailed Swift",
  "White-throated Swift",
  "Antillean Palm Swift",
  "Green Violet-ear",
  "Green-breasted Mango",
  "Broad-billed Hummingbird",
  "White-eared Hummingbird",
  "Xantus's Hummingbird",
  "Berylline Hummingbird",
  "Buff-bellied Hummingbird",
  "Cinnamon Hummingbird",
  "Violet-crowned Hummingbird",
  "Blue-throated Hummingbird",
  "Magnificent Hummingbird",
  "Plain-capped Starthroat",
  "Bahama Woodstar",
  "Lucifer Hummingbird",
  "Ruby-throated Hummingbird",
  "Black-chinned Hummingbird",
  "Anna's Hummingbird",
  "Costa's Hummingbird",
  "Calliope Hummingbird",
  "Bumblebee Hummingbird",
  "Broad-tailed Hummingbird",
  "Rufous Hummingbird",
  "Allen's Hummingbird",
  "Elegant Trogon",
  "Eared Trogon",
  "Hoopoe",
  "Ringed Kingfisher",
  "Belted Kingfisher",
  "Green Kingfisher",
  "Eurasian Wryneck",
  "Lewis's Woodpecker",
  "Red-headed Woodpecker",
  "Acorn Woodpecker",
  "Gila Woodpecker",
  "Golden-fronted Woodpecker",
  "Red-bellied Woodpecker",
  "Williamson's Sapsucker",
  "Yellow-bellied Sapsucker",
  "Red-naped Sapsucker",
  "Red-breasted Sapsucker",
  "Great Spotted Woodpecker",
  "Ladder-backed Woodpecker",
  "Nuttall's Woodpecker",
  "Downy Woodpecker",
  "Hairy Woodpecker",
  "Strickland's Woodpecker",
  "Red-cockaded Woodpecker",
  "White-headed Woodpecker",
  "Three-toed Woodpecker",
  "Black-backed Woodpecker",
  "Northern Flicker",
  "Gilded Flicker",
  "Pileated Woodpecker",
  "Ivory-billed Woodpecker",
  "Northern Beardless-Tyrannulet",
  "Greenish Elaenia",
  "Caribbean Elaenia",
  "Tufted Flycatcher",
  "Olive-sided Flycatcher",
  "Greater Pewee",
  "Western Wood-Pewee",
  "Eastern Wood-Pewee",
  "Yellow-bellied Flycatcher",
  "Acadian Flycatcher",
  "Alder Flycatcher",
  "Willow Flycatcher",
  "Least Flycatcher",
  "Hammond's Flycatcher",
  "Dusky Flycatcher",
  "Gray Flycatcher",
  "Pacific-slope Flycatcher",
  "Cordilleran Flycatcher",
  "Buff-breasted Flycatcher",
  "Black Phoebe",
  "Eastern Phoebe",
  "Say's Phoebe",
  "Vermilion Flycatcher",
  "Dusky-capped Flycatcher",
  "Ash-throated Flycatcher",
  "Nutting's Flycatcher",
  "Great Crested Flycatcher",
  "Brown-crested Flycatcher",
  "La Sagra's Flycatcher",
  "Great Kiskadee",
  "Sulphur-bellied Flycatcher",
  "Variegated Flycatcher",
  "Tropical Kingbird",
  "Couch's Kingbird",
  "Cassin's Kingbird",
  "Thick-billed Kingbird",
  "Western Kingbird",
  "Eastern Kingbird",
  "Gray Kingbird",
  "Loggerhead Kingbird",
  "Scissor-tailed Flycatcher",
  "Fork-tailed Flycatcher",
  "Rose-throated Becard",
  "Masked Tityra",
  "Brown Shrike",
  "Loggerhead Shrike",
  "Northern Shrike",
  "White-eyed Vireo",
  "Thick-billed Vireo",
  "Bell's Vireo",
  "Black-capped Vireo",
  "Gray Vireo",
  "Yellow-throated Vireo",
  "Plumbeous Vireo",
  "Cassin's Vireo",
  "Blue-headed Vireo",
  "Hutton's Vireo",
  "Warbling Vireo",
  "Philadelphia Vireo",
  "Red-eyed Vireo",
  "Yellow-green Vireo",
  "Black-whiskered Vireo",
  "Yucatan Vireo",
  "Gray Jay",
  "Steller's Jay",
  "Blue Jay",
  "Green Jay",
  "Brown Jay",
  "Florida Scrub-Jay",
  "Island Scrub-Jay",
  "Western Scrub-Jay",
  "Mexican Jay",
  "Pinyon Jay",
  "Clark's Nutcracker",
  "Black-billed Magpie",
  "Yellow-billed Magpie",
  "Eurasian Jackdaw",
  "American Crow",
  "Northwestern Crow",
  "Tamaulipas Crow",
  "Fish Crow",
  "Chihuahuan Raven",
  "Common Raven",
  "Sky Lark",
  "Horned Lark",
  "Purple Martin",
  "Cuban Martin",
  "Gray-breasted Martin",
  "Southern Martin",
  "Brown-chested Martin",
  "Tree Swallow",
  "Violet-green Swallow",
  "Bahama Swallow",
  "Northern Rough-winged Swallow",
  "Bank Swallow",
  "Cliff Swallow",
  "Cave Swallow",
  "Barn Swallow",
  "Common House-Martin",
  "Carolina Chickadee",
  "Black-capped Chickadee",
  "Mountain Chickadee",
  "Mexican Chickadee",
  "Chestnut-backed Chickadee",
  "Boreal Chickadee",
  "Gray-headed Chickadee",
  "Bridled Titmouse",
  "Oak Titmouse",
  "Juniper Titmouse",
  "Tufted Titmouse",
  "Verdin",
  "Bushtit",
  "Red-breasted Nuthatch",
  "White-breasted Nuthatch",
  "Pygmy Nuthatch",
  "Brown-headed Nuthatch",
  "Brown Creeper",
  "Cactus Wren",
  "Rock Wren",
  "Canyon Wren",
  "Carolina Wren",
  "Bewick's Wren",
  "House Wren",
  "Winter Wren",
  "Sedge Wren",
  "Marsh Wren",
  "American Dipper",
  "Red-whiskered Bulbul",
  "Golden-crowned Kinglet",
  "Ruby-crowned Kinglet",
  "Middendorff's Grasshopper-Warbler",
  "Lanceolated Warbler",
  "Wood Warbler",
  "Dusky Warbler",
  "Arctic Warbler",
  "Blue-gray Gnatcatcher",
  "California Gnatcatcher",
  "Black-tailed Gnatcatcher",
  "Black-capped Gnatcatcher",
  "Narcissus Flycatcher",
  "Mugimaki Flycatcher",
  "Red-breasted Flycatcher",
  "Siberian Flycatcher",
  "Gray-spotted Flycatcher",
  "Asian Brown Flycatcher",
  "Siberian Rubythroat",
  "Bluethroat",
  "Siberian Blue Robin",
  "Red-flanked Bluetail",
  "Northern Wheatear",
  "Stonechat",
  "Eastern Bluebird",
  "Western Bluebird",
  "Mountain Bluebird",
  "Townsend's Solitaire",
  "Veery",
  "Gray-cheeked Thrush",
  "Bicknell's Thrush",
  "Swainson's Thrush",
  "Hermit Thrush",
  "Wood Thrush",
  "Eurasian Blackbird",
  "Eyebrowed Thrush",
  "Dusky Thrush",
  "Fieldfare",
  "Redwing",
  "Clay-colored Robin",
  "White-throated Robin",
  "Rufous-backed Robin",
  "American Robin",
  "Varied Thrush",
  "Aztec Thrush",
  "Wrentit",
  "Gray Catbird",
  "Black Catbird",
  "Northern Mockingbird",
  "Bahama Mockingbird",
  "Sage Thrasher",
  "Brown Thrasher",
  "Long-billed Thrasher",
  "Bendire's Thrasher",
  "Curve-billed Thrasher",
  "California Thrasher",
  "Crissal Thrasher",
  "Le Conte's Thrasher",
  "Blue Mockingbird",
  "European Starling",
  "Crested Myna",
  "Siberian Accentor",
  "Yellow Wagtail",
  "Citrine Wagtail",
  "Gray Wagtail",
  "White Wagtail",
  "Black-backed Wagtail",
  "Tree Pipit",
  "Olive-backed Pipit",
  "Pechora Pipit",
  "Red-throated Pipit",
  "American Pipit",
  "Sprague's Pipit",
  "Bohemian Waxwing",
  "Cedar Waxwing",
  "Gray Silky-flycatcher",
  "Phainopepla",
  "Olive Warbler",
  "Bachman's Warbler",
  "Blue-winged Warbler",
  "Golden-winged Warbler",
  "Tennessee Warbler",
  "Orange-crowned Warbler",
  "Nashville Warbler",
  "Virginia's Warbler",
  "Colima Warbler",
  "Lucy's Warbler",
  "Crescent-chested Warbler",
  "Northern Parula",
  "Tropical Parula",
  "Yellow Warbler",
  "Chestnut-sided Warbler",
  "Magnolia Warbler",
  "Cape May Warbler",
  "Black-throated Blue Warbler",
  "Yellow-rumped Warbler",
  "Black-throated Gray Warbler",
  "Golden-cheeked Warbler",
  "Black-throated Green Warbler",
  "Townsend's Warbler",
  "Hermit Warbler",
  "Blackburnian Warbler",
  "Yellow-throated Warbler",
  "Grace's Warbler",
  "Pine Warbler",
  "Kirtland's Warbler",
  "Prairie Warbler",
  "Palm Warbler",
  "Bay-breasted Warbler",
  "Blackpoll Warbler",
  "Cerulean Warbler",
  "Black-and-white Warbler",
  "American Redstart",
  "Prothonotary Warbler",
  "Worm-eating Warbler",
  "Swainson's Warbler",
  "Ovenbird",
  "Northern Waterthrush",
  "Louisiana Waterthrush",
  "Kentucky Warbler",
  "Connecticut Warbler",
  "Mourning Warbler",
  "MacGillivray's Warbler",
  "Common Yellowthroat",
  "Gray-crowned Yellowthroat",
  "Hooded Warbler",
  "Wilson's Warbler",
  "Canada Warbler",
  "Red-faced Warbler",
  "Painted Redstart",
  "Slate-throated Redstart",
  "Fan-tailed Warbler",
  "Golden-crowned Warbler",
  "Rufous-capped Warbler",
  "Yellow-breasted Chat",
  "Bananaquit",
  "Hepatic Tanager",
  "Summer Tanager",
  "Scarlet Tanager",
  "Western Tanager",
  "Flame-colored Tanager",
  "Stripe-headed Tanager",
  "White-collared Seedeater",
  "Yellow-faced Grassquit",
  "Black-faced Grassquit",
  "Olive Sparrow",
  "Green-tailed Towhee",
  "Spotted Towhee",
  "Eastern Towhee",
  "Canyon Towhee",
  "California Towhee",
  "Abert's Towhee",
  "Rufous-winged Sparrow",
  "Cassin's Sparrow",
  "Bachman's Sparrow",
  "Botteri's Sparrow",
  "Rufous-crowned Sparrow",
  "Five-striped Sparrow",
  "American Tree Sparrow",
  "Chipping Sparrow",
  "Clay-colored Sparrow",
  "Brewer's Sparrow",
  "Field Sparrow",
  "Worthen's Sparrow",
  "Black-chinned Sparrow",
  "Vesper Sparrow",
  "Lark Sparrow",
  "Black-throated Sparrow",
  "Sage Sparrow",
  "Lark Bunting",
  "Savannah Sparrow",
  "Grasshopper Sparrow",
  "Baird's Sparrow",
  "Henslow's Sparrow",
  "Le Conte's Sparrow",
  "Nelson's Sharp-tailed Sparrow",
  "Saltmarsh Sharp-tailed Sparrow",
  "Seaside Sparrow",
  "Fox Sparrow",
  "Song Sparrow",
  "Lincoln's Sparrow",
  "Swamp Sparrow",
  "White-throated Sparrow",
  "Harris's Sparrow",
  "White-crowned Sparrow",
  "Golden-crowned Sparrow",
  "Dark-eyed Junco",
  "Yellow-eyed Junco",
  "McCown's Longspur",
  "Lapland Longspur",
  "Smith's Longspur",
  "Chestnut-collared Longspur",
  "Pine Bunting",
  "Little Bunting",
  "Rustic Bunting",
  "Yellow-breasted Bunting",
  "Gray Bunting",
  "Pallas's Bunting",
  "Reed Bunting",
  "Snow Bunting",
  "McKay's Bunting",
  "Crimson-collared Grosbeak",
  "Northern Cardinal",
  "Pyrrhuloxia",
  "Yellow Grosbeak",
  "Rose-breasted Grosbeak",
  "Black-headed Grosbeak",
  "Blue Bunting",
  "Blue Grosbeak",
  "Lazuli Bunting",
  "Indigo Bunting",
  "Varied Bunting",
  "Painted Bunting",
  "Dickcissel",
  "Bobolink",
  "Red-winged Blackbird",
  "Tricolored Blackbird",
  "Tawny-shouldered Blackbird",
  "Eastern Meadowlark",
  "Western Meadowlark",
  "Yellow-headed Blackbird",
  "Rusty Blackbird",
  "Brewer's Blackbird",
  "Common Grackle",
  "Boat-tailed Grackle",
  "Great-tailed Grackle",
  "Shiny Cowbird",
  "Bronzed Cowbird",
  "Brown-headed Cowbird",
  "Black-vented Oriole",
  "Orchard Oriole",
  "Hooded Oriole",
  "Streak-backed Oriole",
  "Spot-breasted Oriole",
  "Altamira Oriole",
  "Audubon's Oriole",
  "Baltimore Oriole",
  "Bullock's Oriole",
  "Scott's Oriole",
  "Common Chaffinch",
  "Brambling",
  "Gray-crowned Rosy-Finch",
  "Black Rosy-Finch",
  "Brown-capped Rosy-Finch",
  "Pine Grosbeak",
  "Common Rosefinch",
  "Purple Finch",
  "Cassin's Finch",
  "House Finch",
  "Red Crossbill",
  "White-winged Crossbill",
  "Common Redpoll",
  "Hoary Redpoll",
  "Eurasian Siskin",
  "Pine Siskin",
  "Lesser Goldfinch",
  "Lawrence's Goldfinch",
  "American Goldfinch",
  "Oriental Greenfinch",
  "Eurasian Bullfinch",
  "Evening Grosbeak",
  "Hawfinch",
  "House Sparrow",
  "Eurasian Tree Sparrow"
];
const cat = [
  "Abyssinian",
  "American Bobtail",
  "American Curl",
  "American Shorthair",
  "American Wirehair",
  "Balinese",
  "Bengal",
  "Birman",
  "Bombay",
  "British Shorthair",
  "Burmese",
  "Chartreux",
  "Chausie",
  "Cornish Rex",
  "Devon Rex",
  "Donskoy",
  "Egyptian Mau",
  "Exotic Shorthair",
  "Havana",
  "Highlander",
  "Himalayan",
  "Japanese Bobtail",
  "Korat",
  "Kurilian Bobtail",
  "LaPerm",
  "Maine Coon",
  "Manx",
  "Minskin",
  "Munchkin",
  "Nebelung",
  "Norwegian Forest Cat",
  "Ocicat",
  "Ojos Azules",
  "Oriental",
  "Persian",
  "Peterbald",
  "Pixiebob",
  "Ragdoll",
  "Russian Blue",
  "Savannah",
  "Scottish Fold",
  "Selkirk Rex",
  "Serengeti",
  "Siberian",
  "Siamese",
  "Singapura",
  "Snowshoe",
  "Sokoke",
  "Somali",
  "Sphynx",
  "Thai",
  "Tonkinese",
  "Toyger",
  "Turkish Angora",
  "Turkish Van"
];
const cetacean = [
  "Blue Whale",
  "Fin Whale",
  "Sei Whale",
  "Sperm Whale",
  "Bryde\u2019s whale",
  "Omura\u2019s whale",
  "Humpback whale",
  "Long-Beaked Common Dolphin",
  "Short-Beaked Common Dolphin",
  "Bottlenose Dolphin",
  "Indo-Pacific Bottlenose Dolphin",
  "Northern Rightwhale Dolphin",
  "Southern Rightwhale Dolphin",
  "Tucuxi",
  "Costero",
  "Indo-Pacific Hump-backed Dolphin",
  "Chinese White Dolphin",
  "Atlantic Humpbacked Dolphin",
  "Atlantic Spotted Dolphin",
  "Clymene Dolphin",
  "Pantropical Spotted Dolphin",
  "Spinner Dolphin",
  "Striped Dolphin",
  "Rough-Toothed Dolphin",
  "Chilean Dolphin",
  "Commerson\u2019s Dolphin",
  "Heaviside\u2019s Dolphin",
  "Hector\u2019s Dolphin",
  "Risso\u2019s Dolphin",
  "Fraser\u2019s Dolphin",
  "Atlantic White-Sided Dolphin",
  "Dusky Dolphin",
  "Hourglass Dolphin",
  "Pacific White-Sided Dolphin",
  "Peale\u2019s Dolphin",
  "White-Beaked Dolphin",
  "Australian Snubfin Dolphin",
  "Irrawaddy Dolphin",
  "Melon-headed Whale",
  "Killer Whale (Orca)",
  "Pygmy Killer Whale",
  "False Killer Whale",
  "Long-finned Pilot Whale",
  "Short-finned Pilot Whale",
  "Guiana Dolphin",
  "Burrunan Dolphin",
  "Australian humpback Dolphin",
  "Amazon River Dolphin",
  "Chinese River Dolphin",
  "Ganges River Dolphin",
  "La Plata Dolphin",
  "Southern Bottlenose Whale",
  "Longman's Beaked Whale",
  "Arnoux's Beaked Whale"
];
const cow = [
  "Aberdeen Angus",
  "Abergele",
  "Abigar",
  "Abondance",
  "Abyssinian Shorthorned Zebu",
  "Aceh",
  "Achham",
  "Adamawa",
  "Adaptaur",
  "Afar",
  "Africangus",
  "Afrikaner",
  "Agerolese",
  "Alambadi",
  "Alatau",
  "Albanian",
  "Albera",
  "Alderney",
  "Alentejana",
  "Aleutian wild cattle",
  "Aliad Dinka",
  "Alistana-Sanabresa",
  "Allmogekor",
  "Alur",
  "American",
  "American Angus",
  "American Beef Friesian",
  "American Brown Swiss",
  "American Milking Devon",
  "American White Park",
  "Amerifax",
  "Amrit Mahal",
  "Amsterdam Island cattle",
  "Anatolian Black",
  "Andalusian Black",
  "Andalusian Blond",
  "Andalusian Grey",
  "Angeln",
  "Angoni",
  "Ankina",
  "Ankole",
  "Ankole-Watusi",
  "Aracena",
  "Arado",
  "Argentine Criollo",
  "Argentine Friesian",
  "Armorican",
  "Arouquesa",
  "Arsi",
  "Asturian Mountain",
  "Asturian Valley",
  "Aubrac",
  "Aulie-Ata",
  "Aure et Saint-Girons",
  "Australian Braford",
  "Australian Brangus",
  "Australian Charbray",
  "Australian Friesian Sahiwal",
  "Australian Lowline",
  "Australian Milking Zebu",
  "Australian Shorthorn",
  "Austrian Simmental",
  "Austrian Yellow",
  "Av\xE9tonou",
  "Avile\xF1a-Negra Ib\xE9rica",
  "Aweil Dinka",
  "Ayrshire",
  "Azaouak",
  "Azebuado",
  "Azerbaijan Zebu",
  "Azores",
  "Bedit",
  "Breed",
  "Bachaur cattle",
  "Baherie cattle",
  "Bakosi cattle",
  "Balancer",
  "Baoule",
  "Bargur cattle",
  "Barros\xE3",
  "Barzona",
  "Bazadaise",
  "Beef Freisian",
  "Beefalo",
  "Beefmaker",
  "Beefmaster",
  "Begayt",
  "Belgian Blue",
  "Belgian Red",
  "Belgian Red Pied",
  "Belgian White-and-Red",
  "Belmont Red",
  "Belted Galloway",
  "Bernese",
  "Berrenda cattle",
  "Betizu",
  "Bianca Modenese",
  "Blaarkop",
  "Black Angus",
  "Black Baldy",
  "Black Hereford",
  "Blanca Cacere\xF1a",
  "Blanco Orejinegro BON",
  "Blonde d'Aquitaine",
  "Blue Albion",
  "Blue Grey",
  "Bohuskulla",
  "Bonsmara",
  "Boran",
  "Bo\u0161karin",
  "Braford",
  "Brahman",
  "Brahmousin",
  "Brangus",
  "Braunvieh",
  "Brava",
  "British White",
  "British Friesian",
  "Brown Carpathian",
  "Brown Caucasian",
  "Brown Swiss",
  "Bue Lingo",
  "Burlina",
  "Bu\u0161a cattle",
  "Butana cattle",
  "Bushuyev",
  "Cedit",
  "Breed",
  "Cachena",
  "Caldelana",
  "Camargue",
  "Campbell Island cattle",
  "Canadian Speckle Park",
  "Canadienne",
  "Canaria",
  "Canchim",
  "Caracu",
  "C\xE1rdena Andaluza",
  "Carinthian Blondvieh",
  "Carora",
  "Charbray",
  "Charolais",
  "Chateaubriand",
  "Chiangus",
  "Chianina",
  "Chillingham cattle",
  "Chinese Black Pied",
  "Cholistani",
  "Coloursided White Back",
  "Commercial",
  "Corriente",
  "Corsican cattle",
  "Coste\xF1o con Cuernos",
  "Crioulo Lageano",
  "Dedit",
  "Breed",
  "Dajal",
  "Dangi cattle",
  "Danish Black-Pied",
  "Danish Jersey",
  "Danish Red",
  "Deep Red cattle",
  "Deoni",
  "Devon",
  "Dexter cattle",
  "Dhanni",
  "Doayo cattle",
  "Doela",
  "Drakensberger",
  "D\xF8lafe",
  "Droughtmaster",
  "Dulong'",
  "Dutch Belted",
  "Dutch Friesian",
  "Dwarf Lulu",
  "Eedit",
  "Breed",
  "East Anatolian Red",
  "Eastern Finncattle",
  "Eastern Red Polled",
  "Enderby Island cattle",
  "English Longhorn",
  "Ennstaler Bergscheck",
  "Estonian Holstein",
  "Estonian Native",
  "Estonian Red cattle",
  "\xC9vol\xE8ne cattle",
  "Fedit",
  "Breed",
  "F\u0113ng Cattle",
  "Finnish Ayrshire",
  "Finncattle",
  "Finnish Holstein-Friesian",
  "Fj\xE4ll",
  "Fleckvieh",
  "Florida Cracker cattle",
  "Fogera",
  "French Simmental",
  "Fribourgeoise",
  "Friesian Red and White",
  "Fulani Sudanese",
  "Gedit",
  "Breed",
  "Galician Blond",
  "Galloway cattle",
  "Gangatiri",
  "Gaolao",
  "Garvonesa",
  "Gascon cattle",
  "Gelbvieh",
  "Georgian Mountain cattle",
  "German Angus",
  "German Black Pied cattle",
  "German Black Pied Dairy",
  "German Red Pied",
  "Gir",
  "Glan cattle",
  "Gloucester",
  "Gobra",
  "Greek Shorthorn",
  "Greek Steppe",
  "Greyman cattle",
  "Gudali",
  "Guernsey cattle",
  "Guzer\xE1",
  "Hedit",
  "Breed",
  "Hallikar4",
  "Hanwoo",
  "Hariana cattle",
  "Hart\xF3n del Valle",
  "Harzer Rotvieh",
  "Hays Converter",
  "Heck cattle",
  "Hereford",
  "Herens",
  "Hybridmaster",
  "Highland cattle",
  "Hinterwald",
  "Holando-Argentino",
  "Holstein Friesian cattle",
  "Horro",
  "Hu\xE1ng Cattle",
  "Hungarian Grey",
  "Iedit",
  "Breed",
  "Iberian cattle",
  "Icelandic",
  "Illawarra cattle",
  "Improved Red and White",
  "Indo-Brazilian",
  "Irish Moiled",
  "Israeli Holstein",
  "Israeli Red",
  "Istoben cattle",
  "Istrian cattle",
  "Jedit",
  "Breed",
  "Jamaica Black",
  "Jamaica Hope",
  "Jamaica Red",
  "Japanese Brown",
  "Jarmelista",
  "Javari cattle",
  "Jersey cattle",
  "Jutland cattle",
  "Kedit",
  "Breed",
  "Kabin Buri cattle",
  "Kalmyk cattle",
  "Kangayam",
  "Kankrej",
  "Kamphaeng Saen cattle",
  "Karan Swiss",
  "Kasaragod Dwarf cattle",
  "Kathiawadi",
  "Kazakh Whiteheaded",
  "Kenana cattle",
  "Kenkatha cattle",
  "Kerry cattle",
  "Kherigarh",
  "Khillari cattle",
  "Kholomogory",
  "Korat Wagyu",
  "Kostroma cattle",
  "Krishna Valley cattle",
  "Kuri",
  "Kurgan cattle",
  "Ledit",
  "Breed",
  "La Reina cattle",
  "Lakenvelder cattle",
  "Lampurger",
  "Latvian Blue",
  "Latvian Brown",
  "Latvian Danish Red",
  "Lebedyn",
  "Levantina",
  "Limia cattle",
  "Limousin",
  "Limpurger",
  "Lincoln Red",
  "Lineback",
  "Lithuanian Black-and-White",
  "Lithuanian Light Grey",
  "Lithuanian Red",
  "Lithuanian White-Backed",
  "Lohani cattle",
  "Lourdais",
  "Lucerna cattle",
  "Luing",
  "Medit",
  "Breed",
  "Madagascar Zebu",
  "Madura",
  "Maine-Anjou",
  "Malnad Gidda",
  "Malvi",
  "Mandalong Special",
  "Mantequera Leonesa",
  "Maramure\u015F Brown",
  "Marchigiana",
  "Maremmana",
  "Marinhoa",
  "Maronesa",
  "Masai",
  "Mashona",
  "Menorquina",
  "Mertolenga",
  "Meuse-Rhine-Issel",
  "Mewati",
  "Milking Shorthorn",
  "Minhota",
  "Mirandesa",
  "Mirkadim",
  "Moc\u0103ni\u0163\u0103",
  "Mollie",
  "Monchina",
  "Mongolian",
  "Montb\xE9liarde",
  "Morucha",
  "Muturu",
  "Murboden",
  "Murnau-Werdenfels",
  "Murray Grey",
  "Nedit",
  "Breed",
  "Nagori",
  "N'Dama",
  "Negra Andaluza",
  "Nelore",
  "Nguni",
  "Nimari",
  "Normande",
  "North Bengal Grey",
  "Northern Finncattle",
  "Northern Shorthorn",
  "Norwegian Red",
  "Oedit]",
  "Breed",
  "Ongole",
  "Original Simmental",
  "Pedit",
  "Breed",
  "Pajuna",
  "Palmera",
  "Pantaneiro",
  "Parda Alpina",
  "Parthenaise",
  "Pasiega",
  "Pembroke",
  "Philippine Native",
  "Pie Rouge des Plaines",
  "Piedmontese cattle",
  "Pineywoods",
  "Pinzgauer",
  "Pirenaica",
  "Podolac",
  "Podolica",
  "Polish Black-and-White",
  "Polish Red",
  "Polled Hereford",
  "Poll Shorthorn",
  "Polled Shorthorn",
  "Ponwar",
  "Preta",
  "Punganur",
  "Pulikulam",
  "Pustertaler Sprinzen",
  "Qedit",
  "Breed",
  "Qinchaun",
  "Queensland Miniature Boran",
  "Redit",
  "Breed",
  "Ramo Grande",
  "Randall",
  "Raramuri Criollo",
  "Rathi",
  "R\xE4tisches Grauvieh",
  "Raya",
  "Red Angus",
  "Red Brangus",
  "Red Chittagong",
  "Red Fulani",
  "Red Gorbatov",
  "Red Holstein",
  "Red Kandhari",
  "Red Mingrelian",
  "Red Poll",
  "Red Polled \xD8stland",
  "Red Sindhi",
  "Retinta",
  "Riggit Galloway",
  "Ringam\xE5la",
  "Rohjan",
  "Romagnola",
  "Romanian B\u0103l\u0163ata",
  "Romanian Steppe Gray",
  "Romosinuano",
  "Russian Black Pied",
  "RX3",
  "Sedit",
  "Breed",
  "Sahiwal",
  "Salers",
  "Salorn",
  "Sanga",
  "Sanhe",
  "Santa Cruz",
  "Santa Gertrudis",
  "Sayaguesa",
  "Schwyz",
  "Selembu",
  "Senepol",
  "Serbian Pied",
  "Serbian Steppe",
  "Sheko",
  "Shetland",
  "Shorthorn",
  "Siboney de Cuba",
  "Simbrah",
  "Simford",
  "Simmental",
  "Siri",
  "South Devon",
  "Spanish Fighting Bull",
  "Speckle Park",
  "Square Meater",
  "Sussex",
  "Swedish Friesian",
  "Swedish Polled",
  "Swedish Red Pied",
  "Swedish Red Polled",
  "Swedish Red-and-White",
  "Tedit",
  "Breed",
  "Tabapu\xE3",
  "Tarentaise",
  "Tasmanian Grey",
  "Tauros",
  "Telemark",
  "Texas Longhorn",
  "Texon",
  "Thai Black",
  "Thai Fighting Bull",
  "Thai Friesian",
  "Thai Milking Zebu",
  "Tharparkar",
  "Tswana",
  "Tudanca",
  "Tuli",
  "Tulim",
  "Turkish Grey Steppe",
  "Tux-Zillertal",
  "Tyrol Grey",
  "Uedit",
  "Breed",
  "Umblachery",
  "Ukrainian Grey",
  "Vedit",
  "Breed",
  "Valdostana Castana",
  "Valdostana Pezzata Nera",
  "Valdostana Pezzata Rossa",
  "V\xE4neko",
  "Vaynol",
  "Vechur8",
  "Vestland Fjord",
  "Vestland Red Polled",
  "Vianesa",
  "Volinian Beef",
  "Vorderwald",
  "Vosgienne",
  "Wedit",
  "Breed",
  "Wagyu",
  "Waguli",
  "Wangus",
  "Welsh Black",
  "Western Finncattle",
  "White C\xE1ceres",
  "White Fulani",
  "White Lamphun",
  "White Park",
  "Whitebred Shorthorn",
  "Xedit",
  "Breed",
  "Xingjiang Brown",
  "Yedit",
  "Breed",
  "Yakutian",
  "Yanbian",
  "Yanhuang",
  "Yurino",
  "Zedit",
  "Breed",
  "\u017Bubro\u0144",
  "Zebu"
];
const crocodilia = [
  "Alligator mississippiensis",
  "Chinese Alligator",
  "Black Caiman",
  "Broad-snouted Caiman",
  "Spectacled Caiman",
  "Yacare Caiman",
  "Cuvier\u2019s Dwarf Caiman",
  "Schneider\u2019s Smooth-fronted Caiman",
  "African Slender-snouted Crocodile",
  "American Crocodile",
  "Australian Freshwater Crocodile",
  "Cuban Crocodile",
  "Dwarf Crocodile",
  "Morelet\u2019s Crocodile",
  "Mugger Crocodile",
  "New Guinea Freshwater Crocodile",
  "Nile Crocodile",
  "West African Crocodile",
  "Orinoco Crocodile",
  "Philippine Crocodile",
  "Saltwater Crocodile",
  "Siamese Crocodile",
  "Gharial",
  "Tomistoma"
];
const dog = [
  "Affenpinscher",
  "Afghan Hound",
  "Aidi",
  "Airedale Terrier",
  "Akbash",
  "Akita",
  "Alano Espa\xF1ol",
  "Alapaha Blue Blood Bulldog",
  "Alaskan Husky",
  "Alaskan Klee Kai",
  "Alaskan Malamute",
  "Alopekis",
  "Alpine Dachsbracke",
  "American Bulldog",
  "American Bully",
  "American Cocker Spaniel",
  "American English Coonhound",
  "American Foxhound",
  "American Hairless Terrier",
  "American Pit Bull Terrier",
  "American Staffordshire Terrier",
  "American Water Spaniel",
  "Andalusian Hound",
  "Anglo-Fran\xE7ais de Petite V\xE9nerie",
  "Appenzeller Sennenhund",
  "Ariegeois",
  "Armant",
  "Armenian Gampr dog",
  "Artois Hound",
  "Australian Cattle Dog",
  "Australian Kelpie",
  "Australian Shepherd",
  "Australian Stumpy Tail Cattle Dog",
  "Australian Terrier",
  "Austrian Black and Tan Hound",
  "Austrian Pinscher",
  "Azawakh",
  "Bakharwal dog",
  "Banjara Hound",
  "Barbado da Terceira",
  "Barbet",
  "Basenji",
  "Basque Shepherd Dog",
  "Basset Art\xE9sien Normand",
  "Basset Bleu de Gascogne",
  "Basset Fauve de Bretagne",
  "Basset Hound",
  "Bavarian Mountain Hound",
  "Beagle",
  "Beagle-Harrier",
  "Belgian Shepherd",
  "Bearded Collie",
  "Beauceron",
  "Bedlington Terrier",
  "Bergamasco Shepherd",
  "Berger Picard",
  "Bernese Mountain Dog",
  "Bhotia",
  "Bichon Fris\xE9",
  "Billy",
  "Black and Tan Coonhound",
  "Black Norwegian Elkhound",
  "Black Russian Terrier",
  "Black Mouth Cur",
  "Bloodhound",
  "Blue Lacy",
  "Blue Picardy Spaniel",
  "Bluetick Coonhound",
  "Boerboel",
  "Bohemian Shepherd",
  "Bolognese",
  "Border Collie",
  "Border Terrier",
  "Borzoi",
  "Bosnian Coarse-haired Hound",
  "Boston Terrier",
  "Bouvier des Ardennes",
  "Bouvier des Flandres",
  "Boxer",
  "Boykin Spaniel",
  "Bracco Italiano",
  "Braque d'Auvergne",
  "Braque de l'Ari\xE8ge",
  "Braque du Bourbonnais",
  "Braque Francais",
  "Braque Saint-Germain",
  "Briard",
  "Briquet Griffon Vend\xE9en",
  "Brittany",
  "Broholmer",
  "Bruno Jura Hound",
  "Brussels Griffon",
  "Bucovina Shepherd Dog",
  "Bull Arab",
  "Bull Terrier",
  "Bulldog",
  "Bullmastiff",
  "Bully Kutta",
  "Burgos Pointer",
  "Cairn Terrier",
  "Campeiro Bulldog",
  "Canaan Dog",
  "Canadian Eskimo Dog",
  "Cane Corso",
  "Cane di Oropa",
  "Cane Paratore",
  "Cantabrian Water Dog",
  "Can de Chira",
  "C\xE3o da Serra de Aires",
  "C\xE3o de Castro Laboreiro",
  "C\xE3o de Gado Transmontano",
  "C\xE3o Fila de S\xE3o Miguel",
  "Cardigan Welsh Corgi",
  "Carea Castellano Manchego",
  "Carolina Dog",
  "Carpathian Shepherd Dog",
  "Catahoula Leopard Dog",
  "Catalan Sheepdog",
  "Caucasian Shepherd Dog",
  "Cavalier King Charles Spaniel",
  "Central Asian Shepherd Dog",
  "Cesky Fousek",
  "Cesky Terrier",
  "Chesapeake Bay Retriever",
  "Chien Fran\xE7ais Blanc et Noir",
  "Chien Fran\xE7ais Blanc et Orange",
  "Chien Fran\xE7ais Tricolore",
  "Chihuahua",
  "Chilean Terrier",
  "Chinese Chongqing Dog",
  "Chinese Crested Dog",
  "Chinook",
  "Chippiparai",
  "Chongqing dog",
  "Chortai",
  "Chow Chow",
  "Cimarr\xF3n Uruguayo",
  "Cirneco dell'Etna",
  "Clumber Spaniel",
  "Colombian fino hound",
  "Coton de Tulear",
  "Cretan Hound",
  "Croatian Sheepdog",
  "Curly-Coated Retriever",
  "Cursinu",
  "Czechoslovakian Wolfdog",
  "Dachshund",
  "Dalmatian",
  "Dandie Dinmont Terrier",
  "Danish-Swedish Farmdog",
  "Denmark Feist",
  "Dingo",
  "Doberman Pinscher",
  "Dogo Argentino",
  "Dogo Guatemalteco",
  "Dogo Sardesco",
  "Dogue Brasileiro",
  "Dogue de Bordeaux",
  "Drentse Patrijshond",
  "Drever",
  "Dunker",
  "Dutch Shepherd",
  "Dutch Smoushond",
  "East Siberian Laika",
  "East European Shepherd",
  "English Cocker Spaniel",
  "English Foxhound",
  "English Mastiff",
  "English Setter",
  "English Shepherd",
  "English Springer Spaniel",
  "English Toy Terrier",
  "Entlebucher Mountain Dog",
  "Estonian Hound",
  "Estrela Mountain Dog",
  "Eurasier",
  "Field Spaniel",
  "Fila Brasileiro",
  "Finnish Hound",
  "Finnish Lapphund",
  "Finnish Spitz",
  "Flat-Coated Retriever",
  "French Bulldog",
  "French Spaniel",
  "Galgo Espa\xF1ol",
  "Galician Shepherd Dog",
  "Garafian Shepherd",
  "Gascon Saintongeois",
  "Georgian Shepherd",
  "German Hound",
  "German Longhaired Pointer",
  "German Pinscher",
  "German Roughhaired Pointer",
  "German Shepherd Dog",
  "German Shorthaired Pointer",
  "German Spaniel",
  "German Spitz",
  "German Wirehaired Pointer",
  "Giant Schnauzer",
  "Glen of Imaal Terrier",
  "Golden Retriever",
  "Go\u0144czy Polski",
  "Gordon Setter",
  "Grand Anglo-Fran\xE7ais Blanc et Noir",
  "Grand Anglo-Fran\xE7ais Blanc et Orange",
  "Grand Anglo-Fran\xE7ais Tricolore",
  "Grand Basset Griffon Vend\xE9en",
  "Grand Bleu de Gascogne",
  "Grand Griffon Vend\xE9en",
  "Great Dane",
  "Greater Swiss Mountain Dog",
  "Greek Harehound",
  "Greek Shepherd",
  "Greenland Dog",
  "Greyhound",
  "Griffon Bleu de Gascogne",
  "Griffon Fauve de Bretagne",
  "Griffon Nivernais",
  "Gull Dong",
  "Gull Terrier",
  "H\xE4llefors Elkhound",
  "Hamiltonst\xF6vare",
  "Hanover Hound",
  "Harrier",
  "Havanese",
  "Hierran Wolfdog",
  "Hokkaido",
  "Hovawart",
  "Huntaway",
  "Hygen Hound",
  "Ibizan Hound",
  "Icelandic Sheepdog",
  "Indian pariah dog",
  "Indian Spitz",
  "Irish Red and White Setter",
  "Irish Setter",
  "Irish Terrier",
  "Irish Water Spaniel",
  "Irish Wolfhound",
  "Istrian Coarse-haired Hound",
  "Istrian Shorthaired Hound",
  "Italian Greyhound",
  "Jack Russell Terrier",
  "Jagdterrier",
  "Japanese Chin",
  "Japanese Spitz",
  "Japanese Terrier",
  "Jindo",
  "Jonangi",
  "Kai Ken",
  "Kaikadi",
  "Kangal Shepherd Dog",
  "Kanni",
  "Karakachan dog",
  "Karelian Bear Dog",
  "Kars",
  "Karst Shepherd",
  "Keeshond",
  "Kerry Beagle",
  "Kerry Blue Terrier",
  "King Charles Spaniel",
  "King Shepherd",
  "Kintamani",
  "Kishu",
  "Kokoni",
  "Kombai",
  "Komondor",
  "Kooikerhondje",
  "Koolie",
  "Koyun dog",
  "Kromfohrl\xE4nder",
  "Kuchi",
  "Kuvasz",
  "Labrador Retriever",
  "Lagotto Romagnolo",
  "Lakeland Terrier",
  "Lancashire Heeler",
  "Landseer",
  "Lapponian Herder",
  "Large M\xFCnsterl\xE4nder",
  "Leonberger",
  "Levriero Sardo",
  "Lhasa Apso",
  "Lithuanian Hound",
  "L\xF6wchen",
  "Lupo Italiano",
  "Mackenzie River Husky",
  "Magyar ag\xE1r",
  "Mahratta Greyhound",
  "Maltese",
  "Manchester Terrier",
  "Maremmano-Abruzzese Sheepdog",
  "McNab dog",
  "Miniature American Shepherd",
  "Miniature Bull Terrier",
  "Miniature Fox Terrier",
  "Miniature Pinscher",
  "Miniature Schnauzer",
  "Molossus of Epirus",
  "Montenegrin Mountain Hound",
  "Mountain Cur",
  "Mountain Feist",
  "Mucuchies",
  "Mudhol Hound",
  "Mudi",
  "Neapolitan Mastiff",
  "New Guinea Singing Dog",
  "New Zealand Heading Dog",
  "Newfoundland",
  "Norfolk Terrier",
  "Norrbottenspets",
  "Northern Inuit Dog",
  "Norwegian Buhund",
  "Norwegian Elkhound",
  "Norwegian Lundehund",
  "Norwich Terrier",
  "Nova Scotia Duck Tolling Retriever",
  "Old Croatian Sighthound",
  "Old Danish Pointer",
  "Old English Sheepdog",
  "Old English Terrier",
  "Olde English Bulldogge",
  "Otterhound",
  "Pachon Navarro",
  "Pampas Deerhound",
  "Paisley Terrier",
  "Papillon",
  "Parson Russell Terrier",
  "Pastore della Lessinia e del Lagorai",
  "Patagonian Sheepdog",
  "Patterdale Terrier",
  "Pekingese",
  "Pembroke Welsh Corgi",
  "Perro Majorero",
  "Perro de Pastor Mallorquin",
  "Perro de Presa Canario",
  "Perro de Presa Mallorquin",
  "Peruvian Inca Orchid",
  "Petit Basset Griffon Vend\xE9en",
  "Petit Bleu de Gascogne",
  "Phal\xE8ne",
  "Pharaoh Hound",
  "Phu Quoc Ridgeback",
  "Picardy Spaniel",
  "Plummer Terrier",
  "Plott Hound",
  "Podenco Canario",
  "Podenco Valenciano",
  "Pointer",
  "Poitevin",
  "Polish Greyhound",
  "Polish Hound",
  "Polish Lowland Sheepdog",
  "Polish Tatra Sheepdog",
  "Pomeranian",
  "Pont-Audemer Spaniel",
  "Poodle",
  "Porcelaine",
  "Portuguese Podengo",
  "Portuguese Pointer",
  "Portuguese Water Dog",
  "Posavac Hound",
  "Pra\u017Esk\xFD Krysa\u0159\xEDk",
  "Pshdar Dog",
  "Pudelpointer",
  "Pug",
  "Puli",
  "Pumi",
  "Pungsan Dog",
  "Pyrenean Mastiff",
  "Pyrenean Mountain Dog",
  "Pyrenean Sheepdog",
  "Rafeiro do Alentejo",
  "Rajapalayam",
  "Rampur Greyhound",
  "Rat Terrier",
  "Ratonero Bodeguero Andaluz",
  "Ratonero Mallorquin",
  "Ratonero Murciano de Huerta",
  "Ratonero Valenciano",
  "Redbone Coonhound",
  "Rhodesian Ridgeback",
  "Romanian Mioritic Shepherd Dog",
  "Romanian Raven Shepherd Dog",
  "Rottweiler",
  "Rough Collie",
  "Russian Spaniel",
  "Russian Toy",
  "Russo-European Laika",
  "Saarloos Wolfdog",
  "Sabueso Espa\xF1ol",
  "Saint Bernard",
  "Saint Hubert Jura Hound",
  "Saint-Usuge Spaniel",
  "Saluki",
  "Samoyed",
  "Sapsali",
  "Sarabi dog",
  "\u0160arplaninac",
  "Schapendoes",
  "Schillerst\xF6vare",
  "Schipperke",
  "Schweizer Laufhund",
  "Schweizerischer Niederlaufhund",
  "Scottish Deerhound",
  "Scottish Terrier",
  "Sealyham Terrier",
  "Segugio dell'Appennino",
  "Segugio Italiano",
  "Segugio Maremmano",
  "Seppala Siberian Sleddog",
  "Serbian Hound",
  "Serbian Tricolour Hound",
  "Serrano Bulldog",
  "Shar Pei",
  "Shetland Sheepdog",
  "Shiba Inu",
  "Shih Tzu",
  "Shikoku",
  "Shiloh Shepherd",
  "Siberian Husky",
  "Silken Windhound",
  "Silky Terrier",
  "Sinhala Hound",
  "Skye Terrier",
  "Sloughi",
  "Slovakian Wirehaired Pointer",
  "Slovensk\xFD Cuvac",
  "Slovensk\xFD Kopov",
  "Smalandst\xF6vare",
  "Small Greek domestic dog",
  "Small M\xFCnsterl\xE4nder",
  "Smooth Collie",
  "Smooth Fox Terrier",
  "Soft-Coated Wheaten Terrier",
  "South Russian Ovcharka",
  "Spanish Mastiff",
  "Spanish Water Dog",
  "Spinone Italiano",
  "Sporting Lucas Terrier",
  "Sardinian Shepherd Dog",
  "Stabyhoun",
  "Staffordshire Bull Terrier",
  "Standard Schnauzer",
  "Stephens Stock",
  "Styrian Coarse-haired Hound",
  "Sussex Spaniel",
  "Swedish Elkhound",
  "Swedish Lapphund",
  "Swedish Vallhund",
  "Swedish White Elkhound",
  "Taigan",
  "Taiwan Dog",
  "Tamaskan Dog",
  "Teddy Roosevelt Terrier",
  "Telomian",
  "Tenterfield Terrier",
  "Terrier Brasileiro",
  "Thai Bangkaew Dog",
  "Thai Ridgeback",
  "Tibetan Mastiff",
  "Tibetan Spaniel",
  "Tibetan Terrier",
  "Tornjak",
  "Tosa",
  "Toy Fox Terrier",
  "Toy Manchester Terrier",
  "Transylvanian Hound",
  "Treeing Cur",
  "Treeing Feist",
  "Treeing Tennessee Brindle",
  "Treeing Walker Coonhound",
  "Trigg Hound",
  "Tyrolean Hound",
  "Vikhan",
  "Villano de Las Encartaciones",
  "Villanuco de Las Encartaciones",
  "Vizsla",
  "Volpino Italiano",
  "Weimaraner",
  "Welsh Sheepdog",
  "Welsh Springer Spaniel",
  "Welsh Terrier",
  "West Highland White Terrier",
  "West Siberian Laika",
  "Westphalian Dachsbracke",
  "Wetterhoun",
  "Whippet",
  "White Shepherd",
  "White Swiss Shepherd Dog",
  "Wire Fox Terrier",
  "Wirehaired Pointing Griffon",
  "Wirehaired Vizsla",
  "Xiasi Dog",
  "Xoloitzcuintli",
  "Yakutian Laika",
  "Yorkshire Terrier"
];
const fish = [
  "Grass carp",
  "Peruvian anchoveta",
  "Silver carp",
  "Common carp",
  "Asari",
  "Japanese littleneck",
  "Filipino Venus",
  "Japanese cockle",
  "Alaska pollock",
  "Nile tilapia",
  "Whiteleg shrimp",
  "Bighead carp",
  "Skipjack tuna",
  "Catla",
  "Crucian carp",
  "Atlantic salmon",
  "Atlantic herring",
  "Chub mackerel",
  "Rohu",
  "Yellowfin tuna",
  "Japanese anchovy",
  "Largehead hairtail",
  "Atlantic cod",
  "European pilchard",
  "Capelin",
  "Jumbo flying squid",
  "Milkfish",
  "Atlantic mackerel",
  "Rainbow trout",
  "Araucanian herring",
  "Wuchang bream",
  "Gulf menhaden",
  "Indian oil sardine",
  "Black carp",
  "European anchovy",
  "Northern snakehead",
  "Pacific cod",
  "Pacific saury",
  "Pacific herring",
  "Bigeye tuna",
  "Chilean jack mackerel",
  "Yellow croaker",
  "Haddock",
  "Gazami crab",
  "Amur catfish",
  "Japanese common catfish",
  "European sprat",
  "Pink salmon",
  "Mrigal carp",
  "Channel catfish",
  "Blood cockle",
  "Blue whiting",
  "Hilsa shad",
  "Daggertooth pike conger",
  "California pilchard",
  "Cape horse mackerel",
  "Pacific anchoveta",
  "Japanese flying squid",
  "Pollock",
  "Chinese softshell turtle",
  "Kawakawa",
  "Indian mackerel",
  "Asian swamp eel",
  "Argentine hake",
  "Short mackerel",
  "Southern rough shrimp",
  "Southern African anchovy",
  "Pond loach",
  "Iridescent shark",
  "Mandarin fish",
  "Chinese perch",
  "Nile perch",
  "Round sardinella",
  "Japanese pilchard",
  "Bombay-duck",
  "Yellowhead catfish",
  "Korean bullhead",
  "Narrow-barred Spanish mackerel",
  "Albacore",
  "Madeiran sardinella",
  "Bonga shad",
  "Silver cyprinid",
  "Nile tilapia",
  "Longtail tuna",
  "Atlantic menhaden",
  "North Pacific hake",
  "Atlantic horse mackerel",
  "Japanese jack mackerel",
  "Pacific thread herring",
  "Bigeye scad",
  "Yellowstripe scad",
  "Chum salmon",
  "Blue swimming crab",
  "Pacific sand lance",
  "Pacific sandlance",
  "Goldstripe sardinella"
];
const horse = [
  "American Albino",
  "Abaco Barb",
  "Abtenauer",
  "Abyssinian",
  "Aegidienberger",
  "Akhal-Teke",
  "Albanian Horse",
  "Altai Horse",
  "Alt\xE8r Real",
  "American Cream Draft",
  "American Indian Horse",
  "American Paint Horse",
  "American Quarter Horse",
  "American Saddlebred",
  "American Warmblood",
  "Andalusian Horse",
  "Andravida Horse",
  "Anglo-Arabian",
  "Anglo-Arabo-Sardo",
  "Anglo-Kabarda",
  "Appaloosa",
  "AraAppaloosa",
  "Arabian Horse",
  "Ardennes Horse",
  "Arenberg-Nordkirchen",
  "Argentine Criollo",
  "Asian wild Horse",
  "Assateague Horse",
  "Asturc\xF3n",
  "Augeron",
  "Australian Brumby",
  "Australian Draught Horse",
  "Australian Stock Horse",
  "Austrian Warmblood",
  "Auvergne Horse",
  "Auxois",
  "Azerbaijan Horse",
  "Azteca Horse",
  "Baise Horse",
  "Bale",
  "Balearic Horse",
  "Balikun Horse",
  "Baluchi Horse",
  "Banker Horse",
  "Barb Horse",
  "Bardigiano",
  "Bashkir Curly",
  "Basque Mountain Horse",
  "Bavarian Warmblood",
  "Belgian Half-blood",
  "Belgian Horse",
  "Belgian Warmblood ",
  "Bhutia Horse",
  "Black Forest Horse",
  "Blazer Horse",
  "Boerperd",
  "Borana",
  "Boulonnais Horse",
  "Brabant",
  "Brandenburger",
  "Brazilian Sport Horse",
  "Breton Horse",
  "Brumby",
  "Budyonny Horse",
  "Burguete Horse",
  "Burmese Horse",
  "Byelorussian Harness Horse",
  "Calabrese Horse",
  "Camargue Horse",
  "Camarillo White Horse",
  "Campeiro",
  "Campolina",
  "Canadian Horse",
  "Canadian Pacer",
  "Carolina Marsh Tacky",
  "Carthusian Horse",
  "Caspian Horse",
  "Castilian Horse",
  "Castillonnais",
  "Catria Horse",
  "Cavallo Romano della Maremma Laziale",
  "Cerbat Mustang",
  "Chickasaw Horse",
  "Chilean Corralero",
  "Choctaw Horse",
  "Cleveland Bay",
  "Clydesdale Horse",
  "Cob",
  "Coldblood Trotter",
  "Colonial Spanish Horse",
  "Colorado Ranger",
  "Comtois Horse",
  "Corsican Horse",
  "Costa Rican Saddle Horse",
  "Cretan Horse",
  "Criollo Horse",
  "Croatian Coldblood",
  "Cuban Criollo",
  "Cumberland Island Horse",
  "Curly Horse",
  "Czech Warmblood",
  "Daliboz",
  "Danish Warmblood",
  "Danube Delta Horse",
  "Dole Gudbrandsdal",
  "Don",
  "Dongola Horse",
  "Draft Trotter",
  "Dutch Harness Horse",
  "Dutch Heavy Draft",
  "Dutch Warmblood",
  "Dzungarian Horse",
  "East Bulgarian",
  "East Friesian Horse",
  "Estonian Draft",
  "Estonian Horse",
  "Falabella",
  "Faroese",
  "Finnhorse",
  "Fjord Horse",
  "Fleuve",
  "Florida Cracker Horse",
  "Foutank\xE9",
  "Frederiksborg Horse",
  "Freiberger",
  "French Trotter",
  "Friesian Cross",
  "Friesian Horse",
  "Friesian Sporthorse",
  "Furioso-North Star",
  "Galice\xF1o",
  "Galician Pony",
  "Gelderland Horse",
  "Georgian Grande Horse",
  "German Warmblood",
  "Giara Horse",
  "Gidran",
  "Groningen Horse",
  "Gypsy Horse",
  "Hackney Horse",
  "Haflinger",
  "Hanoverian Horse",
  "Heck Horse",
  "Heihe Horse",
  "Henson Horse",
  "Hequ Horse",
  "Hirzai",
  "Hispano-Bret\xF3n",
  "Holsteiner Horse",
  "Horro",
  "Hungarian Warmblood",
  "Icelandic Horse",
  "Iomud",
  "Irish Draught",
  "Irish Sport Horse sometimes called Irish Hunter",
  "Italian Heavy Draft",
  "Italian Trotter",
  "Jaca Navarra",
  "Jeju Horse",
  "Jutland Horse",
  "Kabarda Horse",
  "Kafa",
  "Kaimanawa Horses",
  "Kalmyk Horse",
  "Karabair",
  "Karabakh Horse",
  "Karachai Horse",
  "Karossier",
  "Kathiawari",
  "Kazakh Horse",
  "Kentucky Mountain Saddle Horse",
  "Kiger Mustang",
  "Kinsky Horse",
  "Kisber Felver",
  "Kiso Horse",
  "Kladruber",
  "Knabstrupper",
  "Konik",
  "Kundudo",
  "Kustanair",
  "Kyrgyz Horse",
  "Latvian Horse",
  "Lipizzan",
  "Lithuanian Heavy Draught",
  "Lokai",
  "Losino Horse",
  "Lusitano",
  "Lyngshest",
  "M'Bayar",
  "M'Par",
  "Mallorqu\xEDn",
  "Malopolski",
  "Mangalarga",
  "Mangalarga Marchador",
  "Maremmano",
  "Marisme\xF1o Horse",
  "Marsh Tacky",
  "Marwari Horse",
  "Mecklenburger",
  "Me\u0111imurje Horse",
  "Menorqu\xEDn",
  "M\xE9rens Horse",
  "Messara Horse",
  "Metis Trotter",
  "Mez\u0151hegyesi Sport Horse",
  "Miniature Horse",
  "Misaki Horse",
  "Missouri Fox Trotter",
  "Monchina",
  "Mongolian Horse",
  "Mongolian Wild Horse",
  "Monterufolino",
  "Morab",
  "Morgan Horse",
  "Mountain Pleasure Horse",
  "Moyle Horse",
  "Murakoz Horse",
  "Murgese",
  "Mustang Horse",
  "Namib Desert Horse",
  "Nangchen Horse",
  "National Show Horse",
  "Nez Perce Horse",
  "Nivernais Horse",
  "Nokota Horse",
  "Noma",
  "Nonius Horse",
  "Nooitgedachter",
  "Nordlandshest",
  "Noriker Horse",
  "Norman Cob",
  "North American Single-Footer Horse",
  "North Swedish Horse",
  "Norwegian Coldblood Trotter",
  "Norwegian Fjord",
  "Novokirghiz",
  "Oberlander Horse",
  "Ogaden",
  "Oldenburg Horse",
  "Orlov trotter",
  "Ostfriesen",
  "Paint",
  "Pampa Horse",
  "Paso Fino",
  "Pentro Horse",
  "Percheron",
  "Persano Horse",
  "Peruvian Paso",
  "Pintabian",
  "Pleven Horse",
  "Poitevin Horse",
  "Posavac Horse",
  "Pottok",
  "Pryor Mountain Mustang",
  "Przewalski's Horse",
  "Pura Raza Espa\xF1ola",
  "Purosangue Orientale",
  "Qatgani",
  "Quarab",
  "Quarter Horse",
  "Racking Horse",
  "Retuerta Horse",
  "Rhenish German Coldblood",
  "Rhinelander Horse",
  "Riwoche Horse",
  "Rocky Mountain Horse",
  "Romanian Sporthorse",
  "Rottaler",
  "Russian Don",
  "Russian Heavy Draft",
  "Russian Trotter",
  "Saddlebred",
  "Salerno Horse",
  "Samolaco Horse",
  "San Fratello Horse",
  "Sarcidano Horse",
  "Sardinian Anglo-Arab",
  "Schleswig Coldblood",
  "Schwarzw\xE4lder Kaltblut",
  "Selale",
  "Sella Italiano",
  "Selle Fran\xE7ais",
  "Shagya Arabian",
  "Shan Horse",
  "Shire Horse",
  "Siciliano Indigeno",
  "Silesian Horse",
  "Sokolsky Horse",
  "Sorraia",
  "South German Coldblood",
  "Soviet Heavy Draft",
  "Spanish Anglo-Arab",
  "Spanish Barb",
  "Spanish Jennet Horse",
  "Spanish Mustang",
  "Spanish Tarpan",
  "Spanish-Norman Horse",
  "Spiti Horse",
  "Spotted Saddle Horse",
  "Standardbred Horse",
  "Suffolk Punch",
  "Swedish Ardennes",
  "Swedish coldblood trotter",
  "Swedish Warmblood",
  "Swiss Warmblood",
  "Taish\u016B Horse",
  "Takhi",
  "Tawleed",
  "Tchernomor",
  "Tennessee Walking Horse",
  "Tersk Horse",
  "Thoroughbred",
  "Tiger Horse",
  "Tinker Horse",
  "Tolfetano",
  "Tori Horse",
  "Trait Du Nord",
  "Trakehner",
  "Tsushima",
  "Tuigpaard",
  "Ukrainian Riding Horse",
  "Unmol Horse",
  "Uzunyayla",
  "Ventasso Horse",
  "Virginia Highlander",
  "Vlaamperd",
  "Vladimir Heavy Draft",
  "Vyatka",
  "Waler",
  "Waler Horse",
  "Walkaloosa",
  "Warlander",
  "Warmblood",
  "Welsh Cob",
  "Westphalian Horse",
  "Wielkopolski",
  "W\xFCrttemberger",
  "Xilingol Horse",
  "Yakutian Horse",
  "Yili Horse",
  "Yonaguni Horse",
  "Zaniskari",
  "\u017Demaitukas",
  "Zhemaichu",
  "Zweibr\xFCcker"
];
const insect = [
  "Acacia-ants",
  "Acorn-plum gall",
  "Aerial yellowjacket",
  "Africanized honey bee",
  "Allegheny mound ant",
  "Almond stone wasp",
  "Ant",
  "Arboreal ant",
  "Argentine ant",
  "Asian paper wasp",
  "Baldfaced hornet",
  "Bee",
  "Bigheaded ant",
  "Black and yellow mud dauber",
  "Black carpenter ant",
  "Black imported fire ant",
  "Blue horntail woodwasp",
  "Blue orchard bee",
  "Braconid wasp",
  "Bumble bee",
  "Carpenter ant",
  "Carpenter wasp",
  "Chalcid wasp",
  "Cicada killer",
  "Citrus blackfly parasitoid",
  "Common paper wasp",
  "Crazy ant",
  "Cuckoo wasp",
  "Cynipid gall wasp",
  "Eastern Carpenter bee",
  "Eastern yellowjacket",
  "Elm sawfly",
  "Encyrtid wasp",
  "Erythrina gall wasp",
  "Eulophid wasp",
  "European hornet",
  "European imported fire ant",
  "False honey ant",
  "Fire ant",
  "Forest bachac",
  "Forest yellowjacket",
  "German yellowjacket",
  "Ghost ant",
  "Giant ichneumon wasp",
  "Giant resin bee",
  "Giant wood wasp",
  "Golden northern bumble bee",
  "Golden paper wasp",
  "Gouty oak gall",
  "Grass Carrying Wasp",
  "Great black wasp",
  "Great golden digger wasp",
  "Hackberry nipple gall parasitoid",
  "Honey bee",
  "Horned oak gall",
  "Horse guard wasp",
  "Horse guard wasp",
  "Hunting wasp",
  "Ichneumonid wasp",
  "Keyhole wasp",
  "Knopper gall",
  "Large garden bumble bee",
  "Large oak-apple gall",
  "Leafcutting bee",
  "Little fire ant",
  "Little yellow ant",
  "Long-horned bees",
  "Long-legged ant",
  "Macao paper wasp",
  "Mallow bee",
  "Marble gall",
  "Mossyrose gall wasp",
  "Mud-daubers",
  "Multiflora rose seed chalcid",
  "Oak apple gall wasp",
  "Oak rough bulletgall wasp",
  "Oak saucer gall",
  "Oak shoot sawfly",
  "Odorous house ant",
  "Orange-tailed bumble bee",
  "Orangetailed potter wasp",
  "Oriental chestnut gall wasp",
  "Paper wasp",
  "Pavement ant",
  "Pigeon tremex",
  "Pip gall wasp",
  "Prairie yellowjacket",
  "Pteromalid wasp",
  "Pyramid ant",
  "Raspberry Horntail",
  "Red ant",
  "Red carpenter ant",
  "Red harvester ant",
  "Red imported fire ant",
  "Red wasp",
  "Red wood ant",
  "Red-tailed wasp",
  "Reddish carpenter ant",
  "Rough harvester ant",
  "Sawfly parasitic wasp",
  "Scale parasitoid",
  "Silky ant",
  "Sirex woodwasp",
  "Siricid woodwasp",
  "Smaller yellow ant",
  "Southeastern blueberry bee",
  "Southern fire ant",
  "Southern yellowjacket",
  "Sphecid wasp",
  "Stony gall",
  "Sweat bee",
  "Texas leafcutting ant",
  "Tiphiid wasp",
  "Torymid wasp",
  "Tramp ant",
  "Valentine ant",
  "Velvet ant",
  "Vespid wasp",
  "Weevil parasitoid",
  "Western harvester ant",
  "Western paper wasp",
  "Western thatching ant",
  "Western yellowjacket",
  "White-horned horntail",
  "Willow shoot sawfly",
  "Woodwasp",
  "Wool sower gall maker",
  "Yellow and black potter wasp",
  "Yellow Crazy Ant",
  "Yellow-horned horntail"
];
const lion = [
  "Asiatic Lion",
  "Barbary Lion",
  "West African Lion",
  "Northeast Congo Lion",
  "Masai Lion",
  "Transvaal lion",
  "Cape lion"
];
const rabbit = [
  "American",
  "American Chinchilla",
  "American Fuzzy Lop",
  "American Sable",
  "Argente Brun",
  "Belgian Hare",
  "Beveren",
  "Blanc de Hotot",
  "Britannia Petite",
  "Californian",
  "Champagne D\u2019Argent",
  "Checkered Giant",
  "Cinnamon",
  "Cr\xE8me D\u2019Argent",
  "Dutch",
  "Dwarf Hotot",
  "English Angora",
  "English Lop",
  "English Spot",
  "Flemish Giant",
  "Florida White",
  "French Angora",
  "French Lop",
  "Giant Angora",
  "Giant Chinchilla",
  "Harlequin",
  "Havana",
  "Himalayan",
  "Holland Lop",
  "Jersey Wooly",
  "Lilac",
  "Lionhead",
  "Mini Lop",
  "Mini Rex",
  "Mini Satin",
  "Netherland Dwarf",
  "New Zealand",
  "Palomino",
  "Polish",
  "Rex",
  "Rhinelander",
  "Satin",
  "Satin Angora",
  "Silver",
  "Silver Fox",
  "Silver Marten",
  "Standard Chinchilla",
  "Tan",
  "Thrianta"
];
const snake = [
  "Viper Adder",
  "Common adder",
  "Death Adder",
  "Desert death adder",
  "Horned adder",
  "Long-nosed adder",
  "Many-horned adder",
  "Mountain adder",
  "Mud adder",
  "Namaqua dwarf adder",
  "Nightingale adder",
  "Peringuey's adder",
  "Puff adder",
  "African puff adder",
  "Rhombic night adder",
  "Sand adder",
  "Dwarf sand adder",
  "Namib dwarf sand adder",
  "Water adder",
  "Aesculapian snake",
  "Anaconda",
  "Bolivian anaconda",
  "De Schauensee's anaconda",
  "Green anaconda",
  "Yellow anaconda",
  "Arafura file snake",
  "Asp",
  "European asp",
  "Egyptian asp",
  "African beaked snake",
  "Ball Python",
  "Bird snake",
  "Black-headed snake",
  "Mexican black kingsnake",
  "Black rat snake",
  "Black snake",
  "Red-bellied black snake",
  "Blind snake",
  "Brahminy blind snake",
  "Texas blind snake",
  "Western blind snake",
  "Boa",
  "Abaco Island boa",
  "Amazon tree boa",
  "Boa constrictor",
  "Cuban boa",
  "Dumeril's boa",
  "Dwarf boa",
  "Emerald tree boa",
  "Hogg Island boa",
  "Jamaican boa",
  "Madagascar ground boa",
  "Madagascar tree boa",
  "Puerto Rican boa",
  "Rainbow boa",
  "Red-tailed boa",
  "Rosy boa",
  "Rubber boa",
  "Sand boa",
  "Tree boa",
  "Boiga",
  "Boomslang",
  "Brown snake",
  "Eastern brown snake",
  "Bull snake",
  "Bushmaster",
  "Dwarf beaked snake",
  "Rufous beaked snake",
  "Canebrake",
  "Cantil",
  "Cascabel",
  "Cat-eyed snake",
  "Banded cat-eyed snake",
  "Green cat-eyed snake",
  "Cat snake",
  "Andaman cat snake",
  "Beddome's cat snake",
  "Dog-toothed cat snake",
  "Forsten's cat snake",
  "Gold-ringed cat snake",
  "Gray cat snake",
  "Many-spotted cat snake",
  "Tawny cat snake",
  "Chicken snake",
  "Coachwhip snake",
  "Cobra",
  "Andaman cobra",
  "Arabian cobra",
  "Asian cobra",
  "Banded water cobra",
  "Black-necked cobra",
  "Black-necked spitting cobra",
  "Black tree cobra",
  "Burrowing cobra",
  "Cape cobra",
  "Caspian cobra",
  "Congo water cobra",
  "Common cobra",
  "Eastern water cobra",
  "Egyptian cobra",
  "Equatorial spitting cobra",
  "False cobra",
  "False water cobra",
  "Forest cobra",
  "Gold tree cobra",
  "Indian cobra",
  "Indochinese spitting cobra",
  "Javan spitting cobra",
  "King cobra",
  "Mandalay cobra",
  "Mozambique spitting cobra",
  "North Philippine cobra",
  "Nubian spitting cobra",
  "Philippine cobra",
  "Red spitting cobra",
  "Rinkhals cobra",
  "Shield-nosed cobra",
  "Sinai desert cobra",
  "Southern Indonesian spitting cobra",
  "Southern Philippine cobra",
  "Southwestern black spitting cobra",
  "Snouted cobra",
  "Spectacled cobra",
  "Spitting cobra",
  "Storm water cobra",
  "Thai cobra",
  "Taiwan cobra",
  "Zebra spitting cobra",
  "Collett's snake",
  "Congo snake",
  "Copperhead",
  "American copperhead",
  "Australian copperhead",
  "Coral snake",
  "Arizona coral snake",
  "Beddome's coral snake",
  "Brazilian coral snake",
  "Cape coral snake",
  "Harlequin coral snake",
  "High Woods coral snake",
  "Malayan long-glanded coral snake",
  "Texas Coral Snake",
  "Western coral snake",
  "Corn snake",
  "South eastern corn snake",
  "Cottonmouth",
  "Crowned snake",
  "Cuban wood snake",
  "Eastern hognose snake",
  "Egg-eater",
  "Eastern coral snake",
  "Fer-de-lance",
  "Fierce snake",
  "Fishing snake",
  "Flying snake",
  "Golden tree snake",
  "Indian flying snake",
  "Moluccan flying snake",
  "Ornate flying snake",
  "Paradise flying snake",
  "Twin-Barred tree snake",
  "Banded Flying Snake",
  "Fox snake, three species of Pantherophis",
  "Forest flame snake",
  "Garter snake",
  "Checkered garter snake",
  "Common garter snake",
  "San Francisco garter snake",
  "Texas garter snake",
  "Cape gopher snake",
  "Grass snake",
  "Green snake",
  "Rough green snake",
  "Smooth green snake",
  "Ground snake",
  "Common ground snake",
  "Three-lined ground snake",
  "Western ground snake",
  "Habu",
  "Hognose snake",
  "Blonde hognose snake",
  "Dusty hognose snake",
  "Eastern hognose snake",
  "Jan's hognose snake",
  "Giant Malagasy hognose snake",
  "Mexican hognose snake",
  "South American hognose snake",
  "Hundred pacer",
  "Ikaheka snake",
  "Indigo snake",
  "Jamaican Tree Snake",
  "Keelback",
  "Asian keelback",
  "Assam keelback",
  "Black-striped keelback",
  "Buff striped keelback",
  "Burmese keelback",
  "Checkered keelback",
  "Common keelback",
  "Hill keelback",
  "Himalayan keelback",
  "Khasi Hills keelback",
  "Modest keelback",
  "Nicobar Island keelback",
  "Nilgiri keelback",
  "Orange-collared keelback",
  "Red-necked keelback",
  "Sikkim keelback",
  "Speckle-bellied keelback",
  "White-lipped keelback",
  "Wynaad keelback",
  "Yunnan keelback",
  "King brown",
  "King cobra",
  "King snake",
  "California kingsnake",
  "Desert kingsnake",
  "Grey-banded kingsnake",
  "North eastern king snake",
  "Prairie kingsnake",
  "Scarlet kingsnake",
  "Speckled kingsnake",
  "Krait",
  "Banded krait",
  "Blue krait",
  "Black krait",
  "Burmese krait",
  "Ceylon krait",
  "Indian krait",
  "Lesser black krait",
  "Malayan krait",
  "Many-banded krait",
  "Northeastern hill krait",
  "Red-headed krait",
  "Sind krait",
  "Large shield snake",
  "Lancehead",
  "Common lancehead",
  "Lora",
  "Grey Lora",
  "Lyre snake",
  "Baja California lyresnake",
  "Central American lyre snake",
  "Texas lyre snake",
  "Eastern lyre snake",
  "Machete savane",
  "Mamba",
  "Black mamba",
  "Green mamba",
  "Eastern green mamba",
  "Western green mamba",
  "Mamushi",
  "Mangrove snake",
  "Milk snake",
  "Moccasin snake",
  "Montpellier snake",
  "Mud snake",
  "Eastern mud snake",
  "Western mud snake",
  "Mussurana",
  "Night snake",
  "Cat-eyed night snake",
  "Texas night snake",
  "Nichell snake",
  "Narrowhead Garter Snake",
  "Nose-horned viper",
  "Rhinoceros viper",
  "Vipera ammodytes",
  "Parrot snake",
  "Mexican parrot snake",
  "Patchnose snake",
  "Perrotet's shieldtail snake",
  "Pine snake",
  "Pipe snake",
  "Asian pipe snake",
  "Dwarf pipe snake",
  "Red-tailed pipe snake",
  "Python",
  "African rock python",
  "Amethystine python",
  "Angolan python",
  "Australian scrub python",
  "Ball python",
  "Bismarck ringed python",
  "Black headed python",
  "Blood python",
  "Boelen python",
  "Borneo short-tailed python",
  "Bredl's python",
  "Brown water python",
  "Burmese python",
  "Calabar python",
  "Western carpet python",
  "Centralian carpet python",
  "Coastal carpet python",
  "Inland carpet python",
  "Jungle carpet python",
  "New Guinea carpet python",
  "Northwestern carpet python",
  "Southwestern carpet python",
  "Children's python",
  "Dauan Island water python",
  "Desert woma python",
  "Diamond python",
  "Flinders python",
  "Green tree python",
  "Halmahera python",
  "Indian python",
  "Indonesian water python",
  "Macklot's python",
  "Mollucan python",
  "Oenpelli python",
  "Olive python",
  "Papuan python",
  "Pygmy python",
  "Red blood python",
  "Reticulated python",
  "Kayaudi dwarf reticulated python",
  "Selayer reticulated python",
  "Rough-scaled python",
  "Royal python",
  "Savu python",
  "Spotted python",
  "Stimson's python",
  "Sumatran short-tailed python",
  "Tanimbar python",
  "Timor python",
  "Wetar Island python",
  "White-lipped python",
  "Brown white-lipped python",
  "Northern white-lipped python",
  "Southern white-lipped python",
  "Woma python",
  "Western woma python",
  "Queen snake",
  "Racer",
  "Bimini racer",
  "Buttermilk racer",
  "Eastern racer",
  "Eastern yellowbelly sad racer",
  "Mexican racer",
  "Southern black racer",
  "Tan racer",
  "West Indian racer",
  "Raddysnake",
  "Southwestern blackhead snake",
  "Rat snake",
  "Baird's rat snake",
  "Beauty rat snake",
  "Great Plains rat snake",
  "Green rat snake",
  "Japanese forest rat snake",
  "Japanese rat snake",
  "King rat snake",
  "Mandarin rat snake",
  "Persian rat snake",
  "Red-backed rat snake",
  "Twin-spotted rat snake",
  "Yellow-striped rat snake",
  "Manchurian Black Water Snake",
  "Rattlesnake",
  "Arizona black rattlesnake",
  "Aruba rattlesnake",
  "Chihuahuan ridge-nosed rattlesnake",
  "Coronado Island rattlesnake",
  "Durango rock rattlesnake",
  "Dusky pigmy rattlesnake",
  "Eastern diamondback rattlesnake",
  "Grand Canyon rattlesnake",
  "Great Basin rattlesnake",
  "Hopi rattlesnake",
  "Lance-headed rattlesnake",
  "Long-tailed rattlesnake",
  "Massasauga rattlesnake",
  "Mexican green rattlesnake",
  "Mexican west coast rattlesnake",
  "Midget faded rattlesnake",
  "Mojave rattlesnake",
  "Northern black-tailed rattlesnake",
  "Oaxacan small-headed rattlesnake",
  "Rattler",
  "Red diamond rattlesnake",
  "Southern Pacific rattlesnake",
  "Southwestern speckled rattlesnake",
  "Tancitaran dusky rattlesnake",
  "Tiger rattlesnake",
  "Timber rattlesnake",
  "Tropical rattlesnake",
  "Twin-spotted rattlesnake",
  "Uracoan rattlesnake",
  "Western diamondback rattlesnake",
  "Ribbon snake",
  "Rinkhals",
  "River jack",
  "Sea snake",
  "Annulated sea snake",
  "Beaked sea snake",
  "Dubois's sea snake",
  "Hardwicke's sea snake",
  "Hook Nosed Sea Snake",
  "Olive sea snake",
  "Pelagic sea snake",
  "Stoke's sea snake",
  "Yellow-banded sea snake",
  "Yellow-bellied sea snake",
  "Yellow-lipped sea snake",
  "Shield-tailed snake",
  "Sidewinder",
  "Colorado desert sidewinder",
  "Mojave desert sidewinder",
  "Sonoran sidewinder",
  "Small-eyed snake",
  "Smooth snake",
  "Brazilian smooth snake",
  "European smooth snake",
  "Stiletto snake",
  "Striped snake",
  "Japanese striped snake",
  "Sunbeam snake",
  "Taipan",
  "Central ranges taipan",
  "Coastal taipan",
  "Inland taipan",
  "Paupan taipan",
  "Tentacled snake",
  "Tic polonga",
  "Tiger snake",
  "Chappell Island tiger snake",
  "Common tiger snake",
  "Down's tiger snake",
  "Eastern tiger snake",
  "King Island tiger snake",
  "Krefft's tiger snake",
  "Peninsula tiger snake",
  "Tasmanian tiger snake",
  "Western tiger snake",
  "Tigre snake",
  "Tree snake",
  "Blanding's tree snake",
  "Blunt-headed tree snake",
  "Brown tree snake",
  "Long-nosed tree snake",
  "Many-banded tree snake",
  "Northern tree snake",
  "Trinket snake",
  "Black-banded trinket snake",
  "Twig snake",
  "African twig snake",
  "Twin Headed King Snake",
  "Titanboa",
  "Urutu",
  "Vine snake",
  "Asian Vine Snake, Whip Snake",
  "American Vine Snake",
  "Mexican vine snake",
  "Viper",
  "Asp viper",
  "Bamboo viper",
  "Bluntnose viper",
  "Brazilian mud Viper",
  "Burrowing viper",
  "Bush viper",
  "Great Lakes bush viper",
  "Hairy bush viper",
  "Nitsche's bush viper",
  "Rough-scaled bush viper",
  "Spiny bush viper",
  "Carpet viper",
  "Crossed viper",
  "Cyclades blunt-nosed viper",
  "Eyelash viper",
  "False horned viper",
  "Fea's viper",
  "Fifty pacer",
  "Gaboon viper",
  "Hognosed viper",
  "Horned desert viper",
  "Horned viper",
  "Jumping viper",
  "Kaznakov's viper",
  "Leaf-nosed viper",
  "Leaf viper",
  "Levant viper",
  "Long-nosed viper",
  "McMahon's viper",
  "Mole viper",
  "Nose-horned viper",
  "Rhinoceros viper",
  "Vipera ammodytes",
  "Palestine viper",
  "Pallas' viper",
  "Palm viper",
  "Amazonian palm viper",
  "Black-speckled palm-pitviper",
  "Eyelash palm-pitviper",
  "Green palm viper",
  "Mexican palm-pitviper",
  "Guatemalan palm viper",
  "Honduran palm viper",
  "Siamese palm viper",
  "Side-striped palm-pitviper",
  "Yellow-lined palm viper",
  "Pit viper",
  "Banded pitviper",
  "Bamboo pitviper",
  "Barbour's pit viper",
  "Black-tailed horned pit viper",
  "Bornean pitviper",
  "Brongersma's pitviper",
  "Brown spotted pitviper[4]",
  "Cantor's pitviper",
  "Elegant pitviper",
  "Eyelash pit viper",
  "Fan-Si-Pan horned pitviper",
  "Flat-nosed pitviper",
  "Godman's pit viper",
  "Green tree pit viper",
  "Habu pit viper",
  "Hagen's pitviper",
  "Horseshoe pitviper",
  "Jerdon's pitviper",
  "Kanburian pit viper",
  "Kaulback's lance-headed pitviper",
  "Kham Plateau pitviper",
  "Large-eyed pitviper",
  "Malabar rock pitviper",
  "Malayan pit viper",
  "Mangrove pit viper",
  "Mangshan pitviper",
  "Motuo bamboo pitviper",
  "Nicobar bamboo pitviper",
  "Philippine pitviper",
  "Pointed-scaled pit viper[5]",
  "Red-tailed bamboo pitviper",
  "Schultze's pitviper",
  "Stejneger's bamboo pitviper",
  "Sri Lankan pit viper",
  "Temple pit viper",
  "Tibetan bamboo pitviper",
  "Tiger pit viper",
  "Undulated pit viper",
  "Wagler's pit viper",
  "Wirot's pit viper",
  "Portuguese viper",
  "Saw-scaled viper",
  "Schlegel's viper",
  "Sedge viper",
  "Sharp-nosed viper",
  "Snorkel viper",
  "Temple viper",
  "Tree viper",
  "Chinese tree viper",
  "Guatemalan tree viper",
  "Hutton's tree viper",
  "Indian tree viper",
  "Large-scaled tree viper",
  "Malcolm's tree viper",
  "Nitsche's tree viper",
  "Pope's tree viper",
  "Rough-scaled tree viper",
  "Rungwe tree viper",
  "Sumatran tree viper",
  "White-lipped tree viper",
  "Ursini's viper",
  "Western hog-nosed viper",
  "Wart snake",
  "Water moccasin",
  "Water snake",
  "Bocourt's water snake",
  "Northern water snake",
  "Whip snake",
  "Long-nosed whip snake",
  "Wolf snake",
  "African wolf snake",
  "Barred wolf snake",
  "Worm snake",
  "Common worm snake",
  "Longnosed worm snake",
  "Wutu",
  "Yarara",
  "Zebra snake"
];
const type_$2 = [
  "dog",
  "cat",
  "snake",
  "bear",
  "lion",
  "cetacean",
  "insect",
  "crocodilia",
  "cow",
  "bird",
  "fish",
  "rabbit",
  "horse"
];
const animal = {
  bear,
  bird,
  cat,
  cetacean,
  cow,
  crocodilia,
  dog,
  fish,
  horse,
  insect,
  lion,
  rabbit,
  snake,
  type: type_$2
};
const author = ["{{name.name}}", "{{company.name}}"];
const name_$3 = [
  "Redhold",
  "Treeflex",
  "Trippledex",
  "Kanlam",
  "Bigtax",
  "Daltfresh",
  "Toughjoyfax",
  "Mat Lam Tam",
  "Otcom",
  "Tres-Zap",
  "Y-Solowarm",
  "Tresom",
  "Voltsillam",
  "Biodex",
  "Greenlam",
  "Viva",
  "Matsoft",
  "Temp",
  "Zoolab",
  "Subin",
  "Rank",
  "Job",
  "Stringtough",
  "Tin",
  "It",
  "Home Ing",
  "Zamit",
  "Sonsing",
  "Konklab",
  "Alpha",
  "Latlux",
  "Voyatouch",
  "Alphazap",
  "Holdlamis",
  "Zaam-Dox",
  "Sub-Ex",
  "Quo Lux",
  "Bamity",
  "Ventosanzap",
  "Lotstring",
  "Hatity",
  "Tempsoft",
  "Overhold",
  "Fixflex",
  "Konklux",
  "Zontrax",
  "Tampflex",
  "Span",
  "Namfix",
  "Transcof",
  "Stim",
  "Fix San",
  "Sonair",
  "Stronghold",
  "Fintone",
  "Y-find",
  "Opela",
  "Lotlux",
  "Ronstring",
  "Zathin",
  "Duobam",
  "Keylex"
];
const version = ["0.#.#", "0.##", "#.##", "#.#", "#.#.#"];
const app = {
  author,
  name: name_$3,
  version
};
const credit_card_expiry_dates = ["2011-10-12", "2012-11-12", "2015-11-11", "2013-9-12"];
const credit_card_numbers = [
  "1234-2121-1221-1211",
  "1212-1221-1121-1234",
  "1211-1221-1234-2201",
  "1228-1221-1221-1431"
];
const credit_card_types = ["visa", "mastercard", "americanexpress", "discover"];
const business = {
  credit_card_expiry_dates,
  credit_card_numbers,
  credit_card_types
};
const formats$1 = [
  "###-###-####",
  "(###) ###-####",
  "1-###-###-####",
  "###.###.####"
];
const cell_phone = {
  formats: formats$1
};
const human = [
  "red",
  "green",
  "blue",
  "yellow",
  "purple",
  "mint green",
  "teal",
  "white",
  "black",
  "orange",
  "pink",
  "grey",
  "maroon",
  "violet",
  "turquoise",
  "tan",
  "sky blue",
  "salmon",
  "plum",
  "orchid",
  "olive",
  "magenta",
  "lime",
  "ivory",
  "indigo",
  "gold",
  "fuchsia",
  "cyan",
  "azure",
  "lavender",
  "silver"
];
const space = [
  "CIE 1931 XYZ",
  "CIEUVW",
  "Uniform Color Spaces (UCSs)",
  "CIELUV",
  "CIELAB",
  "HSLuv",
  "sRGB",
  "Adobe RGB",
  "Adobe Wide Gamut RGB",
  "Rec. 2100",
  "ProPhoto RGB Color Space",
  "scRGB",
  "DCI-P3",
  "Display-P3",
  "Rec. 601",
  "Rec. 709",
  "Academy Color Encoding System (ACES)",
  "Rec. 2020",
  "YPbPr",
  "YDbDr",
  "YIQ",
  "xvYCC",
  "sYCC",
  "HSV",
  "HSL",
  "HWB",
  "RGBA",
  "HSLA",
  "LCh",
  "CMY",
  "CMYK",
  "Munsell Color System",
  "Natural Color System (NSC)",
  "Pantone Matching System (PMS)",
  "RAL",
  "Federal Standard 595C",
  "British Standard Colour (BS)",
  "HKS",
  "LMS",
  "RG",
  "RGK"
];
const color = {
  human,
  space
};
const department = [
  "Books",
  "Movies",
  "Music",
  "Games",
  "Electronics",
  "Computers",
  "Home",
  "Garden",
  "Tools",
  "Grocery",
  "Health",
  "Beauty",
  "Toys",
  "Kids",
  "Baby",
  "Clothing",
  "Shoes",
  "Jewelery",
  "Sports",
  "Outdoors",
  "Automotive",
  "Industrial"
];
const product_description = [
  "Ergonomic executive chair upholstered in bonded black leather and PVC padded seat and back for all-day comfort and support",
  "The automobile layout consists of a front-engine design, with transaxle-type transmissions mounted at the rear of the engine and four wheel drive",
  "New ABC 13 9370, 13.3, 5th Gen CoreA5-8250U, 8GB RAM, 256GB SSD, power UHD Graphics, OS 10 Home, OS Office A & J 2016",
  "The slim & simple Maple Gaming Keyboard from Dev Byte comes with a sleek body and 7- Color RGB LED Back-lighting for smart functionality",
  "The Apollotech B340 is an affordable wireless mouse with reliable connectivity, 12 months battery life and modern design",
  "The Nagasaki Lander is the trademarked name of several series of Nagasaki sport bikes, that started with the 1984 ABC800J",
  "The Football Is Good For Training And Recreational Purposes",
  "Carbonite web goalkeeper gloves are ergonomically designed to give easy fit",
  "Boston's most advanced compression wear technology increases muscle oxygenation, stabilizes active muscles",
  "New range of formal shirts are designed keeping you in mind. With fits and styling that will make you stand apart",
  "The beautiful range of Apple Natural\xE9 that has an exciting mix of natural ingredients. With the Goodness of 100% Natural Ingredients",
  "Andy shoes are designed to keeping in mind durability as well as trends, the most stylish range of shoes & sandals"
];
const product_name = {
  adjective: [
    "Small",
    "Ergonomic",
    "Electronic",
    "Rustic",
    "Intelligent",
    "Gorgeous",
    "Incredible",
    "Elegant",
    "Fantastic",
    "Practical",
    "Modern",
    "Recycled",
    "Sleek",
    "Bespoke",
    "Awesome",
    "Generic",
    "Handcrafted",
    "Handmade",
    "Oriental",
    "Licensed",
    "Luxurious",
    "Refined",
    "Unbranded",
    "Tasty"
  ],
  material: [
    "Steel",
    "Bronze",
    "Wooden",
    "Concrete",
    "Plastic",
    "Cotton",
    "Granite",
    "Rubber",
    "Metal",
    "Soft",
    "Fresh",
    "Frozen"
  ],
  product: [
    "Chair",
    "Car",
    "Computer",
    "Keyboard",
    "Mouse",
    "Bike",
    "Ball",
    "Gloves",
    "Pants",
    "Shirt",
    "Table",
    "Shoes",
    "Hat",
    "Towels",
    "Soap",
    "Tuna",
    "Chicken",
    "Fish",
    "Cheese",
    "Bacon",
    "Pizza",
    "Salad",
    "Sausages",
    "Chips"
  ]
};
const commerce = {
  department,
  product_description,
  product_name
};
const adjective$2 = [
  "Adaptive",
  "Advanced",
  "Ameliorated",
  "Assimilated",
  "Automated",
  "Balanced",
  "Business-focused",
  "Centralized",
  "Cloned",
  "Compatible",
  "Configurable",
  "Cross-group",
  "Cross-platform",
  "Customer-focused",
  "Customizable",
  "Decentralized",
  "De-engineered",
  "Devolved",
  "Digitized",
  "Distributed",
  "Diverse",
  "Down-sized",
  "Enhanced",
  "Enterprise-wide",
  "Ergonomic",
  "Exclusive",
  "Expanded",
  "Extended",
  "Face to face",
  "Focused",
  "Front-line",
  "Fully-configurable",
  "Function-based",
  "Fundamental",
  "Future-proofed",
  "Grass-roots",
  "Horizontal",
  "Implemented",
  "Innovative",
  "Integrated",
  "Intuitive",
  "Inverse",
  "Managed",
  "Mandatory",
  "Monitored",
  "Multi-channelled",
  "Multi-lateral",
  "Multi-layered",
  "Multi-tiered",
  "Networked",
  "Object-based",
  "Open-architected",
  "Open-source",
  "Operative",
  "Optimized",
  "Optional",
  "Organic",
  "Organized",
  "Persevering",
  "Persistent",
  "Phased",
  "Polarised",
  "Pre-emptive",
  "Proactive",
  "Profit-focused",
  "Profound",
  "Programmable",
  "Progressive",
  "Public-key",
  "Quality-focused",
  "Reactive",
  "Realigned",
  "Re-contextualized",
  "Re-engineered",
  "Reduced",
  "Reverse-engineered",
  "Right-sized",
  "Robust",
  "Seamless",
  "Secured",
  "Self-enabling",
  "Sharable",
  "Stand-alone",
  "Streamlined",
  "Switchable",
  "Synchronised",
  "Synergistic",
  "Synergized",
  "Team-oriented",
  "Total",
  "Triple-buffered",
  "Universal",
  "Up-sized",
  "Upgradable",
  "User-centric",
  "User-friendly",
  "Versatile",
  "Virtual",
  "Visionary",
  "Vision-oriented"
];
const bs_adjective = [
  "clicks-and-mortar",
  "value-added",
  "vertical",
  "proactive",
  "robust",
  "revolutionary",
  "scalable",
  "leading-edge",
  "innovative",
  "intuitive",
  "strategic",
  "e-business",
  "mission-critical",
  "sticky",
  "one-to-one",
  "24/7",
  "end-to-end",
  "global",
  "B2B",
  "B2C",
  "granular",
  "frictionless",
  "virtual",
  "viral",
  "dynamic",
  "24/365",
  "best-of-breed",
  "killer",
  "magnetic",
  "bleeding-edge",
  "web-enabled",
  "interactive",
  "dot-com",
  "sexy",
  "back-end",
  "real-time",
  "efficient",
  "front-end",
  "distributed",
  "seamless",
  "extensible",
  "turn-key",
  "world-class",
  "open-source",
  "cross-platform",
  "cross-media",
  "synergistic",
  "bricks-and-clicks",
  "out-of-the-box",
  "enterprise",
  "integrated",
  "impactful",
  "wireless",
  "transparent",
  "next-generation",
  "cutting-edge",
  "user-centric",
  "visionary",
  "customized",
  "ubiquitous",
  "plug-and-play",
  "collaborative",
  "compelling",
  "holistic",
  "rich"
];
const bs_noun = [
  "synergies",
  "web-readiness",
  "paradigms",
  "markets",
  "partnerships",
  "infrastructures",
  "platforms",
  "initiatives",
  "channels",
  "eyeballs",
  "communities",
  "ROI",
  "solutions",
  "e-tailers",
  "e-services",
  "action-items",
  "portals",
  "niches",
  "technologies",
  "content",
  "vortals",
  "supply-chains",
  "convergence",
  "relationships",
  "architectures",
  "interfaces",
  "e-markets",
  "e-commerce",
  "systems",
  "bandwidth",
  "infomediaries",
  "models",
  "mindshare",
  "deliverables",
  "users",
  "schemas",
  "networks",
  "applications",
  "metrics",
  "e-business",
  "functionalities",
  "experiences",
  "web services",
  "methodologies",
  "blockchains"
];
const bs_verb = [
  "implement",
  "utilize",
  "integrate",
  "streamline",
  "optimize",
  "evolve",
  "transform",
  "embrace",
  "enable",
  "orchestrate",
  "leverage",
  "reinvent",
  "aggregate",
  "architect",
  "enhance",
  "incentivize",
  "morph",
  "empower",
  "envisioneer",
  "monetize",
  "harness",
  "facilitate",
  "seize",
  "disintermediate",
  "synergize",
  "strategize",
  "deploy",
  "brand",
  "grow",
  "target",
  "syndicate",
  "synthesize",
  "deliver",
  "mesh",
  "incubate",
  "engage",
  "maximize",
  "benchmark",
  "expedite",
  "reintermediate",
  "whiteboard",
  "visualize",
  "repurpose",
  "innovate",
  "scale",
  "unleash",
  "drive",
  "extend",
  "engineer",
  "revolutionize",
  "generate",
  "exploit",
  "transition",
  "e-enable",
  "iterate",
  "cultivate",
  "matrix",
  "productize",
  "redefine",
  "recontextualize"
];
const descriptor = [
  "24 hour",
  "24/7",
  "3rd generation",
  "4th generation",
  "5th generation",
  "6th generation",
  "actuating",
  "analyzing",
  "asymmetric",
  "asynchronous",
  "attitude-oriented",
  "background",
  "bandwidth-monitored",
  "bi-directional",
  "bifurcated",
  "bottom-line",
  "clear-thinking",
  "client-driven",
  "client-server",
  "coherent",
  "cohesive",
  "composite",
  "context-sensitive",
  "contextually-based",
  "content-based",
  "dedicated",
  "demand-driven",
  "didactic",
  "directional",
  "discrete",
  "disintermediate",
  "dynamic",
  "eco-centric",
  "empowering",
  "encompassing",
  "even-keeled",
  "executive",
  "explicit",
  "exuding",
  "fault-tolerant",
  "foreground",
  "fresh-thinking",
  "full-range",
  "global",
  "grid-enabled",
  "heuristic",
  "high-level",
  "holistic",
  "homogeneous",
  "human-resource",
  "hybrid",
  "impactful",
  "incremental",
  "intangible",
  "interactive",
  "intermediate",
  "leading edge",
  "local",
  "logistical",
  "maximized",
  "methodical",
  "mission-critical",
  "mobile",
  "modular",
  "motivating",
  "multimedia",
  "multi-state",
  "multi-tasking",
  "national",
  "needs-based",
  "neutral",
  "next generation",
  "non-volatile",
  "object-oriented",
  "optimal",
  "optimizing",
  "radical",
  "real-time",
  "reciprocal",
  "regional",
  "responsive",
  "scalable",
  "secondary",
  "solution-oriented",
  "stable",
  "static",
  "systematic",
  "systemic",
  "system-worthy",
  "tangible",
  "tertiary",
  "transitional",
  "uniform",
  "upward-trending",
  "user-facing",
  "value-added",
  "web-enabled",
  "well-modulated",
  "zero administration",
  "zero defect",
  "zero tolerance"
];
const name_$2 = [
  "{{name.last_name}} {{company.suffix}}",
  "{{name.last_name}}-{{name.last_name}}",
  "{{name.last_name}}, {{name.last_name}} and {{name.last_name}}"
];
const noun$2 = [
  "ability",
  "access",
  "adapter",
  "algorithm",
  "alliance",
  "analyzer",
  "application",
  "approach",
  "architecture",
  "archive",
  "artificial intelligence",
  "array",
  "attitude",
  "benchmark",
  "budgetary management",
  "capability",
  "capacity",
  "challenge",
  "circuit",
  "collaboration",
  "complexity",
  "concept",
  "conglomeration",
  "contingency",
  "core",
  "customer loyalty",
  "database",
  "data-warehouse",
  "definition",
  "emulation",
  "encoding",
  "encryption",
  "extranet",
  "firmware",
  "flexibility",
  "focus group",
  "forecast",
  "frame",
  "framework",
  "function",
  "functionalities",
  "Graphic Interface",
  "groupware",
  "Graphical User Interface",
  "hardware",
  "help-desk",
  "hierarchy",
  "hub",
  "implementation",
  "info-mediaries",
  "infrastructure",
  "initiative",
  "installation",
  "instruction set",
  "interface",
  "internet solution",
  "intranet",
  "knowledge user",
  "knowledge base",
  "local area network",
  "leverage",
  "matrices",
  "matrix",
  "methodology",
  "middleware",
  "migration",
  "model",
  "moderator",
  "monitoring",
  "moratorium",
  "neural-net",
  "open architecture",
  "open system",
  "orchestration",
  "paradigm",
  "parallelism",
  "policy",
  "portal",
  "pricing structure",
  "process improvement",
  "product",
  "productivity",
  "project",
  "projection",
  "protocol",
  "secured line",
  "service-desk",
  "software",
  "solution",
  "standardization",
  "strategy",
  "structure",
  "success",
  "superstructure",
  "support",
  "synergy",
  "system engine",
  "task-force",
  "throughput",
  "time-frame",
  "toolset",
  "utilisation",
  "website",
  "workforce"
];
const suffix$1 = ["Inc", "and Sons", "LLC", "Group"];
const company = {
  adjective: adjective$2,
  bs_adjective,
  bs_noun,
  bs_verb,
  descriptor,
  name: name_$2,
  noun: noun$2,
  suffix: suffix$1
};
const collation = [
  "utf8_unicode_ci",
  "utf8_general_ci",
  "utf8_bin",
  "ascii_bin",
  "ascii_general_ci",
  "cp1250_bin",
  "cp1250_general_ci"
];
const column = [
  "id",
  "title",
  "name",
  "email",
  "phone",
  "token",
  "group",
  "category",
  "password",
  "comment",
  "avatar",
  "status",
  "createdAt",
  "updatedAt"
];
const engine = ["InnoDB", "MyISAM", "MEMORY", "CSV", "BLACKHOLE", "ARCHIVE"];
const type_$1 = [
  "int",
  "varchar",
  "text",
  "date",
  "datetime",
  "tinyint",
  "time",
  "timestamp",
  "smallint",
  "mediumint",
  "bigint",
  "decimal",
  "float",
  "double",
  "real",
  "bit",
  "boolean",
  "serial",
  "blob",
  "binary",
  "enum",
  "set",
  "geometry",
  "point"
];
const database = {
  collation,
  column,
  engine,
  type: type_$1
};
const month = {
  wide: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ],
  wide_context: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ],
  abbr: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ],
  abbr_context: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ]
};
const weekday = {
  wide: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ],
  wide_context: [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday"
  ],
  abbr: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  abbr_context: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
};
const date = {
  month,
  weekday
};
const account_type = [
  "Checking",
  "Savings",
  "Money Market",
  "Investment",
  "Home Loan",
  "Credit Card",
  "Auto Loan",
  "Personal Loan"
];
const american_express = ["34##-######-####L", "37##-######-####L"];
const diners_club = [
  "30[0-5]#-######-###L",
  "36##-######-###L",
  "54##-####-####-###L"
];
const discover = [
  "6011-####-####-###L",
  "65##-####-####-###L",
  "64[4-9]#-####-####-###L",
  "6011-62##-####-####-###L",
  "65##-62##-####-####-###L",
  "64[4-9]#-62##-####-####-###L"
];
const instapayment = ["63[7-9]#-####-####-###L"];
const jcb = [
  "3528-####-####-###L",
  "3529-####-####-###L",
  "35[3-8]#-####-####-###L"
];
const laser = [
  "6304###########L",
  "6706###########L",
  "6771###########L",
  "6709###########L",
  "6304#########{5,6}L",
  "6706#########{5,6}L",
  "6771#########{5,6}L",
  "6709#########{5,6}L"
];
const maestro = [
  "5018-#{4}-#{4}-#{3}L",
  "5020-#{4}-#{4}-#{3}L",
  "5038-#{4}-#{4}-#{3}L",
  "5893-#{4}-#{4}-#{3}L",
  "6304-#{4}-#{4}-#{3}L",
  "6759-#{4}-#{4}-#{3}L",
  "676[1-3]-####-####-###L",
  "5018#{11,15}L",
  "5020#{11,15}L",
  "5038#{11,15}L",
  "5893#{11,15}L",
  "6304#{11,15}L",
  "6759#{11,15}L",
  "676[1-3]#{11,15}L"
];
const mastercard = ["5[1-5]##-####-####-###L", "6771-89##-####-###L"];
const solo = [
  "6767-####-####-###L",
  "6767-####-####-####-#L",
  "6767-####-####-####-##L"
];
const switch_ = [
  "6759-####-####-###L",
  "6759-####-####-####-#L",
  "6759-####-####-####-##L"
];
const visa = ["4###########L", "4###-####-####-###L"];
const credit_card = {
  american_express,
  diners_club,
  discover,
  instapayment,
  jcb,
  laser,
  maestro,
  mastercard,
  solo,
  switch: switch_,
  visa
};
const currency = {
  "UAE Dirham": {
    code: "AED",
    symbol: ""
  },
  Afghani: {
    code: "AFN",
    symbol: "\u060B"
  },
  Lek: {
    code: "ALL",
    symbol: "Lek"
  },
  "Armenian Dram": {
    code: "AMD",
    symbol: ""
  },
  "Netherlands Antillian Guilder": {
    code: "ANG",
    symbol: "\u0192"
  },
  Kwanza: {
    code: "AOA",
    symbol: ""
  },
  "Argentine Peso": {
    code: "ARS",
    symbol: "$"
  },
  "Australian Dollar": {
    code: "AUD",
    symbol: "$"
  },
  "Aruban Guilder": {
    code: "AWG",
    symbol: "\u0192"
  },
  "Azerbaijanian Manat": {
    code: "AZN",
    symbol: "\u043C\u0430\u043D"
  },
  "Convertible Marks": {
    code: "BAM",
    symbol: "KM"
  },
  "Barbados Dollar": {
    code: "BBD",
    symbol: "$"
  },
  Taka: {
    code: "BDT",
    symbol: ""
  },
  "Bulgarian Lev": {
    code: "BGN",
    symbol: "\u043B\u0432"
  },
  "Bahraini Dinar": {
    code: "BHD",
    symbol: ""
  },
  "Burundi Franc": {
    code: "BIF",
    symbol: ""
  },
  "Bermudian Dollar (customarily known as Bermuda Dollar)": {
    code: "BMD",
    symbol: "$"
  },
  "Brunei Dollar": {
    code: "BND",
    symbol: "$"
  },
  "Boliviano boliviano": {
    code: "BOB",
    symbol: "Bs"
  },
  "Brazilian Real": {
    code: "BRL",
    symbol: "R$"
  },
  "Bahamian Dollar": {
    code: "BSD",
    symbol: "$"
  },
  Pula: {
    code: "BWP",
    symbol: "P"
  },
  "Belarussian Ruble": {
    code: "BYR",
    symbol: "p."
  },
  "Belize Dollar": {
    code: "BZD",
    symbol: "BZ$"
  },
  "Canadian Dollar": {
    code: "CAD",
    symbol: "$"
  },
  "Congolese Franc": {
    code: "CDF",
    symbol: ""
  },
  "Swiss Franc": {
    code: "CHF",
    symbol: "CHF"
  },
  "Chilean Peso": {
    code: "CLP",
    symbol: "$"
  },
  "Yuan Renminbi": {
    code: "CNY",
    symbol: "\xA5"
  },
  "Colombian Peso": {
    code: "COP",
    symbol: "$"
  },
  "Costa Rican Colon": {
    code: "CRC",
    symbol: "\u20A1"
  },
  "Cuban Peso": {
    code: "CUP",
    symbol: "\u20B1"
  },
  "Cuban Peso Convertible": {
    code: "CUC",
    symbol: "$"
  },
  "Cape Verde Escudo": {
    code: "CVE",
    symbol: ""
  },
  "Czech Koruna": {
    code: "CZK",
    symbol: "K\u010D"
  },
  "Djibouti Franc": {
    code: "DJF",
    symbol: ""
  },
  "Danish Krone": {
    code: "DKK",
    symbol: "kr"
  },
  "Dominican Peso": {
    code: "DOP",
    symbol: "RD$"
  },
  "Algerian Dinar": {
    code: "DZD",
    symbol: ""
  },
  Kroon: {
    code: "EEK",
    symbol: ""
  },
  "Egyptian Pound": {
    code: "EGP",
    symbol: "\xA3"
  },
  Nakfa: {
    code: "ERN",
    symbol: ""
  },
  "Ethiopian Birr": {
    code: "ETB",
    symbol: ""
  },
  Euro: {
    code: "EUR",
    symbol: "\u20AC"
  },
  "Fiji Dollar": {
    code: "FJD",
    symbol: "$"
  },
  "Falkland Islands Pound": {
    code: "FKP",
    symbol: "\xA3"
  },
  "Pound Sterling": {
    code: "GBP",
    symbol: "\xA3"
  },
  Lari: {
    code: "GEL",
    symbol: ""
  },
  Cedi: {
    code: "GHS",
    symbol: ""
  },
  "Gibraltar Pound": {
    code: "GIP",
    symbol: "\xA3"
  },
  Dalasi: {
    code: "GMD",
    symbol: ""
  },
  "Guinea Franc": {
    code: "GNF",
    symbol: ""
  },
  Quetzal: {
    code: "GTQ",
    symbol: "Q"
  },
  "Guyana Dollar": {
    code: "GYD",
    symbol: "$"
  },
  "Hong Kong Dollar": {
    code: "HKD",
    symbol: "$"
  },
  Lempira: {
    code: "HNL",
    symbol: "L"
  },
  "Croatian Kuna": {
    code: "HRK",
    symbol: "kn"
  },
  Gourde: {
    code: "HTG",
    symbol: ""
  },
  Forint: {
    code: "HUF",
    symbol: "Ft"
  },
  Rupiah: {
    code: "IDR",
    symbol: "Rp"
  },
  "New Israeli Sheqel": {
    code: "ILS",
    symbol: "\u20AA"
  },
  "Bhutanese Ngultrum": {
    code: "BTN",
    symbol: "Nu"
  },
  "Indian Rupee": {
    code: "INR",
    symbol: "\u20B9"
  },
  "Iraqi Dinar": {
    code: "IQD",
    symbol: ""
  },
  "Iranian Rial": {
    code: "IRR",
    symbol: "\uFDFC"
  },
  "Iceland Krona": {
    code: "ISK",
    symbol: "kr"
  },
  "Jamaican Dollar": {
    code: "JMD",
    symbol: "J$"
  },
  "Jordanian Dinar": {
    code: "JOD",
    symbol: ""
  },
  Yen: {
    code: "JPY",
    symbol: "\xA5"
  },
  "Kenyan Shilling": {
    code: "KES",
    symbol: ""
  },
  Som: {
    code: "KGS",
    symbol: "\u043B\u0432"
  },
  Riel: {
    code: "KHR",
    symbol: "\u17DB"
  },
  "Comoro Franc": {
    code: "KMF",
    symbol: ""
  },
  "North Korean Won": {
    code: "KPW",
    symbol: "\u20A9"
  },
  Won: {
    code: "KRW",
    symbol: "\u20A9"
  },
  "Kuwaiti Dinar": {
    code: "KWD",
    symbol: ""
  },
  "Cayman Islands Dollar": {
    code: "KYD",
    symbol: "$"
  },
  Tenge: {
    code: "KZT",
    symbol: "\u043B\u0432"
  },
  Kip: {
    code: "LAK",
    symbol: "\u20AD"
  },
  "Lebanese Pound": {
    code: "LBP",
    symbol: "\xA3"
  },
  "Sri Lanka Rupee": {
    code: "LKR",
    symbol: "\u20A8"
  },
  "Liberian Dollar": {
    code: "LRD",
    symbol: "$"
  },
  "Lithuanian Litas": {
    code: "LTL",
    symbol: "Lt"
  },
  "Latvian Lats": {
    code: "LVL",
    symbol: "Ls"
  },
  "Libyan Dinar": {
    code: "LYD",
    symbol: ""
  },
  "Moroccan Dirham": {
    code: "MAD",
    symbol: ""
  },
  "Moldovan Leu": {
    code: "MDL",
    symbol: ""
  },
  "Malagasy Ariary": {
    code: "MGA",
    symbol: ""
  },
  Denar: {
    code: "MKD",
    symbol: "\u0434\u0435\u043D"
  },
  Kyat: {
    code: "MMK",
    symbol: ""
  },
  Tugrik: {
    code: "MNT",
    symbol: "\u20AE"
  },
  Pataca: {
    code: "MOP",
    symbol: ""
  },
  Ouguiya: {
    code: "MRO",
    symbol: ""
  },
  "Mauritius Rupee": {
    code: "MUR",
    symbol: "\u20A8"
  },
  Rufiyaa: {
    code: "MVR",
    symbol: ""
  },
  Kwacha: {
    code: "MWK",
    symbol: ""
  },
  "Mexican Peso": {
    code: "MXN",
    symbol: "$"
  },
  "Malaysian Ringgit": {
    code: "MYR",
    symbol: "RM"
  },
  Metical: {
    code: "MZN",
    symbol: "MT"
  },
  Naira: {
    code: "NGN",
    symbol: "\u20A6"
  },
  "Cordoba Oro": {
    code: "NIO",
    symbol: "C$"
  },
  "Norwegian Krone": {
    code: "NOK",
    symbol: "kr"
  },
  "Nepalese Rupee": {
    code: "NPR",
    symbol: "\u20A8"
  },
  "New Zealand Dollar": {
    code: "NZD",
    symbol: "$"
  },
  "Rial Omani": {
    code: "OMR",
    symbol: "\uFDFC"
  },
  Balboa: {
    code: "PAB",
    symbol: "B/."
  },
  "Nuevo Sol": {
    code: "PEN",
    symbol: "S/."
  },
  Kina: {
    code: "PGK",
    symbol: ""
  },
  "Philippine Peso": {
    code: "PHP",
    symbol: "Php"
  },
  "Pakistan Rupee": {
    code: "PKR",
    symbol: "\u20A8"
  },
  Zloty: {
    code: "PLN",
    symbol: "z\u0142"
  },
  Guarani: {
    code: "PYG",
    symbol: "Gs"
  },
  "Qatari Rial": {
    code: "QAR",
    symbol: "\uFDFC"
  },
  "New Leu": {
    code: "RON",
    symbol: "lei"
  },
  "Serbian Dinar": {
    code: "RSD",
    symbol: "\u0414\u0438\u043D."
  },
  "Russian Ruble": {
    code: "RUB",
    symbol: "\u0440\u0443\u0431"
  },
  "Rwanda Franc": {
    code: "RWF",
    symbol: ""
  },
  "Saudi Riyal": {
    code: "SAR",
    symbol: "\uFDFC"
  },
  "Solomon Islands Dollar": {
    code: "SBD",
    symbol: "$"
  },
  "Seychelles Rupee": {
    code: "SCR",
    symbol: "\u20A8"
  },
  "Sudanese Pound": {
    code: "SDG",
    symbol: ""
  },
  "Swedish Krona": {
    code: "SEK",
    symbol: "kr"
  },
  "Singapore Dollar": {
    code: "SGD",
    symbol: "$"
  },
  "Saint Helena Pound": {
    code: "SHP",
    symbol: "\xA3"
  },
  Leone: {
    code: "SLL",
    symbol: ""
  },
  "Somali Shilling": {
    code: "SOS",
    symbol: "S"
  },
  "Surinam Dollar": {
    code: "SRD",
    symbol: "$"
  },
  Dobra: {
    code: "STN",
    symbol: "Db"
  },
  "El Salvador Colon": {
    code: "SVC",
    symbol: "\u20A1"
  },
  "Syrian Pound": {
    code: "SYP",
    symbol: "\xA3"
  },
  Lilangeni: {
    code: "SZL",
    symbol: ""
  },
  Baht: {
    code: "THB",
    symbol: "\u0E3F"
  },
  Somoni: {
    code: "TJS",
    symbol: ""
  },
  Manat: {
    code: "TMT",
    symbol: ""
  },
  "Tunisian Dinar": {
    code: "TND",
    symbol: ""
  },
  "Pa'anga": {
    code: "TOP",
    symbol: ""
  },
  "Turkish Lira": {
    code: "TRY",
    symbol: "\u20BA"
  },
  "Trinidad and Tobago Dollar": {
    code: "TTD",
    symbol: "TT$"
  },
  "New Taiwan Dollar": {
    code: "TWD",
    symbol: "NT$"
  },
  "Tanzanian Shilling": {
    code: "TZS",
    symbol: ""
  },
  Hryvnia: {
    code: "UAH",
    symbol: "\u20B4"
  },
  "Uganda Shilling": {
    code: "UGX",
    symbol: ""
  },
  "US Dollar": {
    code: "USD",
    symbol: "$"
  },
  "Peso Uruguayo": {
    code: "UYU",
    symbol: "$U"
  },
  "Uzbekistan Sum": {
    code: "UZS",
    symbol: "\u043B\u0432"
  },
  "Bolivar Fuerte": {
    code: "VEF",
    symbol: "Bs"
  },
  Dong: {
    code: "VND",
    symbol: "\u20AB"
  },
  Vatu: {
    code: "VUV",
    symbol: ""
  },
  Tala: {
    code: "WST",
    symbol: ""
  },
  "CFA Franc BEAC": {
    code: "XAF",
    symbol: ""
  },
  Silver: {
    code: "XAG",
    symbol: ""
  },
  Gold: {
    code: "XAU",
    symbol: ""
  },
  "Bond Markets Units European Composite Unit (EURCO)": {
    code: "XBA",
    symbol: ""
  },
  "European Monetary Unit (E.M.U.-6)": {
    code: "XBB",
    symbol: ""
  },
  "European Unit of Account 9(E.U.A.-9)": {
    code: "XBC",
    symbol: ""
  },
  "European Unit of Account 17(E.U.A.-17)": {
    code: "XBD",
    symbol: ""
  },
  "East Caribbean Dollar": {
    code: "XCD",
    symbol: "$"
  },
  SDR: {
    code: "XDR",
    symbol: ""
  },
  "UIC-Franc": {
    code: "XFU",
    symbol: ""
  },
  "CFA Franc BCEAO": {
    code: "XOF",
    symbol: ""
  },
  Palladium: {
    code: "XPD",
    symbol: ""
  },
  "CFP Franc": {
    code: "XPF",
    symbol: ""
  },
  Platinum: {
    code: "XPT",
    symbol: ""
  },
  "Codes specifically reserved for testing purposes": {
    code: "XTS",
    symbol: ""
  },
  "Yemeni Rial": {
    code: "YER",
    symbol: "\uFDFC"
  },
  Rand: {
    code: "ZAR",
    symbol: "R"
  },
  "Lesotho Loti": {
    code: "LSL",
    symbol: ""
  },
  "Namibia Dollar": {
    code: "NAD",
    symbol: "N$"
  },
  "Zambian Kwacha": {
    code: "ZMK",
    symbol: ""
  },
  "Zimbabwe Dollar": {
    code: "ZWL",
    symbol: ""
  }
};
const transaction_type = ["deposit", "withdrawal", "payment", "invoice"];
const finance = {
  account_type,
  credit_card,
  currency,
  transaction_type
};
const abbreviation = [
  "ADP",
  "AGP",
  "AI",
  "API",
  "ASCII",
  "CLI",
  "COM",
  "CSS",
  "DNS",
  "DRAM",
  "EXE",
  "FTP",
  "GB",
  "HDD",
  "HEX",
  "HTTP",
  "IB",
  "IP",
  "JBOD",
  "JSON",
  "OCR",
  "PCI",
  "PNG",
  "RAM",
  "RSS",
  "SAS",
  "SCSI",
  "SDD",
  "SMS",
  "SMTP",
  "SQL",
  "SSD",
  "SSL",
  "TCP",
  "THX",
  "TLS",
  "UDP",
  "USB",
  "UTF8",
  "VGA",
  "XML",
  "XSS"
];
const adjective$1 = [
  "auxiliary",
  "primary",
  "back-end",
  "digital",
  "open-source",
  "virtual",
  "cross-platform",
  "redundant",
  "online",
  "haptic",
  "multi-byte",
  "bluetooth",
  "wireless",
  "1080p",
  "neural",
  "optical",
  "solid state",
  "mobile"
];
const ingverb = [
  "backing up",
  "bypassing",
  "hacking",
  "overriding",
  "compressing",
  "copying",
  "navigating",
  "indexing",
  "connecting",
  "generating",
  "quantifying",
  "calculating",
  "synthesizing",
  "transmitting",
  "programming",
  "parsing"
];
const noun$1 = [
  "driver",
  "protocol",
  "bandwidth",
  "panel",
  "microchip",
  "program",
  "port",
  "card",
  "array",
  "interface",
  "system",
  "sensor",
  "firewall",
  "hard drive",
  "pixel",
  "alarm",
  "feed",
  "monitor",
  "application",
  "transmitter",
  "bus",
  "circuit",
  "capacitor",
  "matrix"
];
const phrase = [
  "If we {{verb}} the {{noun}}, we can get to the {{abbreviation}} {{noun}} through the {{adjective}} {{abbreviation}} {{noun}}!",
  "We need to {{verb}} the {{adjective}} {{abbreviation}} {{noun}}!",
  "Try to {{verb}} the {{abbreviation}} {{noun}}, maybe it will {{verb}} the {{adjective}} {{noun}}!",
  "You can't {{verb}} the {{noun}} without {{ingverb}} the {{adjective}} {{abbreviation}} {{noun}}!",
  "Use the {{adjective}} {{abbreviation}} {{noun}}, then you can {{verb}} the {{adjective}} {{noun}}!",
  "The {{abbreviation}} {{noun}} is down, {{verb}} the {{adjective}} {{noun}} so we can {{verb}} the {{abbreviation}} {{noun}}!",
  "{{ingverb}} the {{noun}} won't do anything, we need to {{verb}} the {{adjective}} {{abbreviation}} {{noun}}!",
  "I'll {{verb}} the {{adjective}} {{abbreviation}} {{noun}}, that should {{noun}} the {{abbreviation}} {{noun}}!"
];
const verb$1 = [
  "back up",
  "bypass",
  "hack",
  "override",
  "compress",
  "copy",
  "navigate",
  "index",
  "connect",
  "generate",
  "quantify",
  "calculate",
  "synthesize",
  "input",
  "transmit",
  "program",
  "reboot",
  "parse"
];
const hacker = {
  abbreviation,
  adjective: adjective$1,
  ingverb,
  noun: noun$1,
  phrase,
  verb: verb$1
};
const avatar_uri = [
  "0therplanet_128.jpg",
  "1markiz_128.jpg",
  "2fockus_128.jpg",
  "8d3k_128.jpg",
  "91bilal_128.jpg",
  "9lessons_128.jpg",
  "AM_Kn2_128.jpg",
  "AlbertoCococi_128.jpg",
  "BenouarradeM_128.jpg",
  "BillSKenney_128.jpg",
  "BrianPurkiss_128.jpg",
  "BroumiYoussef_128.jpg",
  "BryanHorsey_128.jpg",
  "Chakintosh_128.jpg",
  "ChrisFarina78_128.jpg",
  "Elt_n_128.jpg",
  "GavicoInd_128.jpg",
  "HenryHoffman_128.jpg",
  "IsaryAmairani_128.jpg",
  "Karimmove_128.jpg",
  "LucasPerdidao_128.jpg",
  "ManikRathee_128.jpg",
  "RussellBishop_128.jpg",
  "S0ufi4n3_128.jpg",
  "SULiik_128.jpg",
  "Shriiiiimp_128.jpg",
  "Silveredge9_128.jpg",
  "Skyhartman_128.jpg",
  "SlaapMe_128.jpg",
  "Stievius_128.jpg",
  "Talbi_ConSept_128.jpg",
  "VMilescu_128.jpg",
  "VinThomas_128.jpg",
  "YoungCutlass_128.jpg",
  "ZacharyZorbas_128.jpg",
  "_dwite__128.jpg",
  "_kkga_128.jpg",
  "_pedropinho_128.jpg",
  "_ragzor_128.jpg",
  "_scottburgess_128.jpg",
  "_shahedk_128.jpg",
  "_victa_128.jpg",
  "_vojto_128.jpg",
  "_williamguerra_128.jpg",
  "_yardenoon_128.jpg",
  "a1chapone_128.jpg",
  "a_brixen_128.jpg",
  "a_harris88_128.jpg",
  "aaronalfred_128.jpg",
  "aaroni_128.jpg",
  "aaronkwhite_128.jpg",
  "abdots_128.jpg",
  "abdulhyeuk_128.jpg",
  "abdullindenis_128.jpg",
  "abelcabans_128.jpg",
  "abotap_128.jpg",
  "abovefunction_128.jpg",
  "adamawesomeface_128.jpg",
  "adammarsbar_128.jpg",
  "adamnac_128.jpg",
  "adamsxu_128.jpg",
  "adellecharles_128.jpg",
  "ademilter_128.jpg",
  "adhamdannaway_128.jpg",
  "adhiardana_128.jpg",
  "adityasutomo_128.jpg",
  "adobi_128.jpg",
  "adrienths_128.jpg",
  "aeon56_128.jpg",
  "afusinatto_128.jpg",
  "agromov_128.jpg",
  "agustincruiz_128.jpg",
  "ah_lice_128.jpg",
  "ahmadajmi_128.jpg",
  "ahmetalpbalkan_128.jpg",
  "ahmetsulek_128.jpg",
  "aiiaiiaii_128.jpg",
  "ainsleywagon_128.jpg",
  "aio____128.jpg",
  "airskylar_128.jpg",
  "aislinnkelly_128.jpg",
  "ajaxy_ru_128.jpg",
  "aka_james_128.jpg",
  "akashsharma39_128.jpg",
  "akmalfikri_128.jpg",
  "akmur_128.jpg",
  "al_li_128.jpg",
  "alagoon_128.jpg",
  "alan_zhang__128.jpg",
  "albertaugustin_128.jpg",
  "alecarpentier_128.jpg",
  "aleclarsoniv_128.jpg",
  "aleinadsays_128.jpg",
  "alek_djuric_128.jpg",
  "aleksitappura_128.jpg",
  "alessandroribe_128.jpg",
  "alevizio_128.jpg",
  "alexandermayes_128.jpg",
  "alexivanichkin_128.jpg",
  "algunsanabria_128.jpg",
  "allagringaus_128.jpg",
  "allfordesign_128.jpg",
  "allthingssmitty_128.jpg",
  "alsobrooks_128.jpg",
  "alterchuca_128.jpg",
  "aluisio_azevedo_128.jpg",
  "alxleroydeval_128.jpg",
  "alxndrustinov_128.jpg",
  "amandabuzard_128.jpg",
  "amanruzaini_128.jpg",
  "amayvs_128.jpg",
  "amywebbb_128.jpg",
  "anaami_128.jpg",
  "anasnakawa_128.jpg",
  "anatolinicolae_128.jpg",
  "andrea211087_128.jpg",
  "andreas_pr_128.jpg",
  "andresdjasso_128.jpg",
  "andresenfredrik_128.jpg",
  "andrewabogado_128.jpg",
  "andrewarrow_128.jpg",
  "andrewcohen_128.jpg",
  "andrewofficer_128.jpg",
  "andyisonline_128.jpg",
  "andysolomon_128.jpg",
  "andytlaw_128.jpg",
  "angelceballos_128.jpg",
  "angelcolberg_128.jpg",
  "angelcreative_128.jpg",
  "anjhero_128.jpg",
  "ankitind_128.jpg",
  "anoff_128.jpg",
  "anthonysukow_128.jpg",
  "antjanus_128.jpg",
  "antongenkin_128.jpg",
  "antonyryndya_128.jpg",
  "antonyzotov_128.jpg",
  "aoimedia_128.jpg",
  "apriendeau_128.jpg",
  "arashmanteghi_128.jpg",
  "areandacom_128.jpg",
  "areus_128.jpg",
  "ariffsetiawan_128.jpg",
  "ariil_128.jpg",
  "arindam__128.jpg",
  "arishi__128.jpg",
  "arkokoley_128.jpg",
  "aroon_sharma_128.jpg",
  "arpitnj_128.jpg",
  "artd_sign_128.jpg",
  "artem_kostenko_128.jpg",
  "arthurholcombe1_128.jpg",
  "artvavs_128.jpg",
  "ashernatali_128.jpg",
  "ashocka18_128.jpg",
  "atanism_128.jpg",
  "atariboy_128.jpg",
  "ateneupopular_128.jpg",
  "attacks_128.jpg",
  "aviddayentonbay_128.jpg",
  "axel_128.jpg",
  "badlittleduck_128.jpg",
  "bagawarman_128.jpg",
  "baires_128.jpg",
  "balakayuriy_128.jpg",
  "balintorosz_128.jpg",
  "baliomega_128.jpg",
  "baluli_128.jpg",
  "bargaorobalo_128.jpg",
  "barputro_128.jpg",
  "bartjo_128.jpg",
  "bartoszdawydzik_128.jpg",
  "bassamology_128.jpg",
  "batsirai_128.jpg",
  "baumann_alex_128.jpg",
  "baumannzone_128.jpg",
  "bboy1895_128.jpg",
  "bcrad_128.jpg",
  "begreative_128.jpg",
  "belyaev_rs_128.jpg",
  "benefritz_128.jpg",
  "benjamin_knight_128.jpg",
  "bennyjien_128.jpg",
  "benoitboucart_128.jpg",
  "bereto_128.jpg",
  "bergmartin_128.jpg",
  "bermonpainter_128.jpg",
  "bertboerland_128.jpg",
  "besbujupi_128.jpg",
  "beshur_128.jpg",
  "betraydan_128.jpg",
  "beweinreich_128.jpg",
  "bfrohs_128.jpg",
  "bighanddesign_128.jpg",
  "bigmancho_128.jpg",
  "billyroshan_128.jpg",
  "bistrianiosip_128.jpg",
  "blakehawksworth_128.jpg",
  "blakesimkins_128.jpg",
  "bluefx__128.jpg",
  "bluesix_128.jpg",
  "bobbytwoshoes_128.jpg",
  "bobwassermann_128.jpg",
  "bolzanmarco_128.jpg",
  "borantula_128.jpg",
  "borges_marcos_128.jpg",
  "bowbrick_128.jpg",
  "boxmodel_128.jpg",
  "bpartridge_128.jpg",
  "bradenhamm_128.jpg",
  "brajeshwar_128.jpg",
  "brandclay_128.jpg",
  "brandonburke_128.jpg",
  "brandonflatsoda_128.jpg",
  "brandonmorreale_128.jpg",
  "brenmurrell_128.jpg",
  "brenton_clarke_128.jpg",
  "bruno_mart_128.jpg",
  "brunodesign1206_128.jpg",
  "bryan_topham_128.jpg",
  "bu7921_128.jpg",
  "bublienko_128.jpg",
  "buddhasource_128.jpg",
  "buleswapnil_128.jpg",
  "bungiwan_128.jpg",
  "buryaknick_128.jpg",
  "buzzusborne_128.jpg",
  "byrnecore_128.jpg",
  "byryan_128.jpg",
  "cadikkara_128.jpg",
  "calebjoyce_128.jpg",
  "calebogden_128.jpg",
  "canapud_128.jpg",
  "carbontwelve_128.jpg",
  "carlfairclough_128.jpg",
  "carlosblanco_eu_128.jpg",
  "carlosgavina_128.jpg",
  "carlosjgsousa_128.jpg",
  "carlosm_128.jpg",
  "carlyson_128.jpg",
  "caseycavanagh_128.jpg",
  "caspergrl_128.jpg",
  "catadeleon_128.jpg",
  "catarino_128.jpg",
  "cboller1_128.jpg",
  "cbracco_128.jpg",
  "ccinojasso1_128.jpg",
  "cdavis565_128.jpg",
  "cdharrison_128.jpg",
  "ceekaytweet_128.jpg",
  "cemshid_128.jpg",
  "cggaurav_128.jpg",
  "chaabane_wail_128.jpg",
  "chacky14_128.jpg",
  "chadami_128.jpg",
  "chadengle_128.jpg",
  "chaensel_128.jpg",
  "chandlervdw_128.jpg",
  "chanpory_128.jpg",
  "charlesrpratt_128.jpg",
  "charliecwaite_128.jpg",
  "charliegann_128.jpg",
  "chatyrko_128.jpg",
  "cherif_b_128.jpg",
  "chris_frees_128.jpg",
  "chris_witko_128.jpg",
  "chrismj83_128.jpg",
  "chrisslowik_128.jpg",
  "chrisstumph_128.jpg",
  "christianoliff_128.jpg",
  "chrisvanderkooi_128.jpg",
  "ciaranr_128.jpg",
  "cicerobr_128.jpg",
  "claudioguglieri_128.jpg",
  "cloudstudio_128.jpg",
  "clubb3rry_128.jpg",
  "cocolero_128.jpg",
  "codepoet_ru_128.jpg",
  "coderdiaz_128.jpg",
  "codysanfilippo_128.jpg",
  "cofla_128.jpg",
  "colgruv_128.jpg",
  "colirpixoil_128.jpg",
  "collegeman_128.jpg",
  "commadelimited_128.jpg",
  "conspirator_128.jpg",
  "constantx_128.jpg",
  "coreyginnivan_128.jpg",
  "coreyhaggard_128.jpg",
  "coreyweb_128.jpg",
  "craigelimeliah_128.jpg",
  "craighenneberry_128.jpg",
  "craigrcoles_128.jpg",
  "creartinc_128.jpg",
  "croakx_128.jpg",
  "curiousoffice_128.jpg",
  "curiousonaut_128.jpg",
  "cybind_128.jpg",
  "cynthiasavard_128.jpg",
  "cyril_gaillard_128.jpg",
  "d00maz_128.jpg",
  "d33pthought_128.jpg",
  "d_kobelyatsky_128.jpg",
  "d_nny_m_cher_128.jpg",
  "dactrtr_128.jpg",
  "dahparra_128.jpg",
  "dallasbpeters_128.jpg",
  "damenleeturks_128.jpg",
  "danillos_128.jpg",
  "daniloc_128.jpg",
  "danmartin70_128.jpg",
  "dannol_128.jpg",
  "danpliego_128.jpg",
  "danro_128.jpg",
  "dansowter_128.jpg",
  "danthms_128.jpg",
  "danvernon_128.jpg",
  "danvierich_128.jpg",
  "darcystonge_128.jpg",
  "darylws_128.jpg",
  "davecraige_128.jpg",
  "davidbaldie_128.jpg",
  "davidcazalis_128.jpg",
  "davidhemphill_128.jpg",
  "davidmerrique_128.jpg",
  "davidsasda_128.jpg",
  "dawidwu_128.jpg",
  "daykiine_128.jpg",
  "dc_user_128.jpg",
  "dcalonaci_128.jpg",
  "ddggccaa_128.jpg",
  "de_ascanio_128.jpg",
  "deeenright_128.jpg",
  "demersdesigns_128.jpg",
  "denisepires_128.jpg",
  "depaulawagner_128.jpg",
  "derekcramer_128.jpg",
  "derekebradley_128.jpg",
  "derienzo777_128.jpg",
  "desastrozo_128.jpg",
  "designervzm_128.jpg",
  "dev_essentials_128.jpg",
  "devankoshal_128.jpg",
  "deviljho__128.jpg",
  "devinhalladay_128.jpg",
  "dgajjar_128.jpg",
  "dgclegg_128.jpg",
  "dhilipsiva_128.jpg",
  "dhoot_amit_128.jpg",
  "dhooyenga_128.jpg",
  "dhrubo_128.jpg",
  "diansigitp_128.jpg",
  "dicesales_128.jpg",
  "diesellaws_128.jpg",
  "digitalmaverick_128.jpg",
  "dimaposnyy_128.jpg",
  "dingyi_128.jpg",
  "divya_128.jpg",
  "dixchen_128.jpg",
  "djsherman_128.jpg",
  "dmackerman_128.jpg",
  "dmitriychuta_128.jpg",
  "dnezkumar_128.jpg",
  "dnirmal_128.jpg",
  "donjain_128.jpg",
  "doooon_128.jpg",
  "doronmalki_128.jpg",
  "dorphern_128.jpg",
  "dotgridline_128.jpg",
  "dparrelli_128.jpg",
  "dpmachado_128.jpg",
  "dreizle_128.jpg",
  "drewbyreese_128.jpg",
  "dshster_128.jpg",
  "dss49_128.jpg",
  "dudestein_128.jpg",
  "duivvv_128.jpg",
  "dutchnadia_128.jpg",
  "dvdwinden_128.jpg",
  "dzantievm_128.jpg",
  "ecommerceil_128.jpg",
  "eddiechen_128.jpg",
  "edgarchris99_128.jpg",
  "edhenderson_128.jpg",
  "edkf_128.jpg",
  "edobene_128.jpg",
  "eduardostuart_128.jpg",
  "ehsandiary_128.jpg",
  "eitarafa_128.jpg",
  "el_fuertisimo_128.jpg",
  "elbuscainfo_128.jpg",
  "elenadissi_128.jpg",
  "elisabethkjaer_128.jpg",
  "elliotlewis_128.jpg",
  "elliotnolten_128.jpg",
  "embrcecreations_128.jpg",
  "emileboudeling_128.jpg",
  "emmandenn_128.jpg",
  "emmeffess_128.jpg",
  "emsgulam_128.jpg",
  "enda_128.jpg",
  "enjoythetau_128.jpg",
  "enricocicconi_128.jpg",
  "envex_128.jpg",
  "ernestsemerda_128.jpg",
  "erwanhesry_128.jpg",
  "estebanuribe_128.jpg",
  "eugeneeweb_128.jpg",
  "evandrix_128.jpg",
  "evanshajed_128.jpg",
  "exentrich_128.jpg",
  "eyronn_128.jpg",
  "fabbianz_128.jpg",
  "fabbrucci_128.jpg",
  "faisalabid_128.jpg",
  "falconerie_128.jpg",
  "falling_soul_128.jpg",
  "falvarad_128.jpg",
  "felipeapiress_128.jpg",
  "felipecsl_128.jpg",
  "ffbel_128.jpg",
  "finchjke_128.jpg",
  "findingjenny_128.jpg",
  "fiterik_128.jpg",
  "fjaguero_128.jpg",
  "flashmurphy_128.jpg",
  "flexrs_128.jpg",
  "foczzi_128.jpg",
  "fotomagin_128.jpg",
  "fran_mchamy_128.jpg",
  "francis_vega_128.jpg",
  "franciscoamk_128.jpg",
  "frankiefreesbie_128.jpg",
  "fronx_128.jpg",
  "funwatercat_128.jpg",
  "g3d_128.jpg",
  "gaborenton_128.jpg",
  "gabrielizalo_128.jpg",
  "gabrielrosser_128.jpg",
  "ganserene_128.jpg",
  "garand_128.jpg",
  "gauchomatt_128.jpg",
  "gauravjassal_128.jpg",
  "gavr1l0_128.jpg",
  "gcmorley_128.jpg",
  "gearpixels_128.jpg",
  "geneseleznev_128.jpg",
  "geobikas_128.jpg",
  "geran7_128.jpg",
  "geshan_128.jpg",
  "giancarlon_128.jpg",
  "gipsy_raf_128.jpg",
  "giuliusa_128.jpg",
  "gizmeedevil1991_128.jpg",
  "gkaam_128.jpg",
  "gmourier_128.jpg",
  "goddardlewis_128.jpg",
  "gofrasdesign_128.jpg",
  "gojeanyn_128.jpg",
  "gonzalorobaina_128.jpg",
  "grahamkennery_128.jpg",
  "greenbes_128.jpg",
  "gregkilian_128.jpg",
  "gregrwilkinson_128.jpg",
  "gregsqueeb_128.jpg",
  "grrr_nl_128.jpg",
  "gseguin_128.jpg",
  "gt_128.jpg",
  "gu5taf_128.jpg",
  "guiiipontes_128.jpg",
  "guillemboti_128.jpg",
  "guischmitt_128.jpg",
  "gusoto_128.jpg",
  "h1brd_128.jpg",
  "hafeeskhan_128.jpg",
  "hai_ninh_nguyen_128.jpg",
  "haligaliharun_128.jpg",
  "hanna_smi_128.jpg",
  "happypeter1983_128.jpg",
  "harry_sistalam_128.jpg",
  "haruintesettden_128.jpg",
  "hasslunsford_128.jpg",
  "haydn_woods_128.jpg",
  "helderleal_128.jpg",
  "hellofeverrrr_128.jpg",
  "her_ruu_128.jpg",
  "herbigt_128.jpg",
  "herkulano_128.jpg",
  "hermanobrother_128.jpg",
  "herrhaase_128.jpg",
  "heycamtaylor_128.jpg",
  "heyimjuani_128.jpg",
  "heykenneth_128.jpg",
  "hfalucas_128.jpg",
  "hgharrygo_128.jpg",
  "hiemil_128.jpg",
  "hjartstrorn_128.jpg",
  "hoangloi_128.jpg",
  "holdenweb_128.jpg",
  "homka_128.jpg",
  "horaciobella_128.jpg",
  "hota_v_128.jpg",
  "hsinyo23_128.jpg",
  "hugocornejo_128.jpg",
  "hugomano_128.jpg",
  "iamgarth_128.jpg",
  "iamglimy_128.jpg",
  "iamjdeleon_128.jpg",
  "iamkarna_128.jpg",
  "iamkeithmason_128.jpg",
  "iamsteffen_128.jpg",
  "id835559_128.jpg",
  "idiot_128.jpg",
  "iduuck_128.jpg",
  "ifarafonow_128.jpg",
  "igorgarybaldi_128.jpg",
  "illyzoren_128.jpg",
  "ilya_pestov_128.jpg",
  "imammuht_128.jpg",
  "imcoding_128.jpg",
  "imomenui_128.jpg",
  "imsoper_128.jpg",
  "increase_128.jpg",
  "incubo82_128.jpg",
  "instalox_128.jpg",
  "ionuss_128.jpg",
  "ipavelek_128.jpg",
  "iqbalperkasa_128.jpg",
  "iqonicd_128.jpg",
  "irae_128.jpg",
  "isaacfifth_128.jpg",
  "isacosta_128.jpg",
  "ismail_biltagi_128.jpg",
  "isnifer_128.jpg",
  "itolmach_128.jpg",
  "itsajimithing_128.jpg",
  "itskawsar_128.jpg",
  "itstotallyamy_128.jpg",
  "ivanfilipovbg_128.jpg",
  "j04ntoh_128.jpg",
  "j2deme_128.jpg",
  "j_drake__128.jpg",
  "jackiesaik_128.jpg",
  "jacksonlatka_128.jpg",
  "jacobbennett_128.jpg",
  "jagan123_128.jpg",
  "jakemoore_128.jpg",
  "jamiebrittain_128.jpg",
  "janpalounek_128.jpg",
  "jarjan_128.jpg",
  "jarsen_128.jpg",
  "jasonmarkjones_128.jpg",
  "javorszky_128.jpg",
  "jay_wilburn_128.jpg",
  "jayphen_128.jpg",
  "jayrobinson_128.jpg",
  "jcubic_128.jpg",
  "jedbridges_128.jpg",
  "jefffis_128.jpg",
  "jeffgolenski_128.jpg",
  "jehnglynn_128.jpg",
  "jennyshen_128.jpg",
  "jennyyo_128.jpg",
  "jeremery_128.jpg",
  "jeremiaha_128.jpg",
  "jeremiespoken_128.jpg",
  "jeremymouton_128.jpg",
  "jeremyshimko_128.jpg",
  "jeremyworboys_128.jpg",
  "jerrybai1907_128.jpg",
  "jervo_128.jpg",
  "jesseddy_128.jpg",
  "jffgrdnr_128.jpg",
  "jghyllebert_128.jpg",
  "jimmuirhead_128.jpg",
  "jitachi_128.jpg",
  "jjshaw14_128.jpg",
  "jjsiii_128.jpg",
  "jlsolerdeltoro_128.jpg",
  "jm_denis_128.jpg",
  "jmfsocial_128.jpg",
  "jmillspaysbills_128.jpg",
  "jnmnrd_128.jpg",
  "joannefournier_128.jpg",
  "joaoedumedeiros_128.jpg",
  "jodytaggart_128.jpg",
  "joe_black_128.jpg",
  "joelcipriano_128.jpg",
  "joelhelin_128.jpg",
  "joemdesign_128.jpg",
  "joetruesdell_128.jpg",
  "joeymurdah_128.jpg",
  "johannesneu_128.jpg",
  "johncafazza_128.jpg",
  "johndezember_128.jpg",
  "johnriordan_128.jpg",
  "johnsmithagency_128.jpg",
  "joki4_128.jpg",
  "jomarmen_128.jpg",
  "jonathansimmons_128.jpg",
  "jonkspr_128.jpg",
  "jonsgotwood_128.jpg",
  "jordyvdboom_128.jpg",
  "joreira_128.jpg",
  "josecarlospsh_128.jpg",
  "josemarques_128.jpg",
  "josep_martins_128.jpg",
  "josevnclch_128.jpg",
  "joshaustin_128.jpg",
  "joshhemsley_128.jpg",
  "joshmedeski_128.jpg",
  "joshuaraichur_128.jpg",
  "joshuasortino_128.jpg",
  "jpenico_128.jpg",
  "jpscribbles_128.jpg",
  "jqiuss_128.jpg",
  "juamperro_128.jpg",
  "juangomezw_128.jpg",
  "juanmamartinez_128.jpg",
  "juaumlol_128.jpg",
  "judzhin_miles_128.jpg",
  "justinrgraham_128.jpg",
  "justinrhee_128.jpg",
  "justinrob_128.jpg",
  "justme_timothyg_128.jpg",
  "jwalter14_128.jpg",
  "jydesign_128.jpg",
  "kaelifa_128.jpg",
  "kalmerrautam_128.jpg",
  "kamal_chaneman_128.jpg",
  "kanickairaj_128.jpg",
  "kapaluccio_128.jpg",
  "karalek_128.jpg",
  "karlkanall_128.jpg",
  "karolkrakowiak__128.jpg",
  "karsh_128.jpg",
  "karthipanraj_128.jpg",
  "kaspernordkvist_128.jpg",
  "katiemdaly_128.jpg",
  "kaysix_dizzy_128.jpg",
  "kazaky999_128.jpg",
  "kennyadr_128.jpg",
  "kerem_128.jpg",
  "kerihenare_128.jpg",
  "keryilmaz_128.jpg",
  "kevinjohndayy_128.jpg",
  "kevinoh_128.jpg",
  "kevka_128.jpg",
  "keyuri85_128.jpg",
  "kianoshp_128.jpg",
  "kijanmaharjan_128.jpg",
  "kikillo_128.jpg",
  "kimcool_128.jpg",
  "kinday_128.jpg",
  "kirangopal_128.jpg",
  "kiwiupover_128.jpg",
  "kkusaa_128.jpg",
  "klefue_128.jpg",
  "klimmka_128.jpg",
  "knilob_128.jpg",
  "kohette_128.jpg",
  "kojourin_128.jpg",
  "kolage_128.jpg",
  "kolmarlopez_128.jpg",
  "kolsvein_128.jpg",
  "konus_128.jpg",
  "koridhandy_128.jpg",
  "kosmar_128.jpg",
  "kostaspt_128.jpg",
  "krasnoukhov_128.jpg",
  "krystalfister_128.jpg",
  "kucingbelang4_128.jpg",
  "kudretkeskin_128.jpg",
  "kuldarkalvik_128.jpg",
  "kumarrajan12123_128.jpg",
  "kurafire_128.jpg",
  "kurtinc_128.jpg",
  "kushsolitary_128.jpg",
  "kvasnic_128.jpg",
  "ky_128.jpg",
  "kylefoundry_128.jpg",
  "kylefrost_128.jpg",
  "laasli_128.jpg",
  "lanceguyatt_128.jpg",
  "langate_128.jpg",
  "larrybolt_128.jpg",
  "larrygerard_128.jpg",
  "laurengray_128.jpg",
  "lawlbwoy_128.jpg",
  "layerssss_128.jpg",
  "leandrovaranda_128.jpg",
  "lebinoclard_128.jpg",
  "lebronjennan_128.jpg",
  "leehambley_128.jpg",
  "leeiio_128.jpg",
  "leemunroe_128.jpg",
  "leonfedotov_128.jpg",
  "lepetitogre_128.jpg",
  "lepinski_128.jpg",
  "levisan_128.jpg",
  "lewisainslie_128.jpg",
  "lhausermann_128.jpg",
  "liminha_128.jpg",
  "lingeswaran_128.jpg",
  "linkibol_128.jpg",
  "linux29_128.jpg",
  "lisovsky_128.jpg",
  "llun_128.jpg",
  "lmjabreu_128.jpg",
  "loganjlambert_128.jpg",
  "logorado_128.jpg",
  "lokesh_coder_128.jpg",
  "lonesomelemon_128.jpg",
  "longlivemyword_128.jpg",
  "looneydoodle_128.jpg",
  "lososina_128.jpg",
  "louis_currie_128.jpg",
  "low_res_128.jpg",
  "lowie_128.jpg",
  "lu4sh1i_128.jpg",
  "ludwiczakpawel_128.jpg",
  "luxe_128.jpg",
  "lvovenok_128.jpg",
  "m4rio_128.jpg",
  "m_kalibry_128.jpg",
  "ma_tiax_128.jpg",
  "mactopus_128.jpg",
  "macxim_128.jpg",
  "madcampos_128.jpg",
  "madebybrenton_128.jpg",
  "madebyvadim_128.jpg",
  "madewulf_128.jpg",
  "madshensel_128.jpg",
  "madysondesigns_128.jpg",
  "magoo04_128.jpg",
  "magugzbrand2d_128.jpg",
  "mahdif_128.jpg",
  "mahmoudmetwally_128.jpg",
  "maikelk_128.jpg",
  "maiklam_128.jpg",
  "malgordon_128.jpg",
  "malykhinv_128.jpg",
  "mandalareopens_128.jpg",
  "manekenthe_128.jpg",
  "mangosango_128.jpg",
  "manigm_128.jpg",
  "marakasina_128.jpg",
  "marciotoledo_128.jpg",
  "marclgonzales_128.jpg",
  "marcobarbosa_128.jpg",
  "marcomano__128.jpg",
  "marcoramires_128.jpg",
  "marcusgorillius_128.jpg",
  "markjenkins_128.jpg",
  "marklamb_128.jpg",
  "markolschesky_128.jpg",
  "markretzloff_128.jpg",
  "markwienands_128.jpg",
  "marlinjayakody_128.jpg",
  "marosholly_128.jpg",
  "marrimo_128.jpg",
  "marshallchen__128.jpg",
  "martinansty_128.jpg",
  "martip07_128.jpg",
  "mashaaaaal_128.jpg",
  "mastermindesign_128.jpg",
  "matbeedotcom_128.jpg",
  "mateaodviteza_128.jpg",
  "matkins_128.jpg",
  "matt3224_128.jpg",
  "mattbilotti_128.jpg",
  "mattdetails_128.jpg",
  "matthewkay__128.jpg",
  "mattlat_128.jpg",
  "mattsapii_128.jpg",
  "mauriolg_128.jpg",
  "maximseshuk_128.jpg",
  "maximsorokin_128.jpg",
  "maxlinderman_128.jpg",
  "maz_128.jpg",
  "mbilalsiddique1_128.jpg",
  "mbilderbach_128.jpg",
  "mcflydesign_128.jpg",
  "mds_128.jpg",
  "mdsisto_128.jpg",
  "meelford_128.jpg",
  "megdraws_128.jpg",
  "mekal_128.jpg",
  "meln1ks_128.jpg",
  "melvindidit_128.jpg",
  "mfacchinello_128.jpg",
  "mgonto_128.jpg",
  "mhaligowski_128.jpg",
  "mhesslow_128.jpg",
  "mhudobivnik_128.jpg",
  "michaelabehsera_128.jpg",
  "michaelbrooksjr_128.jpg",
  "michaelcolenso_128.jpg",
  "michaelcomiskey_128.jpg",
  "michaelkoper_128.jpg",
  "michaelmartinho_128.jpg",
  "michalhron_128.jpg",
  "michigangraham_128.jpg",
  "michzen_128.jpg",
  "mighty55_128.jpg",
  "miguelkooreman_128.jpg",
  "miguelmendes_128.jpg",
  "mikaeljorhult_128.jpg",
  "mikebeecham_128.jpg",
  "mikemai2awesome_128.jpg",
  "millinet_128.jpg",
  "mirfanqureshi_128.jpg",
  "missaaamy_128.jpg",
  "mizhgan_128.jpg",
  "mizko_128.jpg",
  "mkginfo_128.jpg",
  "mocabyte_128.jpg",
  "mohanrohith_128.jpg",
  "moscoz_128.jpg",
  "motionthinks_128.jpg",
  "moynihan_128.jpg",
  "mr_shiznit_128.jpg",
  "mr_subtle_128.jpg",
  "mrebay007_128.jpg",
  "mrjamesnoble_128.jpg",
  "mrmartineau_128.jpg",
  "mrxloka_128.jpg",
  "mslarkina_128.jpg",
  "msveet_128.jpg",
  "mtolokonnikov_128.jpg",
  "mufaddal_mw_128.jpg",
  "mugukamil_128.jpg",
  "muridrahhal_128.jpg",
  "muringa_128.jpg",
  "murrayswift_128.jpg",
  "mutlu82_128.jpg",
  "mutu_krish_128.jpg",
  "mvdheuvel_128.jpg",
  "mwarkentin_128.jpg",
  "myastro_128.jpg",
  "mylesb_128.jpg",
  "mymyboy_128.jpg",
  "n1ght_coder_128.jpg",
  "n3dmax_128.jpg",
  "n_tassone_128.jpg",
  "nacho_128.jpg",
  "naitanamoreno_128.jpg",
  "namankreative_128.jpg",
  "nandini_m_128.jpg",
  "nasirwd_128.jpg",
  "nastya_mane_128.jpg",
  "nateschulte_128.jpg",
  "nathalie_fs_128.jpg",
  "naupintos_128.jpg",
  "nbirckel_128.jpg",
  "nckjrvs_128.jpg",
  "necodymiconer_128.jpg",
  "nehfy_128.jpg",
  "nellleo_128.jpg",
  "nelshd_128.jpg",
  "nelsonjoyce_128.jpg",
  "nemanjaivanovic_128.jpg",
  "nepdud_128.jpg",
  "nerdgr8_128.jpg",
  "nerrsoft_128.jpg",
  "nessoila_128.jpg",
  "netonet_il_128.jpg",
  "newbrushes_128.jpg",
  "nfedoroff_128.jpg",
  "nickfratter_128.jpg",
  "nicklacke_128.jpg",
  "nicolai_larsen_128.jpg",
  "nicolasfolliot_128.jpg",
  "nicoleglynn_128.jpg",
  "nicollerich_128.jpg",
  "nilshelmersson_128.jpg",
  "nilshoenson_128.jpg",
  "ninjad3m0_128.jpg",
  "nitinhayaran_128.jpg",
  "nomidesigns_128.jpg",
  "normanbox_128.jpg",
  "notbadart_128.jpg",
  "noufalibrahim_128.jpg",
  "noxdzine_128.jpg",
  "nsamoylov_128.jpg",
  "ntfblog_128.jpg",
  "nutzumi_128.jpg",
  "nvkznemo_128.jpg",
  "nwdsha_128.jpg",
  "nyancecom_128.jpg",
  "oaktreemedia_128.jpg",
  "okandungel_128.jpg",
  "okansurreel_128.jpg",
  "okcoker_128.jpg",
  "oksanafrewer_128.jpg",
  "okseanjay_128.jpg",
  "oktayelipek_128.jpg",
  "olaolusoga_128.jpg",
  "olgary_128.jpg",
  "omnizya_128.jpg",
  "ooomz_128.jpg",
  "operatino_128.jpg",
  "opnsrce_128.jpg",
  "orkuncaylar_128.jpg",
  "oscarowusu_128.jpg",
  "oskamaya_128.jpg",
  "oskarlevinson_128.jpg",
  "osmanince_128.jpg",
  "osmond_128.jpg",
  "ostirbu_128.jpg",
  "osvaldas_128.jpg",
  "otozk_128.jpg",
  "ovall_128.jpg",
  "overcloacked_128.jpg",
  "overra_128.jpg",
  "panchajanyag_128.jpg",
  "panghal0_128.jpg",
  "patrickcoombe_128.jpg",
  "paulfarino_128.jpg",
  "pcridesagain_128.jpg",
  "peachananr_128.jpg",
  "pechkinator_128.jpg",
  "peejfancher_128.jpg",
  "pehamondello_128.jpg",
  "perfectflow_128.jpg",
  "perretmagali_128.jpg",
  "petar_prog_128.jpg",
  "petebernardo_128.jpg",
  "peter576_128.jpg",
  "peterlandt_128.jpg",
  "petrangr_128.jpg",
  "phillapier_128.jpg",
  "picard102_128.jpg",
  "pierre_nel_128.jpg",
  "pierrestoffe_128.jpg",
  "pifagor_128.jpg",
  "pixage_128.jpg",
  "plasticine_128.jpg",
  "plbabin_128.jpg",
  "pmeissner_128.jpg",
  "polarity_128.jpg",
  "ponchomendivil_128.jpg",
  "poormini_128.jpg",
  "popey_128.jpg",
  "posterjob_128.jpg",
  "praveen_vijaya_128.jpg",
  "prheemo_128.jpg",
  "primozcigler_128.jpg",
  "prinzadi_128.jpg",
  "privetwagner_128.jpg",
  "prrstn_128.jpg",
  "psaikali_128.jpg",
  "psdesignuk_128.jpg",
  "puzik_128.jpg",
  "pyronite_128.jpg",
  "quailandquasar_128.jpg",
  "r_garcia_128.jpg",
  "r_oy_128.jpg",
  "rachelreveley_128.jpg",
  "rahmeen_128.jpg",
  "ralph_lam_128.jpg",
  "ramanathan_pdy_128.jpg",
  "randomlies_128.jpg",
  "rangafangs_128.jpg",
  "raphaelnikson_128.jpg",
  "raquelwilson_128.jpg",
  "ratbus_128.jpg",
  "rawdiggie_128.jpg",
  "rdbannon_128.jpg",
  "rdsaunders_128.jpg",
  "reabo101_128.jpg",
  "reetajayendra_128.jpg",
  "rehatkathuria_128.jpg",
  "reideiredale_128.jpg",
  "renbyrd_128.jpg",
  "rez___a_128.jpg",
  "ricburton_128.jpg",
  "richardgarretts_128.jpg",
  "richwild_128.jpg",
  "rickdt_128.jpg",
  "rickyyean_128.jpg",
  "rikas_128.jpg",
  "ripplemdk_128.jpg",
  "rmlewisuk_128.jpg",
  "rob_thomas10_128.jpg",
  "robbschiller_128.jpg",
  "robergd_128.jpg",
  "robinclediere_128.jpg",
  "robinlayfield_128.jpg",
  "robturlinckx_128.jpg",
  "rodnylobos_128.jpg",
  "rohixx_128.jpg",
  "romanbulah_128.jpg",
  "roxanejammet_128.jpg",
  "roybarberuk_128.jpg",
  "rpatey_128.jpg",
  "rpeezy_128.jpg",
  "rtgibbons_128.jpg",
  "rtyukmaev_128.jpg",
  "rude_128.jpg",
  "ruehldesign_128.jpg",
  "runningskull_128.jpg",
  "russell_baylis_128.jpg",
  "russoedu_128.jpg",
  "ruzinav_128.jpg",
  "rweve_128.jpg",
  "ryandownie_128.jpg",
  "ryanjohnson_me_128.jpg",
  "ryankirkman_128.jpg",
  "ryanmclaughlin_128.jpg",
  "ryhanhassan_128.jpg",
  "ryuchi311_128.jpg",
  "s4f1_128.jpg",
  "saarabpreet_128.jpg",
  "sachacorazzi_128.jpg",
  "sachingawas_128.jpg",
  "safrankov_128.jpg",
  "sainraja_128.jpg",
  "salimianoff_128.jpg",
  "salleedesign_128.jpg",
  "salvafc_128.jpg",
  "samgrover_128.jpg",
  "samihah_128.jpg",
  "samscouto_128.jpg",
  "samuelkraft_128.jpg",
  "sandywoodruff_128.jpg",
  "sangdth_128.jpg",
  "santi_urso_128.jpg",
  "saschadroste_128.jpg",
  "saschamt_128.jpg",
  "sasha_shestakov_128.jpg",
  "saulihirvi_128.jpg",
  "sawalazar_128.jpg",
  "sawrb_128.jpg",
  "sbtransparent_128.jpg",
  "scips_128.jpg",
  "scott_riley_128.jpg",
  "scottfeltham_128.jpg",
  "scottgallant_128.jpg",
  "scottiedude_128.jpg",
  "scottkclark_128.jpg",
  "scrapdnb_128.jpg",
  "sdidonato_128.jpg",
  "sebashton_128.jpg",
  "sementiy_128.jpg",
  "serefka_128.jpg",
  "sergeyalmone_128.jpg",
  "sergeysafonov_128.jpg",
  "sethlouey_128.jpg",
  "seyedhossein1_128.jpg",
  "sgaurav_baghel_128.jpg",
  "shadeed9_128.jpg",
  "shalt0ni_128.jpg",
  "shaneIxD_128.jpg",
  "shanehudson_128.jpg",
  "sharvin_128.jpg",
  "shesgared_128.jpg",
  "shinze_128.jpg",
  "shoaib253_128.jpg",
  "shojberg_128.jpg",
  "shvelo96_128.jpg",
  "silv3rgvn_128.jpg",
  "silvanmuhlemann_128.jpg",
  "simobenso_128.jpg",
  "sindresorhus_128.jpg",
  "sircalebgrove_128.jpg",
  "skkirilov_128.jpg",
  "slowspock_128.jpg",
  "smaczny_128.jpg",
  "smalonso_128.jpg",
  "smenov_128.jpg",
  "snowshade_128.jpg",
  "snowwrite_128.jpg",
  "sokaniwaal_128.jpg",
  "solid_color_128.jpg",
  "souperphly_128.jpg",
  "souuf_128.jpg",
  "sovesove_128.jpg",
  "soyjavi_128.jpg",
  "spacewood__128.jpg",
  "spbroma_128.jpg",
  "spedwig_128.jpg",
  "sprayaga_128.jpg",
  "sreejithexp_128.jpg",
  "ssbb_me_128.jpg",
  "ssiskind_128.jpg",
  "sta1ex_128.jpg",
  "stalewine_128.jpg",
  "stan_128.jpg",
  "stayuber_128.jpg",
  "stefanotirloni_128.jpg",
  "stefanozoffoli_128.jpg",
  "stefooo_128.jpg",
  "stefvdham_128.jpg",
  "stephcoue_128.jpg",
  "sterlingrules_128.jpg",
  "stevedesigner_128.jpg",
  "steynviljoen_128.jpg",
  "strikewan_128.jpg",
  "stushona_128.jpg",
  "sulaqo_128.jpg",
  "sunlandictwin_128.jpg",
  "sunshinedgirl_128.jpg",
  "superoutman_128.jpg",
  "supervova_128.jpg",
  "supjoey_128.jpg",
  "suprb_128.jpg",
  "sur4dye_128.jpg",
  "surgeonist_128.jpg",
  "suribbles_128.jpg",
  "svenlen_128.jpg",
  "swaplord_128.jpg",
  "sweetdelisa_128.jpg",
  "switmer777_128.jpg",
  "swooshycueb_128.jpg",
  "sydlawrence_128.jpg",
  "syropian_128.jpg",
  "tanveerrao_128.jpg",
  "taybenlor_128.jpg",
  "taylorling_128.jpg",
  "tbakdesigns_128.jpg",
  "teddyzetterlund_128.jpg",
  "teeragit_128.jpg",
  "tereshenkov_128.jpg",
  "terpimost_128.jpg",
  "terrorpixel_128.jpg",
  "terryxlife_128.jpg",
  "teylorfeliz_128.jpg",
  "tgerken_128.jpg",
  "tgormtx_128.jpg",
  "thaisselenator__128.jpg",
  "thaodang17_128.jpg",
  "thatonetommy_128.jpg",
  "the_purplebunny_128.jpg",
  "the_winslet_128.jpg",
  "thedamianhdez_128.jpg",
  "thedjpetersen_128.jpg",
  "thehacker_128.jpg",
  "thekevinjones_128.jpg",
  "themadray_128.jpg",
  "themikenagle_128.jpg",
  "themrdave_128.jpg",
  "theonlyzeke_128.jpg",
  "therealmarvin_128.jpg",
  "thewillbeard_128.jpg",
  "thiagovernetti_128.jpg",
  "thibaut_re_128.jpg",
  "thierrykoblentz_128.jpg",
  "thierrymeier__128.jpg",
  "thimo_cz_128.jpg",
  "thinkleft_128.jpg",
  "thomasgeisen_128.jpg",
  "thomasschrijer_128.jpg",
  "timgthomas_128.jpg",
  "timmillwood_128.jpg",
  "timothycd_128.jpg",
  "timpetricola_128.jpg",
  "tjrus_128.jpg",
  "to_soham_128.jpg",
  "tobysaxon_128.jpg",
  "toddrew_128.jpg",
  "tom_even_128.jpg",
  "tomas_janousek_128.jpg",
  "tonymillion_128.jpg",
  "traneblow_128.jpg",
  "travis_arnold_128.jpg",
  "travishines_128.jpg",
  "tristanlegros_128.jpg",
  "trubeatto_128.jpg",
  "trueblood_33_128.jpg",
  "tumski_128.jpg",
  "tur8le_128.jpg",
  "turkutuuli_128.jpg",
  "tweetubhai_128.jpg",
  "twittypork_128.jpg",
  "txcx_128.jpg",
  "uberschizo_128.jpg",
  "ultragex_128.jpg",
  "umurgdk_128.jpg",
  "unterdreht_128.jpg",
  "urrutimeoli_128.jpg",
  "uxalex_128.jpg",
  "uxpiper_128.jpg",
  "uxward_128.jpg",
  "vanchesz_128.jpg",
  "vaughanmoffitt_128.jpg",
  "vc27_128.jpg",
  "vicivadeline_128.jpg",
  "victorDubugras_128.jpg",
  "victor_haydin_128.jpg",
  "victordeanda_128.jpg",
  "victorerixon_128.jpg",
  "victorquinn_128.jpg",
  "victorstuber_128.jpg",
  "vigobronx_128.jpg",
  "vijaykarthik_128.jpg",
  "vikashpathak18_128.jpg",
  "vikasvinfotech_128.jpg",
  "vimarethomas_128.jpg",
  "vinciarts_128.jpg",
  "vitor376_128.jpg",
  "vitorleal_128.jpg",
  "vivekprvr_128.jpg",
  "vj_demien_128.jpg",
  "vladarbatov_128.jpg",
  "vladimirdevic_128.jpg",
  "vladyn_128.jpg",
  "vlajki_128.jpg",
  "vm_f_128.jpg",
  "vocino_128.jpg",
  "vonachoo_128.jpg",
  "vovkasolovev_128.jpg",
  "vytautas_a_128.jpg",
  "waghner_128.jpg",
  "wake_gs_128.jpg",
  "we_social_128.jpg",
  "wearesavas_128.jpg",
  "weavermedia_128.jpg",
  "webtanya_128.jpg",
  "weglov_128.jpg",
  "wegotvices_128.jpg",
  "wesleytrankin_128.jpg",
  "wikiziner_128.jpg",
  "wiljanslofstra_128.jpg",
  "wim1k_128.jpg",
  "wintopia_128.jpg",
  "woodsman001_128.jpg",
  "woodydotmx_128.jpg",
  "wtrsld_128.jpg",
  "xadhix_128.jpg",
  "xalionmalik_128.jpg",
  "xamorep_128.jpg",
  "xiel_128.jpg",
  "xilantra_128.jpg",
  "xravil_128.jpg",
  "xripunov_128.jpg",
  "xtopherpaul_128.jpg",
  "y2graphic_128.jpg",
  "yalozhkin_128.jpg",
  "yassiryahya_128.jpg",
  "yayteejay_128.jpg",
  "yecidsm_128.jpg",
  "yehudab_128.jpg",
  "yesmeck_128.jpg",
  "yigitpinarbasi_128.jpg",
  "zackeeler_128.jpg",
  "zaki3d_128.jpg",
  "zauerkraut_128.jpg",
  "zforrester_128.jpg",
  "zvchkelly_128.jpg"
];
const domain_suffix = ["com", "biz", "info", "name", "net", "org"];
const emoji = {
  smiley: [
    "\u{1F600}",
    "\u{1F603}",
    "\u{1F604}",
    "\u{1F601}",
    "\u{1F606}",
    "\u{1F605}",
    "\u{1F923}",
    "\u{1F602}",
    "\u{1F642}",
    "\u{1F643}",
    "\u{1F609}",
    "\u{1F60A}",
    "\u{1F607}",
    "\u{1F970}",
    "\u{1F60D}",
    "\u{1F929}",
    "\u{1F618}",
    "\u{1F617}",
    "\u263A\uFE0F",
    "\u{1F61A}",
    "\u{1F619}",
    "\u{1F972}",
    "\u{1F60B}",
    "\u{1F61B}",
    "\u{1F61C}",
    "\u{1F92A}",
    "\u{1F61D}",
    "\u{1F911}",
    "\u{1F917}",
    "\u{1F92D}",
    "\u{1F92B}",
    "\u{1F914}",
    "\u{1F910}",
    "\u{1F928}",
    "\u{1F610}",
    "\u{1F611}",
    "\u{1F636}",
    "\u{1F636}\u200D\u{1F32B}\uFE0F",
    "\u{1F60F}",
    "\u{1F612}",
    "\u{1F644}",
    "\u{1F62C}",
    "\u{1F62E}\u200D\u{1F4A8}",
    "\u{1F925}",
    "\u{1F60C}",
    "\u{1F614}",
    "\u{1F62A}",
    "\u{1F924}",
    "\u{1F634}",
    "\u{1F637}",
    "\u{1F912}",
    "\u{1F915}",
    "\u{1F922}",
    "\u{1F92E}",
    "\u{1F927}",
    "\u{1F975}",
    "\u{1F976}",
    "\u{1F974}",
    "\u{1F635}",
    "\u{1F635}\u200D\u{1F4AB}",
    "\u{1F92F}",
    "\u{1F920}",
    "\u{1F973}",
    "\u{1F978}",
    "\u{1F60E}",
    "\u{1F913}",
    "\u{1F9D0}",
    "\u{1F615}",
    "\u{1F61F}",
    "\u{1F641}",
    "\u2639\uFE0F",
    "\u{1F62E}",
    "\u{1F62F}",
    "\u{1F632}",
    "\u{1F633}",
    "\u{1F97A}",
    "\u{1F626}",
    "\u{1F627}",
    "\u{1F628}",
    "\u{1F630}",
    "\u{1F625}",
    "\u{1F622}",
    "\u{1F62D}",
    "\u{1F631}",
    "\u{1F616}",
    "\u{1F623}",
    "\u{1F61E}",
    "\u{1F613}",
    "\u{1F629}",
    "\u{1F62B}",
    "\u{1F971}",
    "\u{1F624}",
    "\u{1F621}",
    "\u{1F620}",
    "\u{1F92C}",
    "\u{1F608}",
    "\u{1F47F}",
    "\u{1F480}",
    "\u2620\uFE0F",
    "\u{1F4A9}",
    "\u{1F921}",
    "\u{1F479}",
    "\u{1F47A}",
    "\u{1F47B}",
    "\u{1F47D}",
    "\u{1F47E}",
    "\u{1F916}",
    "\u{1F63A}",
    "\u{1F638}",
    "\u{1F639}",
    "\u{1F63B}",
    "\u{1F63C}",
    "\u{1F63D}",
    "\u{1F640}",
    "\u{1F63F}",
    "\u{1F63E}",
    "\u{1F648}",
    "\u{1F649}",
    "\u{1F64A}",
    "\u{1F48B}",
    "\u{1F48C}",
    "\u{1F498}",
    "\u{1F49D}",
    "\u{1F496}",
    "\u{1F497}",
    "\u{1F493}",
    "\u{1F49E}",
    "\u{1F495}",
    "\u{1F49F}",
    "\u2763\uFE0F",
    "\u{1F494}",
    "\u2764\uFE0F\u200D\u{1F525}",
    "\u2764\uFE0F\u200D\u{1FA79}",
    "\u2764\uFE0F",
    "\u{1F9E1}",
    "\u{1F49B}",
    "\u{1F49A}",
    "\u{1F499}",
    "\u{1F49C}",
    "\u{1F90E}",
    "\u{1F5A4}",
    "\u{1F90D}",
    "\u{1F4AF}",
    "\u{1F4A2}",
    "\u{1F4A5}",
    "\u{1F4AB}",
    "\u{1F4A6}",
    "\u{1F4A8}",
    "\u{1F573}\uFE0F",
    "\u{1F4A3}",
    "\u{1F4AC}",
    "\u{1F441}\uFE0F\u200D\u{1F5E8}\uFE0F",
    "\u{1F5E8}\uFE0F",
    "\u{1F5EF}\uFE0F",
    "\u{1F4AD}",
    "\u{1F4A4}"
  ],
  body: [
    "\u{1F44B}",
    "\u{1F44B}\u{1F3FB}",
    "\u{1F44B}\u{1F3FC}",
    "\u{1F44B}\u{1F3FD}",
    "\u{1F44B}\u{1F3FE}",
    "\u{1F44B}\u{1F3FF}",
    "\u{1F91A}",
    "\u{1F91A}\u{1F3FB}",
    "\u{1F91A}\u{1F3FC}",
    "\u{1F91A}\u{1F3FD}",
    "\u{1F91A}\u{1F3FE}",
    "\u{1F91A}\u{1F3FF}",
    "\u{1F590}\uFE0F",
    "\u{1F590}\u{1F3FB}",
    "\u{1F590}\u{1F3FC}",
    "\u{1F590}\u{1F3FD}",
    "\u{1F590}\u{1F3FE}",
    "\u{1F590}\u{1F3FF}",
    "\u270B",
    "\u270B\u{1F3FB}",
    "\u270B\u{1F3FC}",
    "\u270B\u{1F3FD}",
    "\u270B\u{1F3FE}",
    "\u270B\u{1F3FF}",
    "\u{1F596}",
    "\u{1F596}\u{1F3FB}",
    "\u{1F596}\u{1F3FC}",
    "\u{1F596}\u{1F3FD}",
    "\u{1F596}\u{1F3FE}",
    "\u{1F596}\u{1F3FF}",
    "\u{1F44C}",
    "\u{1F44C}\u{1F3FB}",
    "\u{1F44C}\u{1F3FC}",
    "\u{1F44C}\u{1F3FD}",
    "\u{1F44C}\u{1F3FE}",
    "\u{1F44C}\u{1F3FF}",
    "\u{1F90C}",
    "\u{1F90C}\u{1F3FB}",
    "\u{1F90C}\u{1F3FC}",
    "\u{1F90C}\u{1F3FD}",
    "\u{1F90C}\u{1F3FE}",
    "\u{1F90C}\u{1F3FF}",
    "\u{1F90F}",
    "\u{1F90F}\u{1F3FB}",
    "\u{1F90F}\u{1F3FC}",
    "\u{1F90F}\u{1F3FD}",
    "\u{1F90F}\u{1F3FE}",
    "\u{1F90F}\u{1F3FF}",
    "\u270C\uFE0F",
    "\u270C\u{1F3FB}",
    "\u270C\u{1F3FC}",
    "\u270C\u{1F3FD}",
    "\u270C\u{1F3FE}",
    "\u270C\u{1F3FF}",
    "\u{1F91E}",
    "\u{1F91E}\u{1F3FB}",
    "\u{1F91E}\u{1F3FC}",
    "\u{1F91E}\u{1F3FD}",
    "\u{1F91E}\u{1F3FE}",
    "\u{1F91E}\u{1F3FF}",
    "\u{1F91F}",
    "\u{1F91F}\u{1F3FB}",
    "\u{1F91F}\u{1F3FC}",
    "\u{1F91F}\u{1F3FD}",
    "\u{1F91F}\u{1F3FE}",
    "\u{1F91F}\u{1F3FF}",
    "\u{1F918}",
    "\u{1F918}\u{1F3FB}",
    "\u{1F918}\u{1F3FC}",
    "\u{1F918}\u{1F3FD}",
    "\u{1F918}\u{1F3FE}",
    "\u{1F918}\u{1F3FF}",
    "\u{1F919}",
    "\u{1F919}\u{1F3FB}",
    "\u{1F919}\u{1F3FC}",
    "\u{1F919}\u{1F3FD}",
    "\u{1F919}\u{1F3FE}",
    "\u{1F919}\u{1F3FF}",
    "\u{1F448}",
    "\u{1F448}\u{1F3FB}",
    "\u{1F448}\u{1F3FC}",
    "\u{1F448}\u{1F3FD}",
    "\u{1F448}\u{1F3FE}",
    "\u{1F448}\u{1F3FF}",
    "\u{1F449}",
    "\u{1F449}\u{1F3FB}",
    "\u{1F449}\u{1F3FC}",
    "\u{1F449}\u{1F3FD}",
    "\u{1F449}\u{1F3FE}",
    "\u{1F449}\u{1F3FF}",
    "\u{1F446}",
    "\u{1F446}\u{1F3FB}",
    "\u{1F446}\u{1F3FC}",
    "\u{1F446}\u{1F3FD}",
    "\u{1F446}\u{1F3FE}",
    "\u{1F446}\u{1F3FF}",
    "\u{1F595}",
    "\u{1F595}\u{1F3FB}",
    "\u{1F595}\u{1F3FC}",
    "\u{1F595}\u{1F3FD}",
    "\u{1F595}\u{1F3FE}",
    "\u{1F595}\u{1F3FF}",
    "\u{1F447}",
    "\u{1F447}\u{1F3FB}",
    "\u{1F447}\u{1F3FC}",
    "\u{1F447}\u{1F3FD}",
    "\u{1F447}\u{1F3FE}",
    "\u{1F447}\u{1F3FF}",
    "\u261D\uFE0F",
    "\u261D\u{1F3FB}",
    "\u261D\u{1F3FC}",
    "\u261D\u{1F3FD}",
    "\u261D\u{1F3FE}",
    "\u261D\u{1F3FF}",
    "\u{1F44D}",
    "\u{1F44D}\u{1F3FB}",
    "\u{1F44D}\u{1F3FC}",
    "\u{1F44D}\u{1F3FD}",
    "\u{1F44D}\u{1F3FE}",
    "\u{1F44D}\u{1F3FF}",
    "\u{1F44E}",
    "\u{1F44E}\u{1F3FB}",
    "\u{1F44E}\u{1F3FC}",
    "\u{1F44E}\u{1F3FD}",
    "\u{1F44E}\u{1F3FE}",
    "\u{1F44E}\u{1F3FF}",
    "\u270A",
    "\u270A\u{1F3FB}",
    "\u270A\u{1F3FC}",
    "\u270A\u{1F3FD}",
    "\u270A\u{1F3FE}",
    "\u270A\u{1F3FF}",
    "\u{1F44A}",
    "\u{1F44A}\u{1F3FB}",
    "\u{1F44A}\u{1F3FC}",
    "\u{1F44A}\u{1F3FD}",
    "\u{1F44A}\u{1F3FE}",
    "\u{1F44A}\u{1F3FF}",
    "\u{1F91B}",
    "\u{1F91B}\u{1F3FB}",
    "\u{1F91B}\u{1F3FC}",
    "\u{1F91B}\u{1F3FD}",
    "\u{1F91B}\u{1F3FE}",
    "\u{1F91B}\u{1F3FF}",
    "\u{1F91C}",
    "\u{1F91C}\u{1F3FB}",
    "\u{1F91C}\u{1F3FC}",
    "\u{1F91C}\u{1F3FD}",
    "\u{1F91C}\u{1F3FE}",
    "\u{1F91C}\u{1F3FF}",
    "\u{1F44F}",
    "\u{1F44F}\u{1F3FB}",
    "\u{1F44F}\u{1F3FC}",
    "\u{1F44F}\u{1F3FD}",
    "\u{1F44F}\u{1F3FE}",
    "\u{1F44F}\u{1F3FF}",
    "\u{1F64C}",
    "\u{1F64C}\u{1F3FB}",
    "\u{1F64C}\u{1F3FC}",
    "\u{1F64C}\u{1F3FD}",
    "\u{1F64C}\u{1F3FE}",
    "\u{1F64C}\u{1F3FF}",
    "\u{1F450}",
    "\u{1F450}\u{1F3FB}",
    "\u{1F450}\u{1F3FC}",
    "\u{1F450}\u{1F3FD}",
    "\u{1F450}\u{1F3FE}",
    "\u{1F450}\u{1F3FF}",
    "\u{1F932}",
    "\u{1F932}\u{1F3FB}",
    "\u{1F932}\u{1F3FC}",
    "\u{1F932}\u{1F3FD}",
    "\u{1F932}\u{1F3FE}",
    "\u{1F932}\u{1F3FF}",
    "\u{1F91D}",
    "\u{1F64F}",
    "\u{1F64F}\u{1F3FB}",
    "\u{1F64F}\u{1F3FC}",
    "\u{1F64F}\u{1F3FD}",
    "\u{1F64F}\u{1F3FE}",
    "\u{1F64F}\u{1F3FF}",
    "\u270D\uFE0F",
    "\u270D\u{1F3FB}",
    "\u270D\u{1F3FC}",
    "\u270D\u{1F3FD}",
    "\u270D\u{1F3FE}",
    "\u270D\u{1F3FF}",
    "\u{1F485}",
    "\u{1F485}\u{1F3FB}",
    "\u{1F485}\u{1F3FC}",
    "\u{1F485}\u{1F3FD}",
    "\u{1F485}\u{1F3FE}",
    "\u{1F485}\u{1F3FF}",
    "\u{1F933}",
    "\u{1F933}\u{1F3FB}",
    "\u{1F933}\u{1F3FC}",
    "\u{1F933}\u{1F3FD}",
    "\u{1F933}\u{1F3FE}",
    "\u{1F933}\u{1F3FF}",
    "\u{1F4AA}",
    "\u{1F4AA}\u{1F3FB}",
    "\u{1F4AA}\u{1F3FC}",
    "\u{1F4AA}\u{1F3FD}",
    "\u{1F4AA}\u{1F3FE}",
    "\u{1F4AA}\u{1F3FF}",
    "\u{1F9BE}",
    "\u{1F9BF}",
    "\u{1F9B5}",
    "\u{1F9B5}\u{1F3FB}",
    "\u{1F9B5}\u{1F3FC}",
    "\u{1F9B5}\u{1F3FD}",
    "\u{1F9B5}\u{1F3FE}",
    "\u{1F9B5}\u{1F3FF}",
    "\u{1F9B6}",
    "\u{1F9B6}\u{1F3FB}",
    "\u{1F9B6}\u{1F3FC}",
    "\u{1F9B6}\u{1F3FD}",
    "\u{1F9B6}\u{1F3FE}",
    "\u{1F9B6}\u{1F3FF}",
    "\u{1F442}",
    "\u{1F442}\u{1F3FB}",
    "\u{1F442}\u{1F3FC}",
    "\u{1F442}\u{1F3FD}",
    "\u{1F442}\u{1F3FE}",
    "\u{1F442}\u{1F3FF}",
    "\u{1F9BB}",
    "\u{1F9BB}\u{1F3FB}",
    "\u{1F9BB}\u{1F3FC}",
    "\u{1F9BB}\u{1F3FD}",
    "\u{1F9BB}\u{1F3FE}",
    "\u{1F9BB}\u{1F3FF}",
    "\u{1F443}",
    "\u{1F443}\u{1F3FB}",
    "\u{1F443}\u{1F3FC}",
    "\u{1F443}\u{1F3FD}",
    "\u{1F443}\u{1F3FE}",
    "\u{1F443}\u{1F3FF}",
    "\u{1F9E0}",
    "\u{1FAC0}",
    "\u{1FAC1}",
    "\u{1F9B7}",
    "\u{1F9B4}",
    "\u{1F440}",
    "\u{1F441}\uFE0F",
    "\u{1F445}",
    "\u{1F444}"
  ],
  person: [
    "\u{1F476}",
    "\u{1F476}\u{1F3FB}",
    "\u{1F476}\u{1F3FC}",
    "\u{1F476}\u{1F3FD}",
    "\u{1F476}\u{1F3FE}",
    "\u{1F476}\u{1F3FF}",
    "\u{1F9D2}",
    "\u{1F9D2}\u{1F3FB}",
    "\u{1F9D2}\u{1F3FC}",
    "\u{1F9D2}\u{1F3FD}",
    "\u{1F9D2}\u{1F3FE}",
    "\u{1F9D2}\u{1F3FF}",
    "\u{1F466}",
    "\u{1F466}\u{1F3FB}",
    "\u{1F466}\u{1F3FC}",
    "\u{1F466}\u{1F3FD}",
    "\u{1F466}\u{1F3FE}",
    "\u{1F466}\u{1F3FF}",
    "\u{1F467}",
    "\u{1F467}\u{1F3FB}",
    "\u{1F467}\u{1F3FC}",
    "\u{1F467}\u{1F3FD}",
    "\u{1F467}\u{1F3FE}",
    "\u{1F467}\u{1F3FF}",
    "\u{1F9D1}",
    "\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FF}",
    "\u{1F471}",
    "\u{1F471}\u{1F3FB}",
    "\u{1F471}\u{1F3FC}",
    "\u{1F471}\u{1F3FD}",
    "\u{1F471}\u{1F3FE}",
    "\u{1F471}\u{1F3FF}",
    "\u{1F468}",
    "\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FF}",
    "\u{1F9D4}",
    "\u{1F9D4}\u{1F3FB}",
    "\u{1F9D4}\u{1F3FC}",
    "\u{1F9D4}\u{1F3FD}",
    "\u{1F9D4}\u{1F3FE}",
    "\u{1F9D4}\u{1F3FF}",
    "\u{1F9D4}\u200D\u2642\uFE0F",
    "\u{1F9D4}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9D4}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9D4}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9D4}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9D4}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9D4}\u200D\u2640\uFE0F",
    "\u{1F9D4}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9D4}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9D4}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9D4}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9D4}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F468}\u200D\u{1F9B0}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F9B0}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F9B0}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F9B0}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F9B0}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F9B0}",
    "\u{1F468}\u200D\u{1F9B1}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F9B1}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F9B1}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F9B1}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F9B1}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F9B1}",
    "\u{1F468}\u200D\u{1F9B3}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F9B3}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F9B3}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F9B3}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F9B3}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F9B3}",
    "\u{1F468}\u200D\u{1F9B2}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F9B2}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F9B2}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F9B2}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F9B2}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F9B2}",
    "\u{1F469}",
    "\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FF}",
    "\u{1F469}\u200D\u{1F9B0}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F9B0}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F9B0}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F9B0}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F9B0}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F9B0}",
    "\u{1F9D1}\u200D\u{1F9B0}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F9B0}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F9B0}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F9B0}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F9B0}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F9B0}",
    "\u{1F469}\u200D\u{1F9B1}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F9B1}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F9B1}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F9B1}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F9B1}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F9B1}",
    "\u{1F9D1}\u200D\u{1F9B1}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F9B1}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F9B1}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F9B1}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F9B1}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F9B1}",
    "\u{1F469}\u200D\u{1F9B3}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F9B3}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F9B3}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F9B3}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F9B3}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F9B3}",
    "\u{1F9D1}\u200D\u{1F9B3}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F9B3}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F9B3}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F9B3}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F9B3}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F9B3}",
    "\u{1F469}\u200D\u{1F9B2}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F9B2}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F9B2}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F9B2}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F9B2}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F9B2}",
    "\u{1F9D1}\u200D\u{1F9B2}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F9B2}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F9B2}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F9B2}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F9B2}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F9B2}",
    "\u{1F471}\u200D\u2640\uFE0F",
    "\u{1F471}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F471}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F471}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F471}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F471}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F471}\u200D\u2642\uFE0F",
    "\u{1F471}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F471}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F471}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F471}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F471}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9D3}",
    "\u{1F9D3}\u{1F3FB}",
    "\u{1F9D3}\u{1F3FC}",
    "\u{1F9D3}\u{1F3FD}",
    "\u{1F9D3}\u{1F3FE}",
    "\u{1F9D3}\u{1F3FF}",
    "\u{1F474}",
    "\u{1F474}\u{1F3FB}",
    "\u{1F474}\u{1F3FC}",
    "\u{1F474}\u{1F3FD}",
    "\u{1F474}\u{1F3FE}",
    "\u{1F474}\u{1F3FF}",
    "\u{1F475}",
    "\u{1F475}\u{1F3FB}",
    "\u{1F475}\u{1F3FC}",
    "\u{1F475}\u{1F3FD}",
    "\u{1F475}\u{1F3FE}",
    "\u{1F475}\u{1F3FF}",
    "\u{1F64D}",
    "\u{1F64D}\u{1F3FB}",
    "\u{1F64D}\u{1F3FC}",
    "\u{1F64D}\u{1F3FD}",
    "\u{1F64D}\u{1F3FE}",
    "\u{1F64D}\u{1F3FF}",
    "\u{1F64D}\u200D\u2642\uFE0F",
    "\u{1F64D}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F64D}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F64D}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F64D}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F64D}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F64D}\u200D\u2640\uFE0F",
    "\u{1F64D}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F64D}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F64D}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F64D}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F64D}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F64E}",
    "\u{1F64E}\u{1F3FB}",
    "\u{1F64E}\u{1F3FC}",
    "\u{1F64E}\u{1F3FD}",
    "\u{1F64E}\u{1F3FE}",
    "\u{1F64E}\u{1F3FF}",
    "\u{1F64E}\u200D\u2642\uFE0F",
    "\u{1F64E}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F64E}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F64E}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F64E}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F64E}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F64E}\u200D\u2640\uFE0F",
    "\u{1F64E}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F64E}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F64E}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F64E}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F64E}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F645}",
    "\u{1F645}\u{1F3FB}",
    "\u{1F645}\u{1F3FC}",
    "\u{1F645}\u{1F3FD}",
    "\u{1F645}\u{1F3FE}",
    "\u{1F645}\u{1F3FF}",
    "\u{1F645}\u200D\u2642\uFE0F",
    "\u{1F645}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F645}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F645}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F645}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F645}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F645}\u200D\u2640\uFE0F",
    "\u{1F645}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F645}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F645}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F645}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F645}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F646}",
    "\u{1F646}\u{1F3FB}",
    "\u{1F646}\u{1F3FC}",
    "\u{1F646}\u{1F3FD}",
    "\u{1F646}\u{1F3FE}",
    "\u{1F646}\u{1F3FF}",
    "\u{1F646}\u200D\u2642\uFE0F",
    "\u{1F646}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F646}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F646}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F646}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F646}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F646}\u200D\u2640\uFE0F",
    "\u{1F646}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F646}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F646}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F646}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F646}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F481}",
    "\u{1F481}\u{1F3FB}",
    "\u{1F481}\u{1F3FC}",
    "\u{1F481}\u{1F3FD}",
    "\u{1F481}\u{1F3FE}",
    "\u{1F481}\u{1F3FF}",
    "\u{1F481}\u200D\u2642\uFE0F",
    "\u{1F481}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F481}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F481}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F481}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F481}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F481}\u200D\u2640\uFE0F",
    "\u{1F481}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F481}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F481}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F481}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F481}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F64B}",
    "\u{1F64B}\u{1F3FB}",
    "\u{1F64B}\u{1F3FC}",
    "\u{1F64B}\u{1F3FD}",
    "\u{1F64B}\u{1F3FE}",
    "\u{1F64B}\u{1F3FF}",
    "\u{1F64B}\u200D\u2642\uFE0F",
    "\u{1F64B}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F64B}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F64B}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F64B}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F64B}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F64B}\u200D\u2640\uFE0F",
    "\u{1F64B}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F64B}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F64B}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F64B}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F64B}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9CF}",
    "\u{1F9CF}\u{1F3FB}",
    "\u{1F9CF}\u{1F3FC}",
    "\u{1F9CF}\u{1F3FD}",
    "\u{1F9CF}\u{1F3FE}",
    "\u{1F9CF}\u{1F3FF}",
    "\u{1F9CF}\u200D\u2642\uFE0F",
    "\u{1F9CF}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9CF}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9CF}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9CF}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9CF}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9CF}\u200D\u2640\uFE0F",
    "\u{1F9CF}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9CF}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9CF}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9CF}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9CF}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F647}",
    "\u{1F647}\u{1F3FB}",
    "\u{1F647}\u{1F3FC}",
    "\u{1F647}\u{1F3FD}",
    "\u{1F647}\u{1F3FE}",
    "\u{1F647}\u{1F3FF}",
    "\u{1F647}\u200D\u2642\uFE0F",
    "\u{1F647}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F647}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F647}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F647}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F647}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F647}\u200D\u2640\uFE0F",
    "\u{1F647}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F647}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F647}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F647}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F647}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F926}",
    "\u{1F926}\u{1F3FB}",
    "\u{1F926}\u{1F3FC}",
    "\u{1F926}\u{1F3FD}",
    "\u{1F926}\u{1F3FE}",
    "\u{1F926}\u{1F3FF}",
    "\u{1F926}\u200D\u2642\uFE0F",
    "\u{1F926}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F926}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F926}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F926}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F926}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F926}\u200D\u2640\uFE0F",
    "\u{1F926}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F926}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F926}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F926}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F926}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F937}",
    "\u{1F937}\u{1F3FB}",
    "\u{1F937}\u{1F3FC}",
    "\u{1F937}\u{1F3FD}",
    "\u{1F937}\u{1F3FE}",
    "\u{1F937}\u{1F3FF}",
    "\u{1F937}\u200D\u2642\uFE0F",
    "\u{1F937}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F937}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F937}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F937}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F937}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F937}\u200D\u2640\uFE0F",
    "\u{1F937}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F937}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F937}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F937}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F937}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9D1}\u200D\u2695\uFE0F",
    "\u{1F9D1}\u{1F3FB}\u200D\u2695\uFE0F",
    "\u{1F9D1}\u{1F3FC}\u200D\u2695\uFE0F",
    "\u{1F9D1}\u{1F3FD}\u200D\u2695\uFE0F",
    "\u{1F9D1}\u{1F3FE}\u200D\u2695\uFE0F",
    "\u{1F9D1}\u{1F3FF}\u200D\u2695\uFE0F",
    "\u{1F468}\u200D\u2695\uFE0F",
    "\u{1F468}\u{1F3FB}\u200D\u2695\uFE0F",
    "\u{1F468}\u{1F3FC}\u200D\u2695\uFE0F",
    "\u{1F468}\u{1F3FD}\u200D\u2695\uFE0F",
    "\u{1F468}\u{1F3FE}\u200D\u2695\uFE0F",
    "\u{1F468}\u{1F3FF}\u200D\u2695\uFE0F",
    "\u{1F469}\u200D\u2695\uFE0F",
    "\u{1F469}\u{1F3FB}\u200D\u2695\uFE0F",
    "\u{1F469}\u{1F3FC}\u200D\u2695\uFE0F",
    "\u{1F469}\u{1F3FD}\u200D\u2695\uFE0F",
    "\u{1F469}\u{1F3FE}\u200D\u2695\uFE0F",
    "\u{1F469}\u{1F3FF}\u200D\u2695\uFE0F",
    "\u{1F9D1}\u200D\u{1F393}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F393}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F393}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F393}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F393}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F393}",
    "\u{1F468}\u200D\u{1F393}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F393}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F393}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F393}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F393}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F393}",
    "\u{1F469}\u200D\u{1F393}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F393}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F393}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F393}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F393}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F393}",
    "\u{1F9D1}\u200D\u{1F3EB}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F3EB}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F3EB}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F3EB}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F3EB}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F3EB}",
    "\u{1F468}\u200D\u{1F3EB}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F3EB}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F3EB}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F3EB}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F3EB}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F3EB}",
    "\u{1F469}\u200D\u{1F3EB}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F3EB}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F3EB}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F3EB}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F3EB}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F3EB}",
    "\u{1F9D1}\u200D\u2696\uFE0F",
    "\u{1F9D1}\u{1F3FB}\u200D\u2696\uFE0F",
    "\u{1F9D1}\u{1F3FC}\u200D\u2696\uFE0F",
    "\u{1F9D1}\u{1F3FD}\u200D\u2696\uFE0F",
    "\u{1F9D1}\u{1F3FE}\u200D\u2696\uFE0F",
    "\u{1F9D1}\u{1F3FF}\u200D\u2696\uFE0F",
    "\u{1F468}\u200D\u2696\uFE0F",
    "\u{1F468}\u{1F3FB}\u200D\u2696\uFE0F",
    "\u{1F468}\u{1F3FC}\u200D\u2696\uFE0F",
    "\u{1F468}\u{1F3FD}\u200D\u2696\uFE0F",
    "\u{1F468}\u{1F3FE}\u200D\u2696\uFE0F",
    "\u{1F468}\u{1F3FF}\u200D\u2696\uFE0F",
    "\u{1F469}\u200D\u2696\uFE0F",
    "\u{1F469}\u{1F3FB}\u200D\u2696\uFE0F",
    "\u{1F469}\u{1F3FC}\u200D\u2696\uFE0F",
    "\u{1F469}\u{1F3FD}\u200D\u2696\uFE0F",
    "\u{1F469}\u{1F3FE}\u200D\u2696\uFE0F",
    "\u{1F469}\u{1F3FF}\u200D\u2696\uFE0F",
    "\u{1F9D1}\u200D\u{1F33E}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F33E}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F33E}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F33E}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F33E}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F33E}",
    "\u{1F468}\u200D\u{1F33E}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F33E}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F33E}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F33E}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F33E}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F33E}",
    "\u{1F469}\u200D\u{1F33E}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F33E}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F33E}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F33E}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F33E}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F33E}",
    "\u{1F9D1}\u200D\u{1F373}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F373}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F373}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F373}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F373}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F373}",
    "\u{1F468}\u200D\u{1F373}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F373}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F373}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F373}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F373}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F373}",
    "\u{1F469}\u200D\u{1F373}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F373}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F373}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F373}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F373}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F373}",
    "\u{1F9D1}\u200D\u{1F527}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F527}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F527}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F527}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F527}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F527}",
    "\u{1F468}\u200D\u{1F527}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F527}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F527}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F527}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F527}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F527}",
    "\u{1F469}\u200D\u{1F527}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F527}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F527}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F527}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F527}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F527}",
    "\u{1F9D1}\u200D\u{1F3ED}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F3ED}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F3ED}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F3ED}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F3ED}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F3ED}",
    "\u{1F468}\u200D\u{1F3ED}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F3ED}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F3ED}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F3ED}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F3ED}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F3ED}",
    "\u{1F469}\u200D\u{1F3ED}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F3ED}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F3ED}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F3ED}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F3ED}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F3ED}",
    "\u{1F9D1}\u200D\u{1F4BC}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F4BC}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F4BC}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F4BC}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F4BC}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F4BC}",
    "\u{1F468}\u200D\u{1F4BC}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F4BC}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F4BC}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F4BC}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F4BC}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F4BC}",
    "\u{1F469}\u200D\u{1F4BC}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F4BC}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F4BC}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F4BC}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F4BC}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F4BC}",
    "\u{1F9D1}\u200D\u{1F52C}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F52C}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F52C}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F52C}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F52C}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F52C}",
    "\u{1F468}\u200D\u{1F52C}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F52C}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F52C}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F52C}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F52C}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F52C}",
    "\u{1F469}\u200D\u{1F52C}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F52C}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F52C}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F52C}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F52C}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F52C}",
    "\u{1F9D1}\u200D\u{1F4BB}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F4BB}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F4BB}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F4BB}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F4BB}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F4BB}",
    "\u{1F468}\u200D\u{1F4BB}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F4BB}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F4BB}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F4BB}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F4BB}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F4BB}",
    "\u{1F469}\u200D\u{1F4BB}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F4BB}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F4BB}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F4BB}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F4BB}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F4BB}",
    "\u{1F9D1}\u200D\u{1F3A4}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F3A4}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F3A4}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F3A4}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F3A4}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F3A4}",
    "\u{1F468}\u200D\u{1F3A4}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F3A4}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F3A4}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F3A4}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F3A4}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F3A4}",
    "\u{1F469}\u200D\u{1F3A4}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F3A4}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F3A4}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F3A4}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F3A4}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F3A4}",
    "\u{1F9D1}\u200D\u{1F3A8}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F3A8}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F3A8}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F3A8}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F3A8}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F3A8}",
    "\u{1F468}\u200D\u{1F3A8}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F3A8}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F3A8}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F3A8}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F3A8}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F3A8}",
    "\u{1F469}\u200D\u{1F3A8}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F3A8}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F3A8}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F3A8}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F3A8}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F3A8}",
    "\u{1F9D1}\u200D\u2708\uFE0F",
    "\u{1F9D1}\u{1F3FB}\u200D\u2708\uFE0F",
    "\u{1F9D1}\u{1F3FC}\u200D\u2708\uFE0F",
    "\u{1F9D1}\u{1F3FD}\u200D\u2708\uFE0F",
    "\u{1F9D1}\u{1F3FE}\u200D\u2708\uFE0F",
    "\u{1F9D1}\u{1F3FF}\u200D\u2708\uFE0F",
    "\u{1F468}\u200D\u2708\uFE0F",
    "\u{1F468}\u{1F3FB}\u200D\u2708\uFE0F",
    "\u{1F468}\u{1F3FC}\u200D\u2708\uFE0F",
    "\u{1F468}\u{1F3FD}\u200D\u2708\uFE0F",
    "\u{1F468}\u{1F3FE}\u200D\u2708\uFE0F",
    "\u{1F468}\u{1F3FF}\u200D\u2708\uFE0F",
    "\u{1F469}\u200D\u2708\uFE0F",
    "\u{1F469}\u{1F3FB}\u200D\u2708\uFE0F",
    "\u{1F469}\u{1F3FC}\u200D\u2708\uFE0F",
    "\u{1F469}\u{1F3FD}\u200D\u2708\uFE0F",
    "\u{1F469}\u{1F3FE}\u200D\u2708\uFE0F",
    "\u{1F469}\u{1F3FF}\u200D\u2708\uFE0F",
    "\u{1F9D1}\u200D\u{1F680}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F680}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F680}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F680}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F680}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F680}",
    "\u{1F468}\u200D\u{1F680}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F680}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F680}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F680}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F680}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F680}",
    "\u{1F469}\u200D\u{1F680}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F680}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F680}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F680}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F680}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F680}",
    "\u{1F9D1}\u200D\u{1F692}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F692}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F692}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F692}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F692}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F692}",
    "\u{1F468}\u200D\u{1F692}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F692}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F692}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F692}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F692}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F692}",
    "\u{1F469}\u200D\u{1F692}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F692}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F692}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F692}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F692}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F692}",
    "\u{1F46E}",
    "\u{1F46E}\u{1F3FB}",
    "\u{1F46E}\u{1F3FC}",
    "\u{1F46E}\u{1F3FD}",
    "\u{1F46E}\u{1F3FE}",
    "\u{1F46E}\u{1F3FF}",
    "\u{1F46E}\u200D\u2642\uFE0F",
    "\u{1F46E}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F46E}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F46E}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F46E}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F46E}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F46E}\u200D\u2640\uFE0F",
    "\u{1F46E}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F46E}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F46E}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F46E}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F46E}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F575}\uFE0F",
    "\u{1F575}\u{1F3FB}",
    "\u{1F575}\u{1F3FC}",
    "\u{1F575}\u{1F3FD}",
    "\u{1F575}\u{1F3FE}",
    "\u{1F575}\u{1F3FF}",
    "\u{1F575}\uFE0F\u200D\u2642\uFE0F",
    "\u{1F575}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F575}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F575}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F575}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F575}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F575}\uFE0F\u200D\u2640\uFE0F",
    "\u{1F575}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F575}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F575}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F575}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F575}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F482}",
    "\u{1F482}\u{1F3FB}",
    "\u{1F482}\u{1F3FC}",
    "\u{1F482}\u{1F3FD}",
    "\u{1F482}\u{1F3FE}",
    "\u{1F482}\u{1F3FF}",
    "\u{1F482}\u200D\u2642\uFE0F",
    "\u{1F482}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F482}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F482}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F482}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F482}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F482}\u200D\u2640\uFE0F",
    "\u{1F482}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F482}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F482}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F482}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F482}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F977}",
    "\u{1F977}\u{1F3FB}",
    "\u{1F977}\u{1F3FC}",
    "\u{1F977}\u{1F3FD}",
    "\u{1F977}\u{1F3FE}",
    "\u{1F977}\u{1F3FF}",
    "\u{1F477}",
    "\u{1F477}\u{1F3FB}",
    "\u{1F477}\u{1F3FC}",
    "\u{1F477}\u{1F3FD}",
    "\u{1F477}\u{1F3FE}",
    "\u{1F477}\u{1F3FF}",
    "\u{1F477}\u200D\u2642\uFE0F",
    "\u{1F477}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F477}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F477}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F477}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F477}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F477}\u200D\u2640\uFE0F",
    "\u{1F477}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F477}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F477}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F477}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F477}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F934}",
    "\u{1F934}\u{1F3FB}",
    "\u{1F934}\u{1F3FC}",
    "\u{1F934}\u{1F3FD}",
    "\u{1F934}\u{1F3FE}",
    "\u{1F934}\u{1F3FF}",
    "\u{1F478}",
    "\u{1F478}\u{1F3FB}",
    "\u{1F478}\u{1F3FC}",
    "\u{1F478}\u{1F3FD}",
    "\u{1F478}\u{1F3FE}",
    "\u{1F478}\u{1F3FF}",
    "\u{1F473}",
    "\u{1F473}\u{1F3FB}",
    "\u{1F473}\u{1F3FC}",
    "\u{1F473}\u{1F3FD}",
    "\u{1F473}\u{1F3FE}",
    "\u{1F473}\u{1F3FF}",
    "\u{1F473}\u200D\u2642\uFE0F",
    "\u{1F473}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F473}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F473}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F473}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F473}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F473}\u200D\u2640\uFE0F",
    "\u{1F473}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F473}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F473}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F473}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F473}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F472}",
    "\u{1F472}\u{1F3FB}",
    "\u{1F472}\u{1F3FC}",
    "\u{1F472}\u{1F3FD}",
    "\u{1F472}\u{1F3FE}",
    "\u{1F472}\u{1F3FF}",
    "\u{1F9D5}",
    "\u{1F9D5}\u{1F3FB}",
    "\u{1F9D5}\u{1F3FC}",
    "\u{1F9D5}\u{1F3FD}",
    "\u{1F9D5}\u{1F3FE}",
    "\u{1F9D5}\u{1F3FF}",
    "\u{1F935}",
    "\u{1F935}\u{1F3FB}",
    "\u{1F935}\u{1F3FC}",
    "\u{1F935}\u{1F3FD}",
    "\u{1F935}\u{1F3FE}",
    "\u{1F935}\u{1F3FF}",
    "\u{1F935}\u200D\u2642\uFE0F",
    "\u{1F935}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F935}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F935}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F935}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F935}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F935}\u200D\u2640\uFE0F",
    "\u{1F935}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F935}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F935}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F935}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F935}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F470}",
    "\u{1F470}\u{1F3FB}",
    "\u{1F470}\u{1F3FC}",
    "\u{1F470}\u{1F3FD}",
    "\u{1F470}\u{1F3FE}",
    "\u{1F470}\u{1F3FF}",
    "\u{1F470}\u200D\u2642\uFE0F",
    "\u{1F470}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F470}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F470}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F470}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F470}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F470}\u200D\u2640\uFE0F",
    "\u{1F470}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F470}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F470}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F470}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F470}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F930}",
    "\u{1F930}\u{1F3FB}",
    "\u{1F930}\u{1F3FC}",
    "\u{1F930}\u{1F3FD}",
    "\u{1F930}\u{1F3FE}",
    "\u{1F930}\u{1F3FF}",
    "\u{1F931}",
    "\u{1F931}\u{1F3FB}",
    "\u{1F931}\u{1F3FC}",
    "\u{1F931}\u{1F3FD}",
    "\u{1F931}\u{1F3FE}",
    "\u{1F931}\u{1F3FF}",
    "\u{1F469}\u200D\u{1F37C}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F37C}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F37C}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F37C}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F37C}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F37C}",
    "\u{1F468}\u200D\u{1F37C}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F37C}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F37C}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F37C}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F37C}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F37C}",
    "\u{1F9D1}\u200D\u{1F37C}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F37C}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F37C}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F37C}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F37C}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F37C}",
    "\u{1F47C}",
    "\u{1F47C}\u{1F3FB}",
    "\u{1F47C}\u{1F3FC}",
    "\u{1F47C}\u{1F3FD}",
    "\u{1F47C}\u{1F3FE}",
    "\u{1F47C}\u{1F3FF}",
    "\u{1F385}",
    "\u{1F385}\u{1F3FB}",
    "\u{1F385}\u{1F3FC}",
    "\u{1F385}\u{1F3FD}",
    "\u{1F385}\u{1F3FE}",
    "\u{1F385}\u{1F3FF}",
    "\u{1F936}",
    "\u{1F936}\u{1F3FB}",
    "\u{1F936}\u{1F3FC}",
    "\u{1F936}\u{1F3FD}",
    "\u{1F936}\u{1F3FE}",
    "\u{1F936}\u{1F3FF}",
    "\u{1F9D1}\u200D\u{1F384}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F384}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F384}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F384}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F384}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F384}",
    "\u{1F9B8}",
    "\u{1F9B8}\u{1F3FB}",
    "\u{1F9B8}\u{1F3FC}",
    "\u{1F9B8}\u{1F3FD}",
    "\u{1F9B8}\u{1F3FE}",
    "\u{1F9B8}\u{1F3FF}",
    "\u{1F9B8}\u200D\u2642\uFE0F",
    "\u{1F9B8}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9B8}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9B8}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9B8}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9B8}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9B8}\u200D\u2640\uFE0F",
    "\u{1F9B8}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9B8}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9B8}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9B8}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9B8}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9B9}",
    "\u{1F9B9}\u{1F3FB}",
    "\u{1F9B9}\u{1F3FC}",
    "\u{1F9B9}\u{1F3FD}",
    "\u{1F9B9}\u{1F3FE}",
    "\u{1F9B9}\u{1F3FF}",
    "\u{1F9B9}\u200D\u2642\uFE0F",
    "\u{1F9B9}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9B9}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9B9}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9B9}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9B9}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9B9}\u200D\u2640\uFE0F",
    "\u{1F9B9}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9B9}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9B9}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9B9}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9B9}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9D9}",
    "\u{1F9D9}\u{1F3FB}",
    "\u{1F9D9}\u{1F3FC}",
    "\u{1F9D9}\u{1F3FD}",
    "\u{1F9D9}\u{1F3FE}",
    "\u{1F9D9}\u{1F3FF}",
    "\u{1F9D9}\u200D\u2642\uFE0F",
    "\u{1F9D9}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9D9}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9D9}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9D9}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9D9}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9D9}\u200D\u2640\uFE0F",
    "\u{1F9D9}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9D9}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9D9}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9D9}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9D9}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9DA}",
    "\u{1F9DA}\u{1F3FB}",
    "\u{1F9DA}\u{1F3FC}",
    "\u{1F9DA}\u{1F3FD}",
    "\u{1F9DA}\u{1F3FE}",
    "\u{1F9DA}\u{1F3FF}",
    "\u{1F9DA}\u200D\u2642\uFE0F",
    "\u{1F9DA}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9DA}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9DA}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9DA}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9DA}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9DA}\u200D\u2640\uFE0F",
    "\u{1F9DA}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9DA}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9DA}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9DA}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9DA}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9DB}",
    "\u{1F9DB}\u{1F3FB}",
    "\u{1F9DB}\u{1F3FC}",
    "\u{1F9DB}\u{1F3FD}",
    "\u{1F9DB}\u{1F3FE}",
    "\u{1F9DB}\u{1F3FF}",
    "\u{1F9DB}\u200D\u2642\uFE0F",
    "\u{1F9DB}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9DB}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9DB}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9DB}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9DB}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9DB}\u200D\u2640\uFE0F",
    "\u{1F9DB}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9DB}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9DB}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9DB}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9DB}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9DC}",
    "\u{1F9DC}\u{1F3FB}",
    "\u{1F9DC}\u{1F3FC}",
    "\u{1F9DC}\u{1F3FD}",
    "\u{1F9DC}\u{1F3FE}",
    "\u{1F9DC}\u{1F3FF}",
    "\u{1F9DC}\u200D\u2642\uFE0F",
    "\u{1F9DC}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9DC}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9DC}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9DC}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9DC}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9DC}\u200D\u2640\uFE0F",
    "\u{1F9DC}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9DC}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9DC}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9DC}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9DC}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9DD}",
    "\u{1F9DD}\u{1F3FB}",
    "\u{1F9DD}\u{1F3FC}",
    "\u{1F9DD}\u{1F3FD}",
    "\u{1F9DD}\u{1F3FE}",
    "\u{1F9DD}\u{1F3FF}",
    "\u{1F9DD}\u200D\u2642\uFE0F",
    "\u{1F9DD}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9DD}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9DD}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9DD}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9DD}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9DD}\u200D\u2640\uFE0F",
    "\u{1F9DD}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9DD}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9DD}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9DD}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9DD}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9DE}",
    "\u{1F9DE}\u200D\u2642\uFE0F",
    "\u{1F9DE}\u200D\u2640\uFE0F",
    "\u{1F9DF}",
    "\u{1F9DF}\u200D\u2642\uFE0F",
    "\u{1F9DF}\u200D\u2640\uFE0F",
    "\u{1F486}",
    "\u{1F486}\u{1F3FB}",
    "\u{1F486}\u{1F3FC}",
    "\u{1F486}\u{1F3FD}",
    "\u{1F486}\u{1F3FE}",
    "\u{1F486}\u{1F3FF}",
    "\u{1F486}\u200D\u2642\uFE0F",
    "\u{1F486}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F486}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F486}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F486}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F486}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F486}\u200D\u2640\uFE0F",
    "\u{1F486}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F486}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F486}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F486}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F486}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F487}",
    "\u{1F487}\u{1F3FB}",
    "\u{1F487}\u{1F3FC}",
    "\u{1F487}\u{1F3FD}",
    "\u{1F487}\u{1F3FE}",
    "\u{1F487}\u{1F3FF}",
    "\u{1F487}\u200D\u2642\uFE0F",
    "\u{1F487}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F487}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F487}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F487}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F487}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F487}\u200D\u2640\uFE0F",
    "\u{1F487}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F487}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F487}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F487}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F487}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F6B6}",
    "\u{1F6B6}\u{1F3FB}",
    "\u{1F6B6}\u{1F3FC}",
    "\u{1F6B6}\u{1F3FD}",
    "\u{1F6B6}\u{1F3FE}",
    "\u{1F6B6}\u{1F3FF}",
    "\u{1F6B6}\u200D\u2642\uFE0F",
    "\u{1F6B6}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F6B6}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F6B6}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F6B6}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F6B6}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F6B6}\u200D\u2640\uFE0F",
    "\u{1F6B6}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F6B6}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F6B6}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F6B6}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F6B6}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9CD}",
    "\u{1F9CD}\u{1F3FB}",
    "\u{1F9CD}\u{1F3FC}",
    "\u{1F9CD}\u{1F3FD}",
    "\u{1F9CD}\u{1F3FE}",
    "\u{1F9CD}\u{1F3FF}",
    "\u{1F9CD}\u200D\u2642\uFE0F",
    "\u{1F9CD}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9CD}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9CD}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9CD}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9CD}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9CD}\u200D\u2640\uFE0F",
    "\u{1F9CD}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9CD}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9CD}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9CD}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9CD}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9CE}",
    "\u{1F9CE}\u{1F3FB}",
    "\u{1F9CE}\u{1F3FC}",
    "\u{1F9CE}\u{1F3FD}",
    "\u{1F9CE}\u{1F3FE}",
    "\u{1F9CE}\u{1F3FF}",
    "\u{1F9CE}\u200D\u2642\uFE0F",
    "\u{1F9CE}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9CE}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9CE}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9CE}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9CE}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9CE}\u200D\u2640\uFE0F",
    "\u{1F9CE}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9CE}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9CE}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9CE}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9CE}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9D1}\u200D\u{1F9AF}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F9AF}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F9AF}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F9AF}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F9AF}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F9AF}",
    "\u{1F468}\u200D\u{1F9AF}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F9AF}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F9AF}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F9AF}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F9AF}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F9AF}",
    "\u{1F469}\u200D\u{1F9AF}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F9AF}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F9AF}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F9AF}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F9AF}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F9AF}",
    "\u{1F9D1}\u200D\u{1F9BC}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F9BC}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F9BC}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F9BC}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F9BC}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F9BC}",
    "\u{1F468}\u200D\u{1F9BC}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F9BC}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F9BC}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F9BC}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F9BC}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F9BC}",
    "\u{1F469}\u200D\u{1F9BC}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F9BC}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F9BC}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F9BC}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F9BC}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F9BC}",
    "\u{1F9D1}\u200D\u{1F9BD}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F9BD}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F9BD}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F9BD}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F9BD}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F9BD}",
    "\u{1F468}\u200D\u{1F9BD}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F9BD}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F9BD}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F9BD}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F9BD}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F9BD}",
    "\u{1F469}\u200D\u{1F9BD}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F9BD}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F9BD}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F9BD}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F9BD}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F9BD}",
    "\u{1F3C3}",
    "\u{1F3C3}\u{1F3FB}",
    "\u{1F3C3}\u{1F3FC}",
    "\u{1F3C3}\u{1F3FD}",
    "\u{1F3C3}\u{1F3FE}",
    "\u{1F3C3}\u{1F3FF}",
    "\u{1F3C3}\u200D\u2642\uFE0F",
    "\u{1F3C3}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F3C3}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F3C3}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F3C3}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F3C3}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F3C3}\u200D\u2640\uFE0F",
    "\u{1F3C3}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F3C3}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F3C3}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F3C3}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F3C3}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F483}",
    "\u{1F483}\u{1F3FB}",
    "\u{1F483}\u{1F3FC}",
    "\u{1F483}\u{1F3FD}",
    "\u{1F483}\u{1F3FE}",
    "\u{1F483}\u{1F3FF}",
    "\u{1F57A}",
    "\u{1F57A}\u{1F3FB}",
    "\u{1F57A}\u{1F3FC}",
    "\u{1F57A}\u{1F3FD}",
    "\u{1F57A}\u{1F3FE}",
    "\u{1F57A}\u{1F3FF}",
    "\u{1F574}\uFE0F",
    "\u{1F574}\u{1F3FB}",
    "\u{1F574}\u{1F3FC}",
    "\u{1F574}\u{1F3FD}",
    "\u{1F574}\u{1F3FE}",
    "\u{1F574}\u{1F3FF}",
    "\u{1F46F}",
    "\u{1F46F}\u200D\u2642\uFE0F",
    "\u{1F46F}\u200D\u2640\uFE0F",
    "\u{1F9D6}",
    "\u{1F9D6}\u{1F3FB}",
    "\u{1F9D6}\u{1F3FC}",
    "\u{1F9D6}\u{1F3FD}",
    "\u{1F9D6}\u{1F3FE}",
    "\u{1F9D6}\u{1F3FF}",
    "\u{1F9D6}\u200D\u2642\uFE0F",
    "\u{1F9D6}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9D6}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9D6}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9D6}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9D6}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9D6}\u200D\u2640\uFE0F",
    "\u{1F9D6}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9D6}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9D6}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9D6}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9D6}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9D7}",
    "\u{1F9D7}\u{1F3FB}",
    "\u{1F9D7}\u{1F3FC}",
    "\u{1F9D7}\u{1F3FD}",
    "\u{1F9D7}\u{1F3FE}",
    "\u{1F9D7}\u{1F3FF}",
    "\u{1F9D7}\u200D\u2642\uFE0F",
    "\u{1F9D7}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9D7}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9D7}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9D7}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9D7}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9D7}\u200D\u2640\uFE0F",
    "\u{1F9D7}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9D7}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9D7}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9D7}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9D7}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F93A}",
    "\u{1F3C7}",
    "\u{1F3C7}\u{1F3FB}",
    "\u{1F3C7}\u{1F3FC}",
    "\u{1F3C7}\u{1F3FD}",
    "\u{1F3C7}\u{1F3FE}",
    "\u{1F3C7}\u{1F3FF}",
    "\u26F7\uFE0F",
    "\u{1F3C2}",
    "\u{1F3C2}\u{1F3FB}",
    "\u{1F3C2}\u{1F3FC}",
    "\u{1F3C2}\u{1F3FD}",
    "\u{1F3C2}\u{1F3FE}",
    "\u{1F3C2}\u{1F3FF}",
    "\u{1F3CC}\uFE0F",
    "\u{1F3CC}\u{1F3FB}",
    "\u{1F3CC}\u{1F3FC}",
    "\u{1F3CC}\u{1F3FD}",
    "\u{1F3CC}\u{1F3FE}",
    "\u{1F3CC}\u{1F3FF}",
    "\u{1F3CC}\uFE0F\u200D\u2642\uFE0F",
    "\u{1F3CC}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F3CC}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F3CC}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F3CC}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F3CC}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F3CC}\uFE0F\u200D\u2640\uFE0F",
    "\u{1F3CC}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F3CC}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F3CC}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F3CC}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F3CC}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F3C4}",
    "\u{1F3C4}\u{1F3FB}",
    "\u{1F3C4}\u{1F3FC}",
    "\u{1F3C4}\u{1F3FD}",
    "\u{1F3C4}\u{1F3FE}",
    "\u{1F3C4}\u{1F3FF}",
    "\u{1F3C4}\u200D\u2642\uFE0F",
    "\u{1F3C4}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F3C4}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F3C4}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F3C4}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F3C4}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F3C4}\u200D\u2640\uFE0F",
    "\u{1F3C4}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F3C4}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F3C4}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F3C4}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F3C4}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F6A3}",
    "\u{1F6A3}\u{1F3FB}",
    "\u{1F6A3}\u{1F3FC}",
    "\u{1F6A3}\u{1F3FD}",
    "\u{1F6A3}\u{1F3FE}",
    "\u{1F6A3}\u{1F3FF}",
    "\u{1F6A3}\u200D\u2642\uFE0F",
    "\u{1F6A3}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F6A3}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F6A3}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F6A3}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F6A3}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F6A3}\u200D\u2640\uFE0F",
    "\u{1F6A3}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F6A3}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F6A3}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F6A3}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F6A3}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F3CA}",
    "\u{1F3CA}\u{1F3FB}",
    "\u{1F3CA}\u{1F3FC}",
    "\u{1F3CA}\u{1F3FD}",
    "\u{1F3CA}\u{1F3FE}",
    "\u{1F3CA}\u{1F3FF}",
    "\u{1F3CA}\u200D\u2642\uFE0F",
    "\u{1F3CA}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F3CA}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F3CA}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F3CA}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F3CA}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F3CA}\u200D\u2640\uFE0F",
    "\u{1F3CA}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F3CA}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F3CA}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F3CA}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F3CA}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u26F9\uFE0F",
    "\u26F9\u{1F3FB}",
    "\u26F9\u{1F3FC}",
    "\u26F9\u{1F3FD}",
    "\u26F9\u{1F3FE}",
    "\u26F9\u{1F3FF}",
    "\u26F9\uFE0F\u200D\u2642\uFE0F",
    "\u26F9\u{1F3FB}\u200D\u2642\uFE0F",
    "\u26F9\u{1F3FC}\u200D\u2642\uFE0F",
    "\u26F9\u{1F3FD}\u200D\u2642\uFE0F",
    "\u26F9\u{1F3FE}\u200D\u2642\uFE0F",
    "\u26F9\u{1F3FF}\u200D\u2642\uFE0F",
    "\u26F9\uFE0F\u200D\u2640\uFE0F",
    "\u26F9\u{1F3FB}\u200D\u2640\uFE0F",
    "\u26F9\u{1F3FC}\u200D\u2640\uFE0F",
    "\u26F9\u{1F3FD}\u200D\u2640\uFE0F",
    "\u26F9\u{1F3FE}\u200D\u2640\uFE0F",
    "\u26F9\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F3CB}\uFE0F",
    "\u{1F3CB}\u{1F3FB}",
    "\u{1F3CB}\u{1F3FC}",
    "\u{1F3CB}\u{1F3FD}",
    "\u{1F3CB}\u{1F3FE}",
    "\u{1F3CB}\u{1F3FF}",
    "\u{1F3CB}\uFE0F\u200D\u2642\uFE0F",
    "\u{1F3CB}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F3CB}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F3CB}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F3CB}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F3CB}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F3CB}\uFE0F\u200D\u2640\uFE0F",
    "\u{1F3CB}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F3CB}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F3CB}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F3CB}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F3CB}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F6B4}",
    "\u{1F6B4}\u{1F3FB}",
    "\u{1F6B4}\u{1F3FC}",
    "\u{1F6B4}\u{1F3FD}",
    "\u{1F6B4}\u{1F3FE}",
    "\u{1F6B4}\u{1F3FF}",
    "\u{1F6B4}\u200D\u2642\uFE0F",
    "\u{1F6B4}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F6B4}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F6B4}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F6B4}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F6B4}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F6B4}\u200D\u2640\uFE0F",
    "\u{1F6B4}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F6B4}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F6B4}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F6B4}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F6B4}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F6B5}",
    "\u{1F6B5}\u{1F3FB}",
    "\u{1F6B5}\u{1F3FC}",
    "\u{1F6B5}\u{1F3FD}",
    "\u{1F6B5}\u{1F3FE}",
    "\u{1F6B5}\u{1F3FF}",
    "\u{1F6B5}\u200D\u2642\uFE0F",
    "\u{1F6B5}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F6B5}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F6B5}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F6B5}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F6B5}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F6B5}\u200D\u2640\uFE0F",
    "\u{1F6B5}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F6B5}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F6B5}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F6B5}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F6B5}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F938}",
    "\u{1F938}\u{1F3FB}",
    "\u{1F938}\u{1F3FC}",
    "\u{1F938}\u{1F3FD}",
    "\u{1F938}\u{1F3FE}",
    "\u{1F938}\u{1F3FF}",
    "\u{1F938}\u200D\u2642\uFE0F",
    "\u{1F938}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F938}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F938}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F938}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F938}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F938}\u200D\u2640\uFE0F",
    "\u{1F938}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F938}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F938}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F938}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F938}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F93C}",
    "\u{1F93C}\u200D\u2642\uFE0F",
    "\u{1F93C}\u200D\u2640\uFE0F",
    "\u{1F93D}",
    "\u{1F93D}\u{1F3FB}",
    "\u{1F93D}\u{1F3FC}",
    "\u{1F93D}\u{1F3FD}",
    "\u{1F93D}\u{1F3FE}",
    "\u{1F93D}\u{1F3FF}",
    "\u{1F93D}\u200D\u2642\uFE0F",
    "\u{1F93D}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F93D}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F93D}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F93D}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F93D}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F93D}\u200D\u2640\uFE0F",
    "\u{1F93D}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F93D}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F93D}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F93D}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F93D}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F93E}",
    "\u{1F93E}\u{1F3FB}",
    "\u{1F93E}\u{1F3FC}",
    "\u{1F93E}\u{1F3FD}",
    "\u{1F93E}\u{1F3FE}",
    "\u{1F93E}\u{1F3FF}",
    "\u{1F93E}\u200D\u2642\uFE0F",
    "\u{1F93E}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F93E}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F93E}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F93E}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F93E}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F93E}\u200D\u2640\uFE0F",
    "\u{1F93E}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F93E}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F93E}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F93E}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F93E}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F939}",
    "\u{1F939}\u{1F3FB}",
    "\u{1F939}\u{1F3FC}",
    "\u{1F939}\u{1F3FD}",
    "\u{1F939}\u{1F3FE}",
    "\u{1F939}\u{1F3FF}",
    "\u{1F939}\u200D\u2642\uFE0F",
    "\u{1F939}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F939}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F939}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F939}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F939}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F939}\u200D\u2640\uFE0F",
    "\u{1F939}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F939}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F939}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F939}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F939}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F9D8}",
    "\u{1F9D8}\u{1F3FB}",
    "\u{1F9D8}\u{1F3FC}",
    "\u{1F9D8}\u{1F3FD}",
    "\u{1F9D8}\u{1F3FE}",
    "\u{1F9D8}\u{1F3FF}",
    "\u{1F9D8}\u200D\u2642\uFE0F",
    "\u{1F9D8}\u{1F3FB}\u200D\u2642\uFE0F",
    "\u{1F9D8}\u{1F3FC}\u200D\u2642\uFE0F",
    "\u{1F9D8}\u{1F3FD}\u200D\u2642\uFE0F",
    "\u{1F9D8}\u{1F3FE}\u200D\u2642\uFE0F",
    "\u{1F9D8}\u{1F3FF}\u200D\u2642\uFE0F",
    "\u{1F9D8}\u200D\u2640\uFE0F",
    "\u{1F9D8}\u{1F3FB}\u200D\u2640\uFE0F",
    "\u{1F9D8}\u{1F3FC}\u200D\u2640\uFE0F",
    "\u{1F9D8}\u{1F3FD}\u200D\u2640\uFE0F",
    "\u{1F9D8}\u{1F3FE}\u200D\u2640\uFE0F",
    "\u{1F9D8}\u{1F3FF}\u200D\u2640\uFE0F",
    "\u{1F6C0}",
    "\u{1F6C0}\u{1F3FB}",
    "\u{1F6C0}\u{1F3FC}",
    "\u{1F6C0}\u{1F3FD}",
    "\u{1F6C0}\u{1F3FE}",
    "\u{1F6C0}\u{1F3FF}",
    "\u{1F6CC}",
    "\u{1F6CC}\u{1F3FB}",
    "\u{1F6CC}\u{1F3FC}",
    "\u{1F6CC}\u{1F3FD}",
    "\u{1F6CC}\u{1F3FE}",
    "\u{1F6CC}\u{1F3FF}",
    "\u{1F9D1}\u200D\u{1F91D}\u200D\u{1F9D1}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F46D}",
    "\u{1F46D}\u{1F3FB}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F46D}\u{1F3FC}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F46D}\u{1F3FD}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F46D}\u{1F3FE}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F46D}\u{1F3FF}",
    "\u{1F46B}",
    "\u{1F46B}\u{1F3FB}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F46B}\u{1F3FC}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F46B}\u{1F3FD}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F46B}\u{1F3FE}",
    "\u{1F469}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F46B}\u{1F3FF}",
    "\u{1F46C}",
    "\u{1F46C}\u{1F3FB}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FB}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F46C}\u{1F3FC}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FC}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F46C}\u{1F3FD}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FD}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F46C}\u{1F3FE}",
    "\u{1F468}\u{1F3FE}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FF}\u200D\u{1F91D}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F46C}\u{1F3FF}",
    "\u{1F48F}",
    "\u{1F48F}\u{1F3FB}",
    "\u{1F48F}\u{1F3FC}",
    "\u{1F48F}\u{1F3FD}",
    "\u{1F48F}\u{1F3FE}",
    "\u{1F48F}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D\u{1F469}\u{1F3FF}",
    "\u{1F491}",
    "\u{1F491}\u{1F3FB}",
    "\u{1F491}\u{1F3FC}",
    "\u{1F491}\u{1F3FD}",
    "\u{1F491}\u{1F3FE}",
    "\u{1F491}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F9D1}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FF}",
    "\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FB}",
    "\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FC}",
    "\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FD}",
    "\u{1F9D1}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F9D1}\u{1F3FE}",
    "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u200D\u2764\uFE0F\u200D\u{1F468}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FB}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FC}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FD}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FE}",
    "\u{1F468}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F468}\u{1F3FF}",
    "\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F469}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FB}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FC}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FD}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FE}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FF}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FB}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FC}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FD}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FE}",
    "\u{1F469}\u{1F3FF}\u200D\u2764\uFE0F\u200D\u{1F469}\u{1F3FF}",
    "\u{1F46A}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F468}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F467}",
    "\u{1F468}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F468}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F469}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F466}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F467}",
    "\u{1F469}\u200D\u{1F467}\u200D\u{1F466}",
    "\u{1F469}\u200D\u{1F467}\u200D\u{1F467}",
    "\u{1F5E3}\uFE0F",
    "\u{1F464}",
    "\u{1F465}",
    "\u{1FAC2}",
    "\u{1F463}"
  ],
  nature: [
    "\u{1F435}",
    "\u{1F412}",
    "\u{1F98D}",
    "\u{1F9A7}",
    "\u{1F436}",
    "\u{1F415}",
    "\u{1F9AE}",
    "\u{1F415}\u200D\u{1F9BA}",
    "\u{1F429}",
    "\u{1F43A}",
    "\u{1F98A}",
    "\u{1F99D}",
    "\u{1F431}",
    "\u{1F408}",
    "\u{1F408}\u200D\u2B1B",
    "\u{1F981}",
    "\u{1F42F}",
    "\u{1F405}",
    "\u{1F406}",
    "\u{1F434}",
    "\u{1F40E}",
    "\u{1F984}",
    "\u{1F993}",
    "\u{1F98C}",
    "\u{1F9AC}",
    "\u{1F42E}",
    "\u{1F402}",
    "\u{1F403}",
    "\u{1F404}",
    "\u{1F437}",
    "\u{1F416}",
    "\u{1F417}",
    "\u{1F43D}",
    "\u{1F40F}",
    "\u{1F411}",
    "\u{1F410}",
    "\u{1F42A}",
    "\u{1F42B}",
    "\u{1F999}",
    "\u{1F992}",
    "\u{1F418}",
    "\u{1F9A3}",
    "\u{1F98F}",
    "\u{1F99B}",
    "\u{1F42D}",
    "\u{1F401}",
    "\u{1F400}",
    "\u{1F439}",
    "\u{1F430}",
    "\u{1F407}",
    "\u{1F43F}\uFE0F",
    "\u{1F9AB}",
    "\u{1F994}",
    "\u{1F987}",
    "\u{1F43B}",
    "\u{1F43B}\u200D\u2744\uFE0F",
    "\u{1F428}",
    "\u{1F43C}",
    "\u{1F9A5}",
    "\u{1F9A6}",
    "\u{1F9A8}",
    "\u{1F998}",
    "\u{1F9A1}",
    "\u{1F43E}",
    "\u{1F983}",
    "\u{1F414}",
    "\u{1F413}",
    "\u{1F423}",
    "\u{1F424}",
    "\u{1F425}",
    "\u{1F426}",
    "\u{1F427}",
    "\u{1F54A}\uFE0F",
    "\u{1F985}",
    "\u{1F986}",
    "\u{1F9A2}",
    "\u{1F989}",
    "\u{1F9A4}",
    "\u{1FAB6}",
    "\u{1F9A9}",
    "\u{1F99A}",
    "\u{1F99C}",
    "\u{1F438}",
    "\u{1F40A}",
    "\u{1F422}",
    "\u{1F98E}",
    "\u{1F40D}",
    "\u{1F432}",
    "\u{1F409}",
    "\u{1F995}",
    "\u{1F996}",
    "\u{1F433}",
    "\u{1F40B}",
    "\u{1F42C}",
    "\u{1F9AD}",
    "\u{1F41F}",
    "\u{1F420}",
    "\u{1F421}",
    "\u{1F988}",
    "\u{1F419}",
    "\u{1F41A}",
    "\u{1F40C}",
    "\u{1F98B}",
    "\u{1F41B}",
    "\u{1F41C}",
    "\u{1F41D}",
    "\u{1FAB2}",
    "\u{1F41E}",
    "\u{1F997}",
    "\u{1FAB3}",
    "\u{1F577}\uFE0F",
    "\u{1F578}\uFE0F",
    "\u{1F982}",
    "\u{1F99F}",
    "\u{1FAB0}",
    "\u{1FAB1}",
    "\u{1F9A0}",
    "\u{1F490}",
    "\u{1F338}",
    "\u{1F4AE}",
    "\u{1F3F5}\uFE0F",
    "\u{1F339}",
    "\u{1F940}",
    "\u{1F33A}",
    "\u{1F33B}",
    "\u{1F33C}",
    "\u{1F337}",
    "\u{1F331}",
    "\u{1FAB4}",
    "\u{1F332}",
    "\u{1F333}",
    "\u{1F334}",
    "\u{1F335}",
    "\u{1F33E}",
    "\u{1F33F}",
    "\u2618\uFE0F",
    "\u{1F340}",
    "\u{1F341}",
    "\u{1F342}",
    "\u{1F343}"
  ],
  food: [
    "\u{1F347}",
    "\u{1F348}",
    "\u{1F349}",
    "\u{1F34A}",
    "\u{1F34B}",
    "\u{1F34C}",
    "\u{1F34D}",
    "\u{1F96D}",
    "\u{1F34E}",
    "\u{1F34F}",
    "\u{1F350}",
    "\u{1F351}",
    "\u{1F352}",
    "\u{1F353}",
    "\u{1FAD0}",
    "\u{1F95D}",
    "\u{1F345}",
    "\u{1FAD2}",
    "\u{1F965}",
    "\u{1F951}",
    "\u{1F346}",
    "\u{1F954}",
    "\u{1F955}",
    "\u{1F33D}",
    "\u{1F336}\uFE0F",
    "\u{1FAD1}",
    "\u{1F952}",
    "\u{1F96C}",
    "\u{1F966}",
    "\u{1F9C4}",
    "\u{1F9C5}",
    "\u{1F344}",
    "\u{1F95C}",
    "\u{1F330}",
    "\u{1F35E}",
    "\u{1F950}",
    "\u{1F956}",
    "\u{1FAD3}",
    "\u{1F968}",
    "\u{1F96F}",
    "\u{1F95E}",
    "\u{1F9C7}",
    "\u{1F9C0}",
    "\u{1F356}",
    "\u{1F357}",
    "\u{1F969}",
    "\u{1F953}",
    "\u{1F354}",
    "\u{1F35F}",
    "\u{1F355}",
    "\u{1F32D}",
    "\u{1F96A}",
    "\u{1F32E}",
    "\u{1F32F}",
    "\u{1FAD4}",
    "\u{1F959}",
    "\u{1F9C6}",
    "\u{1F95A}",
    "\u{1F373}",
    "\u{1F958}",
    "\u{1F372}",
    "\u{1FAD5}",
    "\u{1F963}",
    "\u{1F957}",
    "\u{1F37F}",
    "\u{1F9C8}",
    "\u{1F9C2}",
    "\u{1F96B}",
    "\u{1F371}",
    "\u{1F358}",
    "\u{1F359}",
    "\u{1F35A}",
    "\u{1F35B}",
    "\u{1F35C}",
    "\u{1F35D}",
    "\u{1F360}",
    "\u{1F362}",
    "\u{1F363}",
    "\u{1F364}",
    "\u{1F365}",
    "\u{1F96E}",
    "\u{1F361}",
    "\u{1F95F}",
    "\u{1F960}",
    "\u{1F961}",
    "\u{1F980}",
    "\u{1F99E}",
    "\u{1F990}",
    "\u{1F991}",
    "\u{1F9AA}",
    "\u{1F366}",
    "\u{1F367}",
    "\u{1F368}",
    "\u{1F369}",
    "\u{1F36A}",
    "\u{1F382}",
    "\u{1F370}",
    "\u{1F9C1}",
    "\u{1F967}",
    "\u{1F36B}",
    "\u{1F36C}",
    "\u{1F36D}",
    "\u{1F36E}",
    "\u{1F36F}",
    "\u{1F37C}",
    "\u{1F95B}",
    "\u2615",
    "\u{1FAD6}",
    "\u{1F375}",
    "\u{1F376}",
    "\u{1F37E}",
    "\u{1F377}",
    "\u{1F378}",
    "\u{1F379}",
    "\u{1F37A}",
    "\u{1F37B}",
    "\u{1F942}",
    "\u{1F943}",
    "\u{1F964}",
    "\u{1F9CB}",
    "\u{1F9C3}",
    "\u{1F9C9}",
    "\u{1F9CA}",
    "\u{1F962}",
    "\u{1F37D}\uFE0F",
    "\u{1F374}",
    "\u{1F944}",
    "\u{1F52A}",
    "\u{1F3FA}"
  ],
  travel: [
    "\u{1F30D}",
    "\u{1F30E}",
    "\u{1F30F}",
    "\u{1F310}",
    "\u{1F5FA}\uFE0F",
    "\u{1F5FE}",
    "\u{1F9ED}",
    "\u{1F3D4}\uFE0F",
    "\u26F0\uFE0F",
    "\u{1F30B}",
    "\u{1F5FB}",
    "\u{1F3D5}\uFE0F",
    "\u{1F3D6}\uFE0F",
    "\u{1F3DC}\uFE0F",
    "\u{1F3DD}\uFE0F",
    "\u{1F3DE}\uFE0F",
    "\u{1F3DF}\uFE0F",
    "\u{1F3DB}\uFE0F",
    "\u{1F3D7}\uFE0F",
    "\u{1F9F1}",
    "\u{1FAA8}",
    "\u{1FAB5}",
    "\u{1F6D6}",
    "\u{1F3D8}\uFE0F",
    "\u{1F3DA}\uFE0F",
    "\u{1F3E0}",
    "\u{1F3E1}",
    "\u{1F3E2}",
    "\u{1F3E3}",
    "\u{1F3E4}",
    "\u{1F3E5}",
    "\u{1F3E6}",
    "\u{1F3E8}",
    "\u{1F3E9}",
    "\u{1F3EA}",
    "\u{1F3EB}",
    "\u{1F3EC}",
    "\u{1F3ED}",
    "\u{1F3EF}",
    "\u{1F3F0}",
    "\u{1F492}",
    "\u{1F5FC}",
    "\u{1F5FD}",
    "\u26EA",
    "\u{1F54C}",
    "\u{1F6D5}",
    "\u{1F54D}",
    "\u26E9\uFE0F",
    "\u{1F54B}",
    "\u26F2",
    "\u26FA",
    "\u{1F301}",
    "\u{1F303}",
    "\u{1F3D9}\uFE0F",
    "\u{1F304}",
    "\u{1F305}",
    "\u{1F306}",
    "\u{1F307}",
    "\u{1F309}",
    "\u2668\uFE0F",
    "\u{1F3A0}",
    "\u{1F3A1}",
    "\u{1F3A2}",
    "\u{1F488}",
    "\u{1F3AA}",
    "\u{1F682}",
    "\u{1F683}",
    "\u{1F684}",
    "\u{1F685}",
    "\u{1F686}",
    "\u{1F687}",
    "\u{1F688}",
    "\u{1F689}",
    "\u{1F68A}",
    "\u{1F69D}",
    "\u{1F69E}",
    "\u{1F68B}",
    "\u{1F68C}",
    "\u{1F68D}",
    "\u{1F68E}",
    "\u{1F690}",
    "\u{1F691}",
    "\u{1F692}",
    "\u{1F693}",
    "\u{1F694}",
    "\u{1F695}",
    "\u{1F696}",
    "\u{1F697}",
    "\u{1F698}",
    "\u{1F699}",
    "\u{1F6FB}",
    "\u{1F69A}",
    "\u{1F69B}",
    "\u{1F69C}",
    "\u{1F3CE}\uFE0F",
    "\u{1F3CD}\uFE0F",
    "\u{1F6F5}",
    "\u{1F9BD}",
    "\u{1F9BC}",
    "\u{1F6FA}",
    "\u{1F6B2}",
    "\u{1F6F4}",
    "\u{1F6F9}",
    "\u{1F6FC}",
    "\u{1F68F}",
    "\u{1F6E3}\uFE0F",
    "\u{1F6E4}\uFE0F",
    "\u{1F6E2}\uFE0F",
    "\u26FD",
    "\u{1F6A8}",
    "\u{1F6A5}",
    "\u{1F6A6}",
    "\u{1F6D1}",
    "\u{1F6A7}",
    "\u2693",
    "\u26F5",
    "\u{1F6F6}",
    "\u{1F6A4}",
    "\u{1F6F3}\uFE0F",
    "\u26F4\uFE0F",
    "\u{1F6E5}\uFE0F",
    "\u{1F6A2}",
    "\u2708\uFE0F",
    "\u{1F6E9}\uFE0F",
    "\u{1F6EB}",
    "\u{1F6EC}",
    "\u{1FA82}",
    "\u{1F4BA}",
    "\u{1F681}",
    "\u{1F69F}",
    "\u{1F6A0}",
    "\u{1F6A1}",
    "\u{1F6F0}\uFE0F",
    "\u{1F680}",
    "\u{1F6F8}",
    "\u{1F6CE}\uFE0F",
    "\u{1F9F3}",
    "\u231B",
    "\u23F3",
    "\u231A",
    "\u23F0",
    "\u23F1\uFE0F",
    "\u23F2\uFE0F",
    "\u{1F570}\uFE0F",
    "\u{1F55B}",
    "\u{1F567}",
    "\u{1F550}",
    "\u{1F55C}",
    "\u{1F551}",
    "\u{1F55D}",
    "\u{1F552}",
    "\u{1F55E}",
    "\u{1F553}",
    "\u{1F55F}",
    "\u{1F554}",
    "\u{1F560}",
    "\u{1F555}",
    "\u{1F561}",
    "\u{1F556}",
    "\u{1F562}",
    "\u{1F557}",
    "\u{1F563}",
    "\u{1F558}",
    "\u{1F564}",
    "\u{1F559}",
    "\u{1F565}",
    "\u{1F55A}",
    "\u{1F566}",
    "\u{1F311}",
    "\u{1F312}",
    "\u{1F313}",
    "\u{1F314}",
    "\u{1F315}",
    "\u{1F316}",
    "\u{1F317}",
    "\u{1F318}",
    "\u{1F319}",
    "\u{1F31A}",
    "\u{1F31B}",
    "\u{1F31C}",
    "\u{1F321}\uFE0F",
    "\u2600\uFE0F",
    "\u{1F31D}",
    "\u{1F31E}",
    "\u{1FA90}",
    "\u2B50",
    "\u{1F31F}",
    "\u{1F320}",
    "\u{1F30C}",
    "\u2601\uFE0F",
    "\u26C5",
    "\u26C8\uFE0F",
    "\u{1F324}\uFE0F",
    "\u{1F325}\uFE0F",
    "\u{1F326}\uFE0F",
    "\u{1F327}\uFE0F",
    "\u{1F328}\uFE0F",
    "\u{1F329}\uFE0F",
    "\u{1F32A}\uFE0F",
    "\u{1F32B}\uFE0F",
    "\u{1F32C}\uFE0F",
    "\u{1F300}",
    "\u{1F308}",
    "\u{1F302}",
    "\u2602\uFE0F",
    "\u2614",
    "\u26F1\uFE0F",
    "\u26A1",
    "\u2744\uFE0F",
    "\u2603\uFE0F",
    "\u26C4",
    "\u2604\uFE0F",
    "\u{1F525}",
    "\u{1F4A7}",
    "\u{1F30A}"
  ],
  activity: [
    "\u{1F383}",
    "\u{1F384}",
    "\u{1F386}",
    "\u{1F387}",
    "\u{1F9E8}",
    "\u2728",
    "\u{1F388}",
    "\u{1F389}",
    "\u{1F38A}",
    "\u{1F38B}",
    "\u{1F38D}",
    "\u{1F38E}",
    "\u{1F38F}",
    "\u{1F390}",
    "\u{1F391}",
    "\u{1F9E7}",
    "\u{1F380}",
    "\u{1F381}",
    "\u{1F397}\uFE0F",
    "\u{1F39F}\uFE0F",
    "\u{1F3AB}",
    "\u{1F396}\uFE0F",
    "\u{1F3C6}",
    "\u{1F3C5}",
    "\u{1F947}",
    "\u{1F948}",
    "\u{1F949}",
    "\u26BD",
    "\u26BE",
    "\u{1F94E}",
    "\u{1F3C0}",
    "\u{1F3D0}",
    "\u{1F3C8}",
    "\u{1F3C9}",
    "\u{1F3BE}",
    "\u{1F94F}",
    "\u{1F3B3}",
    "\u{1F3CF}",
    "\u{1F3D1}",
    "\u{1F3D2}",
    "\u{1F94D}",
    "\u{1F3D3}",
    "\u{1F3F8}",
    "\u{1F94A}",
    "\u{1F94B}",
    "\u{1F945}",
    "\u26F3",
    "\u26F8\uFE0F",
    "\u{1F3A3}",
    "\u{1F93F}",
    "\u{1F3BD}",
    "\u{1F3BF}",
    "\u{1F6F7}",
    "\u{1F94C}",
    "\u{1F3AF}",
    "\u{1FA80}",
    "\u{1FA81}",
    "\u{1F3B1}",
    "\u{1F52E}",
    "\u{1FA84}",
    "\u{1F9FF}",
    "\u{1F3AE}",
    "\u{1F579}\uFE0F",
    "\u{1F3B0}",
    "\u{1F3B2}",
    "\u{1F9E9}",
    "\u{1F9F8}",
    "\u{1FA85}",
    "\u{1FA86}",
    "\u2660\uFE0F",
    "\u2665\uFE0F",
    "\u2666\uFE0F",
    "\u2663\uFE0F",
    "\u265F\uFE0F",
    "\u{1F0CF}",
    "\u{1F004}",
    "\u{1F3B4}",
    "\u{1F3AD}",
    "\u{1F5BC}\uFE0F",
    "\u{1F3A8}",
    "\u{1F9F5}",
    "\u{1FAA1}",
    "\u{1F9F6}",
    "\u{1FAA2}"
  ],
  object: [
    "\u{1F453}",
    "\u{1F576}\uFE0F",
    "\u{1F97D}",
    "\u{1F97C}",
    "\u{1F9BA}",
    "\u{1F454}",
    "\u{1F455}",
    "\u{1F456}",
    "\u{1F9E3}",
    "\u{1F9E4}",
    "\u{1F9E5}",
    "\u{1F9E6}",
    "\u{1F457}",
    "\u{1F458}",
    "\u{1F97B}",
    "\u{1FA71}",
    "\u{1FA72}",
    "\u{1FA73}",
    "\u{1F459}",
    "\u{1F45A}",
    "\u{1F45B}",
    "\u{1F45C}",
    "\u{1F45D}",
    "\u{1F6CD}\uFE0F",
    "\u{1F392}",
    "\u{1FA74}",
    "\u{1F45E}",
    "\u{1F45F}",
    "\u{1F97E}",
    "\u{1F97F}",
    "\u{1F460}",
    "\u{1F461}",
    "\u{1FA70}",
    "\u{1F462}",
    "\u{1F451}",
    "\u{1F452}",
    "\u{1F3A9}",
    "\u{1F393}",
    "\u{1F9E2}",
    "\u{1FA96}",
    "\u26D1\uFE0F",
    "\u{1F4FF}",
    "\u{1F484}",
    "\u{1F48D}",
    "\u{1F48E}",
    "\u{1F507}",
    "\u{1F508}",
    "\u{1F509}",
    "\u{1F50A}",
    "\u{1F4E2}",
    "\u{1F4E3}",
    "\u{1F4EF}",
    "\u{1F514}",
    "\u{1F515}",
    "\u{1F3BC}",
    "\u{1F3B5}",
    "\u{1F3B6}",
    "\u{1F399}\uFE0F",
    "\u{1F39A}\uFE0F",
    "\u{1F39B}\uFE0F",
    "\u{1F3A4}",
    "\u{1F3A7}",
    "\u{1F4FB}",
    "\u{1F3B7}",
    "\u{1FA97}",
    "\u{1F3B8}",
    "\u{1F3B9}",
    "\u{1F3BA}",
    "\u{1F3BB}",
    "\u{1FA95}",
    "\u{1F941}",
    "\u{1FA98}",
    "\u{1F4F1}",
    "\u{1F4F2}",
    "\u260E\uFE0F",
    "\u{1F4DE}",
    "\u{1F4DF}",
    "\u{1F4E0}",
    "\u{1F50B}",
    "\u{1F50C}",
    "\u{1F4BB}",
    "\u{1F5A5}\uFE0F",
    "\u{1F5A8}\uFE0F",
    "\u2328\uFE0F",
    "\u{1F5B1}\uFE0F",
    "\u{1F5B2}\uFE0F",
    "\u{1F4BD}",
    "\u{1F4BE}",
    "\u{1F4BF}",
    "\u{1F4C0}",
    "\u{1F9EE}",
    "\u{1F3A5}",
    "\u{1F39E}\uFE0F",
    "\u{1F4FD}\uFE0F",
    "\u{1F3AC}",
    "\u{1F4FA}",
    "\u{1F4F7}",
    "\u{1F4F8}",
    "\u{1F4F9}",
    "\u{1F4FC}",
    "\u{1F50D}",
    "\u{1F50E}",
    "\u{1F56F}\uFE0F",
    "\u{1F4A1}",
    "\u{1F526}",
    "\u{1F3EE}",
    "\u{1FA94}",
    "\u{1F4D4}",
    "\u{1F4D5}",
    "\u{1F4D6}",
    "\u{1F4D7}",
    "\u{1F4D8}",
    "\u{1F4D9}",
    "\u{1F4DA}",
    "\u{1F4D3}",
    "\u{1F4D2}",
    "\u{1F4C3}",
    "\u{1F4DC}",
    "\u{1F4C4}",
    "\u{1F4F0}",
    "\u{1F5DE}\uFE0F",
    "\u{1F4D1}",
    "\u{1F516}",
    "\u{1F3F7}\uFE0F",
    "\u{1F4B0}",
    "\u{1FA99}",
    "\u{1F4B4}",
    "\u{1F4B5}",
    "\u{1F4B6}",
    "\u{1F4B7}",
    "\u{1F4B8}",
    "\u{1F4B3}",
    "\u{1F9FE}",
    "\u{1F4B9}",
    "\u2709\uFE0F",
    "\u{1F4E7}",
    "\u{1F4E8}",
    "\u{1F4E9}",
    "\u{1F4E4}",
    "\u{1F4E5}",
    "\u{1F4E6}",
    "\u{1F4EB}",
    "\u{1F4EA}",
    "\u{1F4EC}",
    "\u{1F4ED}",
    "\u{1F4EE}",
    "\u{1F5F3}\uFE0F",
    "\u270F\uFE0F",
    "\u2712\uFE0F",
    "\u{1F58B}\uFE0F",
    "\u{1F58A}\uFE0F",
    "\u{1F58C}\uFE0F",
    "\u{1F58D}\uFE0F",
    "\u{1F4DD}",
    "\u{1F4BC}",
    "\u{1F4C1}",
    "\u{1F4C2}",
    "\u{1F5C2}\uFE0F",
    "\u{1F4C5}",
    "\u{1F4C6}",
    "\u{1F5D2}\uFE0F",
    "\u{1F5D3}\uFE0F",
    "\u{1F4C7}",
    "\u{1F4C8}",
    "\u{1F4C9}",
    "\u{1F4CA}",
    "\u{1F4CB}",
    "\u{1F4CC}",
    "\u{1F4CD}",
    "\u{1F4CE}",
    "\u{1F587}\uFE0F",
    "\u{1F4CF}",
    "\u{1F4D0}",
    "\u2702\uFE0F",
    "\u{1F5C3}\uFE0F",
    "\u{1F5C4}\uFE0F",
    "\u{1F5D1}\uFE0F",
    "\u{1F512}",
    "\u{1F513}",
    "\u{1F50F}",
    "\u{1F510}",
    "\u{1F511}",
    "\u{1F5DD}\uFE0F",
    "\u{1F528}",
    "\u{1FA93}",
    "\u26CF\uFE0F",
    "\u2692\uFE0F",
    "\u{1F6E0}\uFE0F",
    "\u{1F5E1}\uFE0F",
    "\u2694\uFE0F",
    "\u{1F52B}",
    "\u{1FA83}",
    "\u{1F3F9}",
    "\u{1F6E1}\uFE0F",
    "\u{1FA9A}",
    "\u{1F527}",
    "\u{1FA9B}",
    "\u{1F529}",
    "\u2699\uFE0F",
    "\u{1F5DC}\uFE0F",
    "\u2696\uFE0F",
    "\u{1F9AF}",
    "\u{1F517}",
    "\u26D3\uFE0F",
    "\u{1FA9D}",
    "\u{1F9F0}",
    "\u{1F9F2}",
    "\u{1FA9C}",
    "\u2697\uFE0F",
    "\u{1F9EA}",
    "\u{1F9EB}",
    "\u{1F9EC}",
    "\u{1F52C}",
    "\u{1F52D}",
    "\u{1F4E1}",
    "\u{1F489}",
    "\u{1FA78}",
    "\u{1F48A}",
    "\u{1FA79}",
    "\u{1FA7A}",
    "\u{1F6AA}",
    "\u{1F6D7}",
    "\u{1FA9E}",
    "\u{1FA9F}",
    "\u{1F6CF}\uFE0F",
    "\u{1F6CB}\uFE0F",
    "\u{1FA91}",
    "\u{1F6BD}",
    "\u{1FAA0}",
    "\u{1F6BF}",
    "\u{1F6C1}",
    "\u{1FAA4}",
    "\u{1FA92}",
    "\u{1F9F4}",
    "\u{1F9F7}",
    "\u{1F9F9}",
    "\u{1F9FA}",
    "\u{1F9FB}",
    "\u{1FAA3}",
    "\u{1F9FC}",
    "\u{1FAA5}",
    "\u{1F9FD}",
    "\u{1F9EF}",
    "\u{1F6D2}",
    "\u{1F6AC}",
    "\u26B0\uFE0F",
    "\u{1FAA6}",
    "\u26B1\uFE0F",
    "\u{1F5FF}",
    "\u{1FAA7}"
  ],
  symbol: [
    "\u{1F3E7}",
    "\u{1F6AE}",
    "\u{1F6B0}",
    "\u267F",
    "\u{1F6B9}",
    "\u{1F6BA}",
    "\u{1F6BB}",
    "\u{1F6BC}",
    "\u{1F6BE}",
    "\u{1F6C2}",
    "\u{1F6C3}",
    "\u{1F6C4}",
    "\u{1F6C5}",
    "\u26A0\uFE0F",
    "\u{1F6B8}",
    "\u26D4",
    "\u{1F6AB}",
    "\u{1F6B3}",
    "\u{1F6AD}",
    "\u{1F6AF}",
    "\u{1F6B1}",
    "\u{1F6B7}",
    "\u{1F4F5}",
    "\u{1F51E}",
    "\u2622\uFE0F",
    "\u2623\uFE0F",
    "\u2B06\uFE0F",
    "\u2197\uFE0F",
    "\u27A1\uFE0F",
    "\u2198\uFE0F",
    "\u2B07\uFE0F",
    "\u2199\uFE0F",
    "\u2B05\uFE0F",
    "\u2196\uFE0F",
    "\u2195\uFE0F",
    "\u2194\uFE0F",
    "\u21A9\uFE0F",
    "\u21AA\uFE0F",
    "\u2934\uFE0F",
    "\u2935\uFE0F",
    "\u{1F503}",
    "\u{1F504}",
    "\u{1F519}",
    "\u{1F51A}",
    "\u{1F51B}",
    "\u{1F51C}",
    "\u{1F51D}",
    "\u{1F6D0}",
    "\u269B\uFE0F",
    "\u{1F549}\uFE0F",
    "\u2721\uFE0F",
    "\u2638\uFE0F",
    "\u262F\uFE0F",
    "\u271D\uFE0F",
    "\u2626\uFE0F",
    "\u262A\uFE0F",
    "\u262E\uFE0F",
    "\u{1F54E}",
    "\u{1F52F}",
    "\u2648",
    "\u2649",
    "\u264A",
    "\u264B",
    "\u264C",
    "\u264D",
    "\u264E",
    "\u264F",
    "\u2650",
    "\u2651",
    "\u2652",
    "\u2653",
    "\u26CE",
    "\u{1F500}",
    "\u{1F501}",
    "\u{1F502}",
    "\u25B6\uFE0F",
    "\u23E9",
    "\u23ED\uFE0F",
    "\u23EF\uFE0F",
    "\u25C0\uFE0F",
    "\u23EA",
    "\u23EE\uFE0F",
    "\u{1F53C}",
    "\u23EB",
    "\u{1F53D}",
    "\u23EC",
    "\u23F8\uFE0F",
    "\u23F9\uFE0F",
    "\u23FA\uFE0F",
    "\u23CF\uFE0F",
    "\u{1F3A6}",
    "\u{1F505}",
    "\u{1F506}",
    "\u{1F4F6}",
    "\u{1F4F3}",
    "\u{1F4F4}",
    "\u2640\uFE0F",
    "\u2642\uFE0F",
    "\u26A7\uFE0F",
    "\u2716\uFE0F",
    "\u2795",
    "\u2796",
    "\u2797",
    "\u267E\uFE0F",
    "\u203C\uFE0F",
    "\u2049\uFE0F",
    "\u2753",
    "\u2754",
    "\u2755",
    "\u2757",
    "\u3030\uFE0F",
    "\u{1F4B1}",
    "\u{1F4B2}",
    "\u2695\uFE0F",
    "\u267B\uFE0F",
    "\u269C\uFE0F",
    "\u{1F531}",
    "\u{1F4DB}",
    "\u{1F530}",
    "\u2B55",
    "\u2705",
    "\u2611\uFE0F",
    "\u2714\uFE0F",
    "\u274C",
    "\u274E",
    "\u27B0",
    "\u27BF",
    "\u303D\uFE0F",
    "\u2733\uFE0F",
    "\u2734\uFE0F",
    "\u2747\uFE0F",
    "\xA9\uFE0F",
    "\xAE\uFE0F",
    "\u2122\uFE0F",
    "#\uFE0F\u20E3",
    "*\uFE0F\u20E3",
    "0\uFE0F\u20E3",
    "1\uFE0F\u20E3",
    "2\uFE0F\u20E3",
    "3\uFE0F\u20E3",
    "4\uFE0F\u20E3",
    "5\uFE0F\u20E3",
    "6\uFE0F\u20E3",
    "7\uFE0F\u20E3",
    "8\uFE0F\u20E3",
    "9\uFE0F\u20E3",
    "\u{1F51F}",
    "\u{1F520}",
    "\u{1F521}",
    "\u{1F522}",
    "\u{1F523}",
    "\u{1F524}",
    "\u{1F170}\uFE0F",
    "\u{1F18E}",
    "\u{1F171}\uFE0F",
    "\u{1F191}",
    "\u{1F192}",
    "\u{1F193}",
    "\u2139\uFE0F",
    "\u{1F194}",
    "\u24C2\uFE0F",
    "\u{1F195}",
    "\u{1F196}",
    "\u{1F17E}\uFE0F",
    "\u{1F197}",
    "\u{1F17F}\uFE0F",
    "\u{1F198}",
    "\u{1F199}",
    "\u{1F19A}",
    "\u{1F201}",
    "\u{1F202}\uFE0F",
    "\u{1F237}\uFE0F",
    "\u{1F236}",
    "\u{1F22F}",
    "\u{1F250}",
    "\u{1F239}",
    "\u{1F21A}",
    "\u{1F232}",
    "\u{1F251}",
    "\u{1F238}",
    "\u{1F234}",
    "\u{1F233}",
    "\u3297\uFE0F",
    "\u3299\uFE0F",
    "\u{1F23A}",
    "\u{1F235}",
    "\u{1F534}",
    "\u{1F7E0}",
    "\u{1F7E1}",
    "\u{1F7E2}",
    "\u{1F535}",
    "\u{1F7E3}",
    "\u{1F7E4}",
    "\u26AB",
    "\u26AA",
    "\u{1F7E5}",
    "\u{1F7E7}",
    "\u{1F7E8}",
    "\u{1F7E9}",
    "\u{1F7E6}",
    "\u{1F7EA}",
    "\u{1F7EB}",
    "\u2B1B",
    "\u2B1C",
    "\u25FC\uFE0F",
    "\u25FB\uFE0F",
    "\u25FE",
    "\u25FD",
    "\u25AA\uFE0F",
    "\u25AB\uFE0F",
    "\u{1F536}",
    "\u{1F537}",
    "\u{1F538}",
    "\u{1F539}",
    "\u{1F53A}",
    "\u{1F53B}",
    "\u{1F4A0}",
    "\u{1F518}",
    "\u{1F533}",
    "\u{1F532}"
  ],
  flag: [
    "\u{1F3C1}",
    "\u{1F6A9}",
    "\u{1F38C}",
    "\u{1F3F4}",
    "\u{1F3F3}\uFE0F",
    "\u{1F3F3}\uFE0F\u200D\u{1F308}",
    "\u{1F3F3}\uFE0F\u200D\u26A7\uFE0F",
    "\u{1F3F4}\u200D\u2620\uFE0F",
    "\u{1F1E6}\u{1F1E8}",
    "\u{1F1E6}\u{1F1E9}",
    "\u{1F1E6}\u{1F1EA}",
    "\u{1F1E6}\u{1F1EB}",
    "\u{1F1E6}\u{1F1EC}",
    "\u{1F1E6}\u{1F1EE}",
    "\u{1F1E6}\u{1F1F1}",
    "\u{1F1E6}\u{1F1F2}",
    "\u{1F1E6}\u{1F1F4}",
    "\u{1F1E6}\u{1F1F6}",
    "\u{1F1E6}\u{1F1F7}",
    "\u{1F1E6}\u{1F1F8}",
    "\u{1F1E6}\u{1F1F9}",
    "\u{1F1E6}\u{1F1FA}",
    "\u{1F1E6}\u{1F1FC}",
    "\u{1F1E6}\u{1F1FD}",
    "\u{1F1E6}\u{1F1FF}",
    "\u{1F1E7}\u{1F1E6}",
    "\u{1F1E7}\u{1F1E7}",
    "\u{1F1E7}\u{1F1E9}",
    "\u{1F1E7}\u{1F1EA}",
    "\u{1F1E7}\u{1F1EB}",
    "\u{1F1E7}\u{1F1EC}",
    "\u{1F1E7}\u{1F1ED}",
    "\u{1F1E7}\u{1F1EE}",
    "\u{1F1E7}\u{1F1EF}",
    "\u{1F1E7}\u{1F1F1}",
    "\u{1F1E7}\u{1F1F2}",
    "\u{1F1E7}\u{1F1F3}",
    "\u{1F1E7}\u{1F1F4}",
    "\u{1F1E7}\u{1F1F6}",
    "\u{1F1E7}\u{1F1F7}",
    "\u{1F1E7}\u{1F1F8}",
    "\u{1F1E7}\u{1F1F9}",
    "\u{1F1E7}\u{1F1FB}",
    "\u{1F1E7}\u{1F1FC}",
    "\u{1F1E7}\u{1F1FE}",
    "\u{1F1E7}\u{1F1FF}",
    "\u{1F1E8}\u{1F1E6}",
    "\u{1F1E8}\u{1F1E8}",
    "\u{1F1E8}\u{1F1E9}",
    "\u{1F1E8}\u{1F1EB}",
    "\u{1F1E8}\u{1F1EC}",
    "\u{1F1E8}\u{1F1ED}",
    "\u{1F1E8}\u{1F1EE}",
    "\u{1F1E8}\u{1F1F0}",
    "\u{1F1E8}\u{1F1F1}",
    "\u{1F1E8}\u{1F1F2}",
    "\u{1F1E8}\u{1F1F3}",
    "\u{1F1E8}\u{1F1F4}",
    "\u{1F1E8}\u{1F1F5}",
    "\u{1F1E8}\u{1F1F7}",
    "\u{1F1E8}\u{1F1FA}",
    "\u{1F1E8}\u{1F1FB}",
    "\u{1F1E8}\u{1F1FC}",
    "\u{1F1E8}\u{1F1FD}",
    "\u{1F1E8}\u{1F1FE}",
    "\u{1F1E8}\u{1F1FF}",
    "\u{1F1E9}\u{1F1EA}",
    "\u{1F1E9}\u{1F1EC}",
    "\u{1F1E9}\u{1F1EF}",
    "\u{1F1E9}\u{1F1F0}",
    "\u{1F1E9}\u{1F1F2}",
    "\u{1F1E9}\u{1F1F4}",
    "\u{1F1E9}\u{1F1FF}",
    "\u{1F1EA}\u{1F1E6}",
    "\u{1F1EA}\u{1F1E8}",
    "\u{1F1EA}\u{1F1EA}",
    "\u{1F1EA}\u{1F1EC}",
    "\u{1F1EA}\u{1F1ED}",
    "\u{1F1EA}\u{1F1F7}",
    "\u{1F1EA}\u{1F1F8}",
    "\u{1F1EA}\u{1F1F9}",
    "\u{1F1EA}\u{1F1FA}",
    "\u{1F1EB}\u{1F1EE}",
    "\u{1F1EB}\u{1F1EF}",
    "\u{1F1EB}\u{1F1F0}",
    "\u{1F1EB}\u{1F1F2}",
    "\u{1F1EB}\u{1F1F4}",
    "\u{1F1EB}\u{1F1F7}",
    "\u{1F1EC}\u{1F1E6}",
    "\u{1F1EC}\u{1F1E7}",
    "\u{1F1EC}\u{1F1E9}",
    "\u{1F1EC}\u{1F1EA}",
    "\u{1F1EC}\u{1F1EB}",
    "\u{1F1EC}\u{1F1EC}",
    "\u{1F1EC}\u{1F1ED}",
    "\u{1F1EC}\u{1F1EE}",
    "\u{1F1EC}\u{1F1F1}",
    "\u{1F1EC}\u{1F1F2}",
    "\u{1F1EC}\u{1F1F3}",
    "\u{1F1EC}\u{1F1F5}",
    "\u{1F1EC}\u{1F1F6}",
    "\u{1F1EC}\u{1F1F7}",
    "\u{1F1EC}\u{1F1F8}",
    "\u{1F1EC}\u{1F1F9}",
    "\u{1F1EC}\u{1F1FA}",
    "\u{1F1EC}\u{1F1FC}",
    "\u{1F1EC}\u{1F1FE}",
    "\u{1F1ED}\u{1F1F0}",
    "\u{1F1ED}\u{1F1F2}",
    "\u{1F1ED}\u{1F1F3}",
    "\u{1F1ED}\u{1F1F7}",
    "\u{1F1ED}\u{1F1F9}",
    "\u{1F1ED}\u{1F1FA}",
    "\u{1F1EE}\u{1F1E8}",
    "\u{1F1EE}\u{1F1E9}",
    "\u{1F1EE}\u{1F1EA}",
    "\u{1F1EE}\u{1F1F1}",
    "\u{1F1EE}\u{1F1F2}",
    "\u{1F1EE}\u{1F1F3}",
    "\u{1F1EE}\u{1F1F4}",
    "\u{1F1EE}\u{1F1F6}",
    "\u{1F1EE}\u{1F1F7}",
    "\u{1F1EE}\u{1F1F8}",
    "\u{1F1EE}\u{1F1F9}",
    "\u{1F1EF}\u{1F1EA}",
    "\u{1F1EF}\u{1F1F2}",
    "\u{1F1EF}\u{1F1F4}",
    "\u{1F1EF}\u{1F1F5}",
    "\u{1F1F0}\u{1F1EA}",
    "\u{1F1F0}\u{1F1EC}",
    "\u{1F1F0}\u{1F1ED}",
    "\u{1F1F0}\u{1F1EE}",
    "\u{1F1F0}\u{1F1F2}",
    "\u{1F1F0}\u{1F1F3}",
    "\u{1F1F0}\u{1F1F5}",
    "\u{1F1F0}\u{1F1F7}",
    "\u{1F1F0}\u{1F1FC}",
    "\u{1F1F0}\u{1F1FE}",
    "\u{1F1F0}\u{1F1FF}",
    "\u{1F1F1}\u{1F1E6}",
    "\u{1F1F1}\u{1F1E7}",
    "\u{1F1F1}\u{1F1E8}",
    "\u{1F1F1}\u{1F1EE}",
    "\u{1F1F1}\u{1F1F0}",
    "\u{1F1F1}\u{1F1F7}",
    "\u{1F1F1}\u{1F1F8}",
    "\u{1F1F1}\u{1F1F9}",
    "\u{1F1F1}\u{1F1FA}",
    "\u{1F1F1}\u{1F1FB}",
    "\u{1F1F1}\u{1F1FE}",
    "\u{1F1F2}\u{1F1E6}",
    "\u{1F1F2}\u{1F1E8}",
    "\u{1F1F2}\u{1F1E9}",
    "\u{1F1F2}\u{1F1EA}",
    "\u{1F1F2}\u{1F1EB}",
    "\u{1F1F2}\u{1F1EC}",
    "\u{1F1F2}\u{1F1ED}",
    "\u{1F1F2}\u{1F1F0}",
    "\u{1F1F2}\u{1F1F1}",
    "\u{1F1F2}\u{1F1F2}",
    "\u{1F1F2}\u{1F1F3}",
    "\u{1F1F2}\u{1F1F4}",
    "\u{1F1F2}\u{1F1F5}",
    "\u{1F1F2}\u{1F1F6}",
    "\u{1F1F2}\u{1F1F7}",
    "\u{1F1F2}\u{1F1F8}",
    "\u{1F1F2}\u{1F1F9}",
    "\u{1F1F2}\u{1F1FA}",
    "\u{1F1F2}\u{1F1FB}",
    "\u{1F1F2}\u{1F1FC}",
    "\u{1F1F2}\u{1F1FD}",
    "\u{1F1F2}\u{1F1FE}",
    "\u{1F1F2}\u{1F1FF}",
    "\u{1F1F3}\u{1F1E6}",
    "\u{1F1F3}\u{1F1E8}",
    "\u{1F1F3}\u{1F1EA}",
    "\u{1F1F3}\u{1F1EB}",
    "\u{1F1F3}\u{1F1EC}",
    "\u{1F1F3}\u{1F1EE}",
    "\u{1F1F3}\u{1F1F1}",
    "\u{1F1F3}\u{1F1F4}",
    "\u{1F1F3}\u{1F1F5}",
    "\u{1F1F3}\u{1F1F7}",
    "\u{1F1F3}\u{1F1FA}",
    "\u{1F1F3}\u{1F1FF}",
    "\u{1F1F4}\u{1F1F2}",
    "\u{1F1F5}\u{1F1E6}",
    "\u{1F1F5}\u{1F1EA}",
    "\u{1F1F5}\u{1F1EB}",
    "\u{1F1F5}\u{1F1EC}",
    "\u{1F1F5}\u{1F1ED}",
    "\u{1F1F5}\u{1F1F0}",
    "\u{1F1F5}\u{1F1F1}",
    "\u{1F1F5}\u{1F1F2}",
    "\u{1F1F5}\u{1F1F3}",
    "\u{1F1F5}\u{1F1F7}",
    "\u{1F1F5}\u{1F1F8}",
    "\u{1F1F5}\u{1F1F9}",
    "\u{1F1F5}\u{1F1FC}",
    "\u{1F1F5}\u{1F1FE}",
    "\u{1F1F6}\u{1F1E6}",
    "\u{1F1F7}\u{1F1EA}",
    "\u{1F1F7}\u{1F1F4}",
    "\u{1F1F7}\u{1F1F8}",
    "\u{1F1F7}\u{1F1FA}",
    "\u{1F1F7}\u{1F1FC}",
    "\u{1F1F8}\u{1F1E6}",
    "\u{1F1F8}\u{1F1E7}",
    "\u{1F1F8}\u{1F1E8}",
    "\u{1F1F8}\u{1F1E9}",
    "\u{1F1F8}\u{1F1EA}",
    "\u{1F1F8}\u{1F1EC}",
    "\u{1F1F8}\u{1F1ED}",
    "\u{1F1F8}\u{1F1EE}",
    "\u{1F1F8}\u{1F1EF}",
    "\u{1F1F8}\u{1F1F0}",
    "\u{1F1F8}\u{1F1F1}",
    "\u{1F1F8}\u{1F1F2}",
    "\u{1F1F8}\u{1F1F3}",
    "\u{1F1F8}\u{1F1F4}",
    "\u{1F1F8}\u{1F1F7}",
    "\u{1F1F8}\u{1F1F8}",
    "\u{1F1F8}\u{1F1F9}",
    "\u{1F1F8}\u{1F1FB}",
    "\u{1F1F8}\u{1F1FD}",
    "\u{1F1F8}\u{1F1FE}",
    "\u{1F1F8}\u{1F1FF}",
    "\u{1F1F9}\u{1F1E6}",
    "\u{1F1F9}\u{1F1E8}",
    "\u{1F1F9}\u{1F1E9}",
    "\u{1F1F9}\u{1F1EB}",
    "\u{1F1F9}\u{1F1EC}",
    "\u{1F1F9}\u{1F1ED}",
    "\u{1F1F9}\u{1F1EF}",
    "\u{1F1F9}\u{1F1F0}",
    "\u{1F1F9}\u{1F1F1}",
    "\u{1F1F9}\u{1F1F2}",
    "\u{1F1F9}\u{1F1F3}",
    "\u{1F1F9}\u{1F1F4}",
    "\u{1F1F9}\u{1F1F7}",
    "\u{1F1F9}\u{1F1F9}",
    "\u{1F1F9}\u{1F1FB}",
    "\u{1F1F9}\u{1F1FC}",
    "\u{1F1F9}\u{1F1FF}",
    "\u{1F1FA}\u{1F1E6}",
    "\u{1F1FA}\u{1F1EC}",
    "\u{1F1FA}\u{1F1F2}",
    "\u{1F1FA}\u{1F1F3}",
    "\u{1F1FA}\u{1F1F8}",
    "\u{1F1FA}\u{1F1FE}",
    "\u{1F1FA}\u{1F1FF}",
    "\u{1F1FB}\u{1F1E6}",
    "\u{1F1FB}\u{1F1E8}",
    "\u{1F1FB}\u{1F1EA}",
    "\u{1F1FB}\u{1F1EC}",
    "\u{1F1FB}\u{1F1EE}",
    "\u{1F1FB}\u{1F1F3}",
    "\u{1F1FB}\u{1F1FA}",
    "\u{1F1FC}\u{1F1EB}",
    "\u{1F1FC}\u{1F1F8}",
    "\u{1F1FD}\u{1F1F0}",
    "\u{1F1FE}\u{1F1EA}",
    "\u{1F1FE}\u{1F1F9}",
    "\u{1F1FF}\u{1F1E6}",
    "\u{1F1FF}\u{1F1F2}",
    "\u{1F1FF}\u{1F1FC}"
  ]
};
const example_email = ["example.org", "example.com", "example.net"];
const free_email = ["gmail.com", "yahoo.com", "hotmail.com"];
const http_status_code = {
  informational: [100, 101, 102, 103],
  success: [200, 201, 202, 203, 204, 205, 206, 207, 208, 226],
  redirection: [300, 301, 302, 303, 304, 305, 306, 307, 308],
  clientError: [
    400,
    401,
    402,
    403,
    404,
    405,
    406,
    407,
    408,
    409,
    410,
    411,
    412,
    413,
    414,
    415,
    416,
    417,
    418,
    421,
    422,
    423,
    424,
    425,
    426,
    428,
    429,
    431,
    451
  ],
  serverError: [500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511]
};
const internet = {
  avatar_uri,
  domain_suffix,
  emoji,
  example_email,
  free_email,
  http_status_code
};
const supplemental = [
  "abbas",
  "abduco",
  "abeo",
  "abscido",
  "absconditus",
  "absens",
  "absorbeo",
  "absque",
  "abstergo",
  "absum",
  "abundans",
  "abutor",
  "accedo",
  "accendo",
  "acceptus",
  "accipio",
  "accommodo",
  "accusator",
  "acer",
  "acerbitas",
  "acervus",
  "acidus",
  "acies",
  "acquiro",
  "acsi",
  "adamo",
  "adaugeo",
  "addo",
  "adduco",
  "ademptio",
  "adeo",
  "adeptio",
  "adfectus",
  "adfero",
  "adficio",
  "adflicto",
  "adhaero",
  "adhuc",
  "adicio",
  "adimpleo",
  "adinventitias",
  "adipiscor",
  "adiuvo",
  "administratio",
  "admiratio",
  "admitto",
  "admoneo",
  "admoveo",
  "adnuo",
  "adopto",
  "adsidue",
  "adstringo",
  "adsuesco",
  "adsum",
  "adulatio",
  "adulescens",
  "adultus",
  "aduro",
  "advenio",
  "adversus",
  "advoco",
  "aedificium",
  "aeger",
  "aegre",
  "aegrotatio",
  "aegrus",
  "aeneus",
  "aequitas",
  "aequus",
  "aer",
  "aestas",
  "aestivus",
  "aestus",
  "aetas",
  "aeternus",
  "ager",
  "aggero",
  "aggredior",
  "agnitio",
  "agnosco",
  "ago",
  "ait",
  "aiunt",
  "alienus",
  "alii",
  "alioqui",
  "aliqua",
  "alius",
  "allatus",
  "alo",
  "alter",
  "altus",
  "alveus",
  "amaritudo",
  "ambitus",
  "ambulo",
  "amicitia",
  "amiculum",
  "amissio",
  "amita",
  "amitto",
  "amo",
  "amor",
  "amoveo",
  "amplexus",
  "amplitudo",
  "amplus",
  "ancilla",
  "angelus",
  "angulus",
  "angustus",
  "animadverto",
  "animi",
  "animus",
  "annus",
  "anser",
  "ante",
  "antea",
  "antepono",
  "antiquus",
  "aperio",
  "aperte",
  "apostolus",
  "apparatus",
  "appello",
  "appono",
  "appositus",
  "approbo",
  "apto",
  "aptus",
  "apud",
  "aqua",
  "ara",
  "aranea",
  "arbitro",
  "arbor",
  "arbustum",
  "arca",
  "arceo",
  "arcesso",
  "arcus",
  "argentum",
  "argumentum",
  "arguo",
  "arma",
  "armarium",
  "armo",
  "aro",
  "ars",
  "articulus",
  "artificiose",
  "arto",
  "arx",
  "ascisco",
  "ascit",
  "asper",
  "aspicio",
  "asporto",
  "assentator",
  "astrum",
  "atavus",
  "ater",
  "atqui",
  "atrocitas",
  "atrox",
  "attero",
  "attollo",
  "attonbitus",
  "auctor",
  "auctus",
  "audacia",
  "audax",
  "audentia",
  "audeo",
  "audio",
  "auditor",
  "aufero",
  "aureus",
  "auris",
  "aurum",
  "aut",
  "autem",
  "autus",
  "auxilium",
  "avaritia",
  "avarus",
  "aveho",
  "averto",
  "avoco",
  "baiulus",
  "balbus",
  "barba",
  "bardus",
  "basium",
  "beatus",
  "bellicus",
  "bellum",
  "bene",
  "beneficium",
  "benevolentia",
  "benigne",
  "bestia",
  "bibo",
  "bis",
  "blandior",
  "bonus",
  "bos",
  "brevis",
  "cado",
  "caecus",
  "caelestis",
  "caelum",
  "calamitas",
  "calcar",
  "calco",
  "calculus",
  "callide",
  "campana",
  "candidus",
  "canis",
  "canonicus",
  "canto",
  "capillus",
  "capio",
  "capitulus",
  "capto",
  "caput",
  "carbo",
  "carcer",
  "careo",
  "caries",
  "cariosus",
  "caritas",
  "carmen",
  "carpo",
  "carus",
  "casso",
  "caste",
  "casus",
  "catena",
  "caterva",
  "cattus",
  "cauda",
  "causa",
  "caute",
  "caveo",
  "cavus",
  "cedo",
  "celebrer",
  "celer",
  "celo",
  "cena",
  "cenaculum",
  "ceno",
  "censura",
  "centum",
  "cerno",
  "cernuus",
  "certe",
  "certo",
  "certus",
  "cervus",
  "cetera",
  "charisma",
  "chirographum",
  "cibo",
  "cibus",
  "cicuta",
  "cilicium",
  "cimentarius",
  "ciminatio",
  "cinis",
  "circumvenio",
  "cito",
  "civis",
  "civitas",
  "clam",
  "clamo",
  "claro",
  "clarus",
  "claudeo",
  "claustrum",
  "clementia",
  "clibanus",
  "coadunatio",
  "coaegresco",
  "coepi",
  "coerceo",
  "cogito",
  "cognatus",
  "cognomen",
  "cogo",
  "cohaero",
  "cohibeo",
  "cohors",
  "colligo",
  "colloco",
  "collum",
  "colo",
  "color",
  "coma",
  "combibo",
  "comburo",
  "comedo",
  "comes",
  "cometes",
  "comis",
  "comitatus",
  "commemoro",
  "comminor",
  "commodo",
  "communis",
  "comparo",
  "compello",
  "complectus",
  "compono",
  "comprehendo",
  "comptus",
  "conatus",
  "concedo",
  "concido",
  "conculco",
  "condico",
  "conduco",
  "confero",
  "confido",
  "conforto",
  "confugo",
  "congregatio",
  "conicio",
  "coniecto",
  "conitor",
  "coniuratio",
  "conor",
  "conqueror",
  "conscendo",
  "conservo",
  "considero",
  "conspergo",
  "constans",
  "consuasor",
  "contabesco",
  "contego",
  "contigo",
  "contra",
  "conturbo",
  "conventus",
  "convoco",
  "copia",
  "copiose",
  "cornu",
  "corona",
  "corpus",
  "correptius",
  "corrigo",
  "corroboro",
  "corrumpo",
  "coruscus",
  "cotidie",
  "crapula",
  "cras",
  "crastinus",
  "creator",
  "creber",
  "crebro",
  "credo",
  "creo",
  "creptio",
  "crepusculum",
  "cresco",
  "creta",
  "cribro",
  "crinis",
  "cruciamentum",
  "crudelis",
  "cruentus",
  "crur",
  "crustulum",
  "crux",
  "cubicularis",
  "cubitum",
  "cubo",
  "cui",
  "cuius",
  "culpa",
  "culpo",
  "cultellus",
  "cultura",
  "cum",
  "cunabula",
  "cunae",
  "cunctatio",
  "cupiditas",
  "cupio",
  "cuppedia",
  "cupressus",
  "cur",
  "cura",
  "curatio",
  "curia",
  "curiositas",
  "curis",
  "curo",
  "curriculum",
  "currus",
  "cursim",
  "curso",
  "cursus",
  "curto",
  "curtus",
  "curvo",
  "curvus",
  "custodia",
  "damnatio",
  "damno",
  "dapifer",
  "debeo",
  "debilito",
  "decens",
  "decerno",
  "decet",
  "decimus",
  "decipio",
  "decor",
  "decretum",
  "decumbo",
  "dedecor",
  "dedico",
  "deduco",
  "defaeco",
  "defendo",
  "defero",
  "defessus",
  "defetiscor",
  "deficio",
  "defigo",
  "defleo",
  "defluo",
  "defungo",
  "degenero",
  "degero",
  "degusto",
  "deinde",
  "delectatio",
  "delego",
  "deleo",
  "delibero",
  "delicate",
  "delinquo",
  "deludo",
  "demens",
  "demergo",
  "demitto",
  "demo",
  "demonstro",
  "demoror",
  "demulceo",
  "demum",
  "denego",
  "denique",
  "dens",
  "denuncio",
  "denuo",
  "deorsum",
  "depereo",
  "depono",
  "depopulo",
  "deporto",
  "depraedor",
  "deprecator",
  "deprimo",
  "depromo",
  "depulso",
  "deputo",
  "derelinquo",
  "derideo",
  "deripio",
  "desidero",
  "desino",
  "desipio",
  "desolo",
  "desparatus",
  "despecto",
  "despirmatio",
  "infit",
  "inflammatio",
  "paens",
  "patior",
  "patria",
  "patrocinor",
  "patruus",
  "pauci",
  "paulatim",
  "pauper",
  "pax",
  "peccatus",
  "pecco",
  "pecto",
  "pectus",
  "pecunia",
  "pecus",
  "peior",
  "pel",
  "ocer",
  "socius",
  "sodalitas",
  "sol",
  "soleo",
  "solio",
  "solitudo",
  "solium",
  "sollers",
  "sollicito",
  "solum",
  "solus",
  "solutio",
  "solvo",
  "somniculosus",
  "somnus",
  "sonitus",
  "sono",
  "sophismata",
  "sopor",
  "sordeo",
  "sortitus",
  "spargo",
  "speciosus",
  "spectaculum",
  "speculum",
  "sperno",
  "spero",
  "spes",
  "spiculum",
  "spiritus",
  "spoliatio",
  "sponte",
  "stabilis",
  "statim",
  "statua",
  "stella",
  "stillicidium",
  "stipes",
  "stips",
  "sto",
  "strenuus",
  "strues",
  "studio",
  "stultus",
  "suadeo",
  "suasoria",
  "sub",
  "subito",
  "subiungo",
  "sublime",
  "subnecto",
  "subseco",
  "substantia",
  "subvenio",
  "succedo",
  "succurro",
  "sufficio",
  "suffoco",
  "suffragium",
  "suggero",
  "sui",
  "sulum",
  "sum",
  "summa",
  "summisse",
  "summopere",
  "sumo",
  "sumptus",
  "supellex",
  "super",
  "suppellex",
  "supplanto",
  "suppono",
  "supra",
  "surculus",
  "surgo",
  "sursum",
  "suscipio",
  "suspendo",
  "sustineo",
  "suus",
  "synagoga",
  "tabella",
  "tabernus",
  "tabesco",
  "tabgo",
  "tabula",
  "taceo",
  "tactus",
  "taedium",
  "talio",
  "talis",
  "talus",
  "tam",
  "tamdiu",
  "tamen",
  "tametsi",
  "tamisium",
  "tamquam",
  "tandem",
  "tantillus",
  "tantum",
  "tardus",
  "tego",
  "temeritas",
  "temperantia",
  "templum",
  "temptatio",
  "tempus",
  "tenax",
  "tendo",
  "teneo",
  "tener",
  "tenuis",
  "tenus",
  "tepesco",
  "tepidus",
  "ter",
  "terebro",
  "teres",
  "terga",
  "tergeo",
  "tergiversatio",
  "tergo",
  "tergum",
  "termes",
  "terminatio",
  "tero",
  "terra",
  "terreo",
  "territo",
  "terror",
  "tersus",
  "tertius",
  "testimonium",
  "texo",
  "textilis",
  "textor",
  "textus",
  "thalassinus",
  "theatrum",
  "theca",
  "thema",
  "theologus",
  "thermae",
  "thesaurus",
  "thesis",
  "thorax",
  "thymbra",
  "thymum",
  "tibi",
  "timidus",
  "timor",
  "titulus",
  "tolero",
  "tollo",
  "tondeo",
  "tonsor",
  "torqueo",
  "torrens",
  "tot",
  "totidem",
  "toties",
  "totus",
  "tracto",
  "trado",
  "traho",
  "trans",
  "tredecim",
  "tremo",
  "trepide",
  "tres",
  "tribuo",
  "tricesimus",
  "triduana",
  "triginta",
  "tripudio",
  "tristis",
  "triumphus",
  "trucido",
  "truculenter",
  "tubineus",
  "tui",
  "tum",
  "tumultus",
  "tunc",
  "turba",
  "turbo",
  "turpe",
  "turpis",
  "tutamen",
  "tutis",
  "tyrannus",
  "uberrime",
  "ubi",
  "ulciscor",
  "ullus",
  "ulterius",
  "ultio",
  "ultra",
  "umbra",
  "umerus",
  "umquam",
  "una",
  "unde",
  "undique",
  "universe",
  "unus",
  "urbanus",
  "urbs",
  "uredo",
  "usitas",
  "usque",
  "ustilo",
  "ustulo",
  "usus",
  "uter",
  "uterque",
  "utilis",
  "utique",
  "utor",
  "utpote",
  "utrimque",
  "utroque",
  "utrum",
  "uxor",
  "vaco",
  "vacuus",
  "vado",
  "vae",
  "valde",
  "valens",
  "valeo",
  "valetudo",
  "validus",
  "vallum",
  "vapulus",
  "varietas",
  "varius",
  "vehemens",
  "vel",
  "velociter",
  "velum",
  "velut",
  "venia",
  "venio",
  "ventito",
  "ventosus",
  "ventus",
  "venustas",
  "ver",
  "verbera",
  "verbum",
  "vere",
  "verecundia",
  "vereor",
  "vergo",
  "veritas",
  "vero",
  "versus",
  "verto",
  "verumtamen",
  "verus",
  "vesco",
  "vesica",
  "vesper",
  "vespillo",
  "vester",
  "vestigium",
  "vestrum",
  "vetus",
  "via",
  "vicinus",
  "vicissitudo",
  "victoria",
  "victus",
  "videlicet",
  "video",
  "viduata",
  "viduo",
  "vigilo",
  "vigor",
  "vilicus",
  "vilis",
  "vilitas",
  "villa",
  "vinco",
  "vinculum",
  "vindico",
  "vinitor",
  "vinum",
  "vir",
  "virga",
  "virgo",
  "viridis",
  "viriliter",
  "virtus",
  "vis",
  "viscus",
  "vita",
  "vitiosus",
  "vitium",
  "vito",
  "vivo",
  "vix",
  "vobis",
  "vociferor",
  "voco",
  "volaticus",
  "volo",
  "volubilis",
  "voluntarius",
  "volup",
  "volutabrum",
  "volva",
  "vomer",
  "vomica",
  "vomito",
  "vorago",
  "vorax",
  "voro",
  "vos",
  "votum",
  "voveo",
  "vox",
  "vulariter",
  "vulgaris",
  "vulgivagus",
  "vulgo",
  "vulgus",
  "vulnero",
  "vulnus",
  "vulpes",
  "vulticulus",
  "vultuosus",
  "xiphias"
];
const words = [
  "alias",
  "consequatur",
  "aut",
  "perferendis",
  "sit",
  "voluptatem",
  "accusantium",
  "doloremque",
  "aperiam",
  "eaque",
  "ipsa",
  "quae",
  "ab",
  "illo",
  "inventore",
  "veritatis",
  "et",
  "quasi",
  "architecto",
  "beatae",
  "vitae",
  "dicta",
  "sunt",
  "explicabo",
  "aspernatur",
  "aut",
  "odit",
  "aut",
  "fugit",
  "sed",
  "quia",
  "consequuntur",
  "magni",
  "dolores",
  "eos",
  "qui",
  "ratione",
  "voluptatem",
  "sequi",
  "nesciunt",
  "neque",
  "dolorem",
  "ipsum",
  "quia",
  "dolor",
  "sit",
  "amet",
  "consectetur",
  "adipisci",
  "velit",
  "sed",
  "quia",
  "non",
  "numquam",
  "eius",
  "modi",
  "tempora",
  "incidunt",
  "ut",
  "labore",
  "et",
  "dolore",
  "magnam",
  "aliquam",
  "quaerat",
  "voluptatem",
  "ut",
  "enim",
  "ad",
  "minima",
  "veniam",
  "quis",
  "nostrum",
  "exercitationem",
  "ullam",
  "corporis",
  "nemo",
  "enim",
  "ipsam",
  "voluptatem",
  "quia",
  "voluptas",
  "sit",
  "suscipit",
  "laboriosam",
  "nisi",
  "ut",
  "aliquid",
  "ex",
  "ea",
  "commodi",
  "consequatur",
  "quis",
  "autem",
  "vel",
  "eum",
  "iure",
  "reprehenderit",
  "qui",
  "in",
  "ea",
  "voluptate",
  "velit",
  "esse",
  "quam",
  "nihil",
  "molestiae",
  "et",
  "iusto",
  "odio",
  "dignissimos",
  "ducimus",
  "qui",
  "blanditiis",
  "praesentium",
  "laudantium",
  "totam",
  "rem",
  "voluptatum",
  "deleniti",
  "atque",
  "corrupti",
  "quos",
  "dolores",
  "et",
  "quas",
  "molestias",
  "excepturi",
  "sint",
  "occaecati",
  "cupiditate",
  "non",
  "provident",
  "sed",
  "ut",
  "perspiciatis",
  "unde",
  "omnis",
  "iste",
  "natus",
  "error",
  "similique",
  "sunt",
  "in",
  "culpa",
  "qui",
  "officia",
  "deserunt",
  "mollitia",
  "animi",
  "id",
  "est",
  "laborum",
  "et",
  "dolorum",
  "fuga",
  "et",
  "harum",
  "quidem",
  "rerum",
  "facilis",
  "est",
  "et",
  "expedita",
  "distinctio",
  "nam",
  "libero",
  "tempore",
  "cum",
  "soluta",
  "nobis",
  "est",
  "eligendi",
  "optio",
  "cumque",
  "nihil",
  "impedit",
  "quo",
  "porro",
  "quisquam",
  "est",
  "qui",
  "minus",
  "id",
  "quod",
  "maxime",
  "placeat",
  "facere",
  "possimus",
  "omnis",
  "voluptas",
  "assumenda",
  "est",
  "omnis",
  "dolor",
  "repellendus",
  "temporibus",
  "autem",
  "quibusdam",
  "et",
  "aut",
  "consequatur",
  "vel",
  "illum",
  "qui",
  "dolorem",
  "eum",
  "fugiat",
  "quo",
  "voluptas",
  "nulla",
  "pariatur",
  "at",
  "vero",
  "eos",
  "et",
  "accusamus",
  "officiis",
  "debitis",
  "aut",
  "rerum",
  "necessitatibus",
  "saepe",
  "eveniet",
  "ut",
  "et",
  "voluptates",
  "repudiandae",
  "sint",
  "et",
  "molestiae",
  "non",
  "recusandae",
  "itaque",
  "earum",
  "rerum",
  "hic",
  "tenetur",
  "a",
  "sapiente",
  "delectus",
  "ut",
  "aut",
  "reiciendis",
  "voluptatibus",
  "maiores",
  "doloribus",
  "asperiores",
  "repellat"
];
const lorem = {
  supplemental,
  words
};
const genre = [
  "Rock",
  "Metal",
  "Pop",
  "Electronic",
  "Folk",
  "World",
  "Country",
  "Jazz",
  "Funk",
  "Soul",
  "Hip Hop",
  "Classical",
  "Latin",
  "Reggae",
  "Stage And Screen",
  "Blues",
  "Non Music",
  "Rap"
];
const song_name = [
  "White Christmas",
  "Hey Jude",
  "Every Breath You Take",
  "Mack the Knife",
  "Rock Around the Clock",
  "I Want to Hold Your Hand",
  "(I Can't Get No) Satisfaction",
  "The Twist",
  "(Everything I Do) I Do it For You",
  "Bridge Over Troubled Water",
  "When Doves Cry",
  "Call Me",
  "Bette Davis Eyes",
  "I Will Always Love You",
  "Over the Rainbow",
  "American Pie",
  "Flashdance. What a Feeling",
  "The Way We Were",
  "I Heard it Through the Grapevine",
  "You've Lost That Lovin' Feelin'",
  "Nothing Compares 2 U",
  "Endless Love",
  "Yeah!",
  "Let's Get it On",
  "That's What Friends Are For",
  "You Light Up My Life",
  "(Sittin' On) the Dock of the Bay",
  "Joy to the World",
  "Heartbreak Hotel",
  "Theme From 'A Summer Place'",
  "Aquarius/Let The Sunshine In",
  "I Will Survive",
  "It's Too Late",
  "Respect",
  "Sugar Sugar",
  "Stayin' Alive",
  "Maggie May",
  "My Heart Will Go On",
  "Eye of the Tiger",
  "End of the Road",
  "Another One Bites the Dust",
  "Billie Jean",
  "Let's Stay Together",
  "Battle of New Orleans",
  "Oh",
  "Hound Dog",
  "I Love Rock 'n' Roll",
  "Smooth",
  "Good Vibrations",
  "Physical",
  "Light My Fire",
  "Low",
  "Hey Ya!",
  "Let it Be",
  "Don't Be Cruel",
  "Hotel California",
  "We Belong Together",
  "Le Freak",
  "Raindrops Keep Falling On My Head",
  "How High the Moon",
  "My Girl",
  "I Can't Stop Loving You",
  "Killing Me Softly With His Song",
  "Mona Lisa",
  "In the Mood",
  "She Loves You",
  "The Letter",
  "Mister Sandman",
  "Careless Whisper",
  "What's Love Got to Do With It?",
  "I'm a Believer",
  "Wooly Bully",
  "Theme From 'Shaft'",
  "Hot Stuff",
  "Centerfold",
  "Honky Tonk Woman",
  "I'll Be There",
  "Gangsta's Paradise",
  "Yesterday",
  "My Sharona",
  "Tennessee Waltz",
  "Reach Out (I'll Be There)",
  "California Dreamin'",
  "Jailhouse Rock",
  "Irreplaceable",
  "Dancing in the Street",
  "Rolling In The Deep",
  "Tie a Yellow Ribbon 'round the Old Oak Tree",
  "Stand By Me",
  "Sentimental Journey",
  "The First Time Ever I Saw Your Face",
  "Louie Louie",
  "Another Brick in the Wall (part 2)",
  "(Just Like) Starting Over",
  "Night Fever",
  "To Sir",
  "You're So Vain",
  "Be My Baby",
  "Celebration",
  "(They Long to Be) Close to You",
  "Begin the Beguine",
  "I Still Haven't Found What I'm Looking For",
  "I Want You Back",
  "Arthur's Theme (Best That You Can Do)",
  "Boulevard of Broken Dreams",
  "With Or Without You",
  "Tonight's the Night (Gonna Be Alright)",
  "Are You Lonesome Tonight?",
  "Upside Down",
  "Dancing Queen",
  "Sweet Child O' Mine",
  "Where Did Our Love Go",
  "Unchained Melody",
  "Rudolph",
  "Take My Breath Away",
  "I'll Make Love to You",
  "Love Will Keep Us Together",
  "When a Man Loves a Woman",
  "Walk Like an Egyptian",
  "Crazy in Love",
  "Strangers in the Night",
  "You Belong to Me",
  "In Da Club",
  "Say You",
  "We Are the World",
  "Johnny B Goode",
  "Love Theme From 'A Star is Born' (Evergreen)",
  "Shadow Dancing",
  "Superstition",
  "Beat It",
  "Night & Day",
  "Waterfalls",
  "House of the Rising Sun",
  "Paper Doll",
  "Downtown",
  "I Can't Help Myself (Sugar Pie",
  "Kiss From a Rose",
  "Believe",
  "Ballad of the Green Berets",
  "Proud Mary",
  "Too Young",
  "Umbrella",
  "Swanee",
  "Need You Tonight",
  "Like a Rolling Stone",
  "Lady",
  "One Sweet Day",
  "Lean On Me",
  "Tik-Toc",
  "Monday Monday",
  "What'd I Say",
  "How You Remind Me",
  "Silly Love Songs",
  "My Guy",
  "Macarena",
  "Goodnight",
  "Just My Imagination (Running Away With Me)",
  "The Sounds of Silence",
  "Imagine",
  "Me & Bobby McGee",
  "Near You",
  "What's Going On?",
  "Suspicious Minds",
  "Ode To Billie Joe",
  "Wind Beneath My Wings",
  "The Boy is Mine",
  "Mr Tambourine Man",
  "Faith",
  "Green Onions",
  "Mrs Robinson",
  "How Deep is Your Love?",
  "Hey There",
  "Heart of Glass",
  "Pennies From Heaven",
  "Like a Virgin",
  "Midnight Train to Georgia",
  "Help!",
  "Tossing & Turning",
  "The Sign",
  "Born to Be Wild",
  "Layla",
  "I Just Wanna Be Your Everything",
  "War",
  "96 Tears",
  "I Get Around",
  "Because You Loved Me",
  "Summer in the City",
  "Get Back",
  "Secret Love",
  "9 to 5",
  "(Ghost) Riders in the Sky",
  "The Loco-Motion",
  "Play That Funky Music",
  "Bohemian Rhapsody",
  "Little Things Mean a Lot",
  "Cry",
  "All Shook Up",
  "Up Where We Belong",
  "Sledgehammer",
  "Fire & Rain",
  "Stop! in the Name of Love",
  "Sweet Home Alabama",
  "Another Day in Paradise",
  "Bleeding Love",
  "Lady Marmalade (Voulez-Vous Coucher Aver Moi Ce Soir?)",
  "Whispering",
  "Vogue",
  "Under the Bridge",
  "Sixteen Tons",
  "Sugar Shack",
  "Baby Love",
  "What a Fool Believes",
  "Lose Yourself",
  "Hello Dolly",
  "Brown Eyed Girl",
  "Without You",
  "Build Me Up Buttercup",
  "We Found Love",
  "Tears in Heaven",
  "Family Affair",
  "All I Wanna Do",
  "Soul Man",
  "Tequila",
  "Rock With You",
  "Livin' La Vida Loca",
  "Best of My Love",
  "Runaway",
  "Alone Again (Naturally)",
  "Can't Help Falling in Love",
  "My Sweet Lord",
  "Runaround Sue",
  "Swinging On a Star",
  "Gold Digger",
  "Happy Together",
  "Losing My Religion",
  "Heart of Gold",
  "Stardust",
  "Will You Love Me Tomorrow",
  "You Are the Sunshine of My Life",
  "You Were Meant for Me",
  "Take On Me",
  "Hollaback Girl",
  "God Bless America",
  "I Swear",
  "Sunshine of Your Love",
  "Firework",
  "Groovin'",
  "Smells Like Teen Spirit",
  "Big Girls Don't Cry",
  "Jack & Diane",
  "Addicted to Love",
  "The Last Dance",
  "Georgia On My Mind",
  "Money For Nothing",
  "Jump",
  "Vaya Con Dios (may God Be With You)",
  "You'll Never Know",
  "That'll Be the Day",
  "Girls Just Wanna Have Fun",
  "Wheel of Fortune",
  "When You Wish Upon a Star",
  "Don't Fence Me In",
  "Turn! Turn! Turn! (To Everything There is a Season)",
  "Volare",
  "Sweet Dreams (Are Made of This)",
  "Whole Lotta Love",
  "You've Got a Friend",
  "Penny Lane",
  "People Got to Be Free",
  "Nature Boy",
  "Sexyback",
  "Crying",
  "Single Ladies (Put A Ring On It)",
  "Bad Girls",
  "Too Close",
  "I Got You Babe",
  "We've Only Just Begun",
  "Sh-Boom (Life Could Be a Dream)",
  "Shining Star",
  "Kansas City",
  "Like a Prayer",
  "Cheek to Cheek",
  "Papa Was a Rolling Stone",
  "Promiscuous",
  "Love Shack",
  "Funkytown",
  "Crazy",
  "Philadelphia Freedom",
  "Temperature",
  "Somebody That I Used to Know",
  "All I Have to Do is Dream",
  "Jessie's Girl",
  "Rhinestone Cowboy",
  "Blue Suede Shoes",
  "Ebony & Ivory",
  "I'll Never Smile Again",
  "Keep On Loving You",
  "Since U Been Gone",
  "The Way You Look Tonight",
  "Crazy Little Thing Called Love",
  "The Great Pretender",
  "Brown Sugar",
  "Que sera sera (Whatever will be will be)",
  "No One",
  "Bad Day",
  "Boom Boom Pow",
  "Party Rock Anthem",
  "Because of You",
  "Chattanooga Choo Choo",
  "A Whiter Shade of Pale",
  "Love Me Tender",
  "Higher Love",
  "Footloose",
  "Blurred Lines",
  "I Just Called to Say I Love You",
  "Come Together",
  "It's Now Or Never",
  "Under the Boardwalk",
  "Don't You Want Me",
  "You Can't Hurry Love",
  "Fame",
  "Fallin'",
  "Poker Face",
  "Bad Romance",
  "Ruby Tuesday",
  "All Night Long (All Night)",
  "Baby Got Back",
  "Whole Lotta Shakin' Goin' On",
  "Frenesi",
  "December 1963 (Oh What a Night)",
  "Bad Moon Rising",
  "Abracadabra",
  "I Gotta Feeling",
  "The Song From Moulin Rouge (Where Is Your Heart)",
  "Waiting For a Girl Like You",
  "Everybody Loves Somebody",
  "I Can't Go For That (No Can Do)",
  "Buttons & Bows",
  "It's All in the Game",
  "Love Train",
  "Dance to the Music",
  "Candle in the Wind '97",
  "Honey",
  "Kiss",
  "I'll Take You There",
  "Paint it Black",
  "Band of Gold",
  "Just the Way You Are",
  "Spirit in the Sky",
  "Vision of Love",
  "Hips don't lie",
  "Till The End of Time",
  "Duke of Earl",
  "YMCA",
  "Oh My Papa (O Mein Papa)",
  "Pistol Packin' Mama",
  "Gonna Make You Sweat (Everybody Dance Now)",
  "Dilemma",
  "I Need You Now",
  "Wanted",
  "Jumpin' Jack Flash",
  "Against All Odds (Take a Look At Me Now)",
  "Tom Dooley",
  "Goodbye Yellow Brick Road",
  "Rhapsody in Blue",
  "Bennie & the Jets",
  "Call Me Maybe",
  "You Really Got Me",
  "God Bless the Child",
  "I'm Sorry",
  "Bad",
  "I Can't Get Next to You",
  "The Power of Love",
  "Dreamlover",
  "Only The Lonely (Know The Way I Feel)",
  "We Are Family",
  "At Last",
  "Brand New Key",
  "I've Heard That Song Before",
  "Stay (I Missed You)",
  "Do Ya Think I'm Sexy?",
  "Tutti Frutti",
  "This Ole House",
  "Please Mr Postman",
  "Can't Help Falling in Love",
  "Good Times",
  "Something",
  "(I've Had) the Time of My Life",
  "I Don't Want to Miss a Thing",
  "Down Hearted Blues",
  "Rag Doll",
  "Blueberry Hill",
  "Ain't No Sunshine",
  "Wild Thing",
  "Blaze of Glory",
  "Crazy",
  "Ray of Light",
  "The Hustle",
  "Grenade",
  "Cathy's Clown",
  "Minnie the Moocher",
  "Love Is Blue (L'Amour Est Bleu)",
  "Iris",
  "The Boys of Summer",
  "The Tide is High",
  "She Drives Me Crazy",
  "Fame",
  "Stardust",
  "Save the Best For Last",
  "These Boots Are Made For Walking",
  "I Feel Love",
  "A Woman in Love",
  "We Can Work it Out",
  "The Reason",
  "Locked Out Of Heaven",
  "Do That to Me One More Time",
  "That's the Way Love Goes",
  "A Hard Day's Night",
  "I Believe I Can Fly",
  "Karma Chameleon",
  "One O'Clock Jump",
  "Mule Train",
  "Car Wash",
  "Rapture",
  "Creep",
  "Streets of Philadelphia",
  "West End Girls",
  "Leader of the Pack",
  "T For Texas (Blue Yodel No 1)",
  "Mama Told Me Not to Come",
  "Just Dance",
  "Mercy Mercy Me (The Ecology)",
  "Livin' On a Prayer",
  "Good Lovin'",
  "50 Ways to Leave Your Lover",
  "Stronger",
  "I Can See Clearly Now",
  "We Are the Champions",
  "(I've Got a Gal In) Kalamazoo",
  "No Scrubs",
  "Big Girls Don't Cry",
  "How Do You Mend a Broken Heart",
  "I Got You (I Feel Good)",
  "Don't Let the Stars Get in Your Eyes",
  "The Girl From Ipanema",
  "(Sexual) Healing",
  "Tears of a Clown",
  "We Will Rock You",
  "Hold On",
  "Bye Bye Love",
  "Chapel of Love",
  "White Rabbit",
  "Rock the Boat",
  "The Gypsy",
  "Take The 'A' Train",
  "Crimson & Clover",
  "Crocodile Rock",
  "Make Love to Me",
  "Nothing's Gonna Stop Us Now",
  "Say Say Say",
  "The Christmas Song (Chestnuts Roasting On An Open Fire)",
  "Un-Break My Heart",
  "Cherish",
  "I'll Be Missing You",
  "Drops of Jupiter (Tell Me)",
  "There goes my baby",
  "You Send Me",
  "If (They Made Me a King)",
  "The Prisoner's Song",
  "ABC",
  "Do Wah Diddy Diddy",
  "He's So Fine",
  "A Boy Named Sue",
  "Roll Over Beethoven",
  "Sweet Georgia Brown",
  "Earth Angel",
  "Rehab",
  "(You Keep Me) Hangin' On",
  "This Diamond Ring",
  "Be My Love",
  "Rush Rush",
  "You're Beautiful",
  "Roll With It",
  "Moonlight Serenade",
  "Unbelievable",
  "Peg o' My Heart",
  "This Land is Your Land",
  "Stranger On the Shore",
  "Rum & Coca-Cola",
  "Hit the Road",
  "Without Me",
  "Crazy For You",
  "I Want to Know What Love Is",
  "Bye Bye",
  "Down Under",
  "At the Hop",
  "One Bad Apple",
  "Kiss & Say Goodbye",
  "For What It's Worth (Stop",
  "The Long & Winding Road",
  "Baby One More Time",
  "Stairway to Heaven",
  "How Do I Live?",
  "Hello",
  "Truly Madly Deeply",
  "Great Balls of Fire",
  "King of the Road",
  "I Wanna Dance With Somebody (Who Loves Me)",
  "Reunited",
  "Help Me",
  "Rags to Riches",
  "(It's No) Sin",
  "Say My Name",
  "Nobody Does it Better",
  "Paperback Writer",
  "Don't Worry Be Happy",
  "I Fall to Pieces",
  "Body & Soul",
  "You're Still the One",
  "Stormy Weather (Keeps Rainin' All the Time)",
  "Horse With No Name",
  "American Woman",
  "Chattanoogie Shoe-Shine Boy",
  "Pick Up the Pieces",
  "Everybody Wants to Rule the World",
  "Blue Tango",
  "Hurt So Good",
  "Apologize",
  "Let's Dance",
  "(You're My) Soul & Inspiration",
  "I Only Have Eyes For You",
  "Wichita Lineman",
  "Hanging by a Moment",
  "Spinning Wheel",
  "Look Away",
  "Ironic",
  "Don't Stop 'Til You Get Enough",
  "Empire State Of Mind",
  "Do You Love Me?",
  "Jive Talkin'",
  "You're the One That I Want",
  "Sweet Soul Music",
  "Hey There Delilah",
  "A Whole New World (Aladdin's Theme)",
  "Somethin' Stupid",
  "Knock Three Times",
  "Mickey",
  "The Wanderer",
  "Dancing in the Dark",
  "It's Still Rock 'n' Roll to Me",
  "Boogie Oogie Oogie",
  "Can You Feel the Love Tonight",
  "Harper Valley PTA",
  "Seasons in the Sun",
  "Come On-a My House",
  "Viva La Vida",
  "Walk On By",
  "Family Affair",
  "Drop it Like It's Hot",
  "Private Eyes",
  "Maniac",
  "All My Lovin' (You're Never Gonna Get It)",
  "Take a Bow",
  "Ring of Fire",
  "Save the Last Dance For Me",
  "Make it With You",
  "Don't Speak",
  "I Shot the Sheriff",
  "Say It Right",
  "Sing",
  "Twist & Shout",
  "Twist & Shout",
  "Walk This Way",
  "A-Tisket A-Tasket",
  "Let Me Love You",
  "I Can Dream",
  "Toxic",
  "The Joker",
  "Hero",
  "In the Year 2525 (Exordium & Terminus)",
  "Your Song",
  "Oh Happy Day",
  "Grease",
  "Love In This Club",
  "Angie",
  "How Much is That Doggy in the Window?",
  "Daydream Believer",
  "Whip It",
  "Boogie Woogie Bugle Boy",
  "Down",
  "Hanky Panky",
  "Total Eclipse of the Heart",
  "Cat's in the Cradle",
  "Strange Fruit",
  "Lady Marmalade (Voulez-Vous Coucher Aver Moi Ce Soir?)",
  "Breathe",
  "On My Own",
  "Dizzy",
  "Ticket to Ride",
  "We Got The Beat",
  "On the Atchison",
  "Always On My Mind",
  "Unforgettable",
  "In the End",
  "Just the Way You Are",
  "Music",
  "Can't Buy Me Love",
  "Chain of Fools",
  "Won't Get Fooled Again",
  "Happy Days Are Here Again",
  "Third Man Theme",
  "Your Cheatin' Heart",
  "Thriller",
  "Venus",
  "Time After Time",
  "That Lucky Old Sun (Just Rolls Around Heaven All Day)",
  "E.T.",
  "Three Coins in the Fountain",
  "Touch Me",
  "You Ain't Seen Nothin' Yet",
  "Gives You Hell",
  "Knock On Wood",
  "One of These Nights",
  "Again",
  "Doo Wop (That Thing)",
  "Whoomp! (There it Is)",
  "Magic",
  "I'm Walking Behind You",
  "We Didn't Start the Fire",
  "Lola",
  "Ghostbusters",
  "Winchester Cathedral",
  "Greatest Love of All",
  "My Love",
  "Wannabe",
  "Miss You",
  "I Feel Fine",
  "Baby Baby",
  "TSOP (The Sound of Philadelphia)",
  "Loving You",
  "This Guy's in Love With You",
  "Till I Waltz Again With You",
  "Why Do Fools Fall in Love?",
  "Nights in White Satin",
  "That's the Way (I Like It)",
  "My Prayer",
  "(Put Another Nickel In) Music! Music! Music!",
  "Colors of the Wind",
  "Morning Train (Nine to Five)",
  "I Went to Your Wedding",
  "Kiss Me",
  "Gypsies",
  "Cracklin' Rosie",
  "Maybellene",
  "Born in the USA",
  "Here Without You",
  "Mony Mony",
  "Mmmbop",
  "You Always Hurt the One You Love",
  "Eight Days a Week",
  "What Goes Around Comes Around",
  "Kung Fu Fighting",
  "Fantasy",
  "Sir Duke",
  "Ain't Misbehavin'",
  "Need You Now",
  "Last Train to Clarksville",
  "Yakety Yak",
  "I'll be seeing you",
  "Hard to Say I'm Sorry",
  "It's My Party",
  "Love to Love You Baby",
  "Miss You Much",
  "Born to Run",
  "Instant Karma",
  "The Rose",
  "Purple Rain",
  "One",
  "Groove is in the Heart",
  "Gimme Some Lovin'",
  "Beautiful Day",
  "Escape (The Pina Colada Song)",
  "Use Somebody",
  "Fortunate Son",
  "Afternoon Delight",
  "Love's Theme",
  "Sailing",
  "Cherry Pink & Apple Blossom White",
  "Georgy Girl",
  "How to Save a Life",
  "I Walk the Line",
  "All You Need is Love",
  "U Can't Touch This",
  "All Out of Love",
  "Where is the Love?",
  "Revolution",
  "The Love You Save",
  "Black Or White",
  "This Used to Be My Playground",
  "Living For the City",
  "School's Out",
  "Disturbia",
  "Riders On the Storm",
  "Some Enchanted Evening",
  "Weak",
  "Maneater",
  "More Than Words",
  "Time of the Season",
  "Mrs Brown You've Got a Lovely Daughter",
  "If You Leave Me Now",
  "Can't Get Enough of Your Love",
  "Na Na Hey Hey (Kiss Him Goodbye)",
  "Mr Brightside",
  "Black Velvet",
  "I'm Yours",
  "My Blue Heaven",
  "It Had to Be You",
  "Tha Crossroads",
  "Ac-cent-tchu-ate the Positive",
  "Everyday People",
  "We Are Young",
  "Take Me Home",
  "Smoke! Smoke! Smoke! (That Cigarette)",
  "In the Summertime",
  "The Tracks of My Tears",
  "Fly Robin Fly",
  "Love is a Many Splendoured Thing",
  "Another Night",
  "Long Tall Sally",
  "You Sexy Thing",
  "The Morning After",
  "The Loco-Motion",
  "Get Off of My Cloud",
  "Roses Are Red",
  "Thank You (Falettinme be Mice Elf Again)",
  "Slow Poke",
  "You Belong With Me",
  "Stormy Weather (Keeps Rainin' All the Time)",
  "Ain't No Mountain High Enough",
  "Auf Wiederseh'n Sweetheart",
  "Beauty & the Beast",
  "St Louis Blues",
  "Peggy Sue",
  "U Got it Bad",
  "Sweet Caroline (Good Times Never Seemed So Good)",
  "Wedding Bell Blues",
  "Freebird",
  "Jump",
  "Wipe Out",
  "California Girls",
  "Being With You",
  "Makin' Whoopee",
  "My Love",
  "Shop Around",
  "Smoke On the Water",
  "Hungry Heart",
  "That's Amore",
  "My Life",
  "Brandy (You're A Fine Girl)",
  "Walk Don't Run",
  "Surfin' USA",
  "Ball of Confusion (That's What the World is Today)",
  "Sunshine Superman",
  "Frankenstein",
  "Kiss You All Over",
  "Wishing Well",
  "Piano Man",
  "Ben",
  "In the Ghetto",
  "Hang On Sloopy",
  "Singing The Blues",
  "Cry Like a Baby",
  "I Honestly Love You",
  "Brother",
  "Lookin' Out My Back Door",
  "Candy Man",
  "Burn",
  "Stagger Lee",
  "Moonlight Cocktail",
  "Coming Up",
  "Pop Muzik",
  "As Time Goes By",
  "My Eyes Adored You",
  "Strawberry Fields Forever",
  "Some of These Days",
  "I Think I Love You",
  "Judy in Disguise (With Glasses)",
  "All Along the Watchtower",
  "A Thousand Miles",
  "Fast Car",
  "Red Red Wine",
  "Live & Let Die",
  "Come On Eileen",
  "Right Back Where We Started From",
  "Brother Louie",
  "Ol' Man River",
  "Band On the Run",
  "Rich Girl",
  "Green River",
  "Got to Give it Up",
  "Behind Closed Doors",
  "Don't Go Breaking My Heart",
  "I'm Looking Over a Four Leaf Clover",
  "Mr Big Stuff",
  "Tiger Rag",
  "Kryptonite",
  "Hey Paula",
  "Go Your Own Way",
  "Big Bad John",
  "Wake Me Up Before You Go Go",
  "Tangerine",
  "Wayward Wind",
  "Disco Lady",
  "Spanish Harlem",
  "Wicked Game",
  "Rosanna",
  "Papa Don't Preach",
  "Somebody to Love",
  "Kokomo",
  "Manana (Is Soon Enough For Me)",
  "Puttin' on the Ritz",
  "One More Try",
  "I'll Walk Alone",
  "Shout",
  "Woman",
  "Ballerina",
  "We Built This City",
  "19th Nervous Breakdown",
  "Working My Way Back to You",
  "Superstar",
  "Foolish Games",
  "Get Down Tonight",
  "On Bended Knee",
  "Magic Carpet Ride",
  "Only You (And You Alone)",
  "A String of Pearls",
  "A Tree in the Meadow",
  "So Much in Love",
  "Every Little Thing She Does is Magic",
  "La Bamba",
  "Tighten Up",
  "Three Times a Lady",
  "Airplanes",
  "Wild Thing",
  "Don't Leave Me This Way",
  "Rock the Casbah",
  "Feel Good Inc",
  "Love Me Do",
  "Kiss On My List",
  "Give Me Everything",
  "Have You Ever Really Loved a Woman?",
  "Love Letters in the Sand",
  "Ring My Bell",
  "Love Child",
  "I Feel For You",
  "Bye",
  "(Let Me Be Your) Teddy Bear",
  "Soldier Boy",
  "Papa's Got a Brand New Bag",
  "Love Hangover",
  "Venus",
  "Spill the Wine",
  "Royals",
  "April Showers",
  "Don't You (Forget About Me)",
  "Travellin' Man",
  "The Thing",
  "You Make Me Feel Brand New",
  "The Glow-Worm",
  "You Don't Bring Me Flowers",
  "Summertime Blues",
  "Straight Up",
  "Sunday",
  "Wake Up Little Susie",
  "She's a Lady",
  "Over There",
  "Little Darlin'",
  "Rag Mop",
  "Shake Down",
  "Up Around the Bend",
  "Harbour Lights",
  "Chances Are",
  "Mood Indigo",
  "Pony Time",
  "After You've Gone",
  "I Wanna Love You",
  "Da Doo Ron Ron (When He Walked Me Home)",
  "If You Don't Know Me By Now",
  "Green Tambourine",
  "My Man",
  "If I Didn't Care",
  "St George & the Dragonette",
  "Why Don't You Believe Me?",
  "How Will I Know",
  "Disco Duck",
  "Lonely Boy",
  "Never Gonna Give You Up",
  "Before The Next Teardrop Falls",
  "Running Scared",
  "Let's Hear it For the Boy",
  "Sleep Walk",
  "Walk On the Wild Side",
  "Memories Are Made of This",
  "Open Arms",
  "Stuck On You",
  "Personality",
  "Feel Like Making Love",
  "Stars & Stripes Forever",
  "Besame Mucho",
  "Let Me Call You Sweetheart",
  "La Bamba",
  "Indian Reservation (The Lament Of The Cherokee Reservation Indian)",
  "Cars",
  "You Make Me Feel Like Dancing",
  "Whatcha Say",
  "Me & Mrs Jones",
  "Bitter Sweet Symphony",
  "Uncle Albert (Admiral Halsey)",
  "More Than a Feeling",
  "My Boyfriend's Back",
  "People",
  "He'll Have to Go",
  "I Can Help",
  "The Streak",
  "Dreams",
  "Hair",
  "Cold",
  "Nothin' on You",
  "The End of the World",
  "Caldonia Boogie (What Makes Your Big Head So Hard)",
  "I Kissed A Girl",
  "Incense & Peppermints",
  "12th Street Rag",
  "West End Blues",
  "The Way You Move",
  "Smoke Gets in Your Eyes",
  "Want Ads",
  "Long Cool Woman in a Black Dress",
  "Hey Baby",
  "(Your Love Keeps Lifting Me) Higher & Higher",
  "He's a Rebel",
  "Alone",
  "Thrift Shop",
  "Don't Let the Sun Go Down On Me",
  "The Sweet Escape",
  "Return to Sender",
  "Here in My Heart",
  "Wabash Cannonball",
  "Ain't That a Shame",
  "Travellin' Band",
  "I'm Your Boogie Man",
  "I Write the Songs",
  "This Love",
  "Lights",
  "Will It Go Round In Circles",
  "Purple Haze",
  "Rock Your Baby",
  "Delicado",
  "Tammy",
  "Check On It",
  "Breaking Up is Hard to Do",
  "1999",
  "Prisoner of Love",
  "Wild Wild West",
  "Walk Like a Man",
  "Ain't No Mountain High Enough",
  "I Will Follow Him",
  "Glamorous",
  "Yellow Rose of Texas",
  "That Old Black Magic",
  "I'm So Lonesome I Could Cry",
  "Up Up & Away",
  "Baby Come Back",
  "Let it Snow! Let it Snow! Let it Snow!",
  "Pon De Replay",
  "Because I Love You (The Postman Song)",
  "Sleepy Lagoon",
  "Baker Street",
  "Dardanella",
  "You Don't Have to Be a Star (To Be in My Show)",
  "Leaving",
  "Glory of Love",
  "Theme From 'Greatest American Hero' (Believe It Or Not)",
  "Shake You Down",
  "Ole Buttermilk Sky",
  "I Can't Get Started",
  "Freak Me",
  "Hot Child In The City",
  "Man in the Mirror",
  "Queen of Hearts",
  "Let's Groove",
  "Change the World",
  "You make Me Wanna",
  "Someday",
  "Eve of Destruction",
  "One of Us",
  "Honky Tonk",
  "Be Bop a Lula",
  "Two Hearts",
  "Paper Planes"
];
const music = {
  genre,
  song_name
};
const binary_gender = ["Female", "Male"];
const female_first_name = [
  "Mary",
  "Patricia",
  "Linda",
  "Barbara",
  "Elizabeth",
  "Jennifer",
  "Maria",
  "Susan",
  "Margaret",
  "Dorothy",
  "Lisa",
  "Nancy",
  "Karen",
  "Betty",
  "Helen",
  "Sandra",
  "Donna",
  "Carol",
  "Ruth",
  "Sharon",
  "Michelle",
  "Laura",
  "Sarah",
  "Kimberly",
  "Deborah",
  "Jessica",
  "Shirley",
  "Cynthia",
  "Angela",
  "Melissa",
  "Brenda",
  "Amy",
  "Anna",
  "Rebecca",
  "Virginia",
  "Kathleen",
  "Pamela",
  "Martha",
  "Debra",
  "Amanda",
  "Stephanie",
  "Carolyn",
  "Christine",
  "Marie",
  "Janet",
  "Catherine",
  "Frances",
  "Ann",
  "Joyce",
  "Diane",
  "Alice",
  "Julie",
  "Heather",
  "Teresa",
  "Doris",
  "Gloria",
  "Evelyn",
  "Jean",
  "Cheryl",
  "Mildred",
  "Katherine",
  "Joan",
  "Ashley",
  "Judith",
  "Rose",
  "Janice",
  "Kelly",
  "Nicole",
  "Judy",
  "Christina",
  "Kathy",
  "Theresa",
  "Beverly",
  "Denise",
  "Tammy",
  "Irene",
  "Jane",
  "Lori",
  "Rachel",
  "Marilyn",
  "Andrea",
  "Kathryn",
  "Louise",
  "Sara",
  "Anne",
  "Jacqueline",
  "Wanda",
  "Bonnie",
  "Julia",
  "Ruby",
  "Lois",
  "Tina",
  "Phyllis",
  "Norma",
  "Paula",
  "Diana",
  "Annie",
  "Lillian",
  "Emily",
  "Robin",
  "Peggy",
  "Crystal",
  "Gladys",
  "Rita",
  "Dawn",
  "Connie",
  "Florence",
  "Tracy",
  "Edna",
  "Tiffany",
  "Carmen",
  "Rosa",
  "Cindy",
  "Grace",
  "Wendy",
  "Victoria",
  "Edith",
  "Kim",
  "Sherry",
  "Sylvia",
  "Josephine",
  "Thelma",
  "Shannon",
  "Sheila",
  "Ethel",
  "Ellen",
  "Elaine",
  "Marjorie",
  "Carrie",
  "Charlotte",
  "Monica",
  "Esther",
  "Pauline",
  "Emma",
  "Juanita",
  "Anita",
  "Rhonda",
  "Hazel",
  "Amber",
  "Eva",
  "Debbie",
  "April",
  "Leslie",
  "Clara",
  "Lucille",
  "Jamie",
  "Joanne",
  "Eleanor",
  "Valerie",
  "Danielle",
  "Megan",
  "Alicia",
  "Suzanne",
  "Michele",
  "Gail",
  "Bertha",
  "Darlene",
  "Veronica",
  "Jill",
  "Erin",
  "Geraldine",
  "Lauren",
  "Cathy",
  "Joann",
  "Lorraine",
  "Lynn",
  "Sally",
  "Regina",
  "Erica",
  "Beatrice",
  "Dolores",
  "Bernice",
  "Audrey",
  "Yvonne",
  "Annette",
  "June",
  "Samantha",
  "Marion",
  "Dana",
  "Stacy",
  "Ana",
  "Renee",
  "Ida",
  "Vivian",
  "Roberta",
  "Holly",
  "Brittany",
  "Melanie",
  "Loretta",
  "Yolanda",
  "Jeanette",
  "Laurie",
  "Katie",
  "Kristen",
  "Vanessa",
  "Alma",
  "Sue",
  "Elsie",
  "Beth",
  "Jeanne",
  "Vicki",
  "Carla",
  "Tara",
  "Rosemary",
  "Eileen",
  "Terri",
  "Gertrude",
  "Lucy",
  "Tonya",
  "Ella",
  "Stacey",
  "Wilma",
  "Gina",
  "Kristin",
  "Jessie",
  "Natalie",
  "Agnes",
  "Vera",
  "Willie",
  "Charlene",
  "Bessie",
  "Delores",
  "Melinda",
  "Pearl",
  "Arlene",
  "Maureen",
  "Colleen",
  "Allison",
  "Tamara",
  "Joy",
  "Georgia",
  "Constance",
  "Lillie",
  "Claudia",
  "Jackie",
  "Marcia",
  "Tanya",
  "Nellie",
  "Minnie",
  "Marlene",
  "Heidi",
  "Glenda",
  "Lydia",
  "Viola",
  "Courtney",
  "Marian",
  "Stella",
  "Caroline",
  "Dora",
  "Jo",
  "Vickie",
  "Mattie",
  "Terry",
  "Maxine",
  "Irma",
  "Mabel",
  "Marsha",
  "Myrtle",
  "Lena",
  "Christy",
  "Deanna",
  "Patsy",
  "Hilda",
  "Gwendolyn",
  "Jennie",
  "Nora",
  "Margie",
  "Nina",
  "Cassandra",
  "Leah",
  "Penny",
  "Kay",
  "Priscilla",
  "Naomi",
  "Carole",
  "Brandy",
  "Olga",
  "Billie",
  "Dianne",
  "Tracey",
  "Leona",
  "Jenny",
  "Felicia",
  "Sonia",
  "Miriam",
  "Velma",
  "Becky",
  "Bobbie",
  "Violet",
  "Kristina",
  "Toni",
  "Misty",
  "Mae",
  "Shelly",
  "Daisy",
  "Ramona",
  "Sherri",
  "Erika",
  "Katrina",
  "Claire",
  "Lindsey",
  "Lindsay",
  "Geneva",
  "Guadalupe",
  "Belinda",
  "Margarita",
  "Sheryl",
  "Cora",
  "Faye",
  "Ada",
  "Natasha",
  "Sabrina",
  "Isabel",
  "Marguerite",
  "Hattie",
  "Harriet",
  "Molly",
  "Cecilia",
  "Kristi",
  "Brandi",
  "Blanche",
  "Sandy",
  "Rosie",
  "Joanna",
  "Iris",
  "Eunice",
  "Angie",
  "Inez",
  "Lynda",
  "Madeline",
  "Amelia",
  "Alberta",
  "Genevieve",
  "Monique",
  "Jodi",
  "Janie",
  "Maggie",
  "Kayla",
  "Sonya",
  "Jan",
  "Lee",
  "Kristine",
  "Candace",
  "Fannie",
  "Maryann",
  "Opal",
  "Alison",
  "Yvette",
  "Melody",
  "Luz",
  "Susie",
  "Olivia",
  "Flora",
  "Shelley",
  "Kristy",
  "Mamie",
  "Lula",
  "Lola",
  "Verna",
  "Beulah",
  "Antoinette",
  "Candice",
  "Juana",
  "Jeannette",
  "Pam",
  "Kelli",
  "Hannah",
  "Whitney",
  "Bridget",
  "Karla",
  "Celia",
  "Latoya",
  "Patty",
  "Shelia",
  "Gayle",
  "Della",
  "Vicky",
  "Lynne",
  "Sheri",
  "Marianne",
  "Kara",
  "Jacquelyn",
  "Erma",
  "Blanca",
  "Myra",
  "Leticia",
  "Pat",
  "Krista",
  "Roxanne",
  "Angelica",
  "Johnnie",
  "Robyn",
  "Francis",
  "Adrienne",
  "Rosalie",
  "Alexandra",
  "Brooke",
  "Bethany",
  "Sadie",
  "Bernadette",
  "Traci",
  "Jody",
  "Kendra",
  "Jasmine",
  "Nichole",
  "Rachael",
  "Chelsea",
  "Mable",
  "Ernestine",
  "Muriel",
  "Marcella",
  "Elena",
  "Krystal",
  "Angelina",
  "Nadine",
  "Kari",
  "Estelle",
  "Dianna",
  "Paulette",
  "Lora",
  "Mona",
  "Doreen",
  "Rosemarie",
  "Angel",
  "Desiree",
  "Antonia",
  "Hope",
  "Ginger",
  "Janis",
  "Betsy",
  "Christie",
  "Freda",
  "Mercedes",
  "Meredith",
  "Lynette",
  "Teri",
  "Cristina",
  "Eula",
  "Leigh",
  "Meghan",
  "Sophia",
  "Eloise",
  "Rochelle",
  "Gretchen",
  "Cecelia",
  "Raquel",
  "Henrietta",
  "Alyssa",
  "Jana",
  "Kelley",
  "Gwen",
  "Kerry",
  "Jenna",
  "Tricia",
  "Laverne",
  "Olive",
  "Alexis",
  "Tasha",
  "Silvia",
  "Elvira",
  "Casey",
  "Delia",
  "Sophie",
  "Kate",
  "Patti",
  "Lorena",
  "Kellie",
  "Sonja",
  "Lila",
  "Lana",
  "Darla",
  "May",
  "Mindy",
  "Essie",
  "Mandy",
  "Lorene",
  "Elsa",
  "Josefina",
  "Jeannie",
  "Miranda",
  "Dixie",
  "Lucia",
  "Marta",
  "Faith",
  "Lela",
  "Johanna",
  "Shari",
  "Camille",
  "Tami",
  "Shawna",
  "Elisa",
  "Ebony",
  "Melba",
  "Ora",
  "Nettie",
  "Tabitha",
  "Ollie",
  "Jaime",
  "Winifred",
  "Kristie"
];
const female_middle_name = [
  "Abigail",
  "Adele",
  "Alex",
  "Alice",
  "Alisha",
  "Amber",
  "Amelia",
  "Amora",
  "Ana\xEFs",
  "Angelou",
  "Anika",
  "Anise",
  "Annabel",
  "Anne",
  "Aphrodite",
  "Aretha",
  "Arya",
  "Ashton",
  "Aster",
  "Audrey",
  "Avery",
  "Bailee",
  "Bay",
  "Belle",
  "Beth",
  "Billie",
  "Blair",
  "Blaise",
  "Blake",
  "Blanche",
  "Blue",
  "Bree",
  "Brielle",
  "Brienne",
  "Brooke",
  "Caleen",
  "Candice",
  "Caprice",
  "Carelyn",
  "Caylen",
  "Celine",
  "Cerise",
  "Cia",
  "Claire",
  "Claudia",
  "Clementine",
  "Coral",
  "Coraline",
  "Dahlia",
  "Dakota",
  "Dawn",
  "Della",
  "Demi",
  "Denise",
  "Denver",
  "Devine",
  "Devon",
  "Diana",
  "Dylan",
  "Ebony",
  "Eden",
  "Eleanor",
  "Elein",
  "Elizabeth",
  "Ellen",
  "Elodie",
  "Eloise",
  "Ember",
  "Emma",
  "Erin",
  "Eyre",
  "Faith",
  "Farrah",
  "Fawn",
  "Fayre",
  "Fern",
  "France",
  "Francis",
  "Frida",
  "Genisis",
  "Georgia",
  "Grace",
  "Gwen",
  "Harley",
  "Harper",
  "Hazel",
  "Helen",
  "Hippolyta",
  "Holly",
  "Hope",
  "Imani",
  "Iowa",
  "Ireland",
  "Irene",
  "Iris",
  "Isa",
  "Isla",
  "Ivy",
  "Jade",
  "Jane",
  "Jazz",
  "Jean",
  "Jess",
  "Jett",
  "Jo",
  "Joan",
  "Jolie",
  "Jordan",
  "Josie",
  "Journey",
  "Joy",
  "Jules",
  "Julien",
  "Juliet",
  "Juniper",
  "Justice",
  "Kali",
  "Karma",
  "Kat",
  "Kate",
  "Kennedy",
  "Keva",
  "Kylie",
  "Lake",
  "Lane",
  "Lark",
  "Layla",
  "Lee",
  "Leigh",
  "Leona",
  "Lexi",
  "London",
  "Lou",
  "Louise",
  "Love",
  "Luna",
  "Lux",
  "Lynn",
  "Lyric",
  "Maddie",
  "Mae",
  "Marie",
  "Matilda",
  "Maude",
  "Maybel",
  "Meadow",
  "Medusa",
  "Mercy",
  "Michelle",
  "Mirabel",
  "Monroe",
  "Morgan",
  "Nalia",
  "Naomi",
  "Nova",
  "Olive",
  "Paige",
  "Parker",
  "Pax",
  "Pearl",
  "Penelope",
  "Phoenix",
  "Quinn",
  "Rae",
  "Rain",
  "Raven",
  "Ray",
  "Raye",
  "Rebel",
  "Reese",
  "Reeve",
  "Regan",
  "Riley",
  "River",
  "Robin",
  "Rory",
  "Rose",
  "Royal",
  "Ruth",
  "Rylie",
  "Sage",
  "Sam",
  "Saturn",
  "Scout",
  "Serena",
  "Sky",
  "Skylar",
  "Sofia",
  "Sophia",
  "Storm",
  "Sue",
  "Suzanne",
  "Sydney",
  "Taylen",
  "Taylor",
  "Teagan",
  "Tempest",
  "Tenley",
  "Thea",
  "Trinity",
  "Valerie",
  "Venus",
  "Vera",
  "Violet",
  "Willow",
  "Winter",
  "Xena",
  "Zaylee",
  "Zion",
  "Zoe"
];
const first_name = [
  "Aaliyah",
  "Aaron",
  "Abagail",
  "Abbey",
  "Abbie",
  "Abbigail",
  "Abby",
  "Abdiel",
  "Abdul",
  "Abdullah",
  "Abe",
  "Abel",
  "Abelardo",
  "Abigail",
  "Abigale",
  "Abigayle",
  "Abner",
  "Abraham",
  "Ada",
  "Adah",
  "Adalberto",
  "Adaline",
  "Adam",
  "Adan",
  "Addie",
  "Addison",
  "Adela",
  "Adelbert",
  "Adele",
  "Adelia",
  "Adeline",
  "Adell",
  "Adella",
  "Adelle",
  "Aditya",
  "Adolf",
  "Adolfo",
  "Adolph",
  "Adolphus",
  "Adonis",
  "Adrain",
  "Adrian",
  "Adriana",
  "Adrianna",
  "Adriel",
  "Adrien",
  "Adrienne",
  "Afton",
  "Aglae",
  "Agnes",
  "Agustin",
  "Agustina",
  "Ahmad",
  "Ahmed",
  "Aida",
  "Aidan",
  "Aiden",
  "Aileen",
  "Aimee",
  "Aisha",
  "Aiyana",
  "Akeem",
  "Al",
  "Alaina",
  "Alan",
  "Alana",
  "Alanis",
  "Alanna",
  "Alayna",
  "Alba",
  "Albert",
  "Alberta",
  "Albertha",
  "Alberto",
  "Albin",
  "Albina",
  "Alda",
  "Alden",
  "Alec",
  "Aleen",
  "Alejandra",
  "Alejandrin",
  "Alek",
  "Alena",
  "Alene",
  "Alessandra",
  "Alessandro",
  "Alessia",
  "Aletha",
  "Alex",
  "Alexa",
  "Alexander",
  "Alexandra",
  "Alexandre",
  "Alexandrea",
  "Alexandria",
  "Alexandrine",
  "Alexandro",
  "Alexane",
  "Alexanne",
  "Alexie",
  "Alexis",
  "Alexys",
  "Alexzander",
  "Alf",
  "Alfonso",
  "Alfonzo",
  "Alford",
  "Alfred",
  "Alfreda",
  "Alfredo",
  "Ali",
  "Alia",
  "Alice",
  "Alicia",
  "Alisa",
  "Alisha",
  "Alison",
  "Alivia",
  "Aliya",
  "Aliyah",
  "Aliza",
  "Alize",
  "Allan",
  "Allen",
  "Allene",
  "Allie",
  "Allison",
  "Ally",
  "Alphonso",
  "Alta",
  "Althea",
  "Alva",
  "Alvah",
  "Alvena",
  "Alvera",
  "Alverta",
  "Alvina",
  "Alvis",
  "Alyce",
  "Alycia",
  "Alysa",
  "Alysha",
  "Alyson",
  "Alysson",
  "Amalia",
  "Amanda",
  "Amani",
  "Amara",
  "Amari",
  "Amaya",
  "Amber",
  "Ambrose",
  "Amelia",
  "Amelie",
  "Amely",
  "America",
  "Americo",
  "Amie",
  "Amina",
  "Amir",
  "Amira",
  "Amiya",
  "Amos",
  "Amparo",
  "Amy",
  "Amya",
  "Ana",
  "Anabel",
  "Anabelle",
  "Anahi",
  "Anais",
  "Anastacio",
  "Anastasia",
  "Anderson",
  "Andre",
  "Andreane",
  "Andreanne",
  "Andres",
  "Andrew",
  "Andy",
  "Angel",
  "Angela",
  "Angelica",
  "Angelina",
  "Angeline",
  "Angelita",
  "Angelo",
  "Angie",
  "Angus",
  "Anibal",
  "Anika",
  "Anissa",
  "Anita",
  "Aniya",
  "Aniyah",
  "Anjali",
  "Anna",
  "Annabel",
  "Annabell",
  "Annabelle",
  "Annalise",
  "Annamae",
  "Annamarie",
  "Anne",
  "Annetta",
  "Annette",
  "Annie",
  "Ansel",
  "Ansley",
  "Anthony",
  "Antoinette",
  "Antone",
  "Antonetta",
  "Antonette",
  "Antonia",
  "Antonietta",
  "Antonina",
  "Antonio",
  "Antwan",
  "Antwon",
  "Anya",
  "April",
  "Ara",
  "Araceli",
  "Aracely",
  "Arch",
  "Archibald",
  "Ardella",
  "Arden",
  "Ardith",
  "Arely",
  "Ari",
  "Ariane",
  "Arianna",
  "Aric",
  "Ariel",
  "Arielle",
  "Arjun",
  "Arlene",
  "Arlie",
  "Arlo",
  "Armand",
  "Armando",
  "Armani",
  "Arnaldo",
  "Arne",
  "Arno",
  "Arnold",
  "Arnoldo",
  "Arnulfo",
  "Aron",
  "Art",
  "Arthur",
  "Arturo",
  "Arvel",
  "Arvid",
  "Arvilla",
  "Aryanna",
  "Asa",
  "Asha",
  "Ashlee",
  "Ashleigh",
  "Ashley",
  "Ashly",
  "Ashlynn",
  "Ashton",
  "Ashtyn",
  "Asia",
  "Assunta",
  "Astrid",
  "Athena",
  "Aubree",
  "Aubrey",
  "Audie",
  "Audra",
  "Audreanne",
  "Audrey",
  "August",
  "Augusta",
  "Augustine",
  "Augustus",
  "Aurelia",
  "Aurelie",
  "Aurelio",
  "Aurore",
  "Austen",
  "Austin",
  "Austyn",
  "Autumn",
  "Ava",
  "Avery",
  "Avis",
  "Axel",
  "Ayana",
  "Ayden",
  "Ayla",
  "Aylin",
  "Baby",
  "Bailee",
  "Bailey",
  "Barbara",
  "Barney",
  "Baron",
  "Barrett",
  "Barry",
  "Bart",
  "Bartholome",
  "Barton",
  "Baylee",
  "Beatrice",
  "Beau",
  "Beaulah",
  "Bell",
  "Bella",
  "Belle",
  "Ben",
  "Benedict",
  "Benjamin",
  "Bennett",
  "Bennie",
  "Benny",
  "Benton",
  "Berenice",
  "Bernadette",
  "Bernadine",
  "Bernard",
  "Bernardo",
  "Berneice",
  "Bernhard",
  "Bernice",
  "Bernie",
  "Berniece",
  "Bernita",
  "Berry",
  "Bert",
  "Berta",
  "Bertha",
  "Bertram",
  "Bertrand",
  "Beryl",
  "Bessie",
  "Beth",
  "Bethany",
  "Bethel",
  "Betsy",
  "Bette",
  "Bettie",
  "Betty",
  "Bettye",
  "Beulah",
  "Beverly",
  "Bianka",
  "Bill",
  "Billie",
  "Billy",
  "Birdie",
  "Blair",
  "Blaise",
  "Blake",
  "Blanca",
  "Blanche",
  "Blaze",
  "Bo",
  "Bobbie",
  "Bobby",
  "Bonita",
  "Bonnie",
  "Boris",
  "Boyd",
  "Brad",
  "Braden",
  "Bradford",
  "Bradley",
  "Bradly",
  "Brady",
  "Braeden",
  "Brain",
  "Brandi",
  "Brando",
  "Brandon",
  "Brandt",
  "Brandy",
  "Brandyn",
  "Brannon",
  "Branson",
  "Brant",
  "Braulio",
  "Braxton",
  "Brayan",
  "Breana",
  "Breanna",
  "Breanne",
  "Brenda",
  "Brendan",
  "Brenden",
  "Brendon",
  "Brenna",
  "Brennan",
  "Brennon",
  "Brent",
  "Bret",
  "Brett",
  "Bria",
  "Brian",
  "Briana",
  "Brianne",
  "Brice",
  "Bridget",
  "Bridgette",
  "Bridie",
  "Brielle",
  "Brigitte",
  "Brionna",
  "Brisa",
  "Britney",
  "Brittany",
  "Brock",
  "Broderick",
  "Brody",
  "Brook",
  "Brooke",
  "Brooklyn",
  "Brooks",
  "Brown",
  "Bruce",
  "Bryana",
  "Bryce",
  "Brycen",
  "Bryon",
  "Buck",
  "Bud",
  "Buddy",
  "Buford",
  "Bulah",
  "Burdette",
  "Burley",
  "Burnice",
  "Buster",
  "Cade",
  "Caden",
  "Caesar",
  "Caitlyn",
  "Cale",
  "Caleb",
  "Caleigh",
  "Cali",
  "Calista",
  "Callie",
  "Camden",
  "Cameron",
  "Camila",
  "Camilla",
  "Camille",
  "Camren",
  "Camron",
  "Camryn",
  "Camylle",
  "Candace",
  "Candelario",
  "Candice",
  "Candida",
  "Candido",
  "Cara",
  "Carey",
  "Carissa",
  "Carlee",
  "Carleton",
  "Carley",
  "Carli",
  "Carlie",
  "Carlo",
  "Carlos",
  "Carlotta",
  "Carmel",
  "Carmela",
  "Carmella",
  "Carmelo",
  "Carmen",
  "Carmine",
  "Carol",
  "Carolanne",
  "Carole",
  "Carolina",
  "Caroline",
  "Carolyn",
  "Carolyne",
  "Carrie",
  "Carroll",
  "Carson",
  "Carter",
  "Cary",
  "Casandra",
  "Casey",
  "Casimer",
  "Casimir",
  "Casper",
  "Cassandra",
  "Cassandre",
  "Cassidy",
  "Cassie",
  "Catalina",
  "Caterina",
  "Catharine",
  "Catherine",
  "Cathrine",
  "Cathryn",
  "Cathy",
  "Cayla",
  "Ceasar",
  "Cecelia",
  "Cecil",
  "Cecile",
  "Cecilia",
  "Cedrick",
  "Celestine",
  "Celestino",
  "Celia",
  "Celine",
  "Cesar",
  "Chad",
  "Chadd",
  "Chadrick",
  "Chaim",
  "Chance",
  "Chandler",
  "Chanel",
  "Chanelle",
  "Charity",
  "Charlene",
  "Charles",
  "Charley",
  "Charlie",
  "Charlotte",
  "Chase",
  "Chasity",
  "Chauncey",
  "Chaya",
  "Chaz",
  "Chelsea",
  "Chelsey",
  "Chelsie",
  "Chesley",
  "Chester",
  "Chet",
  "Cheyanne",
  "Cheyenne",
  "Chloe",
  "Chris",
  "Christ",
  "Christa",
  "Christelle",
  "Christian",
  "Christiana",
  "Christina",
  "Christine",
  "Christop",
  "Christophe",
  "Christopher",
  "Christy",
  "Chyna",
  "Ciara",
  "Cicero",
  "Cielo",
  "Cierra",
  "Cindy",
  "Citlalli",
  "Clair",
  "Claire",
  "Clara",
  "Clarabelle",
  "Clare",
  "Clarissa",
  "Clark",
  "Claud",
  "Claude",
  "Claudia",
  "Claudie",
  "Claudine",
  "Clay",
  "Clemens",
  "Clement",
  "Clementina",
  "Clementine",
  "Clemmie",
  "Cleo",
  "Cleora",
  "Cleta",
  "Cletus",
  "Cleve",
  "Cleveland",
  "Clifford",
  "Clifton",
  "Clint",
  "Clinton",
  "Clotilde",
  "Clovis",
  "Cloyd",
  "Clyde",
  "Coby",
  "Cody",
  "Colby",
  "Cole",
  "Coleman",
  "Colin",
  "Colleen",
  "Collin",
  "Colt",
  "Colten",
  "Colton",
  "Columbus",
  "Concepcion",
  "Conner",
  "Connie",
  "Connor",
  "Conor",
  "Conrad",
  "Constance",
  "Constantin",
  "Consuelo",
  "Cooper",
  "Cora",
  "Coralie",
  "Corbin",
  "Cordelia",
  "Cordell",
  "Cordia",
  "Cordie",
  "Corene",
  "Corine",
  "Cornelius",
  "Cornell",
  "Corrine",
  "Cortez",
  "Cortney",
  "Cory",
  "Coty",
  "Courtney",
  "Coy",
  "Craig",
  "Crawford",
  "Creola",
  "Cristal",
  "Cristian",
  "Cristina",
  "Cristobal",
  "Cristopher",
  "Cruz",
  "Crystal",
  "Crystel",
  "Cullen",
  "Curt",
  "Curtis",
  "Cydney",
  "Cynthia",
  "Cyril",
  "Cyrus",
  "Dagmar",
  "Dahlia",
  "Daija",
  "Daisha",
  "Daisy",
  "Dakota",
  "Dale",
  "Dallas",
  "Dallin",
  "Dalton",
  "Damaris",
  "Dameon",
  "Damian",
  "Damien",
  "Damion",
  "Damon",
  "Dan",
  "Dana",
  "Dandre",
  "Dane",
  "D'angelo",
  "Dangelo",
  "Danial",
  "Daniela",
  "Daniella",
  "Danielle",
  "Danika",
  "Dannie",
  "Danny",
  "Dante",
  "Danyka",
  "Daphne",
  "Daphnee",
  "Daphney",
  "Darby",
  "Daren",
  "Darian",
  "Dariana",
  "Darien",
  "Dario",
  "Darion",
  "Darius",
  "Darlene",
  "Daron",
  "Darrel",
  "Darrell",
  "Darren",
  "Darrick",
  "Darrin",
  "Darrion",
  "Darron",
  "Darryl",
  "Darwin",
  "Daryl",
  "Dashawn",
  "Dasia",
  "Dave",
  "David",
  "Davin",
  "Davion",
  "Davon",
  "Davonte",
  "Dawn",
  "Dawson",
  "Dax",
  "Dayana",
  "Dayna",
  "Dayne",
  "Dayton",
  "Dean",
  "Deangelo",
  "Deanna",
  "Deborah",
  "Declan",
  "Dedric",
  "Dedrick",
  "Dee",
  "Deion",
  "Deja",
  "Dejah",
  "Dejon",
  "Dejuan",
  "Delaney",
  "Delbert",
  "Delfina",
  "Delia",
  "Delilah",
  "Dell",
  "Della",
  "Delmer",
  "Delores",
  "Delpha",
  "Delphia",
  "Delphine",
  "Delta",
  "Demarco",
  "Demarcus",
  "Demario",
  "Demetris",
  "Demetrius",
  "Demond",
  "Dena",
  "Denis",
  "Dennis",
  "Deon",
  "Deondre",
  "Deontae",
  "Deonte",
  "Dereck",
  "Derek",
  "Derick",
  "Deron",
  "Derrick",
  "Deshaun",
  "Deshawn",
  "Desiree",
  "Desmond",
  "Dessie",
  "Destany",
  "Destin",
  "Destinee",
  "Destiney",
  "Destini",
  "Destiny",
  "Devan",
  "Devante",
  "Deven",
  "Devin",
  "Devon",
  "Devonte",
  "Devyn",
  "Dewayne",
  "Dewitt",
  "Dexter",
  "Diamond",
  "Diana",
  "Dianna",
  "Diego",
  "Dillan",
  "Dillon",
  "Dimitri",
  "Dina",
  "Dino",
  "Dion",
  "Dixie",
  "Dock",
  "Dolly",
  "Dolores",
  "Domenic",
  "Domenica",
  "Domenick",
  "Domenico",
  "Domingo",
  "Dominic",
  "Dominique",
  "Don",
  "Donald",
  "Donato",
  "Donavon",
  "Donna",
  "Donnell",
  "Donnie",
  "Donny",
  "Dora",
  "Dorcas",
  "Dorian",
  "Doris",
  "Dorothea",
  "Dorothy",
  "Dorris",
  "Dortha",
  "Dorthy",
  "Doug",
  "Douglas",
  "Dovie",
  "Doyle",
  "Drake",
  "Drew",
  "Duane",
  "Dudley",
  "Dulce",
  "Duncan",
  "Durward",
  "Dustin",
  "Dusty",
  "Dwight",
  "Dylan",
  "Earl",
  "Earlene",
  "Earline",
  "Earnest",
  "Earnestine",
  "Easter",
  "Easton",
  "Ebba",
  "Ebony",
  "Ed",
  "Eda",
  "Edd",
  "Eddie",
  "Eden",
  "Edgar",
  "Edgardo",
  "Edison",
  "Edmond",
  "Edmund",
  "Edna",
  "Eduardo",
  "Edward",
  "Edwardo",
  "Edwin",
  "Edwina",
  "Edyth",
  "Edythe",
  "Effie",
  "Efrain",
  "Efren",
  "Eileen",
  "Einar",
  "Eino",
  "Eladio",
  "Elaina",
  "Elbert",
  "Elda",
  "Eldon",
  "Eldora",
  "Eldred",
  "Eldridge",
  "Eleanora",
  "Eleanore",
  "Eleazar",
  "Electa",
  "Elena",
  "Elenor",
  "Elenora",
  "Eleonore",
  "Elfrieda",
  "Eli",
  "Elian",
  "Eliane",
  "Elias",
  "Eliezer",
  "Elijah",
  "Elinor",
  "Elinore",
  "Elisa",
  "Elisabeth",
  "Elise",
  "Eliseo",
  "Elisha",
  "Elissa",
  "Eliza",
  "Elizabeth",
  "Ella",
  "Ellen",
  "Ellie",
  "Elliot",
  "Elliott",
  "Ellis",
  "Ellsworth",
  "Elmer",
  "Elmira",
  "Elmo",
  "Elmore",
  "Elna",
  "Elnora",
  "Elody",
  "Eloisa",
  "Eloise",
  "Elouise",
  "Eloy",
  "Elroy",
  "Elsa",
  "Else",
  "Elsie",
  "Elta",
  "Elton",
  "Elva",
  "Elvera",
  "Elvie",
  "Elvis",
  "Elwin",
  "Elwyn",
  "Elyse",
  "Elyssa",
  "Elza",
  "Emanuel",
  "Emelia",
  "Emelie",
  "Emely",
  "Emerald",
  "Emerson",
  "Emery",
  "Emie",
  "Emil",
  "Emile",
  "Emilia",
  "Emiliano",
  "Emilie",
  "Emilio",
  "Emily",
  "Emma",
  "Emmalee",
  "Emmanuel",
  "Emmanuelle",
  "Emmet",
  "Emmett",
  "Emmie",
  "Emmitt",
  "Emmy",
  "Emory",
  "Ena",
  "Enid",
  "Enoch",
  "Enola",
  "Enos",
  "Enrico",
  "Enrique",
  "Ephraim",
  "Era",
  "Eriberto",
  "Eric",
  "Erica",
  "Erich",
  "Erick",
  "Ericka",
  "Erik",
  "Erika",
  "Erin",
  "Erling",
  "Erna",
  "Ernest",
  "Ernestina",
  "Ernestine",
  "Ernesto",
  "Ernie",
  "Ervin",
  "Erwin",
  "Eryn",
  "Esmeralda",
  "Esperanza",
  "Esta",
  "Esteban",
  "Estefania",
  "Estel",
  "Estell",
  "Estella",
  "Estelle",
  "Estevan",
  "Esther",
  "Estrella",
  "Etha",
  "Ethan",
  "Ethel",
  "Ethelyn",
  "Ethyl",
  "Ettie",
  "Eudora",
  "Eugene",
  "Eugenia",
  "Eula",
  "Eulah",
  "Eulalia",
  "Euna",
  "Eunice",
  "Eusebio",
  "Eva",
  "Evalyn",
  "Evan",
  "Evangeline",
  "Evans",
  "Eve",
  "Eveline",
  "Evelyn",
  "Everardo",
  "Everett",
  "Everette",
  "Evert",
  "Evie",
  "Ewald",
  "Ewell",
  "Ezekiel",
  "Ezequiel",
  "Ezra",
  "Fabian",
  "Fabiola",
  "Fae",
  "Fannie",
  "Fanny",
  "Fatima",
  "Faustino",
  "Fausto",
  "Favian",
  "Fay",
  "Faye",
  "Federico",
  "Felicia",
  "Felicita",
  "Felicity",
  "Felipa",
  "Felipe",
  "Felix",
  "Felton",
  "Fermin",
  "Fern",
  "Fernando",
  "Ferne",
  "Fidel",
  "Filiberto",
  "Filomena",
  "Finn",
  "Fiona",
  "Flavie",
  "Flavio",
  "Fleta",
  "Fletcher",
  "Flo",
  "Florence",
  "Florencio",
  "Florian",
  "Florida",
  "Florine",
  "Flossie",
  "Floy",
  "Floyd",
  "Ford",
  "Forest",
  "Forrest",
  "Foster",
  "Frances",
  "Francesca",
  "Francesco",
  "Francis",
  "Francisca",
  "Francisco",
  "Franco",
  "Frank",
  "Frankie",
  "Franz",
  "Fred",
  "Freda",
  "Freddie",
  "Freddy",
  "Frederic",
  "Frederick",
  "Frederik",
  "Frederique",
  "Fredrick",
  "Fredy",
  "Freeda",
  "Freeman",
  "Freida",
  "Frida",
  "Frieda",
  "Friedrich",
  "Fritz",
  "Furman",
  "Gabe",
  "Gabriel",
  "Gabriella",
  "Gabrielle",
  "Gaetano",
  "Gage",
  "Gail",
  "Gardner",
  "Garett",
  "Garfield",
  "Garland",
  "Garnet",
  "Garnett",
  "Garret",
  "Garrett",
  "Garrick",
  "Garrison",
  "Garry",
  "Garth",
  "Gaston",
  "Gavin",
  "Gay",
  "Gayle",
  "Gaylord",
  "Gene",
  "General",
  "Genesis",
  "Genevieve",
  "Gennaro",
  "Genoveva",
  "Geo",
  "Geoffrey",
  "George",
  "Georgette",
  "Georgiana",
  "Georgianna",
  "Geovanni",
  "Geovanny",
  "Geovany",
  "Gerald",
  "Geraldine",
  "Gerard",
  "Gerardo",
  "Gerda",
  "Gerhard",
  "Germaine",
  "German",
  "Gerry",
  "Gerson",
  "Gertrude",
  "Gia",
  "Gianni",
  "Gideon",
  "Gilbert",
  "Gilberto",
  "Gilda",
  "Giles",
  "Gillian",
  "Gina",
  "Gino",
  "Giovani",
  "Giovanna",
  "Giovanni",
  "Giovanny",
  "Gisselle",
  "Giuseppe",
  "Gladyce",
  "Gladys",
  "Glen",
  "Glenda",
  "Glenna",
  "Glennie",
  "Gloria",
  "Godfrey",
  "Golda",
  "Golden",
  "Gonzalo",
  "Gordon",
  "Grace",
  "Gracie",
  "Graciela",
  "Grady",
  "Graham",
  "Grant",
  "Granville",
  "Grayce",
  "Grayson",
  "Green",
  "Greg",
  "Gregg",
  "Gregoria",
  "Gregorio",
  "Gregory",
  "Greta",
  "Gretchen",
  "Greyson",
  "Griffin",
  "Grover",
  "Guadalupe",
  "Gudrun",
  "Guido",
  "Guillermo",
  "Guiseppe",
  "Gunnar",
  "Gunner",
  "Gus",
  "Gussie",
  "Gust",
  "Gustave",
  "Guy",
  "Gwen",
  "Gwendolyn",
  "Hadley",
  "Hailee",
  "Hailey",
  "Hailie",
  "Hal",
  "Haleigh",
  "Haley",
  "Halie",
  "Halle",
  "Hallie",
  "Hank",
  "Hanna",
  "Hannah",
  "Hans",
  "Hardy",
  "Harley",
  "Harmon",
  "Harmony",
  "Harold",
  "Harrison",
  "Harry",
  "Harvey",
  "Haskell",
  "Hassan",
  "Hassie",
  "Hattie",
  "Haven",
  "Hayden",
  "Haylee",
  "Hayley",
  "Haylie",
  "Hazel",
  "Hazle",
  "Heath",
  "Heather",
  "Heaven",
  "Heber",
  "Hector",
  "Heidi",
  "Helen",
  "Helena",
  "Helene",
  "Helga",
  "Hellen",
  "Helmer",
  "Heloise",
  "Henderson",
  "Henri",
  "Henriette",
  "Henry",
  "Herbert",
  "Herman",
  "Hermann",
  "Hermina",
  "Herminia",
  "Herminio",
  "Hershel",
  "Herta",
  "Hertha",
  "Hester",
  "Hettie",
  "Hilario",
  "Hilbert",
  "Hilda",
  "Hildegard",
  "Hillard",
  "Hillary",
  "Hilma",
  "Hilton",
  "Hipolito",
  "Hiram",
  "Hobart",
  "Holden",
  "Hollie",
  "Hollis",
  "Holly",
  "Hope",
  "Horace",
  "Horacio",
  "Hortense",
  "Hosea",
  "Houston",
  "Howard",
  "Howell",
  "Hoyt",
  "Hubert",
  "Hudson",
  "Hugh",
  "Hulda",
  "Humberto",
  "Hunter",
  "Hyman",
  "Ian",
  "Ibrahim",
  "Icie",
  "Ida",
  "Idell",
  "Idella",
  "Ignacio",
  "Ignatius",
  "Ike",
  "Ila",
  "Ilene",
  "Iliana",
  "Ima",
  "Imani",
  "Imelda",
  "Immanuel",
  "Imogene",
  "Ines",
  "Irma",
  "Irving",
  "Irwin",
  "Isaac",
  "Isabel",
  "Isabell",
  "Isabella",
  "Isabelle",
  "Isac",
  "Isadore",
  "Isai",
  "Isaiah",
  "Isaias",
  "Isidro",
  "Ismael",
  "Isobel",
  "Isom",
  "Israel",
  "Issac",
  "Itzel",
  "Iva",
  "Ivah",
  "Ivory",
  "Ivy",
  "Izabella",
  "Izaiah",
  "Jabari",
  "Jace",
  "Jacey",
  "Jacinthe",
  "Jacinto",
  "Jack",
  "Jackeline",
  "Jackie",
  "Jacklyn",
  "Jackson",
  "Jacky",
  "Jaclyn",
  "Jacquelyn",
  "Jacques",
  "Jacynthe",
  "Jada",
  "Jade",
  "Jaden",
  "Jadon",
  "Jadyn",
  "Jaeden",
  "Jaida",
  "Jaiden",
  "Jailyn",
  "Jaime",
  "Jairo",
  "Jakayla",
  "Jake",
  "Jakob",
  "Jaleel",
  "Jalen",
  "Jalon",
  "Jalyn",
  "Jamaal",
  "Jamal",
  "Jamar",
  "Jamarcus",
  "Jamel",
  "Jameson",
  "Jamey",
  "Jamie",
  "Jamil",
  "Jamir",
  "Jamison",
  "Jammie",
  "Jan",
  "Jana",
  "Janae",
  "Jane",
  "Janelle",
  "Janessa",
  "Janet",
  "Janice",
  "Janick",
  "Janie",
  "Janis",
  "Janiya",
  "Jannie",
  "Jany",
  "Jaquan",
  "Jaquelin",
  "Jaqueline",
  "Jared",
  "Jaren",
  "Jarod",
  "Jaron",
  "Jarred",
  "Jarrell",
  "Jarret",
  "Jarrett",
  "Jarrod",
  "Jarvis",
  "Jasen",
  "Jasmin",
  "Jason",
  "Jasper",
  "Jaunita",
  "Javier",
  "Javon",
  "Javonte",
  "Jay",
  "Jayce",
  "Jaycee",
  "Jayda",
  "Jayde",
  "Jayden",
  "Jaydon",
  "Jaylan",
  "Jaylen",
  "Jaylin",
  "Jaylon",
  "Jayme",
  "Jayne",
  "Jayson",
  "Jazlyn",
  "Jazmin",
  "Jazmyn",
  "Jazmyne",
  "Jean",
  "Jeanette",
  "Jeanie",
  "Jeanne",
  "Jed",
  "Jedediah",
  "Jedidiah",
  "Jeff",
  "Jefferey",
  "Jeffery",
  "Jeffrey",
  "Jeffry",
  "Jena",
  "Jenifer",
  "Jennie",
  "Jennifer",
  "Jennings",
  "Jennyfer",
  "Jensen",
  "Jerad",
  "Jerald",
  "Jeramie",
  "Jeramy",
  "Jerel",
  "Jeremie",
  "Jeremy",
  "Jermain",
  "Jermaine",
  "Jermey",
  "Jerod",
  "Jerome",
  "Jeromy",
  "Jerrell",
  "Jerrod",
  "Jerrold",
  "Jerry",
  "Jess",
  "Jesse",
  "Jessica",
  "Jessie",
  "Jessika",
  "Jessy",
  "Jessyca",
  "Jesus",
  "Jett",
  "Jettie",
  "Jevon",
  "Jewel",
  "Jewell",
  "Jillian",
  "Jimmie",
  "Jimmy",
  "Jo",
  "Joan",
  "Joana",
  "Joanie",
  "Joanne",
  "Joannie",
  "Joanny",
  "Joany",
  "Joaquin",
  "Jocelyn",
  "Jodie",
  "Jody",
  "Joe",
  "Joel",
  "Joelle",
  "Joesph",
  "Joey",
  "Johan",
  "Johann",
  "Johanna",
  "Johathan",
  "John",
  "Johnathan",
  "Johnathon",
  "Johnnie",
  "Johnny",
  "Johnpaul",
  "Johnson",
  "Jolie",
  "Jon",
  "Jonas",
  "Jonatan",
  "Jonathan",
  "Jonathon",
  "Jordan",
  "Jordane",
  "Jordi",
  "Jordon",
  "Jordy",
  "Jordyn",
  "Jorge",
  "Jose",
  "Josefa",
  "Josefina",
  "Joseph",
  "Josephine",
  "Josh",
  "Joshua",
  "Joshuah",
  "Josiah",
  "Josiane",
  "Josianne",
  "Josie",
  "Josue",
  "Jovan",
  "Jovani",
  "Jovanny",
  "Jovany",
  "Joy",
  "Joyce",
  "Juana",
  "Juanita",
  "Judah",
  "Judd",
  "Jude",
  "Judge",
  "Judson",
  "Judy",
  "Jules",
  "Julia",
  "Julian",
  "Juliana",
  "Julianne",
  "Julie",
  "Julien",
  "Juliet",
  "Julio",
  "Julius",
  "June",
  "Junior",
  "Junius",
  "Justen",
  "Justice",
  "Justina",
  "Justine",
  "Juston",
  "Justus",
  "Justyn",
  "Juvenal",
  "Juwan",
  "Kacey",
  "Kaci",
  "Kacie",
  "Kade",
  "Kaden",
  "Kadin",
  "Kaela",
  "Kaelyn",
  "Kaia",
  "Kailee",
  "Kailey",
  "Kailyn",
  "Kaitlin",
  "Kaitlyn",
  "Kale",
  "Kaleb",
  "Kaleigh",
  "Kaley",
  "Kali",
  "Kallie",
  "Kameron",
  "Kamille",
  "Kamren",
  "Kamron",
  "Kamryn",
  "Kane",
  "Kara",
  "Kareem",
  "Karelle",
  "Karen",
  "Kari",
  "Kariane",
  "Karianne",
  "Karina",
  "Karine",
  "Karl",
  "Karlee",
  "Karley",
  "Karli",
  "Karlie",
  "Karolann",
  "Karson",
  "Kasandra",
  "Kasey",
  "Kassandra",
  "Katarina",
  "Katelin",
  "Katelyn",
  "Katelynn",
  "Katharina",
  "Katherine",
  "Katheryn",
  "Kathleen",
  "Kathlyn",
  "Kathryn",
  "Kathryne",
  "Katlyn",
  "Katlynn",
  "Katrina",
  "Katrine",
  "Kattie",
  "Kavon",
  "Kay",
  "Kaya",
  "Kaycee",
  "Kayden",
  "Kayla",
  "Kaylah",
  "Kaylee",
  "Kayleigh",
  "Kayley",
  "Kayli",
  "Kaylie",
  "Kaylin",
  "Keagan",
  "Keanu",
  "Keara",
  "Keaton",
  "Keegan",
  "Keeley",
  "Keely",
  "Keenan",
  "Keira",
  "Keith",
  "Kellen",
  "Kelley",
  "Kelli",
  "Kellie",
  "Kelly",
  "Kelsi",
  "Kelsie",
  "Kelton",
  "Kelvin",
  "Ken",
  "Kendall",
  "Kendra",
  "Kendrick",
  "Kenna",
  "Kennedi",
  "Kennedy",
  "Kenneth",
  "Kennith",
  "Kenny",
  "Kenton",
  "Kenya",
  "Kenyatta",
  "Kenyon",
  "Keon",
  "Keshaun",
  "Keshawn",
  "Keven",
  "Kevin",
  "Kevon",
  "Keyon",
  "Keyshawn",
  "Khalid",
  "Khalil",
  "Kian",
  "Kiana",
  "Kianna",
  "Kiara",
  "Kiarra",
  "Kiel",
  "Kiera",
  "Kieran",
  "Kiley",
  "Kim",
  "Kimberly",
  "King",
  "Kip",
  "Kira",
  "Kirk",
  "Kirsten",
  "Kirstin",
  "Kitty",
  "Kobe",
  "Koby",
  "Kody",
  "Kolby",
  "Kole",
  "Korbin",
  "Korey",
  "Kory",
  "Kraig",
  "Kris",
  "Krista",
  "Kristian",
  "Kristin",
  "Kristina",
  "Kristofer",
  "Kristoffer",
  "Kristopher",
  "Kristy",
  "Krystal",
  "Krystel",
  "Krystina",
  "Kurt",
  "Kurtis",
  "Kyla",
  "Kyle",
  "Kylee",
  "Kyleigh",
  "Kyler",
  "Kylie",
  "Kyra",
  "Lacey",
  "Lacy",
  "Ladarius",
  "Lafayette",
  "Laila",
  "Laisha",
  "Lamar",
  "Lambert",
  "Lamont",
  "Lance",
  "Landen",
  "Lane",
  "Laney",
  "Larissa",
  "Laron",
  "Larry",
  "Larue",
  "Laura",
  "Laurel",
  "Lauren",
  "Laurence",
  "Lauretta",
  "Lauriane",
  "Laurianne",
  "Laurie",
  "Laurine",
  "Laury",
  "Lauryn",
  "Lavada",
  "Lavern",
  "Laverna",
  "Laverne",
  "Lavina",
  "Lavinia",
  "Lavon",
  "Lavonne",
  "Lawrence",
  "Lawson",
  "Layla",
  "Layne",
  "Lazaro",
  "Lea",
  "Leann",
  "Leanna",
  "Leanne",
  "Leatha",
  "Leda",
  "Lee",
  "Leif",
  "Leila",
  "Leilani",
  "Lela",
  "Lelah",
  "Leland",
  "Lelia",
  "Lempi",
  "Lemuel",
  "Lenna",
  "Lennie",
  "Lenny",
  "Lenora",
  "Lenore",
  "Leo",
  "Leola",
  "Leon",
  "Leonard",
  "Leonardo",
  "Leone",
  "Leonel",
  "Leonie",
  "Leonor",
  "Leonora",
  "Leopold",
  "Leopoldo",
  "Leora",
  "Lera",
  "Lesley",
  "Leslie",
  "Lesly",
  "Lessie",
  "Lester",
  "Leta",
  "Letha",
  "Letitia",
  "Levi",
  "Lew",
  "Lewis",
  "Lexi",
  "Lexie",
  "Lexus",
  "Lia",
  "Liam",
  "Liana",
  "Libbie",
  "Libby",
  "Lila",
  "Lilian",
  "Liliana",
  "Liliane",
  "Lilla",
  "Lillian",
  "Lilliana",
  "Lillie",
  "Lilly",
  "Lily",
  "Lilyan",
  "Lina",
  "Lincoln",
  "Linda",
  "Lindsay",
  "Lindsey",
  "Linnea",
  "Linnie",
  "Linwood",
  "Lionel",
  "Lisa",
  "Lisandro",
  "Lisette",
  "Litzy",
  "Liza",
  "Lizeth",
  "Lizzie",
  "Llewellyn",
  "Lloyd",
  "Logan",
  "Lois",
  "Lola",
  "Lolita",
  "Loma",
  "Lon",
  "London",
  "Lonie",
  "Lonnie",
  "Lonny",
  "Lonzo",
  "Lora",
  "Loraine",
  "Loren",
  "Lorena",
  "Lorenz",
  "Lorenza",
  "Lorenzo",
  "Lori",
  "Lorine",
  "Lorna",
  "Lottie",
  "Lou",
  "Louie",
  "Louisa",
  "Lourdes",
  "Louvenia",
  "Lowell",
  "Loy",
  "Loyal",
  "Loyce",
  "Lucas",
  "Luciano",
  "Lucie",
  "Lucienne",
  "Lucile",
  "Lucinda",
  "Lucio",
  "Lucious",
  "Lucius",
  "Lucy",
  "Ludie",
  "Ludwig",
  "Lue",
  "Luella",
  "Luigi",
  "Luis",
  "Luisa",
  "Lukas",
  "Lula",
  "Lulu",
  "Luna",
  "Lupe",
  "Lura",
  "Lurline",
  "Luther",
  "Luz",
  "Lyda",
  "Lydia",
  "Lyla",
  "Lynn",
  "Lyric",
  "Lysanne",
  "Mabel",
  "Mabelle",
  "Mable",
  "Mac",
  "Macey",
  "Maci",
  "Macie",
  "Mack",
  "Mackenzie",
  "Macy",
  "Madaline",
  "Madalyn",
  "Maddison",
  "Madeline",
  "Madelyn",
  "Madelynn",
  "Madge",
  "Madie",
  "Madilyn",
  "Madisen",
  "Madison",
  "Madisyn",
  "Madonna",
  "Madyson",
  "Mae",
  "Maegan",
  "Maeve",
  "Mafalda",
  "Magali",
  "Magdalen",
  "Magdalena",
  "Maggie",
  "Magnolia",
  "Magnus",
  "Maia",
  "Maida",
  "Maiya",
  "Major",
  "Makayla",
  "Makenna",
  "Makenzie",
  "Malachi",
  "Malcolm",
  "Malika",
  "Malinda",
  "Mallie",
  "Mallory",
  "Malvina",
  "Mandy",
  "Manley",
  "Manuel",
  "Manuela",
  "Mara",
  "Marc",
  "Marcel",
  "Marcelina",
  "Marcelino",
  "Marcella",
  "Marcelle",
  "Marcellus",
  "Marcelo",
  "Marcia",
  "Marco",
  "Marcos",
  "Marcus",
  "Margaret",
  "Margarete",
  "Margarett",
  "Margaretta",
  "Margarette",
  "Margarita",
  "Marge",
  "Margie",
  "Margot",
  "Margret",
  "Marguerite",
  "Maria",
  "Mariah",
  "Mariam",
  "Marian",
  "Mariana",
  "Mariane",
  "Marianna",
  "Marianne",
  "Mariano",
  "Maribel",
  "Marie",
  "Mariela",
  "Marielle",
  "Marietta",
  "Marilie",
  "Marilou",
  "Marilyne",
  "Marina",
  "Mario",
  "Marion",
  "Marisa",
  "Marisol",
  "Maritza",
  "Marjolaine",
  "Marjorie",
  "Marjory",
  "Mark",
  "Markus",
  "Marlee",
  "Marlen",
  "Marlene",
  "Marley",
  "Marlin",
  "Marlon",
  "Marques",
  "Marquis",
  "Marquise",
  "Marshall",
  "Marta",
  "Martin",
  "Martina",
  "Martine",
  "Marty",
  "Marvin",
  "Mary",
  "Maryam",
  "Maryjane",
  "Maryse",
  "Mason",
  "Mateo",
  "Mathew",
  "Mathias",
  "Mathilde",
  "Matilda",
  "Matilde",
  "Matt",
  "Matteo",
  "Mattie",
  "Maud",
  "Maude",
  "Maudie",
  "Maureen",
  "Maurice",
  "Mauricio",
  "Maurine",
  "Maverick",
  "Mavis",
  "Max",
  "Maxie",
  "Maxime",
  "Maximilian",
  "Maximillia",
  "Maximillian",
  "Maximo",
  "Maximus",
  "Maxine",
  "Maxwell",
  "May",
  "Maya",
  "Maybell",
  "Maybelle",
  "Maye",
  "Maymie",
  "Maynard",
  "Mayra",
  "Mazie",
  "Mckayla",
  "Mckenna",
  "Mckenzie",
  "Meagan",
  "Meaghan",
  "Meda",
  "Megane",
  "Meggie",
  "Meghan",
  "Mekhi",
  "Melany",
  "Melba",
  "Melisa",
  "Melissa",
  "Mellie",
  "Melody",
  "Melvin",
  "Melvina",
  "Melyna",
  "Melyssa",
  "Mercedes",
  "Meredith",
  "Merl",
  "Merle",
  "Merlin",
  "Merritt",
  "Mertie",
  "Mervin",
  "Meta",
  "Mia",
  "Micaela",
  "Micah",
  "Michael",
  "Michaela",
  "Michale",
  "Micheal",
  "Michel",
  "Michele",
  "Michelle",
  "Miguel",
  "Mikayla",
  "Mike",
  "Mikel",
  "Milan",
  "Miles",
  "Milford",
  "Miller",
  "Millie",
  "Milo",
  "Milton",
  "Mina",
  "Minerva",
  "Minnie",
  "Miracle",
  "Mireille",
  "Mireya",
  "Misael",
  "Missouri",
  "Misty",
  "Mitchel",
  "Mitchell",
  "Mittie",
  "Modesta",
  "Modesto",
  "Mohamed",
  "Mohammad",
  "Mohammed",
  "Moises",
  "Mollie",
  "Molly",
  "Mona",
  "Monica",
  "Monique",
  "Monroe",
  "Monserrat",
  "Monserrate",
  "Montana",
  "Monte",
  "Monty",
  "Morgan",
  "Moriah",
  "Morris",
  "Mortimer",
  "Morton",
  "Mose",
  "Moses",
  "Moshe",
  "Mossie",
  "Mozell",
  "Mozelle",
  "Muhammad",
  "Muriel",
  "Murl",
  "Murphy",
  "Murray",
  "Mustafa",
  "Mya",
  "Myah",
  "Mylene",
  "Myles",
  "Myra",
  "Myriam",
  "Myrl",
  "Myrna",
  "Myron",
  "Myrtice",
  "Myrtie",
  "Myrtis",
  "Myrtle",
  "Nadia",
  "Nakia",
  "Name",
  "Nannie",
  "Naomi",
  "Naomie",
  "Napoleon",
  "Narciso",
  "Nash",
  "Nasir",
  "Nat",
  "Natalia",
  "Natalie",
  "Natasha",
  "Nathan",
  "Nathanael",
  "Nathanial",
  "Nathaniel",
  "Nathen",
  "Nayeli",
  "Neal",
  "Ned",
  "Nedra",
  "Neha",
  "Neil",
  "Nelda",
  "Nella",
  "Nelle",
  "Nellie",
  "Nels",
  "Nelson",
  "Neoma",
  "Nestor",
  "Nettie",
  "Neva",
  "Newell",
  "Newton",
  "Nia",
  "Nicholas",
  "Nicholaus",
  "Nichole",
  "Nick",
  "Nicklaus",
  "Nickolas",
  "Nico",
  "Nicola",
  "Nicolas",
  "Nicole",
  "Nicolette",
  "Nigel",
  "Nikita",
  "Nikki",
  "Nikko",
  "Niko",
  "Nikolas",
  "Nils",
  "Nina",
  "Noah",
  "Noble",
  "Noe",
  "Noel",
  "Noelia",
  "Noemi",
  "Noemie",
  "Noemy",
  "Nola",
  "Nolan",
  "Nona",
  "Nora",
  "Norbert",
  "Norberto",
  "Norene",
  "Norma",
  "Norris",
  "Norval",
  "Norwood",
  "Nova",
  "Novella",
  "Nya",
  "Nyah",
  "Nyasia",
  "Obie",
  "Oceane",
  "Ocie",
  "Octavia",
  "Oda",
  "Odell",
  "Odessa",
  "Odie",
  "Ofelia",
  "Okey",
  "Ola",
  "Olaf",
  "Ole",
  "Olen",
  "Oleta",
  "Olga",
  "Olin",
  "Oliver",
  "Ollie",
  "Oma",
  "Omari",
  "Omer",
  "Ona",
  "Onie",
  "Opal",
  "Ophelia",
  "Ora",
  "Oral",
  "Oran",
  "Oren",
  "Orie",
  "Orin",
  "Orion",
  "Orland",
  "Orlando",
  "Orlo",
  "Orpha",
  "Orrin",
  "Orval",
  "Orville",
  "Osbaldo",
  "Osborne",
  "Oscar",
  "Osvaldo",
  "Oswald",
  "Oswaldo",
  "Otha",
  "Otho",
  "Otilia",
  "Otis",
  "Ottilie",
  "Ottis",
  "Otto",
  "Ova",
  "Owen",
  "Ozella",
  "Pablo",
  "Paige",
  "Palma",
  "Pamela",
  "Pansy",
  "Paolo",
  "Paris",
  "Parker",
  "Pascale",
  "Pasquale",
  "Pat",
  "Patience",
  "Patricia",
  "Patrick",
  "Patsy",
  "Pattie",
  "Paul",
  "Paula",
  "Pauline",
  "Paxton",
  "Payton",
  "Pearl",
  "Pearlie",
  "Pearline",
  "Pedro",
  "Peggie",
  "Penelope",
  "Percival",
  "Percy",
  "Perry",
  "Pete",
  "Peter",
  "Petra",
  "Peyton",
  "Philip",
  "Phoebe",
  "Phyllis",
  "Pierce",
  "Pierre",
  "Pietro",
  "Pink",
  "Pinkie",
  "Piper",
  "Polly",
  "Porter",
  "Precious",
  "Presley",
  "Preston",
  "Price",
  "Prince",
  "Princess",
  "Priscilla",
  "Providenci",
  "Prudence",
  "Queen",
  "Queenie",
  "Quentin",
  "Quincy",
  "Quinn",
  "Quinten",
  "Quinton",
  "Rachael",
  "Rachel",
  "Rachelle",
  "Rae",
  "Raegan",
  "Rafael",
  "Rafaela",
  "Raheem",
  "Rahsaan",
  "Rahul",
  "Raina",
  "Raleigh",
  "Ralph",
  "Ramiro",
  "Ramon",
  "Ramona",
  "Randal",
  "Randall",
  "Randi",
  "Randy",
  "Ransom",
  "Raoul",
  "Raphael",
  "Raphaelle",
  "Raquel",
  "Rashad",
  "Rashawn",
  "Rasheed",
  "Raul",
  "Raven",
  "Ray",
  "Raymond",
  "Raymundo",
  "Reagan",
  "Reanna",
  "Reba",
  "Rebeca",
  "Rebecca",
  "Rebeka",
  "Rebekah",
  "Reece",
  "Reed",
  "Reese",
  "Regan",
  "Reggie",
  "Reginald",
  "Reid",
  "Reilly",
  "Reina",
  "Reinhold",
  "Remington",
  "Rene",
  "Renee",
  "Ressie",
  "Reta",
  "Retha",
  "Retta",
  "Reuben",
  "Reva",
  "Rex",
  "Rey",
  "Reyes",
  "Reymundo",
  "Reyna",
  "Reynold",
  "Rhea",
  "Rhett",
  "Rhianna",
  "Rhiannon",
  "Rhoda",
  "Ricardo",
  "Richard",
  "Richie",
  "Richmond",
  "Rick",
  "Rickey",
  "Rickie",
  "Ricky",
  "Rico",
  "Rigoberto",
  "Riley",
  "Rita",
  "River",
  "Robb",
  "Robbie",
  "Robert",
  "Roberta",
  "Roberto",
  "Robin",
  "Robyn",
  "Rocio",
  "Rocky",
  "Rod",
  "Roderick",
  "Rodger",
  "Rodolfo",
  "Rodrick",
  "Rodrigo",
  "Roel",
  "Rogelio",
  "Roger",
  "Rogers",
  "Rolando",
  "Rollin",
  "Roma",
  "Romaine",
  "Roman",
  "Ron",
  "Ronaldo",
  "Ronny",
  "Roosevelt",
  "Rory",
  "Rosa",
  "Rosalee",
  "Rosalia",
  "Rosalind",
  "Rosalinda",
  "Rosalyn",
  "Rosamond",
  "Rosanna",
  "Rosario",
  "Roscoe",
  "Rose",
  "Rosella",
  "Roselyn",
  "Rosemarie",
  "Rosemary",
  "Rosendo",
  "Rosetta",
  "Rosie",
  "Rosina",
  "Roslyn",
  "Ross",
  "Rossie",
  "Rowan",
  "Rowena",
  "Rowland",
  "Roxane",
  "Roxanne",
  "Roy",
  "Royal",
  "Royce",
  "Rozella",
  "Ruben",
  "Rubie",
  "Ruby",
  "Rubye",
  "Rudolph",
  "Rudy",
  "Rupert",
  "Russ",
  "Russel",
  "Russell",
  "Rusty",
  "Ruth",
  "Ruthe",
  "Ruthie",
  "Ryan",
  "Ryann",
  "Ryder",
  "Rylan",
  "Rylee",
  "Ryleigh",
  "Ryley",
  "Sabina",
  "Sabrina",
  "Sabryna",
  "Sadie",
  "Sadye",
  "Sage",
  "Saige",
  "Sallie",
  "Sally",
  "Salma",
  "Salvador",
  "Salvatore",
  "Sam",
  "Samanta",
  "Samantha",
  "Samara",
  "Samir",
  "Sammie",
  "Sammy",
  "Samson",
  "Sandra",
  "Sandrine",
  "Sandy",
  "Sanford",
  "Santa",
  "Santiago",
  "Santina",
  "Santino",
  "Santos",
  "Sarah",
  "Sarai",
  "Sarina",
  "Sasha",
  "Saul",
  "Savanah",
  "Savanna",
  "Savannah",
  "Savion",
  "Scarlett",
  "Schuyler",
  "Scot",
  "Scottie",
  "Scotty",
  "Seamus",
  "Sean",
  "Sebastian",
  "Sedrick",
  "Selena",
  "Selina",
  "Selmer",
  "Serena",
  "Serenity",
  "Seth",
  "Shad",
  "Shaina",
  "Shakira",
  "Shana",
  "Shane",
  "Shanel",
  "Shanelle",
  "Shania",
  "Shanie",
  "Shaniya",
  "Shanna",
  "Shannon",
  "Shanny",
  "Shanon",
  "Shany",
  "Sharon",
  "Shaun",
  "Shawn",
  "Shawna",
  "Shaylee",
  "Shayna",
  "Shayne",
  "Shea",
  "Sheila",
  "Sheldon",
  "Shemar",
  "Sheridan",
  "Sherman",
  "Sherwood",
  "Shirley",
  "Shyann",
  "Shyanne",
  "Sibyl",
  "Sid",
  "Sidney",
  "Sienna",
  "Sierra",
  "Sigmund",
  "Sigrid",
  "Sigurd",
  "Silas",
  "Sim",
  "Simeon",
  "Simone",
  "Sincere",
  "Sister",
  "Skye",
  "Skyla",
  "Skylar",
  "Sofia",
  "Soledad",
  "Solon",
  "Sonia",
  "Sonny",
  "Sonya",
  "Sophia",
  "Sophie",
  "Spencer",
  "Stacey",
  "Stacy",
  "Stan",
  "Stanford",
  "Stanley",
  "Stanton",
  "Stefan",
  "Stefanie",
  "Stella",
  "Stephan",
  "Stephania",
  "Stephanie",
  "Stephany",
  "Stephen",
  "Stephon",
  "Sterling",
  "Steve",
  "Stevie",
  "Stewart",
  "Stone",
  "Stuart",
  "Summer",
  "Sunny",
  "Susan",
  "Susana",
  "Susanna",
  "Susie",
  "Suzanne",
  "Sven",
  "Syble",
  "Sydnee",
  "Sydney",
  "Sydni",
  "Sydnie",
  "Sylvan",
  "Sylvester",
  "Sylvia",
  "Tabitha",
  "Tad",
  "Talia",
  "Talon",
  "Tamara",
  "Tamia",
  "Tania",
  "Tanner",
  "Tanya",
  "Tara",
  "Taryn",
  "Tate",
  "Tatum",
  "Tatyana",
  "Taurean",
  "Tavares",
  "Taya",
  "Taylor",
  "Teagan",
  "Ted",
  "Telly",
  "Terence",
  "Teresa",
  "Terrance",
  "Terrell",
  "Terrence",
  "Terrill",
  "Terry",
  "Tess",
  "Tessie",
  "Tevin",
  "Thad",
  "Thaddeus",
  "Thalia",
  "Thea",
  "Thelma",
  "Theo",
  "Theodora",
  "Theodore",
  "Theresa",
  "Therese",
  "Theresia",
  "Theron",
  "Thomas",
  "Thora",
  "Thurman",
  "Tia",
  "Tiana",
  "Tianna",
  "Tiara",
  "Tierra",
  "Tiffany",
  "Tillman",
  "Timmothy",
  "Timmy",
  "Timothy",
  "Tina",
  "Tito",
  "Titus",
  "Tobin",
  "Toby",
  "Tod",
  "Tom",
  "Tomas",
  "Tomasa",
  "Tommie",
  "Toney",
  "Toni",
  "Tony",
  "Torey",
  "Torrance",
  "Torrey",
  "Toy",
  "Trace",
  "Tracey",
  "Tracy",
  "Travis",
  "Travon",
  "Tre",
  "Tremaine",
  "Tremayne",
  "Trent",
  "Trenton",
  "Tressa",
  "Tressie",
  "Treva",
  "Trever",
  "Trevion",
  "Trevor",
  "Trey",
  "Trinity",
  "Trisha",
  "Tristian",
  "Tristin",
  "Triston",
  "Troy",
  "Trudie",
  "Trycia",
  "Trystan",
  "Turner",
  "Twila",
  "Tyler",
  "Tyra",
  "Tyree",
  "Tyreek",
  "Tyrel",
  "Tyrell",
  "Tyrese",
  "Tyrique",
  "Tyshawn",
  "Tyson",
  "Ubaldo",
  "Ulices",
  "Ulises",
  "Una",
  "Unique",
  "Urban",
  "Uriah",
  "Uriel",
  "Ursula",
  "Vada",
  "Valentin",
  "Valentina",
  "Valentine",
  "Valerie",
  "Vallie",
  "Van",
  "Vance",
  "Vanessa",
  "Vaughn",
  "Veda",
  "Velda",
  "Vella",
  "Velma",
  "Velva",
  "Vena",
  "Verda",
  "Verdie",
  "Vergie",
  "Verla",
  "Verlie",
  "Vern",
  "Verna",
  "Verner",
  "Vernice",
  "Vernie",
  "Vernon",
  "Verona",
  "Veronica",
  "Vesta",
  "Vicenta",
  "Vicente",
  "Vickie",
  "Vicky",
  "Victor",
  "Victoria",
  "Vida",
  "Vidal",
  "Vilma",
  "Vince",
  "Vincent",
  "Vincenza",
  "Vincenzo",
  "Vinnie",
  "Viola",
  "Violet",
  "Violette",
  "Virgie",
  "Virgil",
  "Virginia",
  "Virginie",
  "Vita",
  "Vito",
  "Viva",
  "Vivian",
  "Viviane",
  "Vivianne",
  "Vivien",
  "Vivienne",
  "Vladimir",
  "Wade",
  "Waino",
  "Waldo",
  "Walker",
  "Wallace",
  "Walter",
  "Walton",
  "Wanda",
  "Ward",
  "Warren",
  "Watson",
  "Wava",
  "Waylon",
  "Wayne",
  "Webster",
  "Weldon",
  "Wellington",
  "Wendell",
  "Wendy",
  "Werner",
  "Westley",
  "Weston",
  "Whitney",
  "Wilber",
  "Wilbert",
  "Wilburn",
  "Wiley",
  "Wilford",
  "Wilfred",
  "Wilfredo",
  "Wilfrid",
  "Wilhelm",
  "Wilhelmine",
  "Will",
  "Willa",
  "Willard",
  "William",
  "Willie",
  "Willis",
  "Willow",
  "Willy",
  "Wilma",
  "Wilmer",
  "Wilson",
  "Wilton",
  "Winfield",
  "Winifred",
  "Winnifred",
  "Winona",
  "Winston",
  "Woodrow",
  "Wyatt",
  "Wyman",
  "Xander",
  "Xavier",
  "Xzavier",
  "Yadira",
  "Yasmeen",
  "Yasmin",
  "Yasmine",
  "Yazmin",
  "Yesenia",
  "Yessenia",
  "Yolanda",
  "Yoshiko",
  "Yvette",
  "Yvonne",
  "Zachariah",
  "Zachary",
  "Zachery",
  "Zack",
  "Zackary",
  "Zackery",
  "Zakary",
  "Zander",
  "Zane",
  "Zaria",
  "Zechariah",
  "Zelda",
  "Zella",
  "Zelma",
  "Zena",
  "Zetta",
  "Zion",
  "Zita",
  "Zoe",
  "Zoey",
  "Zoie",
  "Zoila",
  "Zola",
  "Zora",
  "Zula"
];
const gender = [
  "Asexual",
  "Female to male trans man",
  "Female to male transgender man",
  "Female to male transsexual man",
  "F2M",
  "Gender neutral",
  "Hermaphrodite",
  "Intersex man",
  "Intersex person",
  "Intersex woman",
  "Male to female trans woman",
  "Male to female transgender woman",
  "Male to female transsexual woman",
  "Man",
  "M2F",
  "Polygender",
  "T* man",
  "T* woman",
  "Two* person",
  "Two-spirit person",
  "Woman",
  "Agender",
  "Androgyne",
  "Androgynes",
  "Androgynous",
  "Bigender",
  "Cis",
  "Cis Female",
  "Cis Male",
  "Cis Man",
  "Cis Woman",
  "Cisgender",
  "Cisgender Female",
  "Cisgender Male",
  "Cisgender Man",
  "Cisgender Woman",
  "Female to Male",
  "FTM",
  "Gender Fluid",
  "Gender Nonconforming",
  "Gender Questioning",
  "Gender Variant",
  "Genderqueer",
  "Intersex",
  "Male to Female",
  "MTF",
  "Neither",
  "Neutrois",
  "Non-binary",
  "Other",
  "Pangender",
  "Trans",
  "Trans Female",
  "Trans Male",
  "Trans Man",
  "Trans Person",
  "Trans*Female",
  "Trans*Male",
  "Trans*Man",
  "Trans*Person",
  "Trans*Woman",
  "Transexual",
  "Transexual Female",
  "Transexual Male",
  "Transexual Man",
  "Transexual Person",
  "Transexual Woman",
  "Transgender Female",
  "Transgender Person",
  "Transmasculine",
  "Two-spirit"
];
const last_name = [
  "Abbott",
  "Abernathy",
  "Abshire",
  "Adams",
  "Altenwerth",
  "Anderson",
  "Ankunding",
  "Armstrong",
  "Auer",
  "Aufderhar",
  "Bahringer",
  "Bailey",
  "Balistreri",
  "Barrows",
  "Bartell",
  "Bartoletti",
  "Barton",
  "Bashirian",
  "Batz",
  "Bauch",
  "Baumbach",
  "Bayer",
  "Beahan",
  "Beatty",
  "Bechtelar",
  "Becker",
  "Bednar",
  "Beer",
  "Beier",
  "Berge",
  "Bergnaum",
  "Bergstrom",
  "Bernhard",
  "Bernier",
  "Bins",
  "Blanda",
  "Blick",
  "Block",
  "Bode",
  "Boehm",
  "Bogan",
  "Bogisich",
  "Borer",
  "Bosco",
  "Botsford",
  "Boyer",
  "Boyle",
  "Bradtke",
  "Brakus",
  "Braun",
  "Breitenberg",
  "Brekke",
  "Brown",
  "Bruen",
  "Buckridge",
  "Carroll",
  "Carter",
  "Cartwright",
  "Casper",
  "Cassin",
  "Champlin",
  "Christiansen",
  "Cole",
  "Collier",
  "Collins",
  "Conn",
  "Connelly",
  "Conroy",
  "Considine",
  "Corkery",
  "Cormier",
  "Corwin",
  "Cremin",
  "Crist",
  "Crona",
  "Cronin",
  "Crooks",
  "Cruickshank",
  "Cummerata",
  "Cummings",
  "Dach",
  "D'Amore",
  "Daniel",
  "Dare",
  "Daugherty",
  "Davis",
  "Deckow",
  "Denesik",
  "Dibbert",
  "Dickens",
  "Dicki",
  "Dickinson",
  "Dietrich",
  "Donnelly",
  "Dooley",
  "Douglas",
  "Doyle",
  "DuBuque",
  "Durgan",
  "Ebert",
  "Effertz",
  "Emard",
  "Emmerich",
  "Erdman",
  "Ernser",
  "Fadel",
  "Fahey",
  "Farrell",
  "Fay",
  "Feeney",
  "Feest",
  "Feil",
  "Ferry",
  "Fisher",
  "Flatley",
  "Frami",
  "Franecki",
  "Franey",
  "Friesen",
  "Fritsch",
  "Funk",
  "Gaylord",
  "Gerhold",
  "Gerlach",
  "Gibson",
  "Gislason",
  "Gleason",
  "Gleichner",
  "Glover",
  "Goldner",
  "Goodwin",
  "Gorczany",
  "Gottlieb",
  "Goyette",
  "Grady",
  "Graham",
  "Grant",
  "Green",
  "Greenfelder",
  "Greenholt",
  "Grimes",
  "Gulgowski",
  "Gusikowski",
  "Gutkowski",
  "Gutmann",
  "Haag",
  "Hackett",
  "Hagenes",
  "Hahn",
  "Haley",
  "Halvorson",
  "Hamill",
  "Hammes",
  "Hand",
  "Hane",
  "Hansen",
  "Harber",
  "Harris",
  "Hartmann",
  "Harvey",
  "Hauck",
  "Hayes",
  "Heaney",
  "Heathcote",
  "Hegmann",
  "Heidenreich",
  "Heller",
  "Herman",
  "Hermann",
  "Hermiston",
  "Herzog",
  "Hessel",
  "Hettinger",
  "Hickle",
  "Hilll",
  "Hills",
  "Hilpert",
  "Hintz",
  "Hirthe",
  "Hodkiewicz",
  "Hoeger",
  "Homenick",
  "Hoppe",
  "Howe",
  "Howell",
  "Hudson",
  "Huel",
  "Huels",
  "Hyatt",
  "Jacobi",
  "Jacobs",
  "Jacobson",
  "Jakubowski",
  "Jaskolski",
  "Jast",
  "Jenkins",
  "Jerde",
  "Johns",
  "Johnson",
  "Johnston",
  "Jones",
  "Kassulke",
  "Kautzer",
  "Keebler",
  "Keeling",
  "Kemmer",
  "Kerluke",
  "Kertzmann",
  "Kessler",
  "Kiehn",
  "Kihn",
  "Kilback",
  "King",
  "Kirlin",
  "Klein",
  "Kling",
  "Klocko",
  "Koch",
  "Koelpin",
  "Koepp",
  "Kohler",
  "Konopelski",
  "Koss",
  "Kovacek",
  "Kozey",
  "Krajcik",
  "Kreiger",
  "Kris",
  "Kshlerin",
  "Kub",
  "Kuhic",
  "Kuhlman",
  "Kuhn",
  "Kulas",
  "Kunde",
  "Kunze",
  "Kuphal",
  "Kutch",
  "Kuvalis",
  "Labadie",
  "Lakin",
  "Lang",
  "Langosh",
  "Langworth",
  "Larkin",
  "Larson",
  "Leannon",
  "Lebsack",
  "Ledner",
  "Leffler",
  "Legros",
  "Lehner",
  "Lemke",
  "Lesch",
  "Leuschke",
  "Lind",
  "Lindgren",
  "Littel",
  "Little",
  "Lockman",
  "Lowe",
  "Lubowitz",
  "Lueilwitz",
  "Luettgen",
  "Lynch",
  "Macejkovic",
  "MacGyver",
  "Maggio",
  "Mann",
  "Mante",
  "Marks",
  "Marquardt",
  "Marvin",
  "Mayer",
  "Mayert",
  "McClure",
  "McCullough",
  "McDermott",
  "McGlynn",
  "McKenzie",
  "McLaughlin",
  "Medhurst",
  "Mertz",
  "Metz",
  "Miller",
  "Mills",
  "Mitchell",
  "Moen",
  "Mohr",
  "Monahan",
  "Moore",
  "Morar",
  "Morissette",
  "Mosciski",
  "Mraz",
  "Mueller",
  "Muller",
  "Murazik",
  "Murphy",
  "Murray",
  "Nader",
  "Nicolas",
  "Nienow",
  "Nikolaus",
  "Nitzsche",
  "Nolan",
  "Oberbrunner",
  "O'Connell",
  "O'Conner",
  "O'Hara",
  "O'Keefe",
  "O'Kon",
  "Okuneva",
  "Olson",
  "Ondricka",
  "O'Reilly",
  "Orn",
  "Ortiz",
  "Osinski",
  "Pacocha",
  "Padberg",
  "Pagac",
  "Parisian",
  "Parker",
  "Paucek",
  "Pfannerstill",
  "Pfeffer",
  "Pollich",
  "Pouros",
  "Powlowski",
  "Predovic",
  "Price",
  "Prohaska",
  "Prosacco",
  "Purdy",
  "Quigley",
  "Quitzon",
  "Rath",
  "Ratke",
  "Rau",
  "Raynor",
  "Reichel",
  "Reichert",
  "Reilly",
  "Reinger",
  "Rempel",
  "Renner",
  "Reynolds",
  "Rice",
  "Rippin",
  "Ritchie",
  "Robel",
  "Roberts",
  "Rodriguez",
  "Rogahn",
  "Rohan",
  "Rolfson",
  "Romaguera",
  "Roob",
  "Rosenbaum",
  "Rowe",
  "Ruecker",
  "Runolfsdottir",
  "Runolfsson",
  "Runte",
  "Russel",
  "Rutherford",
  "Ryan",
  "Sanford",
  "Satterfield",
  "Sauer",
  "Sawayn",
  "Schaden",
  "Schaefer",
  "Schamberger",
  "Schiller",
  "Schimmel",
  "Schinner",
  "Schmeler",
  "Schmidt",
  "Schmitt",
  "Schneider",
  "Schoen",
  "Schowalter",
  "Schroeder",
  "Schulist",
  "Schultz",
  "Schumm",
  "Schuppe",
  "Schuster",
  "Senger",
  "Shanahan",
  "Shields",
  "Simonis",
  "Sipes",
  "Skiles",
  "Smith",
  "Smitham",
  "Spencer",
  "Spinka",
  "Sporer",
  "Stamm",
  "Stanton",
  "Stark",
  "Stehr",
  "Steuber",
  "Stiedemann",
  "Stokes",
  "Stoltenberg",
  "Stracke",
  "Streich",
  "Stroman",
  "Strosin",
  "Swaniawski",
  "Swift",
  "Terry",
  "Thiel",
  "Thompson",
  "Tillman",
  "Torp",
  "Torphy",
  "Towne",
  "Toy",
  "Trantow",
  "Tremblay",
  "Treutel",
  "Tromp",
  "Turcotte",
  "Turner",
  "Ullrich",
  "Upton",
  "Vandervort",
  "Veum",
  "Volkman",
  "Von",
  "VonRueden",
  "Waelchi",
  "Walker",
  "Walsh",
  "Walter",
  "Ward",
  "Waters",
  "Watsica",
  "Weber",
  "Wehner",
  "Weimann",
  "Weissnat",
  "Welch",
  "West",
  "White",
  "Wiegand",
  "Wilderman",
  "Wilkinson",
  "Will",
  "Williamson",
  "Willms",
  "Windler",
  "Wintheiser",
  "Wisoky",
  "Wisozk",
  "Witting",
  "Wiza",
  "Wolf",
  "Wolff",
  "Wuckert",
  "Wunsch",
  "Wyman",
  "Yost",
  "Yundt",
  "Zboncak",
  "Zemlak",
  "Ziemann",
  "Zieme",
  "Zulauf"
];
const male_first_name = [
  "James",
  "John",
  "Robert",
  "Michael",
  "William",
  "David",
  "Richard",
  "Charles",
  "Joseph",
  "Thomas",
  "Christopher",
  "Daniel",
  "Paul",
  "Mark",
  "Donald",
  "George",
  "Kenneth",
  "Steven",
  "Edward",
  "Brian",
  "Ronald",
  "Anthony",
  "Kevin",
  "Jason",
  "Matthew",
  "Gary",
  "Timothy",
  "Jose",
  "Larry",
  "Jeffrey",
  "Frank",
  "Scott",
  "Eric",
  "Stephen",
  "Andrew",
  "Raymond",
  "Gregory",
  "Joshua",
  "Jerry",
  "Dennis",
  "Walter",
  "Patrick",
  "Peter",
  "Harold",
  "Douglas",
  "Henry",
  "Carl",
  "Arthur",
  "Ryan",
  "Roger",
  "Joe",
  "Juan",
  "Jack",
  "Albert",
  "Jonathan",
  "Justin",
  "Terry",
  "Gerald",
  "Keith",
  "Samuel",
  "Willie",
  "Ralph",
  "Lawrence",
  "Nicholas",
  "Roy",
  "Benjamin",
  "Bruce",
  "Brandon",
  "Adam",
  "Harry",
  "Fred",
  "Wayne",
  "Billy",
  "Steve",
  "Louis",
  "Jeremy",
  "Aaron",
  "Randy",
  "Howard",
  "Eugene",
  "Carlos",
  "Russell",
  "Bobby",
  "Victor",
  "Martin",
  "Ernest",
  "Phillip",
  "Todd",
  "Jesse",
  "Craig",
  "Alan",
  "Shawn",
  "Clarence",
  "Sean",
  "Philip",
  "Chris",
  "Johnny",
  "Earl",
  "Jimmy",
  "Antonio",
  "Danny",
  "Bryan",
  "Tony",
  "Luis",
  "Mike",
  "Stanley",
  "Leonard",
  "Nathan",
  "Dale",
  "Manuel",
  "Rodney",
  "Curtis",
  "Norman",
  "Allen",
  "Marvin",
  "Vincent",
  "Glenn",
  "Jeffery",
  "Travis",
  "Jeff",
  "Chad",
  "Jacob",
  "Lee",
  "Melvin",
  "Alfred",
  "Kyle",
  "Francis",
  "Bradley",
  "Jesus",
  "Herbert",
  "Frederick",
  "Ray",
  "Joel",
  "Edwin",
  "Don",
  "Eddie",
  "Ricky",
  "Troy",
  "Randall",
  "Barry",
  "Alexander",
  "Bernard",
  "Mario",
  "Leroy",
  "Francisco",
  "Marcus",
  "Micheal",
  "Theodore",
  "Clifford",
  "Miguel",
  "Oscar",
  "Jay",
  "Jim",
  "Tom",
  "Calvin",
  "Alex",
  "Jon",
  "Ronnie",
  "Bill",
  "Lloyd",
  "Tommy",
  "Leon",
  "Derek",
  "Warren",
  "Darrell",
  "Jerome",
  "Floyd",
  "Leo",
  "Alvin",
  "Tim",
  "Wesley",
  "Gordon",
  "Dean",
  "Greg",
  "Jorge",
  "Dustin",
  "Pedro",
  "Derrick",
  "Dan",
  "Lewis",
  "Zachary",
  "Corey",
  "Herman",
  "Maurice",
  "Vernon",
  "Roberto",
  "Clyde",
  "Glen",
  "Hector",
  "Shane",
  "Ricardo",
  "Sam",
  "Rick",
  "Lester",
  "Brent",
  "Ramon",
  "Charlie",
  "Tyler",
  "Gilbert",
  "Gene",
  "Marc",
  "Reginald",
  "Ruben",
  "Brett",
  "Angel",
  "Nathaniel",
  "Rafael",
  "Leslie",
  "Edgar",
  "Milton",
  "Raul",
  "Ben",
  "Chester",
  "Cecil",
  "Duane",
  "Franklin",
  "Andre",
  "Elmer",
  "Brad",
  "Gabriel",
  "Ron",
  "Mitchell",
  "Roland",
  "Arnold",
  "Harvey",
  "Jared",
  "Adrian",
  "Karl",
  "Cory",
  "Claude",
  "Erik",
  "Darryl",
  "Jamie",
  "Neil",
  "Jessie",
  "Christian",
  "Javier",
  "Fernando",
  "Clinton",
  "Ted",
  "Mathew",
  "Tyrone",
  "Darren",
  "Lonnie",
  "Lance",
  "Cody",
  "Julio",
  "Kelly",
  "Kurt",
  "Allan",
  "Nelson",
  "Guy",
  "Clayton",
  "Hugh",
  "Max",
  "Dwayne",
  "Dwight",
  "Armando",
  "Felix",
  "Jimmie",
  "Everett",
  "Jordan",
  "Ian",
  "Wallace",
  "Ken",
  "Bob",
  "Jaime",
  "Casey",
  "Alfredo",
  "Alberto",
  "Dave",
  "Ivan",
  "Johnnie",
  "Sidney",
  "Byron",
  "Julian",
  "Isaac",
  "Morris",
  "Clifton",
  "Willard",
  "Daryl",
  "Ross",
  "Virgil",
  "Andy",
  "Marshall",
  "Salvador",
  "Perry",
  "Kirk",
  "Sergio",
  "Marion",
  "Tracy",
  "Seth",
  "Kent",
  "Terrance",
  "Rene",
  "Eduardo",
  "Terrence",
  "Enrique",
  "Freddie",
  "Wade",
  "Austin",
  "Stuart",
  "Fredrick",
  "Arturo",
  "Alejandro",
  "Jackie",
  "Joey",
  "Nick",
  "Luther",
  "Wendell",
  "Jeremiah",
  "Evan",
  "Julius",
  "Dana",
  "Donnie",
  "Otis",
  "Shannon",
  "Trevor",
  "Oliver",
  "Luke",
  "Homer",
  "Gerard",
  "Doug",
  "Kenny",
  "Hubert",
  "Angelo",
  "Shaun",
  "Lyle",
  "Matt",
  "Lynn",
  "Alfonso",
  "Orlando",
  "Rex",
  "Carlton",
  "Ernesto",
  "Cameron",
  "Neal",
  "Pablo",
  "Lorenzo",
  "Omar",
  "Wilbur",
  "Blake",
  "Grant",
  "Horace",
  "Roderick",
  "Kerry",
  "Abraham",
  "Willis",
  "Rickey",
  "Jean",
  "Ira",
  "Andres",
  "Cesar",
  "Johnathan",
  "Malcolm",
  "Rudolph",
  "Damon",
  "Kelvin",
  "Rudy",
  "Preston",
  "Alton",
  "Archie",
  "Marco",
  "Wm",
  "Pete",
  "Randolph",
  "Garry",
  "Geoffrey",
  "Jonathon",
  "Felipe",
  "Bennie",
  "Gerardo",
  "Ed",
  "Dominic",
  "Robin",
  "Loren",
  "Delbert",
  "Colin",
  "Guillermo",
  "Earnest",
  "Lucas",
  "Benny",
  "Noel",
  "Spencer",
  "Rodolfo",
  "Myron",
  "Edmund",
  "Garrett",
  "Salvatore",
  "Cedric",
  "Lowell",
  "Gregg",
  "Sherman",
  "Wilson",
  "Devin",
  "Sylvester",
  "Kim",
  "Roosevelt",
  "Israel",
  "Jermaine",
  "Forrest",
  "Wilbert",
  "Leland",
  "Simon",
  "Guadalupe",
  "Clark",
  "Irving",
  "Carroll",
  "Bryant",
  "Owen",
  "Rufus",
  "Woodrow",
  "Sammy",
  "Kristopher",
  "Mack",
  "Levi",
  "Marcos",
  "Gustavo",
  "Jake",
  "Lionel",
  "Marty",
  "Taylor",
  "Ellis",
  "Dallas",
  "Gilberto",
  "Clint",
  "Nicolas",
  "Laurence",
  "Ismael",
  "Orville",
  "Drew",
  "Jody",
  "Ervin",
  "Dewey",
  "Al",
  "Wilfred",
  "Josh",
  "Hugo",
  "Ignacio",
  "Caleb",
  "Tomas",
  "Sheldon",
  "Erick",
  "Frankie",
  "Stewart",
  "Doyle",
  "Darrel",
  "Rogelio",
  "Terence",
  "Santiago",
  "Alonzo",
  "Elias",
  "Bert",
  "Elbert",
  "Ramiro",
  "Conrad",
  "Pat",
  "Noah",
  "Grady",
  "Phil",
  "Cornelius",
  "Lamar",
  "Rolando",
  "Clay",
  "Percy",
  "Dexter",
  "Bradford",
  "Merle",
  "Darin",
  "Amos",
  "Terrell",
  "Moses",
  "Irvin",
  "Saul",
  "Roman",
  "Darnell",
  "Randal",
  "Tommie",
  "Timmy",
  "Darrin",
  "Winston",
  "Brendan",
  "Toby",
  "Van",
  "Abel",
  "Dominick",
  "Boyd",
  "Courtney",
  "Jan",
  "Emilio",
  "Elijah",
  "Cary",
  "Domingo",
  "Santos",
  "Aubrey",
  "Emmett",
  "Marlon",
  "Emanuel",
  "Jerald",
  "Edmond"
];
const male_middle_name = [
  "Ace",
  "Aiden",
  "Alexander",
  "Ander",
  "Anthony",
  "Asher",
  "August",
  "Aziel",
  "Bear",
  "Beckham",
  "Benjamin",
  "Buddy",
  "Calvin",
  "Carter",
  "Charles",
  "Christopher",
  "Clyde",
  "Cooper",
  "Daniel",
  "David",
  "Dior",
  "Dylan",
  "Elijah",
  "Ellis",
  "Emerson",
  "Ethan",
  "Ezra",
  "Fletcher",
  "Flynn",
  "Gabriel",
  "Grayson",
  "Gus",
  "Hank",
  "Harrison",
  "Hendrix",
  "Henry",
  "Houston",
  "Hudson",
  "Hugh",
  "Isaac",
  "Jack",
  "Jackson",
  "Jacob",
  "Jakobe",
  "James",
  "Jaxon",
  "Jaxtyn",
  "Jayden",
  "John",
  "Joseph",
  "Josiah",
  "Jude",
  "Julian",
  "Karsyn",
  "Kenji",
  "Kobe",
  "Kylo",
  "Lennon",
  "Leo",
  "Levi",
  "Liam",
  "Lincoln",
  "Logan",
  "Louis",
  "Lucas",
  "Lucky",
  "Luke",
  "Mason",
  "Mateo",
  "Matthew",
  "Maverick",
  "Michael",
  "Monroe",
  "Nixon",
  "Ocean",
  "Oliver",
  "Otis",
  "Otto",
  "Owen",
  "Ozzy",
  "Parker",
  "Rocky",
  "Samuel",
  "Sebastian",
  "Sonny",
  "Teddy",
  "Theo",
  "Theodore",
  "Thomas",
  "Truett",
  "Walter",
  "Warren",
  "Watson",
  "William",
  "Wison",
  "Wyatt",
  "Ziggy",
  "Zyair"
];
const middle_name = [
  "Addison",
  "Alex",
  "Anderson",
  "Angel",
  "Arden",
  "August",
  "Austin",
  "Avery",
  "Bailey",
  "Billie",
  "Blake",
  "Bowie",
  "Brooklyn",
  "Cameron",
  "Charlie",
  "Corey",
  "Dakota",
  "Drew",
  "Elliott",
  "Ellis",
  "Emerson",
  "Finley",
  "Gray",
  "Greer",
  "Harper",
  "Hayden",
  "Jaden",
  "James",
  "Jamie",
  "Jordan",
  "Jules",
  "Kai",
  "Kendall",
  "Kennedy",
  "Kyle",
  "Leslie",
  "Logan",
  "London",
  "Marlowe",
  "Micah",
  "Nico",
  "Noah",
  "North",
  "Parker",
  "Phoenix",
  "Quinn",
  "Reagan",
  "Reese",
  "Reign",
  "Riley",
  "River",
  "Robin",
  "Rory",
  "Rowan",
  "Ryan",
  "Sage",
  "Sasha",
  "Sawyer",
  "Shawn",
  "Shiloh",
  "Skyler",
  "Taylor"
];
const name_$1 = [
  "{{name.prefix}} {{name.first_name}} {{name.last_name}}",
  "{{name.first_name}} {{name.last_name}} {{name.suffix}}",
  "{{name.first_name}} {{name.last_name}}",
  "{{name.first_name}} {{name.last_name}}",
  "{{name.male_first_name}} {{name.last_name}}",
  "{{name.female_first_name}} {{name.last_name}}"
];
const prefix = ["Mr.", "Mrs.", "Ms.", "Miss", "Dr."];
const suffix = [
  "Jr.",
  "Sr.",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "MD",
  "DDS",
  "PhD",
  "DVM"
];
const title = {
  descriptor: [
    "Lead",
    "Senior",
    "Direct",
    "Corporate",
    "Dynamic",
    "Future",
    "Product",
    "National",
    "Regional",
    "District",
    "Central",
    "Global",
    "Customer",
    "Investor",
    "Dynamic",
    "International",
    "Legacy",
    "Forward",
    "Internal",
    "Human",
    "Chief",
    "Principal"
  ],
  level: [
    "Solutions",
    "Program",
    "Brand",
    "Security",
    "Research",
    "Marketing",
    "Directives",
    "Implementation",
    "Integration",
    "Functionality",
    "Response",
    "Paradigm",
    "Tactics",
    "Identity",
    "Markets",
    "Group",
    "Division",
    "Applications",
    "Optimization",
    "Operations",
    "Infrastructure",
    "Intranet",
    "Communications",
    "Web",
    "Branding",
    "Quality",
    "Assurance",
    "Mobility",
    "Accounts",
    "Data",
    "Creative",
    "Configuration",
    "Accountability",
    "Interactions",
    "Factors",
    "Usability",
    "Metrics"
  ],
  job: [
    "Supervisor",
    "Associate",
    "Executive",
    "Liaison",
    "Officer",
    "Manager",
    "Engineer",
    "Specialist",
    "Director",
    "Coordinator",
    "Administrator",
    "Architect",
    "Analyst",
    "Designer",
    "Planner",
    "Orchestrator",
    "Technician",
    "Developer",
    "Producer",
    "Consultant",
    "Assistant",
    "Facilitator",
    "Agent",
    "Representative",
    "Strategist"
  ]
};
const name = {
  binary_gender,
  female_first_name,
  female_middle_name,
  first_name,
  gender,
  last_name,
  male_first_name,
  male_middle_name,
  middle_name,
  name: name_$1,
  prefix,
  suffix,
  title
};
const formats = [
  "!##-!##-####",
  "(!##) !##-####",
  "1-!##-!##-####",
  "!##.!##.####",
  "!##-!##-####",
  "(!##) !##-####",
  "1-!##-!##-####",
  "!##.!##.####",
  "!##-!##-#### x###",
  "(!##) !##-#### x###",
  "1-!##-!##-#### x###",
  "!##.!##.#### x###",
  "!##-!##-#### x####",
  "(!##) !##-#### x####",
  "1-!##-!##-#### x####",
  "!##.!##.#### x####",
  "!##-!##-#### x#####",
  "(!##) !##-#### x#####",
  "1-!##-!##-#### x#####",
  "!##.!##.#### x#####"
];
const phone_number = {
  formats
};
const chemicalElement = Object.freeze([
  {
    symbol: "H",
    name: "Hydrogen",
    atomicNumber: 1
  },
  {
    symbol: "He",
    name: "Helium",
    atomicNumber: 2
  },
  {
    symbol: "Li",
    name: "Lithium",
    atomicNumber: 3
  },
  {
    symbol: "Be",
    name: "Beryllium",
    atomicNumber: 4
  },
  {
    symbol: "B",
    name: "Boron",
    atomicNumber: 5
  },
  {
    symbol: "C",
    name: "Carbon",
    atomicNumber: 6
  },
  {
    symbol: "N",
    name: "Nitrogen",
    atomicNumber: 7
  },
  {
    symbol: "O",
    name: "Oxygen",
    atomicNumber: 8
  },
  {
    symbol: "F",
    name: "Fluorine",
    atomicNumber: 9
  },
  {
    symbol: "Ne",
    name: "Neon",
    atomicNumber: 10
  },
  {
    symbol: "Na",
    name: "Sodium",
    atomicNumber: 11
  },
  {
    symbol: "Mg",
    name: "Magnesium",
    atomicNumber: 12
  },
  {
    symbol: "Al",
    name: "Aluminium",
    atomicNumber: 13
  },
  {
    symbol: "Si",
    name: "Silicon",
    atomicNumber: 14
  },
  {
    symbol: "P",
    name: "Phosphorus",
    atomicNumber: 15
  },
  {
    symbol: "S",
    name: "Sulfur",
    atomicNumber: 16
  },
  {
    symbol: "Cl",
    name: "Chlorine",
    atomicNumber: 17
  },
  {
    symbol: "Ar",
    name: "Argon",
    atomicNumber: 18
  },
  {
    symbol: "K",
    name: "Potassium",
    atomicNumber: 19
  },
  {
    symbol: "Ca",
    name: "Calcium",
    atomicNumber: 20
  },
  {
    symbol: "Sc",
    name: "Scandium",
    atomicNumber: 21
  },
  {
    symbol: "Ti",
    name: "Titanium",
    atomicNumber: 22
  },
  {
    symbol: "V",
    name: "Vanadium",
    atomicNumber: 23
  },
  {
    symbol: "Cr",
    name: "Chromium",
    atomicNumber: 24
  },
  {
    symbol: "Mn",
    name: "Manganese",
    atomicNumber: 25
  },
  {
    symbol: "Fe",
    name: "Iron",
    atomicNumber: 26
  },
  {
    symbol: "Co",
    name: "Cobalt",
    atomicNumber: 27
  },
  {
    symbol: "Ni",
    name: "Nickel",
    atomicNumber: 28
  },
  {
    symbol: "Cu",
    name: "Copper",
    atomicNumber: 29
  },
  {
    symbol: "Zn",
    name: "Zinc",
    atomicNumber: 30
  },
  {
    symbol: "Ga",
    name: "Gallium",
    atomicNumber: 31
  },
  {
    symbol: "Ge",
    name: "Germanium",
    atomicNumber: 32
  },
  {
    symbol: "As",
    name: "Arsenic",
    atomicNumber: 33
  },
  {
    symbol: "Se",
    name: "Selenium",
    atomicNumber: 34
  },
  {
    symbol: "Br",
    name: "Bromine",
    atomicNumber: 35
  },
  {
    symbol: "Kr",
    name: "Krypton",
    atomicNumber: 36
  },
  {
    symbol: "Rb",
    name: "Rubidium",
    atomicNumber: 37
  },
  {
    symbol: "Sr",
    name: "Strontium",
    atomicNumber: 38
  },
  {
    symbol: "Y",
    name: "Yttrium",
    atomicNumber: 39
  },
  {
    symbol: "Zr",
    name: "Zirconium",
    atomicNumber: 40
  },
  {
    symbol: "Nb",
    name: "Niobium",
    atomicNumber: 41
  },
  {
    symbol: "Mo",
    name: "Molybdenum",
    atomicNumber: 42
  },
  {
    symbol: "Tc",
    name: "Technetium",
    atomicNumber: 43
  },
  {
    symbol: "Ru",
    name: "Ruthenium",
    atomicNumber: 44
  },
  {
    symbol: "Rh",
    name: "Rhodium",
    atomicNumber: 45
  },
  {
    symbol: "Pd",
    name: "Palladium",
    atomicNumber: 46
  },
  {
    symbol: "Ag",
    name: "Silver",
    atomicNumber: 47
  },
  {
    symbol: "Cd",
    name: "Cadmium",
    atomicNumber: 48
  },
  {
    symbol: "In",
    name: "Indium",
    atomicNumber: 49
  },
  {
    symbol: "Sn",
    name: "Tin",
    atomicNumber: 50
  },
  {
    symbol: "Sb",
    name: "Antimony",
    atomicNumber: 51
  },
  {
    symbol: "Te",
    name: "Tellurium",
    atomicNumber: 52
  },
  {
    symbol: "I",
    name: "Iodine",
    atomicNumber: 53
  },
  {
    symbol: "Xe",
    name: "Xenon",
    atomicNumber: 54
  },
  {
    symbol: "Cs",
    name: "Caesium",
    atomicNumber: 55
  },
  {
    symbol: "Ba",
    name: "Barium",
    atomicNumber: 56
  },
  {
    symbol: "La",
    name: "Lanthanum",
    atomicNumber: 57
  },
  {
    symbol: "Ce",
    name: "Cerium",
    atomicNumber: 58
  },
  {
    symbol: "Pr",
    name: "Praseodymium",
    atomicNumber: 59
  },
  {
    symbol: "Nd",
    name: "Neodymium",
    atomicNumber: 60
  },
  {
    symbol: "Pm",
    name: "Promethium",
    atomicNumber: 61
  },
  {
    symbol: "Sm",
    name: "Samarium",
    atomicNumber: 62
  },
  {
    symbol: "Eu",
    name: "Europium",
    atomicNumber: 63
  },
  {
    symbol: "Gd",
    name: "Gadolinium",
    atomicNumber: 64
  },
  {
    symbol: "Tb",
    name: "Terbium",
    atomicNumber: 65
  },
  {
    symbol: "Dy",
    name: "Dysprosium",
    atomicNumber: 66
  },
  {
    symbol: "Ho",
    name: "Holmium",
    atomicNumber: 67
  },
  {
    symbol: "Er",
    name: "Erbium",
    atomicNumber: 68
  },
  {
    symbol: "Tm",
    name: "Thulium",
    atomicNumber: 69
  },
  {
    symbol: "Yb",
    name: "Ytterbium",
    atomicNumber: 70
  },
  {
    symbol: "Lu",
    name: "Lutetium",
    atomicNumber: 71
  },
  {
    symbol: "Hf",
    name: "Hafnium",
    atomicNumber: 72
  },
  {
    symbol: "Ta",
    name: "Tantalum",
    atomicNumber: 73
  },
  {
    symbol: "W",
    name: "Tungsten",
    atomicNumber: 74
  },
  {
    symbol: "Re",
    name: "Rhenium",
    atomicNumber: 75
  },
  {
    symbol: "Os",
    name: "Osmium",
    atomicNumber: 76
  },
  {
    symbol: "Ir",
    name: "Iridium",
    atomicNumber: 77
  },
  {
    symbol: "Pt",
    name: "Platinum",
    atomicNumber: 78
  },
  {
    symbol: "Au",
    name: "Gold",
    atomicNumber: 79
  },
  {
    symbol: "Hg",
    name: "Mercury",
    atomicNumber: 80
  },
  {
    symbol: "Tl",
    name: "Thallium",
    atomicNumber: 81
  },
  {
    symbol: "Pb",
    name: "Lead",
    atomicNumber: 82
  },
  {
    symbol: "Bi",
    name: "Bismuth",
    atomicNumber: 83
  },
  {
    symbol: "Po",
    name: "Polonium",
    atomicNumber: 84
  },
  {
    symbol: "At",
    name: "Astatine",
    atomicNumber: 85
  },
  {
    symbol: "Rn",
    name: "Radon",
    atomicNumber: 86
  },
  {
    symbol: "Fr",
    name: "Francium",
    atomicNumber: 87
  },
  {
    symbol: "Ra",
    name: "Radium",
    atomicNumber: 88
  },
  {
    symbol: "Ac",
    name: "Actinium",
    atomicNumber: 89
  },
  {
    symbol: "Th",
    name: "Thorium",
    atomicNumber: 90
  },
  {
    symbol: "Pa",
    name: "Protactinium",
    atomicNumber: 91
  },
  {
    symbol: "U",
    name: "Uranium",
    atomicNumber: 92
  },
  {
    symbol: "Np",
    name: "Neptunium",
    atomicNumber: 93
  },
  {
    symbol: "Pu",
    name: "Plutonium",
    atomicNumber: 94
  },
  {
    symbol: "Am",
    name: "Americium",
    atomicNumber: 95
  },
  {
    symbol: "Cm",
    name: "Curium",
    atomicNumber: 96
  },
  {
    symbol: "Bk",
    name: "Berkelium",
    atomicNumber: 97
  },
  {
    symbol: "Cf",
    name: "Californium",
    atomicNumber: 98
  },
  {
    symbol: "Es",
    name: "Einsteinium",
    atomicNumber: 99
  },
  {
    symbol: "Fm",
    name: "Fermium",
    atomicNumber: 100
  },
  {
    symbol: "Md",
    name: "Mendelevium",
    atomicNumber: 101
  },
  {
    symbol: "No",
    name: "Nobelium",
    atomicNumber: 102
  },
  {
    symbol: "Lr",
    name: "Lawrencium",
    atomicNumber: 103
  },
  {
    symbol: "Rf",
    name: "Rutherfordium",
    atomicNumber: 104
  },
  {
    symbol: "Db",
    name: "Dubnium",
    atomicNumber: 105
  },
  {
    symbol: "Sg",
    name: "Seaborgium",
    atomicNumber: 106
  },
  {
    symbol: "Bh",
    name: "Bohrium",
    atomicNumber: 107
  },
  {
    symbol: "Hs",
    name: "Hassium",
    atomicNumber: 108
  },
  {
    symbol: "Mt",
    name: "Meitnerium",
    atomicNumber: 109
  },
  {
    symbol: "Ds",
    name: "Darmstadtium",
    atomicNumber: 110
  },
  {
    symbol: "Rg",
    name: "Roentgenium",
    atomicNumber: 111
  },
  {
    symbol: "Cn",
    name: "Copernicium",
    atomicNumber: 112
  },
  {
    symbol: "Nh",
    name: "Nihonium",
    atomicNumber: 113
  },
  {
    symbol: "Fl",
    name: "Flerovium",
    atomicNumber: 114
  },
  {
    symbol: "Mc",
    name: "Moscovium",
    atomicNumber: 115
  },
  {
    symbol: "Lv",
    name: "Livermorium",
    atomicNumber: 116
  },
  {
    symbol: "Ts",
    name: "Tennessine",
    atomicNumber: 117
  },
  {
    symbol: "Og",
    name: "Oganesson",
    atomicNumber: 118
  }
]);
const unit = Object.freeze([
  {
    name: "meter",
    symbol: "m"
  },
  {
    name: "second",
    symbol: "s"
  },
  {
    name: "mole",
    symbol: "mol"
  },
  {
    name: "ampere",
    symbol: "A"
  },
  {
    name: "kelvin",
    symbol: "K"
  },
  {
    name: "candela",
    symbol: "cd"
  },
  {
    name: "kilogram",
    symbol: "kg"
  },
  {
    name: "radian",
    symbol: "rad"
  },
  {
    name: "hertz",
    symbol: "Hz"
  },
  {
    name: "newton",
    symbol: "N"
  },
  {
    name: "pascal",
    symbol: "Pa"
  },
  {
    name: "joule",
    symbol: "J"
  },
  {
    name: "watt",
    symbol: "W"
  },
  {
    name: "coulomb",
    symbol: "C"
  },
  {
    name: "volt",
    symbol: "V"
  },
  {
    name: "ohm",
    symbol: "\u03A9"
  },
  {
    name: "tesla",
    symbol: "T"
  },
  {
    name: "degree Celsius",
    symbol: "\xB0C"
  },
  {
    name: "lumen",
    symbol: "lm"
  },
  {
    name: "becquerel",
    symbol: "Bq"
  },
  {
    name: "gray",
    symbol: "Gy"
  },
  {
    name: "sievert",
    symbol: "Sv"
  }
]);
const science = {
  chemicalElement,
  unit
};
const directoryPaths = [
  "/Applications",
  "/bin",
  "/boot",
  "/boot/defaults",
  "/dev",
  "/etc",
  "/etc/defaults",
  "/etc/mail",
  "/etc/namedb",
  "/etc/periodic",
  "/etc/ppp",
  "/home",
  "/home/user",
  "/home/user/dir",
  "/lib",
  "/Library",
  "/lost+found",
  "/media",
  "/mnt",
  "/net",
  "/Network",
  "/opt",
  "/opt/bin",
  "/opt/include",
  "/opt/lib",
  "/opt/sbin",
  "/opt/share",
  "/private",
  "/private/tmp",
  "/private/var",
  "/proc",
  "/rescue",
  "/root",
  "/sbin",
  "/selinux",
  "/srv",
  "/sys",
  "/System",
  "/tmp",
  "/Users",
  "/usr",
  "/usr/X11R6",
  "/usr/bin",
  "/usr/include",
  "/usr/lib",
  "/usr/libdata",
  "/usr/libexec",
  "/usr/local/bin",
  "/usr/local/src",
  "/usr/obj",
  "/usr/ports",
  "/usr/sbin",
  "/usr/share",
  "/usr/src",
  "/var",
  "/var/log",
  "/var/mail",
  "/var/spool",
  "/var/tmp",
  "/var/yp"
];
const mimeTypes = {
  "application/1d-interleaved-parityfec": {
    source: "iana"
  },
  "application/3gpdash-qoe-report+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/3gpp-ims+xml": {
    source: "iana",
    compressible: true
  },
  "application/3gpphal+json": {
    source: "iana",
    compressible: true
  },
  "application/3gpphalforms+json": {
    source: "iana",
    compressible: true
  },
  "application/a2l": {
    source: "iana"
  },
  "application/ace+cbor": {
    source: "iana"
  },
  "application/activemessage": {
    source: "iana"
  },
  "application/activity+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-costmap+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-costmapfilter+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-directory+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-endpointcost+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-endpointcostparams+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-endpointprop+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-endpointpropparams+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-error+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-networkmap+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-networkmapfilter+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-updatestreamcontrol+json": {
    source: "iana",
    compressible: true
  },
  "application/alto-updatestreamparams+json": {
    source: "iana",
    compressible: true
  },
  "application/aml": {
    source: "iana"
  },
  "application/andrew-inset": {
    source: "iana",
    extensions: ["ez"]
  },
  "application/applefile": {
    source: "iana"
  },
  "application/applixware": {
    source: "apache",
    extensions: ["aw"]
  },
  "application/at+jwt": {
    source: "iana"
  },
  "application/atf": {
    source: "iana"
  },
  "application/atfx": {
    source: "iana"
  },
  "application/atom+xml": {
    source: "iana",
    compressible: true,
    extensions: ["atom"]
  },
  "application/atomcat+xml": {
    source: "iana",
    compressible: true,
    extensions: ["atomcat"]
  },
  "application/atomdeleted+xml": {
    source: "iana",
    compressible: true,
    extensions: ["atomdeleted"]
  },
  "application/atomicmail": {
    source: "iana"
  },
  "application/atomsvc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["atomsvc"]
  },
  "application/atsc-dwd+xml": {
    source: "iana",
    compressible: true,
    extensions: ["dwd"]
  },
  "application/atsc-dynamic-event-message": {
    source: "iana"
  },
  "application/atsc-held+xml": {
    source: "iana",
    compressible: true,
    extensions: ["held"]
  },
  "application/atsc-rdt+json": {
    source: "iana",
    compressible: true
  },
  "application/atsc-rsat+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rsat"]
  },
  "application/atxml": {
    source: "iana"
  },
  "application/auth-policy+xml": {
    source: "iana",
    compressible: true
  },
  "application/bacnet-xdd+zip": {
    source: "iana",
    compressible: false
  },
  "application/batch-smtp": {
    source: "iana"
  },
  "application/bdoc": {
    compressible: false,
    extensions: ["bdoc"]
  },
  "application/beep+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/calendar+json": {
    source: "iana",
    compressible: true
  },
  "application/calendar+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xcs"]
  },
  "application/call-completion": {
    source: "iana"
  },
  "application/cals-1840": {
    source: "iana"
  },
  "application/captive+json": {
    source: "iana",
    compressible: true
  },
  "application/cbor": {
    source: "iana"
  },
  "application/cbor-seq": {
    source: "iana"
  },
  "application/cccex": {
    source: "iana"
  },
  "application/ccmp+xml": {
    source: "iana",
    compressible: true
  },
  "application/ccxml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ccxml"]
  },
  "application/cdfx+xml": {
    source: "iana",
    compressible: true,
    extensions: ["cdfx"]
  },
  "application/cdmi-capability": {
    source: "iana",
    extensions: ["cdmia"]
  },
  "application/cdmi-container": {
    source: "iana",
    extensions: ["cdmic"]
  },
  "application/cdmi-domain": {
    source: "iana",
    extensions: ["cdmid"]
  },
  "application/cdmi-object": {
    source: "iana",
    extensions: ["cdmio"]
  },
  "application/cdmi-queue": {
    source: "iana",
    extensions: ["cdmiq"]
  },
  "application/cdni": {
    source: "iana"
  },
  "application/cea": {
    source: "iana"
  },
  "application/cea-2018+xml": {
    source: "iana",
    compressible: true
  },
  "application/cellml+xml": {
    source: "iana",
    compressible: true
  },
  "application/cfw": {
    source: "iana"
  },
  "application/city+json": {
    source: "iana",
    compressible: true
  },
  "application/clr": {
    source: "iana"
  },
  "application/clue+xml": {
    source: "iana",
    compressible: true
  },
  "application/clue_info+xml": {
    source: "iana",
    compressible: true
  },
  "application/cms": {
    source: "iana"
  },
  "application/cnrp+xml": {
    source: "iana",
    compressible: true
  },
  "application/coap-group+json": {
    source: "iana",
    compressible: true
  },
  "application/coap-payload": {
    source: "iana"
  },
  "application/commonground": {
    source: "iana"
  },
  "application/conference-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/cose": {
    source: "iana"
  },
  "application/cose-key": {
    source: "iana"
  },
  "application/cose-key-set": {
    source: "iana"
  },
  "application/cpl+xml": {
    source: "iana",
    compressible: true,
    extensions: ["cpl"]
  },
  "application/csrattrs": {
    source: "iana"
  },
  "application/csta+xml": {
    source: "iana",
    compressible: true
  },
  "application/cstadata+xml": {
    source: "iana",
    compressible: true
  },
  "application/csvm+json": {
    source: "iana",
    compressible: true
  },
  "application/cu-seeme": {
    source: "apache",
    extensions: ["cu"]
  },
  "application/cwt": {
    source: "iana"
  },
  "application/cybercash": {
    source: "iana"
  },
  "application/dart": {
    compressible: true
  },
  "application/dash+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mpd"]
  },
  "application/dash-patch+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mpp"]
  },
  "application/dashdelta": {
    source: "iana"
  },
  "application/davmount+xml": {
    source: "iana",
    compressible: true,
    extensions: ["davmount"]
  },
  "application/dca-rft": {
    source: "iana"
  },
  "application/dcd": {
    source: "iana"
  },
  "application/dec-dx": {
    source: "iana"
  },
  "application/dialog-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/dicom": {
    source: "iana"
  },
  "application/dicom+json": {
    source: "iana",
    compressible: true
  },
  "application/dicom+xml": {
    source: "iana",
    compressible: true
  },
  "application/dii": {
    source: "iana"
  },
  "application/dit": {
    source: "iana"
  },
  "application/dns": {
    source: "iana"
  },
  "application/dns+json": {
    source: "iana",
    compressible: true
  },
  "application/dns-message": {
    source: "iana"
  },
  "application/docbook+xml": {
    source: "apache",
    compressible: true,
    extensions: ["dbk"]
  },
  "application/dots+cbor": {
    source: "iana"
  },
  "application/dskpp+xml": {
    source: "iana",
    compressible: true
  },
  "application/dssc+der": {
    source: "iana",
    extensions: ["dssc"]
  },
  "application/dssc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xdssc"]
  },
  "application/dvcs": {
    source: "iana"
  },
  "application/ecmascript": {
    source: "iana",
    compressible: true,
    extensions: ["es", "ecma"]
  },
  "application/edi-consent": {
    source: "iana"
  },
  "application/edi-x12": {
    source: "iana",
    compressible: false
  },
  "application/edifact": {
    source: "iana",
    compressible: false
  },
  "application/efi": {
    source: "iana"
  },
  "application/elm+json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/elm+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.cap+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/emergencycalldata.comment+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.control+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.deviceinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.ecall.msd": {
    source: "iana"
  },
  "application/emergencycalldata.providerinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.serviceinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.subscriberinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/emergencycalldata.veds+xml": {
    source: "iana",
    compressible: true
  },
  "application/emma+xml": {
    source: "iana",
    compressible: true,
    extensions: ["emma"]
  },
  "application/emotionml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["emotionml"]
  },
  "application/encaprtp": {
    source: "iana"
  },
  "application/epp+xml": {
    source: "iana",
    compressible: true
  },
  "application/epub+zip": {
    source: "iana",
    compressible: false,
    extensions: ["epub"]
  },
  "application/eshop": {
    source: "iana"
  },
  "application/exi": {
    source: "iana",
    extensions: ["exi"]
  },
  "application/expect-ct-report+json": {
    source: "iana",
    compressible: true
  },
  "application/express": {
    source: "iana",
    extensions: ["exp"]
  },
  "application/fastinfoset": {
    source: "iana"
  },
  "application/fastsoap": {
    source: "iana"
  },
  "application/fdt+xml": {
    source: "iana",
    compressible: true,
    extensions: ["fdt"]
  },
  "application/fhir+json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/fhir+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/fido.trusted-apps+json": {
    compressible: true
  },
  "application/fits": {
    source: "iana"
  },
  "application/flexfec": {
    source: "iana"
  },
  "application/font-sfnt": {
    source: "iana"
  },
  "application/font-tdpfr": {
    source: "iana",
    extensions: ["pfr"]
  },
  "application/font-woff": {
    source: "iana",
    compressible: false
  },
  "application/framework-attributes+xml": {
    source: "iana",
    compressible: true
  },
  "application/geo+json": {
    source: "iana",
    compressible: true,
    extensions: ["geojson"]
  },
  "application/geo+json-seq": {
    source: "iana"
  },
  "application/geopackage+sqlite3": {
    source: "iana"
  },
  "application/geoxacml+xml": {
    source: "iana",
    compressible: true
  },
  "application/gltf-buffer": {
    source: "iana"
  },
  "application/gml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["gml"]
  },
  "application/gpx+xml": {
    source: "apache",
    compressible: true,
    extensions: ["gpx"]
  },
  "application/gxf": {
    source: "apache",
    extensions: ["gxf"]
  },
  "application/gzip": {
    source: "iana",
    compressible: false,
    extensions: ["gz"]
  },
  "application/h224": {
    source: "iana"
  },
  "application/held+xml": {
    source: "iana",
    compressible: true
  },
  "application/hjson": {
    extensions: ["hjson"]
  },
  "application/http": {
    source: "iana"
  },
  "application/hyperstudio": {
    source: "iana",
    extensions: ["stk"]
  },
  "application/ibe-key-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/ibe-pkg-reply+xml": {
    source: "iana",
    compressible: true
  },
  "application/ibe-pp-data": {
    source: "iana"
  },
  "application/iges": {
    source: "iana"
  },
  "application/im-iscomposing+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/index": {
    source: "iana"
  },
  "application/index.cmd": {
    source: "iana"
  },
  "application/index.obj": {
    source: "iana"
  },
  "application/index.response": {
    source: "iana"
  },
  "application/index.vnd": {
    source: "iana"
  },
  "application/inkml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ink", "inkml"]
  },
  "application/iotp": {
    source: "iana"
  },
  "application/ipfix": {
    source: "iana",
    extensions: ["ipfix"]
  },
  "application/ipp": {
    source: "iana"
  },
  "application/isup": {
    source: "iana"
  },
  "application/its+xml": {
    source: "iana",
    compressible: true,
    extensions: ["its"]
  },
  "application/java-archive": {
    source: "apache",
    compressible: false,
    extensions: ["jar", "war", "ear"]
  },
  "application/java-serialized-object": {
    source: "apache",
    compressible: false,
    extensions: ["ser"]
  },
  "application/java-vm": {
    source: "apache",
    compressible: false,
    extensions: ["class"]
  },
  "application/javascript": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["js", "mjs"]
  },
  "application/jf2feed+json": {
    source: "iana",
    compressible: true
  },
  "application/jose": {
    source: "iana"
  },
  "application/jose+json": {
    source: "iana",
    compressible: true
  },
  "application/jrd+json": {
    source: "iana",
    compressible: true
  },
  "application/jscalendar+json": {
    source: "iana",
    compressible: true
  },
  "application/json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["json", "map"]
  },
  "application/json-patch+json": {
    source: "iana",
    compressible: true
  },
  "application/json-seq": {
    source: "iana"
  },
  "application/json5": {
    extensions: ["json5"]
  },
  "application/jsonml+json": {
    source: "apache",
    compressible: true,
    extensions: ["jsonml"]
  },
  "application/jwk+json": {
    source: "iana",
    compressible: true
  },
  "application/jwk-set+json": {
    source: "iana",
    compressible: true
  },
  "application/jwt": {
    source: "iana"
  },
  "application/kpml-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/kpml-response+xml": {
    source: "iana",
    compressible: true
  },
  "application/ld+json": {
    source: "iana",
    compressible: true,
    extensions: ["jsonld"]
  },
  "application/lgr+xml": {
    source: "iana",
    compressible: true,
    extensions: ["lgr"]
  },
  "application/link-format": {
    source: "iana"
  },
  "application/load-control+xml": {
    source: "iana",
    compressible: true
  },
  "application/lost+xml": {
    source: "iana",
    compressible: true,
    extensions: ["lostxml"]
  },
  "application/lostsync+xml": {
    source: "iana",
    compressible: true
  },
  "application/lpf+zip": {
    source: "iana",
    compressible: false
  },
  "application/lxf": {
    source: "iana"
  },
  "application/mac-binhex40": {
    source: "iana",
    extensions: ["hqx"]
  },
  "application/mac-compactpro": {
    source: "apache",
    extensions: ["cpt"]
  },
  "application/macwriteii": {
    source: "iana"
  },
  "application/mads+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mads"]
  },
  "application/manifest+json": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["webmanifest"]
  },
  "application/marc": {
    source: "iana",
    extensions: ["mrc"]
  },
  "application/marcxml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mrcx"]
  },
  "application/mathematica": {
    source: "iana",
    extensions: ["ma", "nb", "mb"]
  },
  "application/mathml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mathml"]
  },
  "application/mathml-content+xml": {
    source: "iana",
    compressible: true
  },
  "application/mathml-presentation+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-associated-procedure-description+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-deregister+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-envelope+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-msk+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-msk-response+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-protection-description+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-reception-report+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-register+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-register-response+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-schedule+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbms-user-service-description+xml": {
    source: "iana",
    compressible: true
  },
  "application/mbox": {
    source: "iana",
    extensions: ["mbox"]
  },
  "application/media-policy-dataset+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mpf"]
  },
  "application/media_control+xml": {
    source: "iana",
    compressible: true
  },
  "application/mediaservercontrol+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mscml"]
  },
  "application/merge-patch+json": {
    source: "iana",
    compressible: true
  },
  "application/metalink+xml": {
    source: "apache",
    compressible: true,
    extensions: ["metalink"]
  },
  "application/metalink4+xml": {
    source: "iana",
    compressible: true,
    extensions: ["meta4"]
  },
  "application/mets+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mets"]
  },
  "application/mf4": {
    source: "iana"
  },
  "application/mikey": {
    source: "iana"
  },
  "application/mipc": {
    source: "iana"
  },
  "application/missing-blocks+cbor-seq": {
    source: "iana"
  },
  "application/mmt-aei+xml": {
    source: "iana",
    compressible: true,
    extensions: ["maei"]
  },
  "application/mmt-usd+xml": {
    source: "iana",
    compressible: true,
    extensions: ["musd"]
  },
  "application/mods+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mods"]
  },
  "application/moss-keys": {
    source: "iana"
  },
  "application/moss-signature": {
    source: "iana"
  },
  "application/mosskey-data": {
    source: "iana"
  },
  "application/mosskey-request": {
    source: "iana"
  },
  "application/mp21": {
    source: "iana",
    extensions: ["m21", "mp21"]
  },
  "application/mp4": {
    source: "iana",
    extensions: ["mp4s", "m4p"]
  },
  "application/mpeg4-generic": {
    source: "iana"
  },
  "application/mpeg4-iod": {
    source: "iana"
  },
  "application/mpeg4-iod-xmt": {
    source: "iana"
  },
  "application/mrb-consumer+xml": {
    source: "iana",
    compressible: true
  },
  "application/mrb-publish+xml": {
    source: "iana",
    compressible: true
  },
  "application/msc-ivr+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/msc-mixer+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/msword": {
    source: "iana",
    compressible: false,
    extensions: ["doc", "dot"]
  },
  "application/mud+json": {
    source: "iana",
    compressible: true
  },
  "application/multipart-core": {
    source: "iana"
  },
  "application/mxf": {
    source: "iana",
    extensions: ["mxf"]
  },
  "application/n-quads": {
    source: "iana",
    extensions: ["nq"]
  },
  "application/n-triples": {
    source: "iana",
    extensions: ["nt"]
  },
  "application/nasdata": {
    source: "iana"
  },
  "application/news-checkgroups": {
    source: "iana",
    charset: "US-ASCII"
  },
  "application/news-groupinfo": {
    source: "iana",
    charset: "US-ASCII"
  },
  "application/news-transmission": {
    source: "iana"
  },
  "application/nlsml+xml": {
    source: "iana",
    compressible: true
  },
  "application/node": {
    source: "iana",
    extensions: ["cjs"]
  },
  "application/nss": {
    source: "iana"
  },
  "application/oauth-authz-req+jwt": {
    source: "iana"
  },
  "application/oblivious-dns-message": {
    source: "iana"
  },
  "application/ocsp-request": {
    source: "iana"
  },
  "application/ocsp-response": {
    source: "iana"
  },
  "application/octet-stream": {
    source: "iana",
    compressible: false,
    extensions: [
      "bin",
      "dms",
      "lrf",
      "mar",
      "so",
      "dist",
      "distz",
      "pkg",
      "bpk",
      "dump",
      "elc",
      "deploy",
      "exe",
      "dll",
      "deb",
      "dmg",
      "iso",
      "img",
      "msi",
      "msp",
      "msm",
      "buffer"
    ]
  },
  "application/oda": {
    source: "iana",
    extensions: ["oda"]
  },
  "application/odm+xml": {
    source: "iana",
    compressible: true
  },
  "application/odx": {
    source: "iana"
  },
  "application/oebps-package+xml": {
    source: "iana",
    compressible: true,
    extensions: ["opf"]
  },
  "application/ogg": {
    source: "iana",
    compressible: false,
    extensions: ["ogx"]
  },
  "application/omdoc+xml": {
    source: "apache",
    compressible: true,
    extensions: ["omdoc"]
  },
  "application/onenote": {
    source: "apache",
    extensions: ["onetoc", "onetoc2", "onetmp", "onepkg"]
  },
  "application/opc-nodeset+xml": {
    source: "iana",
    compressible: true
  },
  "application/oscore": {
    source: "iana"
  },
  "application/oxps": {
    source: "iana",
    extensions: ["oxps"]
  },
  "application/p21": {
    source: "iana"
  },
  "application/p21+zip": {
    source: "iana",
    compressible: false
  },
  "application/p2p-overlay+xml": {
    source: "iana",
    compressible: true,
    extensions: ["relo"]
  },
  "application/parityfec": {
    source: "iana"
  },
  "application/passport": {
    source: "iana"
  },
  "application/patch-ops-error+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xer"]
  },
  "application/pdf": {
    source: "iana",
    compressible: false,
    extensions: ["pdf"]
  },
  "application/pdx": {
    source: "iana"
  },
  "application/pem-certificate-chain": {
    source: "iana"
  },
  "application/pgp-encrypted": {
    source: "iana",
    compressible: false,
    extensions: ["pgp"]
  },
  "application/pgp-keys": {
    source: "iana",
    extensions: ["asc"]
  },
  "application/pgp-signature": {
    source: "iana",
    extensions: ["asc", "sig"]
  },
  "application/pics-rules": {
    source: "apache",
    extensions: ["prf"]
  },
  "application/pidf+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/pidf-diff+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/pkcs10": {
    source: "iana",
    extensions: ["p10"]
  },
  "application/pkcs12": {
    source: "iana"
  },
  "application/pkcs7-mime": {
    source: "iana",
    extensions: ["p7m", "p7c"]
  },
  "application/pkcs7-signature": {
    source: "iana",
    extensions: ["p7s"]
  },
  "application/pkcs8": {
    source: "iana",
    extensions: ["p8"]
  },
  "application/pkcs8-encrypted": {
    source: "iana"
  },
  "application/pkix-attr-cert": {
    source: "iana",
    extensions: ["ac"]
  },
  "application/pkix-cert": {
    source: "iana",
    extensions: ["cer"]
  },
  "application/pkix-crl": {
    source: "iana",
    extensions: ["crl"]
  },
  "application/pkix-pkipath": {
    source: "iana",
    extensions: ["pkipath"]
  },
  "application/pkixcmp": {
    source: "iana",
    extensions: ["pki"]
  },
  "application/pls+xml": {
    source: "iana",
    compressible: true,
    extensions: ["pls"]
  },
  "application/poc-settings+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/postscript": {
    source: "iana",
    compressible: true,
    extensions: ["ai", "eps", "ps"]
  },
  "application/ppsp-tracker+json": {
    source: "iana",
    compressible: true
  },
  "application/problem+json": {
    source: "iana",
    compressible: true
  },
  "application/problem+xml": {
    source: "iana",
    compressible: true
  },
  "application/provenance+xml": {
    source: "iana",
    compressible: true,
    extensions: ["provx"]
  },
  "application/prs.alvestrand.titrax-sheet": {
    source: "iana"
  },
  "application/prs.cww": {
    source: "iana",
    extensions: ["cww"]
  },
  "application/prs.cyn": {
    source: "iana",
    charset: "7-BIT"
  },
  "application/prs.hpub+zip": {
    source: "iana",
    compressible: false
  },
  "application/prs.nprend": {
    source: "iana"
  },
  "application/prs.plucker": {
    source: "iana"
  },
  "application/prs.rdf-xml-crypt": {
    source: "iana"
  },
  "application/prs.xsf+xml": {
    source: "iana",
    compressible: true
  },
  "application/pskc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["pskcxml"]
  },
  "application/pvd+json": {
    source: "iana",
    compressible: true
  },
  "application/qsig": {
    source: "iana"
  },
  "application/raml+yaml": {
    compressible: true,
    extensions: ["raml"]
  },
  "application/raptorfec": {
    source: "iana"
  },
  "application/rdap+json": {
    source: "iana",
    compressible: true
  },
  "application/rdf+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rdf", "owl"]
  },
  "application/reginfo+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rif"]
  },
  "application/relax-ng-compact-syntax": {
    source: "iana",
    extensions: ["rnc"]
  },
  "application/remote-printing": {
    source: "iana"
  },
  "application/reputon+json": {
    source: "iana",
    compressible: true
  },
  "application/resource-lists+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rl"]
  },
  "application/resource-lists-diff+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rld"]
  },
  "application/rfc+xml": {
    source: "iana",
    compressible: true
  },
  "application/riscos": {
    source: "iana"
  },
  "application/rlmi+xml": {
    source: "iana",
    compressible: true
  },
  "application/rls-services+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rs"]
  },
  "application/route-apd+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rapd"]
  },
  "application/route-s-tsid+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sls"]
  },
  "application/route-usd+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rusd"]
  },
  "application/rpki-ghostbusters": {
    source: "iana",
    extensions: ["gbr"]
  },
  "application/rpki-manifest": {
    source: "iana",
    extensions: ["mft"]
  },
  "application/rpki-publication": {
    source: "iana"
  },
  "application/rpki-roa": {
    source: "iana",
    extensions: ["roa"]
  },
  "application/rpki-updown": {
    source: "iana"
  },
  "application/rsd+xml": {
    source: "apache",
    compressible: true,
    extensions: ["rsd"]
  },
  "application/rss+xml": {
    source: "apache",
    compressible: true,
    extensions: ["rss"]
  },
  "application/rtf": {
    source: "iana",
    compressible: true,
    extensions: ["rtf"]
  },
  "application/rtploopback": {
    source: "iana"
  },
  "application/rtx": {
    source: "iana"
  },
  "application/samlassertion+xml": {
    source: "iana",
    compressible: true
  },
  "application/samlmetadata+xml": {
    source: "iana",
    compressible: true
  },
  "application/sarif+json": {
    source: "iana",
    compressible: true
  },
  "application/sarif-external-properties+json": {
    source: "iana",
    compressible: true
  },
  "application/sbe": {
    source: "iana"
  },
  "application/sbml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sbml"]
  },
  "application/scaip+xml": {
    source: "iana",
    compressible: true
  },
  "application/scim+json": {
    source: "iana",
    compressible: true
  },
  "application/scvp-cv-request": {
    source: "iana",
    extensions: ["scq"]
  },
  "application/scvp-cv-response": {
    source: "iana",
    extensions: ["scs"]
  },
  "application/scvp-vp-request": {
    source: "iana",
    extensions: ["spq"]
  },
  "application/scvp-vp-response": {
    source: "iana",
    extensions: ["spp"]
  },
  "application/sdp": {
    source: "iana",
    extensions: ["sdp"]
  },
  "application/secevent+jwt": {
    source: "iana"
  },
  "application/senml+cbor": {
    source: "iana"
  },
  "application/senml+json": {
    source: "iana",
    compressible: true
  },
  "application/senml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["senmlx"]
  },
  "application/senml-etch+cbor": {
    source: "iana"
  },
  "application/senml-etch+json": {
    source: "iana",
    compressible: true
  },
  "application/senml-exi": {
    source: "iana"
  },
  "application/sensml+cbor": {
    source: "iana"
  },
  "application/sensml+json": {
    source: "iana",
    compressible: true
  },
  "application/sensml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sensmlx"]
  },
  "application/sensml-exi": {
    source: "iana"
  },
  "application/sep+xml": {
    source: "iana",
    compressible: true
  },
  "application/sep-exi": {
    source: "iana"
  },
  "application/session-info": {
    source: "iana"
  },
  "application/set-payment": {
    source: "iana"
  },
  "application/set-payment-initiation": {
    source: "iana",
    extensions: ["setpay"]
  },
  "application/set-registration": {
    source: "iana"
  },
  "application/set-registration-initiation": {
    source: "iana",
    extensions: ["setreg"]
  },
  "application/sgml": {
    source: "iana"
  },
  "application/sgml-open-catalog": {
    source: "iana"
  },
  "application/shf+xml": {
    source: "iana",
    compressible: true,
    extensions: ["shf"]
  },
  "application/sieve": {
    source: "iana",
    extensions: ["siv", "sieve"]
  },
  "application/simple-filter+xml": {
    source: "iana",
    compressible: true
  },
  "application/simple-message-summary": {
    source: "iana"
  },
  "application/simplesymbolcontainer": {
    source: "iana"
  },
  "application/sipc": {
    source: "iana"
  },
  "application/slate": {
    source: "iana"
  },
  "application/smil": {
    source: "iana"
  },
  "application/smil+xml": {
    source: "iana",
    compressible: true,
    extensions: ["smi", "smil"]
  },
  "application/smpte336m": {
    source: "iana"
  },
  "application/soap+fastinfoset": {
    source: "iana"
  },
  "application/soap+xml": {
    source: "iana",
    compressible: true
  },
  "application/sparql-query": {
    source: "iana",
    extensions: ["rq"]
  },
  "application/sparql-results+xml": {
    source: "iana",
    compressible: true,
    extensions: ["srx"]
  },
  "application/spdx+json": {
    source: "iana",
    compressible: true
  },
  "application/spirits-event+xml": {
    source: "iana",
    compressible: true
  },
  "application/sql": {
    source: "iana"
  },
  "application/srgs": {
    source: "iana",
    extensions: ["gram"]
  },
  "application/srgs+xml": {
    source: "iana",
    compressible: true,
    extensions: ["grxml"]
  },
  "application/sru+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sru"]
  },
  "application/ssdl+xml": {
    source: "apache",
    compressible: true,
    extensions: ["ssdl"]
  },
  "application/ssml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ssml"]
  },
  "application/stix+json": {
    source: "iana",
    compressible: true
  },
  "application/swid+xml": {
    source: "iana",
    compressible: true,
    extensions: ["swidtag"]
  },
  "application/tamp-apex-update": {
    source: "iana"
  },
  "application/tamp-apex-update-confirm": {
    source: "iana"
  },
  "application/tamp-community-update": {
    source: "iana"
  },
  "application/tamp-community-update-confirm": {
    source: "iana"
  },
  "application/tamp-error": {
    source: "iana"
  },
  "application/tamp-sequence-adjust": {
    source: "iana"
  },
  "application/tamp-sequence-adjust-confirm": {
    source: "iana"
  },
  "application/tamp-status-query": {
    source: "iana"
  },
  "application/tamp-status-response": {
    source: "iana"
  },
  "application/tamp-update": {
    source: "iana"
  },
  "application/tamp-update-confirm": {
    source: "iana"
  },
  "application/tar": {
    compressible: true
  },
  "application/taxii+json": {
    source: "iana",
    compressible: true
  },
  "application/td+json": {
    source: "iana",
    compressible: true
  },
  "application/tei+xml": {
    source: "iana",
    compressible: true,
    extensions: ["tei", "teicorpus"]
  },
  "application/tetra_isi": {
    source: "iana"
  },
  "application/thraud+xml": {
    source: "iana",
    compressible: true,
    extensions: ["tfi"]
  },
  "application/timestamp-query": {
    source: "iana"
  },
  "application/timestamp-reply": {
    source: "iana"
  },
  "application/timestamped-data": {
    source: "iana",
    extensions: ["tsd"]
  },
  "application/tlsrpt+gzip": {
    source: "iana"
  },
  "application/tlsrpt+json": {
    source: "iana",
    compressible: true
  },
  "application/tnauthlist": {
    source: "iana"
  },
  "application/token-introspection+jwt": {
    source: "iana"
  },
  "application/toml": {
    compressible: true,
    extensions: ["toml"]
  },
  "application/trickle-ice-sdpfrag": {
    source: "iana"
  },
  "application/trig": {
    source: "iana",
    extensions: ["trig"]
  },
  "application/ttml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ttml"]
  },
  "application/tve-trigger": {
    source: "iana"
  },
  "application/tzif": {
    source: "iana"
  },
  "application/tzif-leap": {
    source: "iana"
  },
  "application/ubjson": {
    compressible: false,
    extensions: ["ubj"]
  },
  "application/ulpfec": {
    source: "iana"
  },
  "application/urc-grpsheet+xml": {
    source: "iana",
    compressible: true
  },
  "application/urc-ressheet+xml": {
    source: "iana",
    compressible: true,
    extensions: ["rsheet"]
  },
  "application/urc-targetdesc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["td"]
  },
  "application/urc-uisocketdesc+xml": {
    source: "iana",
    compressible: true
  },
  "application/vcard+json": {
    source: "iana",
    compressible: true
  },
  "application/vcard+xml": {
    source: "iana",
    compressible: true
  },
  "application/vemmi": {
    source: "iana"
  },
  "application/vividence.scriptfile": {
    source: "apache"
  },
  "application/vnd.1000minds.decision-model+xml": {
    source: "iana",
    compressible: true,
    extensions: ["1km"]
  },
  "application/vnd.3gpp-prose+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp-prose-pc3ch+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp-v2x-local-service-information": {
    source: "iana"
  },
  "application/vnd.3gpp.5gnas": {
    source: "iana"
  },
  "application/vnd.3gpp.access-transfer-events+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.bsf+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.gmop+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.gtpc": {
    source: "iana"
  },
  "application/vnd.3gpp.interworking-data": {
    source: "iana"
  },
  "application/vnd.3gpp.lpp": {
    source: "iana"
  },
  "application/vnd.3gpp.mc-signalling-ear": {
    source: "iana"
  },
  "application/vnd.3gpp.mcdata-affiliation-command+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcdata-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcdata-payload": {
    source: "iana"
  },
  "application/vnd.3gpp.mcdata-service-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcdata-signalling": {
    source: "iana"
  },
  "application/vnd.3gpp.mcdata-ue-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcdata-user-profile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-affiliation-command+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-floor-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-location-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-mbms-usage-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-service-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-signed+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-ue-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-ue-init-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcptt-user-profile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-affiliation-command+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-affiliation-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-location-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-mbms-usage-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-service-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-transmission-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-ue-config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mcvideo-user-profile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.mid-call+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.ngap": {
    source: "iana"
  },
  "application/vnd.3gpp.pfcp": {
    source: "iana"
  },
  "application/vnd.3gpp.pic-bw-large": {
    source: "iana",
    extensions: ["plb"]
  },
  "application/vnd.3gpp.pic-bw-small": {
    source: "iana",
    extensions: ["psb"]
  },
  "application/vnd.3gpp.pic-bw-var": {
    source: "iana",
    extensions: ["pvb"]
  },
  "application/vnd.3gpp.s1ap": {
    source: "iana"
  },
  "application/vnd.3gpp.sms": {
    source: "iana"
  },
  "application/vnd.3gpp.sms+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.srvcc-ext+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.srvcc-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.state-and-event-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp.ussd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp2.bcmcsinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.3gpp2.sms": {
    source: "iana"
  },
  "application/vnd.3gpp2.tcap": {
    source: "iana",
    extensions: ["tcap"]
  },
  "application/vnd.3lightssoftware.imagescal": {
    source: "iana"
  },
  "application/vnd.3m.post-it-notes": {
    source: "iana",
    extensions: ["pwn"]
  },
  "application/vnd.accpac.simply.aso": {
    source: "iana",
    extensions: ["aso"]
  },
  "application/vnd.accpac.simply.imp": {
    source: "iana",
    extensions: ["imp"]
  },
  "application/vnd.acucobol": {
    source: "iana",
    extensions: ["acu"]
  },
  "application/vnd.acucorp": {
    source: "iana",
    extensions: ["atc", "acutc"]
  },
  "application/vnd.adobe.air-application-installer-package+zip": {
    source: "apache",
    compressible: false,
    extensions: ["air"]
  },
  "application/vnd.adobe.flash.movie": {
    source: "iana"
  },
  "application/vnd.adobe.formscentral.fcdt": {
    source: "iana",
    extensions: ["fcdt"]
  },
  "application/vnd.adobe.fxp": {
    source: "iana",
    extensions: ["fxp", "fxpl"]
  },
  "application/vnd.adobe.partial-upload": {
    source: "iana"
  },
  "application/vnd.adobe.xdp+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xdp"]
  },
  "application/vnd.adobe.xfdf": {
    source: "iana",
    extensions: ["xfdf"]
  },
  "application/vnd.aether.imp": {
    source: "iana"
  },
  "application/vnd.afpc.afplinedata": {
    source: "iana"
  },
  "application/vnd.afpc.afplinedata-pagedef": {
    source: "iana"
  },
  "application/vnd.afpc.cmoca-cmresource": {
    source: "iana"
  },
  "application/vnd.afpc.foca-charset": {
    source: "iana"
  },
  "application/vnd.afpc.foca-codedfont": {
    source: "iana"
  },
  "application/vnd.afpc.foca-codepage": {
    source: "iana"
  },
  "application/vnd.afpc.modca": {
    source: "iana"
  },
  "application/vnd.afpc.modca-cmtable": {
    source: "iana"
  },
  "application/vnd.afpc.modca-formdef": {
    source: "iana"
  },
  "application/vnd.afpc.modca-mediummap": {
    source: "iana"
  },
  "application/vnd.afpc.modca-objectcontainer": {
    source: "iana"
  },
  "application/vnd.afpc.modca-overlay": {
    source: "iana"
  },
  "application/vnd.afpc.modca-pagesegment": {
    source: "iana"
  },
  "application/vnd.age": {
    source: "iana",
    extensions: ["age"]
  },
  "application/vnd.ah-barcode": {
    source: "iana"
  },
  "application/vnd.ahead.space": {
    source: "iana",
    extensions: ["ahead"]
  },
  "application/vnd.airzip.filesecure.azf": {
    source: "iana",
    extensions: ["azf"]
  },
  "application/vnd.airzip.filesecure.azs": {
    source: "iana",
    extensions: ["azs"]
  },
  "application/vnd.amadeus+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.amazon.ebook": {
    source: "apache",
    extensions: ["azw"]
  },
  "application/vnd.amazon.mobi8-ebook": {
    source: "iana"
  },
  "application/vnd.americandynamics.acc": {
    source: "iana",
    extensions: ["acc"]
  },
  "application/vnd.amiga.ami": {
    source: "iana",
    extensions: ["ami"]
  },
  "application/vnd.amundsen.maze+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.android.ota": {
    source: "iana"
  },
  "application/vnd.android.package-archive": {
    source: "apache",
    compressible: false,
    extensions: ["apk"]
  },
  "application/vnd.anki": {
    source: "iana"
  },
  "application/vnd.anser-web-certificate-issue-initiation": {
    source: "iana",
    extensions: ["cii"]
  },
  "application/vnd.anser-web-funds-transfer-initiation": {
    source: "apache",
    extensions: ["fti"]
  },
  "application/vnd.antix.game-component": {
    source: "iana",
    extensions: ["atx"]
  },
  "application/vnd.apache.arrow.file": {
    source: "iana"
  },
  "application/vnd.apache.arrow.stream": {
    source: "iana"
  },
  "application/vnd.apache.thrift.binary": {
    source: "iana"
  },
  "application/vnd.apache.thrift.compact": {
    source: "iana"
  },
  "application/vnd.apache.thrift.json": {
    source: "iana"
  },
  "application/vnd.api+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.aplextor.warrp+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.apothekende.reservation+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.apple.installer+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mpkg"]
  },
  "application/vnd.apple.keynote": {
    source: "iana",
    extensions: ["key"]
  },
  "application/vnd.apple.mpegurl": {
    source: "iana",
    extensions: ["m3u8"]
  },
  "application/vnd.apple.numbers": {
    source: "iana",
    extensions: ["numbers"]
  },
  "application/vnd.apple.pages": {
    source: "iana",
    extensions: ["pages"]
  },
  "application/vnd.apple.pkpass": {
    compressible: false,
    extensions: ["pkpass"]
  },
  "application/vnd.arastra.swi": {
    source: "iana"
  },
  "application/vnd.aristanetworks.swi": {
    source: "iana",
    extensions: ["swi"]
  },
  "application/vnd.artisan+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.artsquare": {
    source: "iana"
  },
  "application/vnd.astraea-software.iota": {
    source: "iana",
    extensions: ["iota"]
  },
  "application/vnd.audiograph": {
    source: "iana",
    extensions: ["aep"]
  },
  "application/vnd.autopackage": {
    source: "iana"
  },
  "application/vnd.avalon+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.avistar+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.balsamiq.bmml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["bmml"]
  },
  "application/vnd.balsamiq.bmpr": {
    source: "iana"
  },
  "application/vnd.banana-accounting": {
    source: "iana"
  },
  "application/vnd.bbf.usp.error": {
    source: "iana"
  },
  "application/vnd.bbf.usp.msg": {
    source: "iana"
  },
  "application/vnd.bbf.usp.msg+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.bekitzur-stech+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.bint.med-content": {
    source: "iana"
  },
  "application/vnd.biopax.rdf+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.blink-idb-value-wrapper": {
    source: "iana"
  },
  "application/vnd.blueice.multipass": {
    source: "iana",
    extensions: ["mpm"]
  },
  "application/vnd.bluetooth.ep.oob": {
    source: "iana"
  },
  "application/vnd.bluetooth.le.oob": {
    source: "iana"
  },
  "application/vnd.bmi": {
    source: "iana",
    extensions: ["bmi"]
  },
  "application/vnd.bpf": {
    source: "iana"
  },
  "application/vnd.bpf3": {
    source: "iana"
  },
  "application/vnd.businessobjects": {
    source: "iana",
    extensions: ["rep"]
  },
  "application/vnd.byu.uapi+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cab-jscript": {
    source: "iana"
  },
  "application/vnd.canon-cpdl": {
    source: "iana"
  },
  "application/vnd.canon-lips": {
    source: "iana"
  },
  "application/vnd.capasystems-pg+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cendio.thinlinc.clientconf": {
    source: "iana"
  },
  "application/vnd.century-systems.tcp_stream": {
    source: "iana"
  },
  "application/vnd.chemdraw+xml": {
    source: "iana",
    compressible: true,
    extensions: ["cdxml"]
  },
  "application/vnd.chess-pgn": {
    source: "iana"
  },
  "application/vnd.chipnuts.karaoke-mmd": {
    source: "iana",
    extensions: ["mmd"]
  },
  "application/vnd.ciedi": {
    source: "iana"
  },
  "application/vnd.cinderella": {
    source: "iana",
    extensions: ["cdy"]
  },
  "application/vnd.cirpack.isdn-ext": {
    source: "iana"
  },
  "application/vnd.citationstyles.style+xml": {
    source: "iana",
    compressible: true,
    extensions: ["csl"]
  },
  "application/vnd.claymore": {
    source: "iana",
    extensions: ["cla"]
  },
  "application/vnd.cloanto.rp9": {
    source: "iana",
    extensions: ["rp9"]
  },
  "application/vnd.clonk.c4group": {
    source: "iana",
    extensions: ["c4g", "c4d", "c4f", "c4p", "c4u"]
  },
  "application/vnd.cluetrust.cartomobile-config": {
    source: "iana",
    extensions: ["c11amc"]
  },
  "application/vnd.cluetrust.cartomobile-config-pkg": {
    source: "iana",
    extensions: ["c11amz"]
  },
  "application/vnd.coffeescript": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.document": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.document-template": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.presentation": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.presentation-template": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.spreadsheet": {
    source: "iana"
  },
  "application/vnd.collabio.xodocuments.spreadsheet-template": {
    source: "iana"
  },
  "application/vnd.collection+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.collection.doc+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.collection.next+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.comicbook+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.comicbook-rar": {
    source: "iana"
  },
  "application/vnd.commerce-battelle": {
    source: "iana"
  },
  "application/vnd.commonspace": {
    source: "iana",
    extensions: ["csp"]
  },
  "application/vnd.contact.cmsg": {
    source: "iana",
    extensions: ["cdbcmsg"]
  },
  "application/vnd.coreos.ignition+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cosmocaller": {
    source: "iana",
    extensions: ["cmc"]
  },
  "application/vnd.crick.clicker": {
    source: "iana",
    extensions: ["clkx"]
  },
  "application/vnd.crick.clicker.keyboard": {
    source: "iana",
    extensions: ["clkk"]
  },
  "application/vnd.crick.clicker.palette": {
    source: "iana",
    extensions: ["clkp"]
  },
  "application/vnd.crick.clicker.template": {
    source: "iana",
    extensions: ["clkt"]
  },
  "application/vnd.crick.clicker.wordbank": {
    source: "iana",
    extensions: ["clkw"]
  },
  "application/vnd.criticaltools.wbs+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wbs"]
  },
  "application/vnd.cryptii.pipe+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.crypto-shade-file": {
    source: "iana"
  },
  "application/vnd.cryptomator.encrypted": {
    source: "iana"
  },
  "application/vnd.cryptomator.vault": {
    source: "iana"
  },
  "application/vnd.ctc-posml": {
    source: "iana",
    extensions: ["pml"]
  },
  "application/vnd.ctct.ws+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cups-pdf": {
    source: "iana"
  },
  "application/vnd.cups-postscript": {
    source: "iana"
  },
  "application/vnd.cups-ppd": {
    source: "iana",
    extensions: ["ppd"]
  },
  "application/vnd.cups-raster": {
    source: "iana"
  },
  "application/vnd.cups-raw": {
    source: "iana"
  },
  "application/vnd.curl": {
    source: "iana"
  },
  "application/vnd.curl.car": {
    source: "apache",
    extensions: ["car"]
  },
  "application/vnd.curl.pcurl": {
    source: "apache",
    extensions: ["pcurl"]
  },
  "application/vnd.cyan.dean.root+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cybank": {
    source: "iana"
  },
  "application/vnd.cyclonedx+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.cyclonedx+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.d2l.coursepackage1p0+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.d3m-dataset": {
    source: "iana"
  },
  "application/vnd.d3m-problem": {
    source: "iana"
  },
  "application/vnd.dart": {
    source: "iana",
    compressible: true,
    extensions: ["dart"]
  },
  "application/vnd.data-vision.rdz": {
    source: "iana",
    extensions: ["rdz"]
  },
  "application/vnd.datapackage+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dataresource+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dbf": {
    source: "iana",
    extensions: ["dbf"]
  },
  "application/vnd.debian.binary-package": {
    source: "iana"
  },
  "application/vnd.dece.data": {
    source: "iana",
    extensions: ["uvf", "uvvf", "uvd", "uvvd"]
  },
  "application/vnd.dece.ttml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["uvt", "uvvt"]
  },
  "application/vnd.dece.unspecified": {
    source: "iana",
    extensions: ["uvx", "uvvx"]
  },
  "application/vnd.dece.zip": {
    source: "iana",
    extensions: ["uvz", "uvvz"]
  },
  "application/vnd.denovo.fcselayout-link": {
    source: "iana",
    extensions: ["fe_launch"]
  },
  "application/vnd.desmume.movie": {
    source: "iana"
  },
  "application/vnd.dir-bi.plate-dl-nosuffix": {
    source: "iana"
  },
  "application/vnd.dm.delegation+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dna": {
    source: "iana",
    extensions: ["dna"]
  },
  "application/vnd.document+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dolby.mlp": {
    source: "apache",
    extensions: ["mlp"]
  },
  "application/vnd.dolby.mobile.1": {
    source: "iana"
  },
  "application/vnd.dolby.mobile.2": {
    source: "iana"
  },
  "application/vnd.doremir.scorecloud-binary-document": {
    source: "iana"
  },
  "application/vnd.dpgraph": {
    source: "iana",
    extensions: ["dpg"]
  },
  "application/vnd.dreamfactory": {
    source: "iana",
    extensions: ["dfac"]
  },
  "application/vnd.drive+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ds-keypoint": {
    source: "apache",
    extensions: ["kpxx"]
  },
  "application/vnd.dtg.local": {
    source: "iana"
  },
  "application/vnd.dtg.local.flash": {
    source: "iana"
  },
  "application/vnd.dtg.local.html": {
    source: "iana"
  },
  "application/vnd.dvb.ait": {
    source: "iana",
    extensions: ["ait"]
  },
  "application/vnd.dvb.dvbisl+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.dvbj": {
    source: "iana"
  },
  "application/vnd.dvb.esgcontainer": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcdftnotifaccess": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcesgaccess": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcesgaccess2": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcesgpdd": {
    source: "iana"
  },
  "application/vnd.dvb.ipdcroaming": {
    source: "iana"
  },
  "application/vnd.dvb.iptv.alfec-base": {
    source: "iana"
  },
  "application/vnd.dvb.iptv.alfec-enhancement": {
    source: "iana"
  },
  "application/vnd.dvb.notif-aggregate-root+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-container+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-generic+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-ia-msglist+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-ia-registration-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-ia-registration-response+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.notif-init+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.dvb.pfr": {
    source: "iana"
  },
  "application/vnd.dvb.service": {
    source: "iana",
    extensions: ["svc"]
  },
  "application/vnd.dxr": {
    source: "iana"
  },
  "application/vnd.dynageo": {
    source: "iana",
    extensions: ["geo"]
  },
  "application/vnd.dzr": {
    source: "iana"
  },
  "application/vnd.easykaraoke.cdgdownload": {
    source: "iana"
  },
  "application/vnd.ecdis-update": {
    source: "iana"
  },
  "application/vnd.ecip.rlp": {
    source: "iana"
  },
  "application/vnd.eclipse.ditto+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ecowin.chart": {
    source: "iana",
    extensions: ["mag"]
  },
  "application/vnd.ecowin.filerequest": {
    source: "iana"
  },
  "application/vnd.ecowin.fileupdate": {
    source: "iana"
  },
  "application/vnd.ecowin.series": {
    source: "iana"
  },
  "application/vnd.ecowin.seriesrequest": {
    source: "iana"
  },
  "application/vnd.ecowin.seriesupdate": {
    source: "iana"
  },
  "application/vnd.efi.img": {
    source: "iana"
  },
  "application/vnd.efi.iso": {
    source: "iana"
  },
  "application/vnd.emclient.accessrequest+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.enliven": {
    source: "iana",
    extensions: ["nml"]
  },
  "application/vnd.enphase.envoy": {
    source: "iana"
  },
  "application/vnd.eprints.data+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.epson.esf": {
    source: "iana",
    extensions: ["esf"]
  },
  "application/vnd.epson.msf": {
    source: "iana",
    extensions: ["msf"]
  },
  "application/vnd.epson.quickanime": {
    source: "iana",
    extensions: ["qam"]
  },
  "application/vnd.epson.salt": {
    source: "iana",
    extensions: ["slt"]
  },
  "application/vnd.epson.ssf": {
    source: "iana",
    extensions: ["ssf"]
  },
  "application/vnd.ericsson.quickcall": {
    source: "iana"
  },
  "application/vnd.espass-espass+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.eszigno3+xml": {
    source: "iana",
    compressible: true,
    extensions: ["es3", "et3"]
  },
  "application/vnd.etsi.aoc+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.asic-e+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.etsi.asic-s+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.etsi.cug+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvcommand+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvdiscovery+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvprofile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvsad-bc+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvsad-cod+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvsad-npvr+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvservice+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvsync+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.iptvueprofile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.mcid+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.mheg5": {
    source: "iana"
  },
  "application/vnd.etsi.overload-control-policy-dataset+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.pstn+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.sci+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.simservs+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.timestamp-token": {
    source: "iana"
  },
  "application/vnd.etsi.tsl+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.etsi.tsl.der": {
    source: "iana"
  },
  "application/vnd.eu.kasparian.car+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.eudora.data": {
    source: "iana"
  },
  "application/vnd.evolv.ecig.profile": {
    source: "iana"
  },
  "application/vnd.evolv.ecig.settings": {
    source: "iana"
  },
  "application/vnd.evolv.ecig.theme": {
    source: "iana"
  },
  "application/vnd.exstream-empower+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.exstream-package": {
    source: "iana"
  },
  "application/vnd.ezpix-album": {
    source: "iana",
    extensions: ["ez2"]
  },
  "application/vnd.ezpix-package": {
    source: "iana",
    extensions: ["ez3"]
  },
  "application/vnd.f-secure.mobile": {
    source: "iana"
  },
  "application/vnd.familysearch.gedcom+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.fastcopy-disk-image": {
    source: "iana"
  },
  "application/vnd.fdf": {
    source: "iana",
    extensions: ["fdf"]
  },
  "application/vnd.fdsn.mseed": {
    source: "iana",
    extensions: ["mseed"]
  },
  "application/vnd.fdsn.seed": {
    source: "iana",
    extensions: ["seed", "dataless"]
  },
  "application/vnd.ffsns": {
    source: "iana"
  },
  "application/vnd.ficlab.flb+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.filmit.zfc": {
    source: "iana"
  },
  "application/vnd.fints": {
    source: "iana"
  },
  "application/vnd.firemonkeys.cloudcell": {
    source: "iana"
  },
  "application/vnd.flographit": {
    source: "iana",
    extensions: ["gph"]
  },
  "application/vnd.fluxtime.clip": {
    source: "iana",
    extensions: ["ftc"]
  },
  "application/vnd.font-fontforge-sfd": {
    source: "iana"
  },
  "application/vnd.framemaker": {
    source: "iana",
    extensions: ["fm", "frame", "maker", "book"]
  },
  "application/vnd.frogans.fnc": {
    source: "iana",
    extensions: ["fnc"]
  },
  "application/vnd.frogans.ltf": {
    source: "iana",
    extensions: ["ltf"]
  },
  "application/vnd.fsc.weblaunch": {
    source: "iana",
    extensions: ["fsc"]
  },
  "application/vnd.fujifilm.fb.docuworks": {
    source: "iana"
  },
  "application/vnd.fujifilm.fb.docuworks.binder": {
    source: "iana"
  },
  "application/vnd.fujifilm.fb.docuworks.container": {
    source: "iana"
  },
  "application/vnd.fujifilm.fb.jfi+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.fujitsu.oasys": {
    source: "iana",
    extensions: ["oas"]
  },
  "application/vnd.fujitsu.oasys2": {
    source: "iana",
    extensions: ["oa2"]
  },
  "application/vnd.fujitsu.oasys3": {
    source: "iana",
    extensions: ["oa3"]
  },
  "application/vnd.fujitsu.oasysgp": {
    source: "iana",
    extensions: ["fg5"]
  },
  "application/vnd.fujitsu.oasysprs": {
    source: "iana",
    extensions: ["bh2"]
  },
  "application/vnd.fujixerox.art-ex": {
    source: "iana"
  },
  "application/vnd.fujixerox.art4": {
    source: "iana"
  },
  "application/vnd.fujixerox.ddd": {
    source: "iana",
    extensions: ["ddd"]
  },
  "application/vnd.fujixerox.docuworks": {
    source: "iana",
    extensions: ["xdw"]
  },
  "application/vnd.fujixerox.docuworks.binder": {
    source: "iana",
    extensions: ["xbd"]
  },
  "application/vnd.fujixerox.docuworks.container": {
    source: "iana"
  },
  "application/vnd.fujixerox.hbpl": {
    source: "iana"
  },
  "application/vnd.fut-misnet": {
    source: "iana"
  },
  "application/vnd.futoin+cbor": {
    source: "iana"
  },
  "application/vnd.futoin+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.fuzzysheet": {
    source: "iana",
    extensions: ["fzs"]
  },
  "application/vnd.genomatix.tuxedo": {
    source: "iana",
    extensions: ["txd"]
  },
  "application/vnd.gentics.grd+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.geo+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.geocube+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.geogebra.file": {
    source: "iana",
    extensions: ["ggb"]
  },
  "application/vnd.geogebra.slides": {
    source: "iana"
  },
  "application/vnd.geogebra.tool": {
    source: "iana",
    extensions: ["ggt"]
  },
  "application/vnd.geometry-explorer": {
    source: "iana",
    extensions: ["gex", "gre"]
  },
  "application/vnd.geonext": {
    source: "iana",
    extensions: ["gxt"]
  },
  "application/vnd.geoplan": {
    source: "iana",
    extensions: ["g2w"]
  },
  "application/vnd.geospace": {
    source: "iana",
    extensions: ["g3w"]
  },
  "application/vnd.gerber": {
    source: "iana"
  },
  "application/vnd.globalplatform.card-content-mgt": {
    source: "iana"
  },
  "application/vnd.globalplatform.card-content-mgt-response": {
    source: "iana"
  },
  "application/vnd.gmx": {
    source: "iana",
    extensions: ["gmx"]
  },
  "application/vnd.google-apps.document": {
    compressible: false,
    extensions: ["gdoc"]
  },
  "application/vnd.google-apps.presentation": {
    compressible: false,
    extensions: ["gslides"]
  },
  "application/vnd.google-apps.spreadsheet": {
    compressible: false,
    extensions: ["gsheet"]
  },
  "application/vnd.google-earth.kml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["kml"]
  },
  "application/vnd.google-earth.kmz": {
    source: "iana",
    compressible: false,
    extensions: ["kmz"]
  },
  "application/vnd.gov.sk.e-form+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.gov.sk.e-form+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.gov.sk.xmldatacontainer+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.grafeq": {
    source: "iana",
    extensions: ["gqf", "gqs"]
  },
  "application/vnd.gridmp": {
    source: "iana"
  },
  "application/vnd.groove-account": {
    source: "iana",
    extensions: ["gac"]
  },
  "application/vnd.groove-help": {
    source: "iana",
    extensions: ["ghf"]
  },
  "application/vnd.groove-identity-message": {
    source: "iana",
    extensions: ["gim"]
  },
  "application/vnd.groove-injector": {
    source: "iana",
    extensions: ["grv"]
  },
  "application/vnd.groove-tool-message": {
    source: "iana",
    extensions: ["gtm"]
  },
  "application/vnd.groove-tool-template": {
    source: "iana",
    extensions: ["tpl"]
  },
  "application/vnd.groove-vcard": {
    source: "iana",
    extensions: ["vcg"]
  },
  "application/vnd.hal+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hal+xml": {
    source: "iana",
    compressible: true,
    extensions: ["hal"]
  },
  "application/vnd.handheld-entertainment+xml": {
    source: "iana",
    compressible: true,
    extensions: ["zmm"]
  },
  "application/vnd.hbci": {
    source: "iana",
    extensions: ["hbci"]
  },
  "application/vnd.hc+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hcl-bireports": {
    source: "iana"
  },
  "application/vnd.hdt": {
    source: "iana"
  },
  "application/vnd.heroku+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hhe.lesson-player": {
    source: "iana",
    extensions: ["les"]
  },
  "application/vnd.hl7cda+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.hl7v2+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.hp-hpgl": {
    source: "iana",
    extensions: ["hpgl"]
  },
  "application/vnd.hp-hpid": {
    source: "iana",
    extensions: ["hpid"]
  },
  "application/vnd.hp-hps": {
    source: "iana",
    extensions: ["hps"]
  },
  "application/vnd.hp-jlyt": {
    source: "iana",
    extensions: ["jlt"]
  },
  "application/vnd.hp-pcl": {
    source: "iana",
    extensions: ["pcl"]
  },
  "application/vnd.hp-pclxl": {
    source: "iana",
    extensions: ["pclxl"]
  },
  "application/vnd.httphone": {
    source: "iana"
  },
  "application/vnd.hydrostatix.sof-data": {
    source: "iana",
    extensions: ["sfd-hdstx"]
  },
  "application/vnd.hyper+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hyper-item+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hyperdrive+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.hzn-3d-crossword": {
    source: "iana"
  },
  "application/vnd.ibm.afplinedata": {
    source: "iana"
  },
  "application/vnd.ibm.electronic-media": {
    source: "iana"
  },
  "application/vnd.ibm.minipay": {
    source: "iana",
    extensions: ["mpy"]
  },
  "application/vnd.ibm.modcap": {
    source: "iana",
    extensions: ["afp", "listafp", "list3820"]
  },
  "application/vnd.ibm.rights-management": {
    source: "iana",
    extensions: ["irm"]
  },
  "application/vnd.ibm.secure-container": {
    source: "iana",
    extensions: ["sc"]
  },
  "application/vnd.iccprofile": {
    source: "iana",
    extensions: ["icc", "icm"]
  },
  "application/vnd.ieee.1905": {
    source: "iana"
  },
  "application/vnd.igloader": {
    source: "iana",
    extensions: ["igl"]
  },
  "application/vnd.imagemeter.folder+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.imagemeter.image+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.immervision-ivp": {
    source: "iana",
    extensions: ["ivp"]
  },
  "application/vnd.immervision-ivu": {
    source: "iana",
    extensions: ["ivu"]
  },
  "application/vnd.ims.imsccv1p1": {
    source: "iana"
  },
  "application/vnd.ims.imsccv1p2": {
    source: "iana"
  },
  "application/vnd.ims.imsccv1p3": {
    source: "iana"
  },
  "application/vnd.ims.lis.v2.result+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolconsumerprofile+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolproxy+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolproxy.id+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolsettings+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ims.lti.v2.toolsettings.simple+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.informedcontrol.rms+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.informix-visionary": {
    source: "iana"
  },
  "application/vnd.infotech.project": {
    source: "iana"
  },
  "application/vnd.infotech.project+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.innopath.wamp.notification": {
    source: "iana"
  },
  "application/vnd.insors.igm": {
    source: "iana",
    extensions: ["igm"]
  },
  "application/vnd.intercon.formnet": {
    source: "iana",
    extensions: ["xpw", "xpx"]
  },
  "application/vnd.intergeo": {
    source: "iana",
    extensions: ["i2g"]
  },
  "application/vnd.intertrust.digibox": {
    source: "iana"
  },
  "application/vnd.intertrust.nncp": {
    source: "iana"
  },
  "application/vnd.intu.qbo": {
    source: "iana",
    extensions: ["qbo"]
  },
  "application/vnd.intu.qfx": {
    source: "iana",
    extensions: ["qfx"]
  },
  "application/vnd.iptc.g2.catalogitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.conceptitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.knowledgeitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.newsitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.newsmessage+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.packageitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.iptc.g2.planningitem+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ipunplugged.rcprofile": {
    source: "iana",
    extensions: ["rcprofile"]
  },
  "application/vnd.irepository.package+xml": {
    source: "iana",
    compressible: true,
    extensions: ["irp"]
  },
  "application/vnd.is-xpr": {
    source: "iana",
    extensions: ["xpr"]
  },
  "application/vnd.isac.fcs": {
    source: "iana",
    extensions: ["fcs"]
  },
  "application/vnd.iso11783-10+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.jam": {
    source: "iana",
    extensions: ["jam"]
  },
  "application/vnd.japannet-directory-service": {
    source: "iana"
  },
  "application/vnd.japannet-jpnstore-wakeup": {
    source: "iana"
  },
  "application/vnd.japannet-payment-wakeup": {
    source: "iana"
  },
  "application/vnd.japannet-registration": {
    source: "iana"
  },
  "application/vnd.japannet-registration-wakeup": {
    source: "iana"
  },
  "application/vnd.japannet-setstore-wakeup": {
    source: "iana"
  },
  "application/vnd.japannet-verification": {
    source: "iana"
  },
  "application/vnd.japannet-verification-wakeup": {
    source: "iana"
  },
  "application/vnd.jcp.javame.midlet-rms": {
    source: "iana",
    extensions: ["rms"]
  },
  "application/vnd.jisp": {
    source: "iana",
    extensions: ["jisp"]
  },
  "application/vnd.joost.joda-archive": {
    source: "iana",
    extensions: ["joda"]
  },
  "application/vnd.jsk.isdn-ngn": {
    source: "iana"
  },
  "application/vnd.kahootz": {
    source: "iana",
    extensions: ["ktz", "ktr"]
  },
  "application/vnd.kde.karbon": {
    source: "iana",
    extensions: ["karbon"]
  },
  "application/vnd.kde.kchart": {
    source: "iana",
    extensions: ["chrt"]
  },
  "application/vnd.kde.kformula": {
    source: "iana",
    extensions: ["kfo"]
  },
  "application/vnd.kde.kivio": {
    source: "iana",
    extensions: ["flw"]
  },
  "application/vnd.kde.kontour": {
    source: "iana",
    extensions: ["kon"]
  },
  "application/vnd.kde.kpresenter": {
    source: "iana",
    extensions: ["kpr", "kpt"]
  },
  "application/vnd.kde.kspread": {
    source: "iana",
    extensions: ["ksp"]
  },
  "application/vnd.kde.kword": {
    source: "iana",
    extensions: ["kwd", "kwt"]
  },
  "application/vnd.kenameaapp": {
    source: "iana",
    extensions: ["htke"]
  },
  "application/vnd.kidspiration": {
    source: "iana",
    extensions: ["kia"]
  },
  "application/vnd.kinar": {
    source: "iana",
    extensions: ["kne", "knp"]
  },
  "application/vnd.koan": {
    source: "iana",
    extensions: ["skp", "skd", "skt", "skm"]
  },
  "application/vnd.kodak-descriptor": {
    source: "iana",
    extensions: ["sse"]
  },
  "application/vnd.las": {
    source: "iana"
  },
  "application/vnd.las.las+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.las.las+xml": {
    source: "iana",
    compressible: true,
    extensions: ["lasxml"]
  },
  "application/vnd.laszip": {
    source: "iana"
  },
  "application/vnd.leap+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.liberty-request+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.llamagraphics.life-balance.desktop": {
    source: "iana",
    extensions: ["lbd"]
  },
  "application/vnd.llamagraphics.life-balance.exchange+xml": {
    source: "iana",
    compressible: true,
    extensions: ["lbe"]
  },
  "application/vnd.logipipe.circuit+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.loom": {
    source: "iana"
  },
  "application/vnd.lotus-1-2-3": {
    source: "iana",
    extensions: ["123"]
  },
  "application/vnd.lotus-approach": {
    source: "iana",
    extensions: ["apr"]
  },
  "application/vnd.lotus-freelance": {
    source: "iana",
    extensions: ["pre"]
  },
  "application/vnd.lotus-notes": {
    source: "iana",
    extensions: ["nsf"]
  },
  "application/vnd.lotus-organizer": {
    source: "iana",
    extensions: ["org"]
  },
  "application/vnd.lotus-screencam": {
    source: "iana",
    extensions: ["scm"]
  },
  "application/vnd.lotus-wordpro": {
    source: "iana",
    extensions: ["lwp"]
  },
  "application/vnd.macports.portpkg": {
    source: "iana",
    extensions: ["portpkg"]
  },
  "application/vnd.mapbox-vector-tile": {
    source: "iana",
    extensions: ["mvt"]
  },
  "application/vnd.marlin.drm.actiontoken+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.marlin.drm.conftoken+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.marlin.drm.license+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.marlin.drm.mdcf": {
    source: "iana"
  },
  "application/vnd.mason+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.maxar.archive.3tz+zip": {
    source: "iana",
    compressible: false
  },
  "application/vnd.maxmind.maxmind-db": {
    source: "iana"
  },
  "application/vnd.mcd": {
    source: "iana",
    extensions: ["mcd"]
  },
  "application/vnd.medcalcdata": {
    source: "iana",
    extensions: ["mc1"]
  },
  "application/vnd.mediastation.cdkey": {
    source: "iana",
    extensions: ["cdkey"]
  },
  "application/vnd.meridian-slingshot": {
    source: "iana"
  },
  "application/vnd.mfer": {
    source: "iana",
    extensions: ["mwf"]
  },
  "application/vnd.mfmp": {
    source: "iana",
    extensions: ["mfm"]
  },
  "application/vnd.micro+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.micrografx.flo": {
    source: "iana",
    extensions: ["flo"]
  },
  "application/vnd.micrografx.igx": {
    source: "iana",
    extensions: ["igx"]
  },
  "application/vnd.microsoft.portable-executable": {
    source: "iana"
  },
  "application/vnd.microsoft.windows.thumbnail-cache": {
    source: "iana"
  },
  "application/vnd.miele+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.mif": {
    source: "iana",
    extensions: ["mif"]
  },
  "application/vnd.minisoft-hp3000-save": {
    source: "iana"
  },
  "application/vnd.mitsubishi.misty-guard.trustweb": {
    source: "iana"
  },
  "application/vnd.mobius.daf": {
    source: "iana",
    extensions: ["daf"]
  },
  "application/vnd.mobius.dis": {
    source: "iana",
    extensions: ["dis"]
  },
  "application/vnd.mobius.mbk": {
    source: "iana",
    extensions: ["mbk"]
  },
  "application/vnd.mobius.mqy": {
    source: "iana",
    extensions: ["mqy"]
  },
  "application/vnd.mobius.msl": {
    source: "iana",
    extensions: ["msl"]
  },
  "application/vnd.mobius.plc": {
    source: "iana",
    extensions: ["plc"]
  },
  "application/vnd.mobius.txf": {
    source: "iana",
    extensions: ["txf"]
  },
  "application/vnd.mophun.application": {
    source: "iana",
    extensions: ["mpn"]
  },
  "application/vnd.mophun.certificate": {
    source: "iana",
    extensions: ["mpc"]
  },
  "application/vnd.motorola.flexsuite": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.adsi": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.fis": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.gotap": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.kmr": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.ttc": {
    source: "iana"
  },
  "application/vnd.motorola.flexsuite.wem": {
    source: "iana"
  },
  "application/vnd.motorola.iprm": {
    source: "iana"
  },
  "application/vnd.mozilla.xul+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xul"]
  },
  "application/vnd.ms-3mfdocument": {
    source: "iana"
  },
  "application/vnd.ms-artgalry": {
    source: "iana",
    extensions: ["cil"]
  },
  "application/vnd.ms-asf": {
    source: "iana"
  },
  "application/vnd.ms-cab-compressed": {
    source: "iana",
    extensions: ["cab"]
  },
  "application/vnd.ms-color.iccprofile": {
    source: "apache"
  },
  "application/vnd.ms-excel": {
    source: "iana",
    compressible: false,
    extensions: ["xls", "xlm", "xla", "xlc", "xlt", "xlw"]
  },
  "application/vnd.ms-excel.addin.macroenabled.12": {
    source: "iana",
    extensions: ["xlam"]
  },
  "application/vnd.ms-excel.sheet.binary.macroenabled.12": {
    source: "iana",
    extensions: ["xlsb"]
  },
  "application/vnd.ms-excel.sheet.macroenabled.12": {
    source: "iana",
    extensions: ["xlsm"]
  },
  "application/vnd.ms-excel.template.macroenabled.12": {
    source: "iana",
    extensions: ["xltm"]
  },
  "application/vnd.ms-fontobject": {
    source: "iana",
    compressible: true,
    extensions: ["eot"]
  },
  "application/vnd.ms-htmlhelp": {
    source: "iana",
    extensions: ["chm"]
  },
  "application/vnd.ms-ims": {
    source: "iana",
    extensions: ["ims"]
  },
  "application/vnd.ms-lrm": {
    source: "iana",
    extensions: ["lrm"]
  },
  "application/vnd.ms-office.activex+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ms-officetheme": {
    source: "iana",
    extensions: ["thmx"]
  },
  "application/vnd.ms-opentype": {
    source: "apache",
    compressible: true
  },
  "application/vnd.ms-outlook": {
    compressible: false,
    extensions: ["msg"]
  },
  "application/vnd.ms-package.obfuscated-opentype": {
    source: "apache"
  },
  "application/vnd.ms-pki.seccat": {
    source: "apache",
    extensions: ["cat"]
  },
  "application/vnd.ms-pki.stl": {
    source: "apache",
    extensions: ["stl"]
  },
  "application/vnd.ms-playready.initiator+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ms-powerpoint": {
    source: "iana",
    compressible: false,
    extensions: ["ppt", "pps", "pot"]
  },
  "application/vnd.ms-powerpoint.addin.macroenabled.12": {
    source: "iana",
    extensions: ["ppam"]
  },
  "application/vnd.ms-powerpoint.presentation.macroenabled.12": {
    source: "iana",
    extensions: ["pptm"]
  },
  "application/vnd.ms-powerpoint.slide.macroenabled.12": {
    source: "iana",
    extensions: ["sldm"]
  },
  "application/vnd.ms-powerpoint.slideshow.macroenabled.12": {
    source: "iana",
    extensions: ["ppsm"]
  },
  "application/vnd.ms-powerpoint.template.macroenabled.12": {
    source: "iana",
    extensions: ["potm"]
  },
  "application/vnd.ms-printdevicecapabilities+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ms-printing.printticket+xml": {
    source: "apache",
    compressible: true
  },
  "application/vnd.ms-printschematicket+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ms-project": {
    source: "iana",
    extensions: ["mpp", "mpt"]
  },
  "application/vnd.ms-tnef": {
    source: "iana"
  },
  "application/vnd.ms-windows.devicepairing": {
    source: "iana"
  },
  "application/vnd.ms-windows.nwprinting.oob": {
    source: "iana"
  },
  "application/vnd.ms-windows.printerpairing": {
    source: "iana"
  },
  "application/vnd.ms-windows.wsd.oob": {
    source: "iana"
  },
  "application/vnd.ms-wmdrm.lic-chlg-req": {
    source: "iana"
  },
  "application/vnd.ms-wmdrm.lic-resp": {
    source: "iana"
  },
  "application/vnd.ms-wmdrm.meter-chlg-req": {
    source: "iana"
  },
  "application/vnd.ms-wmdrm.meter-resp": {
    source: "iana"
  },
  "application/vnd.ms-word.document.macroenabled.12": {
    source: "iana",
    extensions: ["docm"]
  },
  "application/vnd.ms-word.template.macroenabled.12": {
    source: "iana",
    extensions: ["dotm"]
  },
  "application/vnd.ms-works": {
    source: "iana",
    extensions: ["wps", "wks", "wcm", "wdb"]
  },
  "application/vnd.ms-wpl": {
    source: "iana",
    extensions: ["wpl"]
  },
  "application/vnd.ms-xpsdocument": {
    source: "iana",
    compressible: false,
    extensions: ["xps"]
  },
  "application/vnd.msa-disk-image": {
    source: "iana"
  },
  "application/vnd.mseq": {
    source: "iana",
    extensions: ["mseq"]
  },
  "application/vnd.msign": {
    source: "iana"
  },
  "application/vnd.multiad.creator": {
    source: "iana"
  },
  "application/vnd.multiad.creator.cif": {
    source: "iana"
  },
  "application/vnd.music-niff": {
    source: "iana"
  },
  "application/vnd.musician": {
    source: "iana",
    extensions: ["mus"]
  },
  "application/vnd.muvee.style": {
    source: "iana",
    extensions: ["msty"]
  },
  "application/vnd.mynfc": {
    source: "iana",
    extensions: ["taglet"]
  },
  "application/vnd.nacamar.ybrid+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.ncd.control": {
    source: "iana"
  },
  "application/vnd.ncd.reference": {
    source: "iana"
  },
  "application/vnd.nearst.inv+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nebumind.line": {
    source: "iana"
  },
  "application/vnd.nervana": {
    source: "iana"
  },
  "application/vnd.netfpx": {
    source: "iana"
  },
  "application/vnd.neurolanguage.nlu": {
    source: "iana",
    extensions: ["nlu"]
  },
  "application/vnd.nimn": {
    source: "iana"
  },
  "application/vnd.nintendo.nitro.rom": {
    source: "iana"
  },
  "application/vnd.nintendo.snes.rom": {
    source: "iana"
  },
  "application/vnd.nitf": {
    source: "iana",
    extensions: ["ntf", "nitf"]
  },
  "application/vnd.noblenet-directory": {
    source: "iana",
    extensions: ["nnd"]
  },
  "application/vnd.noblenet-sealer": {
    source: "iana",
    extensions: ["nns"]
  },
  "application/vnd.noblenet-web": {
    source: "iana",
    extensions: ["nnw"]
  },
  "application/vnd.nokia.catalogs": {
    source: "iana"
  },
  "application/vnd.nokia.conml+wbxml": {
    source: "iana"
  },
  "application/vnd.nokia.conml+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.iptv.config+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.isds-radio-presets": {
    source: "iana"
  },
  "application/vnd.nokia.landmark+wbxml": {
    source: "iana"
  },
  "application/vnd.nokia.landmark+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.landmarkcollection+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.n-gage.ac+xml": {
    source: "iana",
    compressible: true,
    extensions: ["ac"]
  },
  "application/vnd.nokia.n-gage.data": {
    source: "iana",
    extensions: ["ngdat"]
  },
  "application/vnd.nokia.n-gage.symbian.install": {
    source: "iana",
    extensions: ["n-gage"]
  },
  "application/vnd.nokia.ncd": {
    source: "iana"
  },
  "application/vnd.nokia.pcd+wbxml": {
    source: "iana"
  },
  "application/vnd.nokia.pcd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.nokia.radio-preset": {
    source: "iana",
    extensions: ["rpst"]
  },
  "application/vnd.nokia.radio-presets": {
    source: "iana",
    extensions: ["rpss"]
  },
  "application/vnd.novadigm.edm": {
    source: "iana",
    extensions: ["edm"]
  },
  "application/vnd.novadigm.edx": {
    source: "iana",
    extensions: ["edx"]
  },
  "application/vnd.novadigm.ext": {
    source: "iana",
    extensions: ["ext"]
  },
  "application/vnd.ntt-local.content-share": {
    source: "iana"
  },
  "application/vnd.ntt-local.file-transfer": {
    source: "iana"
  },
  "application/vnd.ntt-local.ogw_remote-access": {
    source: "iana"
  },
  "application/vnd.ntt-local.sip-ta_remote": {
    source: "iana"
  },
  "application/vnd.ntt-local.sip-ta_tcp_stream": {
    source: "iana"
  },
  "application/vnd.oasis.opendocument.chart": {
    source: "iana",
    extensions: ["odc"]
  },
  "application/vnd.oasis.opendocument.chart-template": {
    source: "iana",
    extensions: ["otc"]
  },
  "application/vnd.oasis.opendocument.database": {
    source: "iana",
    extensions: ["odb"]
  },
  "application/vnd.oasis.opendocument.formula": {
    source: "iana",
    extensions: ["odf"]
  },
  "application/vnd.oasis.opendocument.formula-template": {
    source: "iana",
    extensions: ["odft"]
  },
  "application/vnd.oasis.opendocument.graphics": {
    source: "iana",
    compressible: false,
    extensions: ["odg"]
  },
  "application/vnd.oasis.opendocument.graphics-template": {
    source: "iana",
    extensions: ["otg"]
  },
  "application/vnd.oasis.opendocument.image": {
    source: "iana",
    extensions: ["odi"]
  },
  "application/vnd.oasis.opendocument.image-template": {
    source: "iana",
    extensions: ["oti"]
  },
  "application/vnd.oasis.opendocument.presentation": {
    source: "iana",
    compressible: false,
    extensions: ["odp"]
  },
  "application/vnd.oasis.opendocument.presentation-template": {
    source: "iana",
    extensions: ["otp"]
  },
  "application/vnd.oasis.opendocument.spreadsheet": {
    source: "iana",
    compressible: false,
    extensions: ["ods"]
  },
  "application/vnd.oasis.opendocument.spreadsheet-template": {
    source: "iana",
    extensions: ["ots"]
  },
  "application/vnd.oasis.opendocument.text": {
    source: "iana",
    compressible: false,
    extensions: ["odt"]
  },
  "application/vnd.oasis.opendocument.text-master": {
    source: "iana",
    extensions: ["odm"]
  },
  "application/vnd.oasis.opendocument.text-template": {
    source: "iana",
    extensions: ["ott"]
  },
  "application/vnd.oasis.opendocument.text-web": {
    source: "iana",
    extensions: ["oth"]
  },
  "application/vnd.obn": {
    source: "iana"
  },
  "application/vnd.ocf+cbor": {
    source: "iana"
  },
  "application/vnd.oci.image.manifest.v1+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oftn.l10n+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.contentaccessdownload+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.contentaccessstreaming+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.cspg-hexbinary": {
    source: "iana"
  },
  "application/vnd.oipf.dae.svg+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.dae.xhtml+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.mippvcontrolmessage+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.pae.gem": {
    source: "iana"
  },
  "application/vnd.oipf.spdiscovery+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.spdlist+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.ueprofile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oipf.userprofile+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.olpc-sugar": {
    source: "iana",
    extensions: ["xo"]
  },
  "application/vnd.oma-scws-config": {
    source: "iana"
  },
  "application/vnd.oma-scws-http-request": {
    source: "iana"
  },
  "application/vnd.oma-scws-http-response": {
    source: "iana"
  },
  "application/vnd.oma.bcast.associated-procedure-parameter+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.drm-trigger+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.imd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.ltkm": {
    source: "iana"
  },
  "application/vnd.oma.bcast.notification+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.provisioningtrigger": {
    source: "iana"
  },
  "application/vnd.oma.bcast.sgboot": {
    source: "iana"
  },
  "application/vnd.oma.bcast.sgdd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.sgdu": {
    source: "iana"
  },
  "application/vnd.oma.bcast.simple-symbol-container": {
    source: "iana"
  },
  "application/vnd.oma.bcast.smartcard-trigger+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.sprov+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.bcast.stkm": {
    source: "iana"
  },
  "application/vnd.oma.cab-address-book+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.cab-feature-handler+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.cab-pcc+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.cab-subs-invite+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.cab-user-prefs+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.dcd": {
    source: "iana"
  },
  "application/vnd.oma.dcdc": {
    source: "iana"
  },
  "application/vnd.oma.dd2+xml": {
    source: "iana",
    compressible: true,
    extensions: ["dd2"]
  },
  "application/vnd.oma.drm.risd+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.group-usage-list+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.lwm2m+cbor": {
    source: "iana"
  },
  "application/vnd.oma.lwm2m+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.lwm2m+tlv": {
    source: "iana"
  },
  "application/vnd.oma.pal+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.detailed-progress-report+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.final-report+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.groups+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.invocation-descriptor+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.poc.optimized-progress-report+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.push": {
    source: "iana"
  },
  "application/vnd.oma.scidm.messages+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oma.xcap-directory+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.omads-email+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.omads-file+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.omads-folder+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.omaloc-supl-init": {
    source: "iana"
  },
  "application/vnd.onepager": {
    source: "iana"
  },
  "application/vnd.onepagertamp": {
    source: "iana"
  },
  "application/vnd.onepagertamx": {
    source: "iana"
  },
  "application/vnd.onepagertat": {
    source: "iana"
  },
  "application/vnd.onepagertatp": {
    source: "iana"
  },
  "application/vnd.onepagertatx": {
    source: "iana"
  },
  "application/vnd.openblox.game+xml": {
    source: "iana",
    compressible: true,
    extensions: ["obgx"]
  },
  "application/vnd.openblox.game-binary": {
    source: "iana"
  },
  "application/vnd.openeye.oeb": {
    source: "iana"
  },
  "application/vnd.openofficeorg.extension": {
    source: "apache",
    extensions: ["oxt"]
  },
  "application/vnd.openstreetmap.data+xml": {
    source: "iana",
    compressible: true,
    extensions: ["osm"]
  },
  "application/vnd.opentimestamps.ots": {
    source: "iana"
  },
  "application/vnd.openxmlformats-officedocument.custom-properties+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.customxmlproperties+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawing+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.chart+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.chartshapes+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramcolors+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramdata+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramlayout+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.drawingml.diagramstyle+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.extended-properties+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.commentauthors+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.comments+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.handoutmaster+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.notesmaster+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.notesslide+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    source: "iana",
    compressible: false,
    extensions: ["pptx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presprops+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide": {
    source: "iana",
    extensions: ["sldx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slide+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slidelayout+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slidemaster+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow": {
    source: "iana",
    extensions: ["ppsx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideshow.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.slideupdateinfo+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.tablestyles+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.tags+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template": {
    source: "iana",
    extensions: ["potx"]
  },
  "application/vnd.openxmlformats-officedocument.presentationml.template.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.presentationml.viewprops+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.calcchain+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.chartsheet+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.comments+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.connections+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.dialogsheet+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.externallink+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcachedefinition+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivotcacherecords+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.pivottable+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.querytable+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionheaders+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.revisionlog+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sharedstrings+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    source: "iana",
    compressible: false,
    extensions: ["xlsx"]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheetmetadata+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.tablesinglecells+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template": {
    source: "iana",
    extensions: ["xltx"]
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.template.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.usernames+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.volatiledependencies+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.theme+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.themeoverride+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.vmldrawing": {
    source: "iana"
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.comments+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    source: "iana",
    compressible: false,
    extensions: ["docx"]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.glossary+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.endnotes+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.fonttable+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.footnotes+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template": {
    source: "iana",
    extensions: ["dotx"]
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.template.main+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.websettings+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-package.core-properties+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-package.digital-signature-xmlsignature+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.openxmlformats-package.relationships+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oracle.resource+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.orange.indata": {
    source: "iana"
  },
  "application/vnd.osa.netdeploy": {
    source: "iana"
  },
  "application/vnd.osgeo.mapguide.package": {
    source: "iana",
    extensions: ["mgp"]
  },
  "application/vnd.osgi.bundle": {
    source: "iana"
  },
  "application/vnd.osgi.dp": {
    source: "iana",
    extensions: ["dp"]
  },
  "application/vnd.osgi.subsystem": {
    source: "iana",
    extensions: ["esa"]
  },
  "application/vnd.otps.ct-kip+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.oxli.countgraph": {
    source: "iana"
  },
  "application/vnd.pagerduty+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.palm": {
    source: "iana",
    extensions: ["pdb", "pqa", "oprc"]
  },
  "application/vnd.panoply": {
    source: "iana"
  },
  "application/vnd.paos.xml": {
    source: "iana"
  },
  "application/vnd.patentdive": {
    source: "iana"
  },
  "application/vnd.patientecommsdoc": {
    source: "iana"
  },
  "application/vnd.pawaafile": {
    source: "iana",
    extensions: ["paw"]
  },
  "application/vnd.pcos": {
    source: "iana"
  },
  "application/vnd.pg.format": {
    source: "iana",
    extensions: ["str"]
  },
  "application/vnd.pg.osasli": {
    source: "iana",
    extensions: ["ei6"]
  },
  "application/vnd.piaccess.application-licence": {
    source: "iana"
  },
  "application/vnd.picsel": {
    source: "iana",
    extensions: ["efif"]
  },
  "application/vnd.pmi.widget": {
    source: "iana",
    extensions: ["wg"]
  },
  "application/vnd.poc.group-advertisement+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.pocketlearn": {
    source: "iana",
    extensions: ["plf"]
  },
  "application/vnd.powerbuilder6": {
    source: "iana",
    extensions: ["pbd"]
  },
  "application/vnd.powerbuilder6-s": {
    source: "iana"
  },
  "application/vnd.powerbuilder7": {
    source: "iana"
  },
  "application/vnd.powerbuilder7-s": {
    source: "iana"
  },
  "application/vnd.powerbuilder75": {
    source: "iana"
  },
  "application/vnd.powerbuilder75-s": {
    source: "iana"
  },
  "application/vnd.preminet": {
    source: "iana"
  },
  "application/vnd.previewsystems.box": {
    source: "iana",
    extensions: ["box"]
  },
  "application/vnd.proteus.magazine": {
    source: "iana",
    extensions: ["mgz"]
  },
  "application/vnd.psfs": {
    source: "iana"
  },
  "application/vnd.publishare-delta-tree": {
    source: "iana",
    extensions: ["qps"]
  },
  "application/vnd.pvi.ptid1": {
    source: "iana",
    extensions: ["ptid"]
  },
  "application/vnd.pwg-multiplexed": {
    source: "iana"
  },
  "application/vnd.pwg-xhtml-print+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.qualcomm.brew-app-res": {
    source: "iana"
  },
  "application/vnd.quarantainenet": {
    source: "iana"
  },
  "application/vnd.quark.quarkxpress": {
    source: "iana",
    extensions: ["qxd", "qxt", "qwd", "qwt", "qxl", "qxb"]
  },
  "application/vnd.quobject-quoxdocument": {
    source: "iana"
  },
  "application/vnd.radisys.moml+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit-conf+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit-conn+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit-dialog+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-audit-stream+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-conf+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-base+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-fax-detect+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-fax-sendrecv+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-group+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-speech+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.radisys.msml-dialog-transform+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.rainstor.data": {
    source: "iana"
  },
  "application/vnd.rapid": {
    source: "iana"
  },
  "application/vnd.rar": {
    source: "iana",
    extensions: ["rar"]
  },
  "application/vnd.realvnc.bed": {
    source: "iana",
    extensions: ["bed"]
  },
  "application/vnd.recordare.musicxml": {
    source: "iana",
    extensions: ["mxl"]
  },
  "application/vnd.recordare.musicxml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["musicxml"]
  },
  "application/vnd.renlearn.rlprint": {
    source: "iana"
  },
  "application/vnd.resilient.logic": {
    source: "iana"
  },
  "application/vnd.restful+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.rig.cryptonote": {
    source: "iana",
    extensions: ["cryptonote"]
  },
  "application/vnd.rim.cod": {
    source: "apache",
    extensions: ["cod"]
  },
  "application/vnd.rn-realmedia": {
    source: "apache",
    extensions: ["rm"]
  },
  "application/vnd.rn-realmedia-vbr": {
    source: "apache",
    extensions: ["rmvb"]
  },
  "application/vnd.route66.link66+xml": {
    source: "iana",
    compressible: true,
    extensions: ["link66"]
  },
  "application/vnd.rs-274x": {
    source: "iana"
  },
  "application/vnd.ruckus.download": {
    source: "iana"
  },
  "application/vnd.s3sms": {
    source: "iana"
  },
  "application/vnd.sailingtracker.track": {
    source: "iana",
    extensions: ["st"]
  },
  "application/vnd.sar": {
    source: "iana"
  },
  "application/vnd.sbm.cid": {
    source: "iana"
  },
  "application/vnd.sbm.mid2": {
    source: "iana"
  },
  "application/vnd.scribus": {
    source: "iana"
  },
  "application/vnd.sealed.3df": {
    source: "iana"
  },
  "application/vnd.sealed.csf": {
    source: "iana"
  },
  "application/vnd.sealed.doc": {
    source: "iana"
  },
  "application/vnd.sealed.eml": {
    source: "iana"
  },
  "application/vnd.sealed.mht": {
    source: "iana"
  },
  "application/vnd.sealed.net": {
    source: "iana"
  },
  "application/vnd.sealed.ppt": {
    source: "iana"
  },
  "application/vnd.sealed.tiff": {
    source: "iana"
  },
  "application/vnd.sealed.xls": {
    source: "iana"
  },
  "application/vnd.sealedmedia.softseal.html": {
    source: "iana"
  },
  "application/vnd.sealedmedia.softseal.pdf": {
    source: "iana"
  },
  "application/vnd.seemail": {
    source: "iana",
    extensions: ["see"]
  },
  "application/vnd.seis+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.sema": {
    source: "iana",
    extensions: ["sema"]
  },
  "application/vnd.semd": {
    source: "iana",
    extensions: ["semd"]
  },
  "application/vnd.semf": {
    source: "iana",
    extensions: ["semf"]
  },
  "application/vnd.shade-save-file": {
    source: "iana"
  },
  "application/vnd.shana.informed.formdata": {
    source: "iana",
    extensions: ["ifm"]
  },
  "application/vnd.shana.informed.formtemplate": {
    source: "iana",
    extensions: ["itp"]
  },
  "application/vnd.shana.informed.interchange": {
    source: "iana",
    extensions: ["iif"]
  },
  "application/vnd.shana.informed.package": {
    source: "iana",
    extensions: ["ipk"]
  },
  "application/vnd.shootproof+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.shopkick+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.shp": {
    source: "iana"
  },
  "application/vnd.shx": {
    source: "iana"
  },
  "application/vnd.sigrok.session": {
    source: "iana"
  },
  "application/vnd.simtech-mindmapper": {
    source: "iana",
    extensions: ["twd", "twds"]
  },
  "application/vnd.siren+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.smaf": {
    source: "iana",
    extensions: ["mmf"]
  },
  "application/vnd.smart.notebook": {
    source: "iana"
  },
  "application/vnd.smart.teacher": {
    source: "iana",
    extensions: ["teacher"]
  },
  "application/vnd.snesdev-page-table": {
    source: "iana"
  },
  "application/vnd.software602.filler.form+xml": {
    source: "iana",
    compressible: true,
    extensions: ["fo"]
  },
  "application/vnd.software602.filler.form-xml-zip": {
    source: "iana"
  },
  "application/vnd.solent.sdkm+xml": {
    source: "iana",
    compressible: true,
    extensions: ["sdkm", "sdkd"]
  },
  "application/vnd.spotfire.dxp": {
    source: "iana",
    extensions: ["dxp"]
  },
  "application/vnd.spotfire.sfs": {
    source: "iana",
    extensions: ["sfs"]
  },
  "application/vnd.sqlite3": {
    source: "iana"
  },
  "application/vnd.sss-cod": {
    source: "iana"
  },
  "application/vnd.sss-dtf": {
    source: "iana"
  },
  "application/vnd.sss-ntf": {
    source: "iana"
  },
  "application/vnd.stardivision.calc": {
    source: "apache",
    extensions: ["sdc"]
  },
  "application/vnd.stardivision.draw": {
    source: "apache",
    extensions: ["sda"]
  },
  "application/vnd.stardivision.impress": {
    source: "apache",
    extensions: ["sdd"]
  },
  "application/vnd.stardivision.math": {
    source: "apache",
    extensions: ["smf"]
  },
  "application/vnd.stardivision.writer": {
    source: "apache",
    extensions: ["sdw", "vor"]
  },
  "application/vnd.stardivision.writer-global": {
    source: "apache",
    extensions: ["sgl"]
  },
  "application/vnd.stepmania.package": {
    source: "iana",
    extensions: ["smzip"]
  },
  "application/vnd.stepmania.stepchart": {
    source: "iana",
    extensions: ["sm"]
  },
  "application/vnd.street-stream": {
    source: "iana"
  },
  "application/vnd.sun.wadl+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wadl"]
  },
  "application/vnd.sun.xml.calc": {
    source: "apache",
    extensions: ["sxc"]
  },
  "application/vnd.sun.xml.calc.template": {
    source: "apache",
    extensions: ["stc"]
  },
  "application/vnd.sun.xml.draw": {
    source: "apache",
    extensions: ["sxd"]
  },
  "application/vnd.sun.xml.draw.template": {
    source: "apache",
    extensions: ["std"]
  },
  "application/vnd.sun.xml.impress": {
    source: "apache",
    extensions: ["sxi"]
  },
  "application/vnd.sun.xml.impress.template": {
    source: "apache",
    extensions: ["sti"]
  },
  "application/vnd.sun.xml.math": {
    source: "apache",
    extensions: ["sxm"]
  },
  "application/vnd.sun.xml.writer": {
    source: "apache",
    extensions: ["sxw"]
  },
  "application/vnd.sun.xml.writer.global": {
    source: "apache",
    extensions: ["sxg"]
  },
  "application/vnd.sun.xml.writer.template": {
    source: "apache",
    extensions: ["stw"]
  },
  "application/vnd.sus-calendar": {
    source: "iana",
    extensions: ["sus", "susp"]
  },
  "application/vnd.svd": {
    source: "iana",
    extensions: ["svd"]
  },
  "application/vnd.swiftview-ics": {
    source: "iana"
  },
  "application/vnd.sycle+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.syft+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.symbian.install": {
    source: "apache",
    extensions: ["sis", "sisx"]
  },
  "application/vnd.syncml+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["xsm"]
  },
  "application/vnd.syncml.dm+wbxml": {
    source: "iana",
    charset: "UTF-8",
    extensions: ["bdm"]
  },
  "application/vnd.syncml.dm+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["xdm"]
  },
  "application/vnd.syncml.dm.notification": {
    source: "iana"
  },
  "application/vnd.syncml.dmddf+wbxml": {
    source: "iana"
  },
  "application/vnd.syncml.dmddf+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["ddf"]
  },
  "application/vnd.syncml.dmtnds+wbxml": {
    source: "iana"
  },
  "application/vnd.syncml.dmtnds+xml": {
    source: "iana",
    charset: "UTF-8",
    compressible: true
  },
  "application/vnd.syncml.ds.notification": {
    source: "iana"
  },
  "application/vnd.tableschema+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.tao.intent-module-archive": {
    source: "iana",
    extensions: ["tao"]
  },
  "application/vnd.tcpdump.pcap": {
    source: "iana",
    extensions: ["pcap", "cap", "dmp"]
  },
  "application/vnd.think-cell.ppttc+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.tmd.mediaflex.api+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.tml": {
    source: "iana"
  },
  "application/vnd.tmobile-livetv": {
    source: "iana",
    extensions: ["tmo"]
  },
  "application/vnd.tri.onesource": {
    source: "iana"
  },
  "application/vnd.trid.tpt": {
    source: "iana",
    extensions: ["tpt"]
  },
  "application/vnd.triscape.mxs": {
    source: "iana",
    extensions: ["mxs"]
  },
  "application/vnd.trueapp": {
    source: "iana",
    extensions: ["tra"]
  },
  "application/vnd.truedoc": {
    source: "iana"
  },
  "application/vnd.ubisoft.webplayer": {
    source: "iana"
  },
  "application/vnd.ufdl": {
    source: "iana",
    extensions: ["ufd", "ufdl"]
  },
  "application/vnd.uiq.theme": {
    source: "iana",
    extensions: ["utz"]
  },
  "application/vnd.umajin": {
    source: "iana",
    extensions: ["umj"]
  },
  "application/vnd.unity": {
    source: "iana",
    extensions: ["unityweb"]
  },
  "application/vnd.uoml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["uoml"]
  },
  "application/vnd.uplanet.alert": {
    source: "iana"
  },
  "application/vnd.uplanet.alert-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.bearer-choice": {
    source: "iana"
  },
  "application/vnd.uplanet.bearer-choice-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.cacheop": {
    source: "iana"
  },
  "application/vnd.uplanet.cacheop-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.channel": {
    source: "iana"
  },
  "application/vnd.uplanet.channel-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.list": {
    source: "iana"
  },
  "application/vnd.uplanet.list-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.listcmd": {
    source: "iana"
  },
  "application/vnd.uplanet.listcmd-wbxml": {
    source: "iana"
  },
  "application/vnd.uplanet.signal": {
    source: "iana"
  },
  "application/vnd.uri-map": {
    source: "iana"
  },
  "application/vnd.valve.source.material": {
    source: "iana"
  },
  "application/vnd.vcx": {
    source: "iana",
    extensions: ["vcx"]
  },
  "application/vnd.vd-study": {
    source: "iana"
  },
  "application/vnd.vectorworks": {
    source: "iana"
  },
  "application/vnd.vel+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.verimatrix.vcas": {
    source: "iana"
  },
  "application/vnd.veritone.aion+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.veryant.thin": {
    source: "iana"
  },
  "application/vnd.ves.encrypted": {
    source: "iana"
  },
  "application/vnd.vidsoft.vidconference": {
    source: "iana"
  },
  "application/vnd.visio": {
    source: "iana",
    extensions: ["vsd", "vst", "vss", "vsw"]
  },
  "application/vnd.visionary": {
    source: "iana",
    extensions: ["vis"]
  },
  "application/vnd.vividence.scriptfile": {
    source: "iana"
  },
  "application/vnd.vsf": {
    source: "iana",
    extensions: ["vsf"]
  },
  "application/vnd.wap.sic": {
    source: "iana"
  },
  "application/vnd.wap.slc": {
    source: "iana"
  },
  "application/vnd.wap.wbxml": {
    source: "iana",
    charset: "UTF-8",
    extensions: ["wbxml"]
  },
  "application/vnd.wap.wmlc": {
    source: "iana",
    extensions: ["wmlc"]
  },
  "application/vnd.wap.wmlscriptc": {
    source: "iana",
    extensions: ["wmlsc"]
  },
  "application/vnd.webturbo": {
    source: "iana",
    extensions: ["wtb"]
  },
  "application/vnd.wfa.dpp": {
    source: "iana"
  },
  "application/vnd.wfa.p2p": {
    source: "iana"
  },
  "application/vnd.wfa.wsc": {
    source: "iana"
  },
  "application/vnd.windows.devicepairing": {
    source: "iana"
  },
  "application/vnd.wmc": {
    source: "iana"
  },
  "application/vnd.wmf.bootstrap": {
    source: "iana"
  },
  "application/vnd.wolfram.mathematica": {
    source: "iana"
  },
  "application/vnd.wolfram.mathematica.package": {
    source: "iana"
  },
  "application/vnd.wolfram.player": {
    source: "iana",
    extensions: ["nbp"]
  },
  "application/vnd.wordperfect": {
    source: "iana",
    extensions: ["wpd"]
  },
  "application/vnd.wqd": {
    source: "iana",
    extensions: ["wqd"]
  },
  "application/vnd.wrq-hp3000-labelled": {
    source: "iana"
  },
  "application/vnd.wt.stf": {
    source: "iana",
    extensions: ["stf"]
  },
  "application/vnd.wv.csp+wbxml": {
    source: "iana"
  },
  "application/vnd.wv.csp+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.wv.ssp+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.xacml+json": {
    source: "iana",
    compressible: true
  },
  "application/vnd.xara": {
    source: "iana",
    extensions: ["xar"]
  },
  "application/vnd.xfdl": {
    source: "iana",
    extensions: ["xfdl"]
  },
  "application/vnd.xfdl.webform": {
    source: "iana"
  },
  "application/vnd.xmi+xml": {
    source: "iana",
    compressible: true
  },
  "application/vnd.xmpie.cpkg": {
    source: "iana"
  },
  "application/vnd.xmpie.dpkg": {
    source: "iana"
  },
  "application/vnd.xmpie.plan": {
    source: "iana"
  },
  "application/vnd.xmpie.ppkg": {
    source: "iana"
  },
  "application/vnd.xmpie.xlim": {
    source: "iana"
  },
  "application/vnd.yamaha.hv-dic": {
    source: "iana",
    extensions: ["hvd"]
  },
  "application/vnd.yamaha.hv-script": {
    source: "iana",
    extensions: ["hvs"]
  },
  "application/vnd.yamaha.hv-voice": {
    source: "iana",
    extensions: ["hvp"]
  },
  "application/vnd.yamaha.openscoreformat": {
    source: "iana",
    extensions: ["osf"]
  },
  "application/vnd.yamaha.openscoreformat.osfpvg+xml": {
    source: "iana",
    compressible: true,
    extensions: ["osfpvg"]
  },
  "application/vnd.yamaha.remote-setup": {
    source: "iana"
  },
  "application/vnd.yamaha.smaf-audio": {
    source: "iana",
    extensions: ["saf"]
  },
  "application/vnd.yamaha.smaf-phrase": {
    source: "iana",
    extensions: ["spf"]
  },
  "application/vnd.yamaha.through-ngn": {
    source: "iana"
  },
  "application/vnd.yamaha.tunnel-udpencap": {
    source: "iana"
  },
  "application/vnd.yaoweme": {
    source: "iana"
  },
  "application/vnd.yellowriver-custom-menu": {
    source: "iana",
    extensions: ["cmp"]
  },
  "application/vnd.youtube.yt": {
    source: "iana"
  },
  "application/vnd.zul": {
    source: "iana",
    extensions: ["zir", "zirz"]
  },
  "application/vnd.zzazz.deck+xml": {
    source: "iana",
    compressible: true,
    extensions: ["zaz"]
  },
  "application/voicexml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["vxml"]
  },
  "application/voucher-cms+json": {
    source: "iana",
    compressible: true
  },
  "application/vq-rtcpxr": {
    source: "iana"
  },
  "application/wasm": {
    source: "iana",
    compressible: true,
    extensions: ["wasm"]
  },
  "application/watcherinfo+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wif"]
  },
  "application/webpush-options+json": {
    source: "iana",
    compressible: true
  },
  "application/whoispp-query": {
    source: "iana"
  },
  "application/whoispp-response": {
    source: "iana"
  },
  "application/widget": {
    source: "iana",
    extensions: ["wgt"]
  },
  "application/winhlp": {
    source: "apache",
    extensions: ["hlp"]
  },
  "application/wita": {
    source: "iana"
  },
  "application/wordperfect5.1": {
    source: "iana"
  },
  "application/wsdl+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wsdl"]
  },
  "application/wspolicy+xml": {
    source: "iana",
    compressible: true,
    extensions: ["wspolicy"]
  },
  "application/x-7z-compressed": {
    source: "apache",
    compressible: false,
    extensions: ["7z"]
  },
  "application/x-abiword": {
    source: "apache",
    extensions: ["abw"]
  },
  "application/x-ace-compressed": {
    source: "apache",
    extensions: ["ace"]
  },
  "application/x-amf": {
    source: "apache"
  },
  "application/x-apple-diskimage": {
    source: "apache",
    extensions: ["dmg"]
  },
  "application/x-arj": {
    compressible: false,
    extensions: ["arj"]
  },
  "application/x-authorware-bin": {
    source: "apache",
    extensions: ["aab", "x32", "u32", "vox"]
  },
  "application/x-authorware-map": {
    source: "apache",
    extensions: ["aam"]
  },
  "application/x-authorware-seg": {
    source: "apache",
    extensions: ["aas"]
  },
  "application/x-bcpio": {
    source: "apache",
    extensions: ["bcpio"]
  },
  "application/x-bdoc": {
    compressible: false,
    extensions: ["bdoc"]
  },
  "application/x-bittorrent": {
    source: "apache",
    extensions: ["torrent"]
  },
  "application/x-blorb": {
    source: "apache",
    extensions: ["blb", "blorb"]
  },
  "application/x-bzip": {
    source: "apache",
    compressible: false,
    extensions: ["bz"]
  },
  "application/x-bzip2": {
    source: "apache",
    compressible: false,
    extensions: ["bz2", "boz"]
  },
  "application/x-cbr": {
    source: "apache",
    extensions: ["cbr", "cba", "cbt", "cbz", "cb7"]
  },
  "application/x-cdlink": {
    source: "apache",
    extensions: ["vcd"]
  },
  "application/x-cfs-compressed": {
    source: "apache",
    extensions: ["cfs"]
  },
  "application/x-chat": {
    source: "apache",
    extensions: ["chat"]
  },
  "application/x-chess-pgn": {
    source: "apache",
    extensions: ["pgn"]
  },
  "application/x-chrome-extension": {
    extensions: ["crx"]
  },
  "application/x-cocoa": {
    source: "nginx",
    extensions: ["cco"]
  },
  "application/x-compress": {
    source: "apache"
  },
  "application/x-conference": {
    source: "apache",
    extensions: ["nsc"]
  },
  "application/x-cpio": {
    source: "apache",
    extensions: ["cpio"]
  },
  "application/x-csh": {
    source: "apache",
    extensions: ["csh"]
  },
  "application/x-deb": {
    compressible: false
  },
  "application/x-debian-package": {
    source: "apache",
    extensions: ["deb", "udeb"]
  },
  "application/x-dgc-compressed": {
    source: "apache",
    extensions: ["dgc"]
  },
  "application/x-director": {
    source: "apache",
    extensions: ["dir", "dcr", "dxr", "cst", "cct", "cxt", "w3d", "fgd", "swa"]
  },
  "application/x-doom": {
    source: "apache",
    extensions: ["wad"]
  },
  "application/x-dtbncx+xml": {
    source: "apache",
    compressible: true,
    extensions: ["ncx"]
  },
  "application/x-dtbook+xml": {
    source: "apache",
    compressible: true,
    extensions: ["dtb"]
  },
  "application/x-dtbresource+xml": {
    source: "apache",
    compressible: true,
    extensions: ["res"]
  },
  "application/x-dvi": {
    source: "apache",
    compressible: false,
    extensions: ["dvi"]
  },
  "application/x-envoy": {
    source: "apache",
    extensions: ["evy"]
  },
  "application/x-eva": {
    source: "apache",
    extensions: ["eva"]
  },
  "application/x-font-bdf": {
    source: "apache",
    extensions: ["bdf"]
  },
  "application/x-font-dos": {
    source: "apache"
  },
  "application/x-font-framemaker": {
    source: "apache"
  },
  "application/x-font-ghostscript": {
    source: "apache",
    extensions: ["gsf"]
  },
  "application/x-font-libgrx": {
    source: "apache"
  },
  "application/x-font-linux-psf": {
    source: "apache",
    extensions: ["psf"]
  },
  "application/x-font-pcf": {
    source: "apache",
    extensions: ["pcf"]
  },
  "application/x-font-snf": {
    source: "apache",
    extensions: ["snf"]
  },
  "application/x-font-speedo": {
    source: "apache"
  },
  "application/x-font-sunos-news": {
    source: "apache"
  },
  "application/x-font-type1": {
    source: "apache",
    extensions: ["pfa", "pfb", "pfm", "afm"]
  },
  "application/x-font-vfont": {
    source: "apache"
  },
  "application/x-freearc": {
    source: "apache",
    extensions: ["arc"]
  },
  "application/x-futuresplash": {
    source: "apache",
    extensions: ["spl"]
  },
  "application/x-gca-compressed": {
    source: "apache",
    extensions: ["gca"]
  },
  "application/x-glulx": {
    source: "apache",
    extensions: ["ulx"]
  },
  "application/x-gnumeric": {
    source: "apache",
    extensions: ["gnumeric"]
  },
  "application/x-gramps-xml": {
    source: "apache",
    extensions: ["gramps"]
  },
  "application/x-gtar": {
    source: "apache",
    extensions: ["gtar"]
  },
  "application/x-gzip": {
    source: "apache"
  },
  "application/x-hdf": {
    source: "apache",
    extensions: ["hdf"]
  },
  "application/x-httpd-php": {
    compressible: true,
    extensions: ["php"]
  },
  "application/x-install-instructions": {
    source: "apache",
    extensions: ["install"]
  },
  "application/x-iso9660-image": {
    source: "apache",
    extensions: ["iso"]
  },
  "application/x-iwork-keynote-sffkey": {
    extensions: ["key"]
  },
  "application/x-iwork-numbers-sffnumbers": {
    extensions: ["numbers"]
  },
  "application/x-iwork-pages-sffpages": {
    extensions: ["pages"]
  },
  "application/x-java-archive-diff": {
    source: "nginx",
    extensions: ["jardiff"]
  },
  "application/x-java-jnlp-file": {
    source: "apache",
    compressible: false,
    extensions: ["jnlp"]
  },
  "application/x-javascript": {
    compressible: true
  },
  "application/x-keepass2": {
    extensions: ["kdbx"]
  },
  "application/x-latex": {
    source: "apache",
    compressible: false,
    extensions: ["latex"]
  },
  "application/x-lua-bytecode": {
    extensions: ["luac"]
  },
  "application/x-lzh-compressed": {
    source: "apache",
    extensions: ["lzh", "lha"]
  },
  "application/x-makeself": {
    source: "nginx",
    extensions: ["run"]
  },
  "application/x-mie": {
    source: "apache",
    extensions: ["mie"]
  },
  "application/x-mobipocket-ebook": {
    source: "apache",
    extensions: ["prc", "mobi"]
  },
  "application/x-mpegurl": {
    compressible: false
  },
  "application/x-ms-application": {
    source: "apache",
    extensions: ["application"]
  },
  "application/x-ms-shortcut": {
    source: "apache",
    extensions: ["lnk"]
  },
  "application/x-ms-wmd": {
    source: "apache",
    extensions: ["wmd"]
  },
  "application/x-ms-wmz": {
    source: "apache",
    extensions: ["wmz"]
  },
  "application/x-ms-xbap": {
    source: "apache",
    extensions: ["xbap"]
  },
  "application/x-msaccess": {
    source: "apache",
    extensions: ["mdb"]
  },
  "application/x-msbinder": {
    source: "apache",
    extensions: ["obd"]
  },
  "application/x-mscardfile": {
    source: "apache",
    extensions: ["crd"]
  },
  "application/x-msclip": {
    source: "apache",
    extensions: ["clp"]
  },
  "application/x-msdos-program": {
    extensions: ["exe"]
  },
  "application/x-msdownload": {
    source: "apache",
    extensions: ["exe", "dll", "com", "bat", "msi"]
  },
  "application/x-msmediaview": {
    source: "apache",
    extensions: ["mvb", "m13", "m14"]
  },
  "application/x-msmetafile": {
    source: "apache",
    extensions: ["wmf", "wmz", "emf", "emz"]
  },
  "application/x-msmoney": {
    source: "apache",
    extensions: ["mny"]
  },
  "application/x-mspublisher": {
    source: "apache",
    extensions: ["pub"]
  },
  "application/x-msschedule": {
    source: "apache",
    extensions: ["scd"]
  },
  "application/x-msterminal": {
    source: "apache",
    extensions: ["trm"]
  },
  "application/x-mswrite": {
    source: "apache",
    extensions: ["wri"]
  },
  "application/x-netcdf": {
    source: "apache",
    extensions: ["nc", "cdf"]
  },
  "application/x-ns-proxy-autoconfig": {
    compressible: true,
    extensions: ["pac"]
  },
  "application/x-nzb": {
    source: "apache",
    extensions: ["nzb"]
  },
  "application/x-perl": {
    source: "nginx",
    extensions: ["pl", "pm"]
  },
  "application/x-pilot": {
    source: "nginx",
    extensions: ["prc", "pdb"]
  },
  "application/x-pkcs12": {
    source: "apache",
    compressible: false,
    extensions: ["p12", "pfx"]
  },
  "application/x-pkcs7-certificates": {
    source: "apache",
    extensions: ["p7b", "spc"]
  },
  "application/x-pkcs7-certreqresp": {
    source: "apache",
    extensions: ["p7r"]
  },
  "application/x-pki-message": {
    source: "iana"
  },
  "application/x-rar-compressed": {
    source: "apache",
    compressible: false,
    extensions: ["rar"]
  },
  "application/x-redhat-package-manager": {
    source: "nginx",
    extensions: ["rpm"]
  },
  "application/x-research-info-systems": {
    source: "apache",
    extensions: ["ris"]
  },
  "application/x-sea": {
    source: "nginx",
    extensions: ["sea"]
  },
  "application/x-sh": {
    source: "apache",
    compressible: true,
    extensions: ["sh"]
  },
  "application/x-shar": {
    source: "apache",
    extensions: ["shar"]
  },
  "application/x-shockwave-flash": {
    source: "apache",
    compressible: false,
    extensions: ["swf"]
  },
  "application/x-silverlight-app": {
    source: "apache",
    extensions: ["xap"]
  },
  "application/x-sql": {
    source: "apache",
    extensions: ["sql"]
  },
  "application/x-stuffit": {
    source: "apache",
    compressible: false,
    extensions: ["sit"]
  },
  "application/x-stuffitx": {
    source: "apache",
    extensions: ["sitx"]
  },
  "application/x-subrip": {
    source: "apache",
    extensions: ["srt"]
  },
  "application/x-sv4cpio": {
    source: "apache",
    extensions: ["sv4cpio"]
  },
  "application/x-sv4crc": {
    source: "apache",
    extensions: ["sv4crc"]
  },
  "application/x-t3vm-image": {
    source: "apache",
    extensions: ["t3"]
  },
  "application/x-tads": {
    source: "apache",
    extensions: ["gam"]
  },
  "application/x-tar": {
    source: "apache",
    compressible: true,
    extensions: ["tar"]
  },
  "application/x-tcl": {
    source: "apache",
    extensions: ["tcl", "tk"]
  },
  "application/x-tex": {
    source: "apache",
    extensions: ["tex"]
  },
  "application/x-tex-tfm": {
    source: "apache",
    extensions: ["tfm"]
  },
  "application/x-texinfo": {
    source: "apache",
    extensions: ["texinfo", "texi"]
  },
  "application/x-tgif": {
    source: "apache",
    extensions: ["obj"]
  },
  "application/x-ustar": {
    source: "apache",
    extensions: ["ustar"]
  },
  "application/x-virtualbox-hdd": {
    compressible: true,
    extensions: ["hdd"]
  },
  "application/x-virtualbox-ova": {
    compressible: true,
    extensions: ["ova"]
  },
  "application/x-virtualbox-ovf": {
    compressible: true,
    extensions: ["ovf"]
  },
  "application/x-virtualbox-vbox": {
    compressible: true,
    extensions: ["vbox"]
  },
  "application/x-virtualbox-vbox-extpack": {
    compressible: false,
    extensions: ["vbox-extpack"]
  },
  "application/x-virtualbox-vdi": {
    compressible: true,
    extensions: ["vdi"]
  },
  "application/x-virtualbox-vhd": {
    compressible: true,
    extensions: ["vhd"]
  },
  "application/x-virtualbox-vmdk": {
    compressible: true,
    extensions: ["vmdk"]
  },
  "application/x-wais-source": {
    source: "apache",
    extensions: ["src"]
  },
  "application/x-web-app-manifest+json": {
    compressible: true,
    extensions: ["webapp"]
  },
  "application/x-www-form-urlencoded": {
    source: "iana",
    compressible: true
  },
  "application/x-x509-ca-cert": {
    source: "iana",
    extensions: ["der", "crt", "pem"]
  },
  "application/x-x509-ca-ra-cert": {
    source: "iana"
  },
  "application/x-x509-next-ca-cert": {
    source: "iana"
  },
  "application/x-xfig": {
    source: "apache",
    extensions: ["fig"]
  },
  "application/x-xliff+xml": {
    source: "apache",
    compressible: true,
    extensions: ["xlf"]
  },
  "application/x-xpinstall": {
    source: "apache",
    compressible: false,
    extensions: ["xpi"]
  },
  "application/x-xz": {
    source: "apache",
    extensions: ["xz"]
  },
  "application/x-zmachine": {
    source: "apache",
    extensions: ["z1", "z2", "z3", "z4", "z5", "z6", "z7", "z8"]
  },
  "application/x400-bp": {
    source: "iana"
  },
  "application/xacml+xml": {
    source: "iana",
    compressible: true
  },
  "application/xaml+xml": {
    source: "apache",
    compressible: true,
    extensions: ["xaml"]
  },
  "application/xcap-att+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xav"]
  },
  "application/xcap-caps+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xca"]
  },
  "application/xcap-diff+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xdf"]
  },
  "application/xcap-el+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xel"]
  },
  "application/xcap-error+xml": {
    source: "iana",
    compressible: true
  },
  "application/xcap-ns+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xns"]
  },
  "application/xcon-conference-info+xml": {
    source: "iana",
    compressible: true
  },
  "application/xcon-conference-info-diff+xml": {
    source: "iana",
    compressible: true
  },
  "application/xenc+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xenc"]
  },
  "application/xhtml+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xhtml", "xht"]
  },
  "application/xhtml-voice+xml": {
    source: "apache",
    compressible: true
  },
  "application/xliff+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xlf"]
  },
  "application/xml": {
    source: "iana",
    compressible: true,
    extensions: ["xml", "xsl", "xsd", "rng"]
  },
  "application/xml-dtd": {
    source: "iana",
    compressible: true,
    extensions: ["dtd"]
  },
  "application/xml-external-parsed-entity": {
    source: "iana"
  },
  "application/xml-patch+xml": {
    source: "iana",
    compressible: true
  },
  "application/xmpp+xml": {
    source: "iana",
    compressible: true
  },
  "application/xop+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xop"]
  },
  "application/xproc+xml": {
    source: "apache",
    compressible: true,
    extensions: ["xpl"]
  },
  "application/xslt+xml": {
    source: "iana",
    compressible: true,
    extensions: ["xsl", "xslt"]
  },
  "application/xspf+xml": {
    source: "apache",
    compressible: true,
    extensions: ["xspf"]
  },
  "application/xv+xml": {
    source: "iana",
    compressible: true,
    extensions: ["mxml", "xhvml", "xvml", "xvm"]
  },
  "application/yang": {
    source: "iana",
    extensions: ["yang"]
  },
  "application/yang-data+json": {
    source: "iana",
    compressible: true
  },
  "application/yang-data+xml": {
    source: "iana",
    compressible: true
  },
  "application/yang-patch+json": {
    source: "iana",
    compressible: true
  },
  "application/yang-patch+xml": {
    source: "iana",
    compressible: true
  },
  "application/yin+xml": {
    source: "iana",
    compressible: true,
    extensions: ["yin"]
  },
  "application/zip": {
    source: "iana",
    compressible: false,
    extensions: ["zip"]
  },
  "application/zlib": {
    source: "iana"
  },
  "application/zstd": {
    source: "iana"
  },
  "audio/1d-interleaved-parityfec": {
    source: "iana"
  },
  "audio/32kadpcm": {
    source: "iana"
  },
  "audio/3gpp": {
    source: "iana",
    compressible: false,
    extensions: ["3gpp"]
  },
  "audio/3gpp2": {
    source: "iana"
  },
  "audio/aac": {
    source: "iana"
  },
  "audio/ac3": {
    source: "iana"
  },
  "audio/adpcm": {
    source: "apache",
    extensions: ["adp"]
  },
  "audio/amr": {
    source: "iana",
    extensions: ["amr"]
  },
  "audio/amr-wb": {
    source: "iana"
  },
  "audio/amr-wb+": {
    source: "iana"
  },
  "audio/aptx": {
    source: "iana"
  },
  "audio/asc": {
    source: "iana"
  },
  "audio/atrac-advanced-lossless": {
    source: "iana"
  },
  "audio/atrac-x": {
    source: "iana"
  },
  "audio/atrac3": {
    source: "iana"
  },
  "audio/basic": {
    source: "iana",
    compressible: false,
    extensions: ["au", "snd"]
  },
  "audio/bv16": {
    source: "iana"
  },
  "audio/bv32": {
    source: "iana"
  },
  "audio/clearmode": {
    source: "iana"
  },
  "audio/cn": {
    source: "iana"
  },
  "audio/dat12": {
    source: "iana"
  },
  "audio/dls": {
    source: "iana"
  },
  "audio/dsr-es201108": {
    source: "iana"
  },
  "audio/dsr-es202050": {
    source: "iana"
  },
  "audio/dsr-es202211": {
    source: "iana"
  },
  "audio/dsr-es202212": {
    source: "iana"
  },
  "audio/dv": {
    source: "iana"
  },
  "audio/dvi4": {
    source: "iana"
  },
  "audio/eac3": {
    source: "iana"
  },
  "audio/encaprtp": {
    source: "iana"
  },
  "audio/evrc": {
    source: "iana"
  },
  "audio/evrc-qcp": {
    source: "iana"
  },
  "audio/evrc0": {
    source: "iana"
  },
  "audio/evrc1": {
    source: "iana"
  },
  "audio/evrcb": {
    source: "iana"
  },
  "audio/evrcb0": {
    source: "iana"
  },
  "audio/evrcb1": {
    source: "iana"
  },
  "audio/evrcnw": {
    source: "iana"
  },
  "audio/evrcnw0": {
    source: "iana"
  },
  "audio/evrcnw1": {
    source: "iana"
  },
  "audio/evrcwb": {
    source: "iana"
  },
  "audio/evrcwb0": {
    source: "iana"
  },
  "audio/evrcwb1": {
    source: "iana"
  },
  "audio/evs": {
    source: "iana"
  },
  "audio/flexfec": {
    source: "iana"
  },
  "audio/fwdred": {
    source: "iana"
  },
  "audio/g711-0": {
    source: "iana"
  },
  "audio/g719": {
    source: "iana"
  },
  "audio/g722": {
    source: "iana"
  },
  "audio/g7221": {
    source: "iana"
  },
  "audio/g723": {
    source: "iana"
  },
  "audio/g726-16": {
    source: "iana"
  },
  "audio/g726-24": {
    source: "iana"
  },
  "audio/g726-32": {
    source: "iana"
  },
  "audio/g726-40": {
    source: "iana"
  },
  "audio/g728": {
    source: "iana"
  },
  "audio/g729": {
    source: "iana"
  },
  "audio/g7291": {
    source: "iana"
  },
  "audio/g729d": {
    source: "iana"
  },
  "audio/g729e": {
    source: "iana"
  },
  "audio/gsm": {
    source: "iana"
  },
  "audio/gsm-efr": {
    source: "iana"
  },
  "audio/gsm-hr-08": {
    source: "iana"
  },
  "audio/ilbc": {
    source: "iana"
  },
  "audio/ip-mr_v2.5": {
    source: "iana"
  },
  "audio/isac": {
    source: "apache"
  },
  "audio/l16": {
    source: "iana"
  },
  "audio/l20": {
    source: "iana"
  },
  "audio/l24": {
    source: "iana",
    compressible: false
  },
  "audio/l8": {
    source: "iana"
  },
  "audio/lpc": {
    source: "iana"
  },
  "audio/melp": {
    source: "iana"
  },
  "audio/melp1200": {
    source: "iana"
  },
  "audio/melp2400": {
    source: "iana"
  },
  "audio/melp600": {
    source: "iana"
  },
  "audio/mhas": {
    source: "iana"
  },
  "audio/midi": {
    source: "apache",
    extensions: ["mid", "midi", "kar", "rmi"]
  },
  "audio/mobile-xmf": {
    source: "iana",
    extensions: ["mxmf"]
  },
  "audio/mp3": {
    compressible: false,
    extensions: ["mp3"]
  },
  "audio/mp4": {
    source: "iana",
    compressible: false,
    extensions: ["m4a", "mp4a"]
  },
  "audio/mp4a-latm": {
    source: "iana"
  },
  "audio/mpa": {
    source: "iana"
  },
  "audio/mpa-robust": {
    source: "iana"
  },
  "audio/mpeg": {
    source: "iana",
    compressible: false,
    extensions: ["mpga", "mp2", "mp2a", "mp3", "m2a", "m3a"]
  },
  "audio/mpeg4-generic": {
    source: "iana"
  },
  "audio/musepack": {
    source: "apache"
  },
  "audio/ogg": {
    source: "iana",
    compressible: false,
    extensions: ["oga", "ogg", "spx", "opus"]
  },
  "audio/opus": {
    source: "iana"
  },
  "audio/parityfec": {
    source: "iana"
  },
  "audio/pcma": {
    source: "iana"
  },
  "audio/pcma-wb": {
    source: "iana"
  },
  "audio/pcmu": {
    source: "iana"
  },
  "audio/pcmu-wb": {
    source: "iana"
  },
  "audio/prs.sid": {
    source: "iana"
  },
  "audio/qcelp": {
    source: "iana"
  },
  "audio/raptorfec": {
    source: "iana"
  },
  "audio/red": {
    source: "iana"
  },
  "audio/rtp-enc-aescm128": {
    source: "iana"
  },
  "audio/rtp-midi": {
    source: "iana"
  },
  "audio/rtploopback": {
    source: "iana"
  },
  "audio/rtx": {
    source: "iana"
  },
  "audio/s3m": {
    source: "apache",
    extensions: ["s3m"]
  },
  "audio/scip": {
    source: "iana"
  },
  "audio/silk": {
    source: "apache",
    extensions: ["sil"]
  },
  "audio/smv": {
    source: "iana"
  },
  "audio/smv-qcp": {
    source: "iana"
  },
  "audio/smv0": {
    source: "iana"
  },
  "audio/sofa": {
    source: "iana"
  },
  "audio/sp-midi": {
    source: "iana"
  },
  "audio/speex": {
    source: "iana"
  },
  "audio/t140c": {
    source: "iana"
  },
  "audio/t38": {
    source: "iana"
  },
  "audio/telephone-event": {
    source: "iana"
  },
  "audio/tetra_acelp": {
    source: "iana"
  },
  "audio/tetra_acelp_bb": {
    source: "iana"
  },
  "audio/tone": {
    source: "iana"
  },
  "audio/tsvcis": {
    source: "iana"
  },
  "audio/uemclip": {
    source: "iana"
  },
  "audio/ulpfec": {
    source: "iana"
  },
  "audio/usac": {
    source: "iana"
  },
  "audio/vdvi": {
    source: "iana"
  },
  "audio/vmr-wb": {
    source: "iana"
  },
  "audio/vnd.3gpp.iufp": {
    source: "iana"
  },
  "audio/vnd.4sb": {
    source: "iana"
  },
  "audio/vnd.audiokoz": {
    source: "iana"
  },
  "audio/vnd.celp": {
    source: "iana"
  },
  "audio/vnd.cisco.nse": {
    source: "iana"
  },
  "audio/vnd.cmles.radio-events": {
    source: "iana"
  },
  "audio/vnd.cns.anp1": {
    source: "iana"
  },
  "audio/vnd.cns.inf1": {
    source: "iana"
  },
  "audio/vnd.dece.audio": {
    source: "iana",
    extensions: ["uva", "uvva"]
  },
  "audio/vnd.digital-winds": {
    source: "iana",
    extensions: ["eol"]
  },
  "audio/vnd.dlna.adts": {
    source: "iana"
  },
  "audio/vnd.dolby.heaac.1": {
    source: "iana"
  },
  "audio/vnd.dolby.heaac.2": {
    source: "iana"
  },
  "audio/vnd.dolby.mlp": {
    source: "iana"
  },
  "audio/vnd.dolby.mps": {
    source: "iana"
  },
  "audio/vnd.dolby.pl2": {
    source: "iana"
  },
  "audio/vnd.dolby.pl2x": {
    source: "iana"
  },
  "audio/vnd.dolby.pl2z": {
    source: "iana"
  },
  "audio/vnd.dolby.pulse.1": {
    source: "iana"
  },
  "audio/vnd.dra": {
    source: "iana",
    extensions: ["dra"]
  },
  "audio/vnd.dts": {
    source: "iana",
    extensions: ["dts"]
  },
  "audio/vnd.dts.hd": {
    source: "iana",
    extensions: ["dtshd"]
  },
  "audio/vnd.dts.uhd": {
    source: "iana"
  },
  "audio/vnd.dvb.file": {
    source: "iana"
  },
  "audio/vnd.everad.plj": {
    source: "iana"
  },
  "audio/vnd.hns.audio": {
    source: "iana"
  },
  "audio/vnd.lucent.voice": {
    source: "iana",
    extensions: ["lvp"]
  },
  "audio/vnd.ms-playready.media.pya": {
    source: "iana",
    extensions: ["pya"]
  },
  "audio/vnd.nokia.mobile-xmf": {
    source: "iana"
  },
  "audio/vnd.nortel.vbk": {
    source: "iana"
  },
  "audio/vnd.nuera.ecelp4800": {
    source: "iana",
    extensions: ["ecelp4800"]
  },
  "audio/vnd.nuera.ecelp7470": {
    source: "iana",
    extensions: ["ecelp7470"]
  },
  "audio/vnd.nuera.ecelp9600": {
    source: "iana",
    extensions: ["ecelp9600"]
  },
  "audio/vnd.octel.sbc": {
    source: "iana"
  },
  "audio/vnd.presonus.multitrack": {
    source: "iana"
  },
  "audio/vnd.qcelp": {
    source: "iana"
  },
  "audio/vnd.rhetorex.32kadpcm": {
    source: "iana"
  },
  "audio/vnd.rip": {
    source: "iana",
    extensions: ["rip"]
  },
  "audio/vnd.rn-realaudio": {
    compressible: false
  },
  "audio/vnd.sealedmedia.softseal.mpeg": {
    source: "iana"
  },
  "audio/vnd.vmx.cvsd": {
    source: "iana"
  },
  "audio/vnd.wave": {
    compressible: false
  },
  "audio/vorbis": {
    source: "iana",
    compressible: false
  },
  "audio/vorbis-config": {
    source: "iana"
  },
  "audio/wav": {
    compressible: false,
    extensions: ["wav"]
  },
  "audio/wave": {
    compressible: false,
    extensions: ["wav"]
  },
  "audio/webm": {
    source: "apache",
    compressible: false,
    extensions: ["weba"]
  },
  "audio/x-aac": {
    source: "apache",
    compressible: false,
    extensions: ["aac"]
  },
  "audio/x-aiff": {
    source: "apache",
    extensions: ["aif", "aiff", "aifc"]
  },
  "audio/x-caf": {
    source: "apache",
    compressible: false,
    extensions: ["caf"]
  },
  "audio/x-flac": {
    source: "apache",
    extensions: ["flac"]
  },
  "audio/x-m4a": {
    source: "nginx",
    extensions: ["m4a"]
  },
  "audio/x-matroska": {
    source: "apache",
    extensions: ["mka"]
  },
  "audio/x-mpegurl": {
    source: "apache",
    extensions: ["m3u"]
  },
  "audio/x-ms-wax": {
    source: "apache",
    extensions: ["wax"]
  },
  "audio/x-ms-wma": {
    source: "apache",
    extensions: ["wma"]
  },
  "audio/x-pn-realaudio": {
    source: "apache",
    extensions: ["ram", "ra"]
  },
  "audio/x-pn-realaudio-plugin": {
    source: "apache",
    extensions: ["rmp"]
  },
  "audio/x-realaudio": {
    source: "nginx",
    extensions: ["ra"]
  },
  "audio/x-tta": {
    source: "apache"
  },
  "audio/x-wav": {
    source: "apache",
    extensions: ["wav"]
  },
  "audio/xm": {
    source: "apache",
    extensions: ["xm"]
  },
  "chemical/x-cdx": {
    source: "apache",
    extensions: ["cdx"]
  },
  "chemical/x-cif": {
    source: "apache",
    extensions: ["cif"]
  },
  "chemical/x-cmdf": {
    source: "apache",
    extensions: ["cmdf"]
  },
  "chemical/x-cml": {
    source: "apache",
    extensions: ["cml"]
  },
  "chemical/x-csml": {
    source: "apache",
    extensions: ["csml"]
  },
  "chemical/x-pdb": {
    source: "apache"
  },
  "chemical/x-xyz": {
    source: "apache",
    extensions: ["xyz"]
  },
  "font/collection": {
    source: "iana",
    extensions: ["ttc"]
  },
  "font/otf": {
    source: "iana",
    compressible: true,
    extensions: ["otf"]
  },
  "font/sfnt": {
    source: "iana"
  },
  "font/ttf": {
    source: "iana",
    compressible: true,
    extensions: ["ttf"]
  },
  "font/woff": {
    source: "iana",
    extensions: ["woff"]
  },
  "font/woff2": {
    source: "iana",
    extensions: ["woff2"]
  },
  "image/aces": {
    source: "iana",
    extensions: ["exr"]
  },
  "image/apng": {
    compressible: false,
    extensions: ["apng"]
  },
  "image/avci": {
    source: "iana",
    extensions: ["avci"]
  },
  "image/avcs": {
    source: "iana",
    extensions: ["avcs"]
  },
  "image/avif": {
    source: "iana",
    compressible: false,
    extensions: ["avif"]
  },
  "image/bmp": {
    source: "iana",
    compressible: true,
    extensions: ["bmp"]
  },
  "image/cgm": {
    source: "iana",
    extensions: ["cgm"]
  },
  "image/dicom-rle": {
    source: "iana",
    extensions: ["drle"]
  },
  "image/emf": {
    source: "iana",
    extensions: ["emf"]
  },
  "image/fits": {
    source: "iana",
    extensions: ["fits"]
  },
  "image/g3fax": {
    source: "iana",
    extensions: ["g3"]
  },
  "image/gif": {
    source: "iana",
    compressible: false,
    extensions: ["gif"]
  },
  "image/heic": {
    source: "iana",
    extensions: ["heic"]
  },
  "image/heic-sequence": {
    source: "iana",
    extensions: ["heics"]
  },
  "image/heif": {
    source: "iana",
    extensions: ["heif"]
  },
  "image/heif-sequence": {
    source: "iana",
    extensions: ["heifs"]
  },
  "image/hej2k": {
    source: "iana",
    extensions: ["hej2"]
  },
  "image/hsj2": {
    source: "iana",
    extensions: ["hsj2"]
  },
  "image/ief": {
    source: "iana",
    extensions: ["ief"]
  },
  "image/jls": {
    source: "iana",
    extensions: ["jls"]
  },
  "image/jp2": {
    source: "iana",
    compressible: false,
    extensions: ["jp2", "jpg2"]
  },
  "image/jpeg": {
    source: "iana",
    compressible: false,
    extensions: ["jpeg", "jpg", "jpe"]
  },
  "image/jph": {
    source: "iana",
    extensions: ["jph"]
  },
  "image/jphc": {
    source: "iana",
    extensions: ["jhc"]
  },
  "image/jpm": {
    source: "iana",
    compressible: false,
    extensions: ["jpm"]
  },
  "image/jpx": {
    source: "iana",
    compressible: false,
    extensions: ["jpx", "jpf"]
  },
  "image/jxr": {
    source: "iana",
    extensions: ["jxr"]
  },
  "image/jxra": {
    source: "iana",
    extensions: ["jxra"]
  },
  "image/jxrs": {
    source: "iana",
    extensions: ["jxrs"]
  },
  "image/jxs": {
    source: "iana",
    extensions: ["jxs"]
  },
  "image/jxsc": {
    source: "iana",
    extensions: ["jxsc"]
  },
  "image/jxsi": {
    source: "iana",
    extensions: ["jxsi"]
  },
  "image/jxss": {
    source: "iana",
    extensions: ["jxss"]
  },
  "image/ktx": {
    source: "iana",
    extensions: ["ktx"]
  },
  "image/ktx2": {
    source: "iana",
    extensions: ["ktx2"]
  },
  "image/naplps": {
    source: "iana"
  },
  "image/pjpeg": {
    compressible: false
  },
  "image/png": {
    source: "iana",
    compressible: false,
    extensions: ["png"]
  },
  "image/prs.btif": {
    source: "iana",
    extensions: ["btif"]
  },
  "image/prs.pti": {
    source: "iana",
    extensions: ["pti"]
  },
  "image/pwg-raster": {
    source: "iana"
  },
  "image/sgi": {
    source: "apache",
    extensions: ["sgi"]
  },
  "image/svg+xml": {
    source: "iana",
    compressible: true,
    extensions: ["svg", "svgz"]
  },
  "image/t38": {
    source: "iana",
    extensions: ["t38"]
  },
  "image/tiff": {
    source: "iana",
    compressible: false,
    extensions: ["tif", "tiff"]
  },
  "image/tiff-fx": {
    source: "iana",
    extensions: ["tfx"]
  },
  "image/vnd.adobe.photoshop": {
    source: "iana",
    compressible: true,
    extensions: ["psd"]
  },
  "image/vnd.airzip.accelerator.azv": {
    source: "iana",
    extensions: ["azv"]
  },
  "image/vnd.cns.inf2": {
    source: "iana"
  },
  "image/vnd.dece.graphic": {
    source: "iana",
    extensions: ["uvi", "uvvi", "uvg", "uvvg"]
  },
  "image/vnd.djvu": {
    source: "iana",
    extensions: ["djvu", "djv"]
  },
  "image/vnd.dvb.subtitle": {
    source: "iana",
    extensions: ["sub"]
  },
  "image/vnd.dwg": {
    source: "iana",
    extensions: ["dwg"]
  },
  "image/vnd.dxf": {
    source: "iana",
    extensions: ["dxf"]
  },
  "image/vnd.fastbidsheet": {
    source: "iana",
    extensions: ["fbs"]
  },
  "image/vnd.fpx": {
    source: "iana",
    extensions: ["fpx"]
  },
  "image/vnd.fst": {
    source: "iana",
    extensions: ["fst"]
  },
  "image/vnd.fujixerox.edmics-mmr": {
    source: "iana",
    extensions: ["mmr"]
  },
  "image/vnd.fujixerox.edmics-rlc": {
    source: "iana",
    extensions: ["rlc"]
  },
  "image/vnd.globalgraphics.pgb": {
    source: "iana"
  },
  "image/vnd.microsoft.icon": {
    source: "iana",
    compressible: true,
    extensions: ["ico"]
  },
  "image/vnd.mix": {
    source: "iana"
  },
  "image/vnd.mozilla.apng": {
    source: "iana"
  },
  "image/vnd.ms-dds": {
    compressible: true,
    extensions: ["dds"]
  },
  "image/vnd.ms-modi": {
    source: "iana",
    extensions: ["mdi"]
  },
  "image/vnd.ms-photo": {
    source: "apache",
    extensions: ["wdp"]
  },
  "image/vnd.net-fpx": {
    source: "iana",
    extensions: ["npx"]
  },
  "image/vnd.pco.b16": {
    source: "iana",
    extensions: ["b16"]
  },
  "image/vnd.radiance": {
    source: "iana"
  },
  "image/vnd.sealed.png": {
    source: "iana"
  },
  "image/vnd.sealedmedia.softseal.gif": {
    source: "iana"
  },
  "image/vnd.sealedmedia.softseal.jpg": {
    source: "iana"
  },
  "image/vnd.svf": {
    source: "iana"
  },
  "image/vnd.tencent.tap": {
    source: "iana",
    extensions: ["tap"]
  },
  "image/vnd.valve.source.texture": {
    source: "iana",
    extensions: ["vtf"]
  },
  "image/vnd.wap.wbmp": {
    source: "iana",
    extensions: ["wbmp"]
  },
  "image/vnd.xiff": {
    source: "iana",
    extensions: ["xif"]
  },
  "image/vnd.zbrush.pcx": {
    source: "iana",
    extensions: ["pcx"]
  },
  "image/webp": {
    source: "apache",
    extensions: ["webp"]
  },
  "image/wmf": {
    source: "iana",
    extensions: ["wmf"]
  },
  "image/x-3ds": {
    source: "apache",
    extensions: ["3ds"]
  },
  "image/x-cmu-raster": {
    source: "apache",
    extensions: ["ras"]
  },
  "image/x-cmx": {
    source: "apache",
    extensions: ["cmx"]
  },
  "image/x-freehand": {
    source: "apache",
    extensions: ["fh", "fhc", "fh4", "fh5", "fh7"]
  },
  "image/x-icon": {
    source: "apache",
    compressible: true,
    extensions: ["ico"]
  },
  "image/x-jng": {
    source: "nginx",
    extensions: ["jng"]
  },
  "image/x-mrsid-image": {
    source: "apache",
    extensions: ["sid"]
  },
  "image/x-ms-bmp": {
    source: "nginx",
    compressible: true,
    extensions: ["bmp"]
  },
  "image/x-pcx": {
    source: "apache",
    extensions: ["pcx"]
  },
  "image/x-pict": {
    source: "apache",
    extensions: ["pic", "pct"]
  },
  "image/x-portable-anymap": {
    source: "apache",
    extensions: ["pnm"]
  },
  "image/x-portable-bitmap": {
    source: "apache",
    extensions: ["pbm"]
  },
  "image/x-portable-graymap": {
    source: "apache",
    extensions: ["pgm"]
  },
  "image/x-portable-pixmap": {
    source: "apache",
    extensions: ["ppm"]
  },
  "image/x-rgb": {
    source: "apache",
    extensions: ["rgb"]
  },
  "image/x-tga": {
    source: "apache",
    extensions: ["tga"]
  },
  "image/x-xbitmap": {
    source: "apache",
    extensions: ["xbm"]
  },
  "image/x-xcf": {
    compressible: false
  },
  "image/x-xpixmap": {
    source: "apache",
    extensions: ["xpm"]
  },
  "image/x-xwindowdump": {
    source: "apache",
    extensions: ["xwd"]
  },
  "message/cpim": {
    source: "iana"
  },
  "message/delivery-status": {
    source: "iana"
  },
  "message/disposition-notification": {
    source: "iana",
    extensions: ["disposition-notification"]
  },
  "message/external-body": {
    source: "iana"
  },
  "message/feedback-report": {
    source: "iana"
  },
  "message/global": {
    source: "iana",
    extensions: ["u8msg"]
  },
  "message/global-delivery-status": {
    source: "iana",
    extensions: ["u8dsn"]
  },
  "message/global-disposition-notification": {
    source: "iana",
    extensions: ["u8mdn"]
  },
  "message/global-headers": {
    source: "iana",
    extensions: ["u8hdr"]
  },
  "message/http": {
    source: "iana",
    compressible: false
  },
  "message/imdn+xml": {
    source: "iana",
    compressible: true
  },
  "message/news": {
    source: "iana"
  },
  "message/partial": {
    source: "iana",
    compressible: false
  },
  "message/rfc822": {
    source: "iana",
    compressible: true,
    extensions: ["eml", "mime"]
  },
  "message/s-http": {
    source: "iana"
  },
  "message/sip": {
    source: "iana"
  },
  "message/sipfrag": {
    source: "iana"
  },
  "message/tracking-status": {
    source: "iana"
  },
  "message/vnd.si.simp": {
    source: "iana"
  },
  "message/vnd.wfa.wsc": {
    source: "iana",
    extensions: ["wsc"]
  },
  "model/3mf": {
    source: "iana",
    extensions: ["3mf"]
  },
  "model/e57": {
    source: "iana"
  },
  "model/gltf+json": {
    source: "iana",
    compressible: true,
    extensions: ["gltf"]
  },
  "model/gltf-binary": {
    source: "iana",
    compressible: true,
    extensions: ["glb"]
  },
  "model/iges": {
    source: "iana",
    compressible: false,
    extensions: ["igs", "iges"]
  },
  "model/mesh": {
    source: "iana",
    compressible: false,
    extensions: ["msh", "mesh", "silo"]
  },
  "model/mtl": {
    source: "iana",
    extensions: ["mtl"]
  },
  "model/obj": {
    source: "iana",
    extensions: ["obj"]
  },
  "model/step": {
    source: "iana"
  },
  "model/step+xml": {
    source: "iana",
    compressible: true,
    extensions: ["stpx"]
  },
  "model/step+zip": {
    source: "iana",
    compressible: false,
    extensions: ["stpz"]
  },
  "model/step-xml+zip": {
    source: "iana",
    compressible: false,
    extensions: ["stpxz"]
  },
  "model/stl": {
    source: "iana",
    extensions: ["stl"]
  },
  "model/vnd.collada+xml": {
    source: "iana",
    compressible: true,
    extensions: ["dae"]
  },
  "model/vnd.dwf": {
    source: "iana",
    extensions: ["dwf"]
  },
  "model/vnd.flatland.3dml": {
    source: "iana"
  },
  "model/vnd.gdl": {
    source: "iana",
    extensions: ["gdl"]
  },
  "model/vnd.gs-gdl": {
    source: "apache"
  },
  "model/vnd.gs.gdl": {
    source: "iana"
  },
  "model/vnd.gtw": {
    source: "iana",
    extensions: ["gtw"]
  },
  "model/vnd.moml+xml": {
    source: "iana",
    compressible: true
  },
  "model/vnd.mts": {
    source: "iana",
    extensions: ["mts"]
  },
  "model/vnd.opengex": {
    source: "iana",
    extensions: ["ogex"]
  },
  "model/vnd.parasolid.transmit.binary": {
    source: "iana",
    extensions: ["x_b"]
  },
  "model/vnd.parasolid.transmit.text": {
    source: "iana",
    extensions: ["x_t"]
  },
  "model/vnd.pytha.pyox": {
    source: "iana"
  },
  "model/vnd.rosette.annotated-data-model": {
    source: "iana"
  },
  "model/vnd.sap.vds": {
    source: "iana",
    extensions: ["vds"]
  },
  "model/vnd.usdz+zip": {
    source: "iana",
    compressible: false,
    extensions: ["usdz"]
  },
  "model/vnd.valve.source.compiled-map": {
    source: "iana",
    extensions: ["bsp"]
  },
  "model/vnd.vtu": {
    source: "iana",
    extensions: ["vtu"]
  },
  "model/vrml": {
    source: "iana",
    compressible: false,
    extensions: ["wrl", "vrml"]
  },
  "model/x3d+binary": {
    source: "apache",
    compressible: false,
    extensions: ["x3db", "x3dbz"]
  },
  "model/x3d+fastinfoset": {
    source: "iana",
    extensions: ["x3db"]
  },
  "model/x3d+vrml": {
    source: "apache",
    compressible: false,
    extensions: ["x3dv", "x3dvz"]
  },
  "model/x3d+xml": {
    source: "iana",
    compressible: true,
    extensions: ["x3d", "x3dz"]
  },
  "model/x3d-vrml": {
    source: "iana",
    extensions: ["x3dv"]
  },
  "multipart/alternative": {
    source: "iana",
    compressible: false
  },
  "multipart/appledouble": {
    source: "iana"
  },
  "multipart/byteranges": {
    source: "iana"
  },
  "multipart/digest": {
    source: "iana"
  },
  "multipart/encrypted": {
    source: "iana",
    compressible: false
  },
  "multipart/form-data": {
    source: "iana",
    compressible: false
  },
  "multipart/header-set": {
    source: "iana"
  },
  "multipart/mixed": {
    source: "iana"
  },
  "multipart/multilingual": {
    source: "iana"
  },
  "multipart/parallel": {
    source: "iana"
  },
  "multipart/related": {
    source: "iana",
    compressible: false
  },
  "multipart/report": {
    source: "iana"
  },
  "multipart/signed": {
    source: "iana",
    compressible: false
  },
  "multipart/vnd.bint.med-plus": {
    source: "iana"
  },
  "multipart/voice-message": {
    source: "iana"
  },
  "multipart/x-mixed-replace": {
    source: "iana"
  },
  "text/1d-interleaved-parityfec": {
    source: "iana"
  },
  "text/cache-manifest": {
    source: "iana",
    compressible: true,
    extensions: ["appcache", "manifest"]
  },
  "text/calendar": {
    source: "iana",
    extensions: ["ics", "ifb"]
  },
  "text/calender": {
    compressible: true
  },
  "text/cmd": {
    compressible: true
  },
  "text/coffeescript": {
    extensions: ["coffee", "litcoffee"]
  },
  "text/cql": {
    source: "iana"
  },
  "text/cql-expression": {
    source: "iana"
  },
  "text/cql-identifier": {
    source: "iana"
  },
  "text/css": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["css"]
  },
  "text/csv": {
    source: "iana",
    compressible: true,
    extensions: ["csv"]
  },
  "text/csv-schema": {
    source: "iana"
  },
  "text/directory": {
    source: "iana"
  },
  "text/dns": {
    source: "iana"
  },
  "text/ecmascript": {
    source: "iana"
  },
  "text/encaprtp": {
    source: "iana"
  },
  "text/enriched": {
    source: "iana"
  },
  "text/fhirpath": {
    source: "iana"
  },
  "text/flexfec": {
    source: "iana"
  },
  "text/fwdred": {
    source: "iana"
  },
  "text/gff3": {
    source: "iana"
  },
  "text/grammar-ref-list": {
    source: "iana"
  },
  "text/html": {
    source: "iana",
    compressible: true,
    extensions: ["html", "htm", "shtml"]
  },
  "text/jade": {
    extensions: ["jade"]
  },
  "text/javascript": {
    source: "iana",
    compressible: true
  },
  "text/jcr-cnd": {
    source: "iana"
  },
  "text/jsx": {
    compressible: true,
    extensions: ["jsx"]
  },
  "text/less": {
    compressible: true,
    extensions: ["less"]
  },
  "text/markdown": {
    source: "iana",
    compressible: true,
    extensions: ["markdown", "md"]
  },
  "text/mathml": {
    source: "nginx",
    extensions: ["mml"]
  },
  "text/mdx": {
    compressible: true,
    extensions: ["mdx"]
  },
  "text/mizar": {
    source: "iana"
  },
  "text/n3": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["n3"]
  },
  "text/parameters": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/parityfec": {
    source: "iana"
  },
  "text/plain": {
    source: "iana",
    compressible: true,
    extensions: ["txt", "text", "conf", "def", "list", "log", "in", "ini"]
  },
  "text/provenance-notation": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/prs.fallenstein.rst": {
    source: "iana"
  },
  "text/prs.lines.tag": {
    source: "iana",
    extensions: ["dsc"]
  },
  "text/prs.prop.logic": {
    source: "iana"
  },
  "text/raptorfec": {
    source: "iana"
  },
  "text/red": {
    source: "iana"
  },
  "text/rfc822-headers": {
    source: "iana"
  },
  "text/richtext": {
    source: "iana",
    compressible: true,
    extensions: ["rtx"]
  },
  "text/rtf": {
    source: "iana",
    compressible: true,
    extensions: ["rtf"]
  },
  "text/rtp-enc-aescm128": {
    source: "iana"
  },
  "text/rtploopback": {
    source: "iana"
  },
  "text/rtx": {
    source: "iana"
  },
  "text/sgml": {
    source: "iana",
    extensions: ["sgml", "sgm"]
  },
  "text/shaclc": {
    source: "iana"
  },
  "text/shex": {
    source: "iana",
    extensions: ["shex"]
  },
  "text/slim": {
    extensions: ["slim", "slm"]
  },
  "text/spdx": {
    source: "iana",
    extensions: ["spdx"]
  },
  "text/strings": {
    source: "iana"
  },
  "text/stylus": {
    extensions: ["stylus", "styl"]
  },
  "text/t140": {
    source: "iana"
  },
  "text/tab-separated-values": {
    source: "iana",
    compressible: true,
    extensions: ["tsv"]
  },
  "text/troff": {
    source: "iana",
    extensions: ["t", "tr", "roff", "man", "me", "ms"]
  },
  "text/turtle": {
    source: "iana",
    charset: "UTF-8",
    extensions: ["ttl"]
  },
  "text/ulpfec": {
    source: "iana"
  },
  "text/uri-list": {
    source: "iana",
    compressible: true,
    extensions: ["uri", "uris", "urls"]
  },
  "text/vcard": {
    source: "iana",
    compressible: true,
    extensions: ["vcard"]
  },
  "text/vnd.a": {
    source: "iana"
  },
  "text/vnd.abc": {
    source: "iana"
  },
  "text/vnd.ascii-art": {
    source: "iana"
  },
  "text/vnd.curl": {
    source: "iana",
    extensions: ["curl"]
  },
  "text/vnd.curl.dcurl": {
    source: "apache",
    extensions: ["dcurl"]
  },
  "text/vnd.curl.mcurl": {
    source: "apache",
    extensions: ["mcurl"]
  },
  "text/vnd.curl.scurl": {
    source: "apache",
    extensions: ["scurl"]
  },
  "text/vnd.debian.copyright": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/vnd.dmclientscript": {
    source: "iana"
  },
  "text/vnd.dvb.subtitle": {
    source: "iana",
    extensions: ["sub"]
  },
  "text/vnd.esmertec.theme-descriptor": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/vnd.familysearch.gedcom": {
    source: "iana",
    extensions: ["ged"]
  },
  "text/vnd.ficlab.flt": {
    source: "iana"
  },
  "text/vnd.fly": {
    source: "iana",
    extensions: ["fly"]
  },
  "text/vnd.fmi.flexstor": {
    source: "iana",
    extensions: ["flx"]
  },
  "text/vnd.gml": {
    source: "iana"
  },
  "text/vnd.graphviz": {
    source: "iana",
    extensions: ["gv"]
  },
  "text/vnd.hans": {
    source: "iana"
  },
  "text/vnd.hgl": {
    source: "iana"
  },
  "text/vnd.in3d.3dml": {
    source: "iana",
    extensions: ["3dml"]
  },
  "text/vnd.in3d.spot": {
    source: "iana",
    extensions: ["spot"]
  },
  "text/vnd.iptc.newsml": {
    source: "iana"
  },
  "text/vnd.iptc.nitf": {
    source: "iana"
  },
  "text/vnd.latex-z": {
    source: "iana"
  },
  "text/vnd.motorola.reflex": {
    source: "iana"
  },
  "text/vnd.ms-mediapackage": {
    source: "iana"
  },
  "text/vnd.net2phone.commcenter.command": {
    source: "iana"
  },
  "text/vnd.radisys.msml-basic-layout": {
    source: "iana"
  },
  "text/vnd.senx.warpscript": {
    source: "iana"
  },
  "text/vnd.si.uricatalogue": {
    source: "iana"
  },
  "text/vnd.sosi": {
    source: "iana"
  },
  "text/vnd.sun.j2me.app-descriptor": {
    source: "iana",
    charset: "UTF-8",
    extensions: ["jad"]
  },
  "text/vnd.trolltech.linguist": {
    source: "iana",
    charset: "UTF-8"
  },
  "text/vnd.wap.si": {
    source: "iana"
  },
  "text/vnd.wap.sl": {
    source: "iana"
  },
  "text/vnd.wap.wml": {
    source: "iana",
    extensions: ["wml"]
  },
  "text/vnd.wap.wmlscript": {
    source: "iana",
    extensions: ["wmls"]
  },
  "text/vtt": {
    source: "iana",
    charset: "UTF-8",
    compressible: true,
    extensions: ["vtt"]
  },
  "text/x-asm": {
    source: "apache",
    extensions: ["s", "asm"]
  },
  "text/x-c": {
    source: "apache",
    extensions: ["c", "cc", "cxx", "cpp", "h", "hh", "dic"]
  },
  "text/x-component": {
    source: "nginx",
    extensions: ["htc"]
  },
  "text/x-fortran": {
    source: "apache",
    extensions: ["f", "for", "f77", "f90"]
  },
  "text/x-gwt-rpc": {
    compressible: true
  },
  "text/x-handlebars-template": {
    extensions: ["hbs"]
  },
  "text/x-java-source": {
    source: "apache",
    extensions: ["java"]
  },
  "text/x-jquery-tmpl": {
    compressible: true
  },
  "text/x-lua": {
    extensions: ["lua"]
  },
  "text/x-markdown": {
    compressible: true,
    extensions: ["mkd"]
  },
  "text/x-nfo": {
    source: "apache",
    extensions: ["nfo"]
  },
  "text/x-opml": {
    source: "apache",
    extensions: ["opml"]
  },
  "text/x-org": {
    compressible: true,
    extensions: ["org"]
  },
  "text/x-pascal": {
    source: "apache",
    extensions: ["p", "pas"]
  },
  "text/x-processing": {
    compressible: true,
    extensions: ["pde"]
  },
  "text/x-sass": {
    extensions: ["sass"]
  },
  "text/x-scss": {
    extensions: ["scss"]
  },
  "text/x-setext": {
    source: "apache",
    extensions: ["etx"]
  },
  "text/x-sfv": {
    source: "apache",
    extensions: ["sfv"]
  },
  "text/x-suse-ymp": {
    compressible: true,
    extensions: ["ymp"]
  },
  "text/x-uuencode": {
    source: "apache",
    extensions: ["uu"]
  },
  "text/x-vcalendar": {
    source: "apache",
    extensions: ["vcs"]
  },
  "text/x-vcard": {
    source: "apache",
    extensions: ["vcf"]
  },
  "text/xml": {
    source: "iana",
    compressible: true,
    extensions: ["xml"]
  },
  "text/xml-external-parsed-entity": {
    source: "iana"
  },
  "text/yaml": {
    compressible: true,
    extensions: ["yaml", "yml"]
  },
  "video/1d-interleaved-parityfec": {
    source: "iana"
  },
  "video/3gpp": {
    source: "iana",
    extensions: ["3gp", "3gpp"]
  },
  "video/3gpp-tt": {
    source: "iana"
  },
  "video/3gpp2": {
    source: "iana",
    extensions: ["3g2"]
  },
  "video/av1": {
    source: "iana"
  },
  "video/bmpeg": {
    source: "iana"
  },
  "video/bt656": {
    source: "iana"
  },
  "video/celb": {
    source: "iana"
  },
  "video/dv": {
    source: "iana"
  },
  "video/encaprtp": {
    source: "iana"
  },
  "video/ffv1": {
    source: "iana"
  },
  "video/flexfec": {
    source: "iana"
  },
  "video/h261": {
    source: "iana",
    extensions: ["h261"]
  },
  "video/h263": {
    source: "iana",
    extensions: ["h263"]
  },
  "video/h263-1998": {
    source: "iana"
  },
  "video/h263-2000": {
    source: "iana"
  },
  "video/h264": {
    source: "iana",
    extensions: ["h264"]
  },
  "video/h264-rcdo": {
    source: "iana"
  },
  "video/h264-svc": {
    source: "iana"
  },
  "video/h265": {
    source: "iana"
  },
  "video/iso.segment": {
    source: "iana",
    extensions: ["m4s"]
  },
  "video/jpeg": {
    source: "iana",
    extensions: ["jpgv"]
  },
  "video/jpeg2000": {
    source: "iana"
  },
  "video/jpm": {
    source: "apache",
    extensions: ["jpm", "jpgm"]
  },
  "video/jxsv": {
    source: "iana"
  },
  "video/mj2": {
    source: "iana",
    extensions: ["mj2", "mjp2"]
  },
  "video/mp1s": {
    source: "iana"
  },
  "video/mp2p": {
    source: "iana"
  },
  "video/mp2t": {
    source: "iana",
    extensions: ["ts"]
  },
  "video/mp4": {
    source: "iana",
    compressible: false,
    extensions: ["mp4", "mp4v", "mpg4"]
  },
  "video/mp4v-es": {
    source: "iana"
  },
  "video/mpeg": {
    source: "iana",
    compressible: false,
    extensions: ["mpeg", "mpg", "mpe", "m1v", "m2v"]
  },
  "video/mpeg4-generic": {
    source: "iana"
  },
  "video/mpv": {
    source: "iana"
  },
  "video/nv": {
    source: "iana"
  },
  "video/ogg": {
    source: "iana",
    compressible: false,
    extensions: ["ogv"]
  },
  "video/parityfec": {
    source: "iana"
  },
  "video/pointer": {
    source: "iana"
  },
  "video/quicktime": {
    source: "iana",
    compressible: false,
    extensions: ["qt", "mov"]
  },
  "video/raptorfec": {
    source: "iana"
  },
  "video/raw": {
    source: "iana"
  },
  "video/rtp-enc-aescm128": {
    source: "iana"
  },
  "video/rtploopback": {
    source: "iana"
  },
  "video/rtx": {
    source: "iana"
  },
  "video/scip": {
    source: "iana"
  },
  "video/smpte291": {
    source: "iana"
  },
  "video/smpte292m": {
    source: "iana"
  },
  "video/ulpfec": {
    source: "iana"
  },
  "video/vc1": {
    source: "iana"
  },
  "video/vc2": {
    source: "iana"
  },
  "video/vnd.cctv": {
    source: "iana"
  },
  "video/vnd.dece.hd": {
    source: "iana",
    extensions: ["uvh", "uvvh"]
  },
  "video/vnd.dece.mobile": {
    source: "iana",
    extensions: ["uvm", "uvvm"]
  },
  "video/vnd.dece.mp4": {
    source: "iana"
  },
  "video/vnd.dece.pd": {
    source: "iana",
    extensions: ["uvp", "uvvp"]
  },
  "video/vnd.dece.sd": {
    source: "iana",
    extensions: ["uvs", "uvvs"]
  },
  "video/vnd.dece.video": {
    source: "iana",
    extensions: ["uvv", "uvvv"]
  },
  "video/vnd.directv.mpeg": {
    source: "iana"
  },
  "video/vnd.directv.mpeg-tts": {
    source: "iana"
  },
  "video/vnd.dlna.mpeg-tts": {
    source: "iana"
  },
  "video/vnd.dvb.file": {
    source: "iana",
    extensions: ["dvb"]
  },
  "video/vnd.fvt": {
    source: "iana",
    extensions: ["fvt"]
  },
  "video/vnd.hns.video": {
    source: "iana"
  },
  "video/vnd.iptvforum.1dparityfec-1010": {
    source: "iana"
  },
  "video/vnd.iptvforum.1dparityfec-2005": {
    source: "iana"
  },
  "video/vnd.iptvforum.2dparityfec-1010": {
    source: "iana"
  },
  "video/vnd.iptvforum.2dparityfec-2005": {
    source: "iana"
  },
  "video/vnd.iptvforum.ttsavc": {
    source: "iana"
  },
  "video/vnd.iptvforum.ttsmpeg2": {
    source: "iana"
  },
  "video/vnd.motorola.video": {
    source: "iana"
  },
  "video/vnd.motorola.videop": {
    source: "iana"
  },
  "video/vnd.mpegurl": {
    source: "iana",
    extensions: ["mxu", "m4u"]
  },
  "video/vnd.ms-playready.media.pyv": {
    source: "iana",
    extensions: ["pyv"]
  },
  "video/vnd.nokia.interleaved-multimedia": {
    source: "iana"
  },
  "video/vnd.nokia.mp4vr": {
    source: "iana"
  },
  "video/vnd.nokia.videovoip": {
    source: "iana"
  },
  "video/vnd.objectvideo": {
    source: "iana"
  },
  "video/vnd.radgamettools.bink": {
    source: "iana"
  },
  "video/vnd.radgamettools.smacker": {
    source: "iana"
  },
  "video/vnd.sealed.mpeg1": {
    source: "iana"
  },
  "video/vnd.sealed.mpeg4": {
    source: "iana"
  },
  "video/vnd.sealed.swf": {
    source: "iana"
  },
  "video/vnd.sealedmedia.softseal.mov": {
    source: "iana"
  },
  "video/vnd.uvvu.mp4": {
    source: "iana",
    extensions: ["uvu", "uvvu"]
  },
  "video/vnd.vivo": {
    source: "iana",
    extensions: ["viv"]
  },
  "video/vnd.youtube.yt": {
    source: "iana"
  },
  "video/vp8": {
    source: "iana"
  },
  "video/vp9": {
    source: "iana"
  },
  "video/webm": {
    source: "apache",
    compressible: false,
    extensions: ["webm"]
  },
  "video/x-f4v": {
    source: "apache",
    extensions: ["f4v"]
  },
  "video/x-fli": {
    source: "apache",
    extensions: ["fli"]
  },
  "video/x-flv": {
    source: "apache",
    compressible: false,
    extensions: ["flv"]
  },
  "video/x-m4v": {
    source: "apache",
    extensions: ["m4v"]
  },
  "video/x-matroska": {
    source: "apache",
    compressible: false,
    extensions: ["mkv", "mk3d", "mks"]
  },
  "video/x-mng": {
    source: "apache",
    extensions: ["mng"]
  },
  "video/x-ms-asf": {
    source: "apache",
    extensions: ["asf", "asx"]
  },
  "video/x-ms-vob": {
    source: "apache",
    extensions: ["vob"]
  },
  "video/x-ms-wm": {
    source: "apache",
    extensions: ["wm"]
  },
  "video/x-ms-wmv": {
    source: "apache",
    compressible: false,
    extensions: ["wmv"]
  },
  "video/x-ms-wmx": {
    source: "apache",
    extensions: ["wmx"]
  },
  "video/x-ms-wvx": {
    source: "apache",
    extensions: ["wvx"]
  },
  "video/x-msvideo": {
    source: "apache",
    extensions: ["avi"]
  },
  "video/x-sgi-movie": {
    source: "apache",
    extensions: ["movie"]
  },
  "video/x-smv": {
    source: "apache",
    extensions: ["smv"]
  },
  "x-conference/x-cooltalk": {
    source: "apache",
    extensions: ["ice"]
  },
  "x-shader/x-fragment": {
    compressible: true
  },
  "x-shader/x-vertex": {
    compressible: true
  }
};
const system = {
  directoryPaths,
  mimeTypes
};
const creature = [
  "ants",
  "bats",
  "bears",
  "bees",
  "birds",
  "buffalo",
  "cats",
  "chickens",
  "cattle",
  "dogs",
  "dolphins",
  "ducks",
  "elephants",
  "fishes",
  "foxes",
  "frogs",
  "geese",
  "goats",
  "horses",
  "kangaroos",
  "lions",
  "monkeys",
  "owls",
  "oxen",
  "penguins",
  "people",
  "pigs",
  "rabbits",
  "sheep",
  "tigers",
  "whales",
  "wolves",
  "zebras",
  "banshees",
  "crows",
  "black cats",
  "chimeras",
  "ghosts",
  "conspirators",
  "dragons",
  "dwarves",
  "elves",
  "enchanters",
  "exorcists",
  "sons",
  "foes",
  "giants",
  "gnomes",
  "goblins",
  "gooses",
  "griffins",
  "lycanthropes",
  "nemesis",
  "ogres",
  "oracles",
  "prophets",
  "sorcerors",
  "spiders",
  "spirits",
  "vampires",
  "warlocks",
  "vixens",
  "werewolves",
  "witches",
  "worshipers",
  "zombies",
  "druids"
];
const name_ = ["{{address.state}} {{team.creature}}"];
const team = {
  creature,
  name: name_
};
const bicycle_type = [
  "Adventure Road Bicycle",
  "BMX Bicycle",
  "City Bicycle",
  "Cruiser Bicycle",
  "Cyclocross Bicycle",
  "Dual-Sport Bicycle",
  "Fitness Bicycle",
  "Flat-Foot Comfort Bicycle",
  "Folding Bicycle",
  "Hybrid Bicycle",
  "Mountain Bicycle",
  "Recumbent Bicycle",
  "Road Bicycle",
  "Tandem Bicycle",
  "Touring Bicycle",
  "Track/Fixed-Gear Bicycle",
  "Triathlon/Time Trial Bicycle",
  "Tricycle"
];
const fuel = ["Diesel", "Electric", "Gasoline", "Hybrid"];
const manufacturer = [
  "Aston Martin",
  "Audi",
  "Bentley",
  "BMW",
  "Bugatti",
  "Cadillac",
  "Chevrolet",
  "Chrysler",
  "Dodge",
  "Ferrari",
  "Fiat",
  "Ford",
  "Honda",
  "Hyundai",
  "Jaguar",
  "Jeep",
  "Kia",
  "Lamborghini",
  "Land Rover",
  "Maserati",
  "Mazda",
  "Mercedes Benz",
  "Mini",
  "Nissan",
  "Polestar",
  "Porsche",
  "Rolls Royce",
  "Smart",
  "Tesla",
  "Toyota",
  "Volkswagen",
  "Volvo"
];
const model = [
  "Fiesta",
  "Focus",
  "Taurus",
  "Mustang",
  "Explorer",
  "Expedition",
  "F-150",
  "Model T",
  "Ranchero",
  "Volt",
  "Cruze",
  "Malibu",
  "Impala",
  "Camaro",
  "Corvette",
  "Colorado",
  "Silverado",
  "El Camino",
  "CTS",
  "XTS",
  "ATS",
  "Escalade",
  "Alpine",
  "Charger",
  "LeBaron",
  "PT Cruiser",
  "Challenger",
  "Durango",
  "Grand Caravan",
  "Wrangler",
  "Grand Cherokee",
  "Roadster",
  "Model S",
  "Model 3",
  "Camry",
  "Prius",
  "Land Cruiser",
  "Accord",
  "Civic",
  "Element",
  "Sentra",
  "Altima",
  "A8",
  "A4",
  "Beetle",
  "Jetta",
  "Golf",
  "911",
  "Spyder",
  "Countach",
  "Mercielago",
  "Aventador",
  "1",
  "2",
  "Fortwo",
  "V90",
  "XC90",
  "CX-9"
];
const type_ = [
  "Cargo Van",
  "Convertible",
  "Coupe",
  "Crew Cab Pickup",
  "Extended Cab Pickup",
  "Hatchback",
  "Minivan",
  "Passenger Van",
  "SUV",
  "Sedan",
  "Wagon"
];
const vehicle = {
  bicycle_type,
  fuel,
  manufacturer,
  model,
  type: type_
};
const adjective = [
  "abandoned",
  "able",
  "absolute",
  "adorable",
  "adventurous",
  "academic",
  "acceptable",
  "acclaimed",
  "accomplished",
  "accurate",
  "aching",
  "acidic",
  "acrobatic",
  "active",
  "actual",
  "adept",
  "admirable",
  "admired",
  "adolescent",
  "adorable",
  "adored",
  "advanced",
  "afraid",
  "affectionate",
  "aged",
  "aggravating",
  "aggressive",
  "agile",
  "agitated",
  "agonizing",
  "agreeable",
  "ajar",
  "alarmed",
  "alarming",
  "alert",
  "alienated",
  "alive",
  "all",
  "altruistic",
  "amazing",
  "ambitious",
  "ample",
  "amused",
  "amusing",
  "anchored",
  "ancient",
  "angelic",
  "angry",
  "anguished",
  "animated",
  "annual",
  "another",
  "antique",
  "anxious",
  "any",
  "apprehensive",
  "appropriate",
  "apt",
  "arctic",
  "arid",
  "aromatic",
  "artistic",
  "ashamed",
  "assured",
  "astonishing",
  "athletic",
  "attached",
  "attentive",
  "attractive",
  "austere",
  "authentic",
  "authorized",
  "automatic",
  "avaricious",
  "average",
  "aware",
  "awesome",
  "awful",
  "awkward",
  "babyish",
  "bad",
  "back",
  "baggy",
  "bare",
  "barren",
  "basic",
  "beautiful",
  "belated",
  "beloved",
  "beneficial",
  "better",
  "best",
  "bewitched",
  "big",
  "big-hearted",
  "biodegradable",
  "bite-sized",
  "bitter",
  "black",
  "black-and-white",
  "bland",
  "blank",
  "blaring",
  "bleak",
  "blind",
  "blissful",
  "blond",
  "blue",
  "blushing",
  "bogus",
  "boiling",
  "bold",
  "bony",
  "boring",
  "bossy",
  "both",
  "bouncy",
  "bountiful",
  "bowed",
  "brave",
  "breakable",
  "brief",
  "bright",
  "brilliant",
  "brisk",
  "broken",
  "bronze",
  "brown",
  "bruised",
  "bubbly",
  "bulky",
  "bumpy",
  "buoyant",
  "burdensome",
  "burly",
  "bustling",
  "busy",
  "buttery",
  "buzzing",
  "calculating",
  "calm",
  "candid",
  "canine",
  "capital",
  "carefree",
  "careful",
  "careless",
  "caring",
  "cautious",
  "cavernous",
  "celebrated",
  "charming",
  "cheap",
  "cheerful",
  "cheery",
  "chief",
  "chilly",
  "chubby",
  "circular",
  "classic",
  "clean",
  "clear",
  "clear-cut",
  "clever",
  "close",
  "closed",
  "cloudy",
  "clueless",
  "clumsy",
  "cluttered",
  "coarse",
  "cold",
  "colorful",
  "colorless",
  "colossal",
  "comfortable",
  "common",
  "compassionate",
  "competent",
  "complete",
  "complex",
  "complicated",
  "composed",
  "concerned",
  "concrete",
  "confused",
  "conscious",
  "considerate",
  "constant",
  "content",
  "conventional",
  "cooked",
  "cool",
  "cooperative",
  "coordinated",
  "corny",
  "corrupt",
  "costly",
  "courageous",
  "courteous",
  "crafty",
  "crazy",
  "creamy",
  "creative",
  "creepy",
  "criminal",
  "crisp",
  "critical",
  "crooked",
  "crowded",
  "cruel",
  "crushing",
  "cuddly",
  "cultivated",
  "cultured",
  "cumbersome",
  "curly",
  "curvy",
  "cute",
  "cylindrical",
  "damaged",
  "damp",
  "dangerous",
  "dapper",
  "daring",
  "darling",
  "dark",
  "dazzling",
  "dead",
  "deadly",
  "deafening",
  "dear",
  "dearest",
  "decent",
  "decimal",
  "decisive",
  "deep",
  "defenseless",
  "defensive",
  "defiant",
  "deficient",
  "definite",
  "definitive",
  "delayed",
  "delectable",
  "delicious",
  "delightful",
  "delirious",
  "demanding",
  "dense",
  "dental",
  "dependable",
  "dependent",
  "descriptive",
  "deserted",
  "detailed",
  "determined",
  "devoted",
  "different",
  "difficult",
  "digital",
  "diligent",
  "dim",
  "dimpled",
  "dimwitted",
  "direct",
  "disastrous",
  "discrete",
  "disfigured",
  "disgusting",
  "disloyal",
  "dismal",
  "distant",
  "downright",
  "dreary",
  "dirty",
  "disguised",
  "dishonest",
  "dismal",
  "distant",
  "distinct",
  "distorted",
  "dizzy",
  "dopey",
  "doting",
  "double",
  "downright",
  "drab",
  "drafty",
  "dramatic",
  "dreary",
  "droopy",
  "dry",
  "dual",
  "dull",
  "dutiful",
  "each",
  "eager",
  "earnest",
  "early",
  "easy",
  "easy-going",
  "ecstatic",
  "edible",
  "educated",
  "elaborate",
  "elastic",
  "elated",
  "elderly",
  "electric",
  "elegant",
  "elementary",
  "elliptical",
  "embarrassed",
  "embellished",
  "eminent",
  "emotional",
  "empty",
  "enchanted",
  "enchanting",
  "energetic",
  "enlightened",
  "enormous",
  "enraged",
  "entire",
  "envious",
  "equal",
  "equatorial",
  "essential",
  "esteemed",
  "ethical",
  "euphoric",
  "even",
  "evergreen",
  "everlasting",
  "every",
  "evil",
  "exalted",
  "excellent",
  "exemplary",
  "exhausted",
  "excitable",
  "excited",
  "exciting",
  "exotic",
  "expensive",
  "experienced",
  "expert",
  "extraneous",
  "extroverted",
  "extra-large",
  "extra-small",
  "fabulous",
  "failing",
  "faint",
  "fair",
  "faithful",
  "fake",
  "false",
  "familiar",
  "famous",
  "fancy",
  "fantastic",
  "far",
  "faraway",
  "far-flung",
  "far-off",
  "fast",
  "fat",
  "fatal",
  "fatherly",
  "favorable",
  "favorite",
  "fearful",
  "fearless",
  "feisty",
  "feline",
  "female",
  "feminine",
  "few",
  "fickle",
  "filthy",
  "fine",
  "finished",
  "firm",
  "first",
  "firsthand",
  "fitting",
  "fixed",
  "flaky",
  "flamboyant",
  "flashy",
  "flat",
  "flawed",
  "flawless",
  "flickering",
  "flimsy",
  "flippant",
  "flowery",
  "fluffy",
  "fluid",
  "flustered",
  "focused",
  "fond",
  "foolhardy",
  "foolish",
  "forceful",
  "forked",
  "formal",
  "forsaken",
  "forthright",
  "fortunate",
  "fragrant",
  "frail",
  "frank",
  "frayed",
  "free",
  "french",
  "fresh",
  "frequent",
  "friendly",
  "frightened",
  "frightening",
  "frigid",
  "frilly",
  "frizzy",
  "frivolous",
  "front",
  "frosty",
  "frozen",
  "frugal",
  "fruitful",
  "full",
  "fumbling",
  "functional",
  "funny",
  "fussy",
  "fuzzy",
  "gargantuan",
  "gaseous",
  "general",
  "generous",
  "gentle",
  "genuine",
  "giant",
  "giddy",
  "gigantic",
  "gifted",
  "giving",
  "glamorous",
  "glaring",
  "glass",
  "gleaming",
  "gleeful",
  "glistening",
  "glittering",
  "gloomy",
  "glorious",
  "glossy",
  "glum",
  "golden",
  "good",
  "good-natured",
  "gorgeous",
  "graceful",
  "gracious",
  "grand",
  "grandiose",
  "granular",
  "grateful",
  "grave",
  "gray",
  "great",
  "greedy",
  "green",
  "gregarious",
  "grim",
  "grimy",
  "gripping",
  "grizzled",
  "gross",
  "grotesque",
  "grouchy",
  "grounded",
  "growing",
  "growling",
  "grown",
  "grubby",
  "gruesome",
  "grumpy",
  "guilty",
  "gullible",
  "gummy",
  "hairy",
  "half",
  "handmade",
  "handsome",
  "handy",
  "happy",
  "happy-go-lucky",
  "hard",
  "hard-to-find",
  "harmful",
  "harmless",
  "harmonious",
  "harsh",
  "hasty",
  "hateful",
  "haunting",
  "healthy",
  "heartfelt",
  "hearty",
  "heavenly",
  "heavy",
  "hefty",
  "helpful",
  "helpless",
  "hidden",
  "hideous",
  "high",
  "high-level",
  "hilarious",
  "hoarse",
  "hollow",
  "homely",
  "honest",
  "honorable",
  "honored",
  "hopeful",
  "horrible",
  "hospitable",
  "hot",
  "huge",
  "humble",
  "humiliating",
  "humming",
  "humongous",
  "hungry",
  "hurtful",
  "husky",
  "icky",
  "icy",
  "ideal",
  "idealistic",
  "identical",
  "idle",
  "idiotic",
  "idolized",
  "ignorant",
  "ill",
  "illegal",
  "ill-fated",
  "ill-informed",
  "illiterate",
  "illustrious",
  "imaginary",
  "imaginative",
  "immaculate",
  "immaterial",
  "immediate",
  "immense",
  "impassioned",
  "impeccable",
  "impartial",
  "imperfect",
  "imperturbable",
  "impish",
  "impolite",
  "important",
  "impossible",
  "impractical",
  "impressionable",
  "impressive",
  "improbable",
  "impure",
  "inborn",
  "incomparable",
  "incompatible",
  "incomplete",
  "inconsequential",
  "incredible",
  "indelible",
  "inexperienced",
  "indolent",
  "infamous",
  "infantile",
  "infatuated",
  "inferior",
  "infinite",
  "informal",
  "innocent",
  "insecure",
  "insidious",
  "insignificant",
  "insistent",
  "instructive",
  "insubstantial",
  "intelligent",
  "intent",
  "intentional",
  "interesting",
  "internal",
  "international",
  "intrepid",
  "ironclad",
  "irresponsible",
  "irritating",
  "itchy",
  "jaded",
  "jagged",
  "jam-packed",
  "jaunty",
  "jealous",
  "jittery",
  "joint",
  "jolly",
  "jovial",
  "joyful",
  "joyous",
  "jubilant",
  "judicious",
  "juicy",
  "jumbo",
  "junior",
  "jumpy",
  "juvenile",
  "kaleidoscopic",
  "keen",
  "key",
  "kind",
  "kindhearted",
  "kindly",
  "klutzy",
  "knobby",
  "knotty",
  "knowledgeable",
  "knowing",
  "known",
  "kooky",
  "kosher",
  "lame",
  "lanky",
  "large",
  "last",
  "lasting",
  "late",
  "lavish",
  "lawful",
  "lazy",
  "leading",
  "lean",
  "leafy",
  "left",
  "legal",
  "legitimate",
  "light",
  "lighthearted",
  "likable",
  "likely",
  "limited",
  "limp",
  "limping",
  "linear",
  "lined",
  "liquid",
  "little",
  "live",
  "lively",
  "livid",
  "loathsome",
  "lone",
  "lonely",
  "long",
  "long-term",
  "loose",
  "lopsided",
  "lost",
  "loud",
  "lovable",
  "lovely",
  "loving",
  "low",
  "loyal",
  "lucky",
  "lumbering",
  "luminous",
  "lumpy",
  "lustrous",
  "luxurious",
  "mad",
  "made-up",
  "magnificent",
  "majestic",
  "major",
  "male",
  "mammoth",
  "married",
  "marvelous",
  "masculine",
  "massive",
  "mature",
  "meager",
  "mealy",
  "mean",
  "measly",
  "meaty",
  "medical",
  "mediocre",
  "medium",
  "meek",
  "mellow",
  "melodic",
  "memorable",
  "menacing",
  "merry",
  "messy",
  "metallic",
  "mild",
  "milky",
  "mindless",
  "miniature",
  "minor",
  "minty",
  "miserable",
  "miserly",
  "misguided",
  "misty",
  "mixed",
  "modern",
  "modest",
  "moist",
  "monstrous",
  "monthly",
  "monumental",
  "moral",
  "mortified",
  "motherly",
  "motionless",
  "mountainous",
  "muddy",
  "muffled",
  "multicolored",
  "mundane",
  "murky",
  "mushy",
  "musty",
  "muted",
  "mysterious",
  "naive",
  "narrow",
  "nasty",
  "natural",
  "naughty",
  "nautical",
  "near",
  "neat",
  "necessary",
  "needy",
  "negative",
  "neglected",
  "negligible",
  "neighboring",
  "nervous",
  "new",
  "next",
  "nice",
  "nifty",
  "nimble",
  "nippy",
  "nocturnal",
  "noisy",
  "nonstop",
  "normal",
  "notable",
  "noted",
  "noteworthy",
  "novel",
  "noxious",
  "numb",
  "nutritious",
  "nutty",
  "obedient",
  "obese",
  "oblong",
  "oily",
  "oblong",
  "obvious",
  "occasional",
  "odd",
  "oddball",
  "offbeat",
  "offensive",
  "official",
  "old",
  "old-fashioned",
  "only",
  "open",
  "optimal",
  "optimistic",
  "opulent",
  "orange",
  "orderly",
  "organic",
  "ornate",
  "ornery",
  "ordinary",
  "original",
  "other",
  "our",
  "outlying",
  "outgoing",
  "outlandish",
  "outrageous",
  "outstanding",
  "oval",
  "overcooked",
  "overdue",
  "overjoyed",
  "overlooked",
  "palatable",
  "pale",
  "paltry",
  "parallel",
  "parched",
  "partial",
  "passionate",
  "past",
  "pastel",
  "peaceful",
  "peppery",
  "perfect",
  "perfumed",
  "periodic",
  "perky",
  "personal",
  "pertinent",
  "pesky",
  "pessimistic",
  "petty",
  "phony",
  "physical",
  "piercing",
  "pink",
  "pitiful",
  "plain",
  "plaintive",
  "plastic",
  "playful",
  "pleasant",
  "pleased",
  "pleasing",
  "plump",
  "plush",
  "polished",
  "polite",
  "political",
  "pointed",
  "pointless",
  "poised",
  "poor",
  "popular",
  "portly",
  "posh",
  "positive",
  "possible",
  "potable",
  "powerful",
  "powerless",
  "practical",
  "precious",
  "present",
  "prestigious",
  "pretty",
  "precious",
  "previous",
  "pricey",
  "prickly",
  "primary",
  "prime",
  "pristine",
  "private",
  "prize",
  "probable",
  "productive",
  "profitable",
  "profuse",
  "proper",
  "proud",
  "prudent",
  "punctual",
  "pungent",
  "puny",
  "pure",
  "purple",
  "pushy",
  "putrid",
  "puzzled",
  "puzzling",
  "quaint",
  "qualified",
  "quarrelsome",
  "quarterly",
  "queasy",
  "querulous",
  "questionable",
  "quick",
  "quick-witted",
  "quiet",
  "quintessential",
  "quirky",
  "quixotic",
  "quizzical",
  "radiant",
  "ragged",
  "rapid",
  "rare",
  "rash",
  "raw",
  "recent",
  "reckless",
  "rectangular",
  "ready",
  "real",
  "realistic",
  "reasonable",
  "red",
  "reflecting",
  "regal",
  "regular",
  "reliable",
  "relieved",
  "remarkable",
  "remorseful",
  "remote",
  "repentant",
  "required",
  "respectful",
  "responsible",
  "repulsive",
  "revolving",
  "rewarding",
  "rich",
  "rigid",
  "right",
  "ringed",
  "ripe",
  "roasted",
  "robust",
  "rosy",
  "rotating",
  "rotten",
  "rough",
  "round",
  "rowdy",
  "royal",
  "rubbery",
  "rundown",
  "ruddy",
  "rude",
  "runny",
  "rural",
  "rusty",
  "sad",
  "safe",
  "salty",
  "same",
  "sandy",
  "sane",
  "sarcastic",
  "sardonic",
  "satisfied",
  "scaly",
  "scarce",
  "scared",
  "scary",
  "scented",
  "scholarly",
  "scientific",
  "scornful",
  "scratchy",
  "scrawny",
  "second",
  "secondary",
  "second-hand",
  "secret",
  "self-assured",
  "self-reliant",
  "selfish",
  "sentimental",
  "separate",
  "serene",
  "serious",
  "serpentine",
  "several",
  "severe",
  "shabby",
  "shadowy",
  "shady",
  "shallow",
  "shameful",
  "shameless",
  "sharp",
  "shimmering",
  "shiny",
  "shocked",
  "shocking",
  "shoddy",
  "short",
  "short-term",
  "showy",
  "shrill",
  "shy",
  "sick",
  "silent",
  "silky",
  "silly",
  "silver",
  "similar",
  "simple",
  "simplistic",
  "sinful",
  "single",
  "sizzling",
  "skeletal",
  "skinny",
  "sleepy",
  "slight",
  "slim",
  "slimy",
  "slippery",
  "slow",
  "slushy",
  "small",
  "smart",
  "smoggy",
  "smooth",
  "smug",
  "snappy",
  "snarling",
  "sneaky",
  "sniveling",
  "snoopy",
  "sociable",
  "soft",
  "soggy",
  "solid",
  "somber",
  "some",
  "spherical",
  "sophisticated",
  "sore",
  "sorrowful",
  "soulful",
  "soupy",
  "sour",
  "spanish",
  "sparkling",
  "sparse",
  "specific",
  "spectacular",
  "speedy",
  "spicy",
  "spiffy",
  "spirited",
  "spiteful",
  "splendid",
  "spotless",
  "spotted",
  "spry",
  "square",
  "squeaky",
  "squiggly",
  "stable",
  "staid",
  "stained",
  "stale",
  "standard",
  "starchy",
  "stark",
  "starry",
  "steep",
  "sticky",
  "stiff",
  "stimulating",
  "stingy",
  "stormy",
  "straight",
  "strange",
  "steel",
  "strict",
  "strident",
  "striking",
  "striped",
  "strong",
  "studious",
  "stunning",
  "stupendous",
  "stupid",
  "sturdy",
  "stylish",
  "subdued",
  "submissive",
  "substantial",
  "subtle",
  "suburban",
  "sudden",
  "sugary",
  "sunny",
  "super",
  "superb",
  "superficial",
  "superior",
  "supportive",
  "sure-footed",
  "surprised",
  "suspicious",
  "svelte",
  "sweaty",
  "sweet",
  "sweltering",
  "swift",
  "sympathetic",
  "tall",
  "talkative",
  "tame",
  "tan",
  "tangible",
  "tart",
  "tasty",
  "tattered",
  "taut",
  "tedious",
  "teeming",
  "tempting",
  "tender",
  "tense",
  "tepid",
  "terrible",
  "terrific",
  "testy",
  "thankful",
  "that",
  "these",
  "thick",
  "thin",
  "third",
  "thirsty",
  "this",
  "thorough",
  "thorny",
  "those",
  "thoughtful",
  "threadbare",
  "thrifty",
  "thunderous",
  "tidy",
  "tight",
  "timely",
  "tinted",
  "tiny",
  "tired",
  "torn",
  "total",
  "tough",
  "traumatic",
  "treasured",
  "tremendous",
  "tragic",
  "trained",
  "tremendous",
  "triangular",
  "tricky",
  "trifling",
  "trim",
  "trivial",
  "troubled",
  "true",
  "trusting",
  "trustworthy",
  "trusty",
  "truthful",
  "tubby",
  "turbulent",
  "twin",
  "ugly",
  "ultimate",
  "unacceptable",
  "unaware",
  "uncomfortable",
  "uncommon",
  "unconscious",
  "understated",
  "unequaled",
  "uneven",
  "unfinished",
  "unfit",
  "unfolded",
  "unfortunate",
  "unhappy",
  "unhealthy",
  "uniform",
  "unimportant",
  "unique",
  "united",
  "unkempt",
  "unknown",
  "unlawful",
  "unlined",
  "unlucky",
  "unnatural",
  "unpleasant",
  "unrealistic",
  "unripe",
  "unruly",
  "unselfish",
  "unsightly",
  "unsteady",
  "unsung",
  "untidy",
  "untimely",
  "untried",
  "untrue",
  "unused",
  "unusual",
  "unwelcome",
  "unwieldy",
  "unwilling",
  "unwitting",
  "unwritten",
  "upbeat",
  "upright",
  "upset",
  "urban",
  "usable",
  "used",
  "useful",
  "useless",
  "utilized",
  "utter",
  "vacant",
  "vague",
  "vain",
  "valid",
  "valuable",
  "vapid",
  "variable",
  "vast",
  "velvety",
  "venerated",
  "vengeful",
  "verifiable",
  "vibrant",
  "vicious",
  "victorious",
  "vigilant",
  "vigorous",
  "villainous",
  "violet",
  "violent",
  "virtual",
  "virtuous",
  "visible",
  "vital",
  "vivacious",
  "vivid",
  "voluminous",
  "wan",
  "warlike",
  "warm",
  "warmhearted",
  "warped",
  "wary",
  "wasteful",
  "watchful",
  "waterlogged",
  "watery",
  "wavy",
  "wealthy",
  "weak",
  "weary",
  "webbed",
  "wee",
  "weekly",
  "weepy",
  "weighty",
  "weird",
  "welcome",
  "well-documented",
  "well-groomed",
  "well-informed",
  "well-lit",
  "well-made",
  "well-off",
  "well-to-do",
  "well-worn",
  "wet",
  "which",
  "whimsical",
  "whirlwind",
  "whispered",
  "white",
  "whole",
  "whopping",
  "wicked",
  "wide",
  "wide-eyed",
  "wiggly",
  "wild",
  "willing",
  "wilted",
  "winding",
  "windy",
  "winged",
  "wiry",
  "wise",
  "witty",
  "wobbly",
  "woeful",
  "wonderful",
  "wooden",
  "woozy",
  "wordy",
  "worldly",
  "worn",
  "worried",
  "worrisome",
  "worse",
  "worst",
  "worthless",
  "worthwhile",
  "worthy",
  "wrathful",
  "wretched",
  "writhing",
  "wrong",
  "wry",
  "yawning",
  "yearly",
  "yellow",
  "yellowish",
  "young",
  "youthful",
  "yummy",
  "zany",
  "zealous",
  "zesty",
  "zigzag"
];
const adverb = [
  "abnormally",
  "absentmindedly",
  "accidentally",
  "acidly",
  "actually",
  "adventurously",
  "afterwards",
  "almost",
  "always",
  "angrily",
  "annually",
  "anxiously",
  "arrogantly",
  "awkwardly",
  "badly",
  "bashfully",
  "beautifully",
  "bitterly",
  "bleakly",
  "blindly",
  "blissfully",
  "boastfully",
  "boldly",
  "bravely",
  "briefly",
  "brightly",
  "briskly",
  "broadly",
  "busily",
  "calmly",
  "carefully",
  "carelessly",
  "cautiously",
  "certainly",
  "cheerfully",
  "clearly",
  "cleverly",
  "closely",
  "coaxingly",
  "colorfully",
  "commonly",
  "continually",
  "coolly",
  "correctly",
  "courageously",
  "crossly",
  "cruelly",
  "curiously",
  "daily",
  "daintily",
  "dearly",
  "deceivingly",
  "deeply",
  "defiantly",
  "deliberately",
  "delightfully",
  "diligently",
  "dimly",
  "doubtfully",
  "dreamily",
  "easily",
  "elegantly",
  "energetically",
  "enormously",
  "enthusiastically",
  "equally",
  "especially",
  "even",
  "evenly",
  "eventually",
  "exactly",
  "excitedly",
  "extremely",
  "fairly",
  "faithfully",
  "famously",
  "far",
  "fast",
  "fatally",
  "ferociously",
  "fervently",
  "fiercely",
  "fondly",
  "foolishly",
  "fortunately",
  "frankly",
  "frantically",
  "freely",
  "frenetically",
  "frightfully",
  "fully",
  "furiously",
  "generally",
  "generously",
  "gently",
  "gladly",
  "gleefully",
  "gracefully",
  "gratefully",
  "greatly",
  "greedily",
  "happily",
  "hastily",
  "healthily",
  "heavily",
  "helpfully",
  "helplessly",
  "highly",
  "honestly",
  "hopelessly",
  "hourly",
  "hungrily",
  "immediately",
  "innocently",
  "inquisitively",
  "instantly",
  "intensely",
  "intently",
  "interestingly",
  "inwardly",
  "irritably",
  "jaggedly",
  "jealously",
  "joshingly",
  "jovially",
  "joyfully",
  "joyously",
  "jubilantly",
  "judgementally",
  "justly",
  "keenly",
  "kiddingly",
  "kindheartedly",
  "kindly",
  "kissingly",
  "knavishly",
  "knottily",
  "knowingly",
  "knowledgeably",
  "kookily",
  "lazily",
  "less",
  "lightly",
  "likely",
  "limply",
  "lively",
  "loftily",
  "longingly",
  "loosely",
  "loudly",
  "lovingly",
  "loyally",
  "madly",
  "majestically",
  "meaningfully",
  "mechanically",
  "merrily",
  "miserably",
  "mockingly",
  "monthly",
  "more",
  "mortally",
  "mostly",
  "mysteriously",
  "naturally",
  "nearly",
  "neatly",
  "needily",
  "nervously",
  "never",
  "nicely",
  "noisily",
  "not",
  "obediently",
  "obnoxiously",
  "oddly",
  "offensively",
  "officially",
  "often",
  "only",
  "openly",
  "optimistically",
  "overconfidently",
  "owlishly",
  "painfully",
  "partially",
  "patiently",
  "perfectly",
  "physically",
  "playfully",
  "politely",
  "poorly",
  "positively",
  "potentially",
  "powerfully",
  "promptly",
  "properly",
  "punctually",
  "quaintly",
  "quarrelsomely",
  "queasily",
  "queerly",
  "questionably",
  "questioningly",
  "quicker",
  "quickly",
  "quietly",
  "quirkily",
  "quizzically",
  "rapidly",
  "rarely",
  "readily",
  "really",
  "reassuringly",
  "recklessly",
  "regularly",
  "reluctantly",
  "repeatedly",
  "reproachfully",
  "restfully",
  "righteously",
  "rightfully",
  "rigidly",
  "roughly",
  "rudely",
  "sadly",
  "safely",
  "scarcely",
  "scarily",
  "searchingly",
  "sedately",
  "seemingly",
  "seldom",
  "selfishly",
  "separately",
  "seriously",
  "shakily",
  "sharply",
  "sheepishly",
  "shrilly",
  "shyly",
  "silently",
  "sleepily",
  "slowly",
  "smoothly",
  "softly",
  "solemnly",
  "solidly",
  "sometimes",
  "soon",
  "speedily",
  "stealthily",
  "sternly",
  "strictly",
  "successfully",
  "suddenly",
  "surprisingly",
  "suspiciously",
  "sweetly",
  "swiftly",
  "sympathetically",
  "tenderly",
  "tensely",
  "terribly",
  "thankfully",
  "thoroughly",
  "thoughtfully",
  "tightly",
  "tomorrow",
  "too",
  "tremendously",
  "triumphantly",
  "truly",
  "truthfully",
  "ultimately",
  "unabashedly",
  "unaccountably",
  "unbearably",
  "unethically",
  "unexpectedly",
  "unfortunately",
  "unimpressively",
  "unnaturally",
  "unnecessarily",
  "upbeat",
  "upliftingly",
  "upright",
  "upside-down",
  "upward",
  "upwardly",
  "urgently",
  "usefully",
  "uselessly",
  "usually",
  "utterly",
  "vacantly",
  "vaguely",
  "vainly",
  "valiantly",
  "vastly",
  "verbally",
  "very",
  "viciously",
  "victoriously",
  "violently",
  "vivaciously",
  "voluntarily",
  "warmly",
  "weakly",
  "wearily",
  "well",
  "wetly",
  "wholly",
  "wildly",
  "willfully",
  "wisely",
  "woefully",
  "wonderfully",
  "worriedly",
  "wrongly",
  "yawningly",
  "yearly",
  "yearningly",
  "yesterday",
  "yieldingly",
  "youthfully"
];
const conjunction = [
  "after",
  "after all",
  "although",
  "and",
  "as",
  "as a result",
  "as if",
  "as long as",
  "as much as",
  "as soon as",
  "as though",
  "because",
  "before",
  "but",
  "consequently",
  "even",
  "even if",
  "even though",
  "finally",
  "for",
  "for example",
  "furthermore",
  "hence",
  "however",
  "if",
  "if only",
  "if then",
  "if when",
  "in addition",
  "in fact",
  "in order that",
  "inasmuch",
  "incidentally",
  "indeed",
  "instead",
  "just as",
  "lest",
  "likewise",
  "meanwhile",
  "nor",
  "now",
  "now since",
  "now that",
  "now when",
  "once",
  "or",
  "provided",
  "provided that",
  "rather than",
  "since",
  "so",
  "so that",
  "supposing",
  "that",
  "though",
  "until",
  "whenever",
  "whereas",
  "wherever",
  "which",
  "who",
  "yet"
];
const interjection = [
  "yuck",
  "oh",
  "phooey",
  "blah",
  "boo",
  "whoa",
  "yowza",
  "huzzah",
  "boo hoo",
  "fooey",
  "geez",
  "pfft",
  "ew",
  "ah",
  "yum",
  "brr",
  "hm",
  "yahoo",
  "aha",
  "woot",
  "drat",
  "gah",
  "meh",
  "psst",
  "aw",
  "ugh",
  "yippee",
  "eek",
  "gee",
  "bah",
  "gadzooks",
  "duh",
  "ha",
  "mmm",
  "tsk tsk",
  "ouch",
  "phew",
  "ack",
  "uh-huh",
  "gosh",
  "hmph",
  "pish",
  "zowie",
  "er",
  "ick",
  "oof",
  "um"
];
const noun = [
  "ATM",
  "CD",
  "SUV",
  "TV",
  "aardvark",
  "abacus",
  "abbey",
  "abbreviation",
  "abdomen",
  "ability",
  "abnormality",
  "abolishment",
  "abortion",
  "abrogation",
  "absence",
  "abundance",
  "abuse",
  "academics",
  "academy",
  "accelerant",
  "accelerator",
  "accent",
  "acceptance",
  "access",
  "accessory",
  "accident",
  "accommodation",
  "accompanist",
  "accomplishment",
  "accord",
  "accordance",
  "accordion",
  "account",
  "accountability",
  "accountant",
  "accounting",
  "accuracy",
  "accusation",
  "acetate",
  "achievement",
  "achiever",
  "acid",
  "acknowledgment",
  "acorn",
  "acoustics",
  "acquaintance",
  "acquisition",
  "acre",
  "acrylic",
  "act",
  "action",
  "activation",
  "activist",
  "activity",
  "actor",
  "actress",
  "acupuncture",
  "ad",
  "adaptation",
  "adapter",
  "addiction",
  "addition",
  "address",
  "adjective",
  "adjustment",
  "admin",
  "administration",
  "administrator",
  "admire",
  "admission",
  "adobe",
  "adoption",
  "adrenalin",
  "adrenaline",
  "adult",
  "adulthood",
  "advance",
  "advancement",
  "advantage",
  "advent",
  "adverb",
  "advertisement",
  "advertising",
  "advice",
  "adviser",
  "advocacy",
  "advocate",
  "affair",
  "affect",
  "affidavit",
  "affiliate",
  "affinity",
  "afoul",
  "afterlife",
  "aftermath",
  "afternoon",
  "aftershave",
  "aftershock",
  "afterthought",
  "age",
  "agency",
  "agenda",
  "agent",
  "aggradation",
  "aggression",
  "aglet",
  "agony",
  "agreement",
  "agriculture",
  "aid",
  "aide",
  "aim",
  "air",
  "airbag",
  "airbus",
  "aircraft",
  "airfare",
  "airfield",
  "airforce",
  "airline",
  "airmail",
  "airman",
  "airplane",
  "airport",
  "airship",
  "airspace",
  "alarm",
  "alb",
  "albatross",
  "album",
  "alcohol",
  "alcove",
  "alder",
  "ale",
  "alert",
  "alfalfa",
  "algebra",
  "algorithm",
  "alias",
  "alibi",
  "alien",
  "allegation",
  "allergist",
  "alley",
  "alliance",
  "alligator",
  "allocation",
  "allowance",
  "alloy",
  "alluvium",
  "almanac",
  "almighty",
  "almond",
  "alpaca",
  "alpenglow",
  "alpenhorn",
  "alpha",
  "alphabet",
  "altar",
  "alteration",
  "alternative",
  "altitude",
  "alto",
  "aluminium",
  "aluminum",
  "amazement",
  "amazon",
  "ambassador",
  "amber",
  "ambience",
  "ambiguity",
  "ambition",
  "ambulance",
  "amendment",
  "amenity",
  "ammunition",
  "amnesty",
  "amount",
  "amusement",
  "anagram",
  "analgesia",
  "analog",
  "analogue",
  "analogy",
  "analysis",
  "analyst",
  "analytics",
  "anarchist",
  "anarchy",
  "anatomy",
  "ancestor",
  "anchovy",
  "android",
  "anesthesiologist",
  "anesthesiology",
  "angel",
  "anger",
  "angina",
  "angiosperm",
  "angle",
  "angora",
  "angstrom",
  "anguish",
  "animal",
  "anime",
  "anise",
  "ankle",
  "anklet",
  "anniversary",
  "announcement",
  "annual",
  "anorak",
  "answer",
  "ant",
  "anteater",
  "antecedent",
  "antechamber",
  "antelope",
  "antennae",
  "anterior",
  "anthropology",
  "antibody",
  "anticipation",
  "anticodon",
  "antigen",
  "antique",
  "antiquity",
  "antler",
  "antling",
  "anxiety",
  "anybody",
  "anyone",
  "anything",
  "anywhere",
  "apartment",
  "ape",
  "aperitif",
  "apology",
  "app",
  "apparatus",
  "apparel",
  "appeal",
  "appearance",
  "appellation",
  "appendix",
  "appetiser",
  "appetite",
  "appetizer",
  "applause",
  "apple",
  "applewood",
  "appliance",
  "application",
  "appointment",
  "appreciation",
  "apprehension",
  "approach",
  "appropriation",
  "approval",
  "apricot",
  "apron",
  "apse",
  "aquarium",
  "aquifer",
  "arcade",
  "arch",
  "arch-rival",
  "archaeologist",
  "archaeology",
  "archeology",
  "archer",
  "architect",
  "architecture",
  "archives",
  "area",
  "arena",
  "argument",
  "arithmetic",
  "ark",
  "arm",
  "arm-rest",
  "armadillo",
  "armament",
  "armchair",
  "armoire",
  "armor",
  "armour",
  "armpit",
  "armrest",
  "army",
  "arrangement",
  "array",
  "arrest",
  "arrival",
  "arrogance",
  "arrow",
  "art",
  "artery",
  "arthur",
  "artichoke",
  "article",
  "artifact",
  "artificer",
  "artist",
  "ascend",
  "ascent",
  "ascot",
  "ash",
  "ashram",
  "ashtray",
  "aside",
  "asparagus",
  "aspect",
  "asphalt",
  "aspic",
  "ass",
  "assassination",
  "assault",
  "assembly",
  "assertion",
  "assessment",
  "asset",
  "assignment",
  "assist",
  "assistance",
  "assistant",
  "associate",
  "association",
  "assumption",
  "assurance",
  "asterisk",
  "astrakhan",
  "astrolabe",
  "astrologer",
  "astrology",
  "astronomy",
  "asymmetry",
  "atelier",
  "atheist",
  "athlete",
  "athletics",
  "atmosphere",
  "atom",
  "atrium",
  "attachment",
  "attack",
  "attacker",
  "attainment",
  "attempt",
  "attendance",
  "attendant",
  "attention",
  "attenuation",
  "attic",
  "attitude",
  "attorney",
  "attraction",
  "attribute",
  "auction",
  "audience",
  "audit",
  "auditorium",
  "aunt",
  "authentication",
  "authenticity",
  "author",
  "authorisation",
  "authority",
  "authorization",
  "auto",
  "autoimmunity",
  "automation",
  "automaton",
  "autumn",
  "availability",
  "avalanche",
  "avenue",
  "average",
  "avocado",
  "award",
  "awareness",
  "awe",
  "axis",
  "azimuth",
  "babe",
  "baboon",
  "babushka",
  "baby",
  "bachelor",
  "back",
  "back-up",
  "backbone",
  "backburn",
  "backdrop",
  "background",
  "backpack",
  "backup",
  "backyard",
  "bacon",
  "bacterium",
  "badge",
  "badger",
  "bafflement",
  "bag",
  "bagel",
  "baggage",
  "baggie",
  "baggy",
  "bagpipe",
  "bail",
  "bait",
  "bake",
  "baker",
  "bakery",
  "bakeware",
  "balaclava",
  "balalaika",
  "balance",
  "balcony",
  "ball",
  "ballet",
  "balloon",
  "balloonist",
  "ballot",
  "ballpark",
  "bamboo",
  "ban",
  "banana",
  "band",
  "bandana",
  "bandanna",
  "bandolier",
  "bandwidth",
  "bangle",
  "banjo",
  "bank",
  "bankbook",
  "banker",
  "banking",
  "bankruptcy",
  "banner",
  "banquette",
  "banyan",
  "baobab",
  "bar",
  "barbecue",
  "barbeque",
  "barber",
  "barbiturate",
  "bargain",
  "barge",
  "baritone",
  "barium",
  "bark",
  "barley",
  "barn",
  "barometer",
  "barracks",
  "barrage",
  "barrel",
  "barrier",
  "barstool",
  "bartender",
  "base",
  "baseball",
  "baseboard",
  "baseline",
  "basement",
  "basics",
  "basil",
  "basin",
  "basis",
  "basket",
  "basketball",
  "bass",
  "bassinet",
  "bassoon",
  "bat",
  "bath",
  "bather",
  "bathhouse",
  "bathrobe",
  "bathroom",
  "bathtub",
  "battalion",
  "batter",
  "battery",
  "batting",
  "battle",
  "battleship",
  "bay",
  "bayou",
  "beach",
  "bead",
  "beak",
  "beam",
  "bean",
  "beancurd",
  "beanie",
  "beanstalk",
  "bear",
  "beard",
  "beast",
  "beastie",
  "beat",
  "beating",
  "beauty",
  "beaver",
  "beck",
  "bed",
  "bedrock",
  "bedroom",
  "bee",
  "beech",
  "beef",
  "beer",
  "beet",
  "beetle",
  "beggar",
  "beginner",
  "beginning",
  "begonia",
  "behalf",
  "behavior",
  "behaviour",
  "beheading",
  "behest",
  "behold",
  "being",
  "belfry",
  "belief",
  "believer",
  "bell",
  "belligerency",
  "bellows",
  "belly",
  "belt",
  "bench",
  "bend",
  "beneficiary",
  "benefit",
  "beret",
  "berry",
  "best-seller",
  "bestseller",
  "bet",
  "beverage",
  "beyond",
  "bias",
  "bibliography",
  "bicycle",
  "bid",
  "bidder",
  "bidding",
  "bidet",
  "bifocals",
  "bijou",
  "bike",
  "bikini",
  "bill",
  "billboard",
  "billing",
  "billion",
  "bin",
  "binoculars",
  "biology",
  "biopsy",
  "biosphere",
  "biplane",
  "birch",
  "bird",
  "bird-watcher",
  "birdbath",
  "birdcage",
  "birdhouse",
  "birth",
  "birthday",
  "biscuit",
  "bit",
  "bite",
  "bitten",
  "bitter",
  "black",
  "blackberry",
  "blackbird",
  "blackboard",
  "blackfish",
  "blackness",
  "bladder",
  "blade",
  "blame",
  "blank",
  "blanket",
  "blast",
  "blazer",
  "blend",
  "blessing",
  "blight",
  "blind",
  "blinker",
  "blister",
  "blizzard",
  "block",
  "blocker",
  "blog",
  "blogger",
  "blood",
  "bloodflow",
  "bloom",
  "bloomer",
  "blossom",
  "blouse",
  "blow",
  "blowgun",
  "blowhole",
  "blue",
  "blueberry",
  "blush",
  "boar",
  "board",
  "boat",
  "boatload",
  "boatyard",
  "bob",
  "bobcat",
  "body",
  "bog",
  "bolero",
  "bolt",
  "bomb",
  "bomber",
  "bombing",
  "bond",
  "bonding",
  "bondsman",
  "bone",
  "bonfire",
  "bongo",
  "bonnet",
  "bonsai",
  "bonus",
  "boogeyman",
  "book",
  "bookcase",
  "bookend",
  "booking",
  "booklet",
  "bookmark",
  "boolean",
  "boom",
  "boon",
  "boost",
  "booster",
  "boot",
  "bootee",
  "bootie",
  "booty",
  "border",
  "bore",
  "borrower",
  "borrowing",
  "bosom",
  "boss",
  "botany",
  "bother",
  "bottle",
  "bottling",
  "bottom",
  "bottom-line",
  "boudoir",
  "bough",
  "boulder",
  "boulevard",
  "boundary",
  "bouquet",
  "bourgeoisie",
  "bout",
  "boutique",
  "bow",
  "bower",
  "bowl",
  "bowler",
  "bowling",
  "bowtie",
  "box",
  "boxer",
  "boxspring",
  "boy",
  "boycott",
  "boyfriend",
  "boyhood",
  "boysenberry",
  "bra",
  "brace",
  "bracelet",
  "bracket",
  "brain",
  "brake",
  "bran",
  "branch",
  "brand",
  "brandy",
  "brass",
  "brassiere",
  "bratwurst",
  "bread",
  "breadcrumb",
  "breadfruit",
  "break",
  "breakdown",
  "breakfast",
  "breakpoint",
  "breakthrough",
  "breast",
  "breastplate",
  "breath",
  "breeze",
  "brewer",
  "bribery",
  "brick",
  "bricklaying",
  "bride",
  "bridge",
  "brief",
  "briefing",
  "briefly",
  "briefs",
  "brilliant",
  "brink",
  "brisket",
  "broad",
  "broadcast",
  "broccoli",
  "brochure",
  "brocolli",
  "broiler",
  "broker",
  "bronchitis",
  "bronco",
  "bronze",
  "brooch",
  "brood",
  "brook",
  "broom",
  "brother",
  "brother-in-law",
  "brow",
  "brown",
  "brownie",
  "browser",
  "browsing",
  "brunch",
  "brush",
  "brushfire",
  "brushing",
  "bubble",
  "buck",
  "bucket",
  "buckle",
  "buckwheat",
  "bud",
  "buddy",
  "budget",
  "buffalo",
  "buffer",
  "buffet",
  "bug",
  "buggy",
  "bugle",
  "builder",
  "building",
  "bulb",
  "bulk",
  "bull",
  "bull-fighter",
  "bulldozer",
  "bullet",
  "bump",
  "bumper",
  "bun",
  "bunch",
  "bungalow",
  "bunghole",
  "bunkhouse",
  "burden",
  "bureau",
  "burglar",
  "burial",
  "burlesque",
  "burn",
  "burn-out",
  "burning",
  "burrito",
  "burro",
  "burrow",
  "burst",
  "bus",
  "bush",
  "business",
  "businessman",
  "bust",
  "bustle",
  "butane",
  "butcher",
  "butler",
  "butter",
  "butterfly",
  "button",
  "buy",
  "buyer",
  "buying",
  "buzz",
  "buzzard",
  "c-clamp",
  "cabana",
  "cabbage",
  "cabin",
  "cabinet",
  "cable",
  "caboose",
  "cacao",
  "cactus",
  "caddy",
  "cadet",
  "cafe",
  "caffeine",
  "caftan",
  "cage",
  "cake",
  "calcification",
  "calculation",
  "calculator",
  "calculus",
  "calendar",
  "calf",
  "caliber",
  "calibre",
  "calico",
  "call",
  "calm",
  "calorie",
  "camel",
  "cameo",
  "camera",
  "camp",
  "campaign",
  "campaigning",
  "campanile",
  "camper",
  "campus",
  "can",
  "canal",
  "cancer",
  "candelabra",
  "candidacy",
  "candidate",
  "candle",
  "candy",
  "cane",
  "cannibal",
  "cannon",
  "canoe",
  "canon",
  "canopy",
  "cantaloupe",
  "canteen",
  "canvas",
  "cap",
  "capability",
  "capacity",
  "cape",
  "caper",
  "capital",
  "capitalism",
  "capitulation",
  "capon",
  "cappelletti",
  "cappuccino",
  "captain",
  "caption",
  "captor",
  "car",
  "carabao",
  "caramel",
  "caravan",
  "carbohydrate",
  "carbon",
  "carboxyl",
  "card",
  "cardboard",
  "cardigan",
  "care",
  "career",
  "cargo",
  "caribou",
  "carload",
  "carnation",
  "carnival",
  "carol",
  "carotene",
  "carp",
  "carpenter",
  "carpet",
  "carpeting",
  "carport",
  "carriage",
  "carrier",
  "carrot",
  "carry",
  "cart",
  "cartel",
  "carter",
  "cartilage",
  "cartload",
  "cartoon",
  "cartridge",
  "carving",
  "cascade",
  "case",
  "casement",
  "cash",
  "cashew",
  "cashier",
  "casino",
  "casket",
  "cassava",
  "casserole",
  "cassock",
  "cast",
  "castanet",
  "castle",
  "casualty",
  "cat",
  "catacomb",
  "catalogue",
  "catalysis",
  "catalyst",
  "catamaran",
  "catastrophe",
  "catch",
  "catcher",
  "category",
  "caterpillar",
  "cathedral",
  "cation",
  "catsup",
  "cattle",
  "cauliflower",
  "causal",
  "cause",
  "causeway",
  "caution",
  "cave",
  "caviar",
  "cayenne",
  "ceiling",
  "celebration",
  "celebrity",
  "celeriac",
  "celery",
  "cell",
  "cellar",
  "cello",
  "celsius",
  "cement",
  "cemetery",
  "cenotaph",
  "census",
  "cent",
  "center",
  "centimeter",
  "centre",
  "centurion",
  "century",
  "cephalopod",
  "ceramic",
  "ceramics",
  "cereal",
  "ceremony",
  "certainty",
  "certificate",
  "certification",
  "cesspool",
  "chafe",
  "chain",
  "chainstay",
  "chair",
  "chairlift",
  "chairman",
  "chairperson",
  "chaise",
  "chalet",
  "chalice",
  "chalk",
  "challenge",
  "chamber",
  "champagne",
  "champion",
  "championship",
  "chance",
  "chandelier",
  "change",
  "channel",
  "chaos",
  "chap",
  "chapel",
  "chaplain",
  "chapter",
  "character",
  "characteristic",
  "characterization",
  "chard",
  "charge",
  "charger",
  "charity",
  "charlatan",
  "charm",
  "charset",
  "chart",
  "charter",
  "chasm",
  "chassis",
  "chastity",
  "chasuble",
  "chateau",
  "chatter",
  "chauffeur",
  "chauvinist",
  "check",
  "checkbook",
  "checking",
  "checkout",
  "checkroom",
  "cheddar",
  "cheek",
  "cheer",
  "cheese",
  "cheesecake",
  "cheetah",
  "chef",
  "chem",
  "chemical",
  "chemistry",
  "chemotaxis",
  "cheque",
  "cherry",
  "chess",
  "chest",
  "chestnut",
  "chick",
  "chicken",
  "chicory",
  "chief",
  "chiffonier",
  "child",
  "childbirth",
  "childhood",
  "chili",
  "chill",
  "chime",
  "chimpanzee",
  "chin",
  "chinchilla",
  "chino",
  "chip",
  "chipmunk",
  "chit-chat",
  "chivalry",
  "chive",
  "chives",
  "chocolate",
  "choice",
  "choir",
  "choker",
  "cholesterol",
  "choosing",
  "chop",
  "chops",
  "chopstick",
  "chopsticks",
  "chord",
  "chorus",
  "chow",
  "chowder",
  "chrome",
  "chromolithograph",
  "chronicle",
  "chronograph",
  "chronometer",
  "chrysalis",
  "chub",
  "chuck",
  "chug",
  "church",
  "churn",
  "chutney",
  "cicada",
  "cigarette",
  "cilantro",
  "cinder",
  "cinema",
  "cinnamon",
  "circadian",
  "circle",
  "circuit",
  "circulation",
  "circumference",
  "circumstance",
  "cirrhosis",
  "cirrus",
  "citizen",
  "citizenship",
  "citron",
  "citrus",
  "city",
  "civilian",
  "civilisation",
  "civilization",
  "claim",
  "clam",
  "clamp",
  "clan",
  "clank",
  "clapboard",
  "clarification",
  "clarinet",
  "clarity",
  "clasp",
  "class",
  "classic",
  "classification",
  "classmate",
  "classroom",
  "clause",
  "clave",
  "clavicle",
  "clavier",
  "claw",
  "clay",
  "cleaner",
  "clearance",
  "clearing",
  "cleat",
  "cleavage",
  "clef",
  "cleft",
  "clergyman",
  "cleric",
  "clerk",
  "click",
  "client",
  "cliff",
  "climate",
  "climb",
  "clinic",
  "clip",
  "clipboard",
  "clipper",
  "cloak",
  "cloakroom",
  "clock",
  "clockwork",
  "clogs",
  "cloister",
  "clone",
  "close",
  "closet",
  "closing",
  "closure",
  "cloth",
  "clothes",
  "clothing",
  "cloud",
  "cloudburst",
  "clove",
  "clover",
  "cloves",
  "club",
  "clue",
  "cluster",
  "clutch",
  "co-producer",
  "coach",
  "coal",
  "coalition",
  "coast",
  "coaster",
  "coat",
  "cob",
  "cobbler",
  "cobweb",
  "cock",
  "cockpit",
  "cockroach",
  "cocktail",
  "cocoa",
  "coconut",
  "cod",
  "code",
  "codepage",
  "codling",
  "codon",
  "codpiece",
  "coevolution",
  "cofactor",
  "coffee",
  "coffin",
  "cohesion",
  "cohort",
  "coil",
  "coin",
  "coincidence",
  "coinsurance",
  "coke",
  "cold",
  "coleslaw",
  "coliseum",
  "collaboration",
  "collagen",
  "collapse",
  "collar",
  "collard",
  "collateral",
  "colleague",
  "collection",
  "collectivisation",
  "collectivization",
  "collector",
  "college",
  "collision",
  "colloquy",
  "colon",
  "colonial",
  "colonialism",
  "colonisation",
  "colonization",
  "colony",
  "color",
  "colorlessness",
  "colt",
  "column",
  "columnist",
  "comb",
  "combat",
  "combination",
  "combine",
  "comeback",
  "comedy",
  "comestible",
  "comfort",
  "comfortable",
  "comic",
  "comics",
  "comma",
  "command",
  "commander",
  "commandment",
  "comment",
  "commerce",
  "commercial",
  "commission",
  "commitment",
  "committee",
  "commodity",
  "common",
  "commonsense",
  "commotion",
  "communicant",
  "communication",
  "communion",
  "communist",
  "community",
  "commuter",
  "company",
  "comparison",
  "compass",
  "compassion",
  "compassionate",
  "compensation",
  "competence",
  "competition",
  "competitor",
  "complaint",
  "complement",
  "completion",
  "complex",
  "complexity",
  "compliance",
  "complication",
  "complicity",
  "compliment",
  "component",
  "comportment",
  "composer",
  "composite",
  "composition",
  "compost",
  "comprehension",
  "compress",
  "compromise",
  "comptroller",
  "compulsion",
  "computer",
  "comradeship",
  "con",
  "concentrate",
  "concentration",
  "concept",
  "conception",
  "concern",
  "concert",
  "conclusion",
  "concrete",
  "condition",
  "conditioner",
  "condominium",
  "condor",
  "conduct",
  "conductor",
  "cone",
  "confectionery",
  "conference",
  "confidence",
  "confidentiality",
  "configuration",
  "confirmation",
  "conflict",
  "conformation",
  "confusion",
  "conga",
  "congo",
  "congregation",
  "congress",
  "congressman",
  "congressperson",
  "conifer",
  "connection",
  "connotation",
  "conscience",
  "consciousness",
  "consensus",
  "consent",
  "consequence",
  "conservation",
  "conservative",
  "consideration",
  "consignment",
  "consist",
  "consistency",
  "console",
  "consonant",
  "conspiracy",
  "conspirator",
  "constant",
  "constellation",
  "constitution",
  "constraint",
  "construction",
  "consul",
  "consulate",
  "consulting",
  "consumer",
  "consumption",
  "contact",
  "contact lens",
  "contagion",
  "container",
  "content",
  "contention",
  "contest",
  "context",
  "continent",
  "contingency",
  "continuity",
  "contour",
  "contract",
  "contractor",
  "contrail",
  "contrary",
  "contrast",
  "contribution",
  "contributor",
  "control",
  "controller",
  "controversy",
  "convection",
  "convenience",
  "convention",
  "conversation",
  "conversion",
  "convert",
  "convertible",
  "conviction",
  "cook",
  "cookbook",
  "cookie",
  "cooking",
  "coonskin",
  "cooperation",
  "coordination",
  "coordinator",
  "cop",
  "cop-out",
  "cope",
  "copper",
  "copy",
  "copying",
  "copyright",
  "copywriter",
  "coral",
  "cord",
  "corduroy",
  "core",
  "cork",
  "cormorant",
  "corn",
  "corner",
  "cornerstone",
  "cornet",
  "cornflakes",
  "cornmeal",
  "corporal",
  "corporation",
  "corporatism",
  "corps",
  "corral",
  "correspondence",
  "correspondent",
  "corridor",
  "corruption",
  "corsage",
  "cosset",
  "cost",
  "costume",
  "cot",
  "cottage",
  "cotton",
  "couch",
  "cougar",
  "cough",
  "council",
  "councilman",
  "councilor",
  "councilperson",
  "counsel",
  "counseling",
  "counselling",
  "counsellor",
  "counselor",
  "count",
  "counter",
  "counter-force",
  "counterpart",
  "counterterrorism",
  "countess",
  "country",
  "countryside",
  "county",
  "couple",
  "coupon",
  "courage",
  "course",
  "court",
  "courthouse",
  "courtroom",
  "cousin",
  "covariate",
  "cover",
  "coverage",
  "coverall",
  "cow",
  "cowbell",
  "cowboy",
  "coyote",
  "crab",
  "crack",
  "cracker",
  "crackers",
  "cradle",
  "craft",
  "craftsman",
  "cranberry",
  "crane",
  "cranky",
  "crap",
  "crash",
  "crate",
  "cravat",
  "craw",
  "crawdad",
  "crayfish",
  "crayon",
  "crazy",
  "cream",
  "creation",
  "creationism",
  "creationist",
  "creative",
  "creativity",
  "creator",
  "creature",
  "creche",
  "credential",
  "credenza",
  "credibility",
  "credit",
  "creditor",
  "creek",
  "creme brulee",
  "crepe",
  "crest",
  "crew",
  "crewman",
  "crewmate",
  "crewmember",
  "crewmen",
  "cria",
  "crib",
  "cribbage",
  "cricket",
  "cricketer",
  "crime",
  "criminal",
  "crinoline",
  "crisis",
  "crisp",
  "criteria",
  "criterion",
  "critic",
  "criticism",
  "crocodile",
  "crocus",
  "croissant",
  "crook",
  "crop",
  "cross",
  "cross-contamination",
  "cross-stitch",
  "crotch",
  "croup",
  "crow",
  "crowd",
  "crown",
  "crucifixion",
  "crude",
  "cruelty",
  "cruise",
  "crumb",
  "crunch",
  "crusader",
  "crush",
  "crust",
  "cry",
  "crystal",
  "crystallography",
  "cub",
  "cube",
  "cuckoo",
  "cucumber",
  "cue",
  "cuff-link",
  "cuisine",
  "cultivar",
  "cultivator",
  "culture",
  "culvert",
  "cummerbund",
  "cup",
  "cupboard",
  "cupcake",
  "cupola",
  "curd",
  "cure",
  "curio",
  "curiosity",
  "curl",
  "curler",
  "currant",
  "currency",
  "current",
  "curriculum",
  "curry",
  "curse",
  "cursor",
  "curtailment",
  "curtain",
  "curve",
  "cushion",
  "custard",
  "custody",
  "custom",
  "customer",
  "cut",
  "cuticle",
  "cutlet",
  "cutover",
  "cutting",
  "cyclamen",
  "cycle",
  "cyclone",
  "cyclooxygenase",
  "cygnet",
  "cylinder",
  "cymbal",
  "cynic",
  "cyst",
  "cytokine",
  "cytoplasm",
  "dad",
  "daddy",
  "daffodil",
  "dagger",
  "dahlia",
  "daikon",
  "daily",
  "dairy",
  "daisy",
  "dam",
  "damage",
  "dame",
  "damn",
  "dance",
  "dancer",
  "dancing",
  "dandelion",
  "danger",
  "dare",
  "dark",
  "darkness",
  "darn",
  "dart",
  "dash",
  "dashboard",
  "data",
  "database",
  "date",
  "daughter",
  "dawn",
  "day",
  "daybed",
  "daylight",
  "dead",
  "deadline",
  "deal",
  "dealer",
  "dealing",
  "dearest",
  "death",
  "deathwatch",
  "debate",
  "debris",
  "debt",
  "debtor",
  "decade",
  "decadence",
  "decency",
  "decimal",
  "decision",
  "decision-making",
  "deck",
  "declaration",
  "declination",
  "decline",
  "decoder",
  "decongestant",
  "decoration",
  "decrease",
  "decryption",
  "dedication",
  "deduce",
  "deduction",
  "deed",
  "deep",
  "deer",
  "default",
  "defeat",
  "defendant",
  "defender",
  "defense",
  "deficit",
  "definition",
  "deformation",
  "degradation",
  "degree",
  "delay",
  "deliberation",
  "delight",
  "delivery",
  "demand",
  "democracy",
  "democrat",
  "demon",
  "demur",
  "den",
  "denim",
  "denominator",
  "density",
  "dentist",
  "deodorant",
  "department",
  "departure",
  "dependency",
  "dependent",
  "deployment",
  "deposit",
  "deposition",
  "depot",
  "depression",
  "depressive",
  "depth",
  "deputy",
  "derby",
  "derivation",
  "derivative",
  "derrick",
  "descendant",
  "descent",
  "description",
  "desert",
  "design",
  "designation",
  "designer",
  "desire",
  "desk",
  "desktop",
  "dessert",
  "destination",
  "destiny",
  "destroyer",
  "destruction",
  "detail",
  "detainee",
  "detainment",
  "detection",
  "detective",
  "detector",
  "detention",
  "determination",
  "detour",
  "devastation",
  "developer",
  "developing",
  "development",
  "developmental",
  "deviance",
  "deviation",
  "device",
  "devil",
  "dew",
  "dhow",
  "diabetes",
  "diadem",
  "diagnosis",
  "diagram",
  "dial",
  "dialect",
  "dialogue",
  "diam",
  "diamond",
  "diaper",
  "diaphragm",
  "diarist",
  "diary",
  "dibble",
  "dick",
  "dickey",
  "dictaphone",
  "dictator",
  "diction",
  "dictionary",
  "die",
  "diesel",
  "diet",
  "difference",
  "differential",
  "difficulty",
  "diffuse",
  "dig",
  "digestion",
  "digestive",
  "digger",
  "digging",
  "digit",
  "dignity",
  "dilapidation",
  "dill",
  "dilution",
  "dime",
  "dimension",
  "dimple",
  "diner",
  "dinghy",
  "dining",
  "dinner",
  "dinosaur",
  "dioxide",
  "dip",
  "diploma",
  "diplomacy",
  "dipstick",
  "direction",
  "directive",
  "director",
  "directory",
  "dirndl",
  "dirt",
  "disability",
  "disadvantage",
  "disagreement",
  "disappointment",
  "disarmament",
  "disaster",
  "discharge",
  "discipline",
  "disclaimer",
  "disclosure",
  "disco",
  "disconnection",
  "discount",
  "discourse",
  "discovery",
  "discrepancy",
  "discretion",
  "discrimination",
  "discussion",
  "disdain",
  "disease",
  "disembodiment",
  "disengagement",
  "disguise",
  "disgust",
  "dish",
  "dishwasher",
  "disk",
  "disparity",
  "dispatch",
  "displacement",
  "display",
  "disposal",
  "disposer",
  "disposition",
  "dispute",
  "disregard",
  "disruption",
  "dissemination",
  "dissonance",
  "distance",
  "distinction",
  "distortion",
  "distribution",
  "distributor",
  "district",
  "divalent",
  "divan",
  "diver",
  "diversity",
  "divide",
  "dividend",
  "divider",
  "divine",
  "diving",
  "division",
  "divorce",
  "doc",
  "dock",
  "doctor",
  "doctorate",
  "doctrine",
  "document",
  "documentary",
  "documentation",
  "doe",
  "dog",
  "doggie",
  "dogsled",
  "dogwood",
  "doing",
  "doll",
  "dollar",
  "dollop",
  "dolman",
  "dolor",
  "dolphin",
  "domain",
  "dome",
  "domination",
  "donation",
  "donkey",
  "donor",
  "donut",
  "door",
  "doorbell",
  "doorknob",
  "doorpost",
  "doorway",
  "dory",
  "dose",
  "dot",
  "double",
  "doubling",
  "doubt",
  "doubter",
  "dough",
  "doughnut",
  "down",
  "downfall",
  "downforce",
  "downgrade",
  "download",
  "downstairs",
  "downtown",
  "downturn",
  "dozen",
  "draft",
  "drag",
  "dragon",
  "dragonfly",
  "dragonfruit",
  "dragster",
  "drain",
  "drainage",
  "drake",
  "drama",
  "dramaturge",
  "drapes",
  "draw",
  "drawbridge",
  "drawer",
  "drawing",
  "dream",
  "dreamer",
  "dredger",
  "dress",
  "dresser",
  "dressing",
  "drill",
  "drink",
  "drinking",
  "drive",
  "driver",
  "driveway",
  "driving",
  "drizzle",
  "dromedary",
  "drop",
  "drudgery",
  "drug",
  "drum",
  "drummer",
  "drunk",
  "dryer",
  "duck",
  "duckling",
  "dud",
  "dude",
  "due",
  "duel",
  "dueling",
  "duffel",
  "dugout",
  "dulcimer",
  "dumbwaiter",
  "dump",
  "dump truck",
  "dune",
  "dune buggy",
  "dungarees",
  "dungeon",
  "duplexer",
  "duration",
  "durian",
  "dusk",
  "dust",
  "dust storm",
  "duster",
  "duty",
  "dwarf",
  "dwell",
  "dwelling",
  "dynamics",
  "dynamite",
  "dynamo",
  "dynasty",
  "dysfunction",
  "e-book",
  "e-mail",
  "e-reader",
  "eagle",
  "eaglet",
  "ear",
  "eardrum",
  "earmuffs",
  "earnings",
  "earplug",
  "earring",
  "earrings",
  "earth",
  "earthquake",
  "earthworm",
  "ease",
  "easel",
  "east",
  "eating",
  "eaves",
  "eavesdropper",
  "ecclesia",
  "echidna",
  "eclipse",
  "ecliptic",
  "ecology",
  "economics",
  "economy",
  "ecosystem",
  "ectoderm",
  "ectodermal",
  "ecumenist",
  "eddy",
  "edge",
  "edger",
  "edible",
  "editing",
  "edition",
  "editor",
  "editorial",
  "education",
  "eel",
  "effacement",
  "effect",
  "effective",
  "effectiveness",
  "effector",
  "efficacy",
  "efficiency",
  "effort",
  "egg",
  "egghead",
  "eggnog",
  "eggplant",
  "ego",
  "eicosanoid",
  "ejector",
  "elbow",
  "elderberry",
  "election",
  "electricity",
  "electrocardiogram",
  "electronics",
  "element",
  "elephant",
  "elevation",
  "elevator",
  "eleventh",
  "elf",
  "elicit",
  "eligibility",
  "elimination",
  "elite",
  "elixir",
  "elk",
  "ellipse",
  "elm",
  "elongation",
  "elver",
  "email",
  "emanate",
  "embarrassment",
  "embassy",
  "embellishment",
  "embossing",
  "embryo",
  "emerald",
  "emergence",
  "emergency",
  "emergent",
  "emery",
  "emission",
  "emitter",
  "emotion",
  "emphasis",
  "empire",
  "employ",
  "employee",
  "employer",
  "employment",
  "empowerment",
  "emu",
  "enactment",
  "encirclement",
  "enclave",
  "enclosure",
  "encounter",
  "encouragement",
  "encyclopedia",
  "end",
  "endive",
  "endoderm",
  "endorsement",
  "endothelium",
  "endpoint",
  "enemy",
  "energy",
  "enforcement",
  "engagement",
  "engine",
  "engineer",
  "engineering",
  "enigma",
  "enjoyment",
  "enquiry",
  "enrollment",
  "enterprise",
  "entertainment",
  "enthusiasm",
  "entirety",
  "entity",
  "entrance",
  "entree",
  "entrepreneur",
  "entry",
  "envelope",
  "environment",
  "envy",
  "enzyme",
  "epauliere",
  "epee",
  "ephemera",
  "ephemeris",
  "ephyra",
  "epic",
  "episode",
  "epithelium",
  "epoch",
  "eponym",
  "epoxy",
  "equal",
  "equality",
  "equation",
  "equinox",
  "equipment",
  "equity",
  "equivalent",
  "era",
  "eraser",
  "erection",
  "erosion",
  "error",
  "escalator",
  "escape",
  "escort",
  "espadrille",
  "espalier",
  "essay",
  "essence",
  "essential",
  "establishment",
  "estate",
  "estimate",
  "estrogen",
  "estuary",
  "eternity",
  "ethernet",
  "ethics",
  "ethnicity",
  "ethyl",
  "euphonium",
  "eurocentrism",
  "evaluation",
  "evaluator",
  "evaporation",
  "eve",
  "evening",
  "evening-wear",
  "event",
  "everybody",
  "everyone",
  "everything",
  "eviction",
  "evidence",
  "evil",
  "evocation",
  "evolution",
  "ex-husband",
  "ex-wife",
  "exaggeration",
  "exam",
  "examination",
  "examiner",
  "example",
  "exasperation",
  "excellence",
  "exception",
  "excerpt",
  "excess",
  "exchange",
  "excitement",
  "exclamation",
  "excursion",
  "excuse",
  "execution",
  "executive",
  "executor",
  "exercise",
  "exhaust",
  "exhaustion",
  "exhibit",
  "exhibition",
  "exile",
  "existence",
  "exit",
  "exocrine",
  "expansion",
  "expansionism",
  "expectancy",
  "expectation",
  "expedition",
  "expense",
  "experience",
  "experiment",
  "experimentation",
  "expert",
  "expertise",
  "explanation",
  "exploration",
  "explorer",
  "explosion",
  "export",
  "expose",
  "exposition",
  "exposure",
  "expression",
  "extension",
  "extent",
  "exterior",
  "external",
  "extinction",
  "extreme",
  "extremist",
  "eye",
  "eyeball",
  "eyebrow",
  "eyebrows",
  "eyeglasses",
  "eyelash",
  "eyelashes",
  "eyelid",
  "eyelids",
  "eyeliner",
  "eyestrain",
  "eyrie",
  "fabric",
  "face",
  "facelift",
  "facet",
  "facility",
  "facsimile",
  "fact",
  "factor",
  "factory",
  "faculty",
  "fahrenheit",
  "fail",
  "failure",
  "fairness",
  "fairy",
  "faith",
  "faithful",
  "fall",
  "fallacy",
  "falling-out",
  "fame",
  "familiar",
  "familiarity",
  "family",
  "fan",
  "fang",
  "fanlight",
  "fanny",
  "fanny-pack",
  "fantasy",
  "farm",
  "farmer",
  "farming",
  "farmland",
  "farrow",
  "fascia",
  "fashion",
  "fat",
  "fate",
  "father",
  "father-in-law",
  "fatigue",
  "fatigues",
  "faucet",
  "fault",
  "fav",
  "fava",
  "favor",
  "favorite",
  "fawn",
  "fax",
  "fear",
  "feast",
  "feather",
  "feature",
  "fedelini",
  "federation",
  "fedora",
  "fee",
  "feed",
  "feedback",
  "feeding",
  "feel",
  "feeling",
  "fellow",
  "felony",
  "female",
  "fen",
  "fence",
  "fencing",
  "fender",
  "feng",
  "fennel",
  "ferret",
  "ferry",
  "ferryboat",
  "fertilizer",
  "festival",
  "fetus",
  "few",
  "fiber",
  "fiberglass",
  "fibre",
  "fibroblast",
  "fibrosis",
  "ficlet",
  "fiction",
  "fiddle",
  "field",
  "fiery",
  "fiesta",
  "fifth",
  "fig",
  "fight",
  "fighter",
  "figure",
  "figurine",
  "file",
  "filing",
  "fill",
  "fillet",
  "filly",
  "film",
  "filter",
  "filth",
  "final",
  "finance",
  "financing",
  "finding",
  "fine",
  "finer",
  "finger",
  "fingerling",
  "fingernail",
  "finish",
  "finisher",
  "fir",
  "fire",
  "fireman",
  "fireplace",
  "firewall",
  "firm",
  "first",
  "fish",
  "fishbone",
  "fisherman",
  "fishery",
  "fishing",
  "fishmonger",
  "fishnet",
  "fisting",
  "fit",
  "fitness",
  "fix",
  "fixture",
  "flag",
  "flair",
  "flame",
  "flan",
  "flanker",
  "flare",
  "flash",
  "flat",
  "flatboat",
  "flavor",
  "flax",
  "fleck",
  "fledgling",
  "fleece",
  "flesh",
  "flexibility",
  "flick",
  "flicker",
  "flight",
  "flint",
  "flintlock",
  "flip-flops",
  "flock",
  "flood",
  "floodplain",
  "floor",
  "floozie",
  "flour",
  "flow",
  "flower",
  "flu",
  "flugelhorn",
  "fluke",
  "flume",
  "flung",
  "flute",
  "fly",
  "flytrap",
  "foal",
  "foam",
  "fob",
  "focus",
  "fog",
  "fold",
  "folder",
  "folk",
  "folklore",
  "follower",
  "following",
  "fondue",
  "font",
  "food",
  "foodstuffs",
  "fool",
  "foot",
  "footage",
  "football",
  "footnote",
  "footprint",
  "footrest",
  "footstep",
  "footstool",
  "footwear",
  "forage",
  "forager",
  "foray",
  "force",
  "ford",
  "forearm",
  "forebear",
  "forecast",
  "forehead",
  "foreigner",
  "forelimb",
  "forest",
  "forestry",
  "forever",
  "forgery",
  "fork",
  "form",
  "formal",
  "formamide",
  "format",
  "formation",
  "former",
  "formicarium",
  "formula",
  "fort",
  "forte",
  "fortnight",
  "fortress",
  "fortune",
  "forum",
  "foundation",
  "founder",
  "founding",
  "fountain",
  "fourths",
  "fowl",
  "fox",
  "foxglove",
  "fraction",
  "fragrance",
  "frame",
  "framework",
  "fratricide",
  "fraud",
  "fraudster",
  "freak",
  "freckle",
  "freedom",
  "freelance",
  "freezer",
  "freezing",
  "freight",
  "freighter",
  "frenzy",
  "freon",
  "frequency",
  "fresco",
  "friction",
  "fridge",
  "friend",
  "friendship",
  "fries",
  "frigate",
  "fright",
  "fringe",
  "fritter",
  "frock",
  "frog",
  "front",
  "frontier",
  "frost",
  "frosting",
  "frown",
  "fruit",
  "frustration",
  "fry",
  "fuck",
  "fuel",
  "fugato",
  "fulfillment",
  "full",
  "fun",
  "function",
  "functionality",
  "fund",
  "funding",
  "fundraising",
  "funeral",
  "fur",
  "furnace",
  "furniture",
  "furry",
  "fusarium",
  "futon",
  "future",
  "gadget",
  "gaffe",
  "gaffer",
  "gain",
  "gaiters",
  "gale",
  "gall-bladder",
  "gallery",
  "galley",
  "gallon",
  "galoshes",
  "gambling",
  "game",
  "gamebird",
  "gaming",
  "gamma-ray",
  "gander",
  "gang",
  "gap",
  "garage",
  "garb",
  "garbage",
  "garden",
  "garlic",
  "garment",
  "garter",
  "gas",
  "gasket",
  "gasoline",
  "gasp",
  "gastronomy",
  "gastropod",
  "gate",
  "gateway",
  "gather",
  "gathering",
  "gator",
  "gauge",
  "gauntlet",
  "gavel",
  "gazebo",
  "gazelle",
  "gear",
  "gearshift",
  "geek",
  "gel",
  "gelatin",
  "gelding",
  "gem",
  "gemsbok",
  "gender",
  "gene",
  "general",
  "generation",
  "generator",
  "generosity",
  "genetics",
  "genie",
  "genius",
  "genocide",
  "genre",
  "gentleman",
  "geography",
  "geology",
  "geometry",
  "geranium",
  "gerbil",
  "gesture",
  "geyser",
  "gherkin",
  "ghost",
  "giant",
  "gift",
  "gig",
  "gigantism",
  "giggle",
  "ginger",
  "gingerbread",
  "ginseng",
  "giraffe",
  "girdle",
  "girl",
  "girlfriend",
  "git",
  "glacier",
  "gladiolus",
  "glance",
  "gland",
  "glass",
  "glasses",
  "glee",
  "glen",
  "glider",
  "gliding",
  "glimpse",
  "globe",
  "glockenspiel",
  "gloom",
  "glory",
  "glove",
  "glow",
  "glucose",
  "glue",
  "glut",
  "glutamate",
  "gnat",
  "gnu",
  "go-kart",
  "goal",
  "goat",
  "gobbler",
  "god",
  "goddess",
  "godfather",
  "godmother",
  "godparent",
  "goggles",
  "going",
  "gold",
  "goldfish",
  "golf",
  "gondola",
  "gong",
  "good",
  "good-bye",
  "goodbye",
  "goodie",
  "goodness",
  "goodnight",
  "goodwill",
  "goose",
  "gopher",
  "gorilla",
  "gosling",
  "gossip",
  "governance",
  "government",
  "governor",
  "gown",
  "grab-bag",
  "grace",
  "grade",
  "gradient",
  "graduate",
  "graduation",
  "graffiti",
  "graft",
  "grain",
  "gram",
  "grammar",
  "gran",
  "grand",
  "grandchild",
  "granddaughter",
  "grandfather",
  "grandma",
  "grandmom",
  "grandmother",
  "grandpa",
  "grandparent",
  "grandson",
  "granny",
  "granola",
  "grant",
  "grape",
  "grapefruit",
  "graph",
  "graphic",
  "grasp",
  "grass",
  "grasshopper",
  "grassland",
  "gratitude",
  "gravel",
  "gravitas",
  "gravity",
  "gravy",
  "gray",
  "grease",
  "great-grandfather",
  "great-grandmother",
  "greatness",
  "greed",
  "green",
  "greenhouse",
  "greens",
  "grenade",
  "grey",
  "grid",
  "grief",
  "grill",
  "grin",
  "grip",
  "gripper",
  "grit",
  "grocery",
  "ground",
  "group",
  "grouper",
  "grouse",
  "grove",
  "growth",
  "grub",
  "guacamole",
  "guarantee",
  "guard",
  "guava",
  "guerrilla",
  "guess",
  "guest",
  "guestbook",
  "guidance",
  "guide",
  "guideline",
  "guilder",
  "guilt",
  "guilty",
  "guinea",
  "guitar",
  "guitarist",
  "gum",
  "gumshoe",
  "gun",
  "gunpowder",
  "gutter",
  "guy",
  "gym",
  "gymnast",
  "gymnastics",
  "gynaecology",
  "gyro",
  "habit",
  "habitat",
  "hacienda",
  "hacksaw",
  "hackwork",
  "hail",
  "hair",
  "haircut",
  "hake",
  "half",
  "half-brother",
  "half-sister",
  "halibut",
  "hall",
  "halloween",
  "hallway",
  "halt",
  "ham",
  "hamburger",
  "hammer",
  "hammock",
  "hamster",
  "hand",
  "hand-holding",
  "handball",
  "handful",
  "handgun",
  "handicap",
  "handle",
  "handlebar",
  "handmaiden",
  "handover",
  "handrail",
  "handsaw",
  "hanger",
  "happening",
  "happiness",
  "harald",
  "harbor",
  "harbour",
  "hard-hat",
  "hardboard",
  "hardcover",
  "hardening",
  "hardhat",
  "hardship",
  "hardware",
  "hare",
  "harm",
  "harmonica",
  "harmonise",
  "harmonize",
  "harmony",
  "harp",
  "harpooner",
  "harpsichord",
  "harvest",
  "harvester",
  "hash",
  "hashtag",
  "hassock",
  "haste",
  "hat",
  "hatbox",
  "hatchet",
  "hatchling",
  "hate",
  "hatred",
  "haunt",
  "haven",
  "haversack",
  "havoc",
  "hawk",
  "hay",
  "haze",
  "hazel",
  "hazelnut",
  "head",
  "headache",
  "headlight",
  "headline",
  "headphones",
  "headquarters",
  "headrest",
  "health",
  "health-care",
  "hearing",
  "hearsay",
  "heart",
  "heart-throb",
  "heartache",
  "heartbeat",
  "hearth",
  "hearthside",
  "heartwood",
  "heat",
  "heater",
  "heating",
  "heaven",
  "heavy",
  "hectare",
  "hedge",
  "hedgehog",
  "heel",
  "heifer",
  "height",
  "heir",
  "heirloom",
  "helicopter",
  "helium",
  "hell",
  "hellcat",
  "hello",
  "helmet",
  "helo",
  "help",
  "hemisphere",
  "hemp",
  "hen",
  "hepatitis",
  "herb",
  "herbs",
  "heritage",
  "hermit",
  "hero",
  "heroine",
  "heron",
  "herring",
  "hesitation",
  "heterosexual",
  "hexagon",
  "heyday",
  "hiccups",
  "hide",
  "hierarchy",
  "high",
  "high-rise",
  "highland",
  "highlight",
  "highway",
  "hike",
  "hiking",
  "hill",
  "hint",
  "hip",
  "hippodrome",
  "hippopotamus",
  "hire",
  "hiring",
  "historian",
  "history",
  "hit",
  "hive",
  "hobbit",
  "hobby",
  "hockey",
  "hoe",
  "hog",
  "hold",
  "holder",
  "hole",
  "holiday",
  "home",
  "homeland",
  "homeownership",
  "hometown",
  "homework",
  "homicide",
  "homogenate",
  "homonym",
  "homosexual",
  "homosexuality",
  "honesty",
  "honey",
  "honeybee",
  "honeydew",
  "honor",
  "honoree",
  "hood",
  "hoof",
  "hook",
  "hop",
  "hope",
  "hops",
  "horde",
  "horizon",
  "hormone",
  "horn",
  "hornet",
  "horror",
  "horse",
  "horseradish",
  "horst",
  "hose",
  "hosiery",
  "hospice",
  "hospital",
  "hospitalisation",
  "hospitality",
  "hospitalization",
  "host",
  "hostel",
  "hostess",
  "hotdog",
  "hotel",
  "hound",
  "hour",
  "hourglass",
  "house",
  "houseboat",
  "household",
  "housewife",
  "housework",
  "housing",
  "hovel",
  "hovercraft",
  "howard",
  "howitzer",
  "hub",
  "hubcap",
  "hubris",
  "hug",
  "hugger",
  "hull",
  "human",
  "humanity",
  "humidity",
  "hummus",
  "humor",
  "humour",
  "hunchback",
  "hundred",
  "hunger",
  "hunt",
  "hunter",
  "hunting",
  "hurdle",
  "hurdler",
  "hurricane",
  "hurry",
  "hurt",
  "husband",
  "hut",
  "hutch",
  "hyacinth",
  "hybridisation",
  "hybridization",
  "hydrant",
  "hydraulics",
  "hydrocarb",
  "hydrocarbon",
  "hydrofoil",
  "hydrogen",
  "hydrolyse",
  "hydrolysis",
  "hydrolyze",
  "hydroxyl",
  "hyena",
  "hygienic",
  "hype",
  "hyphenation",
  "hypochondria",
  "hypothermia",
  "hypothesis",
  "ice",
  "ice-cream",
  "iceberg",
  "icebreaker",
  "icecream",
  "icicle",
  "icing",
  "icon",
  "icy",
  "id",
  "idea",
  "ideal",
  "identification",
  "identity",
  "ideology",
  "idiom",
  "idiot",
  "igloo",
  "ignorance",
  "ignorant",
  "ikebana",
  "illegal",
  "illiteracy",
  "illness",
  "illusion",
  "illustration",
  "image",
  "imagination",
  "imbalance",
  "imitation",
  "immigrant",
  "immigration",
  "immortal",
  "impact",
  "impairment",
  "impala",
  "impediment",
  "implement",
  "implementation",
  "implication",
  "import",
  "importance",
  "impostor",
  "impress",
  "impression",
  "imprisonment",
  "impropriety",
  "improvement",
  "impudence",
  "impulse",
  "in-joke",
  "in-laws",
  "inability",
  "inauguration",
  "inbox",
  "incandescence",
  "incarnation",
  "incense",
  "incentive",
  "inch",
  "incidence",
  "incident",
  "incision",
  "inclusion",
  "income",
  "incompetence",
  "inconvenience",
  "increase",
  "incubation",
  "independence",
  "independent",
  "index",
  "indication",
  "indicator",
  "indigence",
  "individual",
  "industrialisation",
  "industrialization",
  "industry",
  "inequality",
  "inevitable",
  "infancy",
  "infant",
  "infarction",
  "infection",
  "infiltration",
  "infinite",
  "infix",
  "inflammation",
  "inflation",
  "influence",
  "influx",
  "info",
  "information",
  "infrastructure",
  "infusion",
  "inglenook",
  "ingrate",
  "ingredient",
  "inhabitant",
  "inheritance",
  "inhibition",
  "inhibitor",
  "initial",
  "initialise",
  "initialize",
  "initiative",
  "injunction",
  "injury",
  "injustice",
  "ink",
  "inlay",
  "inn",
  "innervation",
  "innocence",
  "innocent",
  "innovation",
  "input",
  "inquiry",
  "inscription",
  "insect",
  "insectarium",
  "insert",
  "inside",
  "insight",
  "insolence",
  "insomnia",
  "inspection",
  "inspector",
  "inspiration",
  "installation",
  "instance",
  "instant",
  "instinct",
  "institute",
  "institution",
  "instruction",
  "instructor",
  "instrument",
  "instrumentalist",
  "instrumentation",
  "insulation",
  "insurance",
  "insurgence",
  "insurrection",
  "integer",
  "integral",
  "integration",
  "integrity",
  "intellect",
  "intelligence",
  "intensity",
  "intent",
  "intention",
  "intentionality",
  "interaction",
  "interchange",
  "interconnection",
  "intercourse",
  "interest",
  "interface",
  "interferometer",
  "interior",
  "interject",
  "interloper",
  "internet",
  "interpretation",
  "interpreter",
  "interval",
  "intervenor",
  "intervention",
  "interview",
  "interviewer",
  "intestine",
  "introduction",
  "intuition",
  "invader",
  "invasion",
  "invention",
  "inventor",
  "inventory",
  "inverse",
  "inversion",
  "investigation",
  "investigator",
  "investment",
  "investor",
  "invitation",
  "invite",
  "invoice",
  "involvement",
  "iridescence",
  "iris",
  "iron",
  "ironclad",
  "irony",
  "irrigation",
  "ischemia",
  "island",
  "isogloss",
  "isolation",
  "issue",
  "item",
  "itinerary",
  "ivory",
  "jack",
  "jackal",
  "jacket",
  "jackfruit",
  "jade",
  "jaguar",
  "jail",
  "jailhouse",
  "jalape\xF1o",
  "jam",
  "jar",
  "jasmine",
  "jaw",
  "jazz",
  "jealousy",
  "jeans",
  "jeep",
  "jelly",
  "jellybeans",
  "jellyfish",
  "jerk",
  "jet",
  "jewel",
  "jeweller",
  "jewellery",
  "jewelry",
  "jicama",
  "jiffy",
  "job",
  "jockey",
  "jodhpurs",
  "joey",
  "jogging",
  "joint",
  "joke",
  "jot",
  "journal",
  "journalism",
  "journalist",
  "journey",
  "joy",
  "judge",
  "judgment",
  "judo",
  "jug",
  "juggernaut",
  "juice",
  "julienne",
  "jumbo",
  "jump",
  "jumper",
  "jumpsuit",
  "jungle",
  "junior",
  "junk",
  "junker",
  "junket",
  "jury",
  "justice",
  "justification",
  "jute",
  "kale",
  "kamikaze",
  "kangaroo",
  "karate",
  "kayak",
  "kazoo",
  "kebab",
  "keep",
  "keeper",
  "kendo",
  "kennel",
  "ketch",
  "ketchup",
  "kettle",
  "kettledrum",
  "key",
  "keyboard",
  "keyboarding",
  "keystone",
  "kick",
  "kick-off",
  "kid",
  "kidney",
  "kielbasa",
  "kill",
  "killer",
  "killing",
  "kilogram",
  "kilometer",
  "kilt",
  "kimono",
  "kinase",
  "kind",
  "kindness",
  "king",
  "kingdom",
  "kingfish",
  "kiosk",
  "kiss",
  "kit",
  "kitchen",
  "kite",
  "kitsch",
  "kitten",
  "kitty",
  "kiwi",
  "knee",
  "kneejerk",
  "knickers",
  "knife",
  "knife-edge",
  "knight",
  "knitting",
  "knock",
  "knot",
  "know-how",
  "knowledge",
  "knuckle",
  "koala",
  "kohlrabi",
  "kumquat",
  "lab",
  "label",
  "labor",
  "laboratory",
  "laborer",
  "labour",
  "labourer",
  "lace",
  "lack",
  "lacquerware",
  "lad",
  "ladder",
  "ladle",
  "lady",
  "ladybug",
  "lag",
  "lake",
  "lamb",
  "lambkin",
  "lament",
  "lamp",
  "lanai",
  "land",
  "landform",
  "landing",
  "landmine",
  "landscape",
  "lane",
  "language",
  "lantern",
  "lap",
  "laparoscope",
  "lapdog",
  "laptop",
  "larch",
  "lard",
  "larder",
  "lark",
  "larva",
  "laryngitis",
  "lasagna",
  "lashes",
  "last",
  "latency",
  "latex",
  "lathe",
  "latitude",
  "latte",
  "latter",
  "laugh",
  "laughter",
  "laundry",
  "lava",
  "law",
  "lawmaker",
  "lawn",
  "lawsuit",
  "lawyer",
  "lay",
  "layer",
  "layout",
  "lead",
  "leader",
  "leadership",
  "leading",
  "leaf",
  "league",
  "leaker",
  "leap",
  "learning",
  "leash",
  "leather",
  "leave",
  "leaver",
  "lecture",
  "leek",
  "leeway",
  "left",
  "leg",
  "legacy",
  "legal",
  "legend",
  "legging",
  "legislation",
  "legislator",
  "legislature",
  "legitimacy",
  "legume",
  "leisure",
  "lemon",
  "lemonade",
  "lemur",
  "lender",
  "lending",
  "length",
  "lens",
  "lentil",
  "leopard",
  "leprosy",
  "leptocephalus",
  "lesbian",
  "lesson",
  "letter",
  "lettuce",
  "level",
  "lever",
  "leverage",
  "leveret",
  "liability",
  "liar",
  "liberty",
  "libido",
  "library",
  "licence",
  "license",
  "licensing",
  "licorice",
  "lid",
  "lie",
  "lieu",
  "lieutenant",
  "life",
  "lifestyle",
  "lifetime",
  "lift",
  "ligand",
  "light",
  "lighting",
  "lightning",
  "lightscreen",
  "ligula",
  "likelihood",
  "likeness",
  "lilac",
  "lily",
  "limb",
  "lime",
  "limestone",
  "limit",
  "limitation",
  "limo",
  "line",
  "linen",
  "liner",
  "linguist",
  "linguistics",
  "lining",
  "link",
  "linkage",
  "linseed",
  "lion",
  "lip",
  "lipid",
  "lipoprotein",
  "lipstick",
  "liquid",
  "liquidity",
  "liquor",
  "list",
  "listening",
  "listing",
  "literate",
  "literature",
  "litigation",
  "litmus",
  "litter",
  "littleneck",
  "liver",
  "livestock",
  "living",
  "lizard",
  "llama",
  "load",
  "loading",
  "loaf",
  "loafer",
  "loan",
  "lobby",
  "lobotomy",
  "lobster",
  "local",
  "locality",
  "location",
  "lock",
  "locker",
  "locket",
  "locomotive",
  "locust",
  "lode",
  "loft",
  "log",
  "loggia",
  "logic",
  "login",
  "logistics",
  "logo",
  "loincloth",
  "lollipop",
  "loneliness",
  "longboat",
  "longitude",
  "look",
  "lookout",
  "loop",
  "loophole",
  "loquat",
  "lord",
  "loss",
  "lot",
  "lotion",
  "lottery",
  "lounge",
  "louse",
  "lout",
  "love",
  "lover",
  "lox",
  "loyalty",
  "luck",
  "luggage",
  "lumber",
  "lumberman",
  "lunch",
  "luncheonette",
  "lunchmeat",
  "lunchroom",
  "lung",
  "lunge",
  "lust",
  "lute",
  "luxury",
  "lychee",
  "lycra",
  "lye",
  "lymphocyte",
  "lynx",
  "lyocell",
  "lyre",
  "lyrics",
  "lysine",
  "mRNA",
  "macadamia",
  "macaroni",
  "macaroon",
  "macaw",
  "machine",
  "machinery",
  "macrame",
  "macro",
  "macrofauna",
  "madam",
  "maelstrom",
  "maestro",
  "magazine",
  "maggot",
  "magic",
  "magnet",
  "magnitude",
  "maid",
  "maiden",
  "mail",
  "mailbox",
  "mailer",
  "mailing",
  "mailman",
  "main",
  "mainland",
  "mainstream",
  "maintainer",
  "maintenance",
  "maize",
  "major",
  "major-league",
  "majority",
  "makeover",
  "maker",
  "makeup",
  "making",
  "male",
  "malice",
  "mall",
  "mallard",
  "mallet",
  "malnutrition",
  "mama",
  "mambo",
  "mammoth",
  "man",
  "manacle",
  "management",
  "manager",
  "manatee",
  "mandarin",
  "mandate",
  "mandolin",
  "mangle",
  "mango",
  "mangrove",
  "manhunt",
  "maniac",
  "manicure",
  "manifestation",
  "manipulation",
  "mankind",
  "manner",
  "manor",
  "mansard",
  "manservant",
  "mansion",
  "mantel",
  "mantle",
  "mantua",
  "manufacturer",
  "manufacturing",
  "many",
  "map",
  "maple",
  "mapping",
  "maracas",
  "marathon",
  "marble",
  "march",
  "mare",
  "margarine",
  "margin",
  "mariachi",
  "marimba",
  "marines",
  "marionberry",
  "mark",
  "marker",
  "market",
  "marketer",
  "marketing",
  "marketplace",
  "marksman",
  "markup",
  "marmalade",
  "marriage",
  "marsh",
  "marshland",
  "marshmallow",
  "marten",
  "marxism",
  "mascara",
  "mask",
  "masonry",
  "mass",
  "massage",
  "mast",
  "master",
  "masterpiece",
  "mastication",
  "mastoid",
  "mat",
  "match",
  "matchmaker",
  "mate",
  "material",
  "maternity",
  "math",
  "mathematics",
  "matrix",
  "matter",
  "mattock",
  "mattress",
  "max",
  "maximum",
  "maybe",
  "mayonnaise",
  "mayor",
  "meadow",
  "meal",
  "mean",
  "meander",
  "meaning",
  "means",
  "meantime",
  "measles",
  "measure",
  "measurement",
  "meat",
  "meatball",
  "meatloaf",
  "mecca",
  "mechanic",
  "mechanism",
  "med",
  "medal",
  "media",
  "median",
  "medication",
  "medicine",
  "medium",
  "meet",
  "meeting",
  "melatonin",
  "melody",
  "melon",
  "member",
  "membership",
  "membrane",
  "meme",
  "memo",
  "memorial",
  "memory",
  "men",
  "menopause",
  "menorah",
  "mention",
  "mentor",
  "menu",
  "merchandise",
  "merchant",
  "mercury",
  "meridian",
  "meringue",
  "merit",
  "mesenchyme",
  "mess",
  "message",
  "messenger",
  "messy",
  "metabolite",
  "metal",
  "metallurgist",
  "metaphor",
  "meteor",
  "meteorology",
  "meter",
  "methane",
  "method",
  "methodology",
  "metric",
  "metro",
  "metronome",
  "mezzanine",
  "microlending",
  "micronutrient",
  "microphone",
  "microwave",
  "mid-course",
  "midden",
  "middle",
  "middleman",
  "midline",
  "midnight",
  "midwife",
  "might",
  "migrant",
  "migration",
  "mile",
  "mileage",
  "milepost",
  "milestone",
  "military",
  "milk",
  "milkshake",
  "mill",
  "millennium",
  "millet",
  "millimeter",
  "million",
  "millisecond",
  "millstone",
  "mime",
  "mimosa",
  "min",
  "mincemeat",
  "mind",
  "mine",
  "mineral",
  "mineshaft",
  "mini",
  "mini-skirt",
  "minibus",
  "minimalism",
  "minimum",
  "mining",
  "minion",
  "minister",
  "mink",
  "minnow",
  "minor",
  "minor-league",
  "minority",
  "mint",
  "minute",
  "miracle",
  "mirror",
  "miscarriage",
  "miscommunication",
  "misfit",
  "misnomer",
  "misogyny",
  "misplacement",
  "misreading",
  "misrepresentation",
  "miss",
  "missile",
  "mission",
  "missionary",
  "mist",
  "mistake",
  "mister",
  "misunderstand",
  "miter",
  "mitten",
  "mix",
  "mixer",
  "mixture",
  "moai",
  "moat",
  "mob",
  "mobile",
  "mobility",
  "mobster",
  "moccasins",
  "mocha",
  "mochi",
  "mode",
  "model",
  "modeling",
  "modem",
  "modernist",
  "modernity",
  "modification",
  "molar",
  "molasses",
  "molding",
  "mole",
  "molecule",
  "mom",
  "moment",
  "monastery",
  "monasticism",
  "money",
  "monger",
  "monitor",
  "monitoring",
  "monk",
  "monkey",
  "monocle",
  "monopoly",
  "monotheism",
  "monsoon",
  "monster",
  "month",
  "monument",
  "mood",
  "moody",
  "moon",
  "moonlight",
  "moonscape",
  "moonshine",
  "moose",
  "mop",
  "morale",
  "morbid",
  "morbidity",
  "morning",
  "moron",
  "morphology",
  "morsel",
  "mortal",
  "mortality",
  "mortgage",
  "mortise",
  "mosque",
  "mosquito",
  "most",
  "motel",
  "moth",
  "mother",
  "mother-in-law",
  "motion",
  "motivation",
  "motive",
  "motor",
  "motorboat",
  "motorcar",
  "motorcycle",
  "mound",
  "mountain",
  "mouse",
  "mouser",
  "mousse",
  "moustache",
  "mouth",
  "mouton",
  "movement",
  "mover",
  "movie",
  "mower",
  "mozzarella",
  "mud",
  "muffin",
  "mug",
  "mukluk",
  "mule",
  "multimedia",
  "murder",
  "muscat",
  "muscatel",
  "muscle",
  "musculature",
  "museum",
  "mushroom",
  "music",
  "music-box",
  "music-making",
  "musician",
  "muskrat",
  "mussel",
  "mustache",
  "mustard",
  "mutation",
  "mutt",
  "mutton",
  "mycoplasma",
  "mystery",
  "myth",
  "mythology",
  "nail",
  "name",
  "naming",
  "nanoparticle",
  "napkin",
  "narrative",
  "nasal",
  "nation",
  "nationality",
  "native",
  "naturalisation",
  "nature",
  "navigation",
  "necessity",
  "neck",
  "necklace",
  "necktie",
  "nectar",
  "nectarine",
  "need",
  "needle",
  "neglect",
  "negligee",
  "negotiation",
  "neighbor",
  "neighborhood",
  "neighbour",
  "neighbourhood",
  "neologism",
  "neon",
  "neonate",
  "nephew",
  "nerve",
  "nest",
  "nestling",
  "nestmate",
  "net",
  "netball",
  "netbook",
  "netsuke",
  "network",
  "networking",
  "neurobiologist",
  "neuron",
  "neuropathologist",
  "neuropsychiatry",
  "news",
  "newsletter",
  "newspaper",
  "newsprint",
  "newsstand",
  "nexus",
  "nibble",
  "nicety",
  "niche",
  "nick",
  "nickel",
  "nickname",
  "niece",
  "night",
  "nightclub",
  "nightgown",
  "nightingale",
  "nightlife",
  "nightlight",
  "nightmare",
  "ninja",
  "nit",
  "nitrogen",
  "nobody",
  "nod",
  "node",
  "noir",
  "noise",
  "nonbeliever",
  "nonconformist",
  "nondisclosure",
  "nonsense",
  "noodle",
  "noodles",
  "noon",
  "norm",
  "normal",
  "normalisation",
  "normalization",
  "north",
  "nose",
  "notation",
  "note",
  "notebook",
  "notepad",
  "nothing",
  "notice",
  "notion",
  "notoriety",
  "nougat",
  "noun",
  "nourishment",
  "novel",
  "nucleotidase",
  "nucleotide",
  "nudge",
  "nuke",
  "number",
  "numeracy",
  "numeric",
  "numismatist",
  "nun",
  "nurse",
  "nursery",
  "nursing",
  "nurture",
  "nut",
  "nutmeg",
  "nutrient",
  "nutrition",
  "nylon",
  "nymph",
  "oak",
  "oar",
  "oasis",
  "oat",
  "oatmeal",
  "oats",
  "obedience",
  "obesity",
  "obi",
  "object",
  "objection",
  "objective",
  "obligation",
  "oboe",
  "observation",
  "observatory",
  "obsession",
  "obsidian",
  "obstacle",
  "occasion",
  "occupation",
  "occurrence",
  "ocean",
  "ocelot",
  "octagon",
  "octave",
  "octavo",
  "octet",
  "octopus",
  "odometer",
  "odyssey",
  "oeuvre",
  "off-ramp",
  "offence",
  "offense",
  "offer",
  "offering",
  "office",
  "officer",
  "official",
  "offset",
  "oil",
  "okra",
  "oldie",
  "oleo",
  "olive",
  "omega",
  "omelet",
  "omission",
  "omnivore",
  "oncology",
  "onion",
  "online",
  "onset",
  "opening",
  "opera",
  "operating",
  "operation",
  "operator",
  "ophthalmologist",
  "opinion",
  "opium",
  "opossum",
  "opponent",
  "opportunist",
  "opportunity",
  "opposite",
  "opposition",
  "optimal",
  "optimisation",
  "optimist",
  "optimization",
  "option",
  "orange",
  "orangutan",
  "orator",
  "orchard",
  "orchestra",
  "orchid",
  "order",
  "ordinary",
  "ordination",
  "ore",
  "oregano",
  "organ",
  "organisation",
  "organising",
  "organization",
  "organizing",
  "orient",
  "orientation",
  "origin",
  "original",
  "originality",
  "ornament",
  "osmosis",
  "osprey",
  "ostrich",
  "other",
  "otter",
  "ottoman",
  "ounce",
  "outback",
  "outcome",
  "outfielder",
  "outfit",
  "outhouse",
  "outlaw",
  "outlay",
  "outlet",
  "outline",
  "outlook",
  "output",
  "outrage",
  "outrigger",
  "outrun",
  "outset",
  "outside",
  "oval",
  "ovary",
  "oven",
  "overcharge",
  "overclocking",
  "overcoat",
  "overexertion",
  "overflight",
  "overhead",
  "overheard",
  "overload",
  "overnighter",
  "overshoot",
  "oversight",
  "overview",
  "overweight",
  "owl",
  "owner",
  "ownership",
  "ox",
  "oxford",
  "oxygen",
  "oyster",
  "ozone",
  "pace",
  "pacemaker",
  "pack",
  "package",
  "packaging",
  "packet",
  "pad",
  "paddle",
  "paddock",
  "pagan",
  "page",
  "pagoda",
  "pail",
  "pain",
  "paint",
  "painter",
  "painting",
  "paintwork",
  "pair",
  "pajamas",
  "palace",
  "palate",
  "palm",
  "pamphlet",
  "pan",
  "pancake",
  "pancreas",
  "panda",
  "panel",
  "panic",
  "pannier",
  "panpipe",
  "pansy",
  "panther",
  "panties",
  "pantologist",
  "pantology",
  "pantry",
  "pants",
  "pantsuit",
  "panty",
  "pantyhose",
  "papa",
  "papaya",
  "paper",
  "paperback",
  "paperwork",
  "parable",
  "parachute",
  "parade",
  "paradise",
  "paragraph",
  "parallelogram",
  "paramecium",
  "paramedic",
  "parameter",
  "paranoia",
  "parcel",
  "parchment",
  "pard",
  "pardon",
  "parent",
  "parenthesis",
  "parenting",
  "park",
  "parka",
  "parking",
  "parliament",
  "parole",
  "parrot",
  "parser",
  "parsley",
  "parsnip",
  "part",
  "participant",
  "participation",
  "particle",
  "particular",
  "partner",
  "partnership",
  "partridge",
  "party",
  "pass",
  "passage",
  "passbook",
  "passenger",
  "passing",
  "passion",
  "passive",
  "passport",
  "password",
  "past",
  "pasta",
  "paste",
  "pastor",
  "pastoralist",
  "pastry",
  "pasture",
  "pat",
  "patch",
  "pate",
  "patent",
  "patentee",
  "path",
  "pathogenesis",
  "pathology",
  "pathway",
  "patience",
  "patient",
  "patina",
  "patio",
  "patriarch",
  "patrimony",
  "patriot",
  "patrol",
  "patroller",
  "patrolling",
  "patron",
  "pattern",
  "patty",
  "pattypan",
  "pause",
  "pavement",
  "pavilion",
  "paw",
  "pawnshop",
  "pay",
  "payee",
  "payment",
  "payoff",
  "pea",
  "peace",
  "peach",
  "peacoat",
  "peacock",
  "peak",
  "peanut",
  "pear",
  "pearl",
  "peasant",
  "pecan",
  "pecker",
  "pedal",
  "peek",
  "peen",
  "peer",
  "peer-to-peer",
  "pegboard",
  "pelican",
  "pelt",
  "pen",
  "penalty",
  "pence",
  "pencil",
  "pendant",
  "pendulum",
  "penguin",
  "penicillin",
  "peninsula",
  "penis",
  "pennant",
  "penny",
  "pension",
  "pentagon",
  "peony",
  "people",
  "pepper",
  "pepperoni",
  "percent",
  "percentage",
  "perception",
  "perch",
  "perennial",
  "perfection",
  "performance",
  "perfume",
  "period",
  "periodical",
  "peripheral",
  "permafrost",
  "permission",
  "permit",
  "perp",
  "perpendicular",
  "persimmon",
  "person",
  "personal",
  "personality",
  "personnel",
  "perspective",
  "pest",
  "pet",
  "petal",
  "petition",
  "petitioner",
  "petticoat",
  "pew",
  "pharmacist",
  "pharmacopoeia",
  "phase",
  "pheasant",
  "phenomenon",
  "phenotype",
  "pheromone",
  "philanthropy",
  "philosopher",
  "philosophy",
  "phone",
  "phosphate",
  "photo",
  "photodiode",
  "photograph",
  "photographer",
  "photography",
  "photoreceptor",
  "phrase",
  "phrasing",
  "physical",
  "physics",
  "physiology",
  "pianist",
  "piano",
  "piccolo",
  "pick",
  "pickax",
  "pickaxe",
  "picket",
  "pickle",
  "pickup",
  "picnic",
  "picture",
  "picturesque",
  "pie",
  "piece",
  "pier",
  "piety",
  "pig",
  "pigeon",
  "piglet",
  "pigpen",
  "pigsty",
  "pike",
  "pilaf",
  "pile",
  "pilgrim",
  "pilgrimage",
  "pill",
  "pillar",
  "pillbox",
  "pillow",
  "pilot",
  "pimp",
  "pimple",
  "pin",
  "pinafore",
  "pince-nez",
  "pine",
  "pineapple",
  "pinecone",
  "ping",
  "pink",
  "pinkie",
  "pinot",
  "pinstripe",
  "pint",
  "pinto",
  "pinworm",
  "pioneer",
  "pipe",
  "pipeline",
  "piracy",
  "pirate",
  "piss",
  "pistol",
  "pit",
  "pita",
  "pitch",
  "pitcher",
  "pitching",
  "pith",
  "pizza",
  "place",
  "placebo",
  "placement",
  "placode",
  "plagiarism",
  "plain",
  "plaintiff",
  "plan",
  "plane",
  "planet",
  "planning",
  "plant",
  "plantation",
  "planter",
  "planula",
  "plaster",
  "plasterboard",
  "plastic",
  "plate",
  "platelet",
  "platform",
  "platinum",
  "platter",
  "platypus",
  "play",
  "player",
  "playground",
  "playroom",
  "playwright",
  "plea",
  "pleasure",
  "pleat",
  "pledge",
  "plenty",
  "plier",
  "pliers",
  "plight",
  "plot",
  "plough",
  "plover",
  "plow",
  "plowman",
  "plug",
  "plugin",
  "plum",
  "plumber",
  "plume",
  "plunger",
  "plywood",
  "pneumonia",
  "pocket",
  "pocket-watch",
  "pocketbook",
  "pod",
  "podcast",
  "poem",
  "poet",
  "poetry",
  "poignance",
  "point",
  "poison",
  "poisoning",
  "poker",
  "polarisation",
  "polarization",
  "pole",
  "polenta",
  "police",
  "policeman",
  "policy",
  "polish",
  "politician",
  "politics",
  "poll",
  "polliwog",
  "pollutant",
  "pollution",
  "polo",
  "polyester",
  "polyp",
  "pomegranate",
  "pomelo",
  "pompom",
  "poncho",
  "pond",
  "pony",
  "pool",
  "poor",
  "pop",
  "popcorn",
  "poppy",
  "popsicle",
  "popularity",
  "population",
  "populist",
  "porcelain",
  "porch",
  "porcupine",
  "pork",
  "porpoise",
  "port",
  "porter",
  "portfolio",
  "porthole",
  "portion",
  "portrait",
  "position",
  "possession",
  "possibility",
  "possible",
  "post",
  "postage",
  "postbox",
  "poster",
  "posterior",
  "postfix",
  "pot",
  "potato",
  "potential",
  "pottery",
  "potty",
  "pouch",
  "poultry",
  "pound",
  "pounding",
  "poverty",
  "powder",
  "power",
  "practice",
  "practitioner",
  "prairie",
  "praise",
  "pray",
  "prayer",
  "precedence",
  "precedent",
  "precipitation",
  "precision",
  "predecessor",
  "preface",
  "preference",
  "prefix",
  "pregnancy",
  "prejudice",
  "prelude",
  "premeditation",
  "premier",
  "premise",
  "premium",
  "preoccupation",
  "preparation",
  "prescription",
  "presence",
  "present",
  "presentation",
  "preservation",
  "preserves",
  "presidency",
  "president",
  "press",
  "pressroom",
  "pressure",
  "pressurisation",
  "pressurization",
  "prestige",
  "presume",
  "pretzel",
  "prevalence",
  "prevention",
  "prey",
  "price",
  "pricing",
  "pride",
  "priest",
  "priesthood",
  "primary",
  "primate",
  "prince",
  "princess",
  "principal",
  "principle",
  "print",
  "printer",
  "printing",
  "prior",
  "priority",
  "prison",
  "prisoner",
  "privacy",
  "private",
  "privilege",
  "prize",
  "prizefight",
  "probability",
  "probation",
  "probe",
  "problem",
  "procedure",
  "proceedings",
  "process",
  "processing",
  "processor",
  "proctor",
  "procurement",
  "produce",
  "producer",
  "product",
  "production",
  "productivity",
  "profession",
  "professional",
  "professor",
  "profile",
  "profit",
  "progenitor",
  "program",
  "programme",
  "programming",
  "progress",
  "progression",
  "prohibition",
  "project",
  "proliferation",
  "promenade",
  "promise",
  "promotion",
  "prompt",
  "pronoun",
  "pronunciation",
  "proof",
  "proof-reader",
  "propaganda",
  "propane",
  "property",
  "prophet",
  "proponent",
  "proportion",
  "proposal",
  "proposition",
  "proprietor",
  "prose",
  "prosecution",
  "prosecutor",
  "prospect",
  "prosperity",
  "prostacyclin",
  "prostanoid",
  "prostrate",
  "protection",
  "protein",
  "protest",
  "protocol",
  "providence",
  "provider",
  "province",
  "provision",
  "prow",
  "proximal",
  "proximity",
  "prune",
  "pruner",
  "pseudocode",
  "pseudoscience",
  "psychiatrist",
  "psychoanalyst",
  "psychologist",
  "psychology",
  "ptarmigan",
  "pub",
  "public",
  "publication",
  "publicity",
  "publisher",
  "publishing",
  "pudding",
  "puddle",
  "puffin",
  "pug",
  "puggle",
  "pulley",
  "pulse",
  "puma",
  "pump",
  "pumpernickel",
  "pumpkin",
  "pumpkinseed",
  "pun",
  "punch",
  "punctuation",
  "punishment",
  "pup",
  "pupa",
  "pupil",
  "puppet",
  "puppy",
  "purchase",
  "puritan",
  "purity",
  "purple",
  "purpose",
  "purr",
  "purse",
  "pursuit",
  "push",
  "pusher",
  "put",
  "puzzle",
  "pyramid",
  "pyridine",
  "quadrant",
  "quail",
  "qualification",
  "quality",
  "quantity",
  "quart",
  "quarter",
  "quartet",
  "quartz",
  "queen",
  "query",
  "quest",
  "question",
  "questioner",
  "questionnaire",
  "quiche",
  "quicksand",
  "quiet",
  "quill",
  "quilt",
  "quince",
  "quinoa",
  "quit",
  "quiver",
  "quota",
  "quotation",
  "quote",
  "rabbi",
  "rabbit",
  "raccoon",
  "race",
  "racer",
  "racing",
  "racism",
  "racist",
  "rack",
  "radar",
  "radiator",
  "radio",
  "radiosonde",
  "radish",
  "raffle",
  "raft",
  "rag",
  "rage",
  "raid",
  "rail",
  "railing",
  "railroad",
  "railway",
  "raiment",
  "rain",
  "rainbow",
  "raincoat",
  "rainmaker",
  "rainstorm",
  "rainy",
  "raise",
  "raisin",
  "rake",
  "rally",
  "ram",
  "rambler",
  "ramen",
  "ramie",
  "ranch",
  "rancher",
  "randomisation",
  "randomization",
  "range",
  "ranger",
  "rank",
  "rap",
  "rape",
  "raspberry",
  "rat",
  "rate",
  "ratepayer",
  "rating",
  "ratio",
  "rationale",
  "rations",
  "raven",
  "ravioli",
  "rawhide",
  "ray",
  "rayon",
  "razor",
  "reach",
  "reactant",
  "reaction",
  "read",
  "reader",
  "readiness",
  "reading",
  "real",
  "reality",
  "realization",
  "realm",
  "reamer",
  "rear",
  "reason",
  "reasoning",
  "rebel",
  "rebellion",
  "reboot",
  "recall",
  "recapitulation",
  "receipt",
  "receiver",
  "reception",
  "receptor",
  "recess",
  "recession",
  "recipe",
  "recipient",
  "reciprocity",
  "reclamation",
  "recliner",
  "recognition",
  "recollection",
  "recommendation",
  "reconsideration",
  "record",
  "recorder",
  "recording",
  "recovery",
  "recreation",
  "recruit",
  "rectangle",
  "red",
  "redesign",
  "redhead",
  "redirect",
  "rediscovery",
  "reduction",
  "reef",
  "refectory",
  "reference",
  "referendum",
  "reflection",
  "reform",
  "refreshments",
  "refrigerator",
  "refuge",
  "refund",
  "refusal",
  "refuse",
  "regard",
  "regime",
  "region",
  "regionalism",
  "register",
  "registration",
  "registry",
  "regret",
  "regulation",
  "regulator",
  "rehospitalisation",
  "rehospitalization",
  "reindeer",
  "reinscription",
  "reject",
  "relation",
  "relationship",
  "relative",
  "relaxation",
  "relay",
  "release",
  "reliability",
  "relief",
  "religion",
  "relish",
  "reluctance",
  "remains",
  "remark",
  "reminder",
  "remnant",
  "remote",
  "removal",
  "renaissance",
  "rent",
  "reorganisation",
  "reorganization",
  "repair",
  "reparation",
  "repayment",
  "repeat",
  "replacement",
  "replica",
  "replication",
  "reply",
  "report",
  "reporter",
  "reporting",
  "repository",
  "representation",
  "representative",
  "reprocessing",
  "republic",
  "republican",
  "reputation",
  "request",
  "requirement",
  "resale",
  "rescue",
  "research",
  "researcher",
  "resemblance",
  "reservation",
  "reserve",
  "reservoir",
  "reset",
  "residence",
  "resident",
  "residue",
  "resist",
  "resistance",
  "resolution",
  "resolve",
  "resort",
  "resource",
  "respect",
  "respite",
  "response",
  "responsibility",
  "rest",
  "restaurant",
  "restoration",
  "restriction",
  "restroom",
  "restructuring",
  "result",
  "resume",
  "retailer",
  "retention",
  "rethinking",
  "retina",
  "retirement",
  "retouching",
  "retreat",
  "retrospect",
  "retrospective",
  "retrospectivity",
  "return",
  "reunion",
  "revascularisation",
  "revascularization",
  "reveal",
  "revelation",
  "revenant",
  "revenge",
  "revenue",
  "reversal",
  "reverse",
  "review",
  "revitalisation",
  "revitalization",
  "revival",
  "revolution",
  "revolver",
  "reward",
  "rhetoric",
  "rheumatism",
  "rhinoceros",
  "rhubarb",
  "rhyme",
  "rhythm",
  "rib",
  "ribbon",
  "rice",
  "riddle",
  "ride",
  "rider",
  "ridge",
  "riding",
  "rifle",
  "right",
  "rim",
  "ring",
  "ringworm",
  "riot",
  "rip",
  "ripple",
  "rise",
  "riser",
  "risk",
  "rite",
  "ritual",
  "river",
  "riverbed",
  "rivulet",
  "road",
  "roadway",
  "roar",
  "roast",
  "robe",
  "robin",
  "robot",
  "robotics",
  "rock",
  "rocker",
  "rocket",
  "rocket-ship",
  "rod",
  "role",
  "roll",
  "roller",
  "romaine",
  "romance",
  "roof",
  "room",
  "roommate",
  "rooster",
  "root",
  "rope",
  "rose",
  "rosemary",
  "roster",
  "rostrum",
  "rotation",
  "round",
  "roundabout",
  "route",
  "router",
  "routine",
  "row",
  "rowboat",
  "rowing",
  "rubber",
  "rubbish",
  "rubric",
  "ruby",
  "ruckus",
  "rudiment",
  "ruffle",
  "rug",
  "rugby",
  "ruin",
  "rule",
  "ruler",
  "ruling",
  "rum",
  "rumor",
  "run",
  "runaway",
  "runner",
  "running",
  "runway",
  "rush",
  "rust",
  "rutabaga",
  "rye",
  "sabre",
  "sac",
  "sack",
  "saddle",
  "sadness",
  "safari",
  "safe",
  "safeguard",
  "safety",
  "saffron",
  "sage",
  "sail",
  "sailboat",
  "sailing",
  "sailor",
  "saint",
  "sake",
  "salad",
  "salami",
  "salary",
  "sale",
  "salesman",
  "salmon",
  "salon",
  "saloon",
  "salsa",
  "salt",
  "salute",
  "samovar",
  "sampan",
  "sample",
  "samurai",
  "sanction",
  "sanctity",
  "sanctuary",
  "sand",
  "sandal",
  "sandbar",
  "sandpaper",
  "sandwich",
  "sanity",
  "sardine",
  "sari",
  "sarong",
  "sash",
  "satellite",
  "satin",
  "satire",
  "satisfaction",
  "sauce",
  "saucer",
  "sauerkraut",
  "sausage",
  "savage",
  "savannah",
  "saving",
  "savings",
  "savior",
  "saviour",
  "savory",
  "saw",
  "saxophone",
  "scaffold",
  "scale",
  "scallion",
  "scallops",
  "scalp",
  "scam",
  "scanner",
  "scarecrow",
  "scarf",
  "scarification",
  "scenario",
  "scene",
  "scenery",
  "scent",
  "schedule",
  "scheduling",
  "schema",
  "scheme",
  "schizophrenic",
  "schnitzel",
  "scholar",
  "scholarship",
  "school",
  "schoolhouse",
  "schooner",
  "science",
  "scientist",
  "scimitar",
  "scissors",
  "scooter",
  "scope",
  "score",
  "scorn",
  "scorpion",
  "scotch",
  "scout",
  "scow",
  "scrambled",
  "scrap",
  "scraper",
  "scratch",
  "screamer",
  "screen",
  "screening",
  "screenwriting",
  "screw",
  "screw-up",
  "screwdriver",
  "scrim",
  "scrip",
  "script",
  "scripture",
  "scrutiny",
  "sculpting",
  "sculptural",
  "sculpture",
  "sea",
  "seabass",
  "seafood",
  "seagull",
  "seal",
  "seaplane",
  "search",
  "seashore",
  "seaside",
  "season",
  "seat",
  "seaweed",
  "second",
  "secrecy",
  "secret",
  "secretariat",
  "secretary",
  "secretion",
  "section",
  "sectional",
  "sector",
  "security",
  "sediment",
  "seed",
  "seeder",
  "seeker",
  "seep",
  "segment",
  "seizure",
  "selection",
  "self",
  "self-confidence",
  "self-control",
  "self-esteem",
  "seller",
  "selling",
  "semantics",
  "semester",
  "semicircle",
  "semicolon",
  "semiconductor",
  "seminar",
  "senate",
  "senator",
  "sender",
  "senior",
  "sense",
  "sensibility",
  "sensitive",
  "sensitivity",
  "sensor",
  "sentence",
  "sentencing",
  "sentiment",
  "sepal",
  "separation",
  "septicaemia",
  "sequel",
  "sequence",
  "serial",
  "series",
  "sermon",
  "serum",
  "serval",
  "servant",
  "server",
  "service",
  "servitude",
  "sesame",
  "session",
  "set",
  "setback",
  "setting",
  "settlement",
  "settler",
  "severity",
  "sewer",
  "sex",
  "sexuality",
  "shack",
  "shackle",
  "shade",
  "shadow",
  "shadowbox",
  "shakedown",
  "shaker",
  "shallot",
  "shallows",
  "shame",
  "shampoo",
  "shanty",
  "shape",
  "share",
  "shareholder",
  "shark",
  "shaw",
  "shawl",
  "shear",
  "shearling",
  "sheath",
  "shed",
  "sheep",
  "sheet",
  "shelf",
  "shell",
  "shelter",
  "sherbet",
  "sherry",
  "shield",
  "shift",
  "shin",
  "shine",
  "shingle",
  "ship",
  "shipper",
  "shipping",
  "shipyard",
  "shirt",
  "shirtdress",
  "shit",
  "shoat",
  "shock",
  "shoe",
  "shoe-horn",
  "shoehorn",
  "shoelace",
  "shoemaker",
  "shoes",
  "shoestring",
  "shofar",
  "shoot",
  "shootdown",
  "shop",
  "shopper",
  "shopping",
  "shore",
  "shoreline",
  "short",
  "shortage",
  "shorts",
  "shortwave",
  "shot",
  "shoulder",
  "shout",
  "shovel",
  "show",
  "show-stopper",
  "shower",
  "shred",
  "shrimp",
  "shrine",
  "shutdown",
  "sibling",
  "sick",
  "sickness",
  "side",
  "sideboard",
  "sideburns",
  "sidecar",
  "sidestream",
  "sidewalk",
  "siding",
  "siege",
  "sigh",
  "sight",
  "sightseeing",
  "sign",
  "signal",
  "signature",
  "signet",
  "significance",
  "signify",
  "signup",
  "silence",
  "silica",
  "silicon",
  "silk",
  "silkworm",
  "sill",
  "silly",
  "silo",
  "silver",
  "similarity",
  "simple",
  "simplicity",
  "simplification",
  "simvastatin",
  "sin",
  "singer",
  "singing",
  "singular",
  "sink",
  "sinuosity",
  "sip",
  "sir",
  "sister",
  "sister-in-law",
  "sitar",
  "site",
  "situation",
  "size",
  "skate",
  "skating",
  "skean",
  "skeleton",
  "ski",
  "skiing",
  "skill",
  "skin",
  "skirt",
  "skull",
  "skullcap",
  "skullduggery",
  "skunk",
  "sky",
  "skylight",
  "skyline",
  "skyscraper",
  "skywalk",
  "slang",
  "slapstick",
  "slash",
  "slate",
  "slave",
  "slavery",
  "slaw",
  "sled",
  "sledge",
  "sleep",
  "sleepiness",
  "sleeping",
  "sleet",
  "sleuth",
  "slice",
  "slide",
  "slider",
  "slime",
  "slip",
  "slipper",
  "slippers",
  "slope",
  "slot",
  "sloth",
  "slump",
  "smell",
  "smelting",
  "smile",
  "smith",
  "smock",
  "smog",
  "smoke",
  "smoking",
  "smolt",
  "smuggling",
  "snack",
  "snail",
  "snake",
  "snakebite",
  "snap",
  "snarl",
  "sneaker",
  "sneakers",
  "sneeze",
  "sniffle",
  "snob",
  "snorer",
  "snow",
  "snowboarding",
  "snowflake",
  "snowman",
  "snowmobiling",
  "snowplow",
  "snowstorm",
  "snowsuit",
  "snuck",
  "snug",
  "snuggle",
  "soap",
  "soccer",
  "socialism",
  "socialist",
  "society",
  "sociology",
  "sock",
  "socks",
  "soda",
  "sofa",
  "softball",
  "softdrink",
  "softening",
  "software",
  "soil",
  "soldier",
  "sole",
  "solicitation",
  "solicitor",
  "solidarity",
  "solidity",
  "soliloquy",
  "solitaire",
  "solution",
  "solvency",
  "sombrero",
  "somebody",
  "someone",
  "someplace",
  "somersault",
  "something",
  "somewhere",
  "son",
  "sonar",
  "sonata",
  "song",
  "songbird",
  "sonnet",
  "soot",
  "sophomore",
  "soprano",
  "sorbet",
  "sorghum",
  "sorrel",
  "sorrow",
  "sort",
  "soul",
  "soulmate",
  "sound",
  "soundness",
  "soup",
  "source",
  "sourwood",
  "sousaphone",
  "south",
  "southeast",
  "souvenir",
  "sovereignty",
  "sow",
  "soy",
  "soybean",
  "space",
  "spacing",
  "spade",
  "spaghetti",
  "span",
  "spandex",
  "spank",
  "sparerib",
  "spark",
  "sparrow",
  "spasm",
  "spat",
  "spatula",
  "spawn",
  "speaker",
  "speakerphone",
  "speaking",
  "spear",
  "spec",
  "special",
  "specialist",
  "specialty",
  "species",
  "specification",
  "spectacle",
  "spectacles",
  "spectrograph",
  "spectrum",
  "speculation",
  "speech",
  "speed",
  "speedboat",
  "spell",
  "spelling",
  "spelt",
  "spending",
  "sphere",
  "sphynx",
  "spice",
  "spider",
  "spiderling",
  "spike",
  "spill",
  "spinach",
  "spine",
  "spiral",
  "spirit",
  "spiritual",
  "spirituality",
  "spit",
  "spite",
  "spleen",
  "splendor",
  "split",
  "spokesman",
  "spokeswoman",
  "sponge",
  "sponsor",
  "sponsorship",
  "spool",
  "spoon",
  "spork",
  "sport",
  "sportsman",
  "spot",
  "spotlight",
  "spouse",
  "sprag",
  "sprat",
  "spray",
  "spread",
  "spreadsheet",
  "spree",
  "spring",
  "sprinkles",
  "sprinter",
  "sprout",
  "spruce",
  "spud",
  "spume",
  "spur",
  "spy",
  "spyglass",
  "square",
  "squash",
  "squatter",
  "squeegee",
  "squid",
  "squirrel",
  "stab",
  "stability",
  "stable",
  "stack",
  "stacking",
  "stadium",
  "staff",
  "stag",
  "stage",
  "stain",
  "stair",
  "staircase",
  "stake",
  "stalk",
  "stall",
  "stallion",
  "stamen",
  "stamina",
  "stamp",
  "stance",
  "stand",
  "standard",
  "standardisation",
  "standardization",
  "standing",
  "standoff",
  "standpoint",
  "star",
  "starboard",
  "start",
  "starter",
  "state",
  "statement",
  "statin",
  "station",
  "station-wagon",
  "statistic",
  "statistics",
  "statue",
  "status",
  "statute",
  "stay",
  "steak",
  "stealth",
  "steam",
  "steamroller",
  "steel",
  "steeple",
  "stem",
  "stench",
  "stencil",
  "step",
  "step-aunt",
  "step-brother",
  "step-daughter",
  "step-father",
  "step-grandfather",
  "step-grandmother",
  "step-mother",
  "step-sister",
  "step-son",
  "step-uncle",
  "stepdaughter",
  "stepmother",
  "stepping-stone",
  "stepson",
  "stereo",
  "stew",
  "steward",
  "stick",
  "sticker",
  "stiletto",
  "still",
  "stimulation",
  "stimulus",
  "sting",
  "stinger",
  "stir-fry",
  "stitch",
  "stitcher",
  "stock",
  "stock-in-trade",
  "stockings",
  "stole",
  "stomach",
  "stone",
  "stonework",
  "stool",
  "stop",
  "stopsign",
  "stopwatch",
  "storage",
  "store",
  "storey",
  "storm",
  "story",
  "story-telling",
  "storyboard",
  "stot",
  "stove",
  "strait",
  "strand",
  "stranger",
  "strap",
  "strategy",
  "straw",
  "strawberry",
  "strawman",
  "stream",
  "street",
  "streetcar",
  "strength",
  "stress",
  "stretch",
  "strife",
  "strike",
  "string",
  "strip",
  "stripe",
  "strobe",
  "stroke",
  "structure",
  "strudel",
  "struggle",
  "stucco",
  "stud",
  "student",
  "studio",
  "study",
  "stuff",
  "stumbling",
  "stump",
  "stupidity",
  "sturgeon",
  "sty",
  "style",
  "styling",
  "stylus",
  "sub",
  "subcomponent",
  "subconscious",
  "subcontractor",
  "subexpression",
  "subgroup",
  "subject",
  "submarine",
  "submitter",
  "subprime",
  "subroutine",
  "subscription",
  "subsection",
  "subset",
  "subsidence",
  "subsidiary",
  "subsidy",
  "substance",
  "substitution",
  "subtitle",
  "suburb",
  "subway",
  "success",
  "succotash",
  "suck",
  "sucker",
  "suede",
  "suet",
  "suffocation",
  "sugar",
  "suggestion",
  "suicide",
  "suit",
  "suitcase",
  "suite",
  "sulfur",
  "sultan",
  "sum",
  "summary",
  "summer",
  "summit",
  "sun",
  "sunbeam",
  "sunbonnet",
  "sundae",
  "sunday",
  "sundial",
  "sunflower",
  "sunglasses",
  "sunlamp",
  "sunlight",
  "sunrise",
  "sunroom",
  "sunset",
  "sunshine",
  "superiority",
  "supermarket",
  "supernatural",
  "supervision",
  "supervisor",
  "supper",
  "supplement",
  "supplier",
  "supply",
  "support",
  "supporter",
  "suppression",
  "supreme",
  "surface",
  "surfboard",
  "surge",
  "surgeon",
  "surgery",
  "surname",
  "surplus",
  "surprise",
  "surround",
  "surroundings",
  "surrounds",
  "survey",
  "survival",
  "survivor",
  "sushi",
  "suspect",
  "suspenders",
  "suspension",
  "sustainment",
  "sustenance",
  "swallow",
  "swamp",
  "swan",
  "swanling",
  "swath",
  "sweat",
  "sweater",
  "sweatshirt",
  "sweatshop",
  "sweatsuit",
  "sweets",
  "swell",
  "swim",
  "swimming",
  "swimsuit",
  "swine",
  "swing",
  "switch",
  "switchboard",
  "switching",
  "swivel",
  "sword",
  "swordfight",
  "swordfish",
  "sycamore",
  "symbol",
  "symmetry",
  "sympathy",
  "symptom",
  "syndicate",
  "syndrome",
  "synergy",
  "synod",
  "synonym",
  "synthesis",
  "syrup",
  "system",
  "t-shirt",
  "tab",
  "tabby",
  "tabernacle",
  "table",
  "tablecloth",
  "tablet",
  "tabletop",
  "tachometer",
  "tackle",
  "taco",
  "tactics",
  "tactile",
  "tadpole",
  "tag",
  "tail",
  "tailbud",
  "tailor",
  "tailspin",
  "take-out",
  "takeover",
  "tale",
  "talent",
  "talk",
  "talking",
  "tam-o'-shanter",
  "tamale",
  "tambour",
  "tambourine",
  "tan",
  "tandem",
  "tangerine",
  "tank",
  "tank-top",
  "tanker",
  "tankful",
  "tap",
  "tape",
  "tapioca",
  "target",
  "taro",
  "tarragon",
  "tart",
  "task",
  "tassel",
  "taste",
  "tatami",
  "tattler",
  "tattoo",
  "tavern",
  "tax",
  "taxi",
  "taxicab",
  "taxpayer",
  "tea",
  "teacher",
  "teaching",
  "team",
  "teammate",
  "teapot",
  "tear",
  "tech",
  "technician",
  "technique",
  "technologist",
  "technology",
  "tectonics",
  "teen",
  "teenager",
  "teepee",
  "telephone",
  "telescreen",
  "teletype",
  "television",
  "tell",
  "teller",
  "temp",
  "temper",
  "temperature",
  "temple",
  "tempo",
  "temporariness",
  "temporary",
  "temptation",
  "temptress",
  "tenant",
  "tendency",
  "tender",
  "tenement",
  "tenet",
  "tennis",
  "tenor",
  "tension",
  "tensor",
  "tent",
  "tentacle",
  "tenth",
  "tepee",
  "teriyaki",
  "term",
  "terminal",
  "termination",
  "terminology",
  "termite",
  "terrace",
  "terracotta",
  "terrapin",
  "terrarium",
  "territory",
  "terror",
  "terrorism",
  "terrorist",
  "test",
  "testament",
  "testimonial",
  "testimony",
  "testing",
  "text",
  "textbook",
  "textual",
  "texture",
  "thanks",
  "thaw",
  "theater",
  "theft",
  "theism",
  "theme",
  "theology",
  "theory",
  "therapist",
  "therapy",
  "thermals",
  "thermometer",
  "thermostat",
  "thesis",
  "thickness",
  "thief",
  "thigh",
  "thing",
  "thinking",
  "thirst",
  "thistle",
  "thong",
  "thongs",
  "thorn",
  "thought",
  "thousand",
  "thread",
  "threat",
  "threshold",
  "thrift",
  "thrill",
  "throat",
  "throne",
  "thrush",
  "thrust",
  "thug",
  "thumb",
  "thump",
  "thunder",
  "thunderbolt",
  "thunderhead",
  "thunderstorm",
  "thyme",
  "tiara",
  "tic",
  "tick",
  "ticket",
  "tide",
  "tie",
  "tiger",
  "tights",
  "tile",
  "till",
  "tilt",
  "timbale",
  "timber",
  "time",
  "timeline",
  "timeout",
  "timer",
  "timetable",
  "timing",
  "timpani",
  "tin",
  "tinderbox",
  "tinkle",
  "tintype",
  "tip",
  "tire",
  "tissue",
  "titanium",
  "title",
  "toad",
  "toast",
  "toaster",
  "tobacco",
  "today",
  "toe",
  "toenail",
  "toffee",
  "tofu",
  "tog",
  "toga",
  "toilet",
  "tolerance",
  "tolerant",
  "toll",
  "tom-tom",
  "tomatillo",
  "tomato",
  "tomb",
  "tomography",
  "tomorrow",
  "ton",
  "tonality",
  "tone",
  "tongue",
  "tonic",
  "tonight",
  "tool",
  "toot",
  "tooth",
  "toothbrush",
  "toothpaste",
  "toothpick",
  "top",
  "top-hat",
  "topic",
  "topsail",
  "toque",
  "toreador",
  "tornado",
  "torso",
  "torte",
  "tortellini",
  "tortilla",
  "tortoise",
  "tosser",
  "total",
  "tote",
  "touch",
  "tough-guy",
  "tour",
  "tourism",
  "tourist",
  "tournament",
  "tow-truck",
  "towel",
  "tower",
  "town",
  "townhouse",
  "township",
  "toy",
  "trace",
  "trachoma",
  "track",
  "tracking",
  "tracksuit",
  "tract",
  "tractor",
  "trade",
  "trader",
  "trading",
  "tradition",
  "traditionalism",
  "traffic",
  "trafficker",
  "tragedy",
  "trail",
  "trailer",
  "trailpatrol",
  "train",
  "trainer",
  "training",
  "trait",
  "tram",
  "tramp",
  "trance",
  "transaction",
  "transcript",
  "transfer",
