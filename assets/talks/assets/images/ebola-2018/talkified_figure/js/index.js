import {
    TransmissionLayout,
    ExplodedLayout,
    CircleBauble,
    RectangularBauble,
    FigTree,
    RectangularLayout
} from "./figtree.esm.3c03.js"

import {compose, processCases, processCasesMOH, processTreeFactory} from "./dataProcessing.js";
import {treeStyles} from "./styles.js"
import {dateBackground,updateRectangles} from "./annotations.js";
import {customDateFormat} from "./dates.js";
const createStore= Redux.createStore;
const combineReducers= Redux.combineReducers;
const applyMiddleware= Redux.applyMiddleware;

import {locations,effectiveTipsReducerFactory,selectedBranches,C,layout,expandTransmissions,expandAllLocations,highlightedNodes} from "./reducers.js"
// import ebola_nexus from './data/ebov_269_2019-08-28.MCC.tree';
// import ebola_nexus from "./data/ebov_drc_351_default.MCC.tree";//"./data/351_0.01.MCC.tree"//tmp_27M_low-geo-rate_ebov_drc_269_2019-07-09.MCC.tree"
import ebola_nexus from "../data/ebov_drc_major_locations_default.MCC.tree.js";//"./data/351_0.01.MCC.tree"//tmp_27M_low-geo-rate_ebov_drc_269_2019-07-09.MCC.tree"

import case_csv from '../data/MOH-By-Health-Zone-2019-09-16.csv.js';

import {
    autocomplete, fireToolTip,
    getNodesInCirculation, hideToolTip,
    hoverBranchAction, hoverNodes,
    nodeHoverActions, selectCirculation, selectImportExport, selectNodeOnClick, unHoverNodes, updateToolTip
} from "./interactions.js";
import {layoutTrigger, logger} from "./redux.js";
// import "../styles.css"
import {
    addLocationToExpanded, clearNodes,
    collapseAllLocations,
    collapseLocation,
    expandJustThisLocation,
    resetBranchSelections
} from "./actions.js";
import {order} from "../data/optimizedOrder.json.js"
import {hoveredNodes, selectedNodes, toolTipText} from "./reducers.js";

const width = 1200,
    height = 675;

const svgSelection = d3.select("#fig")
    .append("svg")
    .attr("class","tree")
    .attr("id","figtree")
    .attr("width",width)
    .attr("height",height)


/**
 * Data processing
 */

const processTree = processTreeFactory(2019.63);
//2019.63

const Ebola_tree = processTree(ebola_nexus);

const casesByLocation = processCasesMOH(case_csv).filter(l => Ebola_tree.annotations.location.values.has(l.location))
    .filter(location => d3.max(location.caseData, timepoint => timepoint.cases) > 0)

casesByLocation.forEach(location =>{
        location.caseData=location.caseData.filter(cd=>cd.x1<2019.63)
    })



const mostRecentCaseDataDate = d3.max(casesByLocation, location => d3.max(location.caseData, timepoint => timepoint.x1));
Ebola_tree.origin=2019.63;
const tipsPerLocation = new Map([...Ebola_tree.annotations.location.values].map(l=>[l,Ebola_tree.nodes.filter(n=>n.annotations.location===l).filter(n=>!n.children || n.children.length===1&&n.children[0].annotations.location!==n.annotations.location).length]));

const circulations = Ebola_tree.nodes.filter(n=>n===Ebola_tree.rootNode||n.annotations.location!==n.parent.annotations.location).length;
/**
 *
 * Configurations for the layouts
 */
const pixelPerTip = 2;
const interGroupGap = 7;
const intraGroupGap = 2;



/**
 * The different layout that will be used to view the tree
 */
const explodedLayout = new ExplodedLayout(Ebola_tree,{groupingAnnotation :'location',interGroupGap:interGroupGap,intraGroupGap:intraGroupGap,groupOrdering:(a,b)=>order.solution.indexOf(b)-order.solution.indexOf(a)});


const rectangularLayout = new RectangularLayout(Ebola_tree);
const transmissionLayout = new TransmissionLayout(Ebola_tree,{groupingAnnotation: 'location',groupGap:5,direction:"down"});

/**
 * Here we handel the fake nodes that were added in the tree processing steps.
 * These nodes allow us to included the case data for the locations that don't have any sequence data.
 */
for(const addedNode of Ebola_tree.nodes.filter(n=>n.annotations.fakeData)){
    explodedLayout.maskNode(addedNode);
    rectangularLayout.ignoreNode(addedNode);
    transmissionLayout.ignoreNode(addedNode);
}

/**
 * Setting up the redux store
 *
 */


const figTreeSettings = { hoverBorder: 5,
    backgroundBorder: 2,
    transitionDuration:750,
    ticks:9,
    tickFormat:customDateFormat,
    baubles: [
        new CircleBauble({ vertexFilter: (v) => !v.node.annotations.insertedNode,radius:2}),
        new RectangularBauble({ vertexFilter: (v) => v.node.annotations.insertedNode,height:7,width:3})
    ],
    xAxisTitle:"",

};
//actually making the figure
const figTree = new FigTree(document.getElementById('figtree'),
    // explodedLayout,
    rectangularLayout,
    { top: 10, bottom: 60, left: 10, right: 50},
    figTreeSettings);
//initial state is set as the effective number of tips ie the number of location changes * the relative number of tips each change represents in spacing.
const effectiveTips = effectiveTipsReducerFactory(([...tipsPerLocation.entries()].length-1)*interGroupGap+((circulations-1)*intraGroupGap));


// Get the initial size of the figure and set up the figtree figure.
const store = createStore(
    combineReducers({locations,effectiveTips,selectedBranches,layout,expandTransmissions,expandAllLocations,highlightedNodes,selectedNodes,hoveredNodes,toolTipText}),
    applyMiddleware(logger,layoutTrigger(figTree)));

figTree.updateSettings({styles:treeStyles(store),
    // height:store.getState().effectiveTips*pixelPerTip
})


const initialSize = store.getState().effectiveTips*pixelPerTip;
setFigureHeight(initialSize);

// monkey patching
explodedLayout.layout = (function() {
    const  initialLayout = explodedLayout.layout;
    return function() {
        initialLayout.call(this);
      [...explodedLayout.tree.annotations.location.values].filter(l=>store.getState().locations.indexOf(l)===-1).forEach(l=>collapseVerticeInLocation(l));
      [...explodedLayout.tree.annotations.location.values].filter(l=>store.getState().locations.indexOf(l)===-1).forEach(l=>expandToCiculations(l));

        explodedLayout.currentY = d3.max(explodedLayout._vertices,v=>v.y);
        explodedLayout._verticalRange = [0, d3.max(explodedLayout._vertices,v=>v.y)];
    };
})();


figTree.draw()
    .hilightExternalNodes()
    .hilightInternalNodes()
    .onHoverNode(nodeHoverActions)
    .onClickInternalNode(selectImportExport(store))
    .onClickExternalNode(selectNodeOnClick(store))
    .onHoverBranch(hoverBranchAction(figTree)(store))
    .onClickBranch(selectCirculation(figTree)(store))
    .addAnnotation(dateBackground)
    .addAnnotation(updateRectangles(casesByLocation,store));


/**
 * The options box.
 *
 */
// The switch to determine the layout
/*document.getElementById("layout-switch").onclick = function(){
    //update layout state and button label
    store.dispatch({type:C.TOGGLE_LAYOUT});
    if(store.getState().layout==="EXPLODED_LAYOUT"){
        setExplodedLayout()
    }else{
        // The expand button toggles transmission vs. rectangular layout
        if(store.getState().expandTransmissions){
            setTransmissionLayout()
        }else{
            setRectangularLayout();
        }
    }
    expandButton.innerText = getButtonText(store);
};*/

/* The expand button that either expands the locations or
the transmission events depending on the state of the layout switch
 */

/*
const expandButton = document.getElementById("expand-button");
expandButton.onclick = function(){
    //update layout state and button label

    if(store.getState().layout==="EXPLODED_LAYOUT"){
        store.dispatch({type:C.TOGGLE_EXPANSION});
        if(store.getState().expandAllLocations){
            // expanding all
            store.dispatch({type:C.ADD_EXPANDED_LOCATIONS,
                locations:[...Ebola_tree.annotations.location.values],
            effectiveTips:[...tipsPerLocation.values()]
            });
            const newSize = store.getState().effectiveTips*pixelPerTip;
            setFigureHeight(newSize,()=>figTree.update());

            // setting text to collapse
            expandButton.innerText = getButtonText(store);
        }else{
            store.dispatch({type:C.CLEAR_LOCATIONS});
            const newSize = store.getState().effectiveTips*pixelPerTip;

            setFigureHeight(newSize,()=>figTree.update());

            expandButton.innerText = getButtonText(store);
        }
    }  else{
        store.dispatch({type:C.TOGGLE_TRANSMISSION});
        if(store.getState().expandTransmissions){
            setTransmissionLayout();
            expandButton.innerText = getButtonText(store);
        }else{
            setRectangularLayout();
            expandButton.innerText = getButtonText(store);
        }
    }

};

autocomplete(figTree)(store)(document.getElementById("tip-search"),Ebola_tree.externalNodes.map(n=>n.name).filter(n=>n!==null));

*/

d3.select('body')
    .on("keydown",()=> {
        if (d3.event.keyCode === 18) {
            const node = store.getState().hoveredNodes;
            compose(unHoverNodes(figTree), getNodesInCirculation(figTree))(node);
            hoverNodes(figTree)([node]);
            figTree.update();

            const annotations  = node.annotations;
            const locationProbs = annotations["location_set.prob"]
                .map((prob,index)=>({location:annotations.location_set[index],prob:prob}));
            const locationProbText = locationProbs.sort((a,b)=>b.prob-a.prob).map(d => {
                if (d.prob > 0.01) {
                    return `${d.location}:${Math.round(d.prob * 100) / 100}<br>`
                }
            }).join("");
            updateToolTip(`<strong>Possible Locations</strong><br>${locationProbText}`);

        }
    });


d3.select("body")
    .on("keyup",()=>{
        if(d3.event.keyCode===18){
            if(store.getState().hoveredNodes.id){
                compose(hoverNodes(figTree), getNodesInCirculation(figTree))(store.getState().hoveredNodes);
                figTree.update();
                updateToolTip(store.getState().toolTipText)
            }


        }
    });

// window.addEventListener('resize', figTree.update);
/**
 * A helper function that handels the logic used to set the text in the expand button.
 * @param store - redux store
 * @return {string} - text to be displayed in the expand button
 */
function getButtonText(store){
    const state = store.getState();
    if(state.layout==="EXPLODED_LAYOUT"){
        if(state.expandAllLocations){
            return "Collapse all locations"
        }else{
            return "Expand all locations"
        }
    }else{
        if(state.expandTransmissions){
            return "Collapse inferred transmissions"
        }else{
            return "Expand inferred transmissions"
        }
    }
}

/**
 * Helper function that sets the figtree layout to exploded layout
 */
function setExplodedLayout(){
    const newSize = store.getState().effectiveTips*pixelPerTip;
    // figTree.settings.height = newSize;
    setFigureHeight(newSize,()=> figTree.treeLayout = explodedLayout)

}

/**
 * Helper function that sets the figtree layout to transmission layout
 */
function setTransmissionLayout(){
    const transmissionSize = initialSize+figTree.layout.tree.nodes.filter(n=>n.annotations.insertedNode).length*2*intraGroupGap*pixelPerTip;
    setFigureHeight(transmissionSize,()=> figTree.treeLayout = transmissionLayout)

}

/**
 * Helper function that sets the figtree layout to rectangular layout
 */
function setRectangularLayout() {
    setFigureHeight(initialSize, () => figTree.treeLayout = rectangularLayout)
}

/**
 * This function wraps collapseVertices. It collapses all the nodes in a location to the same y position.
 * @param location
 */
function collapseVerticeInLocation(location){
    //get the max and min y positions for the group.
    // set the max as the y for all the vertexes
    // update the vertexes that are below these.
    const vertices = figTree.layout._vertices.filter(v=>v.node.annotations["location"]===location);
    collapseVertices(vertices)
}

/**
 * This function collapses all the provided vertices into a line. The y position of each vertex is set to maximum y position
 * of the set. The y positions of the vertices below this set are then updated to account for the added space.
 * @param vertices
 */
function collapseVertices(vertices){
    const [bottom,top] = d3.extent(vertices,v=>v.y);
    vertices.forEach(v=>v.y = top);
    figTree.layout._vertices.filter(v=>v.y>bottom).forEach(v=>v.y-=(top-bottom));
}

/**
 * A function that expands a location to the ciruclations ordered based on date of importation
 * @param location
 */
function expandToCiculations(location){
        const vertices = figTree.layout._vertices.filter(v=>v.node.annotations["location"]===location);
        const importations = vertices.filter(v=>v.node===figTree.layout.tree.rootNode||v.node.parent.annotations.location !==v.node.annotations.location)
            .sort((a,b)=>a.x-b.x);

        for(const importation of importations){
            const circulationVertices = getNodesInCirculation(figTree)(importation.node).map(n=>figTree.layout._nodeMap.get(n));
            figTree.layout._vertices.filter(v=>v.y>=importation.y && !circulationVertices.includes(v))
                .forEach(v=>v.y+=2);
        }
}

/**
 * A function that handles adding and removing locations to the expanded locations array in state. This function is used
 * by the background rectangles annotation. It is defined here and exported since it relies on many variables define
 * in this file. I would prefer it to be in interactions.js but for now here it is.
 * @param location
 */
export function handelLocationClick(location){

        if(event.ctrlKey || event.metaKey) {
            if(store.getState().locations.includes(location)){
                store.dispatch( collapseLocation(location,tipsPerLocation.get(location)));
            }else{
                store.dispatch(addLocationToExpanded(location,tipsPerLocation.get(location)));
            }
        }else{
            store.dispatch(resetBranchSelections());
            store.dispatch(clearNodes());
            if(store.getState().locations.includes(location)){
                store.dispatch(collapseAllLocations());
                //if we collapse all then we toggle the bottom and set the state to match
                if(store.getState().expandAllLocations){
                    store.dispatch({type:C.TOGGLE_EXPANSION});
                    expandButton.innerText = getButtonText(store)
                }
            }else{
                store.dispatch(expandJustThisLocation(location,tipsPerLocation.get(location)));
            }
        }


    const newSize = store.getState().effectiveTips*pixelPerTip;
    const self = this;
    setFigureHeight(newSize,()=>self.update());

}

/**
 * A function that sets the height of the figtree svg. At the same time is calls a callback. The most obvious callback
 * is one that triggers the figure to update the positions of it's edges and vertices.
 * It updates the height in the figtree.settings as well so that when the callback fires the final height is known.
 * This sets the layout to unknown to ensure that the update triggers a layout recalculation if needed.
 * @param height
 * @param callback
 */
function setFigureHeight(height,callback=()=>{}){
    // figTree.settings.height = height;
    figTree.layout.layoutKnown=false;
    d3.select(document.getElementById('figtree'))
        .transition()
        .duration(figTree.settings.transitionDuration)
        .ease(figTree.settings.transitionEase)
        // .attr("height",height)
        .on("start",callback);
}

function switchLayout(){
    //update layout state and button label
    store.dispatch({type:C.TOGGLE_LAYOUT});
    if(store.getState().layout==="EXPLODED_LAYOUT"){
        setExplodedLayout()
    }else{
        // The expand button toggles transmission vs. rectangular layout
        if(store.getState().expandTransmissions){
            setTransmissionLayout()
        }else{
            setRectangularLayout();
        }
    }
    // expandButton.innerText = getButtonText(store);
}

window._transitions = [
    {
        transitionForward: switchLayout,
        transitionBackward: switchLayout
    }]
