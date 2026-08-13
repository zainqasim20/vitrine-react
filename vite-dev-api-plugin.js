// Local-dev-only shim that mounts the exact same api/*.js handler files
// Vercel would run in production, so `npm run dev` exercises real code
// paths (not a parallel reimplementation). Vercel augments Node's req/res
// with parsed .body and .status().json() sugar; this plugin does the same,
// minimally, for the handlers this app currently has.

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function withVercelSugar(res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (obj) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(obj));
  };
  return res;
}

export default function viteDevApiPlugin() {
  const routes = {
    '/api/status': new URL('./api/status.js', import.meta.url),
    '/api/perceive-image': new URL('./api/perceive-image.js', import.meta.url),
  };

  return {
    name: 'vite-dev-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || '').split('?')[0];
        const moduleUrl = routes[path];
        if (!moduleUrl) {
          next();
          return;
        }
        try {
          // Cache-bust with a query param so handler edits are picked up on
          // the next request without restarting the server -- ESM's import
          // cache has no equivalent of CommonJS's require.cache deletion.
          const mod = await import(moduleUrl.href + `?t=${Date.now()}`);
          const handler = mod.default;
          if (req.method === 'POST') req.body = await readBody(req);
          withVercelSugar(res);
          await handler(req, res);
        } catch (e) {
          withVercelSugar(res);
          res.status(500).json({ error: e.message || 'Local API shim error' });
        }
      });
    },
  };
}
