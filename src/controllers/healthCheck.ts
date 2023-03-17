import { Request, Response } from 'express';
import { ExchangePoints } from '../utils/exchangePoints';

export const getHealthCheck = async (_: Request, res: Response) => {
  res.set('Content-Type', 'application/json');
  return res.status(200).send(
    JSON.stringify({
      unavailableSystems: ExchangePoints.getUnavailableSystems(),
    }),
  );
};
