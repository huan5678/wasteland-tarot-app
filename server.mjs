import { createServer } from 'https'
import { parse } from 'url'
import next from 'next'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = 3000

// HTTPS 設定
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '.cert/localhost-key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '.cert/localhost.pem'))
}

// Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, (err) => {
    if (err) throw err
    console.log(`> Ready on https://localhost:${port}`)
    console.log(`> Network: https://192.168.1.173:${port}`)
    console.log('')
    console.log('⚠️  Self-signed certificate - you may need to accept security warning')
    console.log('   在 iOS Safari: 點擊「顯示詳細資料」→「瀏覽此網站」')
  })
})
