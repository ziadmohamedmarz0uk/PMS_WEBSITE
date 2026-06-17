# General Coding Rules

## Standards
- Write clean, self-documenting code.
- Strictly adhere to DRY (Don't Repeat Yourself) principles. Extract reusable logic into helper functions or services.
- **Naming Conventions**:
  - JavaScript / TypeScript: `camelCase` for variables and functions, `PascalCase` for Components, Interfaces, and Types.
  - PHP / Laravel: `camelCase` for variables and methods, `PascalCase` for Classes, `snake_case` for database columns and table names.

## API Response Structure
All APIs must return a standardized JSON structure. Do not return raw data arrays.

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully."
}
```

**Error Response:**
```json
{
  "success": false,
  "error_code": "ERR_CODE",
  "message": "Human readable error message.",
  "errors": { "field": ["validation detail"] }
}
```
