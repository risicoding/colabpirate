import { logger } from "./logger.js";

export class AppError {
  tag: string;
  error?: Error;
  meta?: any;
  constructor(
    public readonly message?: string,
    err?: unknown,
    meta?: unknown,
  ) {
    if (err && err instanceof Error) {
      this.error = err;
    }
    if (meta) this.meta = meta;

    Object.setPrototypeOf(this, new.target.prototype);

    this.tag = new.target.name;
  }

  public log(msg?: string) {
    logger.error(`${this.tag} ${this.message}${msg ? ` ${msg}` : ""}`);
    logger.debug(this.error);
  }
}
