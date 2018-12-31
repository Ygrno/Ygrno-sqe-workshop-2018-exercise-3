import $ from 'jquery';
import * as esco from 'escodegen';
import {parseCode_line} from './code-analyzer';
import {SymbolicSubstitute} from './symbolic-substitution';
import {EvalStatements,ColorAssignment,ExtractFunctionFromProgram} from './eval-statements';
import {Transform_CFG} from './cfg-transformation';
import {Esgraph} from './dot_creator';
import * as d3graphviz from 'd3-graphviz';




$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let InputTextField = $('#function_input');
        let codeToParse = $('#codePlaceholder').val();
        let inputVector = InputTextField.val();
        let parsedCode = parseCode_line(codeToParse);
        if(inputVector !== '') {
            let parsedCode_sym = SymbolicSubstitute(parsedCode);
            InputTextField.val(esco.generate(parsedCode_sym));
            let parsedCode_sym_eval = EvalStatements(parsedCode_sym, inputVector)[1];
            parsedCode = ColorAssignment(parsedCode, parsedCode_sym_eval);
        }
        let cfg = Esgraph(ExtractFunctionFromProgram(parsedCode)['body']);
        let dot_string = Transform_CFG(cfg,'');
        let string = 'digraph G {' + dot_string + '}';
        InputTextField.val(InputTextField.val() + '\n\n\n\n' + string);
        d3graphviz.graphviz('#this').renderDot(string);
    });
});


// let parsedCode_sym_eval = EvalStatements(parsedCode_sym,inputVector)[1];
// let graph = CreateGraphObject(first_cfg[0]);
// let mermaid = CreateMermaidString(graph);