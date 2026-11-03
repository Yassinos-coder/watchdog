const SERVER_ERROR_STATUS = 500;

export class ExceptionPolicy {
  static shouldReport(exception: unknown): boolean {
    const status = ExceptionPolicy.statusOf(exception);
    return status === undefined || status >= SERVER_ERROR_STATUS;
  }

  private static statusOf(exception: unknown): number | undefined {
    if (typeof exception !== 'object' || exception === null) {
      return undefined;
    }
    const candidate = exception as { getStatus?: unknown; status?: unknown; statusCode?: unknown };
    if (typeof candidate.getStatus === 'function') {
      const status = (candidate.getStatus as () => unknown).call(exception);
      return typeof status === 'number' ? status : undefined;
    }
    const status = candidate.status ?? candidate.statusCode;
    return typeof status === 'number' ? status : undefined;
  }
}
