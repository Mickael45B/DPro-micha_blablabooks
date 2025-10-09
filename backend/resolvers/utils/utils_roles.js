import db from "../../db/connect_DB.js";

const fetchUserById = async (id_role) => {

    if (!id_role) return null;

    try {
        const result = await db.query(
            'SELECT * FROM roles WHERE id_role = $1',
            [id_role]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error(`fetching user role with id ${id_role}`, error);
        return null;
    }
};

export default fetchUserById;

