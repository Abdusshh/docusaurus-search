# Website

This website is built using [Docusaurus](https://docusaurus.io/), a modern static website generator.

## Upstash Hybrid Index Based Search Usage

Add your credentials to the `.env` file to enable the hybrid index based search.

Make sure the name of you namespace is correct in the [SearchBar file](/src/theme/SearchBar.tsx).

Note: We did not add kafka docs since kafka is deprecated.

### Installation

```
$ yarn
```

### Local Development

```
$ yarn start
```

This command starts a local development server and opens up a browser window. Most changes are reflected live without having to restart the server.

### Build

```
$ yarn build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

### Deployment

Using SSH:

```
$ USE_SSH=true yarn deploy
```

Not using SSH:

```
$ GIT_USER=<Your GitHub username> yarn deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
