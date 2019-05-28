import React from 'react'
import Helmet from 'react-helmet'
import HomePageLayout from '../components/HomePageLayout'
import Clusterer from '../components/Clusterer';


class Lab extends React.Component {

  constructor() {
    super();

    this.state = {
    };
  }

  render() {
    // TODO
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
            <Clusterer></Clusterer>
          </main>
        </div>
      </HomePageLayout>
    )
  }
}

export default Lab