const fs = require('fs')
const jison = require('jison').Parser
const parser = require('./parser')
const util = require('util')
const path = require('path')
const parsed = jison(parser)
const readlineSync = require('readline-sync')
const program = require('commander')
const chalk = require('chalk')

program
  .version('0.1.0')
  .usage('[options] <file>')
  .option('-v, --verbose', 'Debug verbosity')
  .option('-t, --test', 'Run test using the adjacently placed .in and .out files')
  .option('-r, --reversed', 'Run code reversed')
  .parse(process.argv);

const variables = {}
const getVar = (name) => variables[name] || 0
const storeVar = (name, value) => variables[name] = value

const print = (value) => console.log(util.inspect(value, false, null, true))

let testStdin = []
let testStdout = []

const operations = {
  read: ([name]) => {
    if (getVar(name) !== 0)
      throw `Variable '${name}' is trying to be read, but is not zero`

    const input = testStdin.length > 0 ? testStdin.shift() : readlineSync.question()

    if (isNaN(input))
      throw `Input for variable '${name}' is not a number`

    storeVar(name, parseInt(input, 10))
  },
  print: ([name]) => {
    const value = getVar(name)
    
    if (program.test != null) {
      testStdout.push(value)
    } else {
      console.log(value)
    }

    storeVar(name, 0)
  },
  '+=': ([name, expression]) => storeVar(name, getVar(name) + evaluateExpression(expression)),
  '-=': ([name, expression]) => storeVar(name, getVar(name) - evaluateExpression(expression)),
  '+': ([a, b]) => evaluateExpression(a) + evaluateExpression(b),
  '-': ([a, b]) => evaluateExpression(a) - evaluateExpression(b),
  '*': ([a, b]) => evaluateExpression(a) * evaluateExpression(b),
  '/': ([a, b]) => parseInt(evaluateExpression(a) / evaluateExpression(b), 10),
  'var': ([name]) => getVar(name),
}

const reversedOperations = {
  read: 'print',
  print: 'read',
  '+=': '-=',
  '-=': '+=',
  /*'+': '-',
  '-': '+',
  '*': '/',
  '/': '*',*/
}

const isReversed = program.reversed != null

const evaluateExpression = (expression) => {
  if (!isNaN(expression))
    return parseInt(expression)

  let [operation, ...options] = expression

  if (!Object.keys(operations).includes(operation)) {
    console.error(`${operation} is not implemented!`)
    return 0
  }

  if (isReversed && Object.keys(reversedOperations).includes(operation)) {
    console.log(`Running ${reversedOperations[operation]} instead of ${operation}`)
    operation = reversedOperations[operation]
  }

  return operations[operation](options)
}

const interpret = (statements) => {
  print(statements)
  if (isReversed)
    statements.reverse()

  print(statements)

  for (statement of statements) {
    let [operation, ...options] = statement
    
    if (!Object.keys(operations).includes(operation)) {
      console.error(`${operation} is not implemented!`)
      continue
    }

    if (isReversed && Object.keys(reversedOperations).includes(operation)) {
      console.log(`Running ${reversedOperations[operation]} instead of ${operation}`)
      operation = reversedOperations[operation]
    }

    operations[operation](options)
  }
}


if (program.args.length == 0) {
  console.error("No file specified!")
  program.help()
}

if (program.args.length > 1) {
  throw "Multiple files specified"
  program.help()
}

const codeFile = program.args[0]
const code = fs.readFileSync(codeFile).toString()
const statements = parsed.parse(code)

// print(statements)

if (program.test != null) {
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
  testStdin = inData.split("\n").map(s => s.trim())

  if (isReversed)
    testStdin.reverse()

  interpret(statements)

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

  print(variables)
} else {
  interpret(statements)
  print(variables)
}



