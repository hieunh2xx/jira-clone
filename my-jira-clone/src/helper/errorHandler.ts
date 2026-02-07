
export interface ApiError extends Error {
  code?: number;
  data?: any;
}
export function getErrorMessage(error: unknown, defaultMessage: string = 'Đã có lỗi xảy ra'): string {
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }
  if (typeof error === 'string') {
    return error;
  }
  return defaultMessage;
}
export function getErrorCode(error: unknown): number | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return (error as ApiError).code;
  }
  return undefined;
}
export function getErrorData(error: unknown): any {
  if (error && typeof error === 'object' && 'data' in error) {
    return (error as ApiError).data;
  }
  return undefined;
}
export function isUnauthorizedError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 401;
}
export function isNotFoundError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 404;
}
export function isBadRequestError(error: unknown): boolean {
  const code = getErrorCode(error);
  return code === 400;
}