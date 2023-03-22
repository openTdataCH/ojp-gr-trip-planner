# Architecture

OJP GR Trip Planner is a [TypeScript](https://www.typescriptlang.org/) webserver, composed of the following:
- Node Core - NodeJS is used for the core functionality of this backend application   
- Tenstack Starter - The basic structure of the project comes from the [Tenstack Starter](https://github.com/filoscoder/tenstack-starter) 
  Project which provides a basic NodeJs application with Typescript.
- [OJP JavaScript SDK](https://github.com/openTdataCH/ojp-js) - The main responsibility of this Library is to communicate
  with [OJP APIs](https://opentransportdata.swiss/en/cookbook/open-journey-planner-ojp/) of the passive systems.
- Other used libraries: 
  - [Express](https://expressjs.com/) - Server-side framework for API-integration
  - [jsdom](https://github.com/jsdom/jsdom) - Emulates browser behaviour to use xml2js
  - [xml2js](https://www.npmjs.com/package/xml2js) - Parses XML to js/ts and also into the other direction
  - [xpath](https://www.npmjs.com/package/xpath) - Parses XML node-wise (is used in the OJP-SDK)


### Systems
This application does not work on its own, it is part of an ecosystem with four applications:
- [Demonstrator](https://opentdatach.github.io/ojp-demo-app/) - The frontend to generate request for this backend
- Server - This server itself aka the active system
- Passive systems - It needs at least two passive systems. With those systems the active system can perform TripRequests
  from one system to another.
  

### See also
- [Functionality and Structure](./functionality.md)