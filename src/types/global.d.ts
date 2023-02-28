import { Request, Response, NextFunction } from 'express';

declare global {
  type Req = Request;
  type Res = Response;
  type NextFn = NextFunction;
  type ResponseData<T> = {
    opcode: number;
    message: string;
    data?: T;
  };
}
