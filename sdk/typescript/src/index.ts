export { gql } from "graphql-tag"
export { GraphQLClient } from "graphql-request"

// Default client bindings
export * from "./api/client.gen.js"

// Common errors
export * from "./common/errors/index.js"

// Connection for library
export type { CallbackFct } from "./connect.js"
export { connect, close } from "./connect.js"
export type { ConnectOpts } from "./connectOpts.js"

// Module library
export * from "./module/decorators/index.js"
export { entrypoint } from "./module/entrypoint/entrypoint.js"