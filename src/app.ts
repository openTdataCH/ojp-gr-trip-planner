import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import timeout from 'connect-timeout';
import xmlparser from 'express-xml-bodyparser';
import CONFIG from './config';
import { expressPinoLogger } from './helpers';
import * as errorHandler from '@/middlewares/errorHandler';
import routes from '@/routes';

export const createApp = (): express.Application => {
  const app = express();

  const allowedOrigins = ['http://localhost:4200'];

  const options: cors.CorsOptions = {
    origin: allowedOrigins,
  };

  app.use(cors(options));
  app.use(helmet());
  app.use(xmlparser());
  app.use(
    express.urlencoded({
      extended: false,
    }),
  );

  if (CONFIG.APP.ENV !== 'test') {
    app.use(morgan('dev'));
    app.use(expressPinoLogger());
  }

  app.use(timeout(CONFIG.SERVER.TIMEOUT));

  // @ts-ignore
  app.use((req, res, next) => {
    // set the CORS policy
    res.header('Access-Control-Allow-Origin', '*');
    // set the CORS headers
    res.header(
      'Access-Control-Allow-Headers',
      'origin, X-Requested-With,Content-Type,Accept, Authorization',
    );
    // set the CORS method headers
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', 'GET PATCH DELETE POST');
      return res.status(200).json({});
    }
    next();
  });

  // API Routes
  app.use(`/`, routes);

  // Error Middleware
  app.use(errorHandler.genericErrorHandler);
  app.use(errorHandler.notFoundError);

  return app;
};
