const progress = (str) => {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(str)
}

const pad = (str, max) => {
  str = str.toString()
  return str.length < max ? pad('0' + str, max) : str
}

module.exports = {
  progress,
  pad
}
