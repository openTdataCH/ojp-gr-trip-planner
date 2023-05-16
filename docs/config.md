# Config Settings

### Server Settings

`package.json`

- path: [./package.json](./../package.json)
- the dependencies used to build and run the application
- the scripts to run, build, test the application

`tsconfig.json`

- path: [./tsconfig.json](./../tsconfig.json)
- TypeScript related settings

### Custom Settings
  
  `config.ts`

- path: [./src/config/index.ts](./../src/config/index.ts)
- configure all the static parameters of the server.

`passiveSystems.ts`

- path: [./src/config/passiveSystems.ts](./../src/config/passiveSystems.ts)
- defines the passive systems to work with

### Non-Functional Settings

`.eslintrc`

- path: [./../.eslintrc](./../.eslintrc)
- defines the esLint settings

`.prettierrc`

- path: [./../.prettierrc](./../.prettierrc)
- defines the prettier settings

`tslint.json`

- path: [./../tslint.json](./../tslint.json)
- defines the tsLint settings. This is similar to esLint but ts specific