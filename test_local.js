const API_BASE = "http://localhost:5000";

async function verifyProductionAPI() {
  console.log("Starting Production API Verification...");
  
  // 1. Create a tape
  const createRes = await fetch(`${API_BASE}/api/tapes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tape: JSON.stringify({
        recipient: "Verification Test",
        title: "Test Tape",
        inscription: "This is a test.",
        senderNote: "A note.",
        songs: [
          { type: "youtube", title: "Test Song", artist: "Artist", memory: "A memory", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
        ]
      })
    })
  });
  
  const createBody = await createRes.json();
  console.log("1. CREATE STATUS:", createRes.status);
  console.log("   managementToken in response:", !!createBody.managementToken);
  console.log("   shareUrl in response:", !!createBody.shareUrl);
  console.log("   managementToken in tape object:", !!createBody.tape?.managementToken);

  if (createRes.status !== 201) {
    console.error("Failed to create tape:", createBody);
    return;
  }

  const { shareUrl, managementToken } = createBody;
  const shareId = shareUrl.split("/tape/")[1];

  // 2. GET Receiver Link
  const getReceiverRes = await fetch(`${API_BASE}/api/tapes/${shareId}`);
  const getReceiverBody = await getReceiverRes.json();
  console.log("\n2. GET RECEIVER STATUS:", getReceiverRes.status);
  console.log("   managementToken in receiver tape:", !!getReceiverBody.tape?.managementToken);

  // 3. Unauthorized Edit
  const putUnauthorizedRes = await fetch(`${API_BASE}/api/tapes/${shareId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      tape: JSON.stringify({
        recipient: "Unauthorized",
        title: "Unauthorized Edit",
        inscription: "Unauthorized.",
        senderNote: "",
        songs: [
          { type: "youtube", title: "Test Song", artist: "Artist", memory: "A memory", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
        ]
      })
    })
  });
  console.log("\n3. UNAUTHORIZED EDIT STATUS:", putUnauthorizedRes.status);

  // 4. Unauthorized Delete
  const delUnauthorizedRes = await fetch(`${API_BASE}/api/tapes/${shareId}`, {
    method: "DELETE"
  });
  console.log("\n4. UNAUTHORIZED DELETE STATUS:", delUnauthorizedRes.status);

  // 5. GET Management Link
  const getManageRes = await fetch(`${API_BASE}/api/manage/${managementToken}`);
  const getManageBody = await getManageRes.json();
  console.log("\n5. GET MANAGEMENT STATUS:", getManageRes.status);
  console.log("   Tape title from management:", getManageBody.tape?.title);

  // 6. Authorized Edit
  const putAuthorizedRes = await fetch(`${API_BASE}/api/tapes/${shareId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Management-Token": managementToken
    },
    body: JSON.stringify({
      tape: JSON.stringify({
        recipient: "Authorized Edit",
        title: "Edited Tape",
        inscription: "This is an edited test.",
        senderNote: "An edited note.",
        songs: [
          { type: "youtube", title: "Edited Song", artist: "Artist", memory: "A memory", youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }
        ]
      })
    })
  });
  const putAuthorizedBody = await putAuthorizedRes.json();
  console.log("\n6. AUTHORIZED EDIT STATUS:", putAuthorizedRes.status);
  console.log("   New title:", putAuthorizedBody.tape?.title);
  console.log("   shareUrl remains same:", putAuthorizedBody.shareUrl === shareUrl);

  // 7. Authorized Delete
  const delAuthorizedRes = await fetch(`${API_BASE}/api/tapes/${shareId}`, {
    method: "DELETE",
    headers: {
      "X-Management-Token": managementToken
    }
  });
  console.log("\n7. AUTHORIZED DELETE STATUS:", delAuthorizedRes.status);

  // 8. Verify Deletion
  const getDeletedRes = await fetch(`${API_BASE}/api/tapes/${shareId}`);
  console.log("\n8. GET AFTER DELETE STATUS:", getDeletedRes.status);

  console.log("\nVerification complete.");
}

verifyProductionAPI().catch(console.error);
