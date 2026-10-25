const http = require('http');

const TARGET_PORT = 3001;
const TARGET_HOST = '127.0.0.1';
const LISTEN_PORT = 3000;
const API_KEY = 'freellmapi-e797e7ed1c9a29a2f89636cd474e9d1b5d984027a0b7edb6';

const server = http.createServer((clientReq, clientRes) => {
    // Add CORS headers
    clientRes.setHeader('Access-Control-Allow-Origin', '*');
    clientRes.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    clientRes.setHeader('Access-Control-Allow-Headers', '*');

    if (clientReq.method === 'OPTIONS') {
        clientRes.writeHead(200);
        clientRes.end();
        return;
    }

    const headers = { ...clientReq.headers };
    if (!headers['authorization']) {
        headers['authorization'] = `Bearer ${API_KEY}`;
    }
    headers['host'] = `${TARGET_HOST}:${TARGET_PORT}`;

    const proxyReq = http.request({
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: clientReq.url,
        method: clientReq.method,
        headers: headers
    }, (proxyRes) => {
        clientRes.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(clientRes, { end: true });
    });

    proxyReq.on('error', (err) => {
        console.error('Proxy Error:', err.message);
        clientRes.writeHead(502, { 'Content-Type': 'application/json' });
        clientRes.end(JSON.stringify({ error: 'Proxy Gateway Error', details: err.message }));
    });

    clientReq.pipe(proxyReq, { end: true });
});

server.listen(LISTEN_PORT, '0.0.0.0', () => {
    console.log(`FreeLLMAPI Port 3000 Gateway active: forwarding http://localhost:${LISTEN_PORT} -> http://${TARGET_HOST}:${TARGET_PORT}`);
});
