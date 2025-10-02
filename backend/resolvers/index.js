import { DateTimeResolver, DateResolver } from "graphql-scalars";
import bookhaslibraryResolvers from "./bookhaslibrary.js";
import bookResolvers from "./books.js";
import libraryResolvers from "./libraries.js";
import messagesResolvers from "./messages.js";
import permissionsResolvers from "./permissions.js";
import reportsResolvers from "./reports.js";
import reviewResolvers from "./reviews.js";
import rolesResolvers from "./roles.js";
import roleshaspermissionsResolvers from "./Roleshaspermission.js";
import userResolvers from "./users.js";

export default {
  Date: DateResolver,
  DateTime: DateTimeResolver,
  
  Query: {
    ...bookhaslibraryResolvers.Query,
    ...bookResolvers.Query,
    ...libraryResolvers.Query,
    ...messagesResolvers.Query,
    ...permissionsResolvers.Query,
    ...reportsResolvers.Query,
    ...reviewResolvers.Query,
    ...rolesResolvers.Query,
    ...roleshaspermissionsResolvers.Query,
    ...userResolvers.Query,
    
    today: () => new Date().toISOString(),
  },
  
  Mutation: {
    ...bookhaslibraryResolvers.Mutation,
    ...bookResolvers.Mutation,
    ...libraryResolvers.Mutation,
    ...messagesResolvers.Mutation,
    ...permissionsResolvers.Mutation,
    ...reportsResolvers.Mutation,
    ...reviewResolvers.Mutation,
    ...rolesResolvers.Mutation,
    ...roleshaspermissionsResolvers.Mutation,
    ...userResolvers.Mutation,
  },
  
  BookHasLibrary: bookhaslibraryResolvers.BookHasLibrary,
  Book: bookResolvers.Book,
  Library: libraryResolvers.Library,
  Message: messagesResolvers.Message,
  Permission: permissionsResolvers.Permission,
  Report: reportsResolvers.Report,
  Review: reviewResolvers.Review,
  Role: rolesResolvers.Role,
  RoleHasPermissions: roleshaspermissionsResolvers.RoleHasPermissions,
  User: userResolvers.User,
};