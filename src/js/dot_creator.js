const esgraph = require('esgraph');
let number = 0;

function createNode(color,shape,label){
    number = number + 1;
    let name = 'n'+number.toString();
    label = '~'+number.toString()+'~' + '\n' + label;
    return [name,name + ' [label = "'+label+'" color = "'+color+'" shape = "'+shape+'"]'];
}

function createMergeNode(color){
    number = number + 1;
    let name = 'n'+number.toString();
    return [name,name + ' [label = " " shape = "circle" color = "' + color + '"]'];
}

function createArrow(from,to){
    return from + ' -> ' + to;
}

function createArrowLabel(from,to,label){
    return from + ' -> ' + to + '[label = "' + label + '"]';
}

function Esgraph(function_body){
    return esgraph(function_body);
}
export{createNode,createArrow,createMergeNode,createArrowLabel,clear,Esgraph};

function clear(){
    number = 0;
}