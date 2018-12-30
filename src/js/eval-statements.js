import * as esco from 'escodegen';
import {Variable_table} from './symbolic-substitution';
import {parseCode_line} from './code-analyzer';


let ParamTable = [];


function EvalStatements(subbed_func,input_vector){
    Clear();
    CreateParamTable(subbed_func,input_vector);
    subbed_func = ReCreateSubbed(subbed_func);
    let func_string_by_line = (esco.generate(subbed_func)).split('\n');
    TraverseForStatements(subbed_func['body'][0]['body'],func_string_by_line);
    return [CreateHtmlCode2(func_string_by_line),subbed_func];
    //return CreateHtmlCode(subbed_func);
}


function param_getValue(variable,env){
    for(let i = 0 ; i < env.length ; i++){
        if(env[i]['variable'] === variable) return env[i]['value'];
    }
    return null;
}


function ReCreateSubbed(function_tree){
    let string = esco.generate(function_tree);
    return parseCode_line(string);
}


function Clear(){
    ParamTable = [];
}

function CreateParamTable(subbed_func,input_vector){
    let split_by_comma = input_vector.split(',');
    let parameters = subbed_func['params'];
    for(let j = 0; j<parameters.length; j++) ParamTable.push(new Variable_table(esco.generate(parameters[j]),split_by_comma[j],'parameter'));
}

function IfEval(if_exp,string_by_line){
    let test = if_exp['test'];
    let test_string = esco.generate(test);
    test_string = test_string.split('(').join(' ( ').split(')').join(' ) ');
    let test_sub_string = MakeSubstitution(test_string,ParamTable);
    let eval_test = eval(test_sub_string);

    if(eval_test) if_exp['color'] ='green';
    else if_exp['color'] = 'red';

    if(eval_test) string_by_line[if_exp['loc']['start']['line']-1] = '<span style="background-color: #37ff00">' + string_by_line[if_exp['loc']['start']['line']-1] + '</span>';
    else string_by_line[if_exp['loc']['start']['line']-1] = '<span style="background-color: #ff000e">' + string_by_line[if_exp['loc']['start']['line']-1] + '</span>';

    let consequent = if_exp['consequent'];
    TraverseForStatements(consequent,string_by_line);

    if(eval_test === false) TraverseForStatements(if_exp['alternate'],string_by_line);
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

function TraverseForStatements(exp,string_by_line){
    if(exp !== null) {
        let e_type = exp['type'];
        if (e_type === 'BlockStatement') exp['body'].map(x => TraverseForStatements(x,string_by_line));
        else if (e_type === 'IfStatement') IfEval(exp,string_by_line);
    }
}

function ExtractFunctionFromProgram(program){
    let program_body = program['body'];
    for(let i = 0; i<program_body.length; i++){
        if(program_body[i]['type'] === 'FunctionDeclaration') {
            program_body[i]['body']['color'] = 'green';
            return program_body[i];
        }
    }
}


function Color(exp,color){
    let type = exp['type'];
    if(type === 'ExpressionStatement')
    {
        exp['color'] = color;
        exp['expression']['color'] = color;
    }


    else exp['color'] = color;
}

function IfColor(if_exp,sym){
    if_exp['color'] = sym['color'];
    let consequent = if_exp['consequent'];
    if(consequent['type'] === 'BlockStatement'){
        for(let i = 0; i<consequent['body'].length; i++){
            Color(consequent['body'][i],if_exp['color']);
        }
    }
    else if_exp['consequent']['color'] = if_exp['color'];
    if_exp['test']['color'] = if_exp['color'];
    if(if_exp['alternate'] !== null)
    {
        if(if_exp['alternate']['type'] === 'IfStatement') IfColor(if_exp['alternate'],sym['alternate']);
        else {
            if_exp['alternate']['color'] = if_exp['color'];
        }
    }
}

function ColorAssignment(program,sym_program){
    let sym_program_body = ExtractFunctionFromProgram(sym_program)['body']['body'];
    let program_body = ExtractFunctionFromProgram(program)['body']['body'];
    let k = 0;
    for(let i = 0; i<sym_program_body.length; i++){
        let sym_type = sym_program_body[i]['type'];
        for(let j = k; j<program_body.length; j++){
            let org_type = program_body[j]['type'];
            if(sym_type === org_type){
                if(sym_type === 'IfStatement') IfColor(program_body[j],sym_program_body[i]);
                else if(sym_type === 'ReturnStatement') program_body[j]['color'] = 'green';
                else program_body[j]['color'] = sym_program_body[i]['color'];
                k = j + 1;
                j = program_body.length;
            }
        }
    }
    return program;
}

// function expHandler(htmlcode,exp){
//     let e_type = exp['type'];
//     if(e_type === 'BlockStatement') {
//         htmlcode +=  '{' + '\n';
//         exp['body'].map(x => {
//             htmlcode = expHandler(htmlcode, x);
//         });
//         htmlcode += '}';
//     }
//     else if(e_type === 'IfStatement'){
//         if(exp['test_eval'] === true) htmlcode = ifHandler(htmlcode,esco.generate(exp['test']),exp,'green','if');
//         else htmlcode = ifHandler(htmlcode,esco.generate(exp['test']),exp,'red','if');
//     }
//     else{
//         let exp_string = esco.generate(exp);
//         htmlcode += exp_string + '\n' ;
//     }
//     return  htmlcode;
// }
//
// function extracted(alternate, htmlcode) {
//     if (alternate['test_eval'] === true) htmlcode = ifHandler(htmlcode, esco.generate(alternate['test']), alternate, 'green', 'else if');
//     else if (alternate['test_eval'] === false) htmlcode = ifHandler(htmlcode, esco.generate(alternate['test']), alternate, 'red', 'else if');
//     else htmlcode = ifHandler(htmlcode, esco.generate(alternate['test']), alternate, 'white', 'else if');
//     return htmlcode;
// }

// function ifHandler(htmlcode, test_string, if_exp,color,type) {
//     htmlcode += '<table bgcolor="' + color + '"> <tr><td>' + type + ' (' + test_string + ')</td></tr></table> ';
//     let consequent = if_exp['consequent'];
//     htmlcode = expHandler(htmlcode,consequent) + '\n';
//     let alternate = if_exp['alternate'];
//     if (alternate !== null && alternate['type'] === 'IfStatement') {
//         htmlcode = extracted(alternate, htmlcode);
//     }
//     else if(alternate !== null) {
//         htmlcode += 'else ';
//         htmlcode = expHandler(htmlcode, alternate);
//     }
//     return htmlcode;
// }

/**
 * @return {string}
 */
function CreateHtmlCode2(string_by_line){
    let htmlCode = '<pre>';
    for(let i = 0; i<string_by_line.length; i++) {
        htmlCode += string_by_line[i] + '\n';
    }
    return htmlCode + '</pre>';
}

// /**
//  * @return {string}
//  */
// function CreateHtmlCode(func){
//     let htmlcode = '<pre>', func_clone = JSON.parse(JSON.stringify(func));
//     func_clone['body'] = {'type': 'BlockStatement', 'body': []};
//     let empty_func_string = esco.generate(func_clone);
//     empty_func_string = empty_func_string.split('}').join(' ');
//     htmlcode = htmlcode + empty_func_string;
//     let func_body = func['body']['body'];
//     for(let j=0; j<func_body.length ; j++){
//         if(func_body[j]['type'] !== 'IfStatement'){
//             let exp_string = esco.generate(func_body[j]);
//             htmlcode += exp_string + '\n';}
//         else {
//             let test_string = esco.generate(func_body[j]['test']);
//             if(func_body[j]['test_eval'] === true) htmlcode = ifHandler(htmlcode, test_string, func_body[j],'green','if');
//             else htmlcode = ifHandler(htmlcode, test_string, func_body[j], 'red','if');
//
//         }
//     }
//     return htmlcode + '\n\n} </pre>';
// }

export {EvalStatements,ColorAssignment,ExtractFunctionFromProgram};