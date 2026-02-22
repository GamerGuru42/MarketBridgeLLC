// Node script to emit a sample Paystack webhook POST with HMAC-SHA512 signature
// Usage: PAYSTACK_SECRET_KEY=sk_test_xxx node scripts/test_paystack_webhook.js

const http = require('http')
const crypto = require('crypto')

const secret = process.env.PAYSTACK_SECRET_KEY
if (!secret) {
  console.error('Set PAYSTACK_SECRET_KEY in env to run this script')
  process.exit(1)
}

const payload = JSON.stringify({
  event: 'charge.success',
  data: {
    id: 12345,
    reference: 'TEST-REF-123',
    amount: 100000,
    status: 'success',
    customer: { email: 'test@example.com', id: 'user-test' }
  }
})

const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex')

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/webhooks/paystack',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
    'x-paystack-signature': signature
  }
}

const req = http.request(options, (res) => {
  console.log('status', res.statusCode)
  res.setEncoding('utf8')
  res.on('data', (chunk) => console.log('body:', chunk))
})

req.on('error', (e) => console.error('request error', e))
req.write(payload)
req.end()
