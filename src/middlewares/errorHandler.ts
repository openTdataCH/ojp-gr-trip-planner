import { NextFunction, Request, Response } from 'express';

import HttpStatus from 'http-status/lib';
import { TimeOutError } from '../helpers/error';

const NOT_FOUND = 404;
const INTERNAL_SERVER_ERROR = 500;
const REQUEST_TIMEOUT = 408;

/**
 * @description Error response middleware for 404 not found. This middleware function should be at the very bottom of the stack.
 * @param req Express.Request
 * @param res Express.Response
 * @param _next Express.NextFunction
 */
export const notFoundError = (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  res.status(NOT_FOUND).json({
    error: {
      code: NOT_FOUND,
      message: HttpStatus[NOT_FOUND],
      path: req.originalUrl,
    },
  });
};

/**
 * @description Generic error response middleware for validation and internal server errors.
 * @param {*} err
 * @param {object}   req Express.Request
 * @param {object}   res Express.Response
 * @param {function} _next Express.NextFunction
 */
export const genericErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let resCode: number = err.status || INTERNAL_SERVER_ERROR;
  let resBody = err;

  if (err.code === 'ETIMEDOUT') {
    resCode = REQUEST_TIMEOUT;
    resBody = new TimeOutError(req.originalUrl);
  }

  res.status(resCode).json(resBody);
};
