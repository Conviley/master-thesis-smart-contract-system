import React from 'react'
import { Container, Grid } from 'semantic-ui-react'
import Head from 'next/head'
import Header from './Header'

export default props => {
  return (
    <Grid>
      <Grid.Row style={{ backgroundColor: '#f4f4ee' }}>
        <Grid.Column className="centered">
          <div className="top-header-bar">
            <Container>
              <Header />
            </Container>
          </div>
        </Grid.Column>
      </Grid.Row>

      <Grid.Row
      /*style={{
          display: 'inline-block',
          backgroundImage: `url(${'/winter.jpg'})`,
          backgroundSize: 'cover',
        }}*/
      >
        <Grid.Column>
          <Container>
            <Head>
              <link
                rel="stylesheet"
                href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.4.1/semantic.min.css"
              />
            </Head>
            {props.children}
          </Container>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  )
}
