import db from "../../db/connect_DB.js";

const fetchUserById = async (id_book) => {

    if (!id_book) return null;

    try {
        const result = await db.query(
          'SELECT * FROM books WHERE id_book = $1',
          [id_book]
        );
        return result.rows[0] || null;
      } catch (error) {
        console.error('Error fetching book:', error);
        return null;
      }
};



    export default fetchUserById;

