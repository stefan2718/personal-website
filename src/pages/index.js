import React from 'react'
import Helmet from 'react-helmet'

import HomePageLayout from '../components/layout'

class HomeIndex extends React.Component {

  constructor() {
    super();

    this.state = {
    };
  }

  render() {
    const siteTitle = "Stefan Battiston"
    const siteDescription = "Site description"

    return (
      <HomePageLayout>
        <Helmet>
          <title>{siteTitle}</title>
          <meta name="description" content={siteDescription} />
        </Helmet>

        <div id="main">

          <section id="one">
            <header className="major">
              <h2>I'm a full stack developer, improviser, yogi and cyclist.</h2>
            </header>
            <p>
              <strong>I'm going to put things that interest me on this site.</strong>&nbsp;
              I hope you find them interesting too.
            </p>
          </section>

          <section id="two">
            <h2>Recent blog posts</h2>


            <ul className="actions">
              <li><a href="/blog" className="button">Go to blog</a></li>
            </ul>
          </section>

          <section id="three">
            <h2>Get In Touch</h2>
            <p>Accumsan pellentesque commodo blandit enim arcu non at amet id arcu magna. Accumsan orci faucibus id eu lorem semper nunc nisi lorem vulputate lorem neque lorem ipsum dolor.</p>
            <div className="row">
              <div className="8u 12u$(small)">
                <form method="post" action="#">
                  <div className="row uniform 50%">
                    <div className="6u 12u$(xsmall)"><input type="text" name="name" id="name" placeholder="Name" /></div>
                    <div className="6u 12u$(xsmall)"><input type="email" name="email" id="email" placeholder="Email" /></div>
                    <div className="12u"><textarea name="message" id="message" placeholder="Message" rows="4"></textarea></div>
                  </div>
                </form>
                <ul className="actions">
                  <li><input type="submit" value="Send Message" /></li>
                </ul>
              </div>
              <div className="4u 12u$(small)">
                <ul className="labeled-icons">
                  <li>
                    <h3 className="icon fa-home"><span className="label">Address</span></h3>
                    1234 Somewhere Rd.<br />
                    Nashville, TN 00000<br />
                    United States
                                    </li>
                  <li>
                    <h3 className="icon fa-mobile"><span className="label">Phone</span></h3>
                    000-000-0000
                                    </li>
                  <li>
                    <h3 className="icon fa-envelope-o"><span className="label">Email</span></h3>
                  </li>
                </ul>
              </div>
            </div>
          </section>

        </div>

      </HomePageLayout>
    )
  }
}

export default HomeIndex