const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

http.createServer((req, res) => {
    // Enable CORS for the proxy itself
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const query = url.parse(req.url, true).query;
    let targetUrl = query.url;

    if (!targetUrl) {
        res.writeHead(400);
        res.end('Missing "url" query parameter.');
        return;
    }

    console.log(`[Proxy] Routing to: ${targetUrl}`);

    const parsedUrl = url.parse(targetUrl);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
        path: parsedUrl.path,
        method: req.method,
        headers: {
            ...req.headers,
            host: parsedUrl.hostname,
        }
    };

    const proxyReq = protocol.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
        console.error(`[Proxy Error] ${err.message}`);
        res.writeHead(500);
        res.end(`Proxy error: ${err.message}`);
    });

    req.pipe(proxyReq);

}).listen(PORT, () => {
    console.log(`\x1b[32m%s\x1b[0m`, `PharmaCare CORS Proxy is running!`);
    console.log(`Target: http://localhost:${PORT}/?url=...`);
    console.log(`\x1b[33m%s\x1b[0m`, `HOW TO USE: Keep this terminal open while developing.`);
});
