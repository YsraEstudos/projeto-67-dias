interface StoredTheoreticalContentBinary {
  storageKey: string;
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}

const DB_NAME = 'concurso-theoretical-content';
const STORE_NAME = 'files';
const memoryStore = new Map<string, StoredTheoreticalContentBinary>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

const requestToPromise = <T>(request: IDBRequest<T>): Promise<T> =>
  new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha no IndexedDB.'));
  });

const transactionDone = (transaction: IDBTransaction): Promise<void> =>
  new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Falha na transação.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Transação abortada.'));
  });

const getDatabase = async (): Promise<IDBDatabase | null> => {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'storageKey' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Nao foi possivel abrir o IndexedDB.'));
    }).catch(() => null);
  }

  return dbPromise;
};

export const saveTheoreticalContentBinary = async (input: {
  storageKey: string;
  file: File;
}): Promise<void> => {
  const record: StoredTheoreticalContentBinary = {
    storageKey: input.storageKey,
    filename: input.file.name,
    mimeType: input.file.type,
    bytes: new Uint8Array(await input.file.arrayBuffer()),
  };

  memoryStore.set(input.storageKey, record);

  const database = await getDatabase();
  if (!database) {
    return;
  }

  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).put(record);
  await transactionDone(transaction);
};

export const loadTheoreticalContentBinary = async (
  storageKey: string,
): Promise<StoredTheoreticalContentBinary | null> => {
  const memoryRecord = memoryStore.get(storageKey);
  if (memoryRecord) {
    return memoryRecord;
  }

  const database = await getDatabase();
  if (!database) {
    return null;
  }

  const record = await requestToPromise(
    database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(storageKey),
  );

  if (!record) {
    return null;
  }

  const typedRecord = record as StoredTheoreticalContentBinary;
  memoryStore.set(storageKey, typedRecord);
  return typedRecord;
};

export const removeTheoreticalContentBinary = async (storageKey: string): Promise<void> => {
  memoryStore.delete(storageKey);

  const database = await getDatabase();
  if (!database) {
    return;
  }

  const transaction = database.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).delete(storageKey);
  await transactionDone(transaction);
};
