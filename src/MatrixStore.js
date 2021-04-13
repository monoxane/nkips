class MatrixStore {
  constructor ({
    inputs = 255,
    outputs = 255,
  }) {
    this.inputs = inputs
    this.outputs = outputs
    this.generateMatrix()
  } 

  levels = [
    'MD Video',
    'SDI Video',
    'AES Audio 1',
    'AES Audio 2',
    'Analog Video',
    'Analog Audio 1',
    'Analog Audio 2',
    'Machine Control'
  ]

  generateMatrix = () => {
    for (let i = 0; i < 7; i++) {
      this.crosspoints[this.levels[i]] = new Array(this.outputs)
      this.crosspoints[this.levels[i]][0] = 0
    }
  }

  getCrossPoint = (level, destination) => {
    return this.crosspoints[level]?.[destination]
  }

  setCrossPoint = (level, destination, source, callback) => {
    if (!!level && !!destination && !!source) this.crosspoints[level][destination] = source
    if (typeof callback === 'function') callback(this.getCrossPoint(level, destination))
  }
  
  crosspoints = {}
}

module.exports = MatrixStore