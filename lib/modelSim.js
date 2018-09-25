'use babel';

import tmp from 'tmp-promise'
import fs from 'fs-extra'
import { exec } from 'child-process-promise'
import path from 'path'
import to from './to'

const FIND_ERROR_REGEX = /Error(?: |:).+?$/gm
const ERROR_REGEX = /Error.+?(?: *?(?:.+?(?:\\|\/))+.+?\((\d+?)\):|)(?: *?near "(.+?)":|)(?: *?\((.+?)\)|) +?(.+)/

export default async function runLint(text, editorPath, dirs){
  const { tmpDir, tmpFile } = await setupTmpWorkspace(text, '.vhd', editorPath, dirs)
  const [ err ] = await to(runAnalyzer(text, tmpDir, tmpFile))
  await fs.remove(tmpFile)
  if(err){
    console.log(err.stdout)
    return formatErrors(err.stdout)
  }else{
    return [] // ModelSim found no errors
  }
}

function formatErrors(stdout){
  return stdout.match(FIND_ERROR_REGEX).reduce(
    (errors, match) => {
      const [, line, near, code, message ] = ERROR_REGEX.exec(match)
      errors.push({line, near, code, message})
      return errors
    }, []
  )
}

async function runAnalyzer(text, tmpDir, tmpFile){
  const compiler = atom.config.get('linter-quartus.quartusLocation')
  await exec(`${compiler}/modelsim_ase/win32aloem/vlib -dirpath "${tmpDir}" work`, {cwd: tmpDir})
  return exec(`${compiler}/modelsim_ase/win32aloem/vcom -work work -lint -pedanticerrors "${tmpFile}"`, {cwd: tmpDir})
}

async function setupTmpWorkspace(text, extension, filePath, dirs){
  const project = dirs.filter(dir => dir.contains(filePath))[0]
  if(!project) throw Error('Failed to find project for file.')
  const dirPath = path.resolve(project.getPath(), './linter')
  await fs.ensureDir(dirPath)
  const tmpFile = await tmp.tmpName({postfix: extension, dir: dirPath})
  await fs.writeFile(tmpFile, text)
  return {tmpDir: dirPath, tmpFile}
}
