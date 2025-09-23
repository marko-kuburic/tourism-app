// gateway/index.js
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import cors from 'cors';
import morgan from 'morgan';
import { v4 as uuidv4 } from 'uuid';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import path from 'node:path';
import url from 'node:url';

const app = express();
const PORT = process.env.PORT || 8080;
const PURCHASE_URL = process.env.PURCHASE_URL || 'http://purchase:8085';

// Disable ETag so we don't emit 304 for dynamic gRPC responses
app.set('etag', false);

// --- Common proxy options (timeouts, ws, xfwd) ---
const commonProxyOpts = {
  changeOrigin: true,
  ws: true,
  xfwd: true,
  proxyTimeout: 30_000,
  timeout: 30_000,
};

// Helper for JSON-forwarding proxies
function jsonForwardingProxy({ target, rewritePrefix }) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [rewritePrefix]: '' },
    ...commonProxyOpts,
    onProxyReq: (proxyReq, req) => {
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
  });
}

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// ------------------------------
// Auth utilities
// ------------------------------
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const isUuid = (s) => typeof s === 'string' && UUID_RE.test(s.trim());

// Fetch current user profile from backend, forwarding auth
async function fetchProfile(req) {
  const headers = {};
  if (req.headers['authorization'])
    headers['authorization'] = req.headers['authorization'];
  if (req.headers['cookie']) headers['cookie'] = req.headers['cookie'];
  const r = await fetch('http://backend:8081/me', { headers });
  if (!r.ok) return null;
  return r.json();
}

// Require auth for routes that create/modify server state
async function requireUser(req, res, next) {
  try {
    const me = await fetchProfile(req);
    if (!me || !isUuid(me.id)) {
      return res.status(401).json({ error: 'Unauthorized (no valid user id)' });
    }
    req.user = me; // { id, role, ... }
    next();
  } catch (e) {
    console.error('[gateway] requireUser failed:', e);
    res.status(502).json({ error: 'Auth upstream unavailable' });
  }
}

// --------------------------------------------------
// Plain prefixes (no /api)
// --------------------------------------------------
app.use('/blog', (req, _res, next) => {
  console.log(`[GATEWAY] BLOG ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  '/blog',
  createProxyMiddleware({
    target: 'http://blog:8080',
    pathRewrite: { '^/blog': '' },
    ...commonProxyOpts,
  }),
);

app.use('/following', (req, _res, next) => {
  console.log(`[GATEWAY] FOLLOWING ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  '/following',
  createProxyMiddleware({
    target: 'http://following:8083',
    pathRewrite: { '^/following': '' },
    ...commonProxyOpts,
  }),
);

app.use('/stakeholders', (req, _res, next) => {
  console.log(`[GATEWAY] STAKEHOLDERS ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  '/stakeholders',
  jsonForwardingProxy({
    target: 'http://backend:8081',
    rewritePrefix: '^/stakeholders',
  }),
);

app.use('/tour', (req, _res, next) => {
  console.log(`[GATEWAY] TOUR ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  '/tour',
  createProxyMiddleware({
    target: 'http://tour:8084',
    pathRewrite: { '^/tour': '' },
    ...commonProxyOpts,
  }),
);

// --------------------------------------------------
// API-prefixed variants so frontend can use /api/*
// --------------------------------------------------
app.use('/api/stakeholders', (req, _res, next) => {
  console.log(
    `[GATEWAY] API STAKEHOLDERS ${req.method} ${req.originalUrl}`,
  );
  next();
});
app.use(
  '/api/stakeholders',
  jsonForwardingProxy({
    target: 'http://backend:8081',
    rewritePrefix: '^/api/stakeholders',
  }),
);

app.use('/api/following', (req, _res, next) => {
  console.log(`[GATEWAY] API FOLLOWING ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  '/api/following',
  createProxyMiddleware({
    target: 'http://following:8083',
    pathRewrite: { '^/api/following': '' },
    ...commonProxyOpts,
  }),
);

// Support both /api/blog and /api-blog
app.use(['/api/blog', '/api-blog'], (req, _res, next) => {
  console.log(`[GATEWAY] API BLOG ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  ['/api/blog', '/api-blog'],
  createProxyMiddleware({
    target: 'http://blog:8080',
    pathRewrite: {
      '^/api/blog': '',
      '^/api-blog': '',
    },
    ...commonProxyOpts,
  }),
);

// Optional: /api/tour (REST to the Spring app, not gRPC)
app.use('/api/tour', (req, _res, next) => {
  console.log(`[GATEWAY] API TOUR (REST) ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  '/api/tour',
  createProxyMiddleware({
    target: 'http://tour:8084',
    pathRewrite: { '^/api/tour': '' },
    ...commonProxyOpts,
  }),
);

// --------------------------------------------------
// gRPC bridge for TourService on /api-tours/*
// --------------------------------------------------
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const PROTO_DIR =
  process.env.PROTO_DIR || path.join(__dirname, '..', 'proto');
const TOUR_GRPC_ADDR = process.env.TOUR_GRPC_ADDR || 'tour:9094';

const tourPkgDef = protoLoader.loadSync(path.join(PROTO_DIR, 'tour.proto'), {
  keepCase: false,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const tourProto = grpc.loadPackageDefinition(tourPkgDef);
const TourService = tourProto.tour?.v1?.TourService;

let tourClient = null;
if (TourService) {
  tourClient = new TourService(
    TOUR_GRPC_ADDR,
    grpc.credentials.createInsecure(),
  );
} else {
  console.warn('[gateway] WARN: tour.v1.TourService not found in loaded proto.');
}

app.get('/healthz', (_req, res) => res.json({ ok: true }));

// -------- gRPC-backed routes --------
app.get('/api-tours/tours', (req, res) => {
  if (!tourClient)
    return res.status(500).json({ error: 'Tour gRPC client not initialized' });
  const authorId = req.query.authorId || '';
  tourClient.ListTours({ authorId }, (err, data) => {
    if (err) return grpcError(res, err, 'ListTours failed');
    // Avoid browser caching stale empty list
    res.set('Cache-Control', 'no-store');
    res.status(200).json(data);
  });
});

// Secure create: requireUser injects the authenticated author's id
app.post('/api-tours/tours', requireUser, (req, res) => {
  if (!tourClient)
    return res.status(500).json({ error: 'Tour gRPC client not initialized' });
  const requestId = uuidv4();
  const {
    name,
    description,
    difficulty,
    status = 'PUBLISHED',
    priceCents,
    tags = [],
  } = req.body || {};

  const authorId = req.user.id; // from /me, validated UUID

  const grpcReq = {
    authorId,
    name,
    description,
    difficulty,
    status,
    priceCents,
    tags,
  };
  tourClient.CreateTour(grpcReq, (err, resp) => {
    if (err) return grpcError(res, err, 'CreateTour failed', requestId);
    res.set('Cache-Control', 'no-store');
    res.status(201).json({ tour: resp?.tour, requestId });
  });
});

app.delete('/api-tours/tours/:id', (req, res) => {
  if (!tourClient)
    return res.status(500).json({ error: 'Tour gRPC client not initialized' });
  tourClient.DeleteTour({ id: req.params.id }, (err) => {
    if (err) return grpcError(res, err, 'DeleteTour failed');
    res.set('Cache-Control', 'no-store');
    res.status(204).end();
  });
});

// -------- REST pass-through for everything else under /api-tours/* --------
// Keep old working REST endpoints like:
//   GET  /api-tours/tours/:id
//   GET  /api-tours/tours/:id/reviews
//   POST /api-tours/tours/:id/reviews
// …or any other future REST subpaths on the Spring app.
app.use('/api-tours', (req, _res, next) => {
  console.log(`[GATEWAY] API-TOURS REST PASS ${req.method} ${req.originalUrl}`);
  console.log(`[GATEWAY] API-TOURS Headers:`, req.headers);
  console.log(`[GATEWAY] API-TOURS Body:`, req.body);
  next();
});

// Use the proxy *only if* the request is NOT one of our gRPC routes above
app.use(
  '/api-tours',
  createProxyMiddleware(
    (pathname, req) => {
      // exact /api-tours/tours (GET list or POST create) => handled by gRPC
      if (pathname === '/api-tours/tours' && (req.method === 'GET' || req.method === 'POST')) {
        return false;
      }
      // DELETE /api-tours/tours/:id => handled by gRPC
      if (req.method === 'DELETE' && /^\/api-tours\/tours\/[^/]+$/.test(pathname)) {
        return false;
      }
      // everything else => pass through to Spring REST
      return true;
    },
    {
      target: 'http://tour:8084',
      pathRewrite: { '^/api-tours': '' },
      changeOrigin: true,
      onProxyReq: (proxyReq, req) => {
        // Proslijedi Authorization header
        const auth = req.headers['authorization'];
        if (auth) proxyReq.setHeader('authorization', auth);
        
        // Za POST/PUT zahteve, proslijedi JSON body
        if (req.body && (req.method === 'POST' || req.method === 'PUT')) {
          const bodyData = JSON.stringify(req.body);
          proxyReq.setHeader('Content-Type', 'application/json');
          proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
          proxyReq.write(bodyData);
        }
      },
      ...commonProxyOpts,
    },
  ),
);

function grpcError(res, err, msg, requestId) {
  res.status(502).json({
    error: msg,
    grpc: { code: err?.code, details: err?.details, message: err?.message },
    requestId,
  });
}

app.get('/', (_req, res) => res.send('API Gateway is running!'));

app.listen(PORT, () => {
  console.log(`API Gateway started on port ${PORT}`);
  console.log(`[gateway] TOUR_GRPC_ADDR=${TOUR_GRPC_ADDR}`);
  console.log(`[gateway] PROTO_DIR=${PROTO_DIR}`);
});

app.use('/purchase', (req, res, next) => {
  console.log(`[GATEWAY] PURCHASE REQUEST: ${req.method} ${req.originalUrl}`);
  console.log(`[GATEWAY] PURCHASE Headers:`, req.headers);
  console.log(`[GATEWAY] PURCHASE Body:`, req.body);
  next();
});
app.use(
  '/purchase',
  jsonForwardingProxy({
    target: PURCHASE_URL,
    rewritePrefix: '^/purchase',
  })
);
console.log('[GATEWAY] purchase target =', PURCHASE_URL);
