const net = require('net')
const EventEmitter = require('events')
const MatrixStore = require('./MatrixStore')
const LabelStore = require('./LabelStore')
const CrossPointState = require('./CrossPointState')

/**
 * Implementation of Ross NK-IPS control
 * @class
 * @param {string} host
 * @param {int} [address=254] - TBUS Address of NK-IPS Itself 
 * @param {int} [inputs=255]
 * @param {int} [outputs=255]
 * @param {int} [levels=8]
 * @param {string} [labels] - String of .lbl file
 */
class NKIPS extends EventEmitter {
  constructor ({
    host,
    address = 254,
    inputs = 255,
    outputs = 255,
    levels = 8,
    labels
  }) {
    super()
    this.device = {}
    this.device.host = host
    this.device.port = 5000
    this.device.address = address
    this.device.inputs = inputs
    this.device.outputs = outputs
    this.device.levels = levels
    this.labels = new LabelStore({
      lblString: labels,
      inputs: inputs
    })
    this.matrix = new MatrixStore({
      inputs: inputs,
      outputs: outputs,
      labels: this.labels
    })
    this.init()
  }

  keepaliveInterval

  levelToInt = {
    'MD Video': 1,
    'SDI Video': 2,
    'AES Audio 1': 4,
    'AES Audio 2': 8,
    'Analog Video': 16,
    'Analog Audio 1': 32,
    'Analog Audio 2': 64,
    'Machine Control': 128
  }

  levelFromInt = {
    1: 'MD Video',
    2: 'SDI Video',
    4: 'AES Audio 1',
    8: 'AES Audio 2',
    16: 'Analog Video',
    32: 'Analog Audio 1',
    64: 'Analog Audio 2',
    128: 'Machine Control'
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

  STATUS = {
    DISABLED: 'Disabled',
    UNKNOWN: 'UNKNOWN',
    CLOSED: 'Disconnected',
    OK: 'OK',
    CONNECTING: 'Connecting',
    ERROR: 'Error',
    WARNING: 'Warning'
  }

  crc16 = buffer => {
    let crc = 0xFFFF
    let odd

    for (let i = 0; i < buffer.length; i++) {
      crc = crc ^ buffer[i]
    
      for (let j = 0; j < 8; j++) {
        odd = crc & 0x0001
        crc = crc >> 1
        if (odd) {
          crc = crc ^ 0xA001
        }
      }
    }

    crc = ((crc & 0xFF) << 8) | ((crc & 0xFF00) >> 8)
    return crc
  }

  decimalToHex = (decimal) => {
    return Number(decimal).toString(16)
  }

  padHex = (data, pad) => {
    while (data.length < pad) {
      data = '0' + data
    }
    return data
  }

  handleData = data => {
    if (!this.connected && data.slice(0, 7).toString() == 'Welcome') {
      this.connected = true
      this.socket.write(Buffer.from([0x50, 0x41, 0x53, 0x32, 0x00, 0x11, 0x4e, 0x4b, 0x32, 0x00, 0xfe, 0x02, 0x08, 0x00, 0x00, 0x00, 0x47, 0xff, 0xff, 0xff, 0xff, 0xc7, 0x08]))
    } else if (data.slice(0, 3).toString() === 'NK2') {
      if (data.length === 20) { // Handle Single Crosspoint
        const level = data.slice(12, 16).readInt16BE() + 1
        const source = data.slice(10, 12).readInt16BE() + 1
        const destination = data.slice(8, 10).readInt16BE() + 1
        this.matrix.setCrossPoint(this.levelFromInt[level], destination, source)
        this.getCrossPoint(destination).then(crosspoint => this.emit('crosspoint', crosspoint))
      } else { // Handle Entire Table
        let table = [...data.slice(0, data.length - 2).slice(16)]
        for (let i = 0; i < table.length; i++) {
         if ((i + 1) % 3 === 0) this.matrix.setCrossPoint(this.levelFromInt[1], (i + 1) / 3, Number(`${table[i - 2]}${table[i - 1]}`) + 1)
        }
        this.emit('ready')
      }
    }
  }

  init = () => {
    this.socket = net.createConnection(this.device.port, this.device.host)
    this.socket.setKeepAlive(true, 0)

    this.socket.on('connect', () => {
      this.device.status = this.STATUS.OK
      this.socket.write(Buffer.from([0x50, 0x48, 0x4f, 0x45, 0x4e, 0x49, 0x58, 0x2d, 0x44, 0x42, 0x20, 0x4e, 0x0a]))
    })
    
    this.keepaliveInterval = setInterval(() => {
      this.socket.write(Buffer.from([0x48, 0x49]))
    }, 10000)

    this.socket.on('error', (error) => {
      this.device.status = this.STATUS.ERROR
      this.emit('error', error)
    })

    this.socket.on('data', data => {
      this.handleData(data)
    })

    this.socket.on('close', () => {
      this.emit('close')
      this.connected = false
      switch (this.doNotRecreate) {
        case true:
          break
        case false:
          clearTimeout(this.keepaliveInterval)
          setTimeout(() => this.recreate(), 10000)
      }
    })
  }

  destroy = callback => {
    this.doNotRecreate = true

    if (this.socket) {
      this.socket.destroy()
    }

    clearTimeout(this.keepaliveTimeout)
    if (typeof callback === 'function') {
      callback()
    }
  }

  /**
   * getXPT
   * @method
   * @public
   * @param {int} destination - NK Destination Integer
   * @returns {object} Level State
   */
  getCrossPoint = d => new Promise(resolve => {
    if (typeof d === 'number') {
      resolve(new CrossPointState({ matrix: this.matrix, labels: this.labels, destination: d }))
    } else if (typeof d === 'object') {
      const crosspoints = []
      d.map(dst => crosspoints.push(new CrossPointState({ matrix: this.matrix, labels: this.labels, destination: dst })))
      resolve(crosspoints)
    }
  })

  /**
   * setXPT
   * @method
   * @public
   * @param {int} level - NK Level Integer
   * @param {int} destination - NK Destination Integer
   * @param {int} source - NK Source Integer
   * @returns {object} Level State
   */
  setCrossPoint = ({ level, destination, source }) => new Promise(resolve => {
    let b 
      = '4e4b3200' 
      + this.padHex(this.decimalToHex(this.device.address), 2)
      + '0409'
      + this.padHex(this.decimalToHex(destination - 1), 4)
      + this.padHex(this.decimalToHex(source - 1), 4)
      + this.padHex(this.decimalToHex(level), 8)
      + '00'
    const crc = this.crc16(Buffer.from(b, 'hex')).toString(16)
    b = '504153320012' + b + crc
    const buffer = Buffer.from(b, 'hex')
    this.socket.write(buffer)
    setTimeout(() => {
      resolve(this.getCrossPoint(destination))
    }, 10);
  })

  setLabel = (type, id, update) => {
    this.labels.setLabel(type, id, update)
  }
}

module.exports = NKIPS