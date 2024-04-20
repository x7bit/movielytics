/////////////////////////////////////////////////////////////////////////////////////////
// Copy this file to 'config.js'. Configuration global variables:
// - Replace 'serverIp' with your public server address, e.g. http://192.168.1.30:32400
// - Replace 'serverToken' with your server token ** KEEP PRIVATE **
// - Modify 'moviesPayloadUrl' to match your server's XML payload (e.g. movies ID's)
/////////////////////////////////////////////////////////////////////////////////////////

const isOffline = false;
const serverIp = "http://192.168.1.100:32400";
const serverToken = "**_KEEP_PRIVATE_**";
const moviesPayloadUrl = serverIp + "/library/sections/2/all?X-Plex-Token=" + serverToken;

if (typeof module !== "undefined" && module.exports) module.exports = { isOffline, serverIp, serverToken, moviesPayloadUrl };
