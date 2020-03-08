import React from 'react'
import Helmet from 'react-helmet'
import { graphql } from "gatsby"

import BlogSummary from '../components/BlogSummary'
import HomePageLayout from '../components/HomePageLayout'
import { IGatsbyProps } from '../util/interfaces';

class Blog extends React.Component<IGatsbyProps> {

  constructor(props: IGatsbyProps) {
    super(props);
  }

  render() {
    const { data } = this.props;
    const siteDescription = "Listing of all the blog posts written by Stefan Battiston"

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
                  excerpt={edge.node.frontmatter.description}
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
    filter: { frontmatter: { draft: { eq: false }}}
    limit: 10
  ) {
    ...BlogPostFragment
  }
}`

export default Blog