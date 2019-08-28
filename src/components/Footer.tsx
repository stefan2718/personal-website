import React from 'react'

class Footer extends React.Component {
  render() {
    return (
      <div id="footer">
        <div className="inner">
          <ul className="icons">
            <li><a href="https://github.com/stefan2718" className="icon fa-github"><span className="label">Github</span></a></li>
            <li><a href="https://www.linkedin.com/in/stefan-battiston/" className="icon fa-linkedin"><span className="label">LinkedIn</span></a></li>
          </ul>
          <ul className="copyright">
            <li>Built with <a href="https://www.gatsbyjs.org/">Gatsby</a> and <a href="https://reactjs.org">React</a></li>
            <li>
              How fast is this site?&nbsp;
              <a rel="noopener noreferrer" target="_blank" href="https://developers.google.com/speed/pagespeed/insights/?url=https://stefanbattiston.com">Check Speed</a>
            </li>
          </ul>
        </div>
      </div>
    )
  }
}

export default Footer
