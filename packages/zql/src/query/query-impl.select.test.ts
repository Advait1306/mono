import {describe, expect, test} from 'vitest';
import {newQuery} from './query-impl.ts';
import {asQueryInternals} from './query-internals.ts';
import {type AnyQuery} from './query.ts';
import {schema} from './test/test-schemas.ts';

function ast(q: AnyQuery) {
  return asQueryInternals(q).ast;
}

describe('select', () => {
  test('select adds a select field to the AST with a single column', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery.select('id');
    expect(ast(selectQuery)).toEqual({
      table: 'issue',
      select: ['id'],
    });
  });

  test('select adds multiple columns to the AST', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery.select('id', 'title', 'description');
    expect(ast(selectQuery)).toEqual({
      table: 'issue',
      select: ['id', 'title', 'description'],
    });
  });

  test('chained select calls merge columns (deduplicated)', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery
      .select('id', 'title')
      .select('description', 'id'); // id is a duplicate
    expect(ast(selectQuery)).toEqual({
      table: 'issue',
      select: ['id', 'title', 'description'],
    });
  });

  test('select works with where', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery.select('id', 'title').where('closed', true);
    expect(ast(selectQuery)).toMatchInlineSnapshot(`
      {
        "select": [
          "id",
          "title",
        ],
        "table": "issue",
        "where": {
          "left": {
            "name": "closed",
            "type": "column",
          },
          "op": "=",
          "right": {
            "type": "literal",
            "value": true,
          },
          "type": "simple",
        },
      }
    `);
  });

  test('select works with orderBy', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery
      .select('id', 'title', 'createdAt')
      .orderBy('createdAt', 'desc');
    expect(ast(selectQuery)).toEqual({
      table: 'issue',
      select: ['id', 'title', 'createdAt'],
      orderBy: [['createdAt', 'desc']],
    });
  });

  test('select works with limit', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery.select('id', 'title').limit(10);
    expect(ast(selectQuery)).toEqual({
      table: 'issue',
      select: ['id', 'title'],
      limit: 10,
    });
  });

  test('select with related - parent and child can have independent selections', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery
      .select('id', 'title')
      .related('comments', q => q.select('id', 'text'));

    expect(ast(selectQuery)).toMatchInlineSnapshot(`
      {
        "related": [
          {
            "correlation": {
              "childField": [
                "issueId",
              ],
              "parentField": [
                "id",
              ],
            },
            "subquery": {
              "alias": "comments",
              "select": [
                "id",
                "text",
              ],
              "table": "comment",
            },
            "system": "client",
          },
        ],
        "select": [
          "id",
          "title",
        ],
        "table": "issue",
      }
    `);
  });

  test('select on related query only', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery.related('owner', q =>
      q.select('id', 'name'),
    );

    expect(ast(selectQuery)).toMatchInlineSnapshot(`
      {
        "related": [
          {
            "correlation": {
              "childField": [
                "id",
              ],
              "parentField": [
                "ownerId",
              ],
            },
            "subquery": {
              "alias": "owner",
              "select": [
                "id",
                "name",
              ],
              "table": "user",
            },
            "system": "client",
          },
        ],
        "table": "issue",
      }
    `);
  });

  test('select throws when no columns provided', () => {
    const issueQuery = newQuery(schema, 'issue');
    expect(() => issueQuery.select()).toThrow(
      'select() requires at least one column',
    );
  });

  test('select works with nested related queries', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery
      .select('id')
      .related('comments', q =>
        q.select('id', 'text').related('author', aq => aq.select('name')),
      );

    expect(ast(selectQuery)).toMatchInlineSnapshot(`
      {
        "related": [
          {
            "correlation": {
              "childField": [
                "issueId",
              ],
              "parentField": [
                "id",
              ],
            },
            "subquery": {
              "alias": "comments",
              "related": [
                {
                  "correlation": {
                    "childField": [
                      "id",
                    ],
                    "parentField": [
                      "authorId",
                    ],
                  },
                  "subquery": {
                    "alias": "author",
                    "select": [
                      "name",
                    ],
                    "table": "user",
                  },
                  "system": "client",
                },
              ],
              "select": [
                "id",
                "text",
              ],
              "table": "comment",
            },
            "system": "client",
          },
        ],
        "select": [
          "id",
        ],
        "table": "issue",
      }
    `);
  });

  test('select combined with multiple query operations', () => {
    const issueQuery = newQuery(schema, 'issue');
    const selectQuery = issueQuery
      .select('id', 'title', 'closed', 'createdAt')
      .where('closed', false)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .related('owner', q => q.select('id', 'name'));

    expect(ast(selectQuery)).toMatchInlineSnapshot(`
      {
        "limit": 20,
        "orderBy": [
          [
            "createdAt",
            "desc",
          ],
        ],
        "related": [
          {
            "correlation": {
              "childField": [
                "id",
              ],
              "parentField": [
                "ownerId",
              ],
            },
            "subquery": {
              "alias": "owner",
              "select": [
                "id",
                "name",
              ],
              "table": "user",
            },
            "system": "client",
          },
        ],
        "select": [
          "id",
          "title",
          "closed",
          "createdAt",
        ],
        "table": "issue",
        "where": {
          "left": {
            "name": "closed",
            "type": "column",
          },
          "op": "=",
          "right": {
            "type": "literal",
            "value": false,
          },
          "type": "simple",
        },
      }
    `);
  });

  test('select on different tables', () => {
    const userQuery = newQuery(schema, 'user');
    const selectQuery = userQuery.select('id', 'name');
    expect(ast(selectQuery)).toEqual({
      table: 'user',
      select: ['id', 'name'],
    });

    const commentQuery = newQuery(schema, 'comment');
    const commentSelectQuery = commentQuery.select('id', 'text', 'createdAt');
    expect(ast(commentSelectQuery)).toEqual({
      table: 'comment',
      select: ['id', 'text', 'createdAt'],
    });
  });
});
