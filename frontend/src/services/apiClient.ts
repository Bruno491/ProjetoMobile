let accessToken: string | null = null;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

function getErrorDetail(body: unknown): string | null {
  if (typeof body !== 'object' || body === null || !('detail' in body)) {
    return null;
  }

  const detail = body.detail;
  if (typeof detail === 'string') {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .flatMap((error: unknown) =>
        typeof error === 'object' &&
        error !== null &&
        'msg' in error &&
        typeof error.msg === 'string'
          ? [error.msg]
          : [],
      )
      .join('\n');
  }

  return null;
}

export async function apiRequest(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error('O endereço do serviço não está configurado.');
  }

  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      'Não foi possível conectar ao serviço. Verifique sua conexão e tente novamente.',
    );
  }

  if (response.status === 204) {
    return undefined;
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new Error('O serviço retornou uma resposta inválida.');
  }

  if (!response.ok) {
    throw new ApiError(
      getErrorDetail(body) ?? `O serviço retornou um erro (${response.status}).`,
      response.status,
    );
  }

  return body;
}
