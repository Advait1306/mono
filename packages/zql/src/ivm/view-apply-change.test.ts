import {describe, expect, test} from 'vitest';
import {makeComparator} from './data.ts';
import type {SourceSchema} from './schema.ts';
import {applyChange, type ViewChange} from './view-apply-change.ts';
import type {Entry, Format} from './view.ts';

describe('applyChange', () => {
  const relationship = '';
  const schema: SourceSchema = {
    tableName: 'event',
    columns: {
      id: {type: 'string'},
      name: {type: 'string'},
    },
    primaryKey: ['id'],
    sort: [['id', 'asc']],
    system: 'client',
    relationships: {
      athletes: {
        tableName: 'matchup',
        columns: {
          eventID: {type: 'string'},
          athleteCountry: {type: 'string'},
          athleteID: {type: 'string'},
          disciplineID: {type: 'string'},
        },
        primaryKey: ['eventID', 'athleteCountry', 'athleteID', 'disciplineID'],
        sort: [
          ['eventID', 'asc'],
          ['athleteCountry', 'asc'],
          ['athleteID', 'asc'],
          ['disciplineID', 'asc'],
        ],
        system: 'client',
        relationships: {
          athletes: {
            tableName: 'athlete',
            columns: {
              id: {type: 'string'},
              country: {type: 'string'},
              name: {type: 'string'},
            },
            primaryKey: ['country', 'id'],
            sort: [
              ['country', 'asc'],
              ['id', 'asc'],
            ],
            system: 'client',
            relationships: {},
            isHidden: false,
            compareRows: makeComparator([
              ['country', 'asc'],
              ['id', 'asc'],
            ]),
          },
        },
        isHidden: true,
        compareRows: makeComparator([
          ['eventID', 'asc'],
          ['athleteCountry', 'asc'],
          ['athleteID', 'asc'],
          ['disciplineID', 'asc'],
        ]),
      },
    },
    isHidden: false,
    compareRows: makeComparator([['id', 'asc']]),
  } as const;

  describe('Multiple entries', () => {
    test('singular: false', () => {
      // This should really be a WeakMap but for testing purposes we use a Map.

      const parentEntry: Entry = {'': []};
      const format: Format = {
        singular: false,
        relationships: {
          athletes: {
            relationships: {},
            singular: false,
          },
        },
      };

      {
        const changes: ViewChange[] = [
          {
            type: 'add',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
              relationships: {
                athletes: () => [],
              },
            },
          },
          {
            type: 'child',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
            },
            child: {
              relationshipName: 'athletes',
              change: {
                type: 'add',
                node: {
                  row: {
                    eventID: 'e1',
                    athleteCountry: 'USA',
                    athleteID: 'a1',
                    disciplineID: 'd1',
                  },
                  relationships: {
                    athletes: () => [
                      {
                        row: {
                          country: 'USA',
                          id: 'a1',
                          name: 'Mason Ho',
                        },
                        relationships: {},
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            type: 'child',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
            },
            child: {
              relationshipName: 'athletes',
              change: {
                type: 'add',
                node: {
                  row: {
                    eventID: 'e1',
                    athleteCountry: 'USA',
                    athleteID: 'a1',
                    disciplineID: 'd2',
                  },
                  relationships: {
                    athletes: () => [
                      {
                        row: {
                          country: 'USA',
                          id: 'a1',
                          name: 'Mason Ho',
                        },
                        relationships: {},
                      },
                    ],
                  },
                },
              },
            },
          },
        ];

        for (const change of changes) {
          applyChange(parentEntry, change, schema, relationship, format, true);
        }

        expect(parentEntry).toMatchInlineSnapshot(`
          {
            "": [
              {
                "athletes": [
                  {
                    "country": "USA",
                    "id": "a1",
                    "name": "Mason Ho",
                    Symbol(rc): 2,
                    Symbol(id): "["USA","a1"]",
                  },
                ],
                "id": "e1",
                "name": "Buffalo Big Board Classic",
                Symbol(rc): 1,
                Symbol(id): ""e1"",
              },
            ],
          }
        `);
      }

      {
        const changes: ViewChange[] = [
          {
            type: 'child',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
            },
            child: {
              relationshipName: 'athletes',
              change: {
                type: 'remove',
                node: {
                  row: {
                    eventID: 'e1',
                    athleteCountry: 'USA',
                    athleteID: 'a1',
                    disciplineID: 'd1',
                  },
                  relationships: {
                    athletes: () => [
                      {
                        row: {
                          country: 'USA',
                          id: 'a1',
                          name: 'Mason Ho',
                        },
                        relationships: {},
                      },
                    ],
                  },
                },
              },
            },
          },
        ];

        for (const change of changes) {
          applyChange(parentEntry, change, schema, relationship, format, true);
        }

        expect(parentEntry).toMatchInlineSnapshot(`
          {
            "": [
              {
                "athletes": [
                  {
                    "country": "USA",
                    "id": "a1",
                    "name": "Mason Ho",
                    Symbol(rc): 1,
                    Symbol(id): "["USA","a1"]",
                  },
                ],
                "id": "e1",
                "name": "Buffalo Big Board Classic",
                Symbol(rc): 1,
                Symbol(id): ""e1"",
              },
            ],
          }
        `);
      }

      {
        const changes: ViewChange[] = [
          {
            type: 'child',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
            },
            child: {
              relationshipName: 'athletes',
              change: {
                type: 'remove',
                node: {
                  row: {
                    eventID: 'e1',
                    athleteCountry: 'USA',
                    athleteID: 'a1',
                    disciplineID: 'd2',
                  },
                  relationships: {
                    athletes: () => [
                      {
                        row: {
                          country: 'USA',
                          id: 'a1',
                          name: 'Mason Ho',
                        },
                        relationships: {},
                      },
                    ],
                  },
                },
              },
            },
          },
        ];

        for (const change of changes) {
          applyChange(parentEntry, change, schema, relationship, format, true);
        }

        expect(parentEntry).toMatchInlineSnapshot(`
          {
            "": [
              {
                "athletes": [],
                "id": "e1",
                "name": "Buffalo Big Board Classic",
                Symbol(rc): 1,
                Symbol(id): ""e1"",
              },
            ],
          }
        `);
      }
    });

    test('singular: true', () => {
      // This should really be a WeakMap but for testing purposes we use a Map.

      const parentEntry: Entry = {'': []};
      const format: Format = {
        singular: false,
        relationships: {
          athletes: {
            relationships: {},
            singular: true,
          },
        },
      };

      {
        const changes: ViewChange[] = [
          {
            type: 'add',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
              relationships: {
                athletes: () => [],
              },
            },
          },
          {
            type: 'child',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
            },
            child: {
              relationshipName: 'athletes',
              change: {
                type: 'add',
                node: {
                  row: {
                    eventID: 'e1',
                    athleteCountry: 'USA',
                    athleteID: 'a1',
                    disciplineID: 'd1',
                  },
                  relationships: {
                    athletes: () => [
                      {
                        row: {
                          country: 'USA',
                          id: 'a1',
                          name: 'Mason Ho',
                        },
                        relationships: {},
                      },
                    ],
                  },
                },
              },
            },
          },
          {
            type: 'child',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
            },
            child: {
              relationshipName: 'athletes',
              change: {
                type: 'add',
                node: {
                  row: {
                    eventID: 'e1',
                    athleteCountry: 'USA',
                    athleteID: 'a1',
                    disciplineID: 'd2',
                  },
                  relationships: {
                    athletes: () => [
                      {
                        row: {
                          country: 'USA',
                          id: 'a1',
                          name: 'Mason Ho',
                        },
                        relationships: {},
                      },
                    ],
                  },
                },
              },
            },
          },
        ];

        for (const change of changes) {
          applyChange(parentEntry, change, schema, relationship, format, true);
        }

        expect(parentEntry).toMatchInlineSnapshot(`
          {
            "": [
              {
                "athletes": {
                  "country": "USA",
                  "id": "a1",
                  "name": "Mason Ho",
                  Symbol(rc): 2,
                  Symbol(id): "["USA","a1"]",
                },
                "id": "e1",
                "name": "Buffalo Big Board Classic",
                Symbol(rc): 1,
                Symbol(id): ""e1"",
              },
            ],
          }
        `);
      }

      {
        const changes: ViewChange[] = [
          {
            type: 'child',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
            },
            child: {
              relationshipName: 'athletes',
              change: {
                type: 'remove',
                node: {
                  row: {
                    eventID: 'e1',
                    athleteCountry: 'USA',
                    athleteID: 'a1',
                    disciplineID: 'd1',
                  },
                  relationships: {
                    athletes: () => [
                      {
                        row: {
                          country: 'USA',
                          id: 'a1',
                          name: 'Mason Ho',
                        },
                        relationships: {},
                      },
                    ],
                  },
                },
              },
            },
          },
        ];

        for (const change of changes) {
          applyChange(parentEntry, change, schema, relationship, format, true);
        }

        expect(parentEntry).toMatchInlineSnapshot(`
          {
            "": [
              {
                "athletes": {
                  "country": "USA",
                  "id": "a1",
                  "name": "Mason Ho",
                  Symbol(rc): 1,
                  Symbol(id): "["USA","a1"]",
                },
                "id": "e1",
                "name": "Buffalo Big Board Classic",
                Symbol(rc): 1,
                Symbol(id): ""e1"",
              },
            ],
          }
        `);
      }

      {
        const changes: ViewChange[] = [
          {
            type: 'child',
            node: {
              row: {
                id: 'e1',
                name: 'Buffalo Big Board Classic',
              },
            },
            child: {
              relationshipName: 'athletes',
              change: {
                type: 'remove',
                node: {
                  row: {
                    eventID: 'e1',
                    athleteCountry: 'USA',
                    athleteID: 'a1',
                    disciplineID: 'd2',
                  },
                  relationships: {
                    athletes: () => [
                      {
                        row: {
                          country: 'USA',
                          id: 'a1',
                          name: 'Mason Ho',
                        },
                        relationships: {},
                      },
                    ],
                  },
                },
              },
            },
          },
        ];

        for (const change of changes) {
          applyChange(parentEntry, change, schema, relationship, format, true);
        }

        expect(parentEntry).toMatchInlineSnapshot(`
          {
            "": [
              {
                "athletes": undefined,
                "id": "e1",
                "name": "Buffalo Big Board Classic",
                Symbol(rc): 1,
                Symbol(id): ""e1"",
              },
            ],
          }
        `);
      }
    });
  });

  describe('Simple', () => {
    test('singular: false', () => {
      const schema = {
        tableName: 'event',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
      } as const;
      const root = {'': []};
      const format = {
        singular: false,
        relationships: {},
      };

      const apply = (change: ViewChange) =>
        applyChange(root, change, schema, '', format, true);

      apply({
        type: 'add',
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);

      for (let i = 0; i < 5; i++) {
        apply({
          type: 'add',
          node: {
            row: {
              id: '2',
              name: 'Greg',
            },
            relationships: {},
          },
        });
      }
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
            {
              "id": "2",
              "name": "Greg",
              Symbol(rc): 5,
              Symbol(id): ""2"",
            },
          ],
        }
      `);

      for (let i = 0; i < 4; i++) {
        apply({
          type: 'remove',
          node: {
            row: {
              id: '2',
              name: 'Greg',
            },
            relationships: {},
          },
        });
      }
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
            {
              "id": "2",
              "name": "Greg",
              Symbol(rc): 1,
              Symbol(id): ""2"",
            },
          ],
        }
      `);

      apply({
        type: 'remove',
        node: {
          row: {
            id: '2',
            name: 'Greg',
          },
          relationships: {},
        },
      });

      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);

      expect(() =>
        apply({
          type: 'remove',
          node: {
            row: {
              id: '2',
              name: 'Greg',
            },
            relationships: {},
          },
        }),
      ).toThrowError(new Error('node does not exist'));
    });

    test('singular: true', () => {
      const schema = {
        tableName: 'event',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
      } as const;
      const root = {'': undefined};
      const format = {
        singular: true,
        relationships: {},
      };

      const apply = (change: ViewChange) =>
        applyChange(root, change, schema, relationship, format, true);

      apply({
        type: 'add',
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Aaron",
            Symbol(rc): 1,
            Symbol(id): ""1"",
          },
        }
      `);

      expect(() =>
        apply({
          type: 'add',
          node: {
            row: {
              id: '2',
              name: 'Greg',
            },
            relationships: {},
          },
        }),
      ).toThrowError(
        new Error(
          "Singular relationship '' should not have multiple rows. You may need to declare this relationship with the `many` helper instead of the `one` helper in your schema.",
        ),
      );

      apply({
        type: 'add',
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Aaron",
            Symbol(rc): 2,
            Symbol(id): ""1"",
          },
        }
      `);

      for (let i = 0; i < 3; i++) {
        apply({
          type: 'add',
          node: {
            row: {
              id: '1',
              name: 'Aaron',
            },
            relationships: {},
          },
        });
      }
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Aaron",
            Symbol(rc): 5,
            Symbol(id): ""1"",
          },
        }
      `);

      for (let i = 0; i < 4; i++) {
        apply({
          type: 'remove',
          node: {
            row: {
              id: '1',
              name: 'Aaron',
            },
            relationships: {},
          },
        });
      }
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Aaron",
            Symbol(rc): 1,
            Symbol(id): ""1"",
          },
        }
      `);

      apply({
        type: 'remove',
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": undefined,
        }
      `);

      expect(() =>
        apply({
          type: 'remove',
          node: {
            row: {
              id: '1',
              name: 'Aaron',
            },
            relationships: {},
          },
        }),
      ).toThrowError(new Error('node does not exist'));
    });

    test('edit, singular: false', () => {
      const schema = {
        tableName: 'event',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
      } as const;
      const root = {'': []};
      const format = {
        singular: false,
        relationships: {},
      };

      const apply = (change: ViewChange) =>
        applyChange(root, change, schema, '', format, true);

      apply({
        type: 'add',
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);

      apply({
        type: 'edit',
        oldNode: {
          row: {
            id: '1',
            name: 'Aaron',
          },
        },
        node: {
          row: {
            id: '1',
            name: 'Greg',
          },
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Greg",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);

      for (let i = 0; i < 2; i++) {
        apply({
          type: 'add',
          node: {
            row: {
              id: '1',
              name: 'Greg',
            },
            relationships: {},
          },
        });
      }
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Greg",
              Symbol(rc): 3,
              Symbol(id): ""1"",
            },
          ],
        }
      `);

      apply({
        type: 'edit',
        oldNode: {
          row: {
            id: '1',
            name: 'Greg',
          },
        },
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 3,
              Symbol(id): ""1"",
            },
          ],
        }
      `);
    });

    test('edit primary key, singular: false', () => {
      const schema = {
        tableName: 'event',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
      } as const;
      const root = {'': []};
      const format = {
        singular: false,
        relationships: {},
      };

      const apply = (change: ViewChange) =>
        applyChange(root, change, schema, '', format, true);

      apply({
        type: 'add',
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);

      apply({
        type: 'edit',
        oldNode: {
          row: {
            id: '1',
            name: 'Aaron',
          },
        },
        node: {
          row: {
            id: '2',
            name: 'Greg',
          },
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "2",
              "name": "Greg",
              Symbol(rc): 1,
              Symbol(id): ""2"",
            },
          ],
        }
      `);

      apply({
        type: 'remove',
        node: {
          row: {
            id: '2',
            name: 'Greg',
          },
          relationships: {},
        },
      });

      for (let i = 0; i < 2; i++) {
        apply({
          type: 'add',
          node: {
            row: {
              id: '1',
              name: 'Aaron',
            },
            relationships: {},
          },
        });
      }
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 2,
              Symbol(id): ""1"",
            },
          ],
        }
      `);

      for (let i = 0; i < 2; i++) {
        apply({
          type: 'add',
          node: {
            row: {
              id: '2',
              name: 'Greg',
            },
            relationships: {},
          },
        });
      }

      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 2,
              Symbol(id): ""1"",
            },
            {
              "id": "2",
              "name": "Greg",
              Symbol(rc): 2,
              Symbol(id): ""2"",
            },
          ],
        }
      `);

      apply({
        type: 'edit',
        oldNode: {
          row: {
            id: '1',
            name: 'Aaron',
          },
        },
        node: {
          row: {
            id: '2',
            name: 'Greg',
          },
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Aaron",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
            {
              "id": "2",
              "name": "Greg",
              Symbol(rc): 3,
              Symbol(id): ""2"",
            },
          ],
        }
      `);
    });

    test('edit, singular: true', () => {
      const schema = {
        tableName: 'event',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
      } as const;
      const root = {'': undefined};
      const format = {
        singular: true,
        relationships: {},
      };

      const apply = (change: ViewChange) =>
        applyChange(root, change, schema, '', format, true);

      apply({
        type: 'add',
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Aaron",
            Symbol(rc): 1,
            Symbol(id): ""1"",
          },
        }
      `);

      apply({
        type: 'edit',
        oldNode: {
          row: {
            id: '1',
            name: 'Aaron',
          },
        },
        node: {
          row: {
            id: '1',
            name: 'Greg',
          },
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Greg",
            Symbol(rc): 1,
            Symbol(id): ""1"",
          },
        }
      `);

      apply({
        type: 'add',
        node: {
          row: {
            id: '1',
            name: 'Greg',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Greg",
            Symbol(rc): 2,
            Symbol(id): ""1"",
          },
        }
      `);

      apply({
        type: 'edit',
        oldNode: {
          row: {
            id: '2',
            name: 'Greg',
          },
        },
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Aaron",
            Symbol(rc): 2,
            Symbol(id): ""1"",
          },
        }
      `);
    });

    test('edit primary key, singular: true', () => {
      const schema = {
        tableName: 'event',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
      } as const;
      const root = {'': undefined};
      const format = {
        singular: true,
        relationships: {},
      };

      const apply = (change: ViewChange) =>
        applyChange(root, change, schema, '', format, true);

      apply({
        type: 'add',
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Aaron",
            Symbol(rc): 1,
            Symbol(id): ""1"",
          },
        }
      `);

      apply({
        type: 'edit',
        oldNode: {
          row: {
            id: '1',
            name: 'Aaron',
          },
        },
        node: {
          row: {
            id: '2',
            name: 'Greg',
          },
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "2",
            "name": "Greg",
            Symbol(rc): 1,
            Symbol(id): ""2"",
          },
        }
      `);

      apply({
        type: 'add',
        node: {
          row: {
            id: '2',
            name: 'Greg',
          },
          relationships: {},
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "2",
            "name": "Greg",
            Symbol(rc): 2,
            Symbol(id): ""2"",
          },
        }
      `);

      apply({
        type: 'edit',
        oldNode: {
          row: {
            id: '2',
            name: 'Greg',
          },
        },
        node: {
          row: {
            id: '1',
            name: 'Aaron',
          },
        },
      });
      expect(root).toMatchInlineSnapshot(`
        {
          "": {
            "id": "1",
            "name": "Aaron",
            Symbol(rc): 2,
            Symbol(id): ""1"",
          },
        }
      `);
    });
  });

  describe('Select column projection', () => {
    test('add with select only includes selected columns and primary key', () => {
      const schema: SourceSchema = {
        tableName: 'user',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
          email: {type: 'string'},
          age: {type: 'number'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
        select: ['name'], // Only select name, id should be included as primary key
      };
      const root: Entry = {'': []};
      const format: Format = {
        singular: false,
        relationships: {},
      };

      applyChange(
        root,
        {
          type: 'add',
          node: {
            row: {
              id: '1',
              name: 'Alice',
              email: 'alice@test.com',
              age: 30,
            },
            relationships: {},
          },
        },
        schema,
        '',
        format,
        true,
      );

      // Should only have id (primary key) and name (selected), not email or age
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Alice",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);
    });

    test('add without select includes all columns', () => {
      const schema: SourceSchema = {
        tableName: 'user',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
          email: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
        // No select - all columns should be included
      };
      const root: Entry = {'': []};
      const format: Format = {
        singular: false,
        relationships: {},
      };

      applyChange(
        root,
        {
          type: 'add',
          node: {
            row: {
              id: '1',
              name: 'Alice',
              email: 'alice@test.com',
            },
            relationships: {},
          },
        },
        schema,
        '',
        format,
        true,
      );

      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "email": "alice@test.com",
              "id": "1",
              "name": "Alice",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);
    });

    test('edit with select only includes selected columns', () => {
      const schema: SourceSchema = {
        tableName: 'user',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
          email: {type: 'string'},
          age: {type: 'number'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
        select: ['name'],
      };
      const root: Entry = {'': []};
      const format: Format = {
        singular: false,
        relationships: {},
      };

      // Add initial entry
      applyChange(
        root,
        {
          type: 'add',
          node: {
            row: {id: '1', name: 'Alice', email: 'alice@test.com', age: 30},
            relationships: {},
          },
        },
        schema,
        '',
        format,
        true,
      );

      // Edit the entry - row has all columns but only selected should appear
      applyChange(
        root,
        {
          type: 'edit',
          oldNode: {row: {id: '1', name: 'Alice'}},
          node: {
            row: {id: '1', name: 'Alicia', email: 'alicia@test.com', age: 31},
          },
        },
        schema,
        '',
        format,
        true,
      );

      // Should still only have id and name
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Alicia",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);
    });

    test('edit removes columns not in select from existing entry', () => {
      const schema: SourceSchema = {
        tableName: 'user',
        columns: {
          id: {type: 'string'},
          name: {type: 'string'},
          email: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
        select: ['name'],
      };
      const root: Entry = {'': []};
      const format: Format = {
        singular: false,
        relationships: {},
      };

      // First add the entry without select to simulate old data
      const schemaWithoutSelect: SourceSchema = {
        ...schema,
        select: undefined,
      };
      applyChange(
        root,
        {
          type: 'add',
          node: {
            row: {id: '1', name: 'Alice', email: 'alice@test.com'},
            relationships: {},
          },
        },
        schemaWithoutSelect,
        '',
        format,
        true,
      );

      // Verify that the entry has the email column
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "email": "alice@test.com",
              "id": "1",
              "name": "Alice",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);

      // Now apply an edit with select - this should remove the email column
      applyChange(
        root,
        {
          type: 'edit',
          oldNode: {row: {id: '1', name: 'Alice'}},
          node: {row: {id: '1', name: 'Alicia', email: 'alicia@test.com'}},
        },
        schema,
        '',
        format,
        true,
      );

      // The email column should be removed
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "id": "1",
              "name": "Alicia",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);
    });

    test('select with compound primary key includes all pk columns', () => {
      const schema: SourceSchema = {
        tableName: 'order_item',
        columns: {
          orderId: {type: 'string'},
          productId: {type: 'string'},
          quantity: {type: 'number'},
          price: {type: 'number'},
        },
        primaryKey: ['orderId', 'productId'],
        sort: [
          ['orderId', 'asc'],
          ['productId', 'asc'],
        ],
        system: 'client',
        relationships: {},
        isHidden: false,
        compareRows: makeComparator([
          ['orderId', 'asc'],
          ['productId', 'asc'],
        ]),
        select: ['quantity'], // Only select quantity, but both pk columns should be included
      };
      const root: Entry = {'': []};
      const format: Format = {
        singular: false,
        relationships: {},
      };

      applyChange(
        root,
        {
          type: 'add',
          node: {
            row: {
              orderId: 'o1',
              productId: 'p1',
              quantity: 5,
              price: 100,
            },
            relationships: {},
          },
        },
        schema,
        '',
        format,
        true,
      );

      // Should have both primary key columns and quantity, but not price
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "orderId": "o1",
              "productId": "p1",
              "quantity": 5,
              Symbol(rc): 1,
              Symbol(id): "["o1","p1"]",
            },
          ],
        }
      `);
    });

    test('select preserves relationship properties during edit', () => {
      const schema: SourceSchema = {
        tableName: 'post',
        columns: {
          id: {type: 'string'},
          title: {type: 'string'},
          body: {type: 'string'},
        },
        primaryKey: ['id'],
        sort: [['id', 'asc']],
        system: 'client',
        relationships: {
          comments: {
            tableName: 'comment',
            columns: {
              id: {type: 'string'},
              text: {type: 'string'},
            },
            primaryKey: ['id'],
            sort: [['id', 'asc']],
            system: 'client',
            relationships: {},
            isHidden: false,
            compareRows: makeComparator([['id', 'asc']]),
          },
        },
        isHidden: false,
        compareRows: makeComparator([['id', 'asc']]),
        select: ['title'], // Only select title
      };
      const root: Entry = {'': []};
      const format: Format = {
        singular: false,
        relationships: {
          comments: {
            singular: false,
            relationships: {},
          },
        },
      };

      // Add a post
      applyChange(
        root,
        {
          type: 'add',
          node: {
            row: {id: '1', title: 'Hello', body: 'World'},
            relationships: {
              comments: () => [
                {
                  row: {id: 'c1', text: 'Great post!'},
                  relationships: {},
                },
              ],
            },
          },
        },
        schema,
        '',
        format,
        true,
      );

      // Edit the post - should keep comments relationship
      applyChange(
        root,
        {
          type: 'edit',
          oldNode: {row: {id: '1', title: 'Hello'}},
          node: {row: {id: '1', title: 'Hello World', body: 'Updated body'}},
        },
        schema,
        '',
        format,
        true,
      );

      // Should have id, title (selected), comments (relationship), but not body
      expect(root).toMatchInlineSnapshot(`
        {
          "": [
            {
              "comments": [
                {
                  "id": "c1",
                  "text": "Great post!",
                  Symbol(rc): 1,
                  Symbol(id): ""c1"",
                },
              ],
              "id": "1",
              "title": "Hello World",
              Symbol(rc): 1,
              Symbol(id): ""1"",
            },
          ],
        }
      `);
    });
  });
});
