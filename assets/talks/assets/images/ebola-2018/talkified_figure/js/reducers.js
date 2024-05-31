export const C = {

    EXPAND_LOCATION:"EXPAND_LOCATION",
    ADD_EXPANDED_LOCATION:"ADD_EXPANDED_LOCATION",
    ADD_EXPANDED_LOCATIONS:"ADD_EXPANDED_LOCATIONS",
    REMOVE_LOCATION:"REMOVE_LOCATION",
    CLEAR_LOCATIONS:"CLEAR_LOCATIONS",
    SELECT_BRANCHES:"SELECT_BRANCHES",
    CLEAR_BRANCHES:"CLEAR_BRANCHES",
    ADD_BRANCHES:"ADD_BRANCHES",
    REMOVE_BRANCHES:"REMOVE_BRANCHES",
    TOGGLE_LAYOUT: "TOGGLE_LAYOUT",
    TOGGLE_EXPANSION: "TOGGLE_EXPANSION",
    TOGGLE_TRANSMISSION: "TOGGLE_TRANSMISSION",
    HIGHLIGHT_NODES:"HIGHLIGHT_NODES",
    SELECT_NODE:"SELECT_NODE",
    CLEAR_NODES:"CLEAR_NODES",
    ADD_NODE:"ADD_NODE",
    REMOVE_NODE:"REMOVE_NODE",
    HOVER_NODES:"HOVER_NODES,",
    TOOL_TIP_TEXT:"TOOL_TIP_TEXT"
};

export const locations=(state=[],action)=>{
    switch (action.type) {
        case C.EXPAND_LOCATION:
            return [action.location];
        case C.ADD_EXPANDED_LOCATION:
            return [...state,action.location];
        case C.ADD_EXPANDED_LOCATIONS:
            return [...state,...action.locations];
        case C.REMOVE_LOCATION:
            return state.filter(l=>l!==action.location);
        case C.CLEAR_LOCATIONS:
            return [];
        default:
            return state;
    }
};

export const effectiveTipsReducerFactory = (initialState)=>(state=initialState,action)=>{
    switch(action.type){
        case C.ADD_EXPANDED_LOCATION:
            return state-1+action.effectiveTips;
        case C.ADD_EXPANDED_LOCATIONS:
            return state-action.effectiveTips.length+action.effectiveTips.reduce((acc,curr)=>{return(acc+curr)},0);
        case C.REMOVE_LOCATION:
            return state+1-action.effectiveTips;
        case C.EXPAND_LOCATION:
            return initialState+action.effectiveTips;
        case C.CLEAR_LOCATIONS:
            return initialState;
        default:
            return state;
    }
};

export const selectedBranches =(state=[], action)=>{
    switch (action.type) {
        case C.SELECT_BRANCHES:
            return action.targetNodes;
        case C.CLEAR_BRANCHES:
            return [];
        case C.ADD_BRANCHES:
            return [...state,...action.targetNodes];
        case C.REMOVE_BRANCHES:
            return state.filter(n=>!action.targetNodes.includes(n));
        default:
            return state;

    }
};
export const layout = (state="RECTANGULAR_LAYOUT",action)=>{
    if (action.type === C.TOGGLE_LAYOUT) {
        return ( state==="EXPLODED_LAYOUT"? "RECTANGULAR_LAYOUT" :"EXPLODED_LAYOUT");
    } else {
        return state;
    }
};

export const expandAllLocations = (state=false,action)=>{
    if (action.type === C.TOGGLE_EXPANSION ){
        return !state;
    } else {
        return state;
    }
};
export const expandTransmissions =(state=false,action)=>{
    if (action.type === C.TOGGLE_TRANSMISSION) {
        return !state;
    } else {
        return state;
    }
}

export const highlightedNodes = (state=[], action)=>{
    if(action.type===C.HIGHLIGHT_NODES){
        return action.nodeNames
    }else{
        return state;
    }
}
export const selectedNodes = (state=[],action)=>{
    switch(action.type){
        case C.SELECT_NODE:
            return [action.node];
        case C.REMOVE_NODE:
            return state.filter(n=>n!==action.node);
        case C.CLEAR_NODES:
            return [];
        case C.ADD_NODE:
            return state.concat(action.node);
        default:
            return state;
    }
};

export const hoveredNodes = (state={},action)=>{
    if (action.type === C.HOVER_NODES) {
        return action.node;
    } else {
        return state;
    }
}
export const toolTipText=(state="",action)=>{
    if(action.type===C.TOOL_TIP_TEXT){
        return action.text;
    }else{
        return state
    }

}