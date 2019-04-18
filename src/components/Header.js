import React from 'react'

import Footer from './Footer'
import avatar from '../assets/images/avatar.jpg'

class Header extends React.Component {
    render() {
        return (
            <header id="header">
                <div className="inner">
                    <a href="#" className="image avatar"><img src={avatar} alt="" /></a>
                    <h1><strong>I am Strata</strong>, a GatsbyJS starter
                    <br />Crafted by <a href="http://html5up.net">HTML5 UP</a>.
                    <br />Enhanced by <a href="https://appseed.us">AppSeed</a>.
                    </h1>
                </div>
                <Footer />
            </header>
        )
    }
}

export default Header
