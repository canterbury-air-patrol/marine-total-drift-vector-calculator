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

class InputDataTable extends React.Component<InputDataTableProps, never> {
  constructor(props: InputDataTableProps) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event: React.ChangeEvent<HTMLFormElement>) {
    const target = event.target
    let value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name
    if (name === 'LKP_lat' || name === 'LKP_lon') {
      value = DMToDegrees(value)
    }
    this.props.updateField(name, value)
  }

  render() {
    return (
      <form onChange={this.handleChange}>
        <table>
          <tbody>
            <tr>
              <td>
                <label htmlFor="subject">Subject</label>
              </td>
              <td>
                <input type="text" id="subject" name="subject" defaultValue={this.props.subject}></input>
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="LKP">Last Known Position</label>
              </td>
              <td>
                <input type="text" id="LKP" name="LKP" defaultValue={this.props.LKP}></input>
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="LKPLat">LKP Latitude</label>
              </td>
              <td>
                <input type="text" id="LKPLat" name="LKPLat" defaultValue={degreesToDM(this.props.LKPLat, true)}></input>
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="LKP_lat">LKP Longitude</label>
              </td>
              <td>
                <input type="text" id="LKPLon" name="LKPLon" defaultValue={degreesToDM(this.props.LKPLon, false)}></input>
              </td>
            </tr>
            <tr>
              <td>
                <label htmlFor="targetDescription">Target Description</label>
              </td>
              <td>
                <input type="text" id="targetDescription" name="targetDescription" defaultValue={this.props.targetDescription}></input>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    )
  }
}

interface MarineVectorDataRowProps {
  row: MarineTimeVector
  onChangeStartTime?: (assetIdx: number, value: Date) => void
  onChangeEndTime?: (assetIdx: number, value: Date) => void
  onChange?: (assetIdx: number, field: string, value: string) => void
  idx: number
}

class MarineVectorDataRow extends React.Component<MarineVectorDataRowProps, never> {
  constructor(props: MarineVectorDataRowProps) {
    super(props)

    this.handleStartTimeChange = this.handleStartTimeChange.bind(this)
    this.handleEndTimeChange = this.handleEndTimeChange.bind(this)
    this.handleDirectionChange = this.handleDirectionChange.bind(this)
    this.handleSpeedChange = this.handleSpeedChange.bind(this)
  }

  handleStartTimeChange(value: Date | null) {
    if (value && this.props.onChangeStartTime) {
      this.props.onChangeStartTime(this.props.idx, value)
    }
  }

  handleEndTimeChange(value: Date | null) {
    if (value && this.props.onChangeEndTime) {
      this.props.onChangeEndTime(this.props.idx, value)
    }
  }

  handleDirectionChange(event: React.ChangeEvent<HTMLInputElement>) {
    const target = event.target
    const value = target.value

    if (this.props.onChange) {
      this.props.onChange(this.props.idx, 'direction', value)
    }
  }

  handleSpeedChange(event: React.ChangeEvent<HTMLInputElement>) {
    const target = event.target
    const value = target.value

    if (this.props.onChange) {
      this.props.onChange(this.props.idx, 'speed', value)
    }
  }

  render() {
    return (
      <tr>
        <td>
          <DateTimePicker onChange={this.handleStartTimeChange} value={this.props.row.timeFrom} format="y-MM-dd HH:mm:ss" />
        </td>
        <td>
          <DateTimePicker onChange={this.handleEndTimeChange} value={this.props.row.timeTo} format="y-MM-dd HH:mm:ss" />
        </td>
        <td>
          <input type="number" minLength={3} maxLength={3} size={3} value={this.props.row.direction} onChange={this.handleDirectionChange} />
        </td>
        <td>
          <input type="number" minLength={1} maxLength={3} size={3} value={this.props.row.speed} onChange={this.handleSpeedChange} />
        </td>
        <td>{this.props.row.getTimeInterval()}</td>
        <td>{this.props.row.getVectorDirection()}</td>
        <td>{this.props.row.getVectorDistance()}</td>
      </tr>
    )
  }
}

interface MarineVectorDataTableProps {
  data: Array<MarineTimeVector>
  dataChanged: (idx: number, field: string, value: number) => void
  dataChangedStartTime: (idx: number, value: Date) => void
  dataChangedEndTime: (idx: number, value: Date) => void
}

class MarineVectorDataTable extends React.Component<MarineVectorDataTableProps, never> {
  constructor(props: MarineVectorDataTableProps) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(idx: number, field: string, value: string) {
    this.props.dataChanged(idx, field, parseInt(value))
  }

  handleStartTimeChange(idx: number, value: Date) {
    this.props.dataChangedStartTime(idx, value)
  }

  handleEndTimeChange(idx: number, value: Date) {
    this.props.dataChangedEndTime(idx, value)
  }

  render() {
    const rows = []
    for (const idx in this.props.data) {
      const row = this.props.data[idx]
      rows.push(
        <MarineVectorDataRow
          row={row}
          onChange={this.handleChange}
          onChangeEndTime={this.handleEndTimeChange}
          onChangeStartTime={this.handleStartTimeChange}
          key={idx}
          idx={parseInt(idx)}
        />
      )
    }
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
}

interface MarineLeewaySelectorProps {
  leewayData: Array<LeewayDataInterface>
  leewayChange: (value: number) => void
}

class MarineLeewaySelector extends React.Component<MarineLeewaySelectorProps, never> {
  constructor(props: MarineLeewaySelectorProps) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const target = event.target
    const value = target.value
    this.props.leewayChange(parseInt(value))
  }

  render() {
    const selectObjects = []
    for (const idx in this.props.leewayData) {
      const leeway = this.props.leewayData[idx]
      selectObjects.push(
        <option key={idx} value={idx}>
          {leeway.description}
        </option>
      )
    }

    return (
      <Form.Select id="leeway_type" name="leeway_type" className="selectpicker" data-live-search="true" onChange={this.handleChange}>
        {selectObjects}
      </Form.Select>
    )
  }
}

interface MarineLeewayDisplayProps {
  leeway: LeewayDataInterface
}

class MarineLeewayDisplay extends React.Component<MarineLeewayDisplayProps, never> {
  render() {
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
            <td>{this.props.leeway.multiplier}</td>
            <td>{this.props.leeway.modifier}</td>
            <td>{this.props.leeway.divergence}</td>
          </tr>
        </tbody>
      </Table>
    )
  }
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
}

export class MarineVectors extends React.Component<object, MarineVectorsState> {
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
      targetDescription: ''
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

  updateCurrentData(idx: number, field: string, value: number) {
    if (field === 'direction' || field === 'speed') {
      this.setState(function (prevState) {
        if (idx < prevState.currentVectors.length) {
          const current = prevState.currentVectors[idx]
          current[field] = value
        }
        return { currentVectors: prevState.currentVectors }
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

  updateWindData(idx: number, field: string, value: number) {
    if (field === 'direction' || field === 'speed') {
      this.setState(function (prevState) {
        if (idx < prevState.windVectors.length) {
          const wind = prevState.windVectors[idx]
          wind[field] = value
        }
        return { windVectors: prevState.windVectors }
      })
    }
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
    return (
      <div>
        <InputDataTable
          updateField={this.updateField}
          subject={this.state.subject}
          LKP={this.state.LKP}
          LKPLat={this.state.LKPLat}
          LKPLon={this.state.LKPLon}
          targetDescription={this.state.targetDescription}
        />
        <MarineLeewaySelector leewayData={this.state.leewayData} leewayChange={this.updateLeewayData} />
        <MarineLeewayDisplay leeway={this.state.selectedLeeway} />
        <br />
        Current Data:
        <MarineVectorDataTable
          data={this.state.currentVectors}
          dataChanged={this.updateCurrentData}
          dataChangedStartTime={this.updateCurrentTimeFrom}
          dataChangedEndTime={this.updateCurrentTimeTo}
        />
        <Button onClick={this.addCurrentVector}>Add</Button>
        <br />
        Wind Data:
        <MarineVectorDataTable
          data={this.state.windVectors}
          dataChanged={this.updateWindData}
          dataChangedStartTime={this.updateWindTimeFrom}
          dataChangedEndTime={this.updateWindTimeTo}
        />
        <Button onClick={this.addWindVector}>Add</Button>
        <table>
          <tbody>
            <tr>
              <td>Distance</td>
              <td>{this.distance}</td>
            </tr>
            <tr>
              <td>Bearing</td>
              <td>{this.bearing}</td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  }
}
