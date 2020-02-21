import React, { Component } from 'react'
import Layout from '../../components/Layout'

class TripShow extends Component {
  static async getInitialProps(props) {
    const tripAddress = props.query.address

    return { tripAddress }
  }

  render() {
    return (
      <Layout>
        <h1>{this.props.tripAddress}</h1>
      </Layout>
    )
  }
}

export default TripShow
