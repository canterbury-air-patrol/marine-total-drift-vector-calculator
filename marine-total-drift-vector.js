import { SearchObjectLeeway } from '@canterbury-air-patrol/marine-leeway-data'

import React from 'react'
import PropTypes from 'prop-types'
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
  constructor(idx, timeFrom, timeTo, direction, speed) {
    this.idx = idx
    this.timeFrom = timeFrom
    this.timeTo = timeTo
    this.direction = direction
    this.speed = speed
  }

  getTimeInterval() {
    return (this.timeTo - this.timeFrom) / (60 * 60 * 1000)
  }

  getVectorDirection() {
    return parseInt(this.direction)
  }

  getVectorSpeed() {
    return this.speed
  }

  getVectorDistance() {
    return this.getTimeInterval() * this.getVectorSpeed()
  }
}

class MarineVectorsCurrent extends MarineTimeVector {}

class MarineVectorsWind extends MarineTimeVector {
  constructor(idx, timeFrom, timeTo, windDirection, windSpeed, leewayData) {
    super(idx, timeFrom, timeTo, windDirection, windSpeed)
    this.leewayData = leewayData
  }

  updateLeewayData(leewayData) {
    this.leewayData = leewayData
  }

  getVectorDirection() {
    return (parseInt(this.direction) + 180) % 360
  }

  getVectorSpeed() {
    return super.getVectorSpeed() * this.leewayData.multiplier + this.leewayData.modifier
  }
}

class InputDataTable extends React.Component {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
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
InputDataTable.propTypes = {
  updateField: PropTypes.func.isRequired,
  subject: PropTypes.string.isRequired,
  LKP: PropTypes.string.isRequired,
  LKPLat: PropTypes.number.isRequired,
  LKPLon: PropTypes.number.isRequired,
  targetDescription: PropTypes.string.isRequired
}

class MarineVectorDataRow extends React.Component {
  constructor(props) {
    super(props)

    this.handleStartTimeChange = this.handleStartTimeChange.bind(this)
    this.handleEndTimeChange = this.handleEndTimeChange.bind(this)
    this.handleDirectionChange = this.handleDirectionChange.bind(this)
    this.handleSpeedChange = this.handleSpeedChange.bind(this)
  }

  handleStartTimeChange(value) {
    this.props.onChange(this.props.idx, 'timeFrom', value)
  }

  handleEndTimeChange(value) {
    this.props.onChange(this.props.idx, 'timeTo', value)
  }

  handleDirectionChange(event) {
    const target = event.target
    const value = target.value

    this.props.onChange(this.props.idx, 'direction', value)
  }

  handleSpeedChange(event) {
    const target = event.target
    const value = target.value

    this.props.onChange(this.props.idx, 'speed', value)
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
          <input type="number" minLength="3" maxLength="3" size="3" value={this.props.row.direction} onChange={this.handleDirectionChange} />
        </td>
        <td>
          <input type="number" minLength="1" maxLength="3" size="3" value={this.props.row.speed} onChange={this.handleSpeedChange} />
        </td>
        <td>{this.props.row.getTimeInterval()}</td>
        <td>{this.props.row.getVectorDirection()}</td>
        <td>{this.props.row.getVectorDistance()}</td>
      </tr>
    )
  }
}
MarineVectorDataRow.propTypes = {
  row: PropTypes.object.isRequired,
  onChange: PropTypes.func,
  idx: PropTypes.string.isRequired
}

class MarineVectorDataTable extends React.Component {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(idx, field, value) {
    this.props.dataChanged(idx, field, value)
  }

  render() {
    const rows = []
    for (const idx in this.props.data) {
      const row = this.props.data[idx]
      rows.push(<MarineVectorDataRow row={row} onChange={this.handleChange} key={idx} idx={idx} />)
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
MarineVectorDataTable.propTypes = {
  data: PropTypes.array.isRequired,
  dataChanged: PropTypes.func.isRequired
}

class MarineLeewaySelector extends React.Component {
  constructor(props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange(event) {
    const target = event.target
    const value = target.value
    this.props.leewayChange(value)
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
MarineLeewaySelector.propTypes = {
  leewayData: PropTypes.array.isRequired,
  leewayChange: PropTypes.func.isRequired
}

class MarineLeewayDisplay extends React.Component {
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
MarineLeewayDisplay.propTypes = {
  leeway: PropTypes.object.isRequired
}

export class MarineVectors extends React.Component {
  constructor(props) {
    super(props)

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
    this.updateWindData = this.updateWindData.bind(this)
  }

  vectorToCartesian(v) {
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
      prevState.currentVectors.push(new MarineVectorsCurrent(this.state.currentVectors.length + 1, startTime, endTime, 0, 0))
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
      prevState.windVectors.push(new MarineVectorsWind(this.state.windVectors.length + 1, startTime, endTime, 0, 0, this.state.selectedLeeway))
      return { windVectors: prevState.windVectors }
    })
  }

  updateLeewayData(leewayIdx) {
    this.setState((prevState) => ({
      selectedLeeway: prevState.leewayData[leewayIdx]
    }))
  }

  updateField(name, value) {
    this.setState({
      [name]: value
    })
  }

  updateCurrentData(idx, field, value) {
    this.setState(function (prevState) {
      if (idx !== '__proto__' && idx < prevState.currentVectors.length) {
        const current = prevState.currentVectors[idx]
        if (field !== '__proto__') {
          current[field] = value
          return { currentVectors: prevState.currentVectors }
        }
      }
      return {}
    })
  }

  updateWindData(idx, field, value) {
    this.setState(function () {
      if (idx !== '__proto__' && idx < this.state.windVectors.length) {
        const wind = this.state.windVectors[idx]
        if (field !== '__proto__') {
          wind[field] = value
          return { windVectors: this.state.windVectors }
        }
      }
      return {}
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
        <MarineLeewaySelector leewayData={this.state.leewayData} selected={this.state.selectedLeeway} leewayChange={this.updateLeewayData} />
        <MarineLeewayDisplay leeway={this.state.selectedLeeway} />
        <br />
        Current Data:
        <MarineVectorDataTable data={this.state.currentVectors} dataChanged={this.updateCurrentData} />
        <Button onClick={this.addCurrentVector}>Add</Button>
        <br />
        Wind Data:
        <MarineVectorDataTable data={this.state.windVectors} dataChanged={this.updateWindData} />
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
