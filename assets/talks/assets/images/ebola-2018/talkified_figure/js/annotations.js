import {ExplodedLayout} from "./figtree.esm.3c03.js";
import {baseColorScale, adjustColor, colorAdjustments} from "./styles.js";
import { customDateFormat,yearFormat} from "./dates.js";
import {handelLocationClick} from "./index.js"
import {fireToolTip, hideToolTip} from "./interactions.js";

/**
 * A function that returns an annotation function for adding location rectangles and case histograms to the exploded
 * layout. Annotating functions are called with 'this' in figtree.js and has access to the figtree instance.
 * @param data
 * @param store
 * @return {Function}
 */
export function updateRectangles(data,store){
    return function () {

        const annotationLayer = this.svgSelection.select(".annotation-layer");

       /* If this is an exploded tree then we need to get the backgrounds otherwise we return an empty array and d3
        removes them from the svg.*/
        const locations = this.layout instanceof ExplodedLayout ?
            // for each location in the tree get the min and max y positions of the vertices
            [...this.layout.tree.annotations.location.values].map(l => {
                const vertices = this.layout.tree.nodes.filter(n => n.annotations.location === l).map(n => this.layout.nodeMap.get(n));

                if (vertices.length > 0) {
                    return {
                        location: l,
                        yMin: d3.min(vertices, v => v.y),
                        yMax: d3.max(vertices, v => v.y),
                    }
                }

            }).sort((a, b) => a.yMin - b.yMin) :
            [];
        console.log(locations)
        // This adds a little buffer between the location so the background boxes include all the vertices.
        for (let i = 0; i < locations.length; i++) {
            if (i > 0) {
                locations[i]["min"] = (locations[i - 1].yMax + locations[i].yMin) / 2
            } else {
                locations[i]["min"] = locations[i].yMin - 5
            }
            if (i < locations.length - 1) {
                locations[i]["max"] = (locations[i + 1].yMin + locations[i].yMax) / 2
            } else {
                locations[i]["max"] = locations[i].yMax + 5
            }
        }

        //Data join for the background
        const locationRectangles = annotationLayer.selectAll("g.location-annotation")
            .data(locations, (l) => `l_${l.location}`);

        const newLocationRectangles = locationRectangles
            .enter()
            .append("g")
            .attr("class", "location-annotation")
            .attr("transform", (e) => {
                return `translate(${this.margins.left}, ${this.scales.y(e.min)})`;
            });

        newLocationRectangles
            .append("rect")
            .transition()
            .duration(this.settings.transitionDuration)
            .ease(this.settings.transitionEase)
            .attr("x", 0)
            .attr("width", this.scales.x.range()[1] - this.scales.x.range()[0])
            .attr("y", () => 0)//this.scales.y(d.yMin-interGroupGap/2))
            .attr("height", d => this.scales.y(d.max) - this.scales.y(d.min))
            .attr("fill", d => adjustColor(baseColorScale.get(d.location),colorAdjustments.locationBackground))
            .attr("opacity", 0.1)
            .attr("stroke", d => adjustColor(baseColorScale.get(d.location),colorAdjustments.locationBackgroundStroke))
            .attr("stroke-width", 1);

        //adding the case data boxes
        const layoutToFigScale = d3.scaleLinear().domain(this.layout.horizontalScale.domain()).range([this.margins.left, this.scales.x.range()[1] - this.margins.left]);
        const that = this;
        const closedBoxHeight = 7;
        const satScale = d3.scaleLinear().domain([0, d3.max(data, d => d3.max(d.caseData, c => c.cases))]).range(colorAdjustments.histogramSaturationRange);
        const alphaScale = d3.scaleLinear().domain([0, d3.max(data, d => d3.max(d.caseData, c => c.cases))]).range(colorAdjustments.histogramAlphaRange);
        const caseScale = d3.scaleLinear().domain([0, d3.max(data, d => d3.max(d.caseData, c => c.cases))]).range([0,350] ); //hardcoded in max height

        newLocationRectangles.each(function (groupData) {
            const caseData = data.find(d => d.location === groupData.location);
            const expanded = store.getState().locations.includes(groupData.location);
                const caseDataBoxes = d3.select(this).selectAll(".cases-rect")
                    .data(caseData.caseData, (d,) => d.x0);


                const newCaseData = caseDataBoxes
                    .enter()
                    .append("rect")
                    .attr("class", "cases-rect")
                    .attr("x", d => layoutToFigScale(d.x0))
                    .attr("width", d => layoutToFigScale(d.x1) - layoutToFigScale(d.x0))
                    .attr("y", (d) => expanded ? that.scales.y(groupData.max) - that.scales.y(groupData.min) - caseScale(d.cases) : that.scales.y(groupData.max) - that.scales.y(groupData.min) - closedBoxHeight)
                    .attr("height", d => expanded ? caseScale(d.cases) : closedBoxHeight)
                    .attr("fill", d => d.cases > 0 ? adjustColor(baseColorScale.get(groupData.location),{ds:satScale(d.cases)}) : "none")
                    .attr("stroke", () => adjustColor( baseColorScale.get(groupData.location),colorAdjustments.histogramStroke))
                    .attr("opacity", d => alphaScale(d.cases))
                    .attr("pointer-events","visible")
                    .on("mouseover", d => {
                        fireToolTip(`${d.cases} Reported cases <br/> ${yearFormat(d.x0)} - ${yearFormat(d.x1)}`);
                    })
                    .on("mouseout", () => {
                     hideToolTip();
                    })


        });

        newLocationRectangles.select("rect").on("click", d => {
            handelLocationClick.call(this,d.location)
        });

        newLocationRectangles
            .append("text")
            .attr("class", "location-label")
            .attr("text-anchor", "start")
            .attr("alignment-baseline", "hanging")
            .attr("x", 0)
            .attr("y", 0)
            .transition()
            .duration(this.settings.transitionDuration)
            .ease(this.settings.transitionEase)
            .text((d) => d !== undefined ? d.location : "");

        locationRectangles
            .transition()
            .duration(this.settings.transitionDuration)
            .ease(this.settings.transitionEase)
            .attr("transform", (e) => {
                return `translate(${this.margins.left}, ${this.scales.y(e.min)})`;
            })

            .select("rect")
            .attr("x", 0)
            .attr("width", this.scales.x.range()[1] - this.scales.x.range()[0])
            .attr("y", 0)//this.scales.y(d.yMin-interGroupGap/2))
            .attr("height", d => this.scales.y(d.max) - this.scales.y(d.min))
            .attr("fill", d => adjustColor(baseColorScale.get(d.location),colorAdjustments.locationBackground))
            .attr("opacity", 0.1)
            .attr("stroke", d => adjustColor(baseColorScale.get(d.location),colorAdjustments.locationBackgroundStroke))
            .attr("stroke-width", 1)
            .select("text")
            .attr("x", 0)
            .attr("y", 0);

        locationRectangles.select("rect").on("click", d => handelLocationClick.call(this, d.location));

        locationRectangles.each(function (groupData) {

            const expanded = store.getState().locations.includes(groupData.location);
            const caseDataBoxes = d3.select(this).selectAll(".cases-rect");
            caseDataBoxes
                .transition()
                .duration(that.settings.transitionDuration)
                .ease(that.settings.transitionEase)
                .attr("y", (d) => expanded ? that.scales.y(groupData.max) - that.scales.y(groupData.min) - caseScale(d.cases) : that.scales.y(groupData.max) - that.scales.y(groupData.min) - closedBoxHeight)
                .attr("height", d => expanded ? caseScale(d.cases) : closedBoxHeight)

        });

        locationRectangles.exit().remove();

    }
}


export function  dateBackground() {

    const annotationLayer = this.svgSelection.select(".annotation-layer");
    const ticks =  d3.scaleLinear().domain(this.layout.horizontalScale.domain()).range(this.scales.x.range())
        .ticks(this.settings.ticks);
    let boxes = [];
    for(let i=0;i<ticks.length-1;i++){
        boxes.push({x0:ticks[i],x1:ticks[i+1]})
    }
    if(this.layout instanceof ExplodedLayout){
        boxes = [];
    }
    const backgroundBoxes = annotationLayer.selectAll("g.time-annotation")
        .data(boxes, (b) => `b_${b.x1}`);

    const newBoxes=backgroundBoxes
        .enter()
        .append("g")
        .attr("class","time-annotation")
        .attr("transform", (b) => {
            return `translate(${this.scales.x(this.layout.horizontalScale(b.x0))}, ${this.scales.y(-5)})`;
        });

    newBoxes
        .append("rect")
        .transition()
        .duration(this.settings.transitionDuration)
        .ease(this.settings.transitionEase)
        .attr("width",d=>this.scales.x(this.layout.horizontalScale(d.x1))-this.scales.x(this.layout.horizontalScale(d.x0)))
        .attr("height",this.scales.y(this.layout.verticalRange[1]))
        .attr("fill",(d,i)=>i%2===0? "grey":"none")
        .attr("opacity",0.1)
        .attr("stroke-width", 1);

    backgroundBoxes
        .transition()
        .duration(this.settings.transitionDuration)
        .ease(this.settings.transitionEase)
        .attr("transform", (b) => {
            return `translate(${this.scales.x(this.layout.horizontalScale(b.x0))}, ${this.scales.y(-5)})`;
        });
    backgroundBoxes.select("rect")
        .transition()
        .duration(this.settings.transitionDuration)
        .ease(this.settings.transitionEase)
        .attr("width",d=>this.scales.x(this.layout.horizontalScale(d.x1))-this.scales.x(this.layout.horizontalScale(d.x0)))
        .attr("height",this.scales.y(this.layout.verticalRange[1]))
        .attr("fill",(d,i)=>i%2===0? "grey":"none")
        .attr("opacity",0.1)
        .attr("stroke-width", 1);

    backgroundBoxes.exit().remove()

}




