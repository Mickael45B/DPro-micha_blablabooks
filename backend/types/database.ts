// Interface pour la table "roles"
export interface Role {
  id_role: string;
  role_name: string;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "permissions"
export interface Permission {
  id_permission: string;
  permission_name: string;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "rolehaspermissions"
export interface RoleHasPermission {
  id_rolehaspermission: string;
  id_role: string;
  id_permission: string;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "users"
export interface User {
  id_user: string;
  name?: string;
  email: string;
  password: string;
  pseudo: string;
  id_role?: string;
  role: string;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "books"
export interface Book {
  id_book: string;
  title: string;
  isbn?: string;
  publication_date?: Date;
  author?: string;
  editor?: string;
  genre?: string;
  vignetteimage?: string;
  bookimage?: string;
  age_limit?: number;
  description?: string;
  series?: string;
  is_in_favorite: number;
  nb_reviews: number;
  is_in_library: number;
  avg_rating?: number;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "libraries"
export interface Library {
  id_library: string;
  name: string;
  is_editable: boolean;
  id_user?: string;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "reviews"
export interface Review {
  id_review: string;
  id_user?: string;
  id_book: string;
  title_rating: string;
  comment: string;
  rating: number;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "bookhaslibrary"
export interface BookHasLibrary {
  id_bookhaslibrary: string;
  id_library?: string;
  id_book?: string;
  is_read: boolean;
  is_favorite: boolean;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "messages"
export interface Message {
  id_message: string;
  id_sender: string;
  id_receiver: string;
  subject: string;
  content: string;
  is_read: boolean;
  created_at: Date;
  updated_at?: Date;
}

// Interface pour la table "reports"
export interface Report {
  id_report: string;
  id_user: string;
  report_type: 'user' | 'review' | 'message' | 'other';
  reported_id?: string;
  reason: string;
  details?: string;
  status: 'pending' | 'in_review' | 'resolved' | 'dismissed';
  created_at: Date;
  updated_at?: Date;
}