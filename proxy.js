const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;
const TARGET_BASE = 'http://148.230.114.124:8080';

http.createServer((req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const targetUrl = `${TARGET_BASE}${req.url}`;
    console.log(`[Proxy] ${req.method} ${req.url}`);

    const parsedUrl = url.parse(targetUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 80,
        path: parsedUrl.path,
        method: req.method,
        headers: {
            ...req.headers,
            host: parsedUrl.hostname,
        }
    };

    let headersSent = false;

    const proxyReq = protocol.request(options, (proxyRes) => {
        if (headersSent) return;
        headersSent = true;
        res.writeHead(proxyRes.statusCode, {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': proxyRes.headers['content-type'] || 'application/json',
        });
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error(`[Proxy Error] ${err.message}`);
        if (!headersSent) {
            headersSent = true;
            res.writeHead(502);
            res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
        }
    });

    req.pipe(proxyReq);

}).listen(PORT, () => {
    console.log('\x1b[32m%s\x1b[0m', '=========================================');
    console.log('\x1b[32m%s\x1b[0m', '  PharmaCare Proxy Running on port 3000  ');
    console.log('\x1b[32m%s\x1b[0m', `  -> ${TARGET_BASE}`);
    console.log('\x1b[32m%s\x1b[0m', '=========================================');
});
