import {compose} from "./dataProcessing.js";
import {customDateFormat,yearFormat} from "./dates.js";
import {
    addBranchesToSelection, setHighlightedNodes,
    removeBranchesFromSelection,
    resetBranchSelections,
    selectBranches, deSelectNode, addSelectedNode, clearNodes, selectNode, setHoverNodes, setToolTipText
} from "./actions.js"

/**
 * A curried function that takes in a figtree object then a node. It returns all the nodes that can be reached from this
 * one without having to change locations.
 * @param figtreeObject
 * @return {function(*): IterableIterator<*>[]}
 */
export const  getNodesInCirculation=(figtreeObject)=>(selectedNode)=>{
    let node = selectedNode;
    if(selectedNode !==figtreeObject.layout.tree.rootNode){

        let parent = selectedNode.parent;
        let sameLocation = node.annotations.location === parent.annotations.location;
        while(sameLocation  && node.parent.parent ){
            node = parent;
            parent = node.parent;
            sameLocation = node.annotations.location === parent.annotations.location;
        }
        // If we stopped above because the parent was the root and the location is the same. Then we really want to go back
        // to the root a bit hacky
        if(sameLocation){
            node=parent;
        }
    }
    return [...figtreeObject.layout.tree.postorder(node, n => n.annotations.location === node.annotations.location)];
};
/**
 * A curried function that takes a figtreeObject then nodes. It flips the hovered flag on the node and updates the
 * baubles border radius.
 * @param figtreeObject
 * @return {function(*): *}
 */
export const hoverNodes = figtreeObject=>(nodes)=>{
    const nodeSelections= d3.select(figtreeObject.svg).selectAll(".node-shape");
    nodes.forEach(node => {
        node.hovered = true;
        const svgNode = nodeSelections.filter(d=>d.node===node);
        figtreeObject.settings.baubles.forEach(bauble=>{
            bauble.updateShapes(svgNode,figtreeObject.settings.hoverBorder)
        })
    });
    return nodes;
};

export const unHoverNodes = figtreeObject=>(nodes)=>{
    const nodeSelections= d3.select(figtreeObject.svg).selectAll(".node-shape");
    nodes.forEach(node => {
        node.hovered = false;
        const svgNode = nodeSelections.filter(d=>d.node===node);
        figtreeObject.settings.baubles.forEach(bauble=>{
            bauble.updateShapes(svgNode,0)
        })
    });
    return nodes;
};

/**
 * A helper function to display the tooltip with provided text
 * @param text
 */
export function fireToolTip(text){
    let tooltip = document.getElementById("tooltip");

    // go back to introduction. then back 1 and forward at this location;

    tooltip.innerHTML = text;
    tooltip.style.display = "block";
    tooltip.style.left =event.pageX + 10 + "px";
    tooltip.style.top = event.pageY + 10 + "px";
}

/**
 * A helper funciton for updating the tooltip's text;
 * @param text
 */
export function updateToolTip(text){
    let tooltip = document.getElementById("tooltip");
    tooltip.innerHTML = text;
}
/**
 * A function to hide the tool tip.
 */
export function hideToolTip(){
    const tooltip = document.getElementById("tooltip");
    tooltip.style.display = "none";
}

/**
 * An object that determines how to handel mouseOver and mouseOut events for nodes
 * @type {{exit: nodeHoverActions.exit, enter: nodeHoverActions.enter}}
 */
export const nodeHoverActions = {
    enter: v => {
        const node = v.node;
        if (node.annotations.location !== node.parent.annotations.location) {
            node.hovered = true;
            fireToolTip(` Inferred importation from ${node.parent.annotations.location}`)
        } else if (node.children && node.children.length === 1 && node.annotations.location !== node.children[0].annotations.location) {
            node.children[0].hovered = true;
            fireToolTip(`Inferred exportation to ${node.children[0].annotations.location}`)
        } else if (!node.children) {
            fireToolTip(`${node.name}`)
         }// else{
        // }
    }, exit: v => {
        const node = v.node;
        if (node.annotations.location !== node.parent.annotations.location) {
            node.hovered = !node.hovered;
        } else if (node.children && node.children.length === 1 && node.annotations.location !== node.children[0].annotations.location) {
            node.children[0].hovered = !node.children[0].hovered;
        }

        hideToolTip();
    }
};
/**
 * A function that adds the target node of an import/export branch to the redux store. The function is called on both
 * import/export nodes and holds the logic for how to handel each case.
 * @param store
 * @return {*}-Function(vertex)
 */
export const  selectImportExport=store=>(vertex)=>{
    const node= vertex.node;

    if (event.ctrlKey || event.metaKey) {
        if (node.annotations.location !== node.parent.annotations.location) {
            const allReadySelected =store.getState().selectedBranches.includes(node);
            if(allReadySelected){
                store.dispatch(removeBranchesFromSelection([node]));
            }else{
                store.dispatch(addBranchesToSelection([node]));
            }
        } else if (node.children && node.children.length === 1 && node.annotations.location !== node.children[0].annotations.location) {
            const targetNode = node.children[0];
            const allReadySelected =store.getState().selectedBranches.includes(targetNode);
            if(allReadySelected){
                store.dispatch(removeBranchesFromSelection([targetNode]))
            }else{
                store.dispatch(addBranchesToSelection([targetNode]));
            }
        }
    }else {
        if (node.annotations.location !== node.parent.annotations.location) {
            const allReadySelected = store.getState().selectedBranches.includes(node);
            if (allReadySelected) {
                store.dispatch(resetBranchSelections());
            } else {
                store.dispatch(selectBranches([node]));
            }
        } else if (node.children && node.children.length === 1 && node.annotations.location !== node.children[0].annotations.location) {
            const targetNode = node.children[0];
            const allReadySelected = store.getState().selectedBranches.includes(targetNode);
            if (allReadySelected) {
                store.dispatch(resetBranchSelections());
            } else {
                store.dispatch(selectBranches([targetNode]));
            }
        }
    }
};
/**
 * a function that provides an object, which determines how to handel mouseOver and mouseOut events for branches

 * @param figTreeObject
 * @return {{exit: exit, enter: enter}}
 */
export const hoverBranchAction=figTreeObject=>store=> {
    return {
        enter: (edge,i,n) => {
            const node = edge.v1.node;
                const nodes = compose(hoverNodes(figTreeObject), getNodesInCirculation(figTreeObject))(node);
                store.dispatch(setHoverNodes(node));
                const text = `Local circulation in ${node.annotations.location} with ${nodes.filter(n => !n.children).length} samples from ${yearFormat(d3.min(nodes, n => n.height))} to ${yearFormat(d3.max(nodes, n => n.height))}`
                store.dispatch(setToolTipText(text))
                fireToolTip(text);

        },
            exit: edge => {
            const node = edge.v1.node;
                compose(unHoverNodes(figTreeObject), getNodesInCirculation(figTreeObject))(node);
                store.dispatch(setHoverNodes({}));
                hideToolTip();
    }

    }
};
/**
 * A curried function that takes a figtreeObject then a redux store. Finally it takes an edge and determines whether to select
 * or deselect the circulation as well as what to do with other selected branches in the store.
 * @param figTreeObject
 * @return {function(*): Function}
 */
export const  selectCirculation=figTreeObject=>store=>(edge)=>{
    const nodes = getNodesInCirculation(figTreeObject)(edge.v1.node);
    const selectedNodes = store.getState().selectedBranches;
    const allReadySelected = nodes.every(n => selectedNodes.includes(n));
    if (event.ctrlKey || event.metaKey) {
        if (allReadySelected) {
            store.dispatch(removeBranchesFromSelection(nodes));
        } else {
            store.dispatch(addBranchesToSelection(nodes));
        }
    } else {
        if (allReadySelected) {
            store.dispatch(removeBranchesFromSelection(nodes));
        } else {
            store.dispatch(selectBranches(nodes));
        }
    }
};

export const selectNodeOnClick =store=>(vertex)=>{
    const node = vertex.node;
    const selectedNodes = store.getState().selectedNodes;
    const allReadySelected = selectedNodes.includes(node)
    if (event.ctrlKey || event.metaKey) {
        if (allReadySelected) {
            store.dispatch(deSelectNode(node));
        } else {
            store.dispatch(addSelectedNode(node));
        }
    } else {
        if (allReadySelected) {
            store.dispatch(clearNodes());
        } else {
            store.dispatch(selectNode(node));
        }
    }
};
// https://www.w3schools.com/howto/howto_js_autocomplete.asp
export const  autocomplete=figtree=>store=>(inp, arr)=> {
    /*the autocomplete function takes two arguments,
    the text field element and an array of possible autocompleted values:*/
    var currentFocus;
    /*execute a function when someone writes in the text field:*/
    inp.addEventListener("input", function(e) {
        var a, b, i, val = this.value;
        /*close any already open lists of autocompleted values*/
        closeAllLists();
        if (!val) { return false;}
        currentFocus = -1;
        /*create a DIV element that will contain the items (values):*/
        a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        /*append the DIV element as a child of the autocomplete container:*/
        this.parentNode.appendChild(a);
        /*for each item in the array...*/
        const highlighted = [];
        for (i = 0; i < arr.length; i++) {
            /*check if the item starts with the same letters as the text field value:*/
            if (arr[i].toUpperCase().includes(val.toUpperCase())) {
                highlighted.push(arr[i]);

                const arrUpper = arr[i].toUpperCase();
                const valUpper = val.toUpperCase();
                const matchingCoordinates = [arrUpper.indexOf(valUpper),arrUpper.indexOf(valUpper)+valUpper.length];
                const matching = arr[i].substring(matchingCoordinates[0],matchingCoordinates[1]);


                /*create a DIV element for each matching element:*/
                b = document.createElement("DIV");
                /*make the matching letters bold:*/
                b.innerHTML = `${arr[i].substring(0,matchingCoordinates[0])}<strong>${matching}</strong>${arr[i].substring(matchingCoordinates[1],arr[i].length)}`;
                /*insert a input field that will hold the current array item's value:*/
                b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
                /*execute a function when someone clicks on the item value (DIV element):*/
                b.addEventListener("click", function(e) {
                    /*insert the value for the autocomplete text field:*/
                    inp.value = this.getElementsByTagName("input")[0].value;
                    /*close the list of autocompleted values,
                    (or any other open lists of autocompleted values:*/
                    closeAllLists();
                });
                a.appendChild(b);
            }
        }
        store.dispatch( setHighlightedNodes(highlighted));
        figtree.update();

    });
    /*execute a function presses a key on the keyboard:*/
    inp.addEventListener("keydown", function(e) {
        var x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        if (e.keyCode === 40) {
            /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
            currentFocus++;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode === 38) { //up
            /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
            currentFocus--;
            /*and and make the current item more visible:*/
            addActive(x);
        } else if (e.keyCode === 13) {
            /*If the ENTER key is pressed, prevent the form from being submitted,*/
            e.preventDefault();
            if (currentFocus > -1) {
                /*and simulate a click on the "active" item:*/
                if (x) x[currentFocus].click();
            }
        }
    });
    function addActive(x) {
        /*a function to classify an item as "active":*/
        if (!x) return false;
        /*start by removing the "active" class on all items:*/
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = (x.length - 1);
        /*add class "autocomplete-active":*/
        x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
        /*a function to remove the "active" class from all autocomplete items:*/
        for (var i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    function closeAllLists(elmnt) {
        /*close all autocomplete lists in the document,
        except the one passed as an argument:*/
        var x = document.getElementsByClassName("autocomplete-items");
        for (var i = 0; i < x.length; i++) {
            if (elmnt !== x[i] && elmnt !== inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
        store.dispatch( setHighlightedNodes((inp.value.length>0?[inp.value]:[])));
        figtree.update();

    }
    /*execute a function when someone clicks in the document:*/
    /* happens too often*/
    // document.addEventListener("click", function (e) {
    //     closeAllLists(e.target);
    // });
}