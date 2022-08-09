import fetch from 'node-fetch'
import path from 'path'

export async function getLatestId () {
  const raw = await fetch('https://xkcd.com/info.0.json')
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

  return res.arrayBuffer()
}

export async function getComic (id) {
  const raw = await fetch(`https://xkcd.com/${id}/info.0.json`)
  const data = await raw.json()
  let img = null

  // Some comics, such as 1608 and 1663, are composed by interactive
  // games and cannot be downloaded as images, so we just ignore them.
  if (data.img !== 'https://imgs.xkcd.com/comics/') {
    img = await getImage(data.img)
  }

  return { data, img }
}
