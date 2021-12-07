package plancontext

import (
	"fmt"
	"sync"

	"cuelang.org/go/cue"
	"go.dagger.io/dagger/compiler"
	"go.dagger.io/dagger/stdlib"
)

var (
	secretIDPath = cue.MakePath(
		cue.Hid("_secret", stdlib.PackageName),
		cue.Str("id"),
	)
)

type Secret struct {
	id        string
	plainText string
}

func (s *Secret) ID() string {
	return s.id
}

func (s *Secret) PlainText() string {
	return s.plainText
}

func (s *Secret) Value() *compiler.Value {
	v := compiler.NewValue()
	if err := v.FillPath(secretIDPath, s.id); err != nil {
		panic(err)
	}
	return v
}

type secretContext struct {
	l     sync.RWMutex
	store map[string]*Secret
}

func (c *secretContext) New(plaintext string) *Secret {
	secret := &Secret{
		id:        hashID(plaintext),
		plainText: plaintext,
	}

	c.l.Lock()
	defer c.l.Unlock()

	c.store[secret.id] = secret
	return secret
}

func (c *secretContext) Contains(v *compiler.Value) bool {
	return v.LookupPath(secretIDPath).Exists()
}

func (c *secretContext) FromValue(v *compiler.Value) (*Secret, error) {
	c.l.RLock()
	defer c.l.RUnlock()

	id, err := v.LookupPath(secretIDPath).String()
	if err != nil {
		return nil, fmt.Errorf("invalid secret %q: %w", v.Path(), err)
	}

	secret, ok := c.store[id]
	if !ok {
		return nil, fmt.Errorf("secret %q not found", id)
	}

	return secret, nil
}

func (c *secretContext) Get(id string) *Secret {
	c.l.RLock()
	defer c.l.RUnlock()

	return c.store[id]
}

func (c *secretContext) List() []*Secret {
	c.l.RLock()
	defer c.l.RUnlock()

	secrets := make([]*Secret, 0, len(c.store))
	for _, s := range c.store {
		secrets = append(secrets, s)
	}

	return secrets
}
