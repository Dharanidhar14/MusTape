import { createTapeFromDraft, findTapeByShareId, publicTape, updateTapeFromDraft } from "../services/tapeService.js";
import { fail } from "../services/textService.js";

export async function createTape(request, response, next) {
  try {
    const tape = await createTapeFromDraft(request.body.tape, request.files || []);

    response.status(201).json({
      tape: publicTape(tape, request),
      shareUrl: `/tape/${tape.shareId}`
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
    const tape = await updateTapeFromDraft(request.params.shareId, request.body.tape, request.files || []);

    response.json({
      tape: publicTape(tape, request),
      shareUrl: `/tape/${tape.shareId}`
    });
  } catch (error) {
    next(error);
  }
}
