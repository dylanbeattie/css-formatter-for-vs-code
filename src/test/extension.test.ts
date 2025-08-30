import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	// vscode.window.showInformationMessage('Start all tests.');

	const { collapseSingleRules } = require('../extension');

	test('collapseSingleRules collapses single-line CSS rules', () => {
		const input = `
				.foo {
					color: red;
				}
				.bar {
					background: blue;
				}
			`;
		const expected = `
				.foo { color: red; }
				.bar { background: blue; }

			`;
		const actual = collapseSingleRules(input);
		assert.equal(actual, expected);
	});

	test('collapseSingleRules does not collapse multi-line rules', () => {
		const input = `
				.foo {
					color: red;
					background: blue;
				}
			`;
		const output = collapseSingleRules(input);
		assert.match(output, /color: red;/);
		assert.match(output, /background: blue;/);
		assert.doesNotMatch(output, /\.foo \{ color: red; background: blue; \}/);
	});

	test('collapseSingleRules preserves indentation', () => {
		const input = "\t.foo {\n\t\tcolor: red;\n\t}\n";
		const expected = "\t.foo { color: red; }\n\n";
		const actual = collapseSingleRules(input);
		console.log(actual);
		assert.equal(expected, actual);
	});
});
