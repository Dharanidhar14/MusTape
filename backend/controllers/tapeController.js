import {
  createTapeFromDraft,
  deleteTapeByManagementToken,
  findTapeByManagementToken,
  findTapeByShareId,
  publicTape,
  updateTapeFromDraft
} from "../services/tapeService.js";
import { fail } from "../services/textService.js";

export async function createTape(request, response, next) {
  try {
    const tape = await createTapeFromDraft(request.body.tape, request.files || []);

    // managementToken is returned ONLY in the creation response so the frontend
    // can build the management URL. It is never returned again after this point.
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

    // publicTape() always strips managementToken — receiver never sees it
    response.json({ tape: publicTape(tape, request) });
  } catch (error) {
    next(error);
  }
}

export async function updateTape(request, response, next) {
  try {
    const managementToken = request.headers["x-management-token"] || "";
    const tape = await updateTapeFromDraft(
      request.params.shareId,
      managementToken,
      request.body.tape,
      request.files || []
    );

    response.json({
      tape: publicTape(tape, request),
      shareUrl: `/tape/${tape.shareId}`
      // managementToken is NOT returned on updates — it never changes
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTape(request, response, next) {
  try {
    const managementToken = request.headers["x-management-token"] || "";
    await deleteTapeByManagementToken(request.params.shareId, managementToken);
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
