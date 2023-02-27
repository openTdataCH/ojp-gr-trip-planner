const FORBIDDEN = 403;

class ForbiddenError {
  readonly status: number;
  readonly message: string;

  constructor(message: string) {
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = FORBIDDEN;
    this.message = message;
  }
}

export default ForbiddenError;
