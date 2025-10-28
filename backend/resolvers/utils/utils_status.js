import db from "../../db/connect_DB.js";

 const fetchStatusById = async (id_status) => {
  if (!id_status) return null;
  try {
    const result = await db.query(
      'SELECT id_status, status_name, created_at, updated_at FROM status WHERE id_status = $1',
      [id_status]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error(`Error fetching status with id ${id_status}:`, error);
    return null;
  }
};

export default fetchStatusById;