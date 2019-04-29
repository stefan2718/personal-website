import React from 'react'
import Helmet from 'react-helmet'

import Layout from '../components/layout'

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
      <Layout>
        <Helmet>
          <title>{siteTitle}</title>
          <meta name="description" content={siteDescription} />
        </Helmet>
        Lab page
      </Layout>
    )
  }
}

export default Lab