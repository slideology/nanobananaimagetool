import '@testing-library/jest-dom'

// Mock Cloudflare Workers specific APIs
if (!global.crypto) {
  Object.defineProperty(global, 'crypto', {
    value: {
      randomUUID: () => 'test-uuid-' + Math.random().toString(36).substring(2, 15),
    },
    writable: true
  })
}

// Mock environment variables
process.env.NODE_ENV = 'test'

// Mock fetch if needed
if (!global.fetch) {
  global.fetch = (() => Promise.resolve({ 
    ok: true,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  } as any)) as any
}