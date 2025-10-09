# GraphQL Resolvers Documentation

Generated from schema files in `backend/schema` and resolver modules in `backend/resolvers`.

## Query

### _empty

**Return type**: String

**Resolver implementation**: `— (no custom resolver found)`

### getBooksInLibrary

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedBooksInLibrary!

**Resolver implementation**: `bookhaslibrary.js`

### getBookInLibrary

**Arguments**

- `id_book_library` : ID!

**Return type**: BookHasLibrary

**Resolver implementation**: `bookhaslibrary.js`

### searchBooksInLibrary

**Arguments**

- `titleOrAuthor` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedBooksInLibrary!

**Resolver implementation**: `bookhaslibrary.js`

### getBooks

**Arguments**

- `pagination` : PaginationInput
- `filter` : BookFilter
- `sort` : BookSort

**Return type**: BookConnection!

**Resolver implementation**: `books.js`

### getBook

**Arguments**

- `id_book` : ID!

**Return type**: Book

**Resolver implementation**: `books.js`

### searchBooks

**Arguments**

- `titleOrAuthor` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedBooks

**Resolver implementation**: `books.js`

### getLibraries

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedLibraries

**Resolver implementation**: `libraries.js`

### getUserLibraries

**Arguments**

- `id_user` : ID!

**Return type**: [Library!]!

**Resolver implementation**: `libraries.js`

### getLibrary

**Arguments**

- `id_library` : ID!

**Return type**: Library

**Resolver implementation**: `libraries.js`

### searchLibraries

**Arguments**

- `name` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedLibraries

**Resolver implementation**: `libraries.js`

### getMessages

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedMessages

**Resolver implementation**: `messages.js`

### getMessage

**Arguments**

- `id_message` : ID!

**Return type**: Message

**Resolver implementation**: `messages.js`

### searchMessages

**Arguments**

- `content` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedMessages

**Resolver implementation**: `messages.js`

### getPermissions

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedPermissions

**Resolver implementation**: `permissions.js`

### getPermission

**Arguments**

- `id_permission` : ID!

**Return type**: Permission

**Resolver implementation**: `permissions.js`

### searchPermissions

**Arguments**

- `id_permission` : Int!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedPermissions!

**Resolver implementation**: `permissions.js`

### getReports

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedReports!

**Resolver implementation**: `reports.js`

### getReport

**Arguments**

- `id_report` : ID!

**Return type**: Report

**Resolver implementation**: `reports.js`

### searchReports

**Arguments**

- `content` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedReports!

**Resolver implementation**: `reports.js`

### getReviews

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedReviews

**Resolver implementation**: `reviews.js`

### getReview

**Arguments**

- `id_review` : ID!

**Return type**: Review

**Resolver implementation**: `reviews.js`

### searchReviews

**Arguments**

- `content` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedReviews

**Resolver implementation**: `reviews.js`

### getRoles

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedRoles

**Resolver implementation**: `roles.js`

### getRole

**Arguments**

- `id_role` : ID!

**Return type**: Role

**Resolver implementation**: `roles.js`

### searchRoles

**Arguments**

- `role_name` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedRoles!

**Resolver implementation**: `roles.js`

### getPermissionsRoles

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedRoleHasPermissions

**Resolver implementation**: `Roleshaspermission.js`

### getPermissionRole

**Arguments**

- `id_permission_role` : ID!

**Return type**: RoleHasPermissions

**Resolver implementation**: `Roleshaspermission.js`

### searchPermissionsRoles

**Arguments**

- `name` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedRoleHasPermissions!

**Resolver implementation**: `Roleshaspermission.js`

### getUsers

**Arguments**

- `limit` : Int
- `offset` : Int
- `order` : String
- `direction` : String

**Return type**: PaginatedUsers

**Resolver implementation**: `users.js`

### getUser

**Arguments**

- `id_user` : ID!

**Return type**: User

**Resolver implementation**: `users.js`

### searchUsers

**Arguments**

- `nameOrPseudo` : String!
- `limit` : Int
- `offset` : Int

**Return type**: PaginatedUsers

**Resolver implementation**: `users.js`

### today

**Return type**: Date

**Resolver implementation**: `— (no custom resolver found)`

## Mutation

### _empty

**Return type**: String

**Resolver implementation**: `— (no custom resolver found)`

### addBookHasLibrary

**Arguments**

- `input` : CreateBookHasLibraryInput!

**Return type**: BookHasLibrary!

**Resolver implementation**: `bookhaslibrary.js`

### updateBookHasLibrary

**Arguments**

- `input` : UpdateBookHasLibraryInput!

**Return type**: BookHasLibrary!

**Resolver implementation**: `bookhaslibrary.js`

### deleteBookHasLibrary

**Arguments**

- `input` : DeleteBookHasLibraryInput!

**Return type**: Boolean!

**Resolver implementation**: `bookhaslibrary.js`

### addBooksToLibrary

**Arguments**

- `input` : AddBooksToLibraryInput!

**Return type**: [BookHasLibrary!]!

**Resolver implementation**: `bookhaslibrary.js`

### removeBooksFromLibrary

**Arguments**

- `input` : RemoveBooksFromLibraryInput!

**Return type**: Boolean!

**Resolver implementation**: `bookhaslibrary.js`

### addBook

**Arguments**

- `input` : CreateBookInput!

**Return type**: Book!

**Resolver implementation**: `books.js`

### updateBook

**Arguments**

- `input` : UpdateBookInput!

**Return type**: Book!

**Resolver implementation**: `books.js`

### deleteBook

**Arguments**

- `input` : DeleteBookInput!

**Return type**: Boolean!

**Resolver implementation**: `books.js`

### addLibrary

**Arguments**

- `input` : CreateLibraryInput!

**Return type**: Library!

**Resolver implementation**: `libraries.js`

### updateLibrary

**Arguments**

- `input` : UpdateLibraryInput!

**Return type**: Library!

**Resolver implementation**: `libraries.js`

### deleteLibrary

**Arguments**

- `input` : DeleteLibraryInput!

**Return type**: Boolean!

**Resolver implementation**: `libraries.js`

### deleteAllLibrariesFromUser

**Arguments**

- `id_user` : ID!

**Return type**: Boolean!

**Resolver implementation**: `libraries.js`

### addMessage

**Arguments**

- `input` : CreateMessageInput!

**Return type**: Message!

**Resolver implementation**: `messages.js`

### updateMessage

**Arguments**

- `input` : UpdateMessageInput!

**Return type**: Message!

**Resolver implementation**: `messages.js`

### deleteMessage

**Arguments**

- `input` : DeleteMessageInput!

**Return type**: Boolean!

**Resolver implementation**: `messages.js`

### markMessageAsRead

**Arguments**

- `input` : MarkMessageAsReadInput!

**Return type**: Message!

**Resolver implementation**: `messages.js`

### addPermission

**Arguments**

- `input` : CreatePermissionInput!

**Return type**: Permission!

**Resolver implementation**: `permissions.js`

### updatePermission

**Arguments**

- `input` : UpdatePermissionInput!

**Return type**: Permission!

**Resolver implementation**: `permissions.js`

### deletePermission

**Arguments**

- `input` : DeletePermissionInput!

**Return type**: Boolean!

**Resolver implementation**: `permissions.js`

### addReport

**Arguments**

- `input` : CreateReportInput!

**Return type**: Report!

**Resolver implementation**: `reports.js`

### updateReport

**Arguments**

- `input` : UpdateReportInput!

**Return type**: Report!

**Resolver implementation**: `reports.js`

### deleteReport

**Arguments**

- `input` : DeleteReportInput!

**Return type**: Boolean!

**Resolver implementation**: `reports.js`

### addReview

**Arguments**

- `input` : CreateReviewInput!

**Return type**: Review!

**Resolver implementation**: `reviews.js`

### updateReview

**Arguments**

- `input` : UpdateReviewInput!

**Return type**: Review!

**Resolver implementation**: `reviews.js`

### deleteReview

**Arguments**

- `input` : DeleteReviewInput!

**Return type**: Boolean!

**Resolver implementation**: `reviews.js`

### addRole

**Arguments**

- `input` : CreateRoleInput!

**Return type**: Role!

**Resolver implementation**: `roles.js`

### updateRole

**Arguments**

- `input` : UpdateRoleInput!

**Return type**: Role!

**Resolver implementation**: `roles.js`

### deleteRole

**Arguments**

- `input` : DeleteRoleInput!

**Return type**: Boolean!

**Resolver implementation**: `roles.js`

### addPermissionRole

**Arguments**

- `input` : CreateRoleHasPermissionInput!

**Return type**: RoleHasPermissions!

**Resolver implementation**: `Roleshaspermission.js`

### updatePermissionRole

**Arguments**

- `input` : UpdateRoleHasPermissionInput!

**Return type**: RoleHasPermissions!

**Resolver implementation**: `Roleshaspermission.js`

### deletePermissionRole

**Arguments**

- `input` : DeleteRoleHasPermissionInput!

**Return type**: Boolean!

**Resolver implementation**: `Roleshaspermission.js`

### createUser

**Arguments**

- `input` : CreateUserInput!

**Return type**: User!

**Resolver implementation**: `users.js`

### updateUser

**Arguments**

- `input` : UpdateUserInput!

**Return type**: User!

**Resolver implementation**: `users.js`

### changePassword

**Arguments**

- `input` : ChangePasswordInput!

**Return type**: Boolean!

**Resolver implementation**: `users.js`

### deleteUser

**Arguments**

- `input` : DeleteUserInput!

**Return type**: Boolean!

**Resolver implementation**: `users.js`

