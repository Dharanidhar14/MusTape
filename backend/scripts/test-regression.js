import { query } from "../db/index.js";
import {
  createTapeFromDraft,
  findTapeByShareId,
  findTapeByManagementToken,
  updateTapeFromDraft,
  deleteTapeByManagementToken
} from "../services/tapeService.js";

async function runTests() {
  console.log("Starting Regression Tests...");

  try {
    // 1. Legacy Creation
    const draft = JSON.stringify({
      recipient: "Legacy User",
      title: "Test Tape",
      inscription: "Hello",
      songs: [
        {
          clientId: "c1",
          type: "spotify",
          title: "Track 1",
          artist: "Artist 1",
          spotifyUrl: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
          spotifyTrackId: "4cOdK2wGLETKBW3PvgPWqT",
          embedUrl: "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT"
        }
      ]
    });

    console.log("-> Testing Legacy Creation");
    const tape = await createTapeFromDraft(draft, [], null, null);
    if (!tape || !tape.shareId || !tape.managementToken) {
      throw new Error("Legacy creation failed: missing shareId or managementToken");
    }
    console.log("   Legacy tape created with shareId:", tape.shareId);

    // 2. Receiver Fetch
    console.log("-> Testing Receiver Fetch (GET /api/tapes/:shareId)");
    const fetchedTape = await findTapeByShareId(tape.shareId);
    if (!fetchedTape || fetchedTape.title !== "Test Tape") {
      throw new Error("Receiver fetch failed");
    }
    console.log("   Receiver fetch succeeded.");

    // 3. Manager Fetch
    console.log("-> Testing Manager Fetch (GET /api/manage/:managementToken)");
    const manageTape = await findTapeByManagementToken(tape.managementToken);
    if (!manageTape) {
      throw new Error("Manager fetch failed");
    }
    console.log("   Manager fetch succeeded.");

    // 4. Legacy Update
    console.log("-> Testing Legacy Update (PUT /api/tapes/:shareId)");
    const updatedDraft = JSON.stringify({
      recipient: "Updated User",
      title: "Updated Tape",
      inscription: "Hello again",
      songs: [
        {
          clientId: "c1",
          type: "spotify",
          title: "Track 1",
          artist: "Artist 1",
          spotifyUrl: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT",
          spotifyTrackId: "4cOdK2wGLETKBW3PvgPWqT",
          embedUrl: "https://open.spotify.com/embed/track/4cOdK2wGLETKBW3PvgPWqT"
        }
      ]
    });
    const updatedTape = await updateTapeFromDraft(tape.shareId, tape.managementToken, updatedDraft, [], null);
    if (!updatedTape || updatedTape.title !== "Updated Tape") {
      throw new Error("Legacy update failed");
    }
    console.log("   Legacy update succeeded.");

    // 5. Legacy Delete
    console.log("-> Testing Legacy Delete (DELETE /api/tapes/:shareId)");
    await deleteTapeByManagementToken(tape.shareId, tape.managementToken, null);
    const deletedTape = await findTapeByShareId(tape.shareId);
    if (deletedTape) {
      throw new Error("Legacy delete failed, tape still exists");
    }
    console.log("   Legacy delete succeeded.");

    console.log("\nALL REGRESSION TESTS PASSED!");
  } catch (error) {
    console.error("REGRESSION TEST FAILED:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

runTests();
