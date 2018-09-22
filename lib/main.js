'use babel';

import tmp from 'tmp-promise'
import fs from 'fs-extra'
import { exec } from 'child-process-promise'
import { dirname } from 'path'

import { lintFast } from './linter'

export default {

  config: {
    quartusLocation: {
      title: 'Quartus Location',
      description: 'Path to Quartus install directory. Must be set before use',
      type: 'string',
      default: '/intelFPGA_lite/18.0',
      order: 0,
    },
    useModelSim: {
      title: 'Lint on Change',
      description: 'Use ModelSim\'s analyzer to lint on change',
      type: 'boolean',
      default: 'true',
      order: 1,
    },
    analyzer: {
      title: 'Analyzer',
      description: 'Analyzer to use on file saves',
      type: 'string',
      default: 'Quartus',
      enum: ['Quartus', 'ModelSim'],
      order: 2,
    },
    errorHighlight: {
      title: 'Error Highlighting',
      description: 'Type of editor highlighting used when reporting errors',
      type: 'string',
      default: 'Near Error',
      enum: ['Near Error', 'Full Line'],
      order: 3,
    },
  },

  activeAnalyzers: [],

  provideLinter() {
    console.log('provided linter')
    return {
      name: 'Quartus Linter',
      scope: 'file',
      lintsOnChange: atom.config.get('linter-quartus.useModelSim'),
      grammarScopes: ['source.vhdl', 'source.vhd', 'source.v'],
      lint: async (textEditor) => {
        const editorPath = textEditor.getPath()
        const saved = !textEditor.isModified()
        const dirs = atom.project.getDirectories()
        if(saved){
          console.log('use full lint')
          const savedText = textEditor.getText()
          return lintFast(savedText, editorPath, textEditor, true, dirs) // TODO remove this
          // return []
        }else{
          console.log('use fast lint')
          if(atom.config.get('linter-quartus.useModelSim')){
            const unsavedText = textEditor.getText()
            return lintFast(unsavedText, editorPath, textEditor, true, dirs)
          }
        }
      }
    }
  }
};
