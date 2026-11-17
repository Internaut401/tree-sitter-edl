/**
 * @file Enclave Definition Language (EDL) grammar for tree-sitter (Intel SGX SDK and Open Enclave)
 * @author Marco Negro
 * @license MIT
 *
 * EDL describes the interface between an enclave and the untrusted host:
 * the trusted functions (ECALLs), the untrusted functions (OCALLs), and the
 * types they exchange. This grammar accepts the union of the dialects read by
 * Intel's `sgx_edger8r` and Open Enclave's `oeedger8r`. It is meant for
 * editors: it accepts what the tools accept and is lenient where that helps
 * while typing, but it does not repeat the tools' semantic checks (e.g. which
 * pointer attributes are valid for which types).
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PRIMITIVE_TYPES = [
  'void',
  'char',
  'int',
  'float',
  'double',
  'bool',
  'size_t',
  'wchar_t',
  'int8_t',
  'int16_t',
  'int32_t',
  'int64_t',
  'uint8_t',
  'uint16_t',
  'uint32_t',
  'uint64_t',
];

/**
 * A preprocessor directive keyword such as `#ifdef`, allowing blanks after `#`.
 *
 * @param {string} command
 */
const directive = (command) =>
  alias(token(prec(1, new RegExp('#[ \\t]*' + command))), '#' + command);

/**
 * One or more `rule`s separated by commas.
 *
 * @param {RuleOrLiteral} rule
 */
const commaSep1 = (rule) => seq(rule, repeat(seq(',', rule)));

export default grammar({
  name: 'edl',

  // Directives may appear between any two tokens: Open Enclave's oeedger8r
  // processes them at token level, and Intel's sgx_edger8r runs the file
  // through the C preprocessor first.
  extras: ($) => [
    /\s/,
    $.comment,
    $.preproc_ifdef,
    $.preproc_if,
    $.preproc_else,
    $.preproc_endif,
    $.preproc_def,
    $.preproc_call,
  ],

  word: ($) => $.identifier,

  rules: {
    source_file: ($) => repeat($.enclave_definition),

    enclave_definition: ($) =>
      seq('enclave', '{', repeat($._enclave_item), '}', optional(';')),

    _enclave_item: ($) =>
      choice(
        $.include_declaration,
        $.import_declaration,
        $.struct_definition,
        $.union_definition,
        $.enum_definition,
        $.trusted_block,
        $.untrusted_block,
      ),

    // include "header.h"
    include_declaration: ($) =>
      seq('include', field('path', $.string_literal), optional(';')),

    // from "file.edl" import *;
    // from "file.edl" import f1, f2;
    // import "file.edl"            (Open Enclave)
    import_declaration: ($) =>
      choice(
        seq(
          'from',
          field('path', $.string_literal),
          'import',
          choice(alias('*', $.wildcard), commaSep1(field('name', $.identifier))),
          ';',
        ),
        seq('import', field('path', $.string_literal), optional(';')),
      ),

    // ------------------------------------------------------------------
    // trusted { ... };  untrusted { ... };

    trusted_block: ($) =>
      seq(
        'trusted',
        '{',
        repeat(choice($.include_declaration, $.function_declaration)),
        '}',
        ';',
      ),

    untrusted_block: ($) =>
      seq(
        'untrusted',
        '{',
        repeat(choice($.include_declaration, $.function_declaration)),
        '}',
        ';',
      ),

    // public void ecall_foo([in, size=len] const uint8_t* buf, size_t len);
    // [cdecl] int ocall_bar(void) allow(ecall_foo) propagate_errno;
    function_declaration: ($) =>
      seq(
        optional('public'),
        optional(field('attributes', $.attribute_list)),
        $._type,
        field('name', $.identifier),
        field('parameters', $.parameter_list),
        optional(field('allow', $.allow_list)),
        repeat(field('modifier', $.function_modifier)),
        ';',
      ),

    function_modifier: (_) => choice('transition_using_threads', 'propagate_errno'),

    parameter_list: ($) => seq('(', optional(commaSep1($.parameter)), ')'),

    // The name is optional so that `(void)` and incomplete code parse cleanly.
    parameter: ($) =>
      seq(
        optional(field('attributes', $.attribute_list)),
        $._type,
        optional(
          seq(field('name', $.identifier), repeat(field('dimension', $.array_dimension))),
        ),
      ),

    // allow(ecall_a, ecall_b)
    allow_list: ($) => seq('allow', '(', optional(commaSep1($.identifier)), ')'),

    // [in, out, size=len, count=4, string, user_check, isptr, readonly, ...]
    attribute_list: ($) => seq('[', optional(commaSep1($.attribute)), ']'),

    attribute: ($) =>
      seq(
        field('name', $.identifier),
        optional(seq('=', field('value', choice($.identifier, $.number_literal)))),
      ),

    array_dimension: ($) =>
      seq('[', optional(field('size', choice($.number_literal, $.identifier))), ']'),

    // ------------------------------------------------------------------
    // Types

    _type: ($) =>
      seq(
        optional($.type_qualifier),
        field('type', $._type_specifier),
        repeat(alias('*', $.pointer)),
      ),

    type_qualifier: (_) => 'const',

    _type_specifier: ($) =>
      choice(
        $.primitive_type,
        $.sized_type_specifier,
        $.struct_specifier,
        $.union_specifier,
        $.enum_specifier,
        alias($.identifier, $.type_identifier),
      ),

    primitive_type: (_) => choice(...PRIMITIVE_TYPES),

    // unsigned, long long, unsigned short int, long double, ...
    sized_type_specifier: ($) =>
      prec.right(
        seq(
          repeat1(choice('signed', 'unsigned', 'long', 'short')),
          optional(field('type', $.primitive_type)),
        ),
      ),

    struct_specifier: ($) => seq('struct', field('name', alias($.identifier, $.type_identifier))),
    union_specifier: ($) => seq('union', field('name', alias($.identifier, $.type_identifier))),
    enum_specifier: ($) => seq('enum', field('name', alias($.identifier, $.type_identifier))),

    // ------------------------------------------------------------------
    // Type definitions

    struct_definition: ($) =>
      seq(
        'struct',
        field('name', alias($.identifier, $.type_identifier)),
        field('body', $.field_declaration_list),
        ';',
      ),

    union_definition: ($) =>
      seq(
        'union',
        field('name', alias($.identifier, $.type_identifier)),
        field('body', $.field_declaration_list),
        ';',
      ),

    // Open Enclave allows the `;` after the last member to be omitted.
    field_declaration_list: ($) =>
      seq('{', repeat(seq($.field_declaration, ';')), optional($.field_declaration), '}'),

    field_declaration: ($) =>
      seq(
        optional(field('attributes', $.attribute_list)),
        $._type,
        field('name', alias($.identifier, $.field_identifier)),
        repeat(field('dimension', $.array_dimension)),
      ),

    enum_definition: ($) =>
      seq(
        'enum',
        optional(field('name', alias($.identifier, $.type_identifier))),
        field('body', $.enumerator_list),
        ';',
      ),

    enumerator_list: ($) =>
      seq('{', optional(seq(commaSep1($.enumerator), optional(','))), '}'),

    enumerator: ($) =>
      seq(
        field('name', $.identifier),
        optional(seq('=', field('value', choice($.number_literal, $.identifier)))),
      ),

    // ------------------------------------------------------------------
    // Preprocessor directives (extras)

    // #ifdef NAME / #ifndef NAME
    preproc_ifdef: ($) =>
      seq(choice(directive('ifdef'), directive('ifndef')), field('name', $.identifier)),

    // #if EXPR / #elif EXPR
    preproc_if: ($) =>
      seq(choice(directive('if'), directive('elif')), field('condition', $.preproc_arg)),

    preproc_else: (_) => directive('else'),

    preproc_endif: (_) => directive('endif'),

    // #define NAME [VALUE]
    preproc_def: ($) =>
      seq(
        directive('define'),
        field('name', $.identifier),
        optional(field('value', $.preproc_arg)),
        $._preproc_eol,
      ),

    // Any other directive: #undef, #include, #pragma, #error, #warning, #line, ...
    preproc_call: ($) =>
      seq(
        field('directive', $.preproc_directive),
        optional(field('argument', $.preproc_arg)),
        $._preproc_eol,
      ),

    // Extras must have an unambiguous end, so directives with an optional
    // argument are terminated by the end of their line. The precedence makes
    // the line end win over a directive starting on the next line (which would
    // otherwise be lexed as a longer match and nested inside this one).
    _preproc_eol: (_) => token.immediate(prec(2, /[ \t]*\r?\n/)),

    preproc_directive: (_) => /#[ \t]*[a-zA-Z_]\w*/,

    // The rest of the directive's line, with backslash continuations. It is
    // immediate so that it can never swallow the following line.
    preproc_arg: (_) => token.immediate(prec(-1, /[ \t]+[^\s\\](\\\r?\n|[^\n])*/)),

    // ------------------------------------------------------------------
    // Terminals

    identifier: (_) => /[a-zA-Z_]\w*/,

    number_literal: (_) => /0[xX][0-9a-fA-F]+|[0-9]+/,

    string_literal: (_) => token(seq('"', /[^"\n]*/, '"')),

    comment: (_) =>
      token(choice(seq('//', /[^\n]*/), seq('/*', /[^*]*\*+([^/*][^*]*\*+)*/, '/'))),
  },
});
