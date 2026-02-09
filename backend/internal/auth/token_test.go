package auth

import (
	"testing"
	"time"
)

func TestCreateAndValidateToken(t *testing.T) {
	secret := "test-secret-key"
	userID := "user-123"

	token, err := CreateToken(secret, userID)
	if err != nil {
		t.Fatalf("CreateToken failed: %v", err)
	}
	if token == "" {
		t.Fatal("token is empty")
	}

	claims, err := ValidateToken(secret, token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}
	if claims.UserID != userID {
		t.Errorf("expected userID %q, got %q", userID, claims.UserID)
	}
}

func TestValidateTokenWrongSecret(t *testing.T) {
	token, err := CreateToken("secret-a", "user-1")
	if err != nil {
		t.Fatalf("CreateToken failed: %v", err)
	}

	_, err = ValidateToken("secret-b", token)
	if err == nil {
		t.Fatal("expected error for wrong secret")
	}
}

func TestValidateTokenGarbage(t *testing.T) {
	_, err := ValidateToken("secret", "not-a-valid-token")
	if err == nil {
		t.Fatal("expected error for garbage token")
	}
}

func TestTokenExpiry(t *testing.T) {
	secret := "test-secret"
	token, err := CreateToken(secret, "user-1")
	if err != nil {
		t.Fatalf("CreateToken failed: %v", err)
	}

	claims, err := ValidateToken(secret, token)
	if err != nil {
		t.Fatalf("ValidateToken failed: %v", err)
	}

	// Token should expire in ~30 days
	expiry := claims.ExpiresAt.Time
	expected := time.Now().Add(30 * 24 * time.Hour)
	diff := expiry.Sub(expected)
	if diff < -time.Minute || diff > time.Minute {
		t.Errorf("expiry too far from expected: diff=%v", diff)
	}
}
