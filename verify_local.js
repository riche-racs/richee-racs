const http = require('http');
const get = (path) => new Promise((resolve, reject) => {
  http.get({ hostname: '127.0.0.1', port: 3000, path, agent: false }, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
  }).on('error', reject);
});
(async () => {
  try {
    const page = await get('/grey-crewneck.html');
    console.log('PAGE', page.status, page.headers['content-type']);
    const api = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/checkout',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.write(JSON.stringify({ cart: [] }));
      req.end();
    });
    console.log('API', api.status, api.body);
  } catch (error) {
    console.error(error);
  }
})();