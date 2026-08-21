import { errorHandler } from "./middleware/errorHandler.js";

const fakeRequest = { id: "test-req-health", method: "GET", path: "/api/manage/SECRET_TOKEN_VALUE_12345" };
const fakeResponse = { status(c) { this.statusCode = c; return this; }, json() {} };

// Test 1: 500 error with filesystem path — should NOT leak path
const fsError = new Error("ENOENT: no such file or directory, open '/data/storage/tapes.json'");
fsError.code = "ENOENT";
fsError.status = 500;
console.log("--- TEST 1: 500 error on management path ---");
errorHandler(fsError, fakeRequest, fakeResponse, () => {});

// Test 2: 403 on management path — path should be redacted
const authError = new Error("This action requires a valid management link.");
authError.status = 403;
authError.code = "MUSTAPE_UNAUTHORIZED";
console.log("--- TEST 2: 403 error on management path ---");
errorHandler(authError, fakeRequest, fakeResponse, () => {});

// Test 3: health check style error
import { logger } from "./services/logger.js";
const healthError = new Error("EACCES: permission denied, access '/data/storage'");
healthError.code = "EACCES";
healthError.name = "Error";
console.log("--- TEST 3: Health check storage failure ---");
logger.error("health.storage_failed", { errorName: healthError.name, sysCode: healthError.code });
