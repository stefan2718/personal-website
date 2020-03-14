import { graphql } from "gatsby"

export const variableName = graphql`
fragment BlogPostFragment on MarkdownRemarkConnection {
  edges {
    node {
      excerpt(pruneLength: 240)
      frontmatter {
        dateISO: publishedDate
        publishedDate(formatString: "MMMM DD, YYYY")
        description
        path
        title
      }
    }
  }
}
`