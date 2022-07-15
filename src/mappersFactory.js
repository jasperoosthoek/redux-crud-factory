import { formatActionAndFunctionNames, getMapActions } from './actionsFactory';
import { toUpperCamelCase, singleToPlural } from './utils';
// If parent is defined and the parent key is not specified in ownProps then it is assumed to be null
export const getReturnParentState = ({ parent }) => ownProps => !!parent && !ownProps[parent] && ownProps[parent] !== null

// Maps the substate or returns the parent state
export const getMapSubState = (objectName, config) => {
  const { parent, parentId, parseParentToInt } = config;

  if (!parent) {
    return state => state[objectName];
  }
  const returnParentState = getReturnParentState(config)
  return (
    (state, ownProps) => {
      if (returnParentState(ownProps)) {
        return state[objectName];
      }
      const parentFromProp = ownProps[parseParentToInt ? parseInt(parent) : parent];
      // When the parent is an object, retrieve the parentKey by using parentId from the object
      const parentKey = parentFromProp !== null && typeof parentFromProp === 'object' ? parentFromProp[parentId] : parentFromProp
      
      return (
        state[objectName].list !== null && !!state[objectName].list[parentKey]
          ? state[objectName].list[parentKey]
          : {}
      )
    }
  );
};

export const getMapToProps = (objectName, config, { stripped, loadingState=true }) => {
  const {
    byKey,
    parent,
    state: includeState,
    selectedId,
    selectedIds,
    actions,
    includeActions,
    parseIdToInt,
  } = config;
  const mapActions = getMapActions(objectName, config);

  const { functionSingle, functionPlural, camelCaseNameSingle } = formatActionAndFunctionNames(objectName);
  const camelCaseId = toUpperCamelCase(byKey);
  const camelCaseIdPlural = singleToPlural(camelCaseId);
  const mapSubState = getMapSubState(objectName, config);
  const actionsStrippedToFullName = {
    ...actions.get
      ? { get: mapActions.get }
      : {},
    ...actions.create
      ? { create: mapActions.create }
      : {},
    ...actions.update
      ? { update: mapActions.update }
      : {},
    ...actions.delete
      ? { delete: mapActions.delete }
      : {},
    ...actions.getList
      ? { getList: mapActions.getList }
      : {},
    ...Object.entries(includeActions).reduce((o, [action, { isAsync }]) => ({
      ...o,
      ...isAsync
        ? { [action]: action }
        : {},
    }), {}),
  };
  const returnParentState = getReturnParentState(config)

  return (
    (fullState = {}, ownProps = {}) => {
      const state = mapSubState(fullState, ownProps);

      return (
        {
          ...returnParentState(ownProps)
            ?
              {
                // Return embedded list by [parent][key]
                [stripped ? 'list' : `${objectName}List`]:
                  fullState[objectName].list === null
                    ? null
                    : Object.fromEntries(
                        Object.entries(fullState[objectName].list).map(
                          ([parentKey, { list }]) => [parentKey, list]
                        )
                      ),
                      
                ...loadingState && actions.getList
                ?
                  {
                    [`getAll${stripped ? '' : functionPlural}IsLoading`]: state[objectName].getAll.isLoading,
                    [`getAll${stripped ? '' : functionPlural}Error`]: state[objectName].getAll.error,
                  }
                : {},
              }
            : 
              {
                ...loadingState
                  ?
                    {
                      ...Object.entries(actionsStrippedToFullName).reduce(
                        (o, [ strippedName, fullName]) => {
                          const name = stripped ? strippedName : fullName;
                          return (
                            {
                              ...o,
                              [`${name}IsLoading`]: state.actions[strippedName].isLoading,
                              [`${name}Error`]: state.actions[strippedName].error,
                            }
                          )}, {}),
                      ...Object.entries(includeActions).reduce((obj, [action, { isAsync }]) => ({
                        ...obj,
                        ...isAsync
                          ? {
                              [`${action}IsLoading`]: state.actions[action].isLoading,
                              [`${action}Error`]: state.actions[action].error,
                            }
                          : {},
                      }), {}),
                    }
                  : {},
                ...actions.getList || (actions.getAll && (!!ownProps[parent] || ownProps[parent] === null))
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
                ...actions.select === 'multiple'
                  ?
                  {
                    [`selected${stripped ? '' : functionSingle}${camelCaseIdPlural}`]: state[selectedIds],
                    [`selected${stripped ? '' : functionPlural}`]: 
                      state.list && state[selectedIds].length !== 0
                        ? Array.from(state[selectedIds])
                            .map(id => state.list[id])
                            .filter(obj => !!obj)
                        : [],
                  }
                  : {},
                ...includeState ? state.state : {},
                // If the id is given to a component as a prop, this function will fetch the object from
                // the state or give null when the object is not found
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
              }
        }
      );
    }
  );
};

export default (objectName, config, { mapActions }) => {
  const {
    id,
    byKey,
    parent,
    parentId,
    state: includeState,
    select,
    selectedId,
    selectedIds,
    actions,
    includeActions,
    parseIdToInt,
    parseParentToInt,
  } = config;
  const { functionSingle, functionPlural, camelCaseNameSingle } = formatActionAndFunctionNames(objectName);
  const camelCaseId = toUpperCamelCase(byKey);
  const camelCaseIdPlural = singleToPlural(camelCaseId);
  

   
  if (!parent) {
    // This is the default mapper
    return {
      mapToProps: getMapToProps(objectName, config, { stripped: false }),
      mapToPropsStripped: getMapToProps(objectName, config, { stripped: true }),
    };
  }
  
  
  const getMapToPropsWithParent = stripped => {
    const mapToProps = getMapToProps(objectName, config, { stripped });
    return (
      (state, ownProps) => {
    
        if (typeof ownProps !== 'object') {
          console.error('When "parent" is defined, ownProps needs to be included too, i.e. mapToProps(state, ownProps).');
          return null;
        }
        
        return mapToProps(state, ownProps);
      }
    );
  };

  return {
    mapToProps: getMapToPropsWithParent(false),
    mapToPropsStripped: getMapToPropsWithParent(true),
  };
};
