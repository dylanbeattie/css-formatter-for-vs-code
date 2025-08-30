'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let provider = vscode.languages.registerDocumentFormattingEditProvider(['css', 'html'], {
    async provideDocumentFormattingEdits(document: vscode.TextDocument) {
      const eol = document.eol === vscode.EndOfLine.LF ? "\n" : "\r\n";
      // Get the default formatter's edits
      const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
        'vscode.executeFormatDocumentProvider',
        document.uri
      );

      // Apply the default formatter's edits to the text in memory
      let text = document.getText();
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

      function collapseSingleRules(css: string): string {
        return css.replace(/\s*{\s*([^{};]+);\s*}(\r?\n)+/g, (match, capture1, offset) => {
          return ` { ${capture1} }${eol}`;
        });
      }

      let finalText = text;
      if (document.languageId === 'css') {
        finalText = collapseSingleRules(text);
      } else if (document.languageId === 'html') {
        finalText = text.replace(/<style[^>]*>([\s\S]*?)<\/style>/gi, (match, css) => {
          return '<style>' + collapseSingleRules(css) + '</style>';
        });
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
