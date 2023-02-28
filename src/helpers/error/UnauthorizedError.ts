import HttpStatus from 'http-status/lib';

const UNAUTHORIZED = 401;

class UnauthorizedError {
  readonly status: number;
  readonly message: string;

  constructor(message: string) {
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = UNAUTHORIZED;
    this.message = message || (HttpStatus[UNAUTHORIZED] as string);
  }
}

export default UnauthorizedError;
