import React from 'react'
import { Link } from 'gatsby'

import Footer from './Footer'
import avatar from '../assets/images/avatar.jpg'

class Header extends React.Component {
  // TODO: Shrink this on blog/lab pages
  render() {
    return (
      <header id="header">
        <div className="inner">
          <Link to="/" className="no-underline" title="Go to homepage">
            <img className="image avatar" src={avatar} alt="" />
          </Link>
          <h1>
            <strong>My name's Stefan.</strong>
          </h1>
          <h1>I like to build things.</h1>
          <nav>
            <Link to="/blog" className="button special">Blog</Link>
            <Link to="/lab" className="button special">Lab</Link>
          </nav>
        </div>
        <Footer />
      </header>
    )
  }
}

export default Header
