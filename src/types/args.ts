import { Schema } from "./schema";

export type ArgValue = string | boolean | (string | boolean)[] | undefined;
export type ArgsInfo = {
  values: Partial<Schema>;
  positionals: string[];
};

export type SchemaType = "string" | "boolean";
export type SchemaItem = {
  type: SchemaType;
  short?: string;
  default?: string | boolean;
  multiple?: boolean;
  aliases: string[] | string;
  validator?: (value: any) => ArgValue;
  validatorType?: string;
};

export type SchemaValue = Omit<SchemaItem, "aliases">;
export type SchemaValues = Record<string, SchemaValue>;
