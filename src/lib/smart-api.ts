const SMART_API_BASE_URL = 'https://sabuss.com/vtu/api';

function getCredentials() {
  const apiKey = process.env.SMART_API_KEY;
  const pin = process.env.SMART_API_PIN;

  if (!apiKey || !pin) {
    throw new Error('Smart API credentials are not configured.');
  }

  return { apiKey, pin };
}

export type SmartApiResult = {
  code?: number | string;
  status?: string | number | boolean;
  response?: string;
  reference?: string;
  product?: string;
  recipient?: string;
  amount?: number | string;
  date?: string;
  [key: string]: unknown;
};

export async function smartApiRequest(
  endpoint: 'buy' | 'query',
  fields: Record<string, string | number>
): Promise<SmartApiResult> {
  const { apiKey, pin } = getCredentials();

  const response = await fetch(
    `${SMART_API_BASE_URL}/${endpoint}/${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        pin,
        ...Object.fromEntries(
          Object.entries(fields).map(([key, value]) => [
            key,
            String(value),
          ])
        ),
      }),
      cache: 'no-store',
    }
  );

  const text = await response.text();

  let data: SmartApiResult;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Smart API returned an invalid response (HTTP ${response.status}).`
    );
  }

  return data;
}

export async function buySmartAirtime(params: {
  planId: string | number;
  phone: string;
  amount: number;
  reference: string;
}) {
  return smartApiRequest('buy', {
    plan_id: params.planId,
    phone: params.phone,
    amount: params.amount,
    reference: params.reference,
  });
}

export async function buySmartData(params: {
  planId: string | number;
  phone: string;
  reference: string;
}) {
  return smartApiRequest('buy', {
    plan_id: params.planId,
    phone: params.phone,
    reference: params.reference,
  });
}

export async function querySmartTransaction(reference: string) {
  return smartApiRequest('query', {
    reference,
  });
}
