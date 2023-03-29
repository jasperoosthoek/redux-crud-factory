
export const snakeToCamelCase = str => str.toLowerCase().replace(
  /([-_][a-z])/g,
  (group) => group.toUpperCase()
    .replace('-', '')
    .replace('_', '')
);

export const camelToSnakeCase = str => (str
  .split(/(?=[A-Z])/)
  .map(x => x.toUpperCase())
  .join('_')
);

export const toUpperCamelCase = str => {
  // First make str camelCase in case it has a leading _
  const camelCaseId = snakeToCamelCase(str);
  // Now return "Id"
  return `${camelCaseId.charAt(0).toUpperCase()}${camelCaseId.slice(1)}`;
}

export const pluralToSingle = str => {
  if (str.slice(-1).toLowerCase() !== 's') {
    // This string is not plural: keep it unaltered
    return str;
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

export const singleToPlural = str => {
  if (str.slice(-1).toLowerCase() === 's') {
    // This string is already plural: keep it unaltered
    return str;
  } else if (str.slice(-1) === 'y') {
    // Handle special case of categories
    return `${str.slice(0, -1)}ies`;
  } else if (str.slice(-1) === 'Y') {
    // Same but in upper case
    return `${str.slice(0, -1)}IES`;
  } else {
    // Standard plural
    return `${str}s`;
  } 
}

export const titleCase = str => `${str.charAt(0).toUpperCase()}${str.slice(1)}`;

// Simply call func with params if it is a function, if not ignore
export const callIfFunc = (func, ...params) => {
  if (typeof func === 'function') {
    func(...params);
  }
}

export const arrayToObject = (array, byKey) => Object.fromEntries(array.map(obj => [obj[byKey], obj]));
