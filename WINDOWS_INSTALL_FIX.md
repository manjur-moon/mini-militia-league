# Windows Installation Fix

## Requirements

- Node.js 22.13.0 or newer. Node.js 22.23.1 LTS is recommended.
- npm 10 or newer.

## Important

Run all workspace installation commands from the repository root, not from `client` or `server`.

The root directory contains:

```text
client/
server/
shared/
package.json
package-lock.json
```

## Clean installation in PowerShell

Close running development servers and terminals that are using this project. Then open PowerShell in the repository root and run:

```powershell
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force client/node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force server/node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force shared/node_modules -ErrorAction SilentlyContinue
npm config set registry https://registry.npmjs.org/
npm cache verify
npm ci
```

After installation:

```powershell
Copy-Item server/.env.example server/.env
Copy-Item client/.env.example client/.env
npm run dev
```

## EPERM errors

An `EPERM` cleanup error means Windows is still holding a file inside `node_modules`. Close VS Code, stop Node processes, and retry. If necessary, restart Windows and delete the old extracted project folder before extracting a fresh copy.
