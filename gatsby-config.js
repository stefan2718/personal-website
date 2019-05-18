module.exports = {
  siteMetadata: {
    title: "Stefan Battiston - full stack developer",
    author: "Stefan Battiston",
    description: "Blog, web and coding experiments."
  },
  plugins: [
    'gatsby-plugin-react-helmet',
    'gatsby-plugin-catch-links',
    'gatsby-plugin-sharp',
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: 'gatsby-starter-default',
        short_name: 'starter',
        start_url: '/',
        background_color: '#663399',
        theme_color: '#663399',
        display: 'minimal-ui',
        icon: 'src/assets/images/website-icon.png', // This path is relative to the root of the site.
      },
    },
    {
      resolve: 'gatsby-plugin-s3',
      options: {
        bucketName: 'stefanbattiston.com',
        protocol: 'https',
        hostname: 'stefanbattiston.com',
        region: 'ca-central-1',
        acl: null,
      },
    },
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        path: `${__dirname}/src/blog`,
        name: "markdown-pages",
      },
    },
    {
      resolve: 'gatsby-transformer-remark',
      options: {
        "excerpt_separator": '<!-- end -->',
        plugins: [
          'gatsby-remark-autolink-headers',
          'gatsby-remark-prismjs',
          {
            resolve: 'gatsby-remark-images',
            options: {
              maxWidth: 700,
            },
          },
        ]
      },
    },
    'gatsby-plugin-sass',
    'gatsby-plugin-offline'
  ],
}
