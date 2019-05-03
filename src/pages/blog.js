import React from 'react'
import Helmet from 'react-helmet'

import HomePageLayout from '../components/HomePageLayout'

class Blog extends React.Component {

  constructor() {
    super();

    this.state = {
    };
  }

  render() {
    const siteTitle = "Stefan Battiston"
    const siteDescription = "Site description"

    return (
      <HomePageLayout>
        <Helmet>
          <title>{siteTitle}</title>
          <meta name="description" content={siteDescription} />
        </Helmet>
        Blog page
      </HomePageLayout>
    )
  }
}

export default Blog