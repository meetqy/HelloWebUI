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
  "/_nuxt/1-734599f9.mjs": {
    "type": "application/javascript",
    "etag": "\"4ce-8HeNg8WIIRyQyHlVAVWEAhU6UFs\"",
    "mtime": "2022-07-07T09:22:08.534Z",
    "path": "../public/_nuxt/1-734599f9.mjs"
  },
  "/_nuxt/1-bee863d2.mjs": {
    "type": "application/javascript",
    "etag": "\"1609-FetoeLCSsVf2UwWSxBQs/20/6yM\"",
    "mtime": "2022-07-07T09:22:08.534Z",
    "path": "../public/_nuxt/1-bee863d2.mjs"
  },
  "/_nuxt/10-e1ced2a3.mjs": {
    "type": "application/javascript",
    "etag": "\"1114-OE0uC3947JPBPp74LIOToi+SFbQ\"",
    "mtime": "2022-07-07T09:22:08.533Z",
    "path": "../public/_nuxt/10-e1ced2a3.mjs"
  },
  "/_nuxt/11-59214f09.mjs": {
    "type": "application/javascript",
    "etag": "\"345-mtgdCynMXE9KOGLNZVh9zb1eBLw\"",
    "mtime": "2022-07-07T09:22:08.533Z",
    "path": "../public/_nuxt/11-59214f09.mjs"
  },
  "/_nuxt/12-b9cc2b82.mjs": {
    "type": "application/javascript",
    "etag": "\"88f-Gd3sLcPWmkbdrQFigCGOZEGMtwM\"",
    "mtime": "2022-07-07T09:22:08.533Z",
    "path": "../public/_nuxt/12-b9cc2b82.mjs"
  },
  "/_nuxt/13-f41a6356.mjs": {
    "type": "application/javascript",
    "etag": "\"868-1n8g+cbPI5Ibcv6i8IpGDpsJaMI\"",
    "mtime": "2022-07-07T09:22:08.532Z",
    "path": "../public/_nuxt/13-f41a6356.mjs"
  },
  "/_nuxt/14-8aea9a88.mjs": {
    "type": "application/javascript",
    "etag": "\"d3b-beWn8PFIedZRt0Yggr6Z1WnzuAo\"",
    "mtime": "2022-07-07T09:22:08.532Z",
    "path": "../public/_nuxt/14-8aea9a88.mjs"
  },
  "/_nuxt/15-915efb76.mjs": {
    "type": "application/javascript",
    "etag": "\"39a-dVwzZjbx1VwqGbRYO3dvu9CPwgk\"",
    "mtime": "2022-07-07T09:22:08.532Z",
    "path": "../public/_nuxt/15-915efb76.mjs"
  },
  "/_nuxt/16-5a04967b.mjs": {
    "type": "application/javascript",
    "etag": "\"9ce-E6hRifh6wVe3qoZqpAM28e2/0+A\"",
    "mtime": "2022-07-07T09:22:08.531Z",
    "path": "../public/_nuxt/16-5a04967b.mjs"
  },
  "/_nuxt/17-ea382f51.mjs": {
    "type": "application/javascript",
    "etag": "\"aed-iErdJA0zEIAUBNAXBDRvEQruufU\"",
    "mtime": "2022-07-07T09:22:08.531Z",
    "path": "../public/_nuxt/17-ea382f51.mjs"
  },
  "/_nuxt/2-fda2eb75.mjs": {
    "type": "application/javascript",
    "etag": "\"49b-GyiuB30ZeWo8AfpM8kHV0SntfhQ\"",
    "mtime": "2022-07-07T09:22:08.531Z",
    "path": "../public/_nuxt/2-fda2eb75.mjs"
  },
  "/_nuxt/3-01add010.mjs": {
    "type": "application/javascript",
    "etag": "\"4b1-rR/H+ECpLt3kOSjSf2yww5H/yUE\"",
    "mtime": "2022-07-07T09:22:08.530Z",
    "path": "../public/_nuxt/3-01add010.mjs"
  },
  "/_nuxt/4-f617825f.mjs": {
    "type": "application/javascript",
    "etag": "\"b52-dJBNHPYrBO1WFTYZ7FdR/u/LzsM\"",
    "mtime": "2022-07-07T09:22:08.530Z",
    "path": "../public/_nuxt/4-f617825f.mjs"
  },
  "/_nuxt/5-9aeff1cd.mjs": {
    "type": "application/javascript",
    "etag": "\"318-m5r8KXx0cSbetlTn4l9A/7GmLgk\"",
    "mtime": "2022-07-07T09:22:08.529Z",
    "path": "../public/_nuxt/5-9aeff1cd.mjs"
  },
  "/_nuxt/6-dd6754fb.mjs": {
    "type": "application/javascript",
    "etag": "\"c9e-j/HMD9i2KzP9o4muhcqcASASPa8\"",
    "mtime": "2022-07-07T09:22:08.529Z",
    "path": "../public/_nuxt/6-dd6754fb.mjs"
  },
  "/_nuxt/7-fe5f4785.mjs": {
    "type": "application/javascript",
    "etag": "\"62c-mE9yJmpsqjPlyVd2WVJKbYXZzuI\"",
    "mtime": "2022-07-07T09:22:08.529Z",
    "path": "../public/_nuxt/7-fe5f4785.mjs"
  },
  "/_nuxt/8-36b025c0.mjs": {
    "type": "application/javascript",
    "etag": "\"f1e-2mK9pkozs6p320GPgSbppGXbFs8\"",
    "mtime": "2022-07-07T09:22:08.528Z",
    "path": "../public/_nuxt/8-36b025c0.mjs"
  },
  "/_nuxt/9-962b8b80.mjs": {
    "type": "application/javascript",
    "etag": "\"d07-gpoV0xQHzVDInWN4PXYtaT2U+8E\"",
    "mtime": "2022-07-07T09:22:08.528Z",
    "path": "../public/_nuxt/9-962b8b80.mjs"
  },
  "/_nuxt/_num_-0500452d.mjs": {
    "type": "application/javascript",
    "etag": "\"14d0-AhCtDmnlO3IHMWnqFq529NF6rH8\"",
    "mtime": "2022-07-07T09:22:08.527Z",
    "path": "../public/_nuxt/_num_-0500452d.mjs"
  },
  "/_nuxt/_num_-bb1b5b89.mjs": {
    "type": "application/javascript",
    "etag": "\"2a6-GjrcvbhC/sMXDmFH99LRymYbZGA\"",
    "mtime": "2022-07-07T09:22:08.527Z",
    "path": "../public/_nuxt/_num_-bb1b5b89.mjs"
  },
  "/_nuxt/entry-d7b7c56e.mjs": {
    "type": "application/javascript",
    "etag": "\"ebf97-fS7mq02z9K3MXtDjtkKLU8L1Qw4\"",
    "mtime": "2022-07-07T09:22:08.527Z",
    "path": "../public/_nuxt/entry-d7b7c56e.mjs"
  },
  "/_nuxt/entry.d5c5e0a1.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"17c84-8TUAn3gE16xoy1Ev8Ff0qBgUMeU\"",
    "mtime": "2022-07-07T09:22:08.525Z",
    "path": "../public/_nuxt/entry.d5c5e0a1.css"
  },
  "/_nuxt/index-3479a80e.mjs": {
    "type": "application/javascript",
    "etag": "\"18f4-OJI7B90lv2NtiSUUrxQxJG84ni0\"",
    "mtime": "2022-07-07T09:22:08.524Z",
    "path": "../public/_nuxt/index-3479a80e.mjs"
  },
  "/_nuxt/language-76372fc6.mjs": {
    "type": "application/javascript",
    "etag": "\"65-ULikAC+weyUv+IxbjnW8TbyNCMo\"",
    "mtime": "2022-07-07T09:22:08.524Z",
    "path": "../public/_nuxt/language-76372fc6.mjs"
  },
  "/_nuxt/manifest.json": {
    "type": "application/json",
    "etag": "\"14a0-ZtJ4A4SE1aOVqEafXGhWx48bpos\"",
    "mtime": "2022-07-07T09:22:08.523Z",
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
