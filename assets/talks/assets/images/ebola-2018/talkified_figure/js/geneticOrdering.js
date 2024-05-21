const figtree = require("figtree");
//fitness function

// get location jumps from tree;

//for a given ordering for each location jump count the number locations that are crossed. scale to fitness.

const fs= require('fs');
const d3 = require('d3v4');

fs.readFile("./data/tmp_27M_low-geo-rate_ebov_drc_269_2019-07-09.MCC.tree", 'utf8',(err,data)=>{
    if(err) throw err;
    const tree = figtree.Tree.parseNexus(data)[0];
    const transitions = [...[...tree.postorder()].filter(n=>n.parent&&n.annotations.location!==n.parent.annotations.location)
        .reduce((acc,n)=>{
            const key = `${n.parent.annotations.location}-${n.annotations.location}`;
            const jump={source:n.parent.annotations.location,
                target:n.annotations.location};
            if(acc.has(key)){
                    jump.weight=acc.get(key).weight+1
            }else{
                jump.weight=1;
            }
           acc.set(key,jump);
            return acc;
        },new Map()).values()];
    const locations = [...tree.annotations.location.values];
    //generate 100 starting orders
    //

    let population = startingPopulation(locations)(transitions)(100)

    const iterations = [];
    for(let i=0;i<100;i++){
        population=nextGeneration(population);
        const topFit = mostFit(population);
        const meanFit=averageFitness(population);
        const topGenome = population.filter(i=>i.fitness===topFit)[0].genome;
        iterations.push({
            top:topFit,
            mean:meanFit,
            bestGenome:topGenome
        });
        console.group(i);
        console.log(`mean fitness ${meanFit}`);
        console.log(`top dog ${topFit}`);
        console.groupEnd()
    }
    console.log(d3.csvFormat(iterations));

    fs.writeFile("order.csv",d3.csvFormat(iterations),function (err) {
        if (err) throw err;
        console.log('Saved!');
    });

});

const  startingPopulation=(locations)=>(transitions)=>(populationSize)=>{
    const population = [];
    for(let i=0;i<populationSize;i++){
        population.push(new Individual(shuffle(locations),transitions))
    }
    return population;
};

function averageFitness(population){
    return d3.mean(population,i=>i.fitness);
}
function mostFit(population){
   return d3.max(population,i=>i.fitness)
}


function nextGeneration(population){
    const newPopulation = [];
    const mutationRate=0.1;
    const recombinationRate =0.05;
    const fitnesses = population.map(i=>i.fitness);
    for(const individual of population){
        let offSpring = chooseWeighted(population,fitnesses);
        if(Math.random()<recombinationRate){
            const offSpring2 =  chooseWeighted(population,fitnesses);
            offSpring = recombine(offSpring,offSpring2)
        }
        if(Math.random()<mutationRate){
            offSpring.mutate()
        }
        newPopulation.push(offSpring)

    }
    return newPopulation;
}
//https://stackoverflow.com/questions/43566019/how-to-choose-a-weighted-random-array-element-in-javascript
function chooseWeighted(items, chances) {
    var sum = chances.reduce((acc, el) => acc + el, 0);
    var acc = 0;
    chances = chances.map(el => (acc = el + acc));
    var rand = Math.random() * sum;
    return items[chances.filter(el => el <= rand).length];
}



class Individual {
    constructor(genome,transitions){
        this._genome= genome;
        this.transitions = transitions;
        this.maxPenalty = transitions.reduce((acc,curr)=>{

                return acc+curr.weight;
        },0)*this._genome.length/2;
    }
    get fitness(){
        let penalty = 0;
        for(const transition of this.transitions){
            penalty+=Math.abs(this._genome.indexOf(transition.source)-this._genome.indexOf(transition.target))*transition.weight
        }
        return 1-(penalty/(this.maxPenalty));
    }
    get genome(){
        return this._genome.slice();
    }
    mutate(){
        //pick two locations at random and switch
        const swaps = [Math.round(Math.random()*this._genome.length),Math.round(Math.random()*this._genome.length)].sort((a,b)=>a-b);
        if(swaps[0]===swaps[1]){
            return;
        }
        this._genome = [...this._genome.slice(0,swaps[0]),this._genome[swaps[1]],...this._genome.slice(swaps[0]+1,swaps[1]),this._genome[swaps[0]],...this._genome.slice(swaps[1]+1)]
    }
}

//https://javascript.info/task/shuffle
function shuffle(array) {
    const newArray=array.slice();
    for (let i = newArray.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1)); // random index from 0 to i

        // swap elements array[i] and array[j]
        // we use "destructuring assignment" syntax to achieve that
        // you'll find more details about that syntax in later chapters
        // same can be written as:
        // let t = array[i]; array[i] = array[j]; array[j] = t
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

function recombine(individual1,individual2){
    const breakpoints = [Math.round(Math.random()*individual1.genome.length),Math.round(Math.random()*individual1.genome.length)].sort((a,b)=>a-b);

    const chunk = individual1.genome.slice(...breakpoints);
    const missingGenes = individual1.genome.filter(g=>!chunk.includes(g)).sort((a,b)=>(individual2.genome.indexOf(a)-individual2.genome.indexOf(b)));

    const genome = [...missingGenes.slice(0,breakpoints[0]),...chunk,...missingGenes.slice(breakpoints[0])];


    return new Individual(genome,individual1.transitions)

}

