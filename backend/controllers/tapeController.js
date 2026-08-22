import {
  createTapeFromDraft,
  deleteTapeByManagementToken,
  findTapeByManagementToken,
  findTapeByShareId,
  publicTape,
  updateTapeFromDraft
} from "../services/tapeService.js";
import { fail } from "../services/textService.js";
import { query } from "../db/index.js";

async function getInternalUserId(req) {
  if (!req.user?.googleSub) return null;
  const res = await query("SELECT id FROM users WHERE google_sub = $1", [req.user.googleSub]);
  return res.rowCount > 0 ? res.rows[0].id : null;
}

export async function createTape(request, response, next) {
  try {
    const userId = await getInternalUserId(request);
    const collectionId = request.body.collectionId || null;
    
    const tape = await createTapeFromDraft(request.body.tape, request.files || [], collectionId, userId);

    response.status(201).json({
      tape: publicTape(tape, request),
      shareUrl: `/tape/${tape.shareId}`,
      managementToken: tape.managementToken
    });
  } catch (error) {
    next(error);
  }
}

export async function getTape(request, response, next) {
  try {
    const tape = await findTapeByShareId(request.params.shareId);
    if (!tape) fail("This tape could not be found.", 404);
    response.json({ tape: publicTape(tape, request) });
  } catch (error) {
    next(error);
  }
}

export async function updateTape(request, response, next) {
  try {
    const userId = await getInternalUserId(request);
    const managementToken = request.headers["x-management-token"] || "";
    const tape = await updateTapeFromDraft(
      request.params.shareId,
      managementToken,
      request.body.tape,
      request.files || [],
      userId
    );

    response.json({
      tape: publicTape(tape, request),
      shareUrl: `/tape/${tape.shareId}`
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTape(request, response, next) {
  try {
    const userId = await getInternalUserId(request);
    const managementToken = request.headers["x-management-token"] || "";
    await deleteTapeByManagementToken(request.params.shareId, managementToken, userId);
    response.json({ ok: true, message: "The tape has been destroyed." });
  } catch (error) {
    next(error);
  }
}

// GET /api/manage/:managementToken
// Returns a management-safe tape payload for populating the management page.
// Strips managementToken from the response — the client already has it in the URL.
export async function getManageTape(request, response, next) {
  try {
    const token = request.params.managementToken || "";
    const tape = await findTapeByManagementToken(token);

    if (!tape) fail("This management link could not be found or has expired.", 404);

    // Return publicTape (which strips managementToken) — client already has the token
    response.json({ tape: publicTape(tape, request) });
  } catch (error) {
    next(error);
  }
}
