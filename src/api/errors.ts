export class HevyError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "HevyError";
  }
}

export class UsageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UsageError";
  }
}
