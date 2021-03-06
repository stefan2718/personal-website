/**
 * Implement Gatsby's Node APIs in this file.
 *
 * See: https://www.gatsbyjs.org/docs/node-apis/
 */

const path = require("path")
const WorkerPlugin = require("worker-plugin");

exports.createPages = ({ actions, graphql }) => {
  const { createPage } = actions

  const blogPostTemplate = path.resolve(`src/components/BlogPost.tsx`)

  return graphql(`
    {
      allMarkdownRemark(
        sort: { order: DESC, fields: [frontmatter___publishedDate] }
        limit: 1000
      ) {
        edges {
          node {
            frontmatter {
              path
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }

    result.data.allMarkdownRemark.edges.forEach(({ node }) => {
      createPage({
        path: node.frontmatter.path,
        component: blogPostTemplate,
        context: {}, // additional data can be passed via context
      })
    })
  })
}

exports.onCreateWebpackConfig = ({ stage, loaders, actions }) => {
  actions.setWebpackConfig({
    plugins: [
      new WorkerPlugin({
        globalObject: false
      }),
    ]
  })
  if (stage === "build-html") {
    actions.setWebpackConfig({
      module: {
        rules: [
          {
            // Prevents wasm module from being bundled into html (which throws an error)
            test: /worker\.js/,
            use: loaders.null(),
          },
        ],
      },
    })
  }
}