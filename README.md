# tree-sitter-edl

[![CI](https://github.com/internaut401/tree-sitter-edl/actions/workflows/ci.yml/badge.svg)](https://github.com/internaut401/tree-sitter-edl/actions/workflows/ci.yml)

A [tree-sitter](https://tree-sitter.github.io/) grammar for **EDL** (Enclave Definition Language), the language
that describes the interface between an SGX enclave and its untrusted host. It provides syntax highlighting,
folding and indentation for `.edl` files.

One grammar covers both dialects:

- **Intel SGX SDK** (`sgx_edger8r`)
- **Open Enclave** (`oeedger8r`)

## What is supported

- `enclave { ... };` with `include`, `from "x.edl" import ...;` and Open Enclave's `import "x.edl"`
- `trusted` / `untrusted` blocks, `public` ECALLs, `allow(...)`, `transition_using_threads`, `propagate_errno`
- Attributes such as `[in, out, size=len, count=n, string, wstring, user_check, isptr, isary, readonly]`, plus
  the Intel calling conventions `[cdecl, stdcall, fastcall, dllimport]`
- `struct`, `union` and `enum` definitions, deep-copy attributes on struct members, and arrays
- Built-in types (`int`, `size_t`, `uint8_t`, `bool`, `unsigned long long`, ...), pointers and `const`
- Preprocessor directives, which may appear anywhere, even inside an attribute list: `#ifdef`, `#ifndef`, `#if`,
  `#elif`, `#else`, `#endif`, `#define`, `#include`, `#pragma`, ...

CI parses all 378 `.edl` files from the Intel SGX SDK, Open Enclave, oeedger8r and Teaclave SGX SDK repositories.
The only one with errors is an oeedger8r test file that is invalid on purpose.

## Neovim

These steps use the `main` branch of [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter/tree/main),
so you need what it needs: Neovim 0.12+, `tree-sitter-cli`, `curl`, `tar` and a C compiler.

**1. Register the parser.** Add this to your Neovim config: `~/.config/nvim/init.lua`, or, if you use
[lazy.nvim](https://github.com/folke/lazy.nvim), the `config` function of your nvim-treesitter plugin spec. It must
run before `require("nvim-treesitter").setup()` is called:

```lua
-- Neovim does not detect .edl files yet
vim.filetype.add({ extension = { edl = "edl" } })

vim.api.nvim_create_autocmd("User", {
  pattern = "TSUpdate",
  callback = function()
    require("nvim-treesitter.parsers").edl = {
      install_info = {
        url = "https://github.com/internaut401/tree-sitter-edl",
        queries = "queries/neovim", -- Neovim-specific highlights, folds, indents and injections
        -- revision = "v0.1.0", -- optional: pin a release instead of following main
      },
    }
  end,
})
```

**2. Install it** with `:TSInstall edl`, or add `"edl"` to the list you pass to `require("nvim-treesitter").install()`.

**3. Turn it on for EDL buffers.** nvim-treesitter's `main` branch does not do this for you. If your config
already starts treesitter in a `FileType` autocommand, you can skip this step:

```lua
vim.api.nvim_create_autocmd("FileType", {
  pattern = "edl",
  callback = function()
    vim.treesitter.start()
    vim.wo[0][0].foldmethod = "expr"
    vim.wo[0][0].foldexpr = "v:lua.vim.treesitter.foldexpr()"
    vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
  end,
})
```

Open an `.edl` file and run `:InspectTree` to see the syntax tree. `:TSUpdate` fetches the latest version.

## Other editors

`queries/highlights.scm` holds highlight queries that use the standard capture names (`@keyword`, `@type`,
`@function`, ...), for editors other than Neovim and for `tree-sitter highlight`. Neovim uses different capture
names, so its queries are kept separately in `queries/neovim/`.

## Known limitations

- The grammar checks syntax only. It does not repeat the edger8r tools' semantic checks, such as which attributes
  are valid on which types.
- A `#define` or `#pragma` on the last line of a file needs a trailing newline.
- Macros are not expanded, so EDL that only becomes valid after preprocessing (such as a macro that expands to a
  whole function declaration) will show errors.

## Development

You need [`tree-sitter-cli`](https://github.com/tree-sitter/tree-sitter/tree/master/crates/cli) 0.26 or later.

```sh
tree-sitter generate          # regenerate src/ after editing grammar.js
tree-sitter test              # corpus tests (test/corpus) and highlight tests (test/highlight)
tree-sitter parse file.edl    # print the syntax tree of a file
```

To try local changes in Neovim, replace `url` with `path` in the `install_info` from step 1, and point it at your
clone (for example `path = "~/git/tree-sitter-edl"`).
nvim-treesitter then symlinks the queries, so query edits take effect when you reopen a buffer. After a grammar
change, run `:TSInstall! edl`.

## License

[MIT](LICENSE)
