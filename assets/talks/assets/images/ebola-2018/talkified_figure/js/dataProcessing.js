import {Tree} from "./figtree.esm.3c03.js";
import {dateToDecimal} from "./dates.js"

/**
 * A function that composes functions. The right most function is called on the input first.
 * @param fns
 * @return {function(*=): *}
 */
export const compose = (...fns) => input => fns.reduceRight((mem, fn) => fn(mem), input);
// case count processing
/**
 * A helper function that parses the incoming csv. It returns an array for each date in the csv with objects with each
 * object in the array representing the number of cases reported on that date in the location.
 * @param data
 * @return Array[{date:,location:,cases}]
 */
function spread(data){
   return data.map(d=>{
        const longData = [];
        for(const column of data.columns.filter(c=>c!=="report_date")){
            longData.push({
                date:dateParse(d.report_date),
                location:column,
                cases:d[column].length>0?parseInt(d[column]):0
            })
        }
        return longData;
    })
}

/**
 * A function to parse data taken from a MOH csv
 * @param data
 */
function parseMOH(data){
return data.map(d=>{
   return {
        date:d3.timeParse('%Y-%m-%d')(d.report_date),
        location:d.health_zone,
        cases:parseInt(d.total_cases)
    }
})
}
function print(data){
    console.log(data);
    return data;
}
/**
 * A function that takes in a date,location,cases arrary and adds an entry for each week for each location. This fills
 * out the plot.
 * @param data
 */
function fillOut(data){
    const dateRange = d3.extent(data,d=>d.date);
    const visualizedDateRange = [d3.timeWeek.floor(dateRange[0]),d3.timeWeek.ceil(dateRange[1])]
    const dates = d3.timeWeek.range(...visualizedDateRange,1);
    const locations = data.reduce((acc,curr)=>{
        if(!acc.includes(curr.location)){
            return acc.concat(curr.location)
        }else{
            return acc
        }
    },[]);
    // An array of arrays
    const filler = concatArrays(locations.map(l=>{
        return dates.map(d=>{
            return {
                date:d,
                location:l,
                cases:0,
                added:true,
            }
        })
    }));
    return data.concat(filler);

}

/**
 * A function that flattens a nested array of arrays
 * @param data - an array of arrays
 * @return {*} - flattened array
 */
function concatArrays(data){
    return data.reduce((acc,curr)=>[...acc,...curr],[]);
}

/**
 * A function which groups daily case entries by location and week.
 * @param data -  an array where each entry in {location:String,date:Date,cases:int}
 * @return [] - An array of objects. One for each location of the form
 key: "location"
 values: Array(51)
    0:
    key: DATE - SUNDAY OF The grouping week
    values: Array(1) - input data
        0: {date: Fri Aug 03 2018 00:00:00 GMT+0100 (British Summer Time), location: "Alimbongo", cases: 0}
 */
function groupByLocationAndWeek(data){
    return d3.nest()
        .key(d=>  d.location)
        .key(d=>d3.timeWeek(d.date))
        .entries(data);

}

/**
 * A function that processes grouped data and returns an array of one object per location. Each object is in the form
 * {location:STRING,caseData:[{x0:Date,x1:Date,cases:int}]}
 * At this point the cases represents the cumulative number of cases in that location since the beginning of the outbreak.
 * @param data - grouped data from groupByLocationAndWeek
 * @return [*]-[{location:STRING,caseData:[{x0:Date,x1:Date,cases:int}]]
 */
function squishToOneEntryPerWeek(data){
    return data.map(d=>{
        const caseData=[];
        for(const week of d.values){
            const firstWeek = d3.timeWeek(week.values[0].date);
            const endWeek = d3.timeWeek.offset(firstWeek,1);

            caseData.push({x0:dateToDecimal(firstWeek),
                x1:dateToDecimal(endWeek),
                cases:d3.max(week.values,w=>w.cases)
            })
        }

        return {location:d.key,
            caseData:caseData}
    });
}

/**
 * A function that converts the cumulative case counts in each location to the number of new locations observed between
 * the dates x0 and x1
 * @param data
 * @return {*}
 */
function convertToNewCases(data){
    return data.map(d=>{

        const sortedCaseData  = d.caseData.sort((a,b)=>a.x0-b.x0);
        const correctedData =[sortedCaseData[0]];

        for(let i=1;i<sortedCaseData.length;i++){
            const newCases = sortedCaseData[i].cases-sortedCaseData[i-1].cases;
            const correctedCases = newCases<0?0:newCases;
            correctedData.push({...sortedCaseData[i],...{cases: correctedCases}})
        }

        return{...d,...{caseData:correctedData}}
    })
}

/**
 * A small function to parse the dates present in the csv.
 */
const dateParse=d3.timeParse("%d/%m/%Y");

/**
 * A function to normalize the names of places so they match the data in the tree
 * @param data
 */
function normalizeNames(data){
    console.group("Normalizing csv names");
    console.log("changing Mangurujipa to Manguredjipa")
    data.filter(d=>d.location==="Mangurujipa").forEach(d=>d.location="Manguredjipa");

    console.groupEnd()
    return data;

}

/**
 * A composite function to processes the cases count csv for plotting a bar plot of the number of new cases each week by
 * location
 * @type {function(*=): *}
 */
export const processCases = compose(convertToNewCases,squishToOneEntryPerWeek,groupByLocationAndWeek,concatArrays,spread,d3.csvParse);


export const processCasesMOH = compose(normalizeNames,convertToNewCases,squishToOneEntryPerWeek,groupByLocationAndWeek,fillOut,parseMOH,d3.csvParse);

/**
 * A function that takes an annotation key and returns a function that inserts two nodes at the midpoint of branches a long which
 * the annotation value changes. One inserted node gets the parent's annotation value the other the child's.
 * @param annotationKey
 * @return {function(tree): *}
 */
const splitByAnnotation=(annotationKey)=>(tree)=>{

    const locationChanges = tree.nodeList.filter(n=>n.parent && n.parent.annotations[annotationKey]!==n.annotations[annotationKey]);
    locationChanges.forEach(node =>{
        const originalLocation = node.parent.annotations[annotationKey];
        const finalLocation = node.annotations[annotationKey];
        const newNodeInLocation = tree.splitBranch(node);
        newNodeInLocation.annotations = {...node.annotations,...newNodeInLocation.annotations}//[annotationKey] = finalLocation;
        const newNodeFromLocation = tree.splitBranch(newNodeInLocation,1.0);
        newNodeFromLocation.annotations={...newNodeFromLocation.parent.annotations,...newNodeFromLocation.annotations}
    });
    return tree;
};

/**
 * A wrapper function that parses nexus text and returns the first tree in the file.
 * @param treeText
 * @return {*}
 */
function readMCCTree(treeText){
    return Tree.parseNexus(treeText)[0];

}

/**
 * A curried function that ultimately adds child nodes to the root of a tree based on which locations in the caseData
 * do not have any sequenced samples in the tree. This allows these location to be included in the figure.
 * @param mostRecentSampleTime
 * @return {function(*=): function(*=): *}
 */
const addUnsequencedLocationsFactory = mostRecentSampleTime => processedCaseData => tree => {


    const mostRecentCaseDataDate = d3.max(processedCaseData, location => d3.max(location.caseData, timepoint => timepoint.x1));

    const noSequences = processedCaseData.filter(l => !tree.annotations.location.values.has(l.location)).filter(location => d3.max(location.caseData, timepoint => timepoint.cases) > 0);
    const madeUpLength = d3.max([...tree.rootToTipLengths()]) + (mostRecentCaseDataDate - mostRecentSampleTime);


    for (const location of noSequences) {
        tree.root.addChild({
            annotations: {fakeData: true, location: location.location},
            tree: tree,
            length: madeUpLength
        })
    }
    tree.origin = mostRecentCaseDataDate;  // to match the case data
    return tree;
};

/**
 * A helper function that sorts the tree by increasing node density.
 * @param tree
 * @return tree
 */
function sortTree(tree){
     tree.orderByNodeDensity(true);
    return tree;
}

/**
 * A helper function that returns a composite function ready to process nexus text into the fully processed tree required
 * for the visualization.
 * @param mostRecentSampleTime
 * @return {function(*=): *}
 */
function filterLocation(tree){
    tree.annotations.location.values.forEach(l=>{
       const num =  tree.nodes.reduce()
    })
}
export function processTreeFactory(mostRecentSampleTime){
    // const addUnsequencedLocations = addUnsequencedLocationsFactory(mostRecentSampleTime)(processedCaseData);
    // return  compose(sortTree,addUnsequencedLocations,splitByAnnotation("location"),readMCCTree)
    return  compose(sortTree,splitByAnnotation("location"),readMCCTree)
}