export default class OnlyOneElementException {
  readonly status: number;
  readonly message: string;

  constructor() {
    Object.setPrototypeOf(this, new.target.prototype);

    this.status = 400;
    this.message = 'Array must have exactly one element.';
  }
}
