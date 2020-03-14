import React from "react"
import Helmet from 'react-helmet'
import { graphql } from "gatsby"
import HomePageLayout from "./HomePageLayout";
import { Query } from "../graphql";

export default function Template({ data }: { data: Query }) {
  const { markdownRemark } = data // data.markdownRemark holds our post data
  const { frontmatter, html } = markdownRemark
  return (
    <HomePageLayout location={{ pathname: "/blog" }}>
      <Helmet>
        <title>{frontmatter.title}</title>
        <meta name="description" content={frontmatter.description} />
      </Helmet>
      <div id="main">
        <div className="inner-main">
          <h1>{frontmatter.title}</h1>
          <time dateTime={frontmatter.dateISO}>{frontmatter.publishedDate}</time>
          <article
            className="blog-post-content"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>
    </HomePageLayout>
  )
}

export const pageQuery = graphql`
  query($path: String!) {
    markdownRemark(frontmatter: { path: { eq: $path } }) {
      html
      frontmatter {
        dateISO: publishedDate 
        publishedDate(formatString: "MMMM DD, YYYY")
        updatedDate(formatString: "MMMM DD, YYYY")
        path
        title
        description
        draft
      }
    }
  }
`