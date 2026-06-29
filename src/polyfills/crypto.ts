type CryptoWithRandomValues = {
  getRandomValues?: <T extends ArrayBufferView | null>(array: T) => T;
};

const crypto = (globalThis.crypto ?? {}) as CryptoWithRandomValues;

function insecureRandomValues<T extends ArrayBufferView | null>(array: T): T {
  if (!array || !ArrayBuffer.isView(array)) {
    throw new TypeError('Expected an integer typed array');
  }

  const bytes = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);

  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = Math.floor(Math.random() * 256);
  }

  return array;
}

function getRandomValues<T extends ArrayBufferView | null>(array: T): T {
  const expoCrypto = globalThis.expo?.modules?.ExpoCrypto;

  if (expoCrypto?.getRandomValues) {
    expoCrypto.getRandomValues(array);
    return array;
  }

  if (__DEV__) {
    return insecureRandomValues(array);
  }

  throw new Error('ExpoCrypto.getRandomValues is not available');
}

if (typeof crypto.getRandomValues !== 'function') {
  crypto.getRandomValues = getRandomValues;
  globalThis.crypto = crypto as Crypto;
}
