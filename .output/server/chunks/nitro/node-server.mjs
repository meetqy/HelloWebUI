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
  "/_nuxt/1-17247103.mjs": {
    "type": "application/javascript",
    "etag": "\"19e3-5xgIwMVDcFcnTnLCb/0p1Rz9p2k\"",
    "mtime": "2022-07-12T09:21:27.622Z",
    "path": "../public/_nuxt/1-17247103.mjs"
  },
  "/_nuxt/1-80d48b0f.mjs": {
    "type": "application/javascript",
    "etag": "\"41fe-+C9tEkbA2uchJ2GhWlSORyHc99s\"",
    "mtime": "2022-07-12T09:21:27.621Z",
    "path": "../public/_nuxt/1-80d48b0f.mjs"
  },
  "/_nuxt/1-db59bd4c.mjs": {
    "type": "application/javascript",
    "etag": "\"954-p1Kkqc72VxtX5h0QX69YfKeajNI\"",
    "mtime": "2022-07-12T09:21:27.621Z",
    "path": "../public/_nuxt/1-db59bd4c.mjs"
  },
  "/_nuxt/1-e4f16ade.mjs": {
    "type": "application/javascript",
    "etag": "\"57a-i3HctcPqRtEwOxKWxq8buqv3Ux8\"",
    "mtime": "2022-07-12T09:21:27.621Z",
    "path": "../public/_nuxt/1-e4f16ade.mjs"
  },
  "/_nuxt/10-365eac98.mjs": {
    "type": "application/javascript",
    "etag": "\"11a2-c12HXsKYceT6s8D/LVsVlkeFKSA\"",
    "mtime": "2022-07-12T09:21:27.620Z",
    "path": "../public/_nuxt/10-365eac98.mjs"
  },
  "/_nuxt/11-fab3d27d.mjs": {
    "type": "application/javascript",
    "etag": "\"3dd-KVyEP95hta/r+Y+9+KsqgARDOKg\"",
    "mtime": "2022-07-12T09:21:27.620Z",
    "path": "../public/_nuxt/11-fab3d27d.mjs"
  },
  "/_nuxt/12-dbec211e.mjs": {
    "type": "application/javascript",
    "etag": "\"c1c-fbbOiyNhfXhzHgRCBFu+P0QYtxQ\"",
    "mtime": "2022-07-12T09:21:27.620Z",
    "path": "../public/_nuxt/12-dbec211e.mjs"
  },
  "/_nuxt/13-0b5365b8.mjs": {
    "type": "application/javascript",
    "etag": "\"8fb-sAbX8NpSkyNSHaoq7sRUfIHbRFE\"",
    "mtime": "2022-07-12T09:21:27.619Z",
    "path": "../public/_nuxt/13-0b5365b8.mjs"
  },
  "/_nuxt/14-086ec804.mjs": {
    "type": "application/javascript",
    "etag": "\"dd3-d0Ry4nvp453irZVuGHnvnSr9Hpo\"",
    "mtime": "2022-07-12T09:21:27.619Z",
    "path": "../public/_nuxt/14-086ec804.mjs"
  },
  "/_nuxt/15-41811359.mjs": {
    "type": "application/javascript",
    "etag": "\"432-EBabfN9xIaFgkhIQfs4F7zzGQGs\"",
    "mtime": "2022-07-12T09:21:27.619Z",
    "path": "../public/_nuxt/15-41811359.mjs"
  },
  "/_nuxt/16-4263edee.mjs": {
    "type": "application/javascript",
    "etag": "\"a66-rS9lHf3idANxm+4xdNrj/ua0Kho\"",
    "mtime": "2022-07-12T09:21:27.618Z",
    "path": "../public/_nuxt/16-4263edee.mjs"
  },
  "/_nuxt/17-0c3f285a.mjs": {
    "type": "application/javascript",
    "etag": "\"b85-PdrcDYeWfO85844Rv8cmnUAZs5E\"",
    "mtime": "2022-07-12T09:21:27.618Z",
    "path": "../public/_nuxt/17-0c3f285a.mjs"
  },
  "/_nuxt/2-2e64c978.mjs": {
    "type": "application/javascript",
    "etag": "\"53b-FyxkL/W2l7pqfFX13j1kSknM/lg\"",
    "mtime": "2022-07-12T09:21:27.618Z",
    "path": "../public/_nuxt/2-2e64c978.mjs"
  },
  "/_nuxt/2-3b9d63fe.mjs": {
    "type": "application/javascript",
    "etag": "\"e07-Hfg4smPrqnl5uKz0vAR49C13uqY\"",
    "mtime": "2022-07-12T09:21:27.617Z",
    "path": "../public/_nuxt/2-3b9d63fe.mjs"
  },
  "/_nuxt/3-a79fd00e.mjs": {
    "type": "application/javascript",
    "etag": "\"556-4V9lQz/Q5Z7XrFBo+HEwNPODOVQ\"",
    "mtime": "2022-07-12T09:21:27.617Z",
    "path": "../public/_nuxt/3-a79fd00e.mjs"
  },
  "/_nuxt/4-9f947c1a.mjs": {
    "type": "application/javascript",
    "etag": "\"bf2-oDXMrrp1+EAkiDGFYWr09n+Ub9M\"",
    "mtime": "2022-07-12T09:21:27.616Z",
    "path": "../public/_nuxt/4-9f947c1a.mjs"
  },
  "/_nuxt/5-318ed620.mjs": {
    "type": "application/javascript",
    "etag": "\"3bd-uZ29Lpqv5SNyANupT+/b0rCD6/s\"",
    "mtime": "2022-07-12T09:21:27.616Z",
    "path": "../public/_nuxt/5-318ed620.mjs"
  },
  "/_nuxt/6-c9d78a96.mjs": {
    "type": "application/javascript",
    "etag": "\"d3e-F74IZYd+9xNKbfhLOZX7YnvB+Yw\"",
    "mtime": "2022-07-12T09:21:27.616Z",
    "path": "../public/_nuxt/6-c9d78a96.mjs"
  },
  "/_nuxt/7-29a68954.mjs": {
    "type": "application/javascript",
    "etag": "\"6d1-uF8A9fkEwNY1KM9oUThwX8QVxwc\"",
    "mtime": "2022-07-12T09:21:27.615Z",
    "path": "../public/_nuxt/7-29a68954.mjs"
  },
  "/_nuxt/8-1f514904.mjs": {
    "type": "application/javascript",
    "etag": "\"fad-xM/GyLrrEyEBBOaR2LMZGe99G+8\"",
    "mtime": "2022-07-12T09:21:27.615Z",
    "path": "../public/_nuxt/8-1f514904.mjs"
  },
  "/_nuxt/9-7c0183a8.mjs": {
    "type": "application/javascript",
    "etag": "\"d9f-fTYIaMC+JnBMzumYYhCIj+3+Imk\"",
    "mtime": "2022-07-12T09:21:27.614Z",
    "path": "../public/_nuxt/9-7c0183a8.mjs"
  },
  "/_nuxt/default-ba280c69.mjs": {
    "type": "application/javascript",
    "etag": "\"3387-zI34C1GsPYgLWDrKjsic/EoXm+g\"",
    "mtime": "2022-07-12T09:21:27.614Z",
    "path": "../public/_nuxt/default-ba280c69.mjs"
  },
  "/_nuxt/entry-cfcf7038.mjs": {
    "type": "application/javascript",
    "etag": "\"13cf54-W/VxvURj4vMa3uJhhTHokG2T+nY\"",
    "mtime": "2022-07-12T09:21:27.613Z",
    "path": "../public/_nuxt/entry-cfcf7038.mjs"
  },
  "/_nuxt/entry.12dd3f67.css": {
    "type": "text/css; charset=utf-8",
    "etag": "\"1950a-iypneD3BWiw0Hr4734sz7ndwKIE\"",
    "mtime": "2022-07-12T09:21:27.579Z",
    "path": "../public/_nuxt/entry.12dd3f67.css"
  },
  "/_nuxt/language-b7ef4dd6.mjs": {
    "type": "application/javascript",
    "etag": "\"81-qSjNsafqi9yOJTAQcxZMvQFChio\"",
    "mtime": "2022-07-12T09:21:27.575Z",
    "path": "../public/_nuxt/language-b7ef4dd6.mjs"
  },
  "/_nuxt/manifest.json": {
    "type": "application/json",
    "etag": "\"17d8-BvXOTTX0zK1XztFDMPJcrCzOYjg\"",
    "mtime": "2022-07-12T09:21:27.571Z",
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
