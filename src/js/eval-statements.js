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

function array_handler(input_vector, i, arr) {
    let string = '[';
    while (input_vector[i] !== ']' && i < input_vector.length) {
        i++;
        string = string + input_vector[i];
    }
    arr.push(string);
    return i;
}

function regular_input(input_vector, i, arr) {
    let string = '';
    while (input_vector[i] !== ',' && i < input_vector.length) {
        string = string + input_vector[i];
        i++;
    }
    arr.push(string);
    return i;
}

function InputSplitter(input_vector){
    let arr = [];
    for(let i = 0 ; i < input_vector.length; i++){
        if(input_vector[i] === '[') {
            i = array_handler(input_vector, i, arr);
        }
        else if(input_vector[i] !== ','){
            i = regular_input(input_vector, i, arr);
        }
    }
    return arr;
}

function PushParamArray(parameter,array){
    let variable = esco.generate(parameter);
    ParamTable.push(new Variable_table(variable,array,'parameter'));
    array = array.split('[').join('').split(']').join('');
    let array_split_by_coma = array.split(',');
    for(let k = 0; k < array_split_by_coma.length; k++){
        let element_variable = variable + '[' + k + ']';
        ParamTable.push(new Variable_table(element_variable,array_split_by_coma[k],'parameter'));
    }
    ParamTable.push(new Variable_table(variable + '.length',array_split_by_coma.length,'parameter'));
}

function CreateParamTable(subbed_func,input_vector){
    let split_input = InputSplitter(input_vector);
    // let split_by_comma = input_vector.split(',');
    let parameters = subbed_func['params'];
    for(let j = 0; j<parameters.length; j++)
    {
        if(split_input[j][0] === '[') PushParamArray(parameters[j],split_input[j]);
        else ParamTable.push(new Variable_table(esco.generate(parameters[j]),split_input[j],'parameter'));
    }
}

function alternate_handler(eval_test, if_exp, string_by_line) {
    if (eval_test === false && if_exp['alternate']['type'] !== 'IfStatement') string_by_line[if_exp['alternate']['loc']['start']['line'] - 2] = '<span style="background-color: #37ff00">' + string_by_line[if_exp['alternate']['loc']['start']['line'] - 2] + '</span>';
    if (eval_test === false) TraverseForStatements(if_exp['alternate'], string_by_line);
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
    if(eval_test) TraverseForStatements(consequent,string_by_line);

    if(if_exp['alternate'] !== null) {
        alternate_handler(eval_test, if_exp, string_by_line);
    }
}

function WhileEval(while_exp,string_by_line){
    let test = while_exp['test'];
    let test_string = esco.generate(test);
    test_string = test_string.split('(').join(' ( ').split(')').join(' ) ');
    let test_sub_string = MakeSubstitution(test_string,ParamTable);
    let eval_test = eval(test_sub_string);
    if(eval_test){
        while_exp['color'] = 'green';
        let while_body = while_exp['body'];
        TraverseForStatements(while_body,string_by_line);
    }
    else {
        while_exp['color'] = 'red';
    }
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
    let e_type = exp['type'];
    if (e_type === 'BlockStatement') exp['body'].map(x => TraverseForStatements(x,string_by_line));
    else if (e_type === 'IfStatement') IfEval(exp,string_by_line);
    else if (e_type === 'WhileStatement') WhileEval(exp,string_by_line);

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


function BlockColor_handle(org_exp,sym_exp,color){
    org_exp['color'] = sym_exp['color'];
    let org_exp_body = org_exp['body'], sym_exp_body = sym_exp['body'],k = 0;
    for(let i = 0; i<sym_exp_body.length; i++){
        let sym_element = sym_exp_body[i];
        for(let j = k; j<org_exp_body.length;j++){
            let org_element = org_exp_body[j];
            if(sym_element['type'] === org_element['type']){
                GeneralColorHandler(org_element,sym_element,color);
                k = j + 1;
                j = org_exp_body.length;
            }
            else{
                GeneralColorHandler(org_element,sym_element,color);
            }
        }
    }
    for(let j = k; j<org_exp_body.length; j++) GeneralColorHandler(org_exp_body[j],null,color);
}

function GeneralColorHandler(org_exp,sym_exp,color){
    let exp_type = org_exp['type'];
    if(exp_type === 'BlockStatement') BlockColor_handle(org_exp,sym_exp,color);
    else if(exp_type === 'IfStatement') IfColor(org_exp,sym_exp);
    else if(exp_type === 'WhileStatement') WhileColor(org_exp,sym_exp);
    else if(exp_type === 'ExpressionStatement') {
        org_exp['color'] = color;
        org_exp['expression']['color'] = color;
    }
    else org_exp['color'] = color;
}

function WhileColor(while_exp,sym_while_exp){
    while_exp['color'] = sym_while_exp['color'];
    while_exp['test']['color'] = while_exp['color'];
    let body_org = while_exp['body'];
    let body_sym = sym_while_exp['body'];
    GeneralColorHandler(body_org,body_sym,while_exp['color']);
}

function IfColor(if_exp,sym_if_exp){
    if_exp['color'] = sym_if_exp['color'];
    if_exp['test']['color'] = if_exp['color'];
    let consequent_org = if_exp['consequent'];
    let consequent_sym = sym_if_exp['consequent'];
    GeneralColorHandler(consequent_org,consequent_sym,if_exp['color']);
    if(if_exp['alternate'] !== null)
    {
        if(if_exp['alternate']['type'] === 'IfStatement') IfColor(if_exp['alternate'],sym_if_exp['alternate']);
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
        for (let j = k; j < program_body.length; j++) {
            let org_type = program_body[j]['type'];
            if (sym_type === org_type) {
                if (sym_type === 'ReturnStatement') program_body[j]['color'] = 'green';
                else GeneralColorHandler(program_body[j],sym_program_body[i]);
                k = j + 1;
                j = program_body.length;
            }
            else GeneralColorHandler(program_body[j],null,'green');
        }
    }
    return program;
}


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



export {EvalStatements,ColorAssignment,ExtractFunctionFromProgram};