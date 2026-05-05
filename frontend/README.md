# Frontend Packages

This frontend uses **React** with **Vite**.

## Important files

### `package.json`

Defines the frontend project.

Contains:

- project scripts
- dependencies
- dev dependencies

Common scripts:

```bash
npm run dev
npm run build
npm run preview
```

Do not delete this file.

---

### `package-lock.json`

Locks exact package versions.

This helps all team members install the same versions.

Commit this file to GitHub.

Do not edit it manually.

---

### `node_modules`

Contains installed packages.

Created automatically with:

```bash
npm install
```

Do not edit it manually.

Do not commit it to GitHub.

---

## Dependencies

### `dependencies`

Packages needed by the app.

Examples:

```text
react
react-dom
```

Later we may add:

```text
axios
react-router-dom
```

### `devDependencies`

Packages needed only for development/building.

Examples:

```text
vite
@vitejs/plugin-react
eslint
```

---

## Useful commands

Install packages:

```bash
npm install
```

Start frontend:

```bash
npm run dev
```

Build frontend:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

---

## GitHub rules

Commit:

```text
package.json
package-lock.json
```

Do not commit:

```text
node_modules/
dist/
.env
```

Recommended `.gitignore`:

```gitignore
node_modules
dist
.env
```

---

## Local URLs

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:8080
```