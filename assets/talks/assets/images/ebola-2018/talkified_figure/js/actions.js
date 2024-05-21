import {C} from "./reducers.js";

/**
    Redux action creators.
 */
export function collapseLocation(location,tips){
    return{type:C.REMOVE_LOCATION,location:location,effectiveTips:tips};
}
export function addLocationToExpanded(location,tips){
    return{type:C.ADD_EXPANDED_LOCATION,location:location,effectiveTips:tips}
}
export function collapseAllLocations(){
    return{type:C.CLEAR_LOCATIONS}
}
export function expandJustThisLocation(location,tips){
    return{type:C.EXPAND_LOCATION,location:location,effectiveTips:tips}
}
export function selectBranches(targetNodes){
    return({type:C.SELECT_BRANCHES,targetNodes : targetNodes})
}
export function addBranchesToSelection(targetNodes){
    return({type:C.ADD_BRANCHES,targetNodes : targetNodes})
}
export function resetBranchSelections(){
    return({type:C.CLEAR_BRANCHES})
}
export function removeBranchesFromSelection(targetNodes){
    return({type:C.REMOVE_BRANCHES,targetNodes:targetNodes})
}

export function setHighlightedNodes(nodeNames){
    return({type:C.HIGHLIGHT_NODES,nodeNames:nodeNames})
}

export function selectNode(node){
    return({type:C.SELECT_NODE,node:node})

}

export function deSelectNode(node){
    return({type:C.REMOVE_NODE, node:node})

}
export function clearNodes(){
    return({type:C.CLEAR_NODES})
}
export function addSelectedNode(node){
    return({type:C.ADD_NODE,node:node})
}

export function setHoverNodes(node){
    return({type:C.HOVER_NODES,node:node})
}
export function setToolTipText(text){
    return({type:C.TOOL_TIP_TEXT,text:text})
}