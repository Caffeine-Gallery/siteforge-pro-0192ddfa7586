import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'loadDesign' : ActorMethod<[], [] | [string]>,
  'principalToText' : ActorMethod<[Principal], string>,
  'publishDesign' : ActorMethod<[string], string>,
  'saveDesign' : ActorMethod<[string], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
