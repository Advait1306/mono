import type {Change} from './change.ts';
import type {Node} from './data.ts';
import type {FetchRequest, Input, Output} from './operator.ts';
import type {SourceSchema} from './schema.ts';
import type {Stream} from './stream.ts';

/**
 * A pass-through operator that adds column selection information to the schema.
 * This operator does not filter rows - that happens in the Streamer when syncing to clients.
 * It only annotates the schema with which columns should be included in the sync.
 */
export class Select implements Input {
  readonly #input: Input;
  readonly #schema: SourceSchema;

  constructor(input: Input, select: readonly string[]) {
    this.#input = input;
    const inputSchema = input.getSchema();
    this.#schema = {
      ...inputSchema,
      select,
    };

    input.setOutput({
      push: (change: Change) => this.#push(change),
    });
  }

  #output: Output = {
    push: () => {
      throw new Error('Output not set');
    },
  };

  destroy(): void {
    this.#input.destroy();
  }

  setOutput(output: Output): void {
    this.#output = output;
  }

  getSchema(): SourceSchema {
    return this.#schema;
  }

  fetch(req: FetchRequest): Stream<Node | 'yield'> {
    return this.#input.fetch(req);
  }

  *#push(change: Change): Stream<'yield'> {
    yield* this.#output.push(change, this);
  }
}
