import * as esco from 'escodegen';
import {Variable_table} from './symbolic-substitution';


let ParamTable = [];


function param_getValue(variable,env){
    for(let i = 0 ; i < env.length ; i++){
        if(env[i]['variable'] === variable) return env[i]['value'];
    }
    return null;
}


/**
 * @return {string}
 */
function EvalStatements(subbed_func,input_vector){
    Clear();
    CreateParamTable(subbed_func,input_vector);
    TraverseForStatements(subbed_func['body']);
    return CreateHtmlCode(subbed_func);
}

function Clear(){
    ParamTable = [];
}

function CreateParamTable(subbed_func,input_vector){
    let split_by_comma = input_vector.split(',');
    let parameters = subbed_func['params'];
    for(let j = 0; j<parameters.length; j++) ParamTable.push(new Variable_table(esco.generate(parameters[j]),split_by_comma[j],'parameter'));
}

function IfEval(if_exp){
    let test = if_exp['test'];
    let test_string = esco.generate(test);
    test_string = test_string.split('(').join(' ( ').split(')').join(' ) ');
    let test_sub_string = MakeSubstitution(test_string,ParamTable);
    let eval_test = eval(test_sub_string);
    // let eval_test = safeEval(test_sub_string);

    if_exp['test_eval'] = !!eval_test;
    let consequent = if_exp['consequent'];
    TraverseForStatements(consequent);

    if(eval_test === false) TraverseForStatements(if_exp['alternate']);
}

/**
 * @return {string}
 */
function MakeSubstitution(string,param_table){
    let split_by_space = string.split(' ');
    let sub_string = '';
    for(let j = 0; j<split_by_space.length; j++){
        let value = param_getValue(split_by_space[j],param_table);
        if(value !== null && value.length>1) sub_string = sub_string + '(' + value + ')' + ' ';
        else if(value!== null) sub_string = sub_string + value + ' ';
        else sub_string = sub_string + split_by_space[j] + ' ';
    }
    sub_string = sub_string.slice(0,sub_string.length-1);
    return sub_string;
}

function TraverseForStatements(exp){
    if(exp !== null) {
        let e_type = exp['type'];
        if (e_type === 'BlockStatement') exp['body'].map(x => TraverseForStatements(x));
        else if (e_type === 'IfStatement') IfEval(exp);
    }
}

function expHandler(htmlcode,exp){
    let e_type = exp['type'];
    if(e_type === 'BlockStatement') {
        htmlcode +=  '{' + '\n';
        exp['body'].map(x => {
            htmlcode = expHandler(htmlcode, x);
        });
        htmlcode += '}';
    }
    else if(e_type === 'IfStatement'){
        if(exp['test_eval'] === true) htmlcode = ifHandler(htmlcode,esco.generate(exp['test']),exp,'green','if');
        else htmlcode = ifHandler(htmlcode,esco.generate(exp['test']),exp,'red','if');
    }
    else{
        let exp_string = esco.generate(exp);
        htmlcode += exp_string + '\n' ;
    }
    return  htmlcode;
}

function extracted(alternate, htmlcode) {
    if (alternate['test_eval'] === true) htmlcode = ifHandler(htmlcode, esco.generate(alternate['test']), alternate, 'green', 'else if');
    else if (alternate['test_eval'] === false) htmlcode = ifHandler(htmlcode, esco.generate(alternate['test']), alternate, 'red', 'else if');
    else htmlcode = ifHandler(htmlcode, esco.generate(alternate['test']), alternate, 'white', 'else if');
    return htmlcode;
}

function ifHandler(htmlcode, test_string, if_exp,color,type) {
    htmlcode += '<table bgcolor="' + color + '"> <tr><td>' + type + ' (' + test_string + ')</td></tr></table> ';
    let consequent = if_exp['consequent'];
    htmlcode = expHandler(htmlcode,consequent) + '\n';
    let alternate = if_exp['alternate'];
    if (alternate !== null && alternate['type'] === 'IfStatement') {
        htmlcode = extracted(alternate, htmlcode);
    }
    else if(alternate !== null) {
        htmlcode += 'else ';
        htmlcode = expHandler(htmlcode, alternate);
    }
    return htmlcode;
}

/**
 * @return {string}
 */
function CreateHtmlCode(func){
    let htmlcode = '<pre>', func_clone = JSON.parse(JSON.stringify(func));
    func_clone['body'] = {'type': 'BlockStatement', 'body': []};
    let empty_func_string = esco.generate(func_clone);
    empty_func_string = empty_func_string.split('}').join(' ');
    htmlcode = htmlcode + empty_func_string;
    let func_body = func['body']['body'];
    for(let j=0; j<func_body.length ; j++){
        if(func_body[j]['type'] !== 'IfStatement'){
            let exp_string = esco.generate(func_body[j]);
            htmlcode += exp_string + '\n';}
        else {
            let test_string = esco.generate(func_body[j]['test']);
            if(func_body[j]['test_eval'] === true) htmlcode = ifHandler(htmlcode, test_string, func_body[j],'green','if');
            else htmlcode = ifHandler(htmlcode, test_string, func_body[j], 'red','if');

        }
    }
    return htmlcode + '\n\n} </pre>';
}

export {EvalStatements};