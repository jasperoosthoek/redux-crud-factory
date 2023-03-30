
export const snakeToCamelCase = (str: string) => str.toLowerCase().replace(
  /([-_][a-z])/g,
  (group) => group.toUpperCase()
    .replace('-', '')
    .replace('_', '')
);

export const camelToSnakeCase = (str: string) => (str
  .split(/(?=[A-Z])/)
  .map(x => x.toUpperCase())
  .join('_')
);

export const toUpperCamelCase = (str: string) => {
  // First make str camelCase in case it has a leading _
  const camelCaseId = snakeToCamelCase(str);
  // Now return "Id"
  return `${camelCaseId.charAt(0).toUpperCase()}${camelCaseId.slice(1)}`;
}

export const pluralToSingle = <T extends string>(str: T) => {
  if (str.slice(-1).toLowerCase() !== 's') {
    // This string is not plural: keep it unaltered
    return str as T;
  } else if (str.slice(-3) === 'ies') {
    // Handle special case of categories
    return `${str.slice(0, -3)}y`;
  } else if (str.slice(-3) === 'IES') {
    // Same but in upper case
    return `${str.slice(0, -3)}Y`;
  } else {
    // Standard plural
    return str.slice(0, -1);
  } 
}

type SingleToPlural<S extends string> = S extends `${infer $S}s` ? `${$S}s` : 
  S extends `${infer $S}y` ? `${$S}ies` : 
  S extends string ? `${S}s` : S;

export const singleToPlural = <T extends string>(str: T) => {
  if (str.slice(-1).toLowerCase() === 's') {
    // This string is already plural: keep it unaltered
    return str as SingleToPlural<T>;
  } else if (str.slice(-1) === 'y') {
    // Handle special case of categories
    return `${str.slice(0, -1)}ies` as SingleToPlural<T>;
  } else {
    // Standard plural
    return `${str}s` as  SingleToPlural<T>;
  } 
}

export const titleCase = <T extends string>(str: T) =>`${str.charAt(0).toUpperCase()}${str.slice(1)}` as Capitalize<T>;

// Simply call func with params if it is a function, if not ignore
export const callIfFunc = (func: any, ...params: any[]) => {
  if (typeof func === 'function') {
    func(...params);
  }
}

// From https://stackoverflow.com/a/69019874
export type ObjectType = Record<PropertyKey, unknown>;

// From https://stackoverflow.com/a/55153000
type PickByValue<OBJ_T, VALUE_T> = Pick<OBJ_T, { [K in keyof OBJ_T]: OBJ_T[K] extends VALUE_T ? K : never }[keyof OBJ_T]>;

// From https://stackoverflow.com/a/60142095
export type ObjectEntries<OBJ_T> = { [K in keyof OBJ_T]: [keyof PickByValue<OBJ_T, OBJ_T[K]>, OBJ_T[K]] }[keyof OBJ_T][];

export const objectEntries = <OBJ_T extends ObjectType>(obj: OBJ_T): ObjectEntries<OBJ_T> => {
    return Object.entries(obj) as ObjectEntries<OBJ_T>;
}

export type EntriesType = [PropertyKey, unknown][] | ReadonlyArray<readonly [PropertyKey, unknown]>;

// Existing Utils
type DeepWritable<OBJ_T> = { -readonly [P in keyof OBJ_T]: DeepWritable<OBJ_T[P]> };
type UnionToIntersection<UNION_T> // From https://stackoverflow.com/a/50375286
    = (UNION_T extends any ? (k: UNION_T) => void : never) extends ((k: infer I) => void) ? I : never;

// New Utils
type UnionObjectFromArrayOfPairs<ARR_T extends EntriesType> =
    DeepWritable<ARR_T> extends (infer R)[] ? R extends [infer key, infer val] ? { [prop in key & PropertyKey]: val } : never : never;
type MergeIntersectingObjects<ObjT> = {[key in keyof ObjT]: ObjT[key]};
export type EntriesToObject<ARR_T extends EntriesType> = MergeIntersectingObjects<UnionToIntersection<UnionObjectFromArrayOfPairs<ARR_T>>>;

export const objectFromEntries = <ARR_T extends EntriesType>(arr: ARR_T): EntriesToObject<ARR_T> => {
    return Object.fromEntries(arr) as EntriesToObject<ARR_T>;
}

const arrayMap = <T extends any>(array: T[], byKey: PropertyKey ) =>
  array.map((obj: T) => [obj[byKey], obj]) as [any, T][];

export const arrayToObject = <
  T extends any,
  K extends keyof T,
>(array: T[], byKey: K) => objectFromEntries(arrayMap(array, byKey)) as {[key: PropertyKey]: T};
