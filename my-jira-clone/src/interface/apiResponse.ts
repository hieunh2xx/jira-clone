export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
}
export function isApiResponse<T>(response: any): response is ApiResponse<T> {
  return (
    response &&
    typeof response === 'object' &&
    typeof response.code === 'number' &&
    typeof response.message === 'string' &&
    ('data' in response || response.data === null)
  );
}