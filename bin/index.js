#!/usr/bin/env node

const fs = require('fs-extra')
const yargs = require('yargs')
const { basename, join } = require('path')
const { getLatestId, getComic } = require('../lib/xkcd')
const { homePage, comicPage } = require('../lib/html')
const { pad, progress } = require('../lib/helpers')

const argv = yargs
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

async function write ({ data, img }, dir) {
  try {
    await fs.outputJSON(join(dir, 'info.json'), data, { spaces: '\t' })
    const dest = fs.createWriteStream(join(dir, basename(data.img)))
    img.body.pipe(dest)
    await fs.outputFile(join(dir, 'index.html'), comicPage(data))
  } catch (err) {
    await fs.remove(dir)
    throw err
  }
}

async function run () {
  console.log(`😊 Going to clone XKCD to ${argv.dir}`)

  let added = []
  let errored = []

  try {
    console.log(`🔍 Finding the latest comic`)
    const latest = await getLatestId()
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
        await fs.outputFile(join(dir, 'index.html'), comicPage(data))
        continue
      } else if (i === 404) {
        continue
      }

      let comic = null

      const info = {
        id: i,
        title: comic.data.title,
        dir: dir,
        num: num
      }

      try {
        comic = await getComic(i)
        await write(comic, dir)
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
        await write(comic, dir)
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
    progress(`📦 All comics fetched\n`)
  } else {
    progress(`📦 Some comics fetched\n`)
  }

  added = added.sort((a, b) => a.num - b.num)
  await fs.copyFile(join(__dirname, '../node_modules/tachyons/css/tachyons.min.css'), join(argv.dir, 'tachyons.css'))
  await fs.outputFile(join(argv.dir, 'index.html'), homePage(added))
}

run()
