const { basename } = require('path')
const { pad, escapeHtml } = require('./helpers')

const credits = '<p class="mv4 tc f6 small-caps">This work is licensed under a Creative Commons Attribution-NonCommercial 2.5 License.<br>Originally from <a target="_blank" class="blue hover-dark-blue no-underline" href="https://xkcd.com/">xkcd.com</a>.</p>'

const classes = {
  body: 'bg-washed-blue navy sans-serif ml-auto mr-auto w-90',
  title: 'tc mh0 mt4 mb3 f2 small-caps tracked',
  btn: 'dib navy mh2 pa2 bg-light-blue hover-bg-lightest-blue br2 ba bw1 b--navy no-underline'
}

const comicPage = ({ alt, title, transcript, num, img }, latest) => `<html>
<head>
  <title>${num} - ${title}</title>
  <meta charset=utf-8>
  <meta name=viewport content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="../tachyons.css"/>
  <link rel="stylesheet" href="../tachyons-columns.css"/>
</head>
<body class="${classes.body} mw7 tc">
  <h1 class="${classes.title}">${title} <span class="light-blue">#${num}</span></h1>

  <nav class="mv3">
    <a class="${classes.btn}" href="${num !== 1 ? `../${pad(num - 1, 4)}/index.html` : '#'}"><span class="gray">←</span> Prev</a>
    <a class="${classes.btn}" href="../index.html">Home</a>
    <a class="${classes.btn}" href="${num !== latest ? `../${pad(num + 1, 4)}/index.html` : '#'}">Next <span class="gray">→</span></a>
  </nav>

  <img src="./${basename(img)}" title="${alt.replace('"', '&quot;')}">
  <p class="dn">${escapeHtml(transcript)}</p>
  ${credits}
</body>
</html>`

const homePage = (list) => `<html>
<head>
  <title>XKCD</title>
  <meta charset=utf-8>
  <meta name=viewport content="width=device-width,initial-scale=1">
  <meta name="robots" content="noindex">
  <link rel="stylesheet" href="./tachyons.css"/>
  <link rel="stylesheet" href="./tachyons-columns.css"/>
</head>
<body class="${classes.body} mw8">
  <script>
  function goToRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
  }
  </script>
  <h1 class="${classes.title}">XKCD</h1>

  <nav class="mv3 tc">
    <a class="${classes.btn}" id="random" href="">Random</a>
    <a class="${classes.btn}" href="${pad(list[list.length - 1].num, 4)}/index.html">Latest</a>
  </nav>

  <ul class="list pa0 ma0 cc2-m cc3-l">
  ${list.map(({ id, title, num }) => `<li class="mv1">
    <a class="blue hover-dark-blue no-underline" href="./${num}/index.html"><span class="b">${id}</span> - ${title}</a>
  </li>`).join('\n')}
  </ul>

  <script>
  var el = document.getElementById('random')
  var comics = document.querySelector('.list').children
  el.href = comics[Math.floor(Math.random() * (comics.length))].querySelector('a').href
  </script>
  ${credits}
</body>
</html>`

module.exports = {
  comicPage,
  homePage
}
