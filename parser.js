const parser = {lex: {}, operators: {}, bnf: {}}

parser.lex.rules = [
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

  // Math
  ["\\+",    "return '+'"],
  ["-",      "return '-'"],
  ["\\*",    "return '*'"],
  ["\\/",    "return '/'"],
  ["%",      "return '%'"],
  ["<",      "return '<'"],

  // Variable
  ["[A-z]+", "return 'NAME'"],
]

parser.operators = [
  ["left", "+", "-"],
  ["left", "*", "/"],
  ["left", ";"],
]

parser.bnf = {
  statements: [
    ["statement ;", "return $1"],
  ],
  statement: [
    ["statement ; statement", "$$ = $1.concat($3)"],
    ["NAME += e",  "$$ = [[$2, $1, $3]]"],
    ["NAME -= e",  "$$ = [[$2, $1, $3]]"],
    ["CALL NAME",  "$$ = [[$1, $2]]"],
    ["UNCALL NAME",  "$$ = [[$1, $2]]"],
    ["PROC NAME statement END",  "$$ = [[$1, $2]]"],
    ["READ NAME",      "$$ = [[$1, $2]]"],
    ["PRINT NAME",      "$$ = [[$1, $2]]"],
  ],
  e: [
    ["INTEGER",   "$$ = parseInt($1)"],
    ["NAME",      "$$ = ['var', $1]"],
    ["e + e",     "$$ = [$2, $1, $3]"],
    ["e - e",     "$$ = [$2, $1, $3]"],
    ["e * e",     "$$ = [$2, $1, $3]"],
    ["e / e",     "$$ = [$2, $1, $3]"],
  ],
}

module.exports = parser