
import { useSelector, useDispatch } from 'react-redux';

export const includeHooks = ({
  mapToProps,
  mapToPropsStripped,
  actions,
  actionsStripped,
}) => {
  
  const getUseFactory = stripped => (props = {}) => {
    const dispatch = useDispatch()
    const obj = useSelector(state => 
      stripped ? mapToPropsStripped(state, props) : mapToProps(state, props)
    );

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