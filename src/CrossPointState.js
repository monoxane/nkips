class CrossPointState {
  constructor ({
    matrix,
    labels,
    destination
  }) {
    this.id = destination
    this.label = labels.outputs[destination].label
    this.description = labels.outputs[destination].description
    this.sources = []
    matrix.levels.map((level, index) => {
      const source = matrix.getCrossPoint(level, destination)
      this.sources.push({
        level: level,
        id: source,
        ...labels.inputs[source]
      })
    })
  }
}

module.exports = CrossPointState