import { createApp } from './app';
import { startServer } from './server';

if (process.env.NODE_ENV !== 'test') {
  const app = createApp();
  startServer(app);
}
