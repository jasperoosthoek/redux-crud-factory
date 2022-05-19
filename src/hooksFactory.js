
import { useSelector, useDispatch } from 'react-redux';

export default (objectName, { byKey, parent }, {
  mapToProps,
  mapToPropsStripped,
  actions,
  actionsStripped,
}) => {
  console.log(objectName, { actions, actionsStripped })
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
    const obj = useSelector(state => 
      stripped
        ? mapToPropsStripped(state, { [byKey]: id, [parent]: parentId })
        : mapToProps(state, { [byKey]: id, [parent]: parentId })
    );

    const dispatch = useDispatch()
    return {
      ...obj,
      ...Object.fromEntries(
        Object.entries(stripped ? actionsStripped : actions).map(([ name, action ]) =>
          [name, (...args) => dispatch(action(...args))]
        )
      ),
    }
  }

  return {
    hooks: getUseFactory(false),
    hooksStripped: getUseFactory(true),
  }
}