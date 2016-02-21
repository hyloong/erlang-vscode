/// <ref href="../typings/tsd.d.ts">


import {CompletionItemProvider, TextDocument, Position, CancellationToken,
        CompletionItem, CompletionItemKind} from 'vscode';
import fs = require('fs');
import {Symbols, FunctionInfo} from 'whatels';
import {WhatelsClient} from './whatels_client';

const RE_MODULE = /(\w+):$/;

interface FunctionCompletionData {
    name: string;
    // detail: string;
}

export class ErlangCompletionProvider implements CompletionItemProvider {
    private modules:any = null;
    private moduleNames: string[] = null;
    private genericCompletionItems: CompletionItem[] = null;

    constructor(private whatelsClient: WhatelsClient,
                private completionPath: string) {}

    public provideCompletionItems(doc: TextDocument,
                                  pos: Position,
                                  token: CancellationToken): Thenable<CompletionItem[]>
    {
        return new Promise<CompletionItem[]>((resolve, reject) => {
	        const line = doc.lineAt(pos.line);
            const m = RE_MODULE.exec(line.text.substring(0, pos.character));
            if (m === null) {
                this.whatelsClient.getSymbols(doc.fileName, doc.getText()).then(
                    symbols => this.resolveGenericItems(resolve, symbols.functions),
                    err => reject(err)
                );
            }
            else {
                if (this.modules === null) {
                    this.readCompletionJson(this.completionPath, modules => {
                        this.modules = modules;
                        this.resolveFunNames(m[1], resolve);
                    });
                }
                else {
                    this.resolveFunNames(m[1], resolve);
                }
            }
        });
    }

    private resolveFunNames(module, resolve) {
	   resolve(this.makeModuleFunsCompletion(module));
    }

    private resolveGenericItems(resolve, funs) {
        resolve(this.makeGenericCompletion(funs));
        // if (!this.genericCompletionItems) {
        //     this.genericCompletionItems = this.makeGenericCompletion([]);
        // }
        // resolve(this.genericCompletionItems);
    }

    private makeFunctionCompletionItem(name: string): CompletionItem {
        const item = new CompletionItem(name);
        // item.documentation = cd.detail;
        item.kind = CompletionItemKind.Function;
        return item;
    }

    private makeModuleNameCompletionItem(name: string): CompletionItem {
        const item = new CompletionItem(name);
        item.kind = CompletionItemKind.Module;
        return item;
    }

    private makeModuleFunsCompletion(module: string): CompletionItem[] {
        const moduleFuns = this.modules[module] || [];
        return moduleFuns.map(name => {
            return this.makeFunctionCompletionItem(name);
        });
    }

    private makeGenericCompletion(funs: FunctionInfo[]): CompletionItem[] {
        let comps: CompletionItem[] = funs.map(f => {
            return this.makeFunctionCompletionItem(f.name);
        });
        const modules = this.modules || {};
        const names = [];
        for (let k in modules) {
            names.push(k);
        }
        names.sort();
        names.forEach(name => {
            comps.push(this.makeModuleNameCompletionItem(name));
        });

        return comps;
    }

    private readCompletionJson(filename: string, done: Function): any {
        fs.readFile(filename, 'utf8', (err, data) => {
            if (err) {
                console.log(`Cannot read: ${filename}`);
                done({});
            }
            else {
                let d: any = JSON.parse(data);
                done(d);
            }
        });
    }
}