import React, { Component } from 'react'
import { Card, Button } from 'semantic-ui-react'
import factory from '../factory'
import Layout from '../components/Layout'
import { Link } from '../routes'

class TripIndex extends Component {
  static async getInitialProps() {
    const trips = await factory.methods.getTrips().call()
    return { trips }
  }

  renderTrips() {
    const items = this.props.trips.map(address => {
      return {
        header: address,
        description: (
          <Link route={`/trips/${address}`}>
            <a>View Trip</a>
          </Link>
        ),
        fluid: true,
      }
    })

    return <Card.Group items={items} />
  }

  render() {
    return (
      <Layout>
        <div>
          <h3>Trips</h3>
          {this.renderTrips()}
        </div>
      </Layout>
    )
  }
}

export default TripIndex
