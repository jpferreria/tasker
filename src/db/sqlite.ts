import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';

export interface DatabaseClient {
  execute(sql: string, params?: any[]): Promise<any>;
  select<T = any>(sql: string, params?: any[]): Promise<T[]>;
}

class TauriDatabaseClient implements DatabaseClient {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    return this.db.execute(sql, params);
  }

  async select<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.db.select(sql, params);
  }
}

class SqlJsDatabaseClient implements DatabaseClient {
  private db: SqlJsDatabase;
  private storageKey = 'horizon_planner_sqlite_backup';

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    try {
      this.db.run(sql, params);
      this.persist();
      return { rowsAffected: this.db.getRowsModified() };
    } catch (err) {
      console.error('SQL Execution Error:', sql, params, err);
      throw err;
    }
  }

  async select<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    try {
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }
      stmt.free();
      return results;
    } catch (err) {
      console.error('SQL Select Error:', sql, params, err);
      throw err;
    }
  }

  private persist() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const data = this.db.export();
        // Store binary as base64 string
        let binary = '';
        const bytes = new Uint8Array(data);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        window.localStorage.setItem(this.storageKey, btoa(binary));
      } catch (e) {
        console.warn('Could not persist SQLite to localStorage', e);
      }
    }
  }
}

let dbInstance: DatabaseClient | null = null;

export async function getDatabase(): Promise<DatabaseClient> {
  if (dbInstance) return dbInstance;

  // Check if running in native Tauri
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

  if (isTauri) {
    try {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      const tauriDb = await Database.load('sqlite:horizon_planner.db');
      dbInstance = new TauriDatabaseClient(tauriDb);
      return dbInstance;
    } catch (err) {
      console.warn('Tauri SQL plugin load failed, falling back to SQLite WASM:', err);
    }
  }

  // Web / Test / Dev SQLite WASM Engine (vendored locally for offline support & security)
  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm'
  });

  let loadedDb: SqlJsDatabase | null = null;

  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem('horizon_planner_sqlite_backup');
    if (saved) {
      try {
        const binaryStr = atob(saved);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        loadedDb = new SQL.Database(bytes);
      } catch (e) {
        console.warn('Failed to restore saved SQLite db, creating fresh one', e);
      }
    }
  }

  if (!loadedDb) {
    loadedDb = new SQL.Database();
  }

  dbInstance = new SqlJsDatabaseClient(loadedDb);
  return dbInstance;
}

export function resetDatabaseInstanceForTesting(customDb?: DatabaseClient) {
  dbInstance = customDb || null;
}
