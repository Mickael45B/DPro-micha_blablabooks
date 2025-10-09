import db from "../../db/connect_DB.js";

const fetchUserById = async (id_permission) => {

      if (!parent.id_permission) return null;
      try {
        const result = await db.query(
          'SELECT * FROM permissions WHERE id_permission = $1',
          [id_permission]
        );
        return [result.rows[0]].filter(Boolean);
      } catch (error) {
        console.error(`Error fetching permission with ID: ${id_permission}`, error);
        return [];
      }
};
        export default fetchUserById;
