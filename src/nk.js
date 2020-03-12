import net from 'net'

class NKIPS {
  constructor (_host, _port) {
    this.socket = net.connect(_port, _host)
  }

  xpt (_output, _input, _level, _flags) {
    let levelMask = 0b00000000000000000000000000000001
    switch (_level) {
      case 'MD Vid': levelMask = 0b00000000000000000000000000000001; break
      case 'SDI Vid': levelMask = 0b00000000000000000000000000000010; break
      case 'AES Aud 1': levelMask = 0b00000000000000000000000000000100; break
      case 'AES Aud 2': levelMask = 0b00000000000000000000000000001000; break
      case 'An Vid': levelMask = 0b00000000000000000000000000010000; break
      case 'An Aud 1': levelMask = 0b00000000000000000000000000100000; break
      case 'An Aud 2': levelMask = 0b00000000000000000000000001000000; break
      case 'Mach Ctrl': levelMask = 0b00000000000000000000000010000000; break
    }
    // var packet = this.createSwitchReq(_output, _input, levelMask, _flags)
    this.socket.write(this.createSwitchReq(_output, _input, levelMask, _flags))
  }

  createSwitchReq (_output, _input, _levelMask, _flags) {
    var data = []
    data[0] = 'N'
    data[1] = 'K'
    data[2] = '2'
    data[3] = 4
    data[4] = _output >> 8
    data[5] = _output & 0xFF
    data[6] = _input >> 8
    data[7] = _input & 0xFF
    data[8] = _levelMask >> 24 & 0xFF
    data[9] = _levelMask >> 16 & 0xFF
    data[10] = _levelMask >> 8 & 0xFF
    data[11] = _levelMask & 0xFF
    data[12] = _flags
    const packet = Buffer.from(data)
    console.log(packet)
    return (packet)
  }

  levels () {
    return [
      'MD Vid',
      'SDI Vid',
      'AES Aud 1',
      'AES Aud 2',
      'An Vid',
      'An Aud 1',
      'An Aud 2',
      'Mach Ctrl'
    ]
  }
}

export default NKIPS
