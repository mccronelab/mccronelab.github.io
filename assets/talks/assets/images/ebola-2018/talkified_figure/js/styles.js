import {ExplodedLayout} from "./figtree.esm.3c03.js";
// import {hsl} from "d3v4";

// These are the color adjustments that determine styles in the figure.
export const colorAdjustments = {
    node:{ds:-0.05},
    branch:(prob)=>({ds:-(1-prob),dl:-(1-prob)}),
    nodeBackground:{ds:-0.1},
    locationBackground:{ds:-0.25},
    locationBackgroundStroke:{ds:0},
    histogramStroke:{ds:-0.4},
    histogramSaturationRange:[-0.3, -0.1],
    histogramAlphaRange:[0.3, 0.8]
};

/*export const baseColorScale = new Map([
    ["Alimbongo","#db5f57"],
    ["Ariwara","#db576f"],
    ["Beni", "#db7e57"],
    ["Biena", "#db9e57"],
    ["Bunia", "#dbbe57"],
    ["Butembo", "#d9db57"],
    ["Kalunguta", "#b9db57"],
    ["Katwa", "#99db57"],
    ["Komanda", "#59db57"],
    ["Kyondo", "#57db74"],
    ["Lubero", "#57db94"],
    ["Mabalako", "#57dbb4"],
    ["Mambasa", "#57dbd3"],
    ["Mandima", "#57c3db"],
    ["Masereka", "#5784db"],
    ["Musienene", "#5764db"],
    ["Mutwanga", "#6957db"],
    ["Nyankunde", "#8957db"],
    ["Oicha", "#a957db"],
    ["Rwampara", "#c957db"],
    ["Rwampara (Bunia)", "#db57ce"],
    ["Tchomia", "#db57ae"],
    ["Vuhovi", "#db578e"],
    ["Manguredjipa","#db5f57"],
    ["Kayna","#db7e57"],
    ["Goma","#db9e57"],
    ["Mwenga","#dbbe57"],
    ["Nyiragongo","#d9db57"],
    ["Pinga","#b9db57"],
    ["Lolwa","#59db57"],
    ["Kayina","#57db74"],
    ["greyedOut","#DCDCDC"],
    ["selected","#CD1C1C"]
]);*/

export const baseColorScale = new Map([
    ["Beni", "#4e79a7"],
    ["Butembo", "#f28e2c"],
    ["Kalunguta", "#e15759"],
    ["Katwa", "#76b7b2"],
    ["Mabalako", "#59a14f"],
    ["Mandima", "#edc949"],
    ["Musienene", "#af7aa1"],
    ["Oicha", "#ff9da7"],
    ["Vuhovi", "#9c755f"],
    ["selected","#CD1C1C"]
]);

/**
 * Function that adjusts a source colour by setting hue, saturation
 * and brightness or adds a delta (dh, ds, db) or multiplies by a factor
 * (fh, fs, fb). Note that these parameters can all be used in any combination.
 *
 * @param sourceColor
 * @param h
 * @param s
 * @param l
 * @param dh
 * @param ds
 * @param dl
 * @param fh
 * @param fs
 * @param fl
 * @returns {string}
 */
export function adjustColor(sourceColor, {h, s, l, dh, ds, dl, fh, fs, fl}) {
    const color = d3.hsl(sourceColor);
    if (h) color.h = h;
    if (s) color.s = s;
    if (l) color.l = l;
    if (dh) color.h += dh;
    if (ds) color.s += ds;
    if (dl) color.b += dl;
    if (fh) color.h *= fh;
    if (fs) color.s *= fs;
    if (fl) color.b *= fl;

    return "" + color;
}

/**
 * An function that creates the styles used to style tree objects. This is a function since the redux store is used to
 * keep track of selected branches ect.
 * @param store
 * @return {{nodeBackgrounds: {fill: nodeBackgrounds.fill, "pointer-events": (function(*): string)}, nodes: {fill: nodes.fill}, branches: {"stroke-width": (function(*=): number), fill: (function(*): string), stroke: branches.stroke}}}
 */
export const treeStyles  = (store)=> {
    return {
        'nodes': {
            "fill": d => {
                if (d.children && d.children.length > 1) {
                    return 'none';
                }
                if (store.getState().highlightedNodes.length === 0) {
                   if (d.annotations.location !== d.parent.annotations.location) {
                        return adjustColor(baseColorScale.get(d.parent.annotations.location), colorAdjustments.node);
                    } else if (d.children) {
                        if (d.children.length === 1) {
                            if (d.children[0].annotations.location !== d.annotations.location) {
                                return adjustColor(baseColorScale.get(d.children[0].annotations.location), colorAdjustments.node);
                            }
                        }
                    } else {
                        return adjustColor(baseColorScale.get(d.annotations.location), colorAdjustments.node);
                    }
                }else{
                    if(d.name&& store.getState().highlightedNodes.includes(d.name)){
                        return adjustColor(baseColorScale.get(d.annotations.location), colorAdjustments.node);
                    }else{
                        return adjustColor(baseColorScale.get('greyedOut'), colorAdjustments.node);
                    }
                }
            }
        },
        "branches": {
            "fill": () => "none",
            "stroke-width": d => d.hovered ? 6 : store.getState().selectedBranches.includes(d) ? 4 : 2,
            "stroke": function (d) {
                if (store.getState().highlightedNodes.length === 0) {
                    if (d.annotations.location !== d.parent.annotations.location) {
                        if (d.hovered || !(this.layout instanceof ExplodedLayout) || store.getState().selectedBranches.includes(d)) {
                            return adjustColor(baseColorScale.get(d.parent.annotations.location), colorAdjustments.branch(d.parent.annotations.location_prob));
                        } else {
                            return 'none'
                        }
                    } else {
                        return adjustColor(baseColorScale.get(d.annotations.location), colorAdjustments.branch(d.annotations.location_prob));
                    }
                }else{
                    if(d.name&& store.getState().highlightedNodes.includes(d.name)){
                        return adjustColor(baseColorScale.get(d.annotations.location), colorAdjustments.branch(d.annotations.location_prob));
                    }else{
                        return adjustColor(baseColorScale.get('greyedOut'), colorAdjustments.branch(d.annotations.location_prob));
                    }
                }

            }
        },
        "nodeBackgrounds": {
            "fill": d => {
                if (d.children && d.children.length > 1) {
                    return 'none';
                }
                if (store.getState().highlightedNodes.length === 0) {
                    if (d.annotations.location !== d.parent.annotations.location) {
                        return adjustColor(baseColorScale.get(d.parent.annotations.location), colorAdjustments.nodeBackground);
                    } else if (d.children) {
                        if (d.children.length === 1) {
                            if (d.children[0].annotations.location !== d.annotations.location) {
                                return adjustColor(baseColorScale.get(d.children[0].annotations.location), colorAdjustments.nodeBackground);
                            }
                        }
                    } else {
                        if (store.getState().selectedNodes.includes(d)) {
                            return adjustColor(baseColorScale.get("selected"), colorAdjustments.nodeBackground);
                        } else {
                            return adjustColor(baseColorScale.get(d.annotations.location), colorAdjustments.nodeBackground);
                        }
                    }
                }else{
                    if(d.name&& store.getState().highlightedNodes.includes(d.name)){
                        if (store.getState().selectedNodes.includes(d)) {
                            return adjustColor(baseColorScale.get("selected"), colorAdjustments.nodeBackground);
                        } else {
                            return adjustColor(baseColorScale.get(d.annotations.location), colorAdjustments.nodeBackground);
                        }
                    }else{
                        return adjustColor(baseColorScale.get('greyedOut'), colorAdjustments.nodeBackground);
                    }
                }
            }
        }
    };
};
