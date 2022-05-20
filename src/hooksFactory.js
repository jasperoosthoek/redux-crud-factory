
import { useSelector, useDispatch } from 'react-redux';

export default (objectName, { byKey, parent }, {
  mapToProps,
  mapToPropsStripped,
  actions,
  actionsStripped,
  actionsStrippedToFullName,
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
    const dispatch = useDispatch()

    return {
      ...obj,
      ...Object.entries(actionsStrippedToFullName).reduce(
        (o, [strippedName, fullName]) => {
          let dispatchableAction
          switch (strippedName) {
            case 'create':
              dispatchableAction = (obj = {}, ...restArgs) =>
                dispatch(actionsStripped[strippedName]({ ...parentObj, ...obj }, ...restArgs)
              );
            case 'update':
              dispatchableAction = (obj = {}, ...restArgs) =>
                dispatch(actionsStripped[strippedName]({ ...idObj, ...parentObj, ...obj }, ...restArgs)
              );
              break
            case 'delete':
              dispatchableAction = (obj = {}, ...restArgs) =>
                dispatch(actionsStripped[strippedName]({
                  ...idObj,
                  ...parentObj,
                  ...typeof obj === 'object' ? obj : { byKey: obj },
                }, ...restArgs)
              );
              break
            default:
              dispatchableAction = (...args) => dispatch(actionsStripped[strippedName](...args));
          }
          
          const name = stripped ? strippedName : fullName;
          if (!strippedName.startsWith('clear')) {
            dispatchableAction.isLoading = obj[`${name}IsLoading`]
            dispatchableAction.error = obj[`${name}Error`]
          }
          return (
            {
              ...o,
              [name]: dispatchableAction,
            }
          )
          }, {}),
    }
  }

  return {
    hooks: getUseFactory(false),
    hooksStripped: getUseFactory(true),
  }
}