import db from "../../db/connect_DB.js";

const fetchLibraryById = async (id_library) => {

    if (!id_library) return null;

    try {
        const result = await db.query(
            'SELECT * FROM libraries WHERE id_library = $1',
            [id_library]
        );
        return result.rows[0] || null;
    } catch (error) {
        console.error('Error fetching library by ID:', error);
        return null;
    }
};

export default fetchLibraryById;
