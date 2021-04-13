class LabelStore {
  constructor ({
    lblString = ``,
    inputs
  }) {
    for (let i = 1; i < inputs; i++) {
      this.inputs[i] = { label: `In ${i}`, description: `Input ${i}`}
      this.outputs[i] = { label: `Out ${i}`, description: `Output ${i}`}
    }
    console.log(this.inputs)
    const rows = lblString.split('\n')
    rows.map(row => {
      const columns = row.split(',')
      this.inputs[columns[0]] = { label: columns[3], description: columns[4]}
      this.outputs[columns[0]] = { label: columns[1], description: columns[2]}
    })
  }

  inputs = []
  outputs = []

  toLBL = () => new Promise(resolve => {
    const labels = []
    for (let i = 1; i < this.inputs.length; i++) {
      labels.push(`${i},${this.outputs[i]?.label ?? ''},${this.outputs[i]?.description ?? ''},${this.inputs[i]?.label ?? ''},${this.inputs[i]?.description ?? ''},,`)
    }
    resolve(labels.join('\n'))
  })

  getLabel = (type, id) => {
    if (type === 'input') return inputs[id + 1]
    else if (type === 'output') return outputs[id + 1]
    else return null
  }

  setLabel = (type, id, update) => {
    console.log(type, id, update)
    if (type === 'input') {
      console.log(type, id, update)
      this.inputs[id].label = update.label ?? this.inputs[id].label;
      this.inputs[id].description = update.description ?? this.inputs[id].description;
    }
    if (type === 'output') {
      console.log(type, id, update)
      this.outputs[id].label = update.label ?? this.outputs[id].label;
      this.outputs[id].description = update.description ?? this.outputs[id].description;
      console.log(this.outputs[id])
    }
  }

}

module.exports = LabelStore