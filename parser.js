const jison = require('jison').Parser
const parsingGrammar = {lex: {}, operators: {}, bnf: {}}

parsingGrammar.lex.rules = [
  // General
  ["\\s+",        "/* skip whitespace */"],
  [";",           "return ';'"],

  // Type
  ["[0-9]+",      "return 'INTEGER'"],

  // Control
  ["if",          "return 'IF'"],
  ["then",        "return 'THEN'"],
  ["else",        "return 'ELSE'"],
  ["fi",          "return 'FI'"],

  // Loop
  ["from",        "return 'FROM'"],
  ["repeat",      "return 'REPEAT'"],
  ["until",       "return 'UNTIL'"],

  // Procedure
  ["proc",        "return 'PROC'"],
  ["end",        "return 'END'"],
  ["call",        "return 'CALL'"],
  ["uncall",      "return 'UNCALL'"],

  // IO
  ["read",        "return 'READ'"],
  ["print",        "return 'PRINT'"],

  // Assignment
  ["\\+=",        "return '+='"],
  ["\\-=",        "return '-='"],
  ["\\*=",        "return '*='"],
  ["\\/=",        "return '/='"],

  // Math
  ["\\+",    "return '+'"],
  ["-",      "return '-'"],
  ["\\*",    "return '*'"],
  ["\\/",    "return '/'"],
  ["%",      "return '%'"],

  // Comparison
  ["<",      "return '<'"],
  ["!=",      "return '!='"],
  ["=",      "return '='"],

  // Variable
  ["[A-z]+", "return 'NAME'"],
]

parsingGrammar.operators = [
  ["left", "!=", "=", "<"],
  ["left", "+", "-"],
  ["left", "*", "/", "%"],
  ["left", ";"],
]

parsingGrammar.bnf = {
  statements: [
    ["statement ;", "return $1"],
  ],
  statement: [
    ["statement ; statement", "$$ = $1.concat($3)"],
    ["NAME += e",  "$$ = [[$2, $1, $3]]"],
    ["NAME -= e",  "$$ = [[$2, $1, $3]]"],
    ["NAME *= e",  "$$ = [[$2, $1, $3]]"],
    ["NAME /= e",  "$$ = [[$2, $1, $3]]"],
    ["CALL NAME",  "$$ = [[$1, $2]]"],
    ["UNCALL NAME",  "$$ = [[$1, $2]]"],
    ["PROC NAME statement ; END",  "$$ = [[$1, $2, $3]]"],
    ["READ NAME",      "$$ = [[$1, $2]]"],
    ["PRINT NAME",      "$$ = [[$1, $2]]"],
    ["IF e THEN statement ELSE statement FI e", "$$ = [[$1, $2, $4, $6, $8]]"],
    ["FROM e REPEAT statement ; UNTIL e", "$$ = [[$3, $2, $4, $7]]"],
  ],
  e: [
    ["INTEGER",   "$$ = parseInt($1)"],
    ["NAME",      "$$ = ['var', $1]"],
    ["e + e",     "$$ = [$2, $1, $3]"],
    ["e - e",     "$$ = [$2, $1, $3]"],
    ["e * e",     "$$ = [$2, $1, $3]"],
    ["e / e",     "$$ = [$2, $1, $3]"],
    ["e % e",     "$$ = [$2, $1, $3]"],
    ["e < e",     "$$ = [$2, $1, $3]"],
    ["e != e",     "$$ = [$2, $1, $3]"],
    ["e = e",     "$$ = [$2, $1, $3]"],
  ],
}

module.exports = jison(parsingGrammar)