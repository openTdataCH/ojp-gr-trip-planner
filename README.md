# ojp-gr-trip-planner
<br>

<p align="center">
    <img width="250px" src="https://user-images.githubusercontent.com/50701501/104827248-f88a1800-585b-11eb-985e-5e31dbb0b913.jpg"><br/>
</p>
<p align="center">
  <a href="https://lerna.js.org/"><img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg" alt="Maintained with Lerna"></a>
  <a href="/LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License"></a>
</p>

## Prerequisites

- [Node.js](https://nodejs.org) (`>= 16.0.0`)
- [Yarn](https://yarnpkg.com/en/docs/install) or [NPM](https://docs.npmjs.com/getting-started/installing-node)

## Install

- Install the dependencies with [yarn](https://yarnpkg.com/getting-started/usage) or [npm](https://docs.npmjs.com/cli/v7/commands/npm-install).

> Make sure you already have [`node.js`](https://github.com/filoscoder/tenstack-starter#prerequisites) and [`npm`](https://github.com/filoscoder/tenstack-starter#prerequisites) or [`yarn`](https://github.com/filoscoder/tenstack-starter#prerequisites) installed in your system.

## Config

- Copy `.env.example` a file at the root of the application.
- Add or modify specific variables and update it according to your need.

```bash
 cp .env.example .env
```

> Check the `config` folder to customize your settings (`/src/config`)

<br>
<br>

## Alias @

To make paths clean and ease to access `@` is setup up for `/src` path

```javascript
// BEFORE
import config from './config';
import routes from './routes';

// NOW
import config from '@/config';
import routes from '@/routes';
```

> You can customize this setup:
> `/tsconfig.json` > compilerOptions.paths
> `/eslintrc.yml` > rules.settings.alias.map

<br>
<br>

## Local Development

Run the server locally. It will be run with Nodemon and ready to serve on port `8080` (unless you specify it on your `.env`)

```bash
 yarn start # or npm start
```

> Check [`package.json`](https://github.com/filoscoder/tenstack-starter/blob/master/package.json) to see more "scripts"

<br>
<br>

## Production

First, build the application.

```bash
 yarn build # or npm run build
```

Then, use [`pm2`](https://github.com/Unitech/pm2) to start the application as a service.

```bash
 yarn service:start # or npm run service:start
```
