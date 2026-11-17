((comment) @injection.content
  (#set! injection.language "comment"))

((comment) @injection.content
  (#lua-match? @injection.content "/[*/][!*/]<?[^a-zA-Z]")
  (#set! injection.language "doxygen"))
