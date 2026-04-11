export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

export function successResponse<T>(data: T): { data: T; error: null } {
  return { data, error: null };
}

export function errorResponse(
  message: string,
  code: string
): { data: null; error: { message: string; code: string } } {
  return { data: null, error: { message, code } };
}
