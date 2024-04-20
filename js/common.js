const translations = {
  "Loading…": {
    en: "Loading…",
    es: "Cargando…",
  },
  "Library Statistics": {
    en: "Library Statistics",
    es: "Estadísticas de la biblioteca",
  },
  "Latest movies added": {
    en: "Latest movies added",
    es: "Últimas películas añadidas",
  },
  "Movies By Genre": {
    en: "Movies By Genre",
    es: "Películas por Género",
  },
  "Movies By Country (Top 20)": {
    en: "Movies By Country (Top 20)",
    es: "Películas por País (Top 20)",
  },
  "Movies By Decade": {
    en: "Movies By Decade",
    es: "Películas por Década",
  },
  "Movies By Studio (Top 50)": {
    en: "Movies By Studio (Top 50)",
    es: "Películas por Estudio (Top 50)",
  },
  "Sort:": {
    en: "Sort:",
    es: "Ordenar:",
  },
  "Title": {
    en: "Title",
    es: "Título",
  },
  "Year": {
    en: "Year",
    es: "Año",
  },
  "Search:": {
    en: "Search:",
    es: "Buscar:",
  },
  "Title, actor or director": {
    en: "Title, actor or director",
    es: "Título, actor o director",
  },
  "No results…": {
    en: "No results…",
    es: "Sin resultados…",
  },
  "Error accessing the database": {
    en: "Error accessing the database",
    es: "Error accediendo a la base de datos",
  },
  "Movies": {
    en: "Movies",
    es: "Películas",
  },
  "Hours": {
    en: "Hours",
    es: "Horas",
  },
  "Mins": {
    en: "Mins",
    es: "Mins",
  },
  "Critic": {
    en: "Critic",
    es: "Crítica",
  },
  "Audience": {
    en: "Audience",
    es: "Audiencia",
  },
  "Synopsis": {
    en: "Synopsis",
    es: "Sinopsis",
  },
};

/**
 * Get language from navigator. Only english (default) or spanish
 * @returns {string}
 */
const getLang = () => {
  if (typeof navigator === "undefined") {
    return "en";
  }
  const lang = ((navigator.language || navigator.userLanguage) ?? "").split("-")[0];
  switch (lang) {
    case "en":
    case "es":
      return lang;
    case "EN":
    case "ES":
      return lang.toLowerCase();
    default:
      return "en";
  }
}

const lang = getLang();

/**
 * Translate function
 * @param {string} key
 * @return {string}
 */
const trans = key => {
  return (translations[key] ?? {})[lang] ?? key;
};

/**
 * Changes XML to JSON
 * @see https://gist.github.com/chinchang/8106a82c56ad007e27b1
 * @param {object} xml XML DOM tree
 * @return {object}
 */
const xmlToJson = xml => {
  let obj = {};

  if (xml.nodeType == 1) { // element - do attributes
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (let j = 0; j < xml.attributes.length; j++) {
        const attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
      }
    }
  } else if (xml.nodeType == 3) {
    obj = xml.nodeValue; // text
  }

  // do children - if all text nodes inside, get concatenated text from them
  const textNodes = [].slice.call(xml.childNodes).filter(function (node) {
    return node.nodeType === 3;
  });
  if (xml.hasChildNodes() && xml.childNodes.length === textNodes.length) {
    obj = [].slice.call(xml.childNodes).reduce(function (text, node) {
      return text + node.nodeValue;
    }, "");
  } else if (xml.hasChildNodes()) {
    for (let i = 0; i < xml.childNodes.length; i++) {
      const item = xml.childNodes.item(i);
      const nodeName = item.nodeName;
      if (typeof obj[nodeName] == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof obj[nodeName].push == "undefined") {
          const old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
};

/**
 * Returns a HTMLElement from a HTML string
 * @param {string} htmlString
 * @returns {HTMLElement}
 */
const createElementFromHTML = htmlString => {
  const div = document.createElement("div");
  div.innerHTML = htmlString.trim();
  return div.firstChild;
};

/**
 * Returns a relative offline URL/path of a thumb
 * @param {string} thumb
 * @returns {string}
 */
const getThumbUrl = thumb => {
  if (isOffline) {
    return `offline/thumbs/${getOfflineThumbFilename(thumb)}`;
  } else {
    return `${serverIp}${thumb}?X-Plex-Token=${serverToken}`;
  }
};

/**
 * Returns a relative offline filename of a thumb
 * @param {string} thumb
 * @returns {string}
 */
const getOfflineThumbFilename = thumb => {
  return `${thumb.replace('/library/metadata/', "").replace('/thumb/', "_")}.jpg`;
};

if (typeof module !== "undefined" && module.exports) module.exports = { xmlToJson, getThumbUrl, getOfflineThumbFilename };
