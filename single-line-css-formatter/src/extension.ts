'use strict';

import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  let provider = vscode.languages.registerDocumentFormattingEditProvider(['css', 'html'], {
      async provideDocumentFormattingEdits(document: vscode.TextDocument) {
        const edits = await vscode.commands.executeCommand<vscode.TextEdit[]>(
          'vscode.executeFormatDocumentProvider',
          document.uri
        );

        let text = document.getText();
        if (edits && edits.length > 0) {
          const wsEdit = new vscode.WorkspaceEdit();
          wsEdit.set(document.uri, edits);
          await vscode.workspace.applyEdit(wsEdit);
          text = document.getText();
        }

        function collapseSingleRules(css: string): string {
//          return css.replace(/([^{]+){\s*([^{};]+:[^{};]+);?\s*}/g, (match, selector, decl) => {
          return css.replace(/{\s*([^{};]+);\s*}/g, (match, capture1, offset) => {
            return ` { ${capture1} }`;
            // const parts: string[] = decl.split(';').map((s: string) => s.trim()).filter(Boolean);
            // if (parts.length === 1) {
            //   return selector.trim() + ' { ' + decl.trim() + '; }';
            // }
            // return match;
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
        const fullRange = new vscode.Range(document.positionAt(0), document.positionAt(text.length));
        return [vscode.TextEdit.replace(fullRange, finalText)];
      }
    }
  );

  context.subscriptions.push(provider);
}

export function deactivate() { }
