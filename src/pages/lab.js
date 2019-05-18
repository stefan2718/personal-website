import React from 'react'
import Helmet from 'react-helmet'

import HomePageLayout from '../components/HomePageLayout'

class Lab extends React.Component {

  constructor() {
    super();

    this.state = {
    };
  }

  render() {
    const siteTitle = "Stefan Battiston"
    const siteDescription = "Site description"

    return (
      <HomePageLayout location={this.props.location}>
        <Helmet>
          <title>{siteTitle}</title>
          <meta name="description" content={siteDescription} />
        </Helmet>
        <div id="main">
          <h1>The Lab</h1>
          <main>
            Nothing here yet.
          </main>
        </div>
      </HomePageLayout>
    )
  }
}

export default Lab