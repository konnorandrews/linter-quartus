'use babel';

import tmp from 'tmp-promise'
import fs from 'fs-extra'
import { exec } from 'child-process-promise'
import { dirname } from 'path'

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
        if(saved){
          console.log('use full lint')
          return []
        }else{
          console.log('use fast lint')
          if(atom.config.get('linter-quartus.useModelSim')){
            const unsavedText = textEditor.getText()
            return this.lintUnsaved(unsavedText, editorPath, textEditor)
          }
        }
      }
    }
  },

  lintUnsaved(unsavedText, editorPath, textEditor){
    return tmp.dir({keep: true}).then((dir) => {
      return Promise.all([
        Promise.resolve(dir),
        tmp.tmpName({postfix: '.vhd', dir: dir.path})
      ])
    }).then(([ dir, filePath ]) => {
      const compiler = atom.config.get('linter-quartus.quartusLocation')
      const options = { cwd: dir.path }

      // console.log(dir.path, filePath)

      return Promise.all([
        Promise.resolve(dir),
        Promise.resolve(filePath),
        fs.writeFile(filePath, unsavedText).then(() => {
          return exec(`${compiler}/modelsim_ase/win32aloem/vlib -dirpath ${dir.path} work`, options)
        }).then(() => {
          return exec(`${compiler}/modelsim_ase/win32aloem/vcom -lint -pedanticerrors ${filePath}`, options)
        }).then(({ stdout, stderr }) => {
          return [] // ModelSim found no errors
        }).catch((err) => {
          // console.error('Command failed:', err.stdout)
          const errorFindRegex = /Error:.+?$/gm
          const errorRegex = /Error:.+?((.+?\\|\/)+.+?\..+?\((\d+)\):|) (near "(.+?)":|) ?(\((.+?)\)|) ?(.+)/
          const matches = err.stdout.match(errorFindRegex)
          // const groups = errorRegex.exec(err.stdout)
          // console.log(matches)
          // console.log(groups)
          return matches.reduce((errors, match) => {
            const rawGroups = errorRegex.exec(match)
            // console.log('raw', match, rawGroups)
            const [, , , line, , near, , code, message] = rawGroups
            // console.log(rawGroups)
            // console.log(line, near, code, message)
            let range = []
            if(line){
              const rawRange = [[+line - 1, 0], [+line - 1, 10000]]
              if(near && atom.config.get('linter-quartus.errorHighlight') == 'Near Error'){
                const editorText = textEditor.getTextInBufferRange(rawRange)
                // console.log(editorText, '====', near)
                const col = editorText.indexOf(near)
                range = [[(+line) - 1, (col)], [(+line) - 1, (col + near.length)]];
              }else{
                range = rawRange
              }
            }else{
              range = [[0, 0], [10000, 10000]]
            }

            let extraMessage = ''
            if(message == 'VHDL Compiler exiting'){
              extraMessage = '. Usually caused by another error'
            }

            errors.push({
              severity: 'error',
              location: {
                file: editorPath,
                position: range,
              },
              excerpt: code ? `(${code}), ${message}${extraMessage}` : `${message}${extraMessage}`,
              // description: `### What is this?\nThis is a randomly generated value`
            })
            // console.log(errors)
            return errors
          }, [])
        })
      ])
    }).then(([ dir, filePath, result ]) => {
      fs.remove(filePath)
      fs.remove(dir.path)
      // console.log(result)
      return result
    })
  },

  lintUnsavedOld(unsavedText){
    return new Promise((resolve, reject) => {
      tmp.dir((err, dirPath) => {
        if(err){
          reject(err)
          return
        }
        console.log('Dir: ', dirPath);

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

            const options = { cwd: dirPath }
            exec(`${compiler}/modelsim_ase/win32aloem/vcom ${path}`, options, (err, stdout, stderr) => {
              // if(err){
              //   reject(err)
              //   return
              // }

              console.log(stdout, stderr, err)
            })

            console.log(this)

          });
        });
      })
    });
  }

};
