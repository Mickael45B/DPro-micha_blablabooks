import db from "../../db/connect_DB.js";

export const fetchUserById = async (id_user) => {
  if (!id_user) return null;
  try {
    const result = await db.query(
      'SELECT id_user, name, email, id_role, pseudo, status, created_at, updated_at FROM users WHERE id_user = $1',
      [id_user]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching user with id ${id_user}:`, error);
    return null;
  }
};
