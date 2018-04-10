const fs = require('fs')
const readlineSync = require('readline-sync')
const util = require('util')

// Global tables
let variables = {}
let procedures = {}
let protectedVar = null

// Utilities
const getVar = (name) => {
  if (name === protectedVar)
    throw `Variable ${name} was used on the right hand of its own assigning`

  return variables[name] || 0
}
const storeVar = (name, value) => variables[name] = value
const print = (title, value) => console.log(title, util.inspect(value, false, null, true))
const printVerbose = (title, value) => isVerbose ? print(title, value) : null
const protectVar = (name, func, ...args) => {
  protectedVar = name
  let result = func(...args)
  protectedVar = null
  return result
}

// Test IO
let testStdin = []
let testStdout = []

// Run configuration
let isReversed = false
let isVerbose = false
let isTest = false

// Supported operations
const operations = {
  read: ([name]) => {
    const existingValue = getVar(name)
    if (existingValue !== 0)
      throw `Variable '${name}' is trying to be read, but is not zero (${existingValue})`

    const input = testStdin.length > 0 ? testStdin.shift() : readlineSync.question()

    if (isNaN(input))
      throw `Input for variable '${name}' is not a number`

    storeVar(name, parseInt(input, 10))
  },
  print: ([name]) => {
    const value = getVar(name)
    
    if (isTest != null) {
      testStdout.push(value)
    } else {
      console.log(value)
    }

    storeVar(name, 0)
  },
  if: ([ifExp, thenStat, elseStat, fiExp]) => {
    const beforeResult = isReversed ? evaluateExpression(fiExp) : evaluateExpression(ifExp)

    if (beforeResult) {
      interpretStatement(thenStat[0])
    } else {
      interpretStatement(elseStat[0])
    }

    const afterResult = isReversed ?  evaluateExpression(ifExp) : evaluateExpression(fiExp)

    if (afterResult != beforeResult)
      throw `If statement pre-condition does not match post-assertion!`
  },
  repeat: ([initialExp, loopStatement, loopExp]) => {
    if (!evaluateExpression(isReversed ? loopExp : initialExp))
      throw `Initial loop expression false: ${util.inspect(isReversed ? loopExp : initialExp)} ${util.inspect(variables)}`

    do {
      interpretStatements(loopStatement)
      printVerbose("Loop variables: ", variables)

    } while (!evaluateExpression(isReversed ? initialExp : loopExp))
  },
  '+=': ([name, expression]) => storeVar(name, getVar(name) + protectVar(name, evaluateExpression, expression)),
  '-=': ([name, expression]) => storeVar(name, getVar(name) - protectVar(name, evaluateExpression, expression)),
  '*=': ([name, expression]) => storeVar(name, getVar(name) * protectVar(name, evaluateExpression, expression)),
  '/=': ([name, expression]) => storeVar(name, parseInt(getVar(name) / protectVar(name, evaluateExpression, expression), 10)),
  '+': ([a, b]) => evaluateExpression(a) + evaluateExpression(b),
  '-': ([a, b]) => evaluateExpression(a) - evaluateExpression(b),
  '*': ([a, b]) => evaluateExpression(a) * evaluateExpression(b),
  '/': ([a, b]) => parseInt(evaluateExpression(a) / evaluateExpression(b), 10),
  '%': ([a, b]) => evaluateExpression(a) % evaluateExpression(b),
  '=': ([a, b]) => evaluateExpression(a) == evaluateExpression(b) ? 1 : 0, // Output 1,0 instead of true,false
  '!=': ([a, b]) => evaluateExpression(a) != evaluateExpression(b) ? 1 : 0, // Output 1,0 instead of true,false
  '<': ([a, b]) => evaluateExpression(a) < evaluateExpression(b) ? 1 : 0,
  'var': ([name]) => getVar(name),
  'proc': () => null,
  'call': ([name]) => {
    if (!Object.keys(procedures).includes(name))
      throw `Procedure ${name} is not defined!`

    const procedureStatements = procedures[name]
    return interpretStatements(procedureStatements)
  },
  'uncall': ([name]) => {
    if (!Object.keys(procedures).includes(name))
      throw `Procedure ${name} is not defined!`

    const procedureStatements = procedures[name]
    isReversed = !isReversed
    const result =  interpretStatements(procedureStatements)
    isReversed = !isReversed
    return result
  }
}

// Operations that should be substituted when reversed
const reversedOperations = {
  read: 'print',
  print: 'read',
  '+=': '-=',
  '-=': '+=',
  '*=': '/=',
  '/=': '*=',
}

// Interpret a whole code file
// (as we need to scan for procedures in this case)
const interpret = ({
  statements,
  reversed = false,
  verbose = false,
  stdin = [],
  test = false,
}) => {
  variables = {}
  procedures = {}
  isReversed = reversed
  isVerbose = verbose

  if (test)
    testStdin = stdin

  scanProcedures(statements)
  interpretStatements(statements)
  
  return {stdout: testStdout, variables}
}

// Interpret multiple statements
const interpretStatements = (statements, reversed = false) => {
  if (isReversed)
    statements.reverse()

  for (statement of statements) {
    interpretStatement(statement)
  }
}

// Interpret a single statement
const interpretStatement = (statement) => {
  let [operation, ...options] = statement
  
  if (!Object.keys(operations).includes(operation)) {
    console.error(`${operation} is not implemented!`)
    return
  }

  if (isReversed && Object.keys(reversedOperations).includes(operation)) {
    if (isVerbose)
      console.log(`Running ${reversedOperations[operation]} instead of ${operation}`)
    operation = reversedOperations[operation]
  }

  operations[operation](options)
}

// Recursively evaluate an expression
const evaluateExpression = (expression) => {
  if (!isNaN(expression))
    return parseInt(expression)

  let [operation, ...options] = expression

  if (!Object.keys(operations).includes(operation)) {
    console.error(`${operation} is not implemented!`)
    return 0
  }

  if (isReversed && Object.keys(reversedOperations).includes(operation)) {
    if (isVerbose)
      console.log(`Running ${reversedOperations[operation]} instead of ${operation}`)
    operation = reversedOperations[operation]
  }

  return operations[operation](options)
}

// Scan for procedures in a file (statements)
const scanProcedures = (statements) => {
  for (statement of statements) {
    const [operation, ...options] = statement

    if (operation === 'proc') {
      const [name, procedureStatements] = options
      if (Object.keys(procedures).includes(name))
        throw `Procedure ${name} is defined multiple times!`

      procedures[name] = procedureStatements
    }
  }
}

module.exports = {interpret}