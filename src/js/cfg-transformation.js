import * as esco from 'escodegen';
import {FixArray} from './symbolic-substitution';
import {createNode,createArrow,createMergeNode,createArrowLabel} from './dot_creator';

function Transform_CFG(cfg,dot_string){
    dot_string = CreateAllNodes(cfg,dot_string);
    dot_string = ConnectNodes(cfg,dot_string);


    return dot_string;
}

function CreateAllNodes(cfg,dot_string){
    let cfg_array = cfg[2];
    for(let i = 0; i<cfg_array.length; i++){
        let node_type = cfg_array[i]['type'];
        if(node_type === 'entry' || node_type === 'exit') {
            cfg_array[i] = null;
        }
        else {
            let esprima_type = cfg_array[i]['astNode']['type'];
            dot_string = Functions_parser[esprima_type](cfg_array[i],dot_string);
        }
    }
    cfg[2] = FixArray(cfg[2]);
    return dot_string;
}

function ConnectNodes(cfg,dot_string){
    let cfg_array = cfg[2];
    for(let i = 0; i<cfg_array.length; i++) {
        let esprima_type = cfg_array[i]['astNode']['type'];
        if(esprima_type === 'BinaryExpression'){
            cfg_array[i]['false']['connector'] = false;
            cfg_array[i]['true']['connector'] = true;
        }
        dot_string = previousRelations(cfg_array[i], dot_string);
    }
    return dot_string;
}



// let cfg_node_type = cfg_node['type'];
// if(cfg_node_type === 'entry') return Transform_CFG(cfg_node['next'][0],dot_string);
// else{
//     let esprima_type = cfg_node['astNode']['type'];
//     dot_string = Functions_parser[esprima_type](cfg_node,dot_string);
// }
// return dot_string;

const Functions_parser = {
    ReturnStatement: Exp_Node,
    AssignmentExpression: Exp_Node,
    BinaryExpression: Exp_Node,
    VariableDeclaration: VarDec_Node};

function FixPrev(prev, cfg_node) {
    if (prev.length > 0 && prev[0]['type'] === 'entry') {
        prev[0] = null;
        cfg_node['prev'] = FixArray(prev);
        prev = cfg_node['prev'];
    }
    return prev;
}

function connectMany(dot_string, prev, cfg_node) {
    let merge_node = createMergeNode('red');
    dot_string = dot_string + merge_node[1] + '\n';
    for (let j = 0; j < prev.length; j++) {
        let connector = cfg_node['connector'];
        if (connector === undefined) {
            let prev_name = prev[j]['name'];
            let relative = createArrow(prev_name, merge_node[0]);
            dot_string = dot_string + relative + '\n';
        } else {
            let prev_name = prev[j]['name'];
            let relative = createArrowLabel(prev_name, merge_node[0], connector.toString());
            dot_string = dot_string + relative + '\n';
        }
    }
    dot_string = dot_string + createArrow(merge_node[0], cfg_node['name']) + '\n';
    return dot_string;
}

function connectSingle(prev, cfg_node, dot_string) {
    let connector = cfg_node['connector'], relative;
    if (connector === undefined) relative = createArrow(prev[0]['name'], cfg_node['name']);
    else relative = createArrowLabel(prev[0]['name'], cfg_node['name'], connector.toString());
    dot_string = dot_string + relative + '\n';
    return dot_string;
}

function previousRelations(cfg_node, dot_string) {
    let prev = cfg_node['prev'];
    prev = FixPrev(prev, cfg_node);
    if(prev.length > 1) dot_string = connectMany(dot_string, prev, cfg_node);
    else if(prev.length === 1) dot_string = connectSingle(prev, cfg_node, dot_string);
    return dot_string;
}

function GeneralNodeHandler(cfg_node, data,dot_string) {
    // dot_string = previousRelations(cfg_node, dot_string);
    let next = cfg_node['next'];
    for (let i = 0; i < next.length; i++) {
        if (next[i]['type'] === 'exit') next[i] = null;
    }
    if (cfg_node['exception'] != null) delete cfg_node['exception'];
    cfg_node['next'] = FixArray(next);
    cfg_node['type'] = data;
    return dot_string;
}

function VarDec_Node(cfg_node,dot_string){
    let data = '';
    let declarations = cfg_node['astNode']['declarations'];
    for(let i = 0; i<declarations.length; i++){
        if(i === declarations.length - 1) data += esco.generate(declarations[i]);
        else data += esco.generate(declarations[i]) + '\n';
    }
    let node;
    if(cfg_node['parent']['color'] === undefined) node = createNode('black','square',data);
    else node = createNode('green','square',data);
    cfg_node['color'] = node.color;
    cfg_node['name'] = node[0];
    dot_string = dot_string + node[1] + '\n';
    dot_string = GeneralNodeHandler(cfg_node,data,dot_string);
    return dot_string;
}

function Exp_Node(cfg_node,dot_string){
    let type = cfg_node['astNode']['type'],data;
    if(type !== 'ReturnStatement') data = esco.generate(cfg_node['astNode']);
    else data = 'return ' + esco.generate(cfg_node['astNode']['argument']);
    let node;
    let color = cfg_node['astNode']['color'];
    if (type === 'BinaryExpression') {
        if(color !== undefined) node = createNode('green', 'diamond', data);
        else node = createNode('black', 'diamond', data);
    }
    else
    {
        if(color === 'green') node = createNode('green', 'square', data);
        else node = createNode('black', 'square', data);
    }
    cfg_node['name'] = node[0];
    dot_string = dot_string + node[1] + '\n';
    dot_string = GeneralNodeHandler(cfg_node,data,dot_string);
    return dot_string;
}


export{Transform_CFG};


























/*let number = 0;

function GraphNode(shape,color,data,next_nodes,eval_true_node,eval_false_node,number,type){
    this.shape = shape;
    this.color = color;
    this.data = data;
    this.next_nodes = next_nodes;
    this.eval_true_node = eval_true_node;
    this.eval_false_node = eval_false_node;
    this.number = number;
    this.type = type;
}

function VarDec_handler(vardec_node){
    let data = '';
    let declarations = vardec_node['astNode']['declarations'];
    for(let i = 0; i<declarations.length; i++){
        if(i === declarations.length - 1) data += esco.generate(declarations[i]);
        else data += esco.generate(declarations[i]) + '\n';
    }
    let next = vardec_node['next'], graph_node;
    let next_new = [];
    for(let j = 0; j<next.length; j++)
    {
        let node = CreateGraphObject(next[j]);
        if(node != null) next_new.push(node);
    }
    graph_node = new GraphNode('square','white',data,next_new,null,null,number++,'regular');
    return graph_node;
}

function Bin_handler(binary_node){
    let data = esco.generate(binary_node['astNode']);
    let false_path = binary_node['false'];
    let new_false_path = null;
    if(false_path != null) new_false_path = CreateGraphObject(false_path);
    let true_path = binary_node['true'];
    let new_true_path = null;
    if(true_path != null) new_true_path = CreateGraphObject(true_path);
    let next_new = [];
    if(new_false_path != null) next_new.push(new_false_path);
    if(new_true_path != null) next_new.push(new_true_path);
    return new GraphNode('rhombus', 'white', data, next_new, new_true_path, new_false_path, number++, 'if');
}

function Ae_handler(ae_node){
    let data = esco.generate(ae_node['astNode']);

}

const Functions_parser = {
    VariableDeclaration: VarDec_handler,
    BinaryExpression: Bin_handler,
    AssignmentExpression: Ae_handler
};


function CreateGraphObject(cfg){
    let type = cfg['type'];
    if(type === 'entry') CreateGraphObject(cfg['next'][0]);
    else if(type !== 'exit')
    {
        type = cfg['astNode']['type'];
        return Functions_parser[type](cfg);
    }
    else return null;
}


function CreateMermaidString(graph, input){

}


export{CreateGraphObject,CreateMermaidString};*/
