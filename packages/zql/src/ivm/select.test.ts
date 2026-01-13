import {describe, expect, test} from 'vitest';
import {Catch} from './catch.ts';
import {Select} from './select.ts';
import {createSource} from './test/source-factory.ts';
import {createSilentLogContext} from '../../../shared/src/logging-test-utils.ts';
import {testLogConfig} from '../../../otel/src/test-log-config.ts';
import {consume} from './stream.ts';

const lc = createSilentLogContext();

describe('Select operator', () => {
  function createTestSource() {
    const ms = createSource(
      lc,
      testLogConfig,
      'users',
      {
        id: {type: 'string'},
        name: {type: 'string'},
        email: {type: 'string'},
        age: {type: 'number'},
      },
      ['id'],
    );

    consume(
      ms.push({
        type: 'add',
        row: {id: '1', name: 'Alice', email: 'alice@test.com', age: 30},
      }),
    );
    consume(
      ms.push({
        type: 'add',
        row: {id: '2', name: 'Bob', email: 'bob@test.com', age: 25},
      }),
    );

    return ms;
  }

  test('getSchema includes select field', () => {
    const ms = createTestSource();
    const conn = ms.connect([['id', 'asc']]);
    const select = new Select(conn, ['name', 'email']);

    const schema = select.getSchema();
    expect(schema.select).toEqual(['name', 'email']);
    expect(schema.tableName).toBe('users');
    expect(schema.primaryKey).toEqual(['id']);
  });

  test('getSchema preserves other schema properties', () => {
    const ms = createTestSource();
    const conn = ms.connect([['id', 'asc']]);
    const select = new Select(conn, ['name']);

    const schema = select.getSchema();
    expect(schema.columns).toEqual({
      id: {type: 'string'},
      name: {type: 'string'},
      email: {type: 'string'},
      age: {type: 'number'},
    });
    expect(schema.sort).toEqual([['id', 'asc']]);
    expect(schema.system).toBe('client');
  });

  test('fetch passes through rows unchanged', () => {
    const ms = createTestSource();
    const conn = ms.connect([['id', 'asc']]);
    const select = new Select(conn, ['name', 'email']);
    const out = new Catch(select);

    const results = out.fetch({});

    // Rows are not filtered by the Select operator - filtering happens in the Streamer
    expect(results).toMatchInlineSnapshot(`
      [
        {
          "relationships": {},
          "row": {
            "age": 30,
            "email": "alice@test.com",
            "id": "1",
            "name": "Alice",
          },
        },
        {
          "relationships": {},
          "row": {
            "age": 25,
            "email": "bob@test.com",
            "id": "2",
            "name": "Bob",
          },
        },
      ]
    `);
  });

  test('push passes through changes unchanged', () => {
    const ms = createSource(
      lc,
      testLogConfig,
      'users',
      {
        id: {type: 'string'},
        name: {type: 'string'},
        email: {type: 'string'},
      },
      ['id'],
    );
    const conn = ms.connect([['id', 'asc']]);
    const select = new Select(conn, ['name']);
    const out = new Catch(select);

    consume(
      ms.push({
        type: 'add',
        row: {id: '1', name: 'Alice', email: 'alice@test.com'},
      }),
    );

    // Changes pass through unchanged - column filtering happens in the Streamer
    expect(out.pushes).toMatchInlineSnapshot(`
      [
        {
          "node": {
            "relationships": {},
            "row": {
              "email": "alice@test.com",
              "id": "1",
              "name": "Alice",
            },
          },
          "type": "add",
        },
      ]
    `);
  });

  test('edit changes pass through', () => {
    const ms = createSource(
      lc,
      testLogConfig,
      'users',
      {
        id: {type: 'string'},
        name: {type: 'string'},
        email: {type: 'string'},
      },
      ['id'],
    );
    const conn = ms.connect([['id', 'asc']]);
    const select = new Select(conn, ['name']);
    const out = new Catch(select);

    consume(
      ms.push({
        type: 'add',
        row: {id: '1', name: 'Alice', email: 'alice@test.com'},
      }),
    );
    consume(
      ms.push({
        type: 'edit',
        oldRow: {id: '1', name: 'Alice', email: 'alice@test.com'},
        row: {id: '1', name: 'Alicia', email: 'alice@test.com'},
      }),
    );

    expect(out.pushes).toMatchInlineSnapshot(`
      [
        {
          "node": {
            "relationships": {},
            "row": {
              "email": "alice@test.com",
              "id": "1",
              "name": "Alice",
            },
          },
          "type": "add",
        },
        {
          "oldRow": {
            "email": "alice@test.com",
            "id": "1",
            "name": "Alice",
          },
          "row": {
            "email": "alice@test.com",
            "id": "1",
            "name": "Alicia",
          },
          "type": "edit",
        },
      ]
    `);
  });

  test('remove changes pass through', () => {
    const ms = createSource(
      lc,
      testLogConfig,
      'users',
      {
        id: {type: 'string'},
        name: {type: 'string'},
      },
      ['id'],
    );
    const conn = ms.connect([['id', 'asc']]);
    const select = new Select(conn, ['name']);
    const out = new Catch(select);

    consume(ms.push({type: 'add', row: {id: '1', name: 'Alice'}}));
    consume(ms.push({type: 'remove', row: {id: '1', name: 'Alice'}}));

    expect(out.pushes).toMatchInlineSnapshot(`
      [
        {
          "node": {
            "relationships": {},
            "row": {
              "id": "1",
              "name": "Alice",
            },
          },
          "type": "add",
        },
        {
          "node": {
            "relationships": {},
            "row": {
              "id": "1",
              "name": "Alice",
            },
          },
          "type": "remove",
        },
      ]
    `);
  });

  test('empty select array still annotates schema', () => {
    const ms = createTestSource();
    const conn = ms.connect([['id', 'asc']]);
    const select = new Select(conn, []);

    const schema = select.getSchema();
    expect(schema.select).toEqual([]);
  });
});
