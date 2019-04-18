import React from 'react'

class Footer extends React.Component {
    render() {
        return (
            <div id="footer">
                <div className="inner">
                    <ul className="icons">
                        <li><a href="https://www.twitter.com/webappseed/" className="icon fa-twitter"><span className="label">Twitter</span></a></li>
                        <li><a href="https://www.facebook.com/webappseed/" className="icon fa-facebook"><span className="label">Facebook</span></a></li>
                        <li><a href="https://github.com/rosoftdeveloper/starter-gatsbyjs-strata" className="icon fa-github"><span className="label">Github</span></a></li>
                        <li><a href="https://blog.appseed.us" className="icon fa-rss"><span className="label">Github</span></a></li>
                    </ul>
                    <ul className="copyright">
                        <li>&copy; Gatsby Starter Strata</li><li>Design: HTML5 UP</li>
                    </ul>
                </div>
            </div>
        )
    }
}

export default Footer
