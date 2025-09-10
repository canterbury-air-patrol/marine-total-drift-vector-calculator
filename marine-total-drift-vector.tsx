import { SearchObjectLeeway, LeewayDataInterface } from '@canterbury-air-patrol/marine-leeway-data'

import React from 'react'
import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'

import Button from 'react-bootstrap/Button'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'

import DateTimePicker from 'react-datetime-picker'

import 'bootstrap/dist/css/bootstrap.min.css'

import 'react-datetime-picker/dist/DateTimePicker.css'
import 'react-calendar/dist/Calendar.css'
import 'react-clock/dist/Clock.css'

class MarineTimeVector {
  idx: number
  timeFrom: Date
  timeTo: Date
  direction: number
  speed: number

  constructor(idx: number, timeFrom: Date, timeTo: Date, direction: number | string, speed: number) {
    this.idx = idx
    this.timeFrom = timeFrom
    this.timeTo = timeTo
    this.direction = typeof direction == 'number' ? direction : parseInt(direction)
    this.speed = speed
  }

  getTimeInterval(): number {
    return (this.timeTo.getTime() - this.timeFrom.getTime()) / (60 * 60 * 1000)
  }

  getVectorDirection(): number {
    return this.direction
  }

  getVectorSpeed(): number {
    return this.speed
  }

  getVectorDistance(): number {
    return this.getTimeInterval() * this.getVectorSpeed()
  }
}

class MarineVectorsCurrent extends MarineTimeVector {}

class MarineVectorsWind extends MarineTimeVector {
  leewayData: LeewayDataInterface

  constructor(idx: number, timeFrom: Date, timeTo: Date, windDirection: number, windSpeed: number, leewayData: LeewayDataInterface) {
    super(idx, timeFrom, timeTo, windDirection, windSpeed)
    this.leewayData = leewayData
  }

  updateLeewayData(leewayData: LeewayDataInterface) {
    this.leewayData = leewayData
  }

  getVectorDirection(): number {
    return (this.direction + 180) % 360
  }

  getVectorSpeed(): number {
    return super.getVectorSpeed() * this.leewayData.multiplier + this.leewayData.modifier
  }
}

interface InputDataTableProps {
  updateField: (field: string, value: string) => void
  subject: string
  LKP: string
  LKPLat: number
  LKPLon: number
  targetDescription: string
}

const InputDataTable: React.FC<InputDataTableProps> = (props) => {
  const handleChange = (event: React.ChangeEvent<HTMLFormElement>) => {
    const { target } = event
    let value = target.type === 'checkbox' ? target.checked : target.value
    const { name } = target
    if (name === 'LKP_lat' || name === 'LKP_lon') {
      value = DMToDegrees(value)
    }
    props.updateField(name, value)
  }

  return (
    <form onChange={handleChange}>
      <table>
        <tbody>
          <tr>
            <td>
              <label htmlFor="subject">Subject</label>
            </td>
            <td>
              <input type="text" id="subject" name="subject" defaultValue={props.subject}></input>
            </td>
          </tr>
          <tr>
            <td>
              <label htmlFor="LKP">Last Known Position</label>
            </td>
            <td>
              <input type="text" id="LKP" name="LKP" defaultValue={props.LKP}></input>
            </td>
          </tr>
          <tr>
            <td>
              <label htmlFor="LKPLat">LKP Latitude</label>
            </td>
            <td>
              <input type="text" id="LKPLat" name="LKPLat" defaultValue={degreesToDM(props.LKPLat, true)}></input>
            </td>
          </tr>
          <tr>
            <td>
              <label htmlFor="LKPLon">LKP Longitude</label>
            </td>
            <td>
              <input type="text" id="LKPLon" name="LKPLon" defaultValue={degreesToDM(props.LKPLon, false)}></input>
            </td>
          </tr>
          <tr>
            <td>
              <label htmlFor="targetDescription">Target Description</label>
            </td>
            <td>
              <input type="text" id="targetDescription" name="targetDescription" defaultValue={props.targetDescription}></input>
            </td>
          </tr>
        </tbody>
      </table>
    </form>
  )
}

interface MarineVectorDataRowProps {
  row: MarineTimeVector
  onChangeStartTime?: (assetIdx: number, value: Date) => void
  onChangeEndTime?: (assetIdx: number, value: Date) => void
  onChange?: (assetIdx: number, field: string, value: string) => void
  idx: number
}

const MarineVectorDataRow: React.FC<MarineVectorDataRowProps> = (props) => {
  const handleStartTimeChange = (value: Date | null) => {
    if (value && props.onChangeStartTime) {
      props.onChangeStartTime(props.idx, value)
    }
  }

  const handleEndTimeChange = (value: Date | null) => {
    if (value && props.onChangeEndTime) {
      props.onChangeEndTime(props.idx, value)
    }
  }

  return (
    <tr>
      <td>
        <DateTimePicker onChange={handleStartTimeChange} value={props.row.timeFrom} format="y-MM-dd HH:mm:ss" />
      </td>
      <td>
        <DateTimePicker onChange={handleEndTimeChange} value={props.row.timeTo} format="y-MM-dd HH:mm:ss" />
      </td>
      <td>
        <input type="number" minLength={3} maxLength={3} size={3} value={props.row.direction} onChange={(e) => props.onChange?.(props.idx, 'direction', e.target.value)} />
      </td>
      <td>
        <input type="number" minLength={1} maxLength={3} size={3} value={props.row.speed} onChange={(e) => props.onChange?.(props.idx, 'speed', e.target.value)} />
      </td>
      <td>{props.row.getTimeInterval()}</td>
      <td>{props.row.getVectorDirection()}</td>
      <td>{props.row.getVectorDistance()}</td>
    </tr>
  )
}

interface MarineVectorDataTableProps {
  data: Array<MarineTimeVector>
  dataChanged: (idx: number, field: string, value: string) => void
  dataChangedStartTime: (idx: number, value: Date) => void
  dataChangedEndTime: (idx: number, value: Date) => void
}

const MarineVectorDataTable: React.FC<MarineVectorDataTableProps> = (props) => {
  const rows = props.data.map((row, idx) => (
    <MarineVectorDataRow key={idx} row={row} onChange={props.dataChanged} onChangeStartTime={props.dataChangedStartTime} onChangeEndTime={props.dataChangedEndTime} idx={idx} />
  ))

  return (
    <Table striped>
      <thead>
        <tr>
          <td>From:</td>
          <td>To:</td>
          <td>Direction (&deg;)</td>
          <td>Speed (knots)</td>
          <td>Time Interval</td>
          <td>Vector Direction (&deg;)</td>
          <td>Vector Distance (NM)</td>
        </tr>
      </thead>
      <tbody>{rows}</tbody>
    </Table>
  )
}

interface MarineLeewaySelectorProps {
  leewayData: Array<LeewayDataInterface>
  leewayChange: (value: number) => void
}

const MarineLeewaySelector: React.FC<MarineLeewaySelectorProps> = (props) => {
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target
    props.leewayChange(parseInt(value))
  }

  const selectObjects = props.leewayData.map((leeway, idx) => (
    <option key={idx} value={idx}>
      {leeway.description}
    </option>
  ))

  return (
    <Form.Select id="leeway_type" name="leeway_type" className="selectpicker" data-live-search="true" onChange={handleChange}>
      {selectObjects}
    </Form.Select>
  )
}

interface MarineLeewayDisplayProps {
  leeway: LeewayDataInterface
}

const MarineLeewayDisplay: React.FC<MarineLeewayDisplayProps> = (props) => {
  return (
    <Table bordered>
      <thead>
        <tr>
          <td>Multiplier</td>
          <td>Modifier</td>
          <td>Divergence</td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>{props.leeway.multiplier}</td>
          <td>{props.leeway.modifier}</td>
          <td>{props.leeway.divergence}</td>
        </tr>
      </tbody>
    </Table>
  )
}

interface MarineVectorsState {
  leewayData: Array<LeewayDataInterface>
  selectedLeeway: LeewayDataInterface
  currentVectors: Array<MarineVectorsCurrent>
  windVectors: Array<MarineVectorsWind>
  subject: string
  LKP: string
  LKPLat: number
  LKPLon: number
  targetDescription: string
  distance: number
  bearing: number
}

interface MarineVectorsProps {
  data: MarineVectorsState
  actions: {
    updateField: (field: string, value: string) => void
    updateLeewayData: (leewayIdx: number) => void
    updateCurrentData: (idx: number, field: string, value: string) => void
    updateCurrentTimeFrom: (idx: number, value: Date) => void
    updateCurrentTimeTo: (idx: number, value: Date) => void
    addCurrentVector: () => void
    updateWindData: (idx: number, field: string, value: string) => void
    updateWindTimeFrom: (idx: number, value: Date) => void
    updateWindTimeTo: (idx: number, value: Date) => void
    addWindVector: () => void
  }
}

const MarineVectorsDisplay: React.FC<MarineVectorsProps> = (props) => {
  const { data, actions } = props
  return (
    <div>
      <InputDataTable
        updateField={actions.updateField}
        subject={data.subject}
        LKP={data.LKP}
        LKPLat={data.LKPLat}
        LKPLon={data.LKPLon}
        targetDescription={data.targetDescription}
      />
      <MarineLeewaySelector leewayData={data.leewayData} leewayChange={actions.updateLeewayData} />
      <MarineLeewayDisplay leeway={data.selectedLeeway} />
      <br />
      Current Data:
      <MarineVectorDataTable
        data={data.currentVectors}
        dataChanged={actions.updateCurrentData}
        dataChangedStartTime={actions.updateCurrentTimeFrom}
        dataChangedEndTime={actions.updateCurrentTimeTo}
      />
      <Button onClick={actions.addCurrentVector}>Add</Button>
      <br />
      Wind Data:
      <MarineVectorDataTable
        data={data.windVectors}
        dataChanged={actions.updateWindData}
        dataChangedStartTime={actions.updateWindTimeFrom}
        dataChangedEndTime={actions.updateWindTimeTo}
      />
      <Button onClick={actions.addWindVector}>Add</Button>
      <table>
        <tbody>
          <tr>
            <td>Distance</td>
            <td>{data.distance}</td>
          </tr>
          <tr>
            <td>Bearing</td>
            <td>{data.bearing}</td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

class MarineVectors extends React.Component<object, MarineVectorsState> {
  distance: number
  bearing: number

  constructor(props: object) {
    super(props)
    this.distance = 0
    this.bearing = 0

    this.state = {
      leewayData: SearchObjectLeeway,
      selectedLeeway: SearchObjectLeeway[0],
      currentVectors: [],
      windVectors: [],
      subject: '',
      LKP: '',
      LKPLat: 0.0,
      LKPLon: 0.0,
      targetDescription: '',
      distance: 0,
      bearing: 0
    }

    this.updateLeewayData = this.updateLeewayData.bind(this)
    this.addCurrentVector = this.addCurrentVector.bind(this)
    this.addWindVector = this.addWindVector.bind(this)
    this.updateCurrentData = this.updateCurrentData.bind(this)
    this.updateCurrentTimeFrom = this.updateCurrentTimeFrom.bind(this)
    this.updateCurrentTimeTo = this.updateCurrentTimeTo.bind(this)
    this.updateWindData = this.updateWindData.bind(this)
    this.updateWindTimeFrom = this.updateWindTimeFrom.bind(this)
    this.updateWindTimeTo = this.updateWindTimeTo.bind(this)
  }

  vectorToCartesian(v: MarineTimeVector) {
    return {
      x: v.getVectorDistance() * Math.sin((v.getVectorDirection() * Math.PI) / 180),
      y: v.getVectorDistance() * Math.cos((v.getVectorDirection() * Math.PI) / 180)
    }
  }

  recalculate() {
    let x = 0
    let y = 0
    for (const idx in this.state.currentVectors) {
      const res = this.vectorToCartesian(this.state.currentVectors[idx])
      x += res.x
      y += res.y
    }
    for (const idx in this.state.windVectors) {
      const windVector = this.state.windVectors[idx]
      windVector.leewayData = this.state.selectedLeeway
      const res = this.vectorToCartesian(windVector)
      x += res.x
      y += res.y
    }
    this.distance = Math.sqrt(x * x + y * y)
    this.bearing = ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360
  }

  addCurrentVector() {
    this.setState(function (prevState) {
      let startTime = null
      if (prevState.currentVectors.length > 0) {
        startTime = prevState.currentVectors[prevState.currentVectors.length - 1].timeTo
      }
      if (startTime === null) {
        startTime = new Date()
      }
      const endTime = new Date()
      prevState.currentVectors.push(new MarineVectorsCurrent(prevState.currentVectors.length + 1, startTime, endTime, 0, 0))
      return { currentVectors: prevState.currentVectors }
    })
  }

  addWindVector() {
    this.setState(function (prevState) {
      let startTime = null
      if (prevState.windVectors.length > 0) {
        startTime = prevState.windVectors[prevState.windVectors.length - 1].timeTo
      }
      if (startTime === null) {
        startTime = new Date()
      }
      const endTime = new Date()
      prevState.windVectors.push(new MarineVectorsWind(prevState.windVectors.length + 1, startTime, endTime, 0, 0, prevState.selectedLeeway))
      return { windVectors: prevState.windVectors }
    })
  }

  updateLeewayData(leewayIdx: number) {
    this.setState((prevState) => ({
      selectedLeeway: prevState.leewayData[leewayIdx]
    }))
  }

  updateField(name: string, value: string | number) {
    switch (name) {
      case 'subject':
        this.setState({
          subject: String(value)
        })
        break
      case 'LKP':
        this.setState({
          LKP: String(value)
        })
        break
      case 'LKPLat':
        this.setState({
          LKPLat: typeof value == 'number' ? value : parseFloat(value)
        })
        break
      case 'LKPLon':
        this.setState({
          LKPLon: typeof value == 'number' ? value : parseFloat(value)
        })
        break
      case 'targetDescription':
        this.setState({
          targetDescription: String(value)
        })
        break
    }
  }

  updateCurrentData(idx: number, field: string, value: string) {
    if (field === 'direction' || field === 'speed') {
      const parsedValue = parseFloat(value)
      if (isNaN(parsedValue)) {
        return
      }
      this.setState((oldState) => {
        if (idx >= 0 && idx < oldState.currentVectors.length) {
          const updatedVectors = [...oldState.currentVectors]
          updatedVectors[idx] = { ...updatedVectors[idx], [field]: parsedValue }
          return { currentVectors: updatedVectors }
        }
        return oldState
      })
    }
  }

  updateCurrentTimeFrom(idx: number, value: Date) {
    this.setState(function (prevState) {
      if (idx < prevState.currentVectors.length) {
        const current = prevState.currentVectors[idx]
        current.timeFrom = value
      }
      return { currentVectors: prevState.currentVectors }
    })
  }

  updateCurrentTimeTo(idx: number, value: Date) {
    this.setState(function (prevState) {
      if (idx < prevState.currentVectors.length) {
        const current = prevState.currentVectors[idx]
        current.timeTo = value
      }
      return { currentVectors: prevState.currentVectors }
    })
  }

  updateWindData(idx: number, field: string, value: string) {
    const allowedFields = ['direction', 'speed']
    if (!allowedFields.includes(field) || isNaN(parseFloat(value))) {
      // Block prototype pollution attempts and any unexpected field.
      return
    }
    this.setState((oldState) => {
      if (idx >= 0 && idx < oldState.windVectors.length) {
        const updatedVectors = [...oldState.windVectors]
        updatedVectors[idx] = { ...updatedVectors[idx], [field]: parseFloat(value) }
        return { windVectors: updatedVectors }
      }
      return oldState
    })
  }

  updateWindTimeFrom(idx: number, value: Date) {
    this.setState(function (prevState) {
      if (idx < prevState.windVectors.length) {
        const wind = prevState.windVectors[idx]
        wind.timeFrom = value
      }
      return { windVectors: prevState.windVectors }
    })
  }

  updateWindTimeTo(idx: number, value: Date) {
    this.setState(function (prevState) {
      if (idx < prevState.windVectors.length) {
        const wind = prevState.windVectors[idx]
        wind.timeTo = value
      }
      return { windVectors: prevState.windVectors }
    })
  }

  render() {
    this.recalculate()
    const actions = {
      updateField: this.updateField,
      updateCurrentData: this.updateCurrentData,
      updateCurrentTimeFrom: this.updateCurrentTimeFrom,
      updateCurrentTimeTo: this.updateCurrentTimeTo,
      updateLeewayData: this.updateLeewayData,
      updateWindData: this.updateWindData,
      updateWindTimeFrom: this.updateWindTimeFrom,
      updateWindTimeTo: this.updateWindTimeTo,
      addCurrentVector: this.addCurrentVector,
      addWindVector: this.addWindVector
    }
    return <MarineVectorsDisplay data={{ ...this.state, distance: this.distance, bearing: this.bearing }} actions={actions} />
  }
}

export { MarineVectors, MarineVectorsDisplay }
