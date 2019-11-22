import React from 'react'
import { Link } from 'gatsby'

import Footer from './Footer'
import avatar from '../assets/images/avatar.jpg'
import { Location, WindowLocation } from '@reach/router';

import './Header.scss';

const routes = [
  { path: "/",      label: "Home" },
  { path: "/blog",  label: "Blog" },
  { path: "/lab",   label: "Lab" },
];

class Header extends React.Component {

  getRoutes = (location: WindowLocation) => {
    return routes
      .filter(route => location.pathname !== route.path)
      .map(route => (
        <div key={route.path}>
          <Link to={route.path} className="button special" activeClassName="activeRoute">{route.label}</Link>
        </div>
      ));
  }

  render() {
    return (
      <header id="header">
        <div className="inner">
          <Link to="/" className="no-underline" title="Go to homepage">
            <img className="image avatar" src={avatar} alt="Stefan" title="Wow, this is me!"/>
          </Link>
          <h1>
            <strong>My name's Stefan.</strong>
          </h1>
          <h1>I like to build things.</h1>
          <nav>
            <Location>
              { ({location}) => this.getRoutes(location) }
            </Location>
          </nav>
        </div>
        <Footer />
      </header>
    )
  }
}

export default Header
