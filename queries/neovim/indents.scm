[
  (enclave_definition)
  (trusted_block)
  (untrusted_block)
  (field_declaration_list)
  (enumerator_list)
] @indent.begin

([
  (parameter_list)
  (allow_list)
] @indent.align
  (#set! indent.open_delimiter "(")
  (#set! indent.close_delimiter ")"))

[
  "}"
  ")"
] @indent.branch

"}" @indent.end

[
  "#define"
  "#ifdef"
  "#ifndef"
  "#elif"
  "#if"
  "#else"
  "#endif"
] @indent.zero

(preproc_arg) @indent.ignore

(comment) @indent.auto
