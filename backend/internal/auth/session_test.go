package auth

import (
	"context"
	"testing"
)

func TestUserIDContext(t *testing.T) {
	ctx := context.Background()
	if id := UserIDFromContext(ctx); id != "" {
		t.Errorf("expected empty, got %q", id)
	}

	ctx = WithUserID(ctx, "user-42")
	if id := UserIDFromContext(ctx); id != "user-42" {
		t.Errorf("expected user-42, got %q", id)
	}
}
