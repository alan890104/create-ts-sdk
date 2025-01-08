# Core

## Setup

### 1. Initialize the Project

1. Run the following command to initialize the project:
   ```bash
   pnpm init
   ```
2. Initialize a Git repository:
   ```bash
   git init
   ```

### 2. Add a `.gitignore` File

Create a `.gitignore` file and add the following content to ignore unnecessary files:

### 3. Install Dependencies

Install the necessary development dependencies:

```bash
pnpm i -D typescript @types/node prettier eslint-plugin-prettier husky lint-staged tsup ts-jest @types/jest
```

### 4. Add Scripts to `package.json`

Add the following commands under the `scripts` section in your `package.json`:

```json
{
  "name": "typescript-release-test",
  "version": "1.0.0",
  "description": "typescript release test",
  "packageManager": "pnpm@10.0.0",
  "engines": {
    "node": ">=22"
  },
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    }
  },
  "main": "dist/index.cjs",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "NODE_ENV=production tsup --config tsup.config.ts",
    "dev": "NODE_ENV=development tsup --config tsup.config.ts",
    "format": "prettier --write .",
    "lint": "eslint .",
    "lint:fix": "eslint --fix .",
    "test": "jest",
    "release": "changeset",
    "ci:publish": "pnpm build && changeset publish --access public",
    "prepare": "husky"
  },
  "publishConfig": {
    "provenance": true,
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "peerDependencies": {
    "@ton/core": "^0.59.1",
    "@ton/crypto": "^3.3.0",
    "@ton/ton": "^15.1.0"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.11",
    "@eslint/js": "^9.17.0",
    "@ton/core": "^0.59.1",
    "@ton/crypto": "^3.3.0",
    "@ton/ton": "^15.1.0",
    "@types/jest": "^29.5.14",
    "@types/node": "^22.10.5",
    "@typescript-eslint/eslint-plugin": "^8.19.1",
    "@typescript-eslint/parser": "^8.19.1",
    "eslint": "^9.17.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-prettier": "^5.2.1",
    "globals": "^15.14.0",
    "husky": "^9.1.7",
    "jest": "^29.7.0",
    "prettier": "^3.4.2",
    "ts-jest": "^29.2.5",
    "tsup": "^8.3.5",
    "typescript": "^5.7.2",
    "typescript-eslint": "^8.19.1"
  }
}
```

### 5. Configure Prettier

Create a `.prettierrc` file with the following configuration for consistent code formatting:

### 6. (Optional) Add Peer Dependencies

If you are working with TON libraries, add the following peer dependencies to your `package.json`:

Install the libraries:

```bash
pnpm i -D @ton/core @ton/crypto @ton/ton
```

Add the dependencies to the `peerDependencies` section in `package.json`:

```json
"peerDependencies": {
  "@ton/core": "^0.59.1",
  "@ton/crypto": "^3.3.0",
  "@ton/ton": "^15.1.0"
}
```

### 7. Initialize Husky

Set up Husky for Git hooks:

```bash
pnpm exec husky init
```

Replace the `.husky/pre-commit` file content with the following script:

```bash
echo 'export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

pnpm format
pnpm lint:fix' > .husky/pre-commit
```

### 8. Configure ESLint

Set up ESLint for linting:

```bash
pnpm create @eslint/config@latest
```

Manually add `eslint-plugin-prettier/recommended` to the `eslint.config.mjs` file.

### Configure Jest

```bash
npx ts-jest config:init
pnpm format
```

### Configure Changeset

```bash
pnpm i -D changeset
```

---

## Run the Project

To start the project in development mode:

```bash
pnpm dev
```

---

## Build the Project

To build the project for production:

```bash
pnpm build
```

## Ready to Release

```bash
pnpm release
```

## References

- [Changesets + PNPM](https://dev.to/wdsebastian/simplest-way-to-publish-and-automate-npm-packages-d0c)
