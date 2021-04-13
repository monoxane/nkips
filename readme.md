# Ross NK Router Control
This package provides control, state management, and monitoring of Ross NK router systems via an NK-IPS network gateway, it may also work via an NK-NET gateway but has not been tested to do so.

## Getting Started
Add `nkips` with yarn or npm.

```js
const NKIPS = require('nkips')

const router = new NKIPS({
  host: '10.0.10.2', // IP Address of NK-IPS Gateway
  address: 254, // TBUS Address of NK-IPS Gateway
  inputs: 72, // Input count of largest component in the system
  outputs: 72, // Output count of largest component in the system
  levels: 1, // How many signal levels your system contains, elaborated on below
  labels: labels // String of DashBoard Global Labels CSV file
})

router.on('ready', () => {
  router.getCrossPoint(67).then(crosspoint => console.log(crosspoint))
  router.setLabel('output', 67, { label: 'VREM IP 1', description: 'A VOID TO SEND VIDEO TO'})
  router.getCrossPoint([67, 68, 69]).then(console.log)
})

router.on('crosspoint', (crosspoint) => console.log(crosspoint))
```

## API
### NKIPS()
`NKIPS` is the root class of the whole platform, it provides all the methods required to set or get crosspoint states, as well as manage labels and descriptions for inputs and outputs.

The constructor requires an object with the following signature to initialise the system and connect to the NK-IPS
```js
{
  host: string, // IP Address of NK-IPS Gateway
  address: int, // TBUS Address of NK-IPS Gateway
  inputs: int, // Input count of largest component in the system
  outputs: int, // Output count of largest component in the system
  levels: int, // How many signal levels your system contains, elaborated on below
  labels: string // String of DashBoard Global Labels CSV file
}
``` 

### router.getCrossPoint()
`router.getCrossPoint` returns a Promise with the state of the requested crosspoint, it takes either a single integer or an array of integers and returns either a CrossPointState class or an array of them for the requested crosspoints.

```js
  router.getCrossPoint(67).then(crosspoint => console.log(crosspoint))

  > CrossPointState {
    id: 67,
    label: 'VOIDBOX',
    description: 'A Place to Throw Signals',
    sources: [
      {
        level: 'MD Video',
        id: 1,
        label: 'A SOURCE',
        description: 'Something That Makes Signal'
      },
      { level: 'SDI Video', id: undefined },
      { level: 'AES Audio 1', id: undefined },
      { level: 'AES Audio 2', id: undefined },
      { level: 'Analog Video', id: undefined },
      { level: 'Analog Audio 1', id: undefined },
      { level: 'Analog Audio 2', id: undefined },
      { level: 'Machine Control', id: undefined }
    ]
}
```

### router.setCrossPoint()
`router.setCrossPoint` allows you to set the state of a crosspoint in the router system on any valid level. The way levels are handled is a bit interesting so currently you have to set each level seperately, plans to implement multilevel routing using either a levelMask or array of levels is underway.

Valid signal levels can be read from `router.levels`, due to some internal shenanigans relating to TBUS masks, these must be reference with an integer version of the levelMask for this level which can be obtained with `router.levelToInt[levelName]`

This method currently returns nothing due to the way state is handled, you should listen for a crosspoint event to determine if the route has been made.

```js
  router.setCrossPoint({
    level: router.levelToInt['MD Video'],
    destination: 67, 
    source: 2
  })
```

### router.setLabel()
`router.setLabel` allows you to update the label for an input or output, either the label or description can be left null or undefined to retain the current value.

```js
  router.setLabel(
    'output', // 'output' or 'input'
    67, // ID of IO
    {
      label: 'TEST', // Label to set
      description: 'A VOID TO SEND SIGNALS' // Description to set
    }
  )
```

### router.labels.toLBL()
This method allows you to dump the LabelStore to a DashBoard compliant CSV for saving as an .lbl file.

```js
  router.labels.toLBL().then(labels => console.log(labels))
```

## Events
### router.on('crosspoint')
The `crosspoint` event is emitted whenever a crosspoint is changed on the remote NK-IPS (and in effect, anywhere in the router system), this includes routes made via this package, via DashBoard softpanels, or via TBUS/ethernet RCPs. The event is emitted with a CrossPointState class for the crosspoint that has changed.

```js
  router.on('crosspoint', (crosspoint) => console.log(crosspoint))

  > CrossPointState {
    id: 67,
    label: 'VOIDBOX',
    description: 'A Place to Throw Signals',
    sources: [
      {
        level: 'MD Video',
        id: 2,
        label: 'A DIFFERENT SOURCE',
        description: 'Something That Makes Signal From A Different Perspective'
      },
      { level: 'SDI Video', id: undefined },
      { level: 'AES Audio 1', id: undefined },
      { level: 'AES Audio 2', id: undefined },
      { level: 'Analog Video', id: undefined },
      { level: 'Analog Audio 1', id: undefined },
      { level: 'Analog Audio 2', id: undefined },
      { level: 'Machine Control', id: undefined }
    ]
```

## Notices

This code was entirely produced with black box reverse engineering of the NK-IPS' TBUS over IP protocol. Some features may not work as intended and others may produce unexpected results, it has been tested in production environments and seems to be stable but as with all blackbox revese engineering it is liable to sudden breakage.

The Ross NK-IPS/TBUS Protocol itself has no public license and is thus assumed to be Copyright Ross Video Ltd of Canada. All code I have written for this package is licensed under the GNU GPL v3 License, a full copy of which is available in `license.md` or on [the GNU Project's website](https://www.gnu.org/licenses/gpl-3.0.en.html)

Ross, if you don't like this, please contact me first, thanks.