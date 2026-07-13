import type { Driver, Session, ManagedTransaction } from 'neo4j-driver';
import neo4j from 'neo4j-driver';
import config from '@/core/config';

const globalForNeo4j = globalThis as unknown as {
  neo4jDriver: Driver | undefined;
};

export const neo4jDriver =
  globalForNeo4j.neo4jDriver ??
  neo4j.driver(
    config.GRAPH_DB_URL,
    neo4j.auth.basic(config.GRAPH_DB_USER, config.GRAPH_DB_PASSWORD),
    {
      maxConnectionLifetime: 3600000,
      maxConnectionPoolSize: 50,
      connectionAcquisitionTimeout: 60000,
      disableLosslessIntegers: true,
    }
  );

if (process.env['NODE_ENV'] !== 'production') {
  globalForNeo4j.neo4jDriver = neo4jDriver;
}

export function getSession(database?: string): Session {
  return neo4jDriver.session({ database: database || 'neo4j' });
}

export async function executeRead<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
  database?: string
): Promise<T> {
  const session = getSession(database);
  try {
    return await session.executeRead(work);
  } finally {
    await session.close();
  }
}

export async function executeWrite<T>(
  work: (tx: ManagedTransaction) => Promise<T>,
  database?: string
): Promise<T> {
  const session = getSession(database);
  try {
    return await session.executeWrite(work);
  } finally {
    await session.close();
  }
}

export async function runQuery<T = Record<string, unknown>>(
  query: string,
  parameters?: Record<string, unknown>,
  database?: string
): Promise<T[]> {
  const session = getSession(database);
  try {
    const result = await session.run(query, parameters);
    return result.records.map((record) => record.toObject() as T);
  } finally {
    await session.close();
  }
}

export async function checkNeo4jHealth(): Promise<boolean> {
  try {
    await neo4jDriver.verifyConnectivity();
    return true;
  } catch {
    return false;
  }
}

export async function closeNeo4j(): Promise<void> {
  await neo4jDriver.close();
}

export async function initializeNeo4jSchema(): Promise<void> {
  try {
    const constraints = [
      'CREATE CONSTRAINT equipment_name_unique IF NOT EXISTS FOR (e:Equipment) REQUIRE e.name IS UNIQUE',
      'CREATE CONSTRAINT vendor_name_unique IF NOT EXISTS FOR (v:Vendor) REQUIRE v.name IS UNIQUE',
      'CREATE CONSTRAINT standard_name_unique IF NOT EXISTS FOR (s:Standard) REQUIRE s.name IS UNIQUE',
      'CREATE CONSTRAINT document_id_unique IF NOT EXISTS FOR (d:Document) REQUIRE d.id IS UNIQUE',
      'CREATE CONSTRAINT chunk_id_unique IF NOT EXISTS FOR (c:Chunk) REQUIRE c.id IS UNIQUE',
      'CREATE CONSTRAINT activity_name_unique IF NOT EXISTS FOR (a:Activity) REQUIRE a.name IS UNIQUE',
      'CREATE CONSTRAINT docref_name_unique IF NOT EXISTS FOR (dr:DocumentReference) REQUIRE dr.name IS UNIQUE',
    ];
    for (const query of constraints) {
      await runQuery(query);
    }
  } catch (error) {
    console.error('Failed to initialize Neo4j schema constraints:', error);
  }
}

export default neo4jDriver;
