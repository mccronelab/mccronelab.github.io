import {C} from "./reducers.js"

/**
 * Logs all actions and states after they are dispatched.
 */
export const logger = store => next => action => {
    console.group(action.type);
    console.info('dispatching', action);
    let result = next(action);
    console.log('next state', store.getState());
    console.groupEnd();
    return result
};
/**
 * A redux middleware that flags a tree layout as unknown if the action
 * expands or closes locations. 
 * @param explodedLayout
 * @return {function(*): function(*): function(*=): *}
 */
export const layoutTrigger = figTree => store => next => action =>{
    // if updating exploded layout status then we need to set that layout to unknown.
    const germainToLayout = [C.EXPAND_LOCATION,C.ADD_EXPANDED_LOCATION,C.ADD_EXPANDED_LOCATIONS,C.REMOVE_BRANCHES,C.CLEAR_LOCATIONS];
    if(germainToLayout.includes(action.type)){
        figTree.layout.layoutKnown=false
    }
    return next(action);
};