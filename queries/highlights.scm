[
  "enclave"
  "trusted"
  "untrusted"
  "allow"
  "include"
  "from"
  "import"
  "struct"
  "union"
  "enum"
  "public"
  "transition_using_threads"
  "propagate_errno"
  (type_qualifier)
] @keyword

[
  "#ifdef"
  "#ifndef"
  "#if"
  "#elif"
  "#else"
  "#endif"
  "#define"
  (preproc_directive)
] @keyword

(preproc_ifdef
  name: (identifier) @constant)

(preproc_def
  name: (identifier) @constant)

[
  (primitive_type)
  (sized_type_specifier)
] @type.builtin

(type_identifier) @type

(function_declaration
  name: (identifier) @function)

(allow_list
  (identifier) @function)

(import_declaration
  name: (identifier) @function)

(parameter
  name: (identifier) @variable.parameter)

(field_identifier) @property

(enumerator
  name: (identifier) @constant)

(array_dimension
  size: (identifier) @constant)

(attribute
  name: (identifier) @attribute)

(parameter
  attributes: (attribute_list
    (attribute
      value: (identifier) @variable.parameter)))

(field_declaration
  attributes: (attribute_list
    (attribute
      value: (identifier) @property)))

(string_literal) @string

(include_declaration
  path: (string_literal) @string.special)

(import_declaration
  path: (string_literal) @string.special)

(number_literal) @number

(wildcard) @operator

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

(comment) @comment
