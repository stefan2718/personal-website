import React from 'react'
import Helmet from 'react-helmet'
import { Link } from 'gatsby'
import { graphql } from "gatsby"

import HomePageLayout from '../components/HomePageLayout'
import BlogSummary from '../components/BlogSummary'

class HomeIndex extends React.Component {

  constructor() {
    super();

    this.state = {
    };
  }

  render() {
    // TODO:
    const siteDescription = "Site description"
    return (
      <HomePageLayout location={this.props.location}>
        <Helmet>
          <title>Stefan Battiston</title>
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
            {this.props.data.allMarkdownRemark.edges.map(edge => 
              <BlogSummary
                key={edge.node.frontmatter.path}
                path={edge.node.frontmatter.path}
                date={edge.node.frontmatter.date}
                dateISO={edge.node.frontmatter.dateISO}
                title={edge.node.frontmatter.title}
                excerpt={edge.node.excerpt}
                />
            )}
            <ul className="actions">
              <li><Link to="/blog" className="button">See all posts</Link></li>
            </ul>
          </section>

          <section id="three">
            <h2>The Lab</h2>
            <p>These are some code experiments that I've been working on.</p>
            {/* A tile layout with image per project. */}
            <div>Example</div>
            <ul className="actions">
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
    limit: 2
  ) {
    edges {
      node {
        excerpt(pruneLength: 240)
        frontmatter {
          dateISO: date
          date(formatString: "MMMM DD, YYYY")
          path
          title
        }
      }
    }
  }
}`

export default HomeIndex