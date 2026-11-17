package tree_sitter_edl_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_edl "github.com/internaut401/tree-sitter-edl/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_edl.Language())
	if language == nil {
		t.Errorf("Error loading EDL grammar")
	}
}
