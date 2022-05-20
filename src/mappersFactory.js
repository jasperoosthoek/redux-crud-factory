import { formatFunctionNames } from './actionsFactory';
import { toUpperCamelCase, arrayToObject } from './utils';

export default (objectName, config) => {
  const {
    id,
    byKey,
    parent,
    parentId,
    includeProps,
    select,
    selectedId,
    actions,
    includeActions,
    parseIdToInt,
    parseParentToInt,
  } = config;
  const { functionSingle, functionPlural, camelCaseNameSingle } = formatFunctionNames(objectName);
  const camelCaseId = toUpperCamelCase(byKey);
  
  const propsIncluded = (state) => ({
    ...includeProps
      ?
        Object.keys(includeProps).reduce((obj, propName) => ({
            ...obj,
            [propName]: state[propName],
        }), {})
      : {},
    ...Object.entries(includeActions).reduce((obj, [action, { isAsync, initialState = {} }]) => ({
      ...obj,
      ...isAsync
        ? {
            [`${action}IsLoading`]: state[`${action}IsLoading`],
            [`${action}Error`]: state[`${action}Error`],
          }
        : {},
    }), {}),
  });

  // If the id is given to a component as a prop, this function will fetch the object from
  // the state or give null when the object is not found
  const singleObjectByIdProp = (state, ownProps) => ({
    ...(typeof ownProps[byKey] !== 'undefined')
      ? {
          [camelCaseNameSingle]:
            state.list 
              ? state.list[
                  parseIdToInt ? parseInt(ownProps[byKey]): ownProps[byKey]
                ]
              : null
        } 
      : {}
  })
  
  const actionsStrippedToFullName = {
    ...actions.get
      ? { get: `get${functionSingle}` }
      : {},
    ...actions.create
      ? { create: `create${functionSingle}` }
      : {},
    ...actions.update
      ? { update: `update${functionSingle}` }
      : {},
    ...actions.delete
      ? { delete: `delete${functionSingle}` }
      : {},
    ...actions.getList
      ? { getList: `get${functionPlural}List` }
      : {},
    ...Object.entries(includeActions).reduce((o, [action, { isAsync }]) => ({
      ...o,
      ...isAsync
        ? { [action]: action }
        : {},
    }), {}),
  };

  const getMapToProps = stripped => (state = {}, ownProps = {}) => {
    const fs = stripped ? '' : functionSingle;
    const fp = stripped ? '' : functionPlural;
    return (
      {
        ...Object.entries(actionsStrippedToFullName).reduce(
          (o, [ strippedName, fullName]) => {
            const name = stripped ? strippedName : fullName;
            // console.log(stripped, {strippedName,  fullName},`${name}IsLoading`,{ o }, { state })
            return (
              {
                ...o,
                [`${name}IsLoading`]: state[`${strippedName}IsLoading`],
                [`${name}Error`]: state[`${strippedName}Error`],
              }
            )}, {}),
        ...actions.getList
          ?
            // Default to empty object in case objects with parents get a parent prop that does not exist (yet) which is allowed.
            {
              [stripped ? 'list' : `${objectName}List`]: state.list,
            }
          : {},
        ...actions.select === 'single'
          ?
          {
            [`selected${stripped ? '' : functionSingle}${camelCaseId}`]: state[selectedId],
            [`selected${stripped ? '' : functionSingle}`]: state.list && state[selectedId] ? state.list[state[selectedId]] : null,
          }
          : {},
        ...propsIncluded(state),
        ...singleObjectByIdProp(state, ownProps),
      }
    );
  };

  if (!parent) {
    // This is the default mapper
    return {
      actionsStrippedToFullName,
      mapToProps: (state, ownProps) => getMapToProps(false)(state[objectName], ownProps),
      mapToPropsStripped: (state, ownProps) => getMapToProps(true)(state[objectName], ownProps),
    };
  }

  const getMapToPropsWithParent = stripped => (state, ownProps) => {
    if (typeof ownProps !== 'object') {
      console.error('When "parent" is defined, ownProps needs to be included too, i.e. mapToProps(state, ownProps).');
      return null;
    }
    const parentFromProp = ownProps[parseParentToInt ? parseInt(parent) : parent];
    // When the parent is an object, retrieve the parentKey by using parentId from the object
    const parentKey = parentFromProp !== null && typeof parentFromProp === 'object' ? parentFromProp[parentId] : parentFromProp
    return ({
        // If the parent key is not specified in ownProps then it is assumed to be null
        ...ownProps[parent] || ownProps[parent] === null
          ? 
            // Return child state by parent
            state[objectName].list !== null && state[objectName].list[parentKey]
              ? (
                getMapToProps(stripped)(state[objectName].list[parentKey], ownProps)
              )
              : {}
          :
            {
              // Return embedded list by [parent][key]
              [stripped ? 'list' : `${objectName}List`]:
                state[objectName].list === null
                  ? null
                  : Object.fromEntries(
                      Object.entries(state[objectName].list).map(
                        ([parentKey, { list }]) => [parentKey, list]
                      )
                    ),
            },
        ...parent && actions.getList
          ?
            {
              [`getAll${stripped ? '' : functionPlural}IsLoading`]: state[objectName].getAllIsLoading,
              [`getAll${stripped ? '' : functionPlural}Error`]: state[objectName].getAllError,
            }
          : {},
      }
    )}

  return {
    actionsStrippedToFullName: {
      ...actionsStrippedToFullName,
      ...actions.getAll
        ? {
            getAll: `getAll${functionPlural}`,
            clearAll: `clearAll${functionPlural}`,
          }
        : {},
    },
    mapToProps: getMapToPropsWithParent(false),
    mapToPropsStripped: getMapToPropsWithParent(true),
  };
};
