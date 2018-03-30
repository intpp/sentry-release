const fetch = require('node-fetch');

function request(url, options) {
  return fetch(url, options).then(parseResponse);
}

function log(...args) {
  console.log('[SentryRelease]', ...args);
}

function parseJson(data, defaultValue = null) {
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}

async function parseResponse(response) {
  let responseBody = await response.text();

  responseBody = parseJson(responseBody, responseBody);

  if (response.status > 208) {
    return { status: response.status, error: responseBody };
  }

  return { status: response.status, data: responseBody };
}

module.exports = {
  log,
  parseJson,
  parseResponse,
  request,
};
