import React from 'react'
import Helmet from 'react-helmet'
import '../assets/scss/main.scss'
import './HomePageLayout.scss';

import Header from './Header'
import { IGatsbyProps } from '../util/interfaces';

class HomePageLayout extends React.Component<IGatsbyProps> {
  getClassNames = (pathname: string) => {
    return pathname.startsWith('/lab') || pathname.startsWith('/blog') ? 'mini-header' : '';
  }

  render() {
    const { children, location } = this.props;

    return (
      <div className={this.getClassNames(location.pathname)}>
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <Header />
        {children}
      </div>
    )
  }
}

export default HomePageLayout
