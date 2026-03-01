import { DateTimeResolver, DateResolver } from "graphql-scalars";
import bookhaslibraryResolvers from "./bookhaslibrary.js";
import bookResolvers from "./books.js";
import discussionResolvers from "./discussion.js";
import libraryResolvers from "./libraries.js";
import messagesResolvers from "./messages.js";
import permissionsResolvers from "./permissions.js";
import reportsResolvers from "./reports.js";
import reviewResolvers from "./reviews.js";
import rolesResolvers from "./roles.js";
import roleshaspermissionsResolvers from "./Roleshaspermission.js";
import userResolvers from "./users.js";
import statusResolvers from "./status.js";
import genres from "./genres.js";
import editors from "./editors.js";
import authors from "./authors.js";
import categoryOfReport from "./categoryOfReport.js";
import reasonOfReport from "./reaseonOfReport.js";
import authResolvers from "./auth.js";
import passwordResets from "./passwordResets.js";
import resolverForHomePage  from "./resolver_homePage.js";

export default {
  Date: DateResolver,
  DateTime: DateTimeResolver,
  
  Query: {
    ...authResolvers.Query,
    ...authors.Query,
    ...bookhaslibraryResolvers.Query,
    ...bookResolvers.Query,
    ...categoryOfReport.Query,
    ...discussionResolvers.Query,
    ...editors.Query,
    ...genres.Query,
    ...libraryResolvers.Query,
    ...messagesResolvers.Query,
    ...passwordResets.Query,
    ...permissionsResolvers.Query,
    ...reasonOfReport.Query,
    ...reportsResolvers.Query,
    ...reviewResolvers.Query,
    ...rolesResolvers.Query,
    ...roleshaspermissionsResolvers.Query,
    ...statusResolvers.Query,
    ...userResolvers.Query,
    ...resolverForHomePage.Query,
    //today: () => new Date().toISOString(),
  },
  
  Mutation: {
    ...bookhaslibraryResolvers.Mutation,
    ...bookResolvers.Mutation,
    ...discussionResolvers.Mutation,
    ...libraryResolvers.Mutation,
    ...messagesResolvers.Mutation,
    ...permissionsResolvers.Mutation,
    ...reportsResolvers.Mutation,
    ...reviewResolvers.Mutation,
    ...rolesResolvers.Mutation,
    ...roleshaspermissionsResolvers.Mutation,
    ...userResolvers.Mutation,
    ...statusResolvers.Mutation,
    ...genres.Mutation,
    ...editors.Mutation,
    ...authors.Mutation,
    ...categoryOfReport.Mutation,
    ...reasonOfReport.Mutation,
    ...authResolvers.Mutation,
    ...passwordResets.Mutation,
  },
  
  BookHasLibrary: bookhaslibraryResolvers.BookHasLibrary,
  Book: bookResolvers.Book,
  Discussion: discussionResolvers.Discussion,
  Library: libraryResolvers.Library,
  Message: messagesResolvers.Message,
  Permission: permissionsResolvers.Permission,
  Report: reportsResolvers.Report,
  Review: reviewResolvers.Review,
  Role: rolesResolvers.Role,
  RoleHasPermissions: roleshaspermissionsResolvers.RoleHasPermissions,
  User: userResolvers.User,
  Status: statusResolvers.Status,
  Genre: genres.Genres,
  Editor: editors.Editors,
  Author: authors.Authors,
  CategoryOfReport: categoryOfReport.CategoryOfReport,
  ReasonOfReport: reasonOfReport.ReasonOfReport,
  PasswordReset: passwordResets.PasswordReset,
};