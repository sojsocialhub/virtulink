const DEFAULT_NO1VERIFY_API_URL = 'https://no1verify.com/api/v1';

export class No1VerifyError extends Error {
  constructor(
    message: string,
    public readonly kind: 'confirmed' | 'ambiguous',
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'No1VerifyError';
  }
}

function getApiUrl(): string {
  const url = process.env.NO1VERIFY_API_URL?.trim() || DEFAULT_NO1VERIFY_API_URL;
  return url.replace(/\/+$/, '');
}

function getApiKey(): string {
  return process.env.NO1VERIFY_API_KEY?.trim() || '';
}

export async function no1verifyGet(
  path: string,
  query: Record<string, string | number> = {},
): Promise<any> {
  const key = getApiKey();

  if (!key) {
    throw new No1VerifyError('NO1VERIFY_API_KEY is not configured.', 'confirmed');
  }

  const url = new URL(getApiUrl() + path);
  for (const [name, value] of Object.entries(query)) {
    url.searchParams.set(name, String(value));
  }

  let response: Response;

  try {
    response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${key}`,
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new No1VerifyError('Unable to reach No1Verify.', 'ambiguous');
  }

  const text = await response.text();
  let data: any;

  try {
    data = JSON.parse(text);
  } catch {
    throw new No1VerifyError(
      `No1Verify returned an invalid response (${response.status}).`,
      'ambiguous',
    );
  }

  if (!response.ok || data?.success === false) {
    throw new No1VerifyError(
      String(data?.message || `No1Verify request failed (HTTP ${response.status}).`),
      'confirmed',
      data?.code ? String(data.code) : undefined,
    );
  }

  return data;
}

export async function no1verifyProducts(
  params: { page?: number; limit?: number; q?: string } = {},
) {
  const query: Record<string, string | number> = {
    limit: Math.min(Math.max(params.limit ?? 20, 1), 100),
  };

  if (params.page && params.page > 1) query.page = params.page;
  if (params.q && params.q.trim()) query.q = params.q.trim();

  const data = await no1verifyGet('/products', query);

  return {
    items: Array.isArray(data?.data?.items) ? data.data.items : [],
    pagination: data?.data?.pagination ?? null,
  };
}
