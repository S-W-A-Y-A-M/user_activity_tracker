// src/utils/logTranslator.js

/**
 * Translates an API path into a human-readable action.
 * This version can now detect and handle paths that end with an ID.
 *
 * @param {object} log - The entire log object, including path and method.
 * @returns {string} A concise, well-formatted action name.
 */
const getActionPerformed = (log = {}) => {
  const { path = "", method = "" } = log;

  // --- NEW: ID Detection Logic ---
  const parts = path.split("/").filter(Boolean);
  let segment = parts[parts.length - 1] || "";
  let capturedId = null;

  // A MongoDB ObjectId is 24 hexadecimal characters.
  // Check if the last part of the path looks like an ID.
  const isLastPartId = /^[a-f\d]{24}$/i.test(segment);

  if (isLastPartId) {
    capturedId = segment;
    // If it is an ID, the real action is the part before it.
    segment = parts.length > 1 ? parts[parts.length - 2] : "";
  }

  // 1. Handle specific exceptions AFTER we've identified the correct action segment.
  if (segment.toLowerCase() === "getorgdetails") {
    let action = "Fetched Organization Details";
    if (capturedId) {
      action += ` of ${capturedId}`;
    }
    return action;
  }
  if (path.includes("GETorganizationmembersDetails")) return "Fetched Organization Members Details";
  if (path.includes("POSTupdateFCMToken")) return "Updated Notification Token";
  if (path.includes("logout")) return "Logged Out";
  if (path.includes("POSTuserauth")) return "Logged In";
  if (path.includes("GETorgswitch")) return "Fetched Organization Details";
  if (path.includes("POSTcreatep0")) return "Created P0";
  if (path.includes("GETarticleviews")) return "Fetched Article Views";
  if (path.includes("GETuserprofile")) return "Fetched User Profile";
  if (path.includes("GETallannouncements")) return "Fetched All Announcements";
  if (path.includes("Check_userdevice")) return "Checked User Device";
  if (path.includes("GETdynamicmodel")) return "Fetched Dynamic Model";
  if (path.includes("GETorgleavesetup"))return "Fetched Organization Leave Setup";
  if (path.includes("POSTleavetype_details")) return "Created Leave Type";

  // 2. For all other paths, use the generic parser.
  const prefixVerbMap = {
    GET: "Fetched",
    POST: "Created",
    PUT: "Updated",
    PATCH: "Updated",
    DELETE: "Deleted",
    CHECK: "Checked",
  };

  let verb = "";
  let subject = segment;

  // Try to find the verb from the path segment's prefix.
  for (const prefix in prefixVerbMap) {
    if (segment.toUpperCase().startsWith(prefix)) {
      verb = prefixVerbMap[prefix];
      subject = segment.substring(prefix.length);
      break;
    }
  }

  // If no verb was found in the path, derive it from the log's HTTP method.
  if (!verb) {
    const methodVerbMap = {
      GET: "Fetched",
      POST: "Created",
      PUT: "Updated",
      PATCH: "Updated",
      DELETE: "Deleted",
    };
    subject = segment;
    verb = methodVerbMap[method.toUpperCase()] || "Processed";
  }

  const formattedSubject = subject
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z0-9])/g, "$1 $2")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

  let result = formattedSubject
    ? `${verb} ${formattedSubject}`
    : `${verb} Unknown Object`;

  // --- NEW: Append the captured ID if it exists ---
  if (capturedId) {
    result += ` of ${capturedId}`;
  }

  return result;
};

/**
 * Processes a log object to extract the human-readable action performed.
 * @param {object} log - The log object from the API.
 * @returns {object} An object containing the actionPerformed.
 */
export const getLogDetails = (log) => {
  if (!log) {
    return {
      actionPerformed: "N/A",
    };
  }

  return {
    actionPerformed: getActionPerformed(log),
  };
};
