// ! Don't convert require into import
/* eslint-disable @typescript-eslint/no-var-requires*/
// tslint:disable-next-line:no-var-requires

import { dirname } from 'path';
import { addAlias } from 'module-alias';

const __filename = fileURLToPath(import.meta.url);

const __dirname = dirname(__filename);

addAlias('@', __dirname);

import { createApp } from './app';
import { startServer } from './server';
// eslint-disable-next-line import/order
import { fileURLToPath } from 'url';

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  startServer(app);
}
