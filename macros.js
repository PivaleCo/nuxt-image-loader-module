const macros = {
  scaleAndCrop: function(width, height, gravity = 'Center') {
    return [`gravity|${gravity}`, `resize|${width}|${height}^`, `extent|${width}|${height}|+0|+${height / 2}`]
  }
}

module.exports = macros