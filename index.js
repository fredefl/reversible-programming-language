const fs = require('fs')
const parser = require('./parser')
const path = require('path')
const program = require('commander')
const chalk = require('chalk')
const interpreter = require('./interpreter')

// Program CLI options
program
  .usage('[options] <file>')
  .option('-v, --verbose', 'Debug verbosity')
  .option('-t, --test', 'Run test using the adjacently placed .in and .out files')
  .option('-r, --reversed', 'Run code reversed')
  .parse(process.argv)

// Determined by CLI options
const isReversed = program.reversed != null
const isVerbose = program.verbose != null
const isTest = program.test != null

// Defensive handling of input
if (program.args.length == 0) {
  throw "No file specified"
  program.help() // exits
}

if (program.args.length > 1) {
  throw "Multiple files specified"
  program.help() // exits
}

// Load input code
const codeFile = program.args[0]
const code = fs.readFileSync(codeFile).toString()
const statements = parser.parse(code)

// Contains the result after interpretation
let interpretationResults = {}

if (isTest) {
  // Parse filename, get .in & .out files
  const parsedCodeFile = path.parse(codeFile)
  const dirAndName = `${parsedCodeFile.dir}/${parsedCodeFile.name}`
  let inFile = `${dirAndName}.in`
  let outFile = `${dirAndName}.out`
  const resultTestFile = `${dirAndName}.result-test`

  // Swap input and output files if test
  if (isReversed) {
    let temp = inFile
    inFile = outFile
    outFile = temp
  }

  // Load .in data
  const inData = fs.readFileSync(inFile).toString()
  const testStdin = inData.split("\n").map(s => s.trim())

  // Reverse .in (.out) buffer is reversed
  if (isReversed)
    testStdin.reverse()

  // Interpret code!
  interpretationResults = interpreter.interpret({
    statements,
    reversed: isReversed,
    verbose: isVerbose,
    stdin: testStdin,
    test: true,
  })

  // Grab stdout from interpretation
  const testStdout = interpretationResults.stdout

  // Read out data to file
  const outData = fs.readFileSync(outFile).toString()

  // Reverse out data if reversed, so it marches .in file
  if (isReversed)
    testStdout.reverse()

  // One line per item
  const resultTestData = testStdout.join('\n')

  // Check data for complete match
  if (outData === resultTestData) {
    console.log(chalk.green("Test successful!"))
  } else {
    console.error(chalk.red(`Test was an error! See: ${resultTestFile}`))
  }

  // Write results to file (for manual inspection)
  fs.writeFileSync(resultTestFile, resultTestData)

} else {
  // Interpret code!
  interpretationResults = interpreter.interpret({
    statements,
    reversed: isReversed,
    verbose: isVerbose,
  })
}

const {
  variables
} = interpretationResults

// Find all non-zero or non-empty variables
const nonZeroVariables = Object.entries(variables).filter(([k, v]) => v !== 0 && !(Array.isArray(v) && v.length === 0))

// Report an error if any was found
if (nonZeroVariables.length > 0) {
  const nonZeroVariablesText = nonZeroVariables.map(([k, v]) => `${k} (${v})`).join(', ')
  console.error(chalk.yellow(`The following variables were non-zero: ${nonZeroVariablesText}`))
}
