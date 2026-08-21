import { query } from "../db/index.js";
import { fail } from "./textService.js";

export async function createCollection(userId, data) {
  const result = await query(`
    INSERT INTO collections (user_id, name, recipient_name, recipient_email, sender_name, description)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [userId, data.name, data.recipientName, data.recipientEmail, data.senderName, data.description]);
  
  return result.rows[0];
}

export async function getCollections(userId) {
  const result = await query(`
    SELECT * FROM collections
    WHERE user_id = $1
    ORDER BY created_at DESC
  `, [userId]);
  return result.rows;
}

export async function getCollectionById(userId, collectionId) {
  const result = await query(`
    SELECT * FROM collections
    WHERE id = $1 AND user_id = $2
  `, [collectionId, userId]);

  if (result.rowCount === 0) {
    fail("Collection not found or access denied.", 404);
  }
  return result.rows[0];
}

export async function updateCollection(userId, collectionId, data) {
  const result = await query(`
    UPDATE collections
    SET name = $1, recipient_name = $2, recipient_email = $3, sender_name = $4, description = $5, updated_at = NOW()
    WHERE id = $6 AND user_id = $7
    RETURNING *
  `, [data.name, data.recipientName, data.recipientEmail, data.senderName, data.description, collectionId, userId]);

  if (result.rowCount === 0) {
    fail("Collection not found or access denied.", 404);
  }
  return result.rows[0];
}

export async function deleteCollection(userId, collectionId) {
  // Cascading delete will remove associated tapes and songs in DB.
  // Note: Audio file cleanup will be handled separately by a background job or safe cleanup logic later.
  const result = await query(`
    DELETE FROM collections
    WHERE id = $1 AND user_id = $2
    RETURNING id
  `, [collectionId, userId]);

  if (result.rowCount === 0) {
    fail("Collection not found or access denied.", 404);
  }
}
