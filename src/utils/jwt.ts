export interface JwtDecoded {
  header: Record<string, any>;
  payload: Record<string, any>;
  signature: string;
  isExpired: boolean;
  issuedAt?: string;
  expiresAt?: string;
  notBefore?: string;
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (err) {
    return decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
  }
}

export function parseJwt(token: string): { success: boolean; data?: JwtDecoded; error?: string } {
  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return {
      success: false,
      error: 'Invalid JWT format. A JSON Web Token must have 3 dot-separated parts (header.payload.signature).',
    };
  }

  try {
    const headerStr = base64UrlDecode(parts[0]);
    const payloadStr = base64UrlDecode(parts[1]);

    const header = JSON.parse(headerStr);
    const payload = JSON.parse(payloadStr);

    let isExpired = false;
    let expiresAt: string | undefined;
    let issuedAt: string | undefined;
    let notBefore: string | undefined;

    const nowSeconds = Math.floor(Date.now() / 1000);

    if (typeof payload.exp === 'number') {
      isExpired = payload.exp < nowSeconds;
      expiresAt = new Date(payload.exp * 1000).toISOString();
    }
    if (typeof payload.iat === 'number') {
      issuedAt = new Date(payload.iat * 1000).toISOString();
    }
    if (typeof payload.nbf === 'number') {
      notBefore = new Date(payload.nbf * 1000).toISOString();
    }

    return {
      success: true,
      data: {
        header,
        payload,
        signature: parts[2],
        isExpired,
        issuedAt,
        expiresAt,
        notBefore,
      },
    };
  } catch (e: any) {
    return {
      success: false,
      error: e.message || 'Failed to decode base64url JSON segments.',
    };
  }
}
