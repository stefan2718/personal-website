import React from 'react'

import Footer from './Footer'
import avatar from '../assets/images/avatar.jpg'

class Header extends React.Component {
  render() {
    return (
      <header id="header">
        <div className="inner">
          <img className="image avatar" src={avatar} alt="" />
          <h1>
            <strong>My name's Stefan.</strong>
          </h1>
          <h1>I like to build things.</h1>
        </div>
        <Footer />
      </header>
    )
  }
}

export default Header
