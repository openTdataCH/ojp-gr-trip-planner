import * as OJP from 'ojp-sdk';

export type PASSIVE_SYSTEM = 'SBB' | 'STA';

export const passiveSystemsConfig: Record<PASSIVE_SYSTEM, OJP.StageConfig> = {
  SBB: {
    key: 'SBB',
    apiEndpoint: 'https://api.opentransportdata.swiss/ojp2020',
    authBearerKey: '57c5dbbbf1fe4d0001000018e0f7158cb2b347e3a6745e3ef949e7bf',
  },
  STA: {
    key: 'STA',
    apiEndpoint: 'https://efa.sta.bz.it/ojp/ojp',
    authBearerKey: '',
  },
};
