import db from "../../db/connect_DB.js";

// Fetch a permission row by id_permission
const fetchPermissionById = async (id_permission) => {
  if (!id_permission) return null;
  try {
    const result = await db.query(
      'SELECT * FROM permissions WHERE id_permission = $1',
      [id_permission]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching permission with ID: ${id_permission}`, error);
    return null;
  }
};

export default fetchPermissionById;
