/// <reference path="isotope.js" />
/// <reference path="common.js" />

// Miscellaneous variables
const libraryStats = {};
let lastEntryShowEl = null;
let isotope = null;
let movies = [];

//On load
window.addEventListener("load", () => {
  //HTML localization
  document.body.querySelectorAll('[data-localize]').forEach(el => {
		const str = el.innerText.trim();
		const strLoc = trans(str);
		if (str !== strLoc) {
			el.innerHTML = el.innerHTML.replace(str, strLoc);
		}
	});
  document.body.querySelectorAll('[data-localize-placeholder]').forEach(el => {
    const str = el.placeholder.trim();
		const strLoc = trans(str);
		if (str !== strLoc) {
			el.placeholder = el.placeholder.replace(str, strLoc);
		}
	});
  //Fetch database
  const headers = new Headers();
  headers.append("pragma", "no-cache");
  headers.append("cache-control", "no-cache");
  const fUrl = isOffline ? "offline/movies.xml" : moviesPayloadUrl;
  const fInit = { method: "GET", headers };
  const fRequest = new Request(fUrl);
  fetch(fRequest, fInit).then(res => {
    if (res.ok && res.status === 200) {
      res.text().then(xmlString => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "application/xml");
        const moviesJson = xmlToJson(xmlDoc);
        movies = (moviesJson.MediaContainer ?? {}).Video ?? [];
        init();
        renderStatsLatest();
        renderCatalog();
      });
    } else {
      throw new Error(`${res.status} - ${res.statusText}`);
    }
  }).catch(err => {
    document.querySelector("section.alert").innerHTML = `<h4>${trans("Error accessing the database")}.</h4>`;
    console.error(`Fetch Error: ${err.message}`);
  });
});

/**
 * Init - now that we have declared all the ways to manipulate and retrieve payloads, finally
 * declare what those payloads are and what to do with them
 */
const init = () => {
  const catalogSortButtons = document.querySelectorAll(".controls button.sort");
  const catalogTitleSearchInput = document.querySelector(".controls input.filter-title-input");
  const catalogTitleClearButton = document.querySelector(".controls svg.filter-title-clear");
  const lastEntryClearFunc = () => {
    if (lastEntryShowEl) {
      lastEntryShowEl.classList.remove("show");
      lastEntryShowEl = null;
    }
  };
  libraryStats["Movies"] = movies.length;

  // sorting
  catalogSortButtons.forEach(catalogSortButton => {
    catalogSortButton.onclick = () => {
      lastEntryClearFunc();
      if (catalogSortButton.classList.contains("active")) {
        if (catalogSortButton.classList.contains("reverse-sort")) {
          isotope.arrange({ sortAscending: true });
          catalogSortButton.classList.remove("reverse-sort");
        } else {
          isotope.arrange({ sortAscending: false });
          catalogSortButton.classList.add("reverse-sort");
        }
      } else {
        catalogSortButtons.forEach(catalogSortButton2 => {
          catalogSortButton2.classList.remove("active");
          catalogSortButton2.classList.remove("reverse-sort");
        });
        catalogSortButton.classList.add("active");
        isotope.arrange({ sortBy: catalogSortButton.getAttribute("data-sort"), sortAscending: true });
      }
    };
  });

  // filtering
  let debounceTimerId;
  const filterFunc = searchString => {
    isotope.arrange({
      filter: itemEl => {
        const regexp = new RegExp(searchString, "i");
        return (
          itemEl.getAttribute("data-title").match(regexp) ||
          itemEl.getAttribute("data-originaltitle").match(regexp) ||
          itemEl.getAttribute("data-staff").match(regexp)
        );
      }
    });
  };
  catalogTitleSearchInput.oninput = () => {
    clearTimeout(debounceTimerId);
    debounceTimerId = setTimeout(() => {
      lastEntryClearFunc();
      catalogTitleSearchInput.value.length ?
        filterFunc(catalogTitleSearchInput.value) :
        isotope.arrange({ filter: "*" });
    }, 400);
  };
  catalogTitleClearButton.onclick = () => {
    lastEntryClearFunc();
    catalogTitleSearchInput.value = "";
    isotope.arrange({ filter: "*" });
  };
};

/**
 * Render movie charts on page load
 */
const renderStatsLatest = () => {
  const movieCount = movies.length;
  const countries = {}; // this stores country: count
  const countryList = [];
  const countryCounts = [];
  const releaseDateList = [];
  const releaseDateCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const decadePrefixes = ["193", "194", "195", "196", "197", "198", "199", "200", "201", "202"];
  const decades = ["1930", "1940", "1950", "1960", "1970", "1980", "1990", "2000", "2010", "2020"];
  const studioList = [];
  const genres = {}; // this stores genre: count, and is then split into the two following arrays
  const genreList = [];
  const genreCounts = [];
  const latestEntries = [];
  let durationSum = 0;

  movies.forEach((entry, index) => {
    releaseDateList.push(entry["@attributes"].year); // track year
    studioList.push(entry["@attributes"].studio); // track studio
    durationSum += entry["@attributes"].duration / 60000; // track durations

    if (index == movieCount - 1) { // if it's the last entry
      const totalMins = Math.round(durationSum);
      const totalHours = Math.floor(durationSum / 60);
      const displayMins = totalMins - (totalHours * 60);
      // append stats to library stats panel
      const libraryStatsEl = createElementFromHTML(
        `<div class="data-entry" title="Movies-stats"><h4 class="title">${trans("Movies")}</h4>` +
        `<p class="stat count"><strong>${movieCount}</strong> ${trans("Movies")}</p>` +
        `<p class="stat duration"><strong>${totalHours}</strong> ${trans("Hours")} / ` +
        `<strong>${displayMins}</strong> ${trans("Mins")}</p></div>`
      );
      document.querySelector(".statistics .data-grid .grid").append(libraryStatsEl);
    }

    // track genres
    if (entry.Genre) {
      if (entry.Genre.length > 1) { // check if a genre exists for movie
        // handle multiple genres, which is an array of objects
        for (const genre of entry.Genre) {
          genres[genre["@attributes"].tag] = (genres[genre["@attributes"].tag] ?? 0) + 1;
        }
      } else {
        // handle single genre which is an object / dictionary
        genres[entry["@attributes"].tag] = (genres[entry["@attributes"].tag] ?? 0) + 1;
      }
    }

    // track countries
    if (entry.Country) {
      if (entry.Country.length > 1) { // check if a country exists for movie
        // handle multiple countries, which is an array of objects
        for (const country of entry.Country) {
          countries[country["@attributes"].tag] = (countries[country["@attributes"].tag] ?? 0) + 1;
        }
      } else {
        // handle single country which is an object / dictionary
        countries[entry["@attributes"].tag] = (countries[entry["@attributes"].tag] ?? 0) + 1;
      }
    }

    // latest movies
    const lastEntry = latestEntries.slice(-1)[0];
    const lastAddedAt = lastEntry ? parseInt(lastEntry["@attributes"].addedAt) : -1;
    if (parseInt(entry["@attributes"].addedAt) > lastAddedAt) {
      latestEntries.push(entry);
      latestEntries.sort((entryA, entryB) => {
        const addedAtA = parseInt(entryA["@attributes"].addedAt);
        const addedAtB = parseInt(entryB["@attributes"].addedAt);
        return addedAtB - addedAtA;
      });
      latestEntries.splice(6);
    }
  });

  delete genres["undefined"]; // remove movies without genre
  delete countries["undefined"]; // remove movies without country

  // movies by country chart
  let sortedCountries = [];
  for (const country in countries) {
    sortedCountries.push([country, countries[country]]);
  }
  sortedCountries.sort(function (a, b) {
    return a[1] - b[1];
  })
  sortedCountries = sortedCountries.reverse();
  for (const property in sortedCountries) {
    // split the countries dictionary into an array of countries and an array of counts
    countryList.push(sortedCountries[property][0]);
    countryCounts.push(sortedCountries[property][1]);
  }
  if (countryList.length >= 20) {
    // trim to top 20, accounting for placeholder string in chart array
    countryList.length = 20;
    countryCounts.length = 20;
  }
  countryCounts.unshift("countryCounts");

  // movies by genre chart
  let sortedGenres = [];
  for (const genre in genres) {
    sortedGenres.push([genre, genres[genre]]);
  }
  sortedGenres.sort(function (a, b) {
    return a[1] - b[1];
  })
  sortedGenres = sortedGenres.reverse();
  // split the sorted genres dictionary into an array of genres and an array of counts
  for (const property in sortedGenres) {
    genreList.push(sortedGenres[property][0]);
    genreCounts.push(sortedGenres[property][1]);
  }
  if (genreList.length >= 20) {
    genreList.length = 20;
    genreCounts.length = 20;
  }
  genreCounts.unshift("genreCounts");

  // movies by decade chart
  for (const releaseDate of releaseDateList) {
    const yearSub = typeof releaseDate === "string" || releaseDate instanceof String ? releaseDate.substring(0, 3) : "undefined";
    for (let i = 0; i < decadePrefixes.length; i++) {
      if (yearSub == decadePrefixes[i]) {
        releaseDateCounts[i]++;
      }
    }
  }
  releaseDateCounts.unshift("releaseDateCounts");

  // movies by studio chart
  const studioInstances = {};
  const studios = [];
  // count how many times each studio occurs in studioList, and build a dictionary from results
  for (let i = 0, j = studioList.length; i < j; i++) {
     studioInstances[studioList[i]] = (studioInstances[studioList[i]] ?? 0) + 1;
  }
  delete studioInstances["undefined"]; // remove movies without studio
  for (const prop in studioInstances) { // split dictionary into two arrays
    if (studioInstances.hasOwnProperty(prop)) {
      studios.push([prop, studioInstances[prop]]);
    }
  }

  // render charts
  document.querySelector("section.alert").classList.add("hidden");
  document.querySelector("section.stats").classList.remove("hidden");
  c3.generate({
    size: { height: 550 },
    bindto: ".movies-by-country",
    x: "x",
    data: {
      columns: [ countryCounts ],
      type: "bar"
    },
    axis: {
      rotated: true,
      x: { type: "category", categories: countryList }
    },
    legend: { hide: true },
    color: {
      pattern: ["#D62828", "#F75C03", "#F77F00", "#FCBF49", "#EAE2B7"]
    }
  });
  c3.generate({
    size: { height: 550 },
    bindto: ".movies-by-genre",
    x: "x",
    data: {
      columns: [ genreCounts ],
      type: "bar"
    },
    axis: {
      rotated: true,
      x: { type: "category", categories: genreList }
    },
    legend: { hide: true },
    color: {
      pattern: ["#D62828", "#F75C03", "#F77F00", "#FCBF49", "#EAE2B7"]
    }
  });
  c3.generate({
    bindto: ".movies-by-decade",
    x: "x",
    data: {
      columns: [ releaseDateCounts ],
      type: "bar"
    },
    axis: {
      x: { type: "category", categories: decades }
    },
    legend: { hide: true },
    color: {
      pattern: ["#D62828", "#F75C03", "#F77F00", "#FCBF49", "#EAE2B7"]
    }
  });
  c3.generate({
    bindto: ".movies-by-studio",
    data: {
      columns: studios.slice(0, 50),
      type : "pie"
    },
    pie: {
      label: {
        format: function (value, ratio, id) { return value; }
      }
    },
    color: {
      pattern: ["#D62828", "#F75C03", "#F77F00", "#FCBF49", "#EAE2B7"]
    },
    legend: { hide: true },
    tooltip: {
      format: {
        value: function (value, ratio, id) { return id + " : " + value; }
      }
    }
  });

  // render latest movies
  for (const entry of latestEntries) {
    const src = getThumbUrl(entry["@attributes"].thumb);
    const title = entry["@attributes"].title;
    const thumbEl = createElementFromHTML(`<img class="thumb-entry" title="${title}" alt="${title}" src="${src}" />`);
    document.querySelector(".latest .thumb-grid .grid").append(thumbEl);
  }
};

/**
 * Render catalog - this function accepts payloads from one or more urls and creates
 * a grid, displaying cover art and basic metadata in a sortable UI
 */
const renderCatalog = () => {
  const catalogGridEl = document.querySelector(".content .grid");

  // parse payload items and build each entry into the DOM
  movies.forEach(entry => {
    const attr = entry["@attributes"];
    const title = attr.title;
    const titleSort = (attr.titleSort ?? title).toLowerCase();
    const originalTitle = attr.originalTitle ?? title;
    const year = attr.year;
    const thumb = attr.thumb;
    const type = attr.type;
    const duration = attr.duration;
    const ratingCritic = attr.rating ?? "-";
    const ratingAudience = attr.audienceRating ?? "-";
    const directorsArr = getNamesArray(entry, "Director");
    const castArr = getNamesArray(entry, "Role");
    const synopsis = attr.summary ?? "";
    const imageUrl = getThumbUrl(thumb);

    const entryEl = createElementFromHTML(
      `<div class="entry-container" ` +
        `data-datereleased="${year}" ` +
        `data-title="${title}" ` +
        `data-sorttitle="${titleSort}" ` +
        `data-originaltitle="${originalTitle}" ` +
        `data-ratingcritic="${ratingCritic}" ` +
        `data-ratingaudience="${ratingAudience}" ` +
        `data-staff="${directorsArr.concat(castArr).join("|")}">` +
        `<div class="entry ${type}" ` +
          `style="background-image:url('${imageUrl}');">` +
          `<div class="entry-inner">` +
            `<div class="data-container">` +
              `<p class="title">${originalTitle}</p>` +
              `<p class="duration">${Math.floor(duration / 60000)} min</p>` +
              `<p class="director">${directorsArr.join(", ")}</p>` +
              `<p class="cast">${castArr.join(", ")}</p>` +
              `<p class="rating">${trans("Critic")}: ${ratingCritic}</p>` +
              `<p class="rating">${trans("Audience")}: ${ratingAudience}</p>` +
              `<p class="synopsis-link"><span>${trans("Synopsis")}<svg viewBox="0 0 16 16"><use xlink:href="#icon-link"></use></svg></span></p>` +
            `</div>` +
            `<div class="synopsis-container hidden">` +
              `<p class="synopsis">${synopsis}</p>` +
            `</div>` +
          `</div>` +
        `</div>` +
        `<p class="title-sub">${title}</p>` +
        `<p class="year-sub">${year}</p>` +
      `</div>`
    );

    const entryInnerEl = entryEl.querySelector(".entry .entry-inner");
    const mainContainer = entryEl.querySelector(".entry .entry-inner .data-container");
    const synopsisContainer = entryEl.querySelector(".entry .entry-inner .synopsis-container");
    entryInnerEl.onclick = () => {
      if (entryInnerEl.classList.contains("show")) {
        entryInnerEl.classList.remove("show");
        lastEntryShowEl = null;
      } else {
        entryInnerEl.classList.add("show");
        if (lastEntryShowEl) {
          lastEntryShowEl.classList.remove("show");
        }
        lastEntryShowEl = entryInnerEl;
      }
      mainContainer.classList.remove("hidden");
      synopsisContainer.classList.add("hidden");
    };

    const synopsisLinkEl = entryEl.querySelector(".entry .entry-inner .synopsis-link span");
    synopsisLinkEl.onclick = (event) => {
      if (entryInnerEl.classList.contains("show")) {
        event.stopPropagation();
        mainContainer.classList.add("hidden");
        synopsisContainer.classList.remove("hidden");
      }
    };

    catalogGridEl.append(entryEl);
  });

  document.querySelector("section.catalog").classList.remove("hidden");

  // since the .content area was hidden (0 width) when the entries were appended, they all stack on top
  // of each other, and now we need to initialize isotope on grid for a fresh sort, which re-aligns them
  isotope = new Isotope(catalogGridEl, {
    itemSelector: "div.entry-container",
    // layoutMode: "fitRows",
    layoutMode: "masonry",
    masonry: {
      fitWidth: true
    },
    getSortData: {
      name: "[data-sorttitle]",
      dateReleased: "[data-datereleased]",
      ratingCritic: itemEl => {
        const ratingCritic = itemEl.getAttribute("data-ratingcritic");
        return ratingCritic === "-" ? 0 : parseFloat(ratingCritic);
      },
      ratingAudience: itemEl => {
        const ratingAudience = itemEl.getAttribute("data-ratingaudience");
        return ratingAudience === "-" ? 0 : parseFloat(ratingAudience);
      },
    },
    sortBy: "name"
  });

  // watch empty results
  const noResultsEl = document.querySelector(".content .no-results");
  isotope.on("arrangeComplete", filteredItems => {
    if (filteredItems.length === 0) {
      noResultsEl.classList.remove("hidden");
    } else {
      noResultsEl.classList.add("hidden");
    }
  });
};

/**
 * Get name or names (Director, Genre, Role, etc.) of an entry object as array
 * @param {object} entry
 * @param {string} key
 * @param {boolean} onlyOne
 * @returns {array}
 */
const getNamesArray = (entry, key, onlyOne = false) => {
  const prop = entry[key] ?? {};
  if (Array.isArray(prop)) {
    if (onlyOne && prop.length > 0) {
      const tag = (prop[0]["@attributes"] ?? {}).tag;
      return tag ? [tag] : [];
    } else {
      const names = prop.map(child => (child["@attributes"] ?? {}).tag ?? "");
      return names.filter(name => !!name);
    }
  } else {
    const tag = (prop["@attributes"] ?? {}).tag;
    return tag ? [tag] : [];
  }
};
