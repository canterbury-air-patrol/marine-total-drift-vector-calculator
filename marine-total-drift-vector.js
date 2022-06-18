import { SearchObjectLeeway } from '@canterbury-air-patrol/marine-leeway-data'

import React from 'react'
import PropTypes from 'prop-types'
import { degreesToDM, DMToDegrees } from '@canterbury-air-patrol/deg-converter'

import Button from 'react-bootstrap/Button'
import Table from 'react-bootstrap/Table'
import Form from 'react-bootstrap/Form'

import 'bootstrap/dist/css/bootstrap.min.css'

class MarineTimeVector {
  constructor (idx, timeFrom, timeTo, direction, speed) {
    this.idx = idx
    this.timeFrom = timeFrom
    this.timeTo = timeTo
    this.direction = direction
    this.speed = speed
  }

  timeFractions (humanTime) {
    const minutes = humanTime % 100
    let hours = (humanTime - minutes) / 100
    hours += minutes / 60
    return hours
  }

  getTimeInterval () {
    return this.timeFractions(this.timeTo) - this.timeFractions(this.timeFrom)
  }

  getVectorDirection () {
    return parseInt(this.direction)
  }

  getVectorSpeed () {
    return this.speed
  }

  getVectorDistance () {
    return this.getTimeInterval() * this.getVectorSpeed()
  }
}

class MarineVectorsCurrent extends MarineTimeVector {
}

class MarineVectorsWind extends MarineTimeVector {
  constructor (idx, timeFrom, timeTo, windDirection, windSpeed, leewayData) {
    super(idx, timeFrom, timeTo, windDirection, windSpeed)
    this.leewayData = leewayData
  }

  updateLeewayData (leewayData) {
    this.leewayData = leewayData
  }

  getVectorDirection () {
    return (parseInt(this.direction) + 180) % 360
  }

  getVectorSpeed () {
    return (super.getVectorSpeed() * this.leewayData.multiplier) + this.leewayData.modifier
  }
}

class InputDataTable extends React.Component {
  constructor (props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (event) {
    const target = event.target
    let value = target.type === 'checkbox' ? target.checked : target.value
    const name = target.name
    if (name === 'LKP_lat' || name === 'LKP_lon') {
      value = DMToDegrees(value)
    }
    this.props.updateField(name, value)
  }

  render () {
    return (<form onChange={ this.handleChange }>
              <table>
                  <tbody>
                      <tr>
                          <td><label htmlFor="subject">Subject</label></td>
                          <td><input type="text" id="subject" name="subject" defaultValue={this.props.subject}></input></td>
                      </tr>
                      <tr>
                          <td><label htmlFor="LKP">Last Known Position</label></td>
                          <td><input type="text" id="LKP" name="LKP" defaultValue={this.props.LKP}></input></td>
                      </tr>
                      <tr>
                          <td><label htmlFor="LKPLat">LKP Latitude</label></td>
                          <td><input type="text" id="LKPLat" name="LKPLat" defaultValue={degreesToDM(this.props.LKPLat, true)}></input></td>
                      </tr>
                      <tr>
                          <td><label htmlFor="LKP_lat">LKP Longitude</label></td>
                          <td><input type="text" id="LKPLon" name="LKPLon" defaultValue={degreesToDM(this.props.LKPLon, false)}></input></td>
                      </tr>
                      <tr>
                          <td><label htmlFor="targetDescription">Target Description</label></td>
                          <td><input type="text" id="targetDescription" name="targetDescription" defaultValue={this.props.targetDescription}></input></td>
                      </tr>
                  </tbody>
              </table>
    </form>)
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

class MarineVectorDataTable extends React.Component {
  constructor (props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (event) {
    const target = event.target
    const id = target.id
    const value = target.value

    const idx = id.split('_')[1]
    const field = id.split('_')[0]

    this.props.dataChanged(idx, field, value)
  }

  render () {
    const rows = []
    for (const idx in this.props.data) {
      const row = this.props.data[idx]
      rows.push((
        <tr key={idx}>
          <td><input type="number" min="0" max="2359" size="4" id={'timeFrom_' + idx} value={row.timeFrom} onChange={this.handleChange} /></td>
          <td><input type="number" minLength="4" maxLength="4" size="4" id={'timeTo_' + idx} value={row.timeTo} onChange={this.handleChange} /></td>
          <td><input type="number" minLength="3" maxLength="3" size="3" id={'direction_' + idx} value={row.direction} onChange={this.handleChange} /></td>
          <td><input type="number" minLength="1" maxLength="3" size="3" id={'speed_' + idx} value={row.speed} onChange={this.handleChange} /></td>
          <td>{row.getTimeInterval()}</td>
          <td>{row.getVectorDirection()}</td>
          <td>{row.getVectorDistance()}</td>
        </tr>))
    }
    return (
      <Table striped>
        <thead>
          <tr><td>From:</td><td>To:</td><td>Direction (&deg;)</td><td>Speed (knots)</td><td>Time Interval</td><td>Vector Direction (&deg;)</td><td>Vector Distance (NM)</td></tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </Table>)
  }
}
MarineVectorDataTable.propTypes = {
  data: PropTypes.array.isRequired,
  dataChanged: PropTypes.func.isRequired
}

class MarineLeewaySelector extends React.Component {
  constructor (props) {
    super(props)

    this.handleChange = this.handleChange.bind(this)
  }

  handleChange (event) {
    const target = event.target
    const value = target.value
    this.props.leewayChange(value)
  }

  render () {
    const selectObjects = []
    for (const idx in this.props.leewayData) {
      const leeway = this.props.leewayData[idx]
      selectObjects.push(<option key={idx} value={idx}>{leeway.description}</option>)
    }

    return (
    <Form.Select id="leeway_type" name="leeway_type" className="selectpicker" data-live-search="true" onChange={this.handleChange}>
      {selectObjects}
    </Form.Select>)
  }
}
MarineLeewaySelector.propTypes = {
  leewayData: PropTypes.array.isRequired,
  leewayChange: PropTypes.func.isRequired
}

class MarineLeewayDisplay extends React.Component {
  render () {
    return (
    <Table bordered>
      <thead>
        <tr><td>Multiplier</td><td>Modifier</td><td>Divergence</td></tr>
      </thead>
      <tbody>
        <tr><td>{this.props.leeway.modifier}</td><td>{this.props.leeway.modifier}</td><td>{this.props.leeway.divergence}</td></tr>
      </tbody>
    </Table>)
  }
}
MarineLeewayDisplay.propTypes = {
  leeway: PropTypes.object.isRequired
}

export class MarineVectors extends React.Component {
  constructor (props) {
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

  vectorToCartesian (v) {
    return {
      x: v.getVectorDistance() * Math.sin(v.getVectorDirection() * Math.PI / 180),
      y: v.getVectorDistance() * Math.cos(v.getVectorDirection() * Math.PI / 180)
    }
  }

  recalculate () {
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
    this.bearing = ((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360
  }

  addCurrentVector () {
    const currentVector = new MarineVectorsCurrent(this.state.currentVectors.length + 1, 0, 0, 0, 0)
    this.state.currentVectors.push(currentVector)
    this.setState({
      currentVectors: this.state.currentVectors
    })
  }

  addWindVector () {
    const windVector = new MarineVectorsWind(this.state.windVectors.length + 1, 0, 0, 0, 0, this.state.selectedLeeway)
    this.state.windVectors.push(windVector)
    this.setState({
      windVectors: this.state.windVectors
    })
  }

  updateLeewayData (leewayIdx) {
    this.setState({
      selectedLeeway: this.state.leewayData[leewayIdx]
    })
  }

  updateField (name, value) {
    this.setState({
      [name]: value
    })
  }

  updateCurrentData (idx, field, value) {
    if (idx < this.state.currentVectors.length) {
      const current = this.state.currentVectors[idx]
      current[field] = value
      this.setState({
        currentVectors: this.state.currentVectors
      })
    }
  }

  updateWindData (idx, field, value) {
    if (idx < this.state.windVectors.length) {
      const wind = this.state.windVectors[idx]
      wind[field] = value
      this.setState({
        windVectors: this.state.windVectors
      })
    }
  }

  render () {
    this.recalculate()
    return (
      <div>
        <InputDataTable
          updateField={this.updateField}
          subject={this.state.subject}
          LKP={this.state.LKP}
          LKPLat={this.state.LKPLat}
          LKPLon={this.state.LKPLon}
          targetDescription={this.state.targetDescription} />
        <MarineLeewaySelector
          leewayData={this.state.leewayData}
          selected={this.state.selectedLeeway}
          leewayChange={this.updateLeewayData}
          />
        <MarineLeewayDisplay
          leeway={this.state.selectedLeeway}
          />
        <br />Current Data:
        <MarineVectorDataTable
          data={this.state.currentVectors}
          dataChanged={this.updateCurrentData}
          />
        <Button onClick={this.addCurrentVector}>Add</Button>
        <br />Wind Data:
        <MarineVectorDataTable
          data={this.state.windVectors}
          dataChanged={this.updateWindData}
        />
        <Button onClick={this.addWindVector}>Add</Button>
        <table>
          <tbody>
          <tr><td>Distance</td><td>{ this.distance }</td></tr>
          <tr><td>Bearing</td><td>{ this.bearing }</td></tr>
          </tbody>
        </table>
      </div>)
  }
}
