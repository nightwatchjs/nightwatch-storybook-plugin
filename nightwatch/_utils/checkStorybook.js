const http = require('http');
const https = require('https');

module.exports =  async function(targetUrl) {
  const request = targetUrl.startsWith('https://') ? https : http;

  return new Promise(resolve => {
    request(targetUrl, {method: 'HEAD'})
      .on('response', () => resolve(true))
      .on('error', () => resolve(false))
      .end();
  });
};
