const fetch = require('node-fetch')
const path = require('path')

async function getLatestId () {
  const raw = await fetch(`https://xkcd.com/info.0.json`)
  const data = await raw.json()
  return data.num
}

async function getImage (url) {
  const ext = path.extname(url)
  const url2x = `${path.dirname(url)}/${path.basename(url, ext)}_2x${ext}`

  let res = await fetch(url2x)
  if (!res.ok) {
    res = await fetch(url)
  }

  if (!res.ok) {
    throw new Error('bad image request')
  }

  return res.buffer()
}

async function getComic (id) {
  const raw = await fetch(`https://xkcd.com/${id}/info.0.json`)
  const data = await raw.json()
  const img = await getImage(data.img)

  return { data, img }
}

module.exports = {
  getLatestId,
  getComic
}
