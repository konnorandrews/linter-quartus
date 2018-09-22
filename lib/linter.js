'use babel';

import modelSimRunLint from './modelSim'

export async function lintFast(unsavedText, editorPath, textEditor, nearHighlight, dirs){
  console.log('running ModelSim')
  const errors = await modelSimRunLint(unsavedText, editorPath, dirs)
  console.log('ModelSim complete')
  return errors.map(({ line, near, code, message }) => {
    return {
      severity: 'error',
      location: {
        file: editorPath,
        position: findRange(line, near, textEditor, nearHighlight),
      },
      excerpt: formatMessage(code, near, message),
      // description: `### What is this?\nThis is a randomly generated value`
    }
  })
}

function formatMessage(code, near, message){
  const messageParts = [];
  if(code) messageParts.push(`(${code})`)
  if(message) messageParts.push(`${editMessage(message)}`)
  if(near) messageParts.push(`near "${near}"`)
  return messageParts.join(', ')
}

function editMessage(message){
  if(message == 'VHDL Compiler exiting'){
    return 'VHDL Compiler exiting. Usually caused by another error'
  }
  if(message.slice(-1) == '.'){
    return message.slice(0, -1)
  }
}

function findRange(line, near, textEditor, nearHighlight){
  if(line){
    const lineRange = [[+line - 1, 0], [+line - 1, 10000]]
    if(near && nearHighlight){
      const editorText = textEditor.getTextInBufferRange(lineRange)
      const col = editorText.indexOf(near)
      return [[(+line) - 1, (col)], [(+line) - 1, (col + near.length)]];
    }else{
      return lineRange
    }
  }else{
    return [[0, 0], [10000, 10000]]
  }
}
