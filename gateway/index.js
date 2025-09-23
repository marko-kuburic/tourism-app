import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
const PORT = process.env.PORT || 8080;
const PURCHASE_URL = process.env.PURCHASE_URL || 'http://purchase:8085';



app.use('/blog', (req, res, next) => {
  console.log(`[GATEWAY] BLOG REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/blog', createProxyMiddleware({
  target: 'http://blog:8080',
  changeOrigin: true,
  pathRewrite: { '^/blog': '' }
}));


app.use('/following', (req, res, next) => {
  console.log(`[GATEWAY] FOLLOWING REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/following', createProxyMiddleware({
  target: 'http://following:8083',
  changeOrigin: true,
  pathRewrite: { '^/following': '' }
}));


app.use('/stakeholders', (req, res, next) => {
  console.log(`[GATEWAY] STAKEHOLDERS REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/stakeholders', createProxyMiddleware({
  target: 'http://backend:8081',
  changeOrigin: true,
  pathRewrite: { '^/stakeholders': '' }
}));


app.use('/tour', (req, res, next) => {
  console.log(`[GATEWAY] TOUR REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/tour', createProxyMiddleware({
  target: 'http://tour:8084',
  changeOrigin: true,
  pathRewrite: { '^/tour': '' }
}));

app.get('/', (req, res) => {
  res.send('API Gateway is running!');
});

app.listen(PORT, () => {
  console.log(`API Gateway started on port ${PORT}`);
});

app.use('/purchase', (req, res, next) => {
  console.log(`[GATEWAY] PURCHASE REQUEST: ${req.method} ${req.originalUrl}`);
  next();
});
app.use(
  '/purchase',
  createProxyMiddleware({
    target: PURCHASE_URL,
    changeOrigin: true,
    pathRewrite: { '^/purchase': '' },
    onProxyReq: (proxyReq, req) => {
      const auth = req.headers['authorization'];
      if (auth) proxyReq.setHeader('authorization', auth);
    },
  })
);
console.log('[GATEWAY] purchase target =', PURCHASE_URL);
