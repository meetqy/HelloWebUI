globalThis._importMeta_=globalThis._importMeta_||{url:"file:///_entry.js",env:process.env};import 'node-fetch-native/polyfill';
import { Server as Server$1 } from 'http';
import { Server } from 'https';
import destr from 'destr';
import { defineEventHandler, handleCacheHeaders, createEvent, eventHandler, createError, createApp, createRouter, lazyEventHandler } from 'h3';
import { createFetch as createFetch$1, Headers } from 'ohmyfetch';
import { createRouter as createRouter$1 } from 'radix3';
import { createCall, createFetch } from 'unenv/runtime/fetch/index';
import { createHooks } from 'hookable';
import { snakeCase } from 'scule';
import { hash } from 'ohash';
import { parseURL, withQuery, withLeadingSlash, withoutTrailingSlash } from 'ufo';
import { createStorage } from 'unstorage';
import { promises } from 'fs';
import { resolve, dirname } from 'pathe';
import { fileURLToPath } from 'url';

const _runtimeConfig = {"app":{"baseURL":"/beauty-template","buildAssetsDir":"/_nuxt/","cdnURL":""},"nitro":{"routes":{},"envPrefix":"NUXT_"},"public":{"strapi":{"url":"https://strapi.wcao.cc","prefix":"/api","version":"v4","cookie":{}}},"strapi":{"url":"https://strapi.wcao.cc","prefix":"/api","version":"v4","cookie":{}}};
const ENV_PREFIX = "NITRO_";
const ENV_PREFIX_ALT = _runtimeConfig.nitro.envPrefix ?? process.env.NITRO_ENV_PREFIX ?? "_";
const getEnv = (key) => {
  const envKey = snakeCase(key).toUpperCase();
  return destr(process.env[ENV_PREFIX + envKey] ?? process.env[ENV_PREFIX_ALT + envKey]);
};
function isObject(input) {
  return typeof input === "object" && !Array.isArray(input);
}
function overrideConfig(obj, parentKey = "") {
  for (const key in obj) {
    const subKey = parentKey ? `${parentKey}_${key}` : key;
    const envValue = getEnv(subKey);
    if (isObject(obj[key])) {
      if (isObject(envValue)) {
        obj[key] = { ...obj[key], ...envValue };
      }
      overrideConfig(obj[key], subKey);
    } else {
      obj[key] = envValue ?? obj[key];
    }
  }
}
overrideConfig(_runtimeConfig);
const config = deepFreeze(_runtimeConfig);
const useRuntimeConfig = () => config;
function deepFreeze(object) {
  const propNames = Object.getOwnPropertyNames(object);
  for (const name of propNames) {
    const value = object[name];
    if (value && typeof value === "object") {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

const globalTiming = globalThis.__timing__ || {
  start: () => 0,
  end: () => 0,
  metrics: []
};
function timingMiddleware(_req, res, next) {
  const start = globalTiming.start();
  const _end = res.end;
  res.end = (data, encoding, callback) => {
    const metrics = [["Generate", globalTiming.end(start)], ...globalTiming.metrics];
    const serverTiming = metrics.map((m) => `-;dur=${m[1]};desc="${encodeURIComponent(m[0])}"`).join(", ");
    if (!res.headersSent) {
      res.setHeader("Server-Timing", serverTiming);
    }
    _end.call(res, data, encoding, callback);
  };
  next();
}

const _assets = {

};

function normalizeKey(key) {
  if (!key) {
    return "";
  }
  return key.replace(/[/\\]/g, ":").replace(/:+/g, ":").replace(/^:|:$/g, "");
}

const assets$1 = {
  getKeys() {
    return Promise.resolve(Object.keys(_assets))
  },
  hasItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(id in _assets)
  },
  getItem (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].import() : null)
  },
  getMeta (id) {
    id = normalizeKey(id);
    return Promise.resolve(_assets[id] ? _assets[id].meta : {})
  }
};

const storage = createStorage({});

const useStorage = () => storage;

storage.mount('/assets', assets$1);

const defaultCacheOptions = {
  name: "_",
  base: "/cache",
  swr: true,
  maxAge: 1
};
function defineCachedFunction(fn, opts) {
  opts = { ...defaultCacheOptions, ...opts };
  const pending = {};
  const group = opts.group || "nitro";
  const name = opts.name || fn.name || "_";
  const integrity = hash([opts.integrity, fn, opts]);
  async function get(key, resolver) {
    const cacheKey = [opts.base, group, name, key + ".json"].filter(Boolean).join(":").replace(/:\/$/, ":index");
    const entry = await useStorage().getItem(cacheKey) || {};
    const ttl = (opts.maxAge ?? opts.maxAge ?? 0) * 1e3;
    if (ttl) {
      entry.expires = Date.now() + ttl;
    }
    const expired = entry.integrity !== integrity || ttl && Date.now() - (entry.mtime || 0) > ttl;
    const _resolve = async () => {
      if (!pending[key]) {
        entry.value = void 0;
        entry.integrity = void 0;
        entry.mtime = void 0;
        entry.expires = void 0;
        pending[key] = Promise.resolve(resolver());
      }
      entry.value = await pending[key];
      entry.mtime = Date.now();
      entry.integrity = integrity;
      delete pending[key];
      useStorage().setItem(cacheKey, entry).catch((error) => console.error("[nitro] [cache]", error));
    };
    const _resolvePromise = expired ? _resolve() : Promise.resolve();
    if (opts.swr && entry.value) {
      _resolvePromise.catch(console.error);
      return Promise.resolve(entry);
    }
    return _resolvePromise.then(() => entry);
  }
  return async (...args) => {
    const key = (opts.getKey || getKey)(...args);
    const entry = await get(key, () => fn(...args));
    let value = entry.value;
    if (opts.transform) {
      value = await opts.transform(entry, ...args) || value;
    }
    return value;
  };
}
const cachedFunction = defineCachedFunction;
function getKey(...args) {
  return args.length ? hash(args, {}) : "";
}
function defineCachedEventHandler(handler, opts = defaultCacheOptions) {
  const _opts = {
    ...opts,
    getKey: (event) => {
      return decodeURI(parseURL(event.req.originalUrl || event.req.url).pathname).replace(/\/$/, "/index");
    },
    group: opts.group || "nitro/handlers",
    integrity: [
      opts.integrity,
      handler
    ]
  };
  const _cachedHandler = cachedFunction(async (incomingEvent) => {
    const reqProxy = cloneWithProxy(incomingEvent.req, { headers: {} });
    const resHeaders = {};
    const resProxy = cloneWithProxy(incomingEvent.res, {
      statusCode: 200,
      getHeader(name) {
        return resHeaders[name];
      },
      setHeader(name, value) {
        resHeaders[name] = value;
        return this;
      },
      getHeaderNames() {
        return Object.keys(resHeaders);
      },
      hasHeader(name) {
        return name in resHeaders;
      },
      removeHeader(name) {
        delete resHeaders[name];
      },
      getHeaders() {
        return resHeaders;
      }
    });
    const event = createEvent(reqProxy, resProxy);
    event.context = incomingEvent.context;
    const body = await handler(event);
    const headers = event.res.getHeaders();
    headers.Etag = `W/"${hash(body)}"`;
    headers["Last-Modified"] = new Date().toUTCString();
    const cacheControl = [];
    if (opts.swr) {
      if (opts.maxAge) {
        cacheControl.push(`s-maxage=${opts.maxAge}`);
      }
      if (opts.staleMaxAge) {
        cacheControl.push(`stale-while-revalidate=${opts.staleMaxAge}`);
      } else {
        cacheControl.push("stale-while-revalidate");
      }
    } else if (opts.maxAge) {
      cacheControl.push(`max-age=${opts.maxAge}`);
    }
    if (cacheControl.length) {
      headers["Cache-Control"] = cacheControl.join(", ");
    }
    const cacheEntry = {
      code: event.res.statusCode,
      headers,
      body
    };
    return cacheEntry;
  }, _opts);
  return defineEventHandler(async (event) => {
    const response = await _cachedHandler(event);
    if (event.res.headersSent || event.res.writableEnded) {
      return response.body;
    }
    if (handleCacheHeaders(event, {
      modifiedTime: new Date(response.headers["Last-Modified"]),
      etag: response.headers.etag,
      maxAge: opts.maxAge
    })) {
      return;
    }
    event.res.statusCode = response.code;
    for (const name in response.headers) {
      event.res.setHeader(name, response.headers[name]);
    }
    return response.body;
  });
}
function cloneWithProxy(obj, overrides) {
  return new Proxy(obj, {
    get(target, property, receiver) {
      if (property in overrides) {
        return overrides[property];
      }
      return Reflect.get(target, property, receiver);
    },
    set(target, property, value, receiver) {
      if (property in overrides) {
        overrides[property] = value;
        return true;
      }
      return Reflect.set(target, property, value, receiver);
    }
  });
}
const cachedEventHandler = defineCachedEventHandler;

const plugins = [
  
];

function hasReqHeader(req, header, includes) {
  const value = req.headers[header];
  return value && typeof value === "string" && value.toLowerCase().includes(includes);
}
function isJsonRequest(event) {
  return hasReqHeader(event.req, "accept", "application/json") || hasReqHeader(event.req, "user-agent", "curl/") || hasReqHeader(event.req, "user-agent", "httpie/") || event.req.url?.endsWith(".json") || event.req.url?.includes("/api/");
}
function normalizeError(error) {
  const cwd = process.cwd();
  const stack = (error.stack || "").split("\n").splice(1).filter((line) => line.includes("at ")).map((line) => {
    const text = line.replace(cwd + "/", "./").replace("webpack:/", "").replace("file://", "").trim();
    return {
      text,
      internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
    };
  });
  const statusCode = error.statusCode || 500;
  const statusMessage = error.statusMessage ?? (statusCode === 404 ? "Route Not Found" : "Internal Server Error");
  const message = error.message || error.toString();
  return {
    stack,
    statusCode,
    statusMessage,
    message
  };
}

const errorHandler = (async function errorhandler(_error, event) {
  const { stack, statusCode, statusMessage, message } = normalizeError(_error);
  const errorObject = {
    url: event.req.url,
    statusCode,
    statusMessage,
    message,
    description: "",
    data: _error.data
  };
  event.res.statusCode = errorObject.statusCode;
  event.res.statusMessage = errorObject.statusMessage;
  if (errorObject.statusCode !== 404) {
    console.error("[nuxt] [request error]", errorObject.message + "\n" + stack.map((l) => "  " + l.text).join("  \n"));
  }
  if (isJsonRequest(event)) {
    event.res.setHeader("Content-Type", "application/json");
    event.res.end(JSON.stringify(errorObject));
    return;
  }
  const url = withQuery("/__nuxt_error", errorObject);
  const html = await $fetch(url).catch((error) => {
    console.error("[nitro] Error while generating error response", error);
    return errorObject.statusMessage;
  });
  event.res.setHeader("Content-Type", "text/html;charset=UTF-8");
  event.res.end(html);
});

const assets = {
  "/_nuxt/1-427cc096.mjs": {
    "type": "application/javascript",
    "etag": "\"959-OMpZOgRgmhhm+KhPY6TdyeDnNi8\"",
    "mtime": "2022-07-15T09:20:59.884Z",
    "path": "../public/_nuxt/1-427cc096.mjs"
  },
  "/_nuxt/1-93943a5b.mjs": {
    "type": "application/javascript",
    "etag": "\"41fe-6ltuoEzbMgUi3yGjj7GLS3ojjUQ\"",
    "mtime": "2022-07-15T09:20:59.884Z",
    "path": "../public/_nuxt/1-93943a5b.mjs"
  },
  "/_nuxt/1-d4784647.mjs": {
    "type": "application/javascript",
    "etag": "\"19dc-RhQ42ouy2UCpVBfyRHon326R1vo\"",
    "mtime": "2022-07-15T09:20:59.883Z",
    "path": "../public/_nuxt/1-d4784647.mjs"
  },
  "/_nuxt/1-ff860b17.mjs": {
    "type": "application/javascript",
    "etag": "\"57a-ZUnAfCJISAbn29ZNlfTH3nEXudE\"",
    "mtime": "2022-07-15T09:20:59.883Z",
    "path": "../public/_nuxt/1-ff860b17.mjs"
  },
  "/_nuxt/10-23b7f88a.mjs": {
    "type": "application/javascript",
    "etag": "\"11a2-4oc2dYMHcFBT5t0wY03JbYnVX4M\"",
    "mtime": "2022-07-15T09:20:59.883Z",
    "path": "../public/_nuxt/10-23b7f88a.mjs"
  },
  "/_nuxt/11-d0224586.mjs": {
    "type": "application/javascript",
    "etag": "\"3dd-io3jA6rn9POAYjCstVtvAQbLq9U\"",
    "mtime": "2022-07-15T09:20:59.882Z",
    "path": "../public/_nuxt/11-d0224586.mjs"
  },
  "/_nuxt/12-853f51aa.mjs": {
    "type": "application/javascript",
    "etag": "\"c1c-vmy9AsqVQLF/imzKAgAevoyx2Iw\"",
    "mtime": "2022-07-15T09:20:59.882Z",
    "path": "../public/_nuxt/12-853f51aa.mjs"
  },
  "/_nuxt/13-adc23806.mjs": {
    "type": "application/javascript",
    "etag": "\"8fb-/khw6Uxny806IhsA4UsRfHbOJL8\"",
    "mtime": "2022-07-15T09:20:59.882Z",
    "path": "../public/_nuxt/13-adc23806.mjs"
  },
  "/_nuxt/14-69bedfe3.mjs": {
    "type": "application/javascript",
    "etag": "\"dd3-pZrDoVc2cOK3a2PDhmO4eG9npnc\"",
    "mtime": "2022-07-15T09:20:59.881Z",
    "path": "../public/_nuxt/14-69bedfe3.mjs"
  },
  "/_nuxt/15-423305d3.mjs": {
    "type": "application/javascript",
    "etag": "\"42c-fAIHKk+Wsi8q9GfyqB+f5l+W1wI\"",
    "mtime": "2022-07-15T09:20:59.881Z",
    "path": "../public/_nuxt/15-423305d3.mjs"
  },
  "/_nuxt/16-8566fe4a.mjs": {
    "type": "application/javascript",
    "etag": "\"a66-Reu0EgWl4PJDrfjXBa6t8vzcT+I\"",
    "mtime": "2022-07-15T09:20:59.881Z",
    "path": "../public/_nuxt/16-8566fe4a.mjs"
  },
  "/_nuxt/17-2e68106a.mjs": {
    "type": "application/javascript",
    "etag": "\"1020-I75fWnQE44mHO/sw7zIB4cw/pJ0\"",
    "mtime": "2022-07-15T09:20:59.880Z",
    "path": "../public/_nuxt/17-2e68106a.mjs"
  },
  "/_nuxt/2-4f5b8aa6.mjs": {
    "type": "application/javascript",
    "etag": "\"71e-ds6sgNOtjVqUFSF8AihnKwiP6Hw\"",
    "mtime": "2022-07-15T09:20:59.880Z",
    "path": "../public/_nuxt/2-4f5b8aa6.mjs"
  },
  "/_nuxt/2-790818c8.mjs": {
    "type": "application/javascript",
    "etag": "\"53b-mslZQfJxsdX1+rgoL0P4SyzveEw\"",
    "mtime": "2022-07-15T09:20:59.880Z",
    "path": "../public/_nuxt/2-790818c8.mjs"
  },
  "/_nuxt/2-cd8007af.mjs": {
    "type": "application/javascript",
    "etag": "\"e1e-mEUYnBSSyBTO9zCCen2Coed2Uko\"",
    "mtime": "2022-07-15T09:20:59.879Z",
    "path": "../public/_nuxt/2-cd8007af.mjs"
  },
  "/_nuxt/3-402663fc.mjs": {
    "type": "application/javascript",
    "etag": "\"bfc-J/7ex6mRHE+haDqaaIh4ldlJkdw\"",
    "mtime": "2022-07-15T09:20:59.879Z",
    "path": "../public/_nuxt/3-402663fc.mjs"
  },
  "/_nuxt/3-c97c7f92.mjs": {
    "type": "application/javascript",
    "etag": "\"556-2QFN9ief1mxgo1gXHaQgd6O2UYo\"",
    "mtime": "2022-07-15T09:20:59.879Z",
    "path": "../public/_nuxt/3-c97c7f92.mjs"
  },
  "/_nuxt/4-51c27433.mjs": {
    "type": "application/javascript",
    "etag": "\"12c4-U/7RsBwHVKI+uPvCQuy/5RdvoNY\"",
    "mtime": "2022-07-15T09:20:59.878Z",
    "path": "../public/_nuxt/4-51c27433.mjs"
  },
  "/_nuxt/4-c4d1fcbc.mjs": {
    "type": "application/javascript",
    "etag": "\"bf2-NI64ntyBWH8UjVCW8pQT48ezf/I\"",
    "mtime": "2022-07-15T09:20:59.878Z",
    "path": "../public/_nuxt/4-c4d1fcbc.mjs"
  },
  "/_nuxt/5-01dca7eb.mjs": {
    "type": "application/javascript",
    "etag": "\"3bd-X96b6qPQiSMGsD5JalMCbhiCVJQ\"",
    "mtime": "2022-07-15T09:20:59.877Z",
    "path": "../public/_nuxt/5-01dca7eb.mjs"
  },
  "/_nuxt/5-9797d2aa.mjs": {
    "type": "application/javascript",
    "etag": "\"dd3-Gruts6zXgoHg1JqBzenj0wUOdV4\"",
    "mtime": "2022-07-15T09:20:59.877Z",
    "path": "../public/_nuxt/5-9797d2aa.mjs"
  },
  "/_nuxt/6-b6fb3ab8.mjs": {
    "type": "application/javascript",
    "etag": "\"d3e-FInTpNbqsjrSICjRAA+oID6/8Zo\"",
    "mtime": "2022-07-15T09:20:59.877Z",
    "path": "../public/_nuxt/6-b6fb3ab8.mjs"
  },
  "/_nuxt/7-9118e319.mjs": {
    "type": "application/javascript",
    "etag": "\"6d1-GokKlufisFR7tRbRHLPX3mvApjk\"",
    "mtime": "2022-07-15T09:20:59.876Z",
    "path": "../public/_nuxt/7-9118e319.mjs"
  },
  "/_nuxt/8-8e17b27b.mjs": {
    "type": "application/javascript",
    "etag": "\"fad-XooNCIIxP7X+HUjgjmz8LKbdJgY\"",
    "mtime": "2022-07-15T09:20:59.876Z",
    "path": "../public/_nuxt/8-8e17b27b.mjs"
  },
  "/_nuxt/9-c76a951c.mjs": {
    "type": "application/javascript",
    "etag": "\"d9f-3gzvm46dzzrNN+mUyTPWadIF3p0\"",
    "mtime": "2022-07-15T09:20:59.875Z",
    "path": "../public/_nuxt/9-c76a951c.mjs"
  },
  "/_nuxt/default-25adbbc1.mjs": {
    "type": "application/javascript",
    "etag": "\"343f-URMjg/+kSIaEccLxKAN0F9l2qi8\"",
    "mtime": "2022-07-15T09:20:59.873Z",
    "path": "../public/_nuxt/default-25adbbc1.mjs"
  },
  "/_nuxt/entry-2b002331.mjs": {
    "type": "application/javascript",
    "etag": "\"13db62-95xr0yYr5dlsybf/tMNbP2pKhyE\"",
    "mtime": "2022-07-15T09:20:59.865Z",
    "path": "../public/_nuxt/entry-2b002331.mjs"
  },
  "/_nuxt/entry.d5ed2fa9.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"19c5d-PUTSN2i06a284iglYVC94yA3YJY\"",
    "mtime": "2022-07-15T09:20:59.861Z",
    "path": "../public/_nuxt/entry.d5ed2fa9.css"
  },
  "/_nuxt/language-0d1e8454.mjs": {
    "type": "application/javascript",
    "etag": "\"81-JWllBMx3VPGPo9WCXD8OBEX9474\"",
    "mtime": "2022-07-15T09:20:59.857Z",
    "path": "../public/_nuxt/language-0d1e8454.mjs"
  },
  "/_nuxt/manifest.json": {
    "type": "application/json",
    "etag": "\"1c08-YlUaIxKH/usjCCvjzBDZBzNHvLY\"",
    "mtime": "2022-07-15T09:20:59.855Z",
    "path": "../public/_nuxt/manifest.json"
  }
};

function readAsset (id) {
  const serverDir = dirname(fileURLToPath(globalThis._importMeta_.url));
  return promises.readFile(resolve(serverDir, assets[id].path))
}

const publicAssetBases = ["/_nuxt"];

function isPublicAssetURL(id = '') {
  if (assets[id]) {
    return
  }
  for (const base of publicAssetBases) {
    if (id.startsWith(base)) { return true }
  }
  return false
}

function getAsset (id) {
  return assets[id]
}

const METHODS = ["HEAD", "GET"];
const _152570 = eventHandler(async (event) => {
  if (event.req.method && !METHODS.includes(event.req.method)) {
    return;
  }
  let id = decodeURIComponent(withLeadingSlash(withoutTrailingSlash(parseURL(event.req.url).pathname)));
  let asset;
  for (const _id of [id, id + "/index.html"]) {
    const _asset = getAsset(_id);
    if (_asset) {
      asset = _asset;
      id = _id;
      break;
    }
  }
  if (!asset) {
    if (isPublicAssetURL(id)) {
      throw createError({
        statusMessage: "Cannot find static asset " + id,
        statusCode: 404
      });
    }
    return;
  }
  const ifNotMatch = event.req.headers["if-none-match"] === asset.etag;
  if (ifNotMatch) {
    event.res.statusCode = 304;
    event.res.end("Not Modified (etag)");
    return;
  }
  const ifModifiedSinceH = event.req.headers["if-modified-since"];
  if (ifModifiedSinceH && asset.mtime) {
    if (new Date(ifModifiedSinceH) >= new Date(asset.mtime)) {
      event.res.statusCode = 304;
      event.res.end("Not Modified (mtime)");
      return;
    }
  }
  if (asset.type) {
    event.res.setHeader("Content-Type", asset.type);
  }
  if (asset.etag) {
    event.res.setHeader("ETag", asset.etag);
  }
  if (asset.mtime) {
    event.res.setHeader("Last-Modified", asset.mtime);
  }
  const contents = await readAsset(id);
  event.res.end(contents);
});

const _lazy_315238 = () => import('../handlers/renderer.mjs').then(function (n) { return n.a; });

const handlers = [
  { route: '', handler: _152570, lazy: false, middleware: true, method: undefined },
  { route: '/__nuxt_error', handler: _lazy_315238, lazy: true, middleware: false, method: undefined },
  { route: '/**', handler: _lazy_315238, lazy: true, middleware: false, method: undefined }
];

function createNitroApp() {
  const config = useRuntimeConfig();
  const hooks = createHooks();
  const h3App = createApp({
    debug: destr(false),
    onError: errorHandler
  });
  h3App.use(config.app.baseURL, timingMiddleware);
  const router = createRouter();
  const routerOptions = createRouter$1({ routes: config.nitro.routes });
  for (const h of handlers) {
    let handler = h.lazy ? lazyEventHandler(h.handler) : h.handler;
    const referenceRoute = h.route.replace(/:\w+|\*\*/g, "_");
    const routeOptions = routerOptions.lookup(referenceRoute) || {};
    if (routeOptions.swr) {
      handler = cachedEventHandler(handler, {
        group: "nitro/routes"
      });
    }
    if (h.middleware || !h.route) {
      const middlewareBase = (config.app.baseURL + (h.route || "/")).replace(/\/+/g, "/");
      h3App.use(middlewareBase, handler);
    } else {
      router.use(h.route, handler, h.method);
    }
  }
  h3App.use(config.app.baseURL, router);
  const localCall = createCall(h3App.nodeHandler);
  const localFetch = createFetch(localCall, globalThis.fetch);
  const $fetch = createFetch$1({ fetch: localFetch, Headers, defaults: { baseURL: config.app.baseURL } });
  globalThis.$fetch = $fetch;
  const app = {
    hooks,
    h3App,
    localCall,
    localFetch
  };
  for (const plugin of plugins) {
    plugin(app);
  }
  return app;
}
const nitroApp = createNitroApp();

const cert = process.env.NITRO_SSL_CERT;
const key = process.env.NITRO_SSL_KEY;
const server = cert && key ? new Server({ key, cert }, nitroApp.h3App.nodeHandler) : new Server$1(nitroApp.h3App.nodeHandler);
const port = destr(process.env.NITRO_PORT || process.env.PORT) || 3e3;
const hostname = process.env.NITRO_HOST || process.env.HOST || "0.0.0.0";
server.listen(port, hostname, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  const protocol = cert && key ? "https" : "http";
  console.log(`Listening on ${protocol}://${hostname}:${port}${useRuntimeConfig().app.baseURL}`);
});
{
  process.on("unhandledRejection", (err) => console.error("[nitro] [dev] [unhandledRejection] " + err));
  process.on("uncaughtException", (err) => console.error("[nitro] [dev] [uncaughtException] " + err));
}
const nodeServer = {};

export { nodeServer as n, useRuntimeConfig as u };
//# sourceMappingURL=node-server.mjs.map
