/** @module Interface scserver:commands/nrt@0.1.0 **/
export type ServerMessage = import('./scserver-commands-commands.js').ServerMessage;

export class NrtScore {
  constructor()
  at(seconds: number, msg: ServerMessage): void;
  encode(): Uint8Array;
}
