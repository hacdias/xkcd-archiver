const { basename } = require('path')
const { pad } = require('./helpers')

const credits = '<p class="f6 small-caps">This work is licensed under a Creative Commons Attribution-NonCommercial 2.5 License.<br>Originally from <a target="_blank" class="blue hover-dark-blue no-underline" href="https://xkcd.com/">xkcd.com</a>.</p>'

const comicPage = ({ alt, title, transcript, num, img }) => {
  const btnClass = 'dib navy mh2 pa2 bg-light-blue hover-bg-lightest-blue br2 ba bw1 b--navy no-underline'

  return `<html>
<head>
  <title>${num} - ${title}</title>
  <meta charset=utf-8>
  <meta name=viewport content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="../tachyons.css"/>
</head>
<body class="tc bg-washed-blue navy sans-serif ml-auto mr-auto mw7 w-90">
  <h1 class="mh0 mt4 mb3 f2 small-caps tracked">${title} <span class="light-blue">#${num}</span></h1>

  <nav class="mv3">
    <a class="${btnClass}" href="../${pad(num - 1, 4)}/index.html"><span class="gray">←</span> Prev</a>
    <a class="${btnClass}" href="../index.html">Home</a>
    <a class="${btnClass}" href="../${pad(num + 1, 4)}/index.html">Next <span class="gray">→</span></a>
  </nav>

  <img src="./${basename(img)}" alt="${alt}">
  <p class="dn">${transcript}</p>
  ${credits}
</body>
</html>`
}

const homePage = (list) => `<html>
<head>
  <title>XKCD</title>
  <meta charset=utf-8>
  <meta name=viewport content="width=device-width,initial-scale=1">
  <link rel="stylesheet" href="./tachyons.css"/>
</head>
<body class="bg-washed-blue navy sans-serif ml-auto mr-auto mw7 w-90">
  <h1 class="tc mh0 mt4 mb3 f2 small-caps tracked">XKCD</h1>

  <ul class="list pa0 ma0">
  ${list.map(({ id, title, num }) => `<li><a class="blue hover-dark-blue no-underline" href="./${num}/index.html">${id} - ${title}</a></li>`).join('\n')}
  </ul>
  ${credits}
</body>
</html>`

module.exports = {
  comicPage,
  homePage
}
