/*

Based on https://github.com/sindresorhus/import-modules

The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

'use strict'
const fs = require('fs')
const path = require('path')

// Prevent caching of this module so module.parent is always accurate
delete require.cache[__filename]
const parentFile = module.parent.filename
const parentDir = path.dirname(parentFile)

export default (dir, opts) => {
  dir = path.resolve(parentDir, dir || '')
  opts = Object.assign({ camelize: true }, opts)

  let files

  try {
    files = fs.readdirSync(dir)
  } catch (err) {
    return {}
  }

  const done = new Set()
  const ret = {}

  // Adhere to the Node.js require algorithm by trying each extension in order
  for (const ext of Object.keys(require.extensions)) {
    for (const file of files) {
      const stem = path.basename(file).replace(/\.\w+$/, '')
      const fullPath = path.join(dir, file)

      if (
        done.has(stem) ||
        fullPath === parentFile ||
        path.extname(file) !== ext ||
        stem[0] === '_' ||
        stem[0] === '.'
      ) {
        continue
      }

      const exportKey = opts.camelize ? stem.replace(/-(\w)/g, (m, p1) => p1.toUpperCase()) : stem

      ret[exportKey] = require(fullPath)
      done.add(stem)
    }
  }

  let result = {}

  Object.entries(ret).map(([fileName, value]) => {
    Object.entries(value).map(([methodName, func]) => {
      const key = methodName !== 'default' ? methodName : fileName
      result = { ...result, [key]: func }
    })
  })

  return result
}
