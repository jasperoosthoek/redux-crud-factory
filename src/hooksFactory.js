
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { getMapSubState, getMapToProps, getReturnParentState } from './mappersFactory';

export default (objectName, config, {
  mapActions,
  asyncActions,
  syncActions,
  asyncActionsStripped,
  syncActionsStripped,
  asyncActionsIncludedActions,
  syncActionsIncludedState,
  actionTypes,
}) => {
  const mapSubState = getMapSubState(objectName, config);
  const mapToProps = getMapToProps(objectName, config, { stripped: false, loadingState: false });
  const mapToPropsStripped = getMapToProps(objectName, config, { stripped: true, loadingState: false });

  const { byKey, parent } = config;
  
  const getUseFactory = stripped => props => {
    let { [byKey]: id, [parent]: parentId, ...restProps } = props || {};
    if (['string', 'number', 'bigint'].includes(typeof props)) {
      id = props;
    }
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
        : mapToProps(state, { ...idObj, ...parentObj }),
      shallowEqual
    );
    // when parent and parentId are defined the result the state of this parentId: state[objectName].list[parentId]
    // Otherwise, subState is just state[objectName]
    // However, when parent is defined and parentId is not, all action functions (get, create etc) will not have any loading state
    const subState = useSelector(state => mapSubState(state, { ...idObj, ...parentObj }));

    const dispatch = useDispatch();
    
    const assignAttributes = (dispatchableAction, actionName) => {
      const loadingState = subState.actions && subState.actions[actionName];
          
      return Object.assign(
        dispatchableAction,
        {
          ...loadingState,
          clearError: 
            () => dispatch({
              type: actionTypes.clearError[actionName],
              ...parent && typeof parentId !== 'undefined' ? { parent: parentId } : {}
            }),
        }
      );
    };
    return {
      ...obj,
      ...Object.entries(asyncActionsStripped).reduce(
        (o, [actionName, actionFunction]) => {
          let dispatchableAction;
          if (actionName === 'create') {
            dispatchableAction = (obj = {}, ...restArgs) =>
              dispatch(actionFunction({ ...parentObj, ...obj }, ...restArgs)
            );
          } else if (actionName === 'update') {
            dispatchableAction = (obj = {}, ...restArgs) =>
              dispatch(actionFunction({ ...idObj, ...parentObj, ...obj }, ...restArgs)
            );
          } else if (actionName === 'delete') {
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
          
          assignAttributes(dispatchableAction, actionName);

          return { ...o, [stripped ? actionName : mapActions[actionName] || actionName]: dispatchableAction };
        }, {}),
      ...Object.entries(asyncActionsIncludedActions).reduce(
        (o, [actionName, actionFunction]) => {
          const dispatchableAction = (...args) => dispatch(actionFunction(...args));
          
          assignAttributes(dispatchableAction, actionName);
          
          return { ...o, [actionName]: dispatchableAction };
        }, {}),
      ...Object.entries({ ...stripped ? syncActionsStripped : syncActions, ...syncActionsIncludedState,  })
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