import { formatFunctionNames } from './actionsFactory';
import { toUpperCamelCase, arrayToObject } from './utils';

export const getMapToProps = (objectName, config) => {
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
        ?
          {
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
      ? { [camelCaseNameSingle]: state.list ? state.list[ownProps[byKey]] : null } 
      : {}
  })
  
  const mapToPropsStripped = (state = {}, ownProps = {}) => ({
    ...actions.get
      ?
        {
          getIsLoading: state.getIsLoading,
          getError: state.getError,
        }
      : {},
    ...actions.create
      ?
        {
          createIsLoading: state.createIsLoading,
          createError: state.createError,
        }
      : {},
    ...actions.update
      ?
        {
          updateIsLoading: state.updateIsLoading,
          updateError: state.updateError,
        }
      : {},
    ...actions.delete
      ?
        {
          deleteIsLoading: state.deleteIsLoading,
          deleteError: state.deleteError,
        }
      : {},
    ...actions.getList
      ?
        {
          list: state.list,
          getListIsLoading: state.getListIsLoading,
          getListError: state.getListError,
        }
      : {},
    ...actions.select === 'single'
      ?
        {
          [`selected${camelCaseId}`]: state[selectedId],
          selected: state.list && state[selectedId] ? state.list[state[selectedId]] : null,
        }
      : {},
    ...propsIncluded(state),
    ...singleObjectByIdProp(state, ownProps),
  });
  const mapToProps = (state = {}, ownProps = {}) => ({
    ...actions.get
      ?
        {
          [`get${functionSingle}IsLoading`]: state.getIsLoading,
          [`get${functionSingle}Error`]: state.getError,
        }
      : {},
    ...actions.create
      ?
        {
          [`create${functionSingle}IsLoading`]: state.createIsLoading,
          [`create${functionSingle}Error`]: state.createError,
        }
      : {},
    ...actions.update
      ?
        {
          [`update${functionSingle}IsLoading`]: state.updateIsLoading,
          [`update${functionSingle}Error`]: state.updateError,
        }
      : {},
    ...actions.delete
      ?
        {
          [`delete${functionSingle}IsLoading`]: state.deleteIsLoading,
          [`delete${functionSingle}Error`]: state.deleteError,
        }
      : {},
    ...actions.getList
      ?
        // Default to empty object in case objects with parents get a parent prop that does not exist (yet) which is allowed.
        {
          [`${objectName}List`]: state.list,
          [`get${functionPlural}ListIsLoading`]: state.getListIsLoading,
          [`get${functionPlural}ListError`]: state.getListError,
        }
      : {},
    ...actions.select === 'single'
      ?
        {
          [`selected${functionSingle}${camelCaseId}`]: state[selectedId],
          [`selected${functionSingle}`]: state.list && state[selectedId] ? state.list[state[selectedId]] : null,
        }
      : {},
    ...propsIncluded(state),
    ...singleObjectByIdProp(state, ownProps),
  });

  if (!parent) {
    // This is the default mapper
    return {
      mapToPropsStripped: (state, ownProps) => mapToPropsStripped(state[objectName], ownProps),
      mapToProps: (state, ownProps) => mapToProps(state[objectName], ownProps),
    };
  }

  const getMapToPropsWithParent = stripped => (state, ownProps) => {
    if (typeof ownProps !== 'object') {
      console.error('When "parent" is defined, ownProps needs to be included too, i.e. mapToProps(state, ownProps).');
      return null;
    }
    const parentFromProp = ownProps[parent];
    // When the parent is an object, retrieve the parentKey by using parentId from the object
    const parentKey = parentFromProp !== null && typeof parentFromProp === 'object' ? parentFromProp[parentId] : parentFromProp
    return ({
        // If the parent key is not specified in ownProps then it is assumed to be null
        ...ownProps[parent] || ownProps[parent] === null
          ? 
            // Return child state by parent
            state[objectName].list !== null && state[objectName].list[parentKey]
              ? (
                stripped
                  ? mapToPropsStripped(state[objectName].list[parentKey], ownProps)
                  : mapToProps(state[objectName].list[parentKey], ownProps)
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
              [stripped ? 'getAllIsLoading' : `getAll${functionPlural}IsLoading`]: state[objectName].getAllIsLoading,
              [stripped ? 'getAllError' : `getAll${functionPlural}Error`]: state[objectName].getAllError,
            }
          : {},
      }
    )}

  return {
    mapToProps: getMapToPropsWithParent(false),
    mapToPropsStripped: getMapToPropsWithParent(true),
  };
};
