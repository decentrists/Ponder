import { IDBPDatabase, openDB } from 'idb';
import { Podcast } from './client/interfaces';

export class IndexedDb {
  private database: string;

  private db: any;

  public static DB_VERSION = 1;

  public static DB_V1_SCHEMA : [string, IDBObjectStoreParameters][] = [
    [
      'subscriptions',
      { autoIncrement: false, keyPath: 'subscribeUrl' },
    ],
    [
      'episodes',
      { autoIncrement: false, keyPath: 'subscribeUrl' },
    ],
  ];

  public static DB_ERROR_GENERIC_HELP_MESSAGE = [
    'If a refresh does not fix this, please contact our development team. You may attempt to',
    'resolve this yourself by loading a backup of your subscriptions. A last resort would be',
    'to clear the IndexedDB field from your browser\'s developer tools, but this will clear all',
    'cached data, including your subscriptions.',
  ].join(' ');

  constructor(database: string) {
    this.database = database;
  }

  private async connectDB() {
    if (!this.db) {
      console.debug('(re)connecting DB');
      try {
        this.db = await openDB(this.database, IndexedDb.DB_VERSION);
      }
      catch (ex) {}
    }
  }

  public async initializeDBSchema() {
    await this.createObjectStore(IndexedDb.DB_V1_SCHEMA);
  }

  private async createObjectStore(tables: [string, IDBObjectStoreParameters][]) {
    try {
      this.db = await openDB(this.database, IndexedDb.DB_VERSION, {
        upgrade(db: IDBPDatabase) {
          for (const [tableName, params] of tables) {
            if (db.objectStoreNames.contains(tableName)) continue;

            console.debug(`creating ${tableName}`, params);
            db.createObjectStore(tableName, params);
          }
        },
      });
    }
    catch (ex) {
      throw new Error(`Initialization of database tables failed: ${ex}`);
    }
  }

  public async getBySubscribeUrl(tableName: string, subscribeUrl: Podcast['subscribeUrl']) {
    await this.connectDB();

    const tx = this.db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    const result = await store.get(subscribeUrl);
    return result;
  }

  public async getValue(tableName: string, id: number) {
    await this.connectDB();

    const tx = this.db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    const result = await store.get(id);
    return result;
  }

  public async getAllValues(tableName: string) {
    await this.connectDB();

    const tx = this.db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    const result = await store.getAll();
    return result;
  }

  public async putValue(tableName: string, value: object) {
    await this.connectDB();

    const tx = this.db.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);
    const result = await store.put(value);
    return result;
  }

  public async deleteSubscription(tableName: string, subscribeUrl: Podcast['subscribeUrl']) {
    await this.connectDB();

    const tx = this.db.transaction(tableName, 'readwrite');
    const store = tx.objectStore(tableName);
    const result = await store.get(subscribeUrl);
    if (!result) return result;

    await store.delete(subscribeUrl);
    return subscribeUrl;
  }

  // public async putBulkValue(tableName: string, values: object[]) {
  //   await this.connectDB();

  //   const tx = this.db.transaction(tableName, 'readwrite');
  //   const store = tx.objectStore(tableName);
  //   for (const value of values) {
  //     await store.put(value);
  //   }
  //   return this.getAllValues(tableName);
  // }
}

export default IndexedDb;
