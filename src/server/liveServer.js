import http from 'node:http'
import { URL } from 'node:url'
import { loadEnv } from './env.js'
import { handleLiveApi } from './liveApi.js'

loadEnv()

const PORT = Number(process.env.LIVE_AGENT_PORT || 8787)
const BODY_LIMIT_BYTES = 1024 * 1024

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'OPTIONS') {
    writeResponse(res, {
      status: 204,
      headers: {},
      body: '',
    })
    return
  }

  try {
    const body = await readJsonBody(req)
    const response = await handleLiveApi({
      method: req.method,
      pathname: url.pathname,
      body,
    })
    writeResponse(res, response)
  } catch (error) {
    const status = error.statusCode || 500
    writeResponse(res, {
      status,
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: status === 500 ? 'Internal server error' : error.message,
        detail: status === 500 ? error.message : undefined,
      }),
    })
  }
})

server.listen(PORT, () => {
  console.log(`[live-agent] listening on http://localhost:${PORT}`)
})

function readJsonBody(req) {
  if (req.method === 'GET' || req.method === 'HEAD') return Promise.resolve(null)

  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (Buffer.byteLength(raw) > BODY_LIMIT_BYTES) {
        const error = new Error('Request body too large')
        error.statusCode = 413
        reject(error)
        req.destroy()
      }
    })
    req.on('end', () => {
      if (!raw.trim()) {
        resolve(null)
        return
      }

      try {
        resolve(JSON.parse(raw))
      } catch {
        const error = new Error('Invalid JSON body')
        error.statusCode = 400
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function writeResponse(res, response) {
  res.writeHead(response.status, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    ...response.headers,
  })
  res.end(response.body)
}
