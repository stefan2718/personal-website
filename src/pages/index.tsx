import React from 'react'
import Helmet from 'react-helmet'
import { Link, graphql } from 'gatsby'

import HomePageLayout from '../components/HomePageLayout'
import BlogSummary from '../components/BlogSummary'
import { IGatsbyProps } from '../util/interfaces';
import LabRoutes from '../components/LabRoutes';

class HomeIndex extends React.Component<IGatsbyProps> {

  constructor(props: IGatsbyProps) {
    super(props);
  }

  render() {
    const siteDescription = "Stefan - full stack developer, improviser, yogi, cyclist."
    return (
      <HomePageLayout location={this.props.location}>
        <Helmet>
          <title>Stefan Battiston</title>
          <meta name="description" content={siteDescription} />
        </Helmet>

        <div id="main">
          <section id="one">
            <header className="major">
              <h2>I'm a full stack developer, improviser, yogi, and cyclist.</h2>
            </header>
            <p>
              <strong>I'm going to put things that interest me on this site.</strong>&nbsp;
              I hope you find them interesting too.
            </p>
          </section>

          <section id="two">
            <h2>Recent blog posts</h2>
            {this.props.data.allMarkdownRemark.edges.map(edge => 
              <BlogSummary
                key={edge.node.frontmatter.path}
                path={edge.node.frontmatter.path}
                date={edge.node.frontmatter.date}
                dateISO={edge.node.frontmatter.dateISO}
                title={edge.node.frontmatter.title}
                excerpt={edge.node.frontmatter.description}
                />
            )}
            <ul className="actions">
              <li><Link to="/blog" className="button">See all posts</Link></li>
            </ul>
          </section>

          <section id="three">
            <h2>The Lab</h2>
            <p>These are some code experiments that I've been working on.</p>
            <div>
              <LabRoutes></LabRoutes>
            </div>
            <ul className="actions" style={{marginTop: "20px"}}>
              <li><Link to="/lab" className="button">Tour the Lab</Link></li>
            </ul>
          </section>
        </div>
      </HomePageLayout>
    )
  }
}

export const pageQuery = graphql`
{
  allMarkdownRemark(
    sort: { order: DESC, fields: [frontmatter___date] }
    filter: { frontmatter: { draft: { eq: false }}}
    limit: 2
  ) {
    ...BlogPostFragment
  }
}`

export default HomeIndex