import React from 'react'
import Helmet from 'react-helmet'
import HomePageLayout from '../components/HomePageLayout'
import { labTiles, getTiles } from "../util/lab-routes";

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
          <div className="inner-main">
            <h1>The Lab</h1>
            <main>
              {getTiles(labTiles)}
            </main>
          </div>
        </div>
      </HomePageLayout>
    )
  }
}

export default Lab