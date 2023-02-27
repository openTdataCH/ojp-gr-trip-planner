import { StageConfig } from 'ojp-sdk';

export type PASSIVE_SYSTEM = 'SBB' | 'STA';

export const passiveSystemsConfig: Record<PASSIVE_SYSTEM, StageConfig> = {
  SBB: {
    key: 'SBB',
    apiEndpoint: 'https://odpch-test.cloud.tyk.io/ojp-passiv-int/',
    authBearerKey: '57c5dadd5e6307000100005e473137db130241e5866ecdbce5f74ccb',
  },
  STA: {
    key: 'STA',
    apiEndpoint: 'https://efa.sta.bz.it/ojp/ojp',
    authBearerKey: '',
  },
};
