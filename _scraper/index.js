const fs = require("fs");
const client = require("http");
const { JSDOM } = require("jsdom");
const gm = require("gm").subClass({ imageMagick: "7+" });
const { xmlToJson, getOfflineThumbFilename } = require("../js/common.js");
const { serverIp, serverToken, moviesPayloadUrl } = require("../js/config.js");

/**
 * A parent/main function was needed to avoid top-level await
 */
const downloadMain = async () => {
  try {
    fs.mkdirSync("../offline", { recursive: true });
    const xmlFile = "../offline/movies.xml";
    await downloadFile(moviesPayloadUrl, xmlFile);
    const xmlString = fs.readFileSync(xmlFile, { encoding: "utf8" });
    const xmlDoc = new JSDOM(xmlString, { contentType: "application/xml" });
    const json = xmlToJson(xmlDoc.window.document);
    const movies = (json.MediaContainer ?? {}).Video ?? [];
    if (Array.isArray(movies) && movies.length) {
      let downloadedCount = 0;
      let skippedCount = 0;
      const thumbList = [];
      const tmpFilePath = "../offline/tmp.jpg";
      fs.mkdirSync("../offline/thumbs", { recursive: true });
      for (const entry of movies) {
        const thumb = (entry["@attributes"] ?? {}).thumb ?? null;
        const title = (entry["@attributes"] ?? {}).title ?? "-"
        if (thumb) {
          const url = `${serverIp}${thumb}?X-Plex-Token=${serverToken}`;
          const fileName = getOfflineThumbFilename(thumb)
          const filePath = `../offline/thumbs/${fileName}`;
          thumbList.push(fileName);
          if (fs.existsSync(filePath)) {
            skippedCount++;
          } else {
            await downloadFile(url, tmpFilePath);
            await resizeImage(tmpFilePath, filePath, 300);
            fs.unlinkSync(tmpFilePath);
            console.log(`Downloaded thumb for "${title ?? "-"}"`);
            downloadedCount++;
          }
        }
      }
      let deletedCount = 0;
      const fileList = fs.readdirSync("../offline/thumbs");
      for (const fileName of fileList) {
        if (!thumbList.includes(fileName)) {
          fs.unlinkSync(`../offline/thumbs/${fileName}`);
          deletedCount++;
        }
      }
      if (downloadedCount > 0) console.log("");
      console.log(`Downloaded thumbs for ${downloadedCount} ${downloadedCount === 1 ? "movie" : "movies"}`);
      console.log(`Skipped thumbs for ${skippedCount} ${skippedCount === 1 ? "movie" : "movies"}`);
      console.log(`Deleted thumbs for ${downloadedCount} ${deletedCount === 1 ? "movie" : "movies"}`);
    } else {
      console.log("No movies");
    }
  } catch (err) {
    console.error(err.message);
  }
};

/**
 * Promised function to download any file using http and fs libraries (node native)
 * @param {string} url
 * @param {string} filePath
 * @returns {Promise}
 */
const downloadFile = (url, filePath) => {
  return new Promise((resolve, reject) => {
    client.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filePath))
          // .on("error", reject)
          .on("error", (err) => reject(err))
          .once("close", () => resolve(filePath));
      } else {
        res.resume();
        reject(new Error(`Request Failed With a Status Code ${res.statusCode}: ${url}`));
      }
    }).on("error", (err) => {
      reject(err);
    });
  });
};

/**
 * Resize a JPG image
 * @param {string} fileInput
 * @param {string} fileOutput
 * @param {number} width
 * @returns {Promise}
 */
const resizeImage = (fileInput, fileOutput, width) => {
  return new Promise((resolve, reject) => {
    gm(fileInput).filter("Lanczos").resize(width).noProfile().quality(85).write(fileOutput, err => {
      if (!err) {
        resolve(fileOutput);
      } else {
        reject(err);
      }
    });
  });
};

downloadMain();
