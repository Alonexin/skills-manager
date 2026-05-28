// Generate icons for Skills Manager
// Creates icon.svg (master), icon.png (SVG-based), and icon.ico (multi-res BMP)
const fs = require('fs')
const path = require('path')
const zlib = require('zlib')

const publicDir = path.join(__dirname, '..', 'public')

// ====== SVG Icon ======
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5"/>
      <stop offset="100%" style="stop-color:#7C3AED"/>
    </linearGradient>
    <linearGradient id="fg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#A78BFA"/>
      <stop offset="100%" style="stop-color:#C4B5FD"/>
    </linearGradient>
  </defs>
  <!-- Background -->
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <!-- Inner shape: stylized S + M -->
  <g transform="translate(256,256)">
    <!-- S-like curve -->
    <path d="M-80,-60 C-120,-60 -140,-30 -140,0 C-140,30 -120,50 -80,50 L80,50 C100,50 110,70 100,85 C90,100 70,110 40,110 L-100,110"
      fill="none" stroke="url(#fg)" stroke-width="52" stroke-linecap="round" stroke-linejoin="round"
      transform="translate(0,-30)"/>
    <!-- M-like sharp peaks (simplified as two inverted V's) -->
    <path d="M-90,10 L-50,-80 L-10,10 L30,-80 L70,10"
      fill="none" stroke="white" stroke-width="36" stroke-linecap="round" stroke-linejoin="round"
      opacity="0.85"
      transform="translate(0,25)"/>
  </g>
</svg>`

fs.writeFileSync(path.join(publicDir, 'icon.svg'), svg, 'utf-8')
console.log('  Created icon.svg')

// ====== Simple PNG (8-bit colormap, 64x64) ======
// We create a simple PNG with a solid indigo color and "SM" rendered via pixels
// Using pure buffer construction to avoid any dependency

function createPNG(width, height, pixelFn) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  // IHDR chunk
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(width, 0)
  ihdrData.writeUInt32BE(height, 4)
  ihdrData[8] = 8  // bit depth
  ihdrData[9] = 6  // color type: RGBA
  ihdrData[10] = 0 // compression
  ihdrData[11] = 0 // filter
  ihdrData[12] = 0 // interlace
  const ihdr = createChunk('IHDR', ihdrData)

  // IDAT - raw image data
  const rawData = Buffer.alloc(height * (1 + width * 4))
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0 // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height)
      const offset = y * (1 + width * 4) + 1 + x * 4
      rawData[offset] = r
      rawData[offset + 1] = g
      rawData[offset + 2] = b
      rawData[offset + 3] = a
    }
  }
  const compressed = zlib.deflateSync(rawData)
  const idat = createChunk('IDAT', compressed)

  // IEND
  const iend = createChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdr, idat, iend])
}

function createChunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const typeAndData = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = crc32(typeAndData)
  const crcBuf = Buffer.alloc(4)
  crcBuf.writeUInt32BE(crc >>> 0, 0)
  return Buffer.concat([length, typeAndData, crcBuf])
}

// CRC32 table
const crcTable = new Uint32Array(256)
for (let i = 0; i < 256; i++) {
  let c = i
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
  }
  crcTable[i] = c
}

function crc32(buf) {
  let c = 0xFFFFFFFF
  for (let i = 0; i < buf.length; i++) {
    c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)
  }
  return (c ^ 0xFFFFFFFF) >>> 0
}

// Pixel function: rounded rect with gradient + SM letters
function pixelFn(x, y, w, h) {
  const cx = w / 2, cy = h / 2

  // Rounded rect check
  const r = w * 0.18
  const inRect = (px, py) => {
    if (px < r && py < r) {
      const dx = r - px, dy = r - py
      return Math.sqrt(dx * dx + dy * dy) <= r
    }
    if (px > w - r && py < r) {
      const dx = px - (w - r), dy = r - py
      return Math.sqrt(dx * dx + dy * dy) <= r
    }
    if (px < r && py > h - r) {
      const dx = r - px, dy = py - (h - r)
      return Math.sqrt(dx * dx + dy * dy) <= r
    }
    if (px > w - r && py > h - r) {
      const dx = px - (w - r), dy = py - (h - r)
      return Math.sqrt(dx * dx + dy * dy) <= r
    }
    return true
  }

  if (!inRect(x, y)) return [0, 0, 0, 0]

  // Gradient background
  const t = (x + y) / (w + h)
  const r2 = Math.floor(79 * (1 - t) + 124 * t)
  const g2 = Math.floor(70 * (1 - t) + 58 * t)
  const b2 = Math.floor(229 * (1 - t) + 237 * t)

  // Draw simplified "S" and "M" using pixel math
  const scale = w / 512
  const dx = x - cx
  const dy = y - cy

  // S shape (top half)
  const sTop = Math.abs(dy + 60 * scale) < 26 * scale && Math.abs(dx) < 100 * scale && dx > -90 * scale
  const sMid = Math.abs(dy) < 26 * scale && Math.abs(dx + 60 * scale) < 24 * scale
  const sBot = Math.abs(dy - 60 * scale) < 26 * scale && Math.abs(dx) < 100 * scale && dx < 90 * scale

  // M shape (bottom area)
  const inM = dy > 0 && Math.abs(dy - 80 * scale) < 18 * scale &&
    (Math.abs(dx + 60 * scale) < 35 * scale ||
     Math.abs(dx) < 30 * scale ||
     Math.abs(dx - 60 * scale) < 35 * scale)

  const isGlyph = sTop || sMid || sBot || inM

  if (isGlyph) {
    return [255, 255, 255, 220 + Math.floor(35 * (y / h))]
  }
  return [r2, g2, b2, 255]
}

// Generate PNGs at multiple sizes
const sizes = [64, 128, 256]
for (const size of sizes) {
  const png = createPNG(size, size, pixelFn)
  const filename = size === 256 ? 'icon.png' : `icon-${size}.png`
  fs.writeFileSync(path.join(publicDir, filename), png)
  console.log(`  Created ${filename}`)
}

// ====== ICO file ======
// ICO with 32x32 and 16x16 entries
function createICO(sizes) {
  const images = sizes.map(size => {
    const png = createPNG(size, size, pixelFn)
    return { width: size, height: size, data: png }
  })

  // ICO header: reserved(2) + type(2) + count(2) = 6 bytes
  const count = images.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)  // reserved
  header.writeUInt16LE(1, 2)  // type: ICO
  header.writeUInt16LE(count, 4)

  // Directory entries: 16 bytes each
  const dirSize = count * 16
  const dir = Buffer.alloc(dirSize)
  let offset = 6 + dirSize

  for (let i = 0; i < count; i++) {
    const img = images[i]
    const w = img.width >= 256 ? 0 : img.width  // 256 -> 0 in ICO
    const h = img.height >= 256 ? 0 : img.height
    const entry = Buffer.alloc(16)
    entry.writeUInt8(w, 0)
    entry.writeUInt8(h, 1)
    entry.writeUInt8(0, 2)   // palette
    entry.writeUInt8(0, 3)   // reserved
    entry.writeUInt16LE(1, 4) // color planes
    entry.writeUInt16LE(32, 6) // bpp
    entry.writeUInt32LE(img.data.length, 8) // size
    entry.writeUInt32LE(offset, 12) // offset
    dir.set(entry, i * 16)
    offset += img.data.length
  }

  const imageData = Buffer.concat(images.map(i => i.data))
  return Buffer.concat([header, dir, imageData])
}

const ico = createICO([16, 32, 48, 256])
fs.writeFileSync(path.join(publicDir, 'icon.ico'), ico)
console.log('  Created icon.ico (16,32,48,256)')
console.log('Done!')
