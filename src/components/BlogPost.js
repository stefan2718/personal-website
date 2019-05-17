import React from "react"
import { graphql } from "gatsby"
import HomePageLayout from "./HomePageLayout";

export default function Template({
  data, // this prop will be injected by the GraphQL query below.
}) {
  const { markdownRemark } = data // data.markdownRemark holds our post data
  const { frontmatter, html } = markdownRemark
  return (
    <HomePageLayout location={{ pathname: "/blog" }}>
      <div id="main">
        <div className="inner-main">
          <h1>{frontmatter.title}</h1>
          <time dateTime={frontmatter.dateISO}>{frontmatter.date}</time>
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
        dateISO: date
        date(formatString: "MMMM DD, YYYY")
        path
        title
      }
    }
  }
`