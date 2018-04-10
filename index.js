const fs = require('fs')

const parser = require('./parser')
const util = require('util')
const path = require('path')
const readlineSync = require('readline-sync')
const program = require('commander')
const chalk = require('chalk')
const interpreter = require('./interpreter')

program
  .usage('[options] <file>')
  .option('-v, --verbose', 'Debug verbosity')
  .option('-t, --test', 'Run test using the adjacently placed .in and .out files')
  .option('-r, --reversed', 'Run code reversed')
  .parse(process.argv)

const isReversed = program.reversed != null
const isVerbose = program.verbose != null
const isTest = program.test != null

if (program.args.length == 0) {
  throw "No file specified"
  program.help()
}

if (program.args.length > 1) {
  throw "Multiple files specified"
  program.help()
}

const codeFile = program.args[0]
const code = fs.readFileSync(codeFile).toString()
const statements = parser.parse(code)

let interpretationResults = {}

if (isTest) {
  const parsedCodeFile = path.parse(codeFile)
  const dirAndName = `${parsedCodeFile.dir}/${parsedCodeFile.name}`
  let inFile = `${dirAndName}.in`
  let outFile = `${dirAndName}.out`
  const resultTestFile = `${dirAndName}.result-test`

  if (isReversed) {
    let temp = inFile
    inFile = outFile
    outFile = temp
  }

  const inData = fs.readFileSync(inFile).toString()
  const testStdin = inData.split("\n").map(s => s.trim())

  if (isReversed)
    testStdin.reverse()

  interpretationResults = interpreter.interpret({
    statements,
    reversed: isReversed,
    verbose: isVerbose,
    stdin: testStdin,
    test: true,
  })

  const testStdout = interpretationResults.stdout

  const outData = fs.readFileSync(outFile).toString()

  if (isReversed)
    testStdout.reverse()

  const resultTestData = testStdout.join('\n')

  if (outData === resultTestData) {
    console.log(chalk.green("Test successful!"))
  } else {
    console.error(chalk.red(`Test was an error! See: ${resultTestFile}`))
  }

  fs.writeFileSync(resultTestFile, resultTestData)

} else {
  interpreter.interpret({
    statements,
    reversed: isReversed,
    verbose: isVerbose,
  })
}

const {
  variables
} = interpretationResults

const nonZeroVariables = Object.entries(variables).filter(([k, v]) => v !== 0)

if (nonZeroVariables.length > 0) {
  const nonZeroVariablesText = nonZeroVariables.map(([k, v]) => `${k} (${v})`).join(', ')
  console.error(chalk.yellow(`The following variables were non-zero: ${nonZeroVariablesText}`))
}
