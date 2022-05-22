
import { useSelector, useDispatch } from 'react-redux';

export default (objectName, { byKey, parent }, {
  mapToProps,
  mapToPropsStripped,
  asyncActions,
  syncActions,
  asyncActionsStripped,
  syncActionsStripped,
  asyncActionsIncluded,
  syncActionsIncluded,
}) => {
  const getUseFactory = stripped => ({ [byKey]: id, [parent]: parentId, ...restProps } = {}) => {
    if (!parent && typeof parentId !== 'undefined') {
      console.error(
        `Unrecognised parent prop ${
          parent !== 'parent' ? `(${parent}) ` : ''
        }while parent is not set given to ${objectName} hook.`
      )
    }
    if (Object.values(restProps).length !== 0) {
      console.error(
        `Unrecognized props given to ${objectName} hook:`,
        restProps
      );
    }

    // Reusable object when parentId is defined
    const idObj = typeof id !== 'undefined' ? { [byKey]: id } : {}
    const parentObj = parent && typeof parentId !== 'undefined' ? { [parent]: parentId } : {}
    
    // Reuse mapToProps functions to get state
    const obj = useSelector(state => 
      stripped
        ? mapToPropsStripped(state, { ...idObj, ...parentObj })
        : mapToProps(state, { ...idObj, ...parentObj })
    );
    const dispatch = useDispatch();

    return {
      ...obj,
      ...Object.entries(stripped ? asyncActionsStripped : asyncActions).reduce(
        (o, [actionName, actionFunction]) => {
          let dispatchableAction
          if (actionName.startsWith('create')) {
            dispatchableAction = (obj = {}, ...restArgs) =>
              dispatch(actionFunction({ ...parentObj, ...obj }, ...restArgs)
            );
          } else if (actionName.startsWith('update')) {
            dispatchableAction = (obj = {}, ...restArgs) =>
              dispatch(actionFunction({ ...idObj, ...parentObj, ...obj }, ...restArgs)
            );
          } else if (actionName.startsWith('delete')) {
            dispatchableAction = (obj = {}, ...restArgs) =>
              dispatch(actionFunction({
                ...idObj,
                ...parentObj,
                ...typeof obj === 'object' ? obj : { byKey: obj },
              }, ...restArgs)
            );
          } else { 
              dispatchableAction = (...args) => dispatch(actionFunction(...args));
          }
          
          dispatchableAction.isLoading = obj[`${actionName}IsLoading`];
          dispatchableAction.error = obj[`${actionName}Error`];
          return { ...o, [actionName]: dispatchableAction };
        }, {}),
      ...Object.entries(asyncActionsIncluded).reduce(
        (o, [actionName, actionFunction]) => {
          const dispatchableAction = (...args) => dispatch(actionFunction(...args));
          dispatchableAction.isLoading = obj[`${actionName}IsLoading`];
          dispatchableAction.error = obj[`${actionName}Error`];
          return { ...o, [actionName]: dispatchableAction };
        }, {}),
      ...Object.entries({ ...syncActionsIncluded, ...stripped ? syncActionsStripped : syncActions })
          .reduce((o, [actionName, actionFunction]) => (
            {
              ...o,
              [actionName]: (...args) => dispatch(actionFunction(...args)),
            }
          ), {}),
    }
  }

  return {
    hooks: getUseFactory(false),
    hooksStripped: getUseFactory(true),
  }
}