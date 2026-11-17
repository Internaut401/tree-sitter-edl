; Keywords
[
  "enclave"
  "trusted"
  "untrusted"
  "allow"
] @keyword

[
  "include"
  "from"
  "import"
] @keyword.import

[
  "struct"
  "union"
  "enum"
] @keyword.type

[
  "public"
  "transition_using_threads"
  "propagate_errno"
] @keyword.modifier

(type_qualifier) @keyword.modifier

; Preprocessor
[
  "#ifdef"
  "#ifndef"
  "#if"
  "#elif"
  "#else"
  "#endif"
] @keyword.directive

"#define" @keyword.directive.define

(preproc_directive) @keyword.directive

(preproc_ifdef
  name: (identifier) @constant.macro)

(preproc_def
  name: (identifier) @constant.macro)

; Types
[
  (primitive_type)
  (sized_type_specifier)
] @type.builtin

(type_identifier) @type

; Functions
(function_declaration
  name: (identifier) @function)

; Functions named in allow(...) and in `from "x.edl" import f1, f2;`
(allow_list
  (identifier) @function)

(import_declaration
  name: (identifier) @function)

; Parameters, members and constants
(parameter
  name: (identifier) @variable.parameter)

(field_identifier) @variable.member

(enumerator
  name: (identifier) @constant)

(array_dimension
  size: (identifier) @constant)

; Attributes: [in, out, size=len, ...]
(attribute
  name: (identifier) @attribute)

(attribute
  name: (identifier) @attribute.builtin
  (#any-of? @attribute.builtin
    "in" "out" "size" "count" "string" "wstring" "user_check" "isptr" "isary" "readonly" "sizefunc"
    "cdecl" "stdcall" "fastcall" "dllimport"))

; size=len / count=n name another parameter or struct member
(parameter
  attributes: (attribute_list
    (attribute
      value: (identifier) @variable.parameter)))

(field_declaration
  attributes: (attribute_list
    (attribute
      value: (identifier) @variable.member)))

; Literals
(string_literal) @string

(include_declaration
  path: (string_literal) @string.special.path)

(import_declaration
  path: (string_literal) @string.special.path)

(number_literal) @number

(wildcard) @character.special

; Operators and punctuation
[
  (pointer)
  "="
] @operator

[
  "{"
  "}"
  "("
  ")"
  "["
  "]"
] @punctuation.bracket

[
  ";"
  ","
] @punctuation.delimiter

; Comments
(comment) @comment @spell

((comment) @comment.documentation
  (#lua-match? @comment.documentation "^/[*][*][^*].*[*]/$"))

((comment) @comment.documentation
  (#lua-match? @comment.documentation "^///[^/]"))
