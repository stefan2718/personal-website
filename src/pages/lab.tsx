import React from 'react'
import Helmet from 'react-helmet'
import HomePageLayout from '../components/HomePageLayout'
import { IGatsbyProps } from '../util/interfaces';
import LabRoutes from '../components/LabRoutes';

class Lab extends React.Component<IGatsbyProps> {

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
              <LabRoutes></LabRoutes>
            </main>
          </div>
        </div>
      </HomePageLayout>
    )
  }
}

export default Lab