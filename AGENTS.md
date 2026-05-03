## Coding Conventions
  - **Hungarian Notation**: Use this notation for variable naming
  - **camelCase**: Use camelCase when naming all variables 
  - **Async Javascript**: Prefer to use async await ranther than . then when performing asynchornus javascript functions
  - **No Build Tools**: Avoid build tools such as babel, Webpack, or Vite unless it is explicitly required. Code must run either directly in the browser or via nodeJS
  - **Dependencies**: Do not add external libraries such as jQuery without approval. Prefer native Web APIs
  - **ECMAScript Version**: Target ES6+ features including arrow functions and template literals as well as promises
  - **External Libraries Local**: All external libraries that are included must not use a CDN but rather be included in project source files
  - **Bootstrap Utility Classes**: Use only standard Bootstrap 5+ utility classes for layout, spacing, and colors. Avoid creating custom CSS classes or inline styles unless the design cannot be achieved without them

## Accessibility
  - **Standards**: All user interfaces must WCAG 2.1+ accesibility standards
  - **Alt tags**: All images must also have an alt tag attribute that describes the image
  - **Priority**: Prioritze accessibility over design
  - **ARIA Labels**: Include aria labels on ALL HTML form controls 
  - **Frontend ERROR handling**: All errors that the user can see from the front end should use SWALfire to display the error for the user

## Project Structure
  - **Entry Point**: All nodeJS applications must use server.js for entry point
  - **API Routes**: All routes must be included in the /api/routing

## API Requirements
  - **RESTful**: All API routes shoud be RESTful in design
  - **Updates**: ALL UPDATE routes should use PUT rather than PATCH
  - **DELETE**: DELETE routes should use URL parameters for primary key indicators 
  - **SELECT**: All user inputes for SELECT should be passed biar URL query strings
  - **CREATE**: All user inputes for CREATES should be passed as JSON body data
  - **Input Validation**: All user-passed inputs should be validated 
  - **SELECT RETURN**: All SELECT shoud return JSON arrays 
  - **Status Codes**: Every route should return appropriate HTTP status codes for both success and error

## DO NOT
  - Do not hardcode credentials 
  - Do not intermix user inputs in queries, require prepared statements 
  - Do not skip input validation 

## Decision Guidelines 
  - Prefer simpler, less complex and maintainable code 
  - Ask for clarification if uncertain

## Testing
  - Ensure ALL GET API routes return JSON arrays 
  - Handle any missing inpute data with proper error messaging 
  - POST and PUT routes should validate all required fields