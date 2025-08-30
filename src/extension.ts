'use strict';


import * as vscode from 'vscode';

export function removeBlankLinesBetweenOneLiners(css: string): string {
  return css.replace(
    /(\s*\S.*\s*{\s*[^{};]+;\s*}[ \t]*\r?\n)([ \t]*\r?\n)+(?=\s*(\S.+?)+\s*{\s*[^{};]+;\s*}|\s*})/g,
    '$1'
  );
}

export function collapseSingleRules(css: string, eol: string = "\n"): string {
  const lines = css.split(/\r?\n/);
  let margin = "                                                    ";
  for (const line of lines) {
    if (line.trim()) {
      const match = line.match(/^[ \t]*/);
      if (match && match[0].length < margin.length) {
        margin = match[0];
      }
    }
  }
  let cssWithOneLiners = css.replace(
    /^(\s*)(\S.*)\s+{\s*([^{};]+;)\s*}(\r?\n)+/mg,
    (match, indent, selector, rule, offset) => {
      let result = `${indent}${selector} { ${rule} }${eol}${eol}`;
      if (result.length > 72) { return match; }
      // if (indent === margin) { result += eol; }
      return result;
    }
  );

  return removeBlankLinesBetweenOneLiners(cssWithOneLiners);
}

export function activate(context: vscode.ExtensionContext) {
  let provider = vscode.languages.registerDocumentFormattingEditProvider(['css', 'html'], {
    async provideDocumentFormattingEdits(document: vscode.TextDocument) {
      
      let text = document.getText();

      await vscode.extensions.getExtension('vscode.html-language-features')?.activate();

      const eol = document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
      // Get the default formatter's edits
      const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
        'vscode.executeFormatDocumentProvider',
        document.uri,
        { tabSize: 2, insertSpaces: false, insertFinalNewline: true } satisfies vscode.FormattingOptions
      );

      // Apply the default formatter's edits to the text in memory
      text = document.getText();
      if (edits && edits.length > 0) {
        // Sort edits in reverse order to avoid messing up offsets
        const sortedEdits = [...edits].sort((a, b) => {
          const aStart = document.offsetAt(a.range.start);
          const bStart = document.offsetAt(b.range.start);
          return bStart - aStart;
        });
        for (const edit of sortedEdits) {
          const start = document.offsetAt(edit.range.start);
          const end = document.offsetAt(edit.range.end);
          text = text.slice(0, start) + edit.newText + text.slice(end);
        }
      }

      let finalText = text;
      if (document.languageId === 'css') {
        finalText = collapseSingleRules(text, eol);
        finalText = finalText.replace(/^[ ]+/gm, match => '\t'.repeat(Math.floor(match.length / 2)));
      } else if (document.languageId === 'html') {
        finalText = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
          return '<style>' + collapseSingleRules(css, eol) + '</style>';
        });
        finalText = finalText.replace(/^[ ]+/gm, match => '\t'.repeat(Math.floor((match.length - 2) / 2)));
    }
      // Use the correct full document range for replacement
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(document.getText().length)
      );
      return [vscode.TextEdit.replace(fullRange, finalText)];
    }
  });

  context.subscriptions.push(provider);
}

export function deactivate() { }
