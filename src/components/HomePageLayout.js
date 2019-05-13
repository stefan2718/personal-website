import React from 'react'
import '../assets/scss/main.scss'

import Header from './Header'

class HomePageLayout extends React.Component {
  getClassNames = (pathname) => {
    return pathname.startsWith('/lab') || pathname.startsWith('/blog') ? 'mini-header' : '';
  }

  render() {
    const { children, location } = this.props

    return (
      <div className={this.getClassNames(location.pathname)}>
        <Header />
        {children}
      </div>
    )
  }
}

export default HomePageLayout
