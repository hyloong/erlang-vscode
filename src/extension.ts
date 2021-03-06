// Copyright (c) 2016, Yuce Tekol <yucetekol@gmail.com>.
// All rights reserved.

// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:

// * Redistributions of source code must retain the above copyright
//   notice, this list of conditions and the following disclaimer.

// * Redistributions in binary form must reproduce the above copyright
//   notice, this list of conditions and the following disclaimer in the
//   documentation and/or other materials provided with the distribution.

// * The names of its contributors may not be used to endorse or promote
//   products derived from this software without specific prior written
//   permission.

// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

'use strict';
import {ExtensionContext, Disposable, workspace, window} from 'vscode';
import {languages, Hover, IndentAction, LanguageConfiguration} from 'vscode';
import {ErlangCompletionProvider} from './completion_provider';

export function activate(ctx: ExtensionContext) {
    let config = workspace.getConfiguration('erlang');
    let languageConfiguration: LanguageConfiguration = {
        comments: {
            lineComment: '%'
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
            ['<<', '>>']
        ],
        __characterPairSupport: {
			autoClosingPairs: [
				{ open: '{', close: '}' },
				{ open: '[', close: ']' },
				{ open: '(', close: ')' },
				{ open: '<<', close: '>>', notIn: ['string', 'comment'] },
				{ open: '"', close: '"', notIn: ['string'] },
				{ open: '\'', close: '\'', notIn: ['string', 'comment'] }
			]
		}
    }

    if (config['autoIndent']) {
        languageConfiguration['indentationRules'] = {
            increaseIndentPattern: /^\s*([^%]*->|receive|if|fun|case\s+.*\s+of|try\s+.*\s+of|catch|after)\s*$/,
            // decreaseIndentPattern: /\s+(?:end[.,;]?|catch|after)\s*$/
            decreaseIndentPattern: /\s+(?:end[.,;]?|catch|after)\s*$/
            // decreaseIndentPattern: null
        }
        languageConfiguration['onEnterRules'] = [
            {
                beforeText: /^\s*([^%]*->|receive|if|fun|case\s+.*\s+of|try\s+.*\s+of)\s*$/,
                action: {
                    indentAction: IndentAction.Indent
                }
            },
            {
                beforeText: /^\s*((?!(end|catch|after))[^,])*$/,
                action: {
                    indentAction: IndentAction.Outdent
                }
            }
        ]
    }
    
    languages.setLanguageConfiguration('erlang', languageConfiguration);

    // enable auto completion
    if (config['enableExperimentalAutoComplete']) {
        let completionJsonPath = ctx.asAbsolutePath("./priv/erlang-libs.json");
        ctx.subscriptions.push(languages.registerCompletionItemProvider({
            language: 'erlang'
        }, new ErlangCompletionProvider(completionJsonPath), ':'));
    }
}

export function deactivate() {
}

