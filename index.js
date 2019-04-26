const fetch = require('node-fetch')
const fs = require('fs-extra')
const { basename, join } = require('path')

const progress = (str) => {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(str)
}

const pad = (str, max) => {
  str = str.toString()
  return str.length < max ? pad('0' + str, max) : str
}

const fetchLatest = () => {
  return fetch(`https://xkcd.com/info.0.json`)
    .then(res => res.json())
}

const fetchId = (id) => {
  return fetch(`https://xkcd.com/${id}/info.0.json`)
    .then(res => res.json())
}

const download = async (baseDir, i) => {
  const num = pad(i, 4)
  const res = await fetchId(i)
  const dir = join(baseDir, num)

  try {
    await fs.outputJSON(join(dir, 'info.json'), res, { spaces: '\t' })

    const img = await fetch(res.img)
    const dest = fs.createWriteStream(join(dir, basename(res.img)))

    await fs.outputFile(join(dir, 'index.html'), htmlPage(res))
    img.body.pipe(dest)
  } catch (err) {
    await fs.remove(dir)
    throw err
  }
}

const htmlPage = ({ alt, title, transcript, num, img }) => {
  const btnClass = 'dib navy  pa2 bg-light-blue bg-animate hover-bg-blue br2 ba bw1 b--navy no-underline'

  return `<html>
<head>
  <title>${num} - ${title}</title>
  <link rel="stylesheet" href="https://unpkg.com/tachyons@4.10.0/css/tachyons.min.css"/>
</head>
<body class="bg-washed-blue navy sans-serif ml-auto mr-auto mw7">
    <h1 class="mh0 mt4 mb3 f2 small-caps tracked">${title} <span class="light-blue">#${num}</span></h1>

  <nav>
    <a class="${btnClass}" href="../${pad(num - 1, 4)}/index.html">Prev</a>
    <a class="${btnClass}" href="../">Home</a>
    <a class="${btnClass}" href="../${pad(num + 1, 4)}/index.html">Next</a>
  </nav>

  <img src="./${basename(img)}" alt="${alt}">
  <p>${transcript}</p>
</body>
</html>`
}

const clone = async ({ baseDir, empty, onlyMissing }) => {
  console.log(`😊 Going to clone XKCD to ${baseDir}`)

  let errored = []

  try {
    console.log(`🔍 Finding the latest comic`)
    const latest = (await fetchLatest()).num
    console.log(`😁 Found! Will download ${latest} comics 🥶`)

    await fs.ensureDir(baseDir)
    if (empty) await fs.emptyDir(baseDir)

    let existent = []
    if (onlyMissing) {
      existent = fs.readdirSync(baseDir).map(v => Number(v.split('-')[0].trim()))
    }

    for (let i = 1; i <= latest + 1; i++) {
      if (existent.includes(i)) {
        continue
      } else if (i === 404) {
        progress(`📦 404 not found 😵`)
        continue
      } else if (i === latest + 1) {
        progress(`📦 All ${latest} comics fetched\n`)
        continue
      } else {
        progress(`📦 Fetching ${i} out of ${latest}`)
      }

      try {
        await download(baseDir, i)
      } catch (err) {
        errored.push(i)
      }
    }
  } catch (err) {
    console.log(`🐉 ${err.stack}`)
    process.exit(1)
  }

  for (const num of errored) {
    for (let i = 0; i < 3; i++) {
      try {
        await download(baseDir, i)
        break
      } catch (err) {
        if (i === 2) {
          console.log(`😢 ${num} could not be fetched: ${err.toString()}`)
        }
      }
    }
  }
}

clone({
  baseDir: './clone',
  empty: true,
  onlyMissing: false
})
