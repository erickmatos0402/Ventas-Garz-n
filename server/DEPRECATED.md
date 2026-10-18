# ⚠️ API Express retirada

Este directorio contiene la antigua API REST (Express + PostgreSQL + JWT).
La aplicación ya **no lo usa**: el cliente React habla directamente con
Supabase (Auth, Postgres y RLS).

Se conserva solo como referencia. Se puede eliminar por completo:

```bash
rm -rf server
```

La puesta en marcha actual está en [`database/supabase/SETUP.md`](../database/supabase/SETUP.md)
y en el [`README.md`](../README.md).
