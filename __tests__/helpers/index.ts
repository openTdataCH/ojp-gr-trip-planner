import supertest, { SuperAgentTest } from 'supertest';

import { createApp } from '../../src/app';

export const initAgent = async (): Promise<SuperAgentTest> => {
  const app = createApp();
  return supertest.agent(app);
};
