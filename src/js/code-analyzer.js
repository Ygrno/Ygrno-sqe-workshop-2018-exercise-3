import * as esprima from 'esprima';
import * as esco from 'escodegen';

function TableLine(line, type, name,condition, value){
    this.line = line;
    this.type = type;
    this.name = name;
    this.condition = condition;
    this.value = value;
}

function FuncDec_P(codeToExtract,arr){
    arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'function declaration', codeToExtract['id']['name']));
    if(codeToExtract['params'].length > 0) {for(let i=0;i<codeToExtract['params'].length;i++){Builder(codeToExtract['params'][i],arr,4);}}
    let func_body = codeToExtract['body'];
    Builder(func_body,arr);
}

function Identifier_P(codeToExtract,arr){
    arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'variable declaration', codeToExtract['name']));
}

function VarDec_P(codeToExtract,arr){
    let declarations = codeToExtract['declarations'];
    for(let i=0; i<declarations.length;i++){Builder(declarations[i],arr,4);}
}

function VarDeclarator_P(codeToExtract,arr){
    if(codeToExtract['init'] !== null) arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'variable declaration', codeToExtract['id']['name'],undefined, esco.generate(codeToExtract['init'])));
    else arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'variable declaration', codeToExtract['id']['name'],undefined, 'null'));
}


function ExpAE_parser(codeToExtract,arr){
    arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'assignment expression', esco.generate(codeToExtract['left']),undefined, esco.generate(codeToExtract['right'])));
}

function ExpUE_parser(codeToExtract, arr){
    arr.push(new TableLine(codeToExtract['loc']['start']['line'],'update expression', esco.generate(codeToExtract['argument']),undefined,esco.generate(codeToExtract['argument']) + codeToExtract['operator']));
}

function ExpState_P(codeToExtract,arr){
    let expression = codeToExtract['expression'];
    let exp_type = expression['type'];
    switch (exp_type) {case 'AssignmentExpression': ExpAE_parser(expression,arr); break; case 'UpdateExpression' : ExpUE_parser(expression,arr); break;}

}

function WhileState_P(codeToExtract,arr){
    let condition = esco.generate(codeToExtract['test']);
    arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'while statement', undefined,condition,undefined));
    let while_body = codeToExtract['body'];
    Builder(while_body,arr);
}

function IfState_P(codeToExtract,arr,alternate){
    let condition = esco.generate(codeToExtract['test']);
    if(alternate === 0) arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'if statement', undefined,condition,undefined));
    else arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'else if statement', undefined,condition,undefined));
    Builder(codeToExtract['consequent'],arr,4);
    if(codeToExtract['alternate'] != null) Builder(codeToExtract['alternate'],arr,1);
}

function ReturnState_P(codeToExtract,arr){
    let value = esco.generate(codeToExtract['argument']);
    arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'return statement', undefined,undefined,value));
}

function ForState_P(codeToExtract,arr){
    let init = esco.generate(codeToExtract['init']);
    let test = esco.generate(codeToExtract['test']);
    let update = esco.generate(codeToExtract['update']);
    arr.push(new TableLine(codeToExtract['loc']['start']['line'], 'for statement', undefined,init + ' ' + test + ' ; ' + update,undefined));
    let for_body = codeToExtract['body'];
    Builder(for_body,arr);
}

function BlockState_P(codeToExtract,arr){
    let block_body = codeToExtract['body'];
    for(let exp = 0; exp < block_body.length ; exp ++) { if(block_body[exp]['type'].toString() === 'IfStatement') Builder(block_body[exp],arr,0); else Builder(block_body[exp],arr,4);}
}

const Functions_parser = {
    FunctionDeclaration: FuncDec_P,
    VariableDeclaration: VarDec_P,
    ExpressionStatement: ExpState_P,
    WhileStatement: WhileState_P,
    IfStatement:IfState_P,
    ReturnStatement: ReturnState_P,
    ForStatement: ForState_P,
    Identifier: Identifier_P,
    BlockStatement: BlockState_P,
    VariableDeclarator: VarDeclarator_P};

/**
 * @return {string}
 */
function Builder(codeToExtract,arr,alternate) {
    let exp_type = codeToExtract['type'];
    if(exp_type.toString() === 'Program') Builder(codeToExtract['body'][0],arr,alternate);
    else if(exp_type.toString() !== 'IfStatement') Functions_parser[exp_type](codeToExtract,arr,4);
    else if(alternate === 1) IfState_P(codeToExtract,arr,1); else IfState_P(codeToExtract,arr,0);
}

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse);
};

const parseCode_line = (codeToParse) => {
    return esprima.parseScript(codeToParse,{loc: true});
};

export {parseCode, parseCode_line, Builder};


