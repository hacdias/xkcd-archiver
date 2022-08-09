#!/usr/bin/env node

import fs from 'fs-extra'
import yargs from 'yargs'
import * as url from 'url'
import { hideBin } from 'yargs/helpers'
import { basename, extname, join } from 'path'
import { getLatestId, getComic } from '../lib/xkcd.js'
import { homePage, comicPage } from '../lib/html.js'
import { pad, progress } from '../lib/helpers.js'

const argv = yargs(hideBin(process.argv))
  .usage('$0', 'Clones XKCD comics. By default it only downloads the missing comics.')
  .scriptName('xkcd-clone')
  .option('dir', {
    alias: 'd',
    describe: 'Output directory',
    type: 'string',
    demandOption: true
  }).option('empty', {
    alias: 'e',
    describe: 'Redownload all comics',
    type: 'boolean'
  })
  .help()
  .argv

async function write ({ data, img }, dir, latest) {
  const hasImage = img !== null

  try {
    await fs.outputJSON(join(dir, 'info.json'), data, { spaces: '\t' })
    await fs.outputFile(join(dir, 'index.html'), comicPage(data, latest, hasImage))

    if (hasImage) {
      await fs.outputFile(join(dir, basename(data.img)), Buffer.from(img))
      await fs.outputFile(join(dir, `image${extname(data.img)}`), Buffer.from(img))
    }
  } catch (err) {
    await fs.remove(dir)
    throw err
  }
}

async function run () {
  console.log(`😊 Going to clone XKCD to ${argv.dir}`)

  let added = []
  const errored = []

  let latest = null

  try {
    console.log('🔍 Finding the latest comic')
    latest = await getLatestId()
    console.log(`😁 Found! We're on comic number ${latest}!`)

    await fs.ensureDir(argv.dir)
    if (argv.empty) {
      await fs.emptyDir(argv.dir)
    }

    for (let i = 1; i <= latest; i++) {
      const num = pad(i, 4)
      const dir = join(argv.dir, num)

      progress(`📦 Fetching ${i} out of ${latest}`)

      if (await fs.pathExists(dir)) {
        const data = await fs.readJSON(join(dir, 'info.json'))
        added.push({ id: i, title: data.title, num })
        await fs.outputFile(join(dir, 'index.html'), comicPage(data, latest))
        continue
      } else if (i === 404) {
        continue
      }

      let comic = null

      const info = {
        id: i,
        dir: dir,
        num: num
      }

      try {
        comic = await getComic(i)
        info.title = comic.data.title
        await write(comic, dir, latest)
        added.push(info)
      } catch (err) {
        progress(`😢 Could not fetch ${i}, will try again later\n`)
        errored.push(info)
      }
    }
  } catch (err) {
    console.log(`🐉 ${err.stack}`)
    process.exit(1)
  }

  for (const info of errored) {
    const { id, dir, num } = info
    for (let i = 0; i < 3; i++) {
      try {
        const comic = await getComic(id)
        await write(comic, dir, latest)
        added.push(info)
        break
      } catch (err) {
        if (i === 2) {
          console.log(`😢 ${num} could not be fetched: ${err.toString()}`)
        }
      }
    }
  }

  if (errored.length === 0) {
    progress('📦 All comics fetched\n')
  } else {
    progress('📦 Some comics fetched\n')
  }

  const currDirectory = url.fileURLToPath(new URL('.', import.meta.url))

  added = added.sort((a, b) => a.num - b.num)
  await fs.remove(join(argv.dir, 'latest'))
  await fs.copy(join(argv.dir, pad(latest, 4)), join(argv.dir, 'latest'))
  await fs.copyFile(join(currDirectory, '../node_modules/tachyons/css/tachyons.min.css'), join(argv.dir, 'tachyons.css'))
  await fs.copyFile(join(currDirectory, '../node_modules/tachyons-columns/css/tachyons-columns.min.css'), join(argv.dir, 'tachyons-columns.css'))
  await fs.outputFile(join(argv.dir, 'index.html'), homePage(added))
}

run()
