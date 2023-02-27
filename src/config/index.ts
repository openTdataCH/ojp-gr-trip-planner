import pkg from '../../package.json';

// https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
// eslint-disable-next-line @typescript-eslint/no-var-requires
import { config } from 'dotenv';
import { passiveSystemsConfig } from '../config/passiveSystems';

config();

const CONFIG = {
  APP: {
    NAME: pkg.name,
    VERSION: pkg.version,
    VER: `v${pkg.version[0]}`,
    DESCRIPTION: pkg.description,
    AUTHORS: pkg.authors,
    HOST: process.env.APP_HOST,
    BASE_URL: process.env.API_BASE_URL,
    PORT: process.env.NODE_ENV === 'test' ? 8888 : process.env.PORT || 8080,
    ENV: process.env.NODE_ENV,
  },
  SERVER: {
    TIMEOUT: 60000, // 1m
  },
  LOG: {
    PATH: process.env.LOGGING_DIR || 'logs',
    LEVEL: process.env.LOGGING_LEVEL || 'info',
    MAX_FILES: process.env.LOGGING_MAX_FILES || 5,
  },
  AUTH: {
    SALT_ROUNDS: process.env.SALT_ROUNDS || '11',
    ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_DURATION || '300000',
    REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_DURATION || '86400000',
    ACCESS_TOKEN_SALT: process.env.ACCESS_TOKEN_SALT,
    REFRESH_TOKEN_SALT: process.env.REFRESH_TOKEN_SALT,
  },
  EXTERNAL: {
    API_KEY: process.env.API_KEY,
  },
  PASSIVE_SYSTEMS: passiveSystemsConfig,
} as const;

export default CONFIG;