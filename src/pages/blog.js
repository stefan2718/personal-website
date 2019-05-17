import React from 'react'
import Helmet from 'react-helmet'
import { graphql } from "gatsby"

import BlogSummary from '../components/BlogSummary'
import HomePageLayout from '../components/HomePageLayout'

class Blog extends React.Component {

  constructor() {
    super();

    this.state = {
    };
  }

  render() {
    const { data } = this.props;
    const siteDescription = "Site description"

    return (
      <HomePageLayout location={this.props.location}>
        <Helmet>
          <title>Stefan's blog posts</title>
          <meta name="description" content={siteDescription} />
        </Helmet>
        <div id="main">
          <div className="inner-main">
            <h1>All Posts</h1>
            <main>
              {data.allMarkdownRemark.edges.map(edge => 
                <BlogSummary 
                  key={edge.node.frontmatter.path}
                  path={edge.node.frontmatter.path}
                  date={edge.node.frontmatter.date}
                  dateISO={edge.node.frontmatter.dateISO}
                  title={edge.node.frontmatter.title}
                  excerpt={edge.node.excerpt}
                  />
              )}
            </main>
          </div>
        </div>
      </HomePageLayout>
    )
  }
}

export const pageQuery = graphql`
{
  allMarkdownRemark(
    sort: { order: DESC, fields: [frontmatter___date] }
    limit: 10
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

export default Blog