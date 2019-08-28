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
    'gatsby-plugin-typescript',
    {
      resolve: 'gatsby-plugin-manifest',
      options: {
        name: 'Stefan Battiston\'s site',
        short_name: 'Stefan',
        start_url: '/',
        background_color: '#49bf9d',
        theme_color: '#49bf9d',
        display: 'standalone',
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
      resolve: 'gatsby-plugin-canonical-urls',
      options: {
        siteUrl: 'https://stefanbattiston.com',
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
              withWebp: true,
            },
          },
        ]
      },
    },
    'gatsby-plugin-sass',
    { 
      resolve: `gatsby-plugin-purgecss`,
      options: {
        // printRejected: true, // Print removed selectors and processed file names
        develop: true, // Enable while using `gatsby develop`
        // tailwind: true, // Enable tailwindcss support
        // whitelist: ['whitelist'], // Don't remove this selector
        ignore: ['prismjs/'], // Ignore files/folders
        // purgeOnly : ['components/', '/main.css', 'bootstrap/'], // Purge only these files/folders
      }
    },
    // TODO cache wasm.
    'gatsby-plugin-offline'
  ],
}
