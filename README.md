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
so you need what it needs: Neovim 0.12+, `curl`, `tar`, a C compiler and
[`tree-sitter-cli`](https://github.com/tree-sitter/tree-sitter/blob/master/crates/cli/README.md) 0.26.1+. nvim-treesitter
runs `tree-sitter build` to compile every parser, so the CLI is required even though this repo ships `src/parser.c`.
Install it with your package manager, `cargo install --locked tree-sitter-cli`, or a binary from the
[releases page](https://github.com/tree-sitter/tree-sitter/releases), not with npm. `:checkhealth nvim-treesitter`
reports anything that is missing.

**0. Make sure you are on nvim-treesitter's `main` branch.** The old `master` branch is frozen and has a different API.
Plugin managers keep the branch they first cloned, and lazy.nvim also records it in `lazy-lock.json`, so a config
that has used nvim-treesitter for a while is probably still on `master`, even though `main` is now the default. If
you see `attempt to call field 'install' (a nil value)`, this is the cause. With lazy.nvim, set the branch explicitly:

```lua
{
  "nvim-treesitter/nvim-treesitter",
  branch = "main",
  lazy = false,
  build = ":TSUpdate",
}
```

Then run `:Lazy sync`. For a clean switch, you can instead delete `~/.local/share/nvim/lazy/nvim-treesitter` and
restart Neovim. This also removes the parsers that `master` compiled into that directory, which are git-ignored and
would otherwise survive the switch. With Neovim's built-in `vim.pack`, use
`{ src = "https://github.com/nvim-treesitter/nvim-treesitter", version = "main" }`. Code written for `master`, such as
`require("nvim-treesitter.configs").setup({ ... })`, does not work on `main` and must be rewritten. See
nvim-treesitter's README.

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
    -- install() runs in the background, so the parser may not be there yet on first launch
    if not vim.treesitter.language.add("edl") then
      return
    end
    vim.treesitter.start()
    vim.wo[0][0].foldmethod = "expr"
    vim.wo[0][0].foldexpr = "v:lua.vim.treesitter.foldexpr()"
    vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
  end,
})
```

Open an `.edl` file and run `:InspectTree` to see the syntax tree. `:TSUpdate` fetches the latest version, or the
`revision` you pinned.

<details>
<summary>All steps together, as a lazy.nvim plugin spec</summary>

Save this as `~/.config/nvim/lua/plugins/treesitter.lua` if you use `require("lazy").setup("plugins")`. If you
already have an nvim-treesitter spec, merge this into it rather than adding a second one: lazy.nvim runs only one
`config` function per plugin.

```lua
return {
  "nvim-treesitter/nvim-treesitter",
  branch = "main",
  lazy = false,
  build = ":TSUpdate",
  config = function()
    -- 1. Register the parser
    vim.filetype.add({ extension = { edl = "edl" } })
    vim.api.nvim_create_autocmd("User", {
      pattern = "TSUpdate",
      callback = function()
        require("nvim-treesitter.parsers").edl = {
          install_info = {
            url = "https://github.com/internaut401/tree-sitter-edl",
            queries = "queries/neovim",
          },
        }
      end,
    })

    require("nvim-treesitter").setup()

    -- 2. Install it, plus any other parsers you want
    require("nvim-treesitter").install({ "edl" })

    -- 3. Turn it on for EDL buffers
    vim.api.nvim_create_autocmd("FileType", {
      pattern = "edl",
      callback = function()
        if not vim.treesitter.language.add("edl") then
          return
        end
        vim.treesitter.start()
        vim.wo[0][0].foldmethod = "expr"
        vim.wo[0][0].foldexpr = "v:lua.vim.treesitter.foldexpr()"
        vim.bo.indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
      end,
    })
  end,
}
```

</details>

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
