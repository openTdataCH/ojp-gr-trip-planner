# OJP GR Trip Planner
<br>

<p align="center">
    <img width="250px" src="https://user-images.githubusercontent.com/50701501/104827248-f88a1800-585b-11eb-985e-5e31dbb0b913.jpg" alt='technic-overview'><br/>
</p>
<p align="center">
  <a href="/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
</p>

This is the source-code repository used for developing the OJP GR Trip Planner.

## Quick Resources

- https://opentdatach.github.io/ojp-demo-app/ - The Demonstrator to see live functionality (Radiobutton GR Test)
- [docs](./docs/README.md) - In-Depth documentation of the project
- [GitHub Repo](https://github.com/openTdataCH/ojp-gr-trip-planner) - Repository to codebase

## Prerequisites

- [Node.js](https://nodejs.org) (`>= 16.0.0`)
- [Yarn](https://yarnpkg.com/en/docs/install) or [NPM](https://docs.npmjs.com/getting-started/installing-node)

## Install

- Install the dependencies with [yarn](https://yarnpkg.com/getting-started/usage) or [npm](https://docs.npmjs.com/cli/v7/commands/npm-install).

> Make sure you already have [`node.js`](https://github.com/filoscoder/tenstack-starter#prerequisites) and [`npm`](https://github.com/filoscoder/tenstack-starter#prerequisites) or [`yarn`](https://github.com/filoscoder/tenstack-starter#prerequisites) installed in your system.

## Config

- Add or modify specific variables and update it according to your need.

> Check the `config` folder to customize your settings (`/src/config`)

## Local Development

Run the server locally. It will be run with Nodemon and ready to serve on port `8080` (unless you specify it i `/src/config/index.ts`)

```bash
 yarn dev # or npm dev
```

> Check [`package.json`](https://github.com/filoscoder/tenstack-starter/blob/master/package.json) to see more "scripts"

## Production

First, build the application.

```bash
 yarn build # or npm run build
```

Then, use [`pm2`](https://github.com/Unitech/pm2) to start the application as a service.

```bash
 yarn service:start # or npm run service:start
```
## License

The project is released under a [MIT license](./LICENSE).

Copyright (c) 2021 - 2023 Open Data Platform Mobility Switzerland - [opentransportdata.swiss](https://opentransportdata.swiss/en/).