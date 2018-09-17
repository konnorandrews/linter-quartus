'use babel';

import tmp from 'tmp'
import fs from 'fs'
import { exec } from 'child_process'
import { dirname } from 'path'

export default {

  config: {
    quartusLocation: {
      title: 'Quartus Location',
      description: 'Path to Quartus install directory. Must be set before use',
      type: 'string',
      default: 'intelFPGA_lite/18.0',
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
        const saved = textEditor.isModified()
        if(saved){
          console.log('use full lint')
        }else{
          console.log('use fast lint')
          if(atom.config.get('linter-quartus.useModelSim')){
            const unsavedText = textEditor.getText()
            return this.lintUnsaved(unsavedText, dirname(editorPath))
          }
        }
      }
    }
  },

  lintUnsaved(unsavedText, cwd){
    return new Promise((resolve, reject) => {
      tmp.file({ discardDescriptor: true }, (err, path, fd, cleanupCallback) => {
        if(err){
          reject(err)
          return
        }

        console.log('File: ', path);

        fs.writeFile(path, unsavedText, (err) => {
          if(err){
            reject(err)
            return
          }

          console.log("The file was saved!");

          const compiler = atom.config.get('linter-quartus.quartusLocation')

          const options = { cwd }
          exec(`${compiler} ${path}`, options, (err, stdout, stderr) => {
            if(err){
              reject(err)
              return
            }

            console.log(stdout, stderr)
          })

          console.log(this)

        });
      });
    })
  }

};
