import $ from 'jquery';
// import * as esco from 'escodegen';
import {parseCode_line} from './code-analyzer';
import {SymbolicSubstitute} from './symbolic-substitution';
import {EvalStatements,ColorAssignment,ExtractFunctionFromProgram} from './eval-statements';
// import {CreateGraphObject,CreateMermaidString} from './code-visualization';
import {Transform_CFG} from './cfg-transformation';
import * as d3graphviz from 'd3-graphviz';
const esgraph = require('esgraph');



$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let inputVector = $('#function_input').val();
        let parsedCode = parseCode_line(codeToParse);

        if(inputVector !== '') {
            let parsedCode_sym = SymbolicSubstitute(parsedCode);
            let parsedCode_sym_eval = EvalStatements(parsedCode_sym, inputVector)[1];
            parsedCode = ColorAssignment(parsedCode, parsedCode_sym_eval);
        }

        let cfg = esgraph(ExtractFunctionFromProgram(parsedCode)['body']);
        let dot_string = Transform_CFG(cfg,'');
        // let dot = esgraph.dot(cfg);
        let string = 'digraph G {' + dot_string + '}';
        d3graphviz.graphviz('#this').renderDot(string);

    });
});


// let parsedCode_sym_eval = EvalStatements(parsedCode_sym,inputVector)[1];
// let graph = CreateGraphObject(first_cfg[0]);
// let mermaid = CreateMermaidString(graph);