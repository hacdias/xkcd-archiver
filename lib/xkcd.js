const fetch = require('node-fetch')

async function getLatestId () {
  const raw = await fetch(`https://xkcd.com/info.0.json`)
  const data = await raw.json()
  return data.num
}

async function getComic (id) {
  const raw = await fetch(`https://xkcd.com/${id}/info.0.json`)
  const data = await raw.json()
  const img = await fetch(data.img)

  return { data, img }
}

module.exports = {
  getLatestId,
  getComic
}
