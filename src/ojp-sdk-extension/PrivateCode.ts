export class PrivateCode {
  public system: PrivateCodeSystems;
  public value: string;

  constructor(system: PrivateCodeSystems, value: string) {
    this.system = system;
    this.value = value;
  }
}

export type PrivateCodeSystems = 'EFA' | 'LA-ExchangePoint-ID';
