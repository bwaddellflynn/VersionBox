const MONTH_INDEX = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

const padNumber = (value) => String(value).padStart(2, "0");

const formatIsoDate = (date) => {
  const year = date.getUTCFullYear();
  const month = padNumber(date.getUTCMonth() + 1);
  const day = padNumber(date.getUTCDate());
  return `${year}-${month}-${day}`;
};

const createUtcDate = (year, monthIndex, day) => {
  const parsedYear = Number(year);
  const parsedMonthIndex = Number(monthIndex);
  const parsedDay = Number(day);

  if (
    Number.isNaN(parsedYear) ||
    Number.isNaN(parsedMonthIndex) ||
    Number.isNaN(parsedDay)
  ) {
    return null;
  }

  const date = new Date(Date.UTC(parsedYear, parsedMonthIndex, parsedDay));

  if (
    date.getUTCFullYear() !== parsedYear ||
    date.getUTCMonth() !== parsedMonthIndex ||
    date.getUTCDate() !== parsedDay
  ) {
    return null;
  }

  return date;
};

const normalizeVersionQuery = (value = "") =>
  value.trim().replace(/^v/i, "").toLowerCase();

export const parseCsvDate = (month, day, year) => {
  const monthIndex = MONTH_INDEX[month?.trim().toLowerCase()];

  if (monthIndex === undefined) {
    return null;
  }

  const date = createUtcDate(year, monthIndex, day);
  return date ? formatIsoDate(date) : null;
};

export const addOneYearToDate = (isoDate) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  const date = createUtcDate(year, month - 1, day);

  if (!date) {
    return null;
  }

  date.setUTCFullYear(date.getUTCFullYear() + 1);
  return formatIsoDate(date);
};

export const buildDownloadUrl = (productKey, version) =>
  `/downloads/launchbox/${encodeURIComponent(productKey)}/${encodeURIComponent(version)}`;

export const parseLicenseXml = (xmlText) => {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "text/xml");
  const parserError = xml.querySelector("parsererror");

  if (parserError) {
    throw new Error("The uploaded file is not valid XML.");
  }

  const getText = (selector) => xml.querySelector(selector)?.textContent?.trim() || "";
  const issuedText = getText("issued");

  if (!issuedText) {
    throw new Error("The uploaded license file does not include an issued date.");
  }

  return {
    issuedDate: issuedText.split("T")[0],
    forever: getText("forever").toLowerCase() === "true",
    name: getText("name"),
    email: getText("email"),
  };
};

export const getCompatibleVersions = (versions, { issuedDate, forever }) => {
  if (!versions.length) {
    return [];
  }

  if (forever) {
    return versions;
  }

  if (!issuedDate) {
    return [];
  }

  const entitlementEndDate = addOneYearToDate(issuedDate);

  if (!entitlementEndDate) {
    return [];
  }

  return versions.filter(({ releaseDate }) => releaseDate <= entitlementEndDate);
};

export const findVersion = (versions, query) => {
  const normalizedQuery = normalizeVersionQuery(query);

  if (!normalizedQuery) {
    return null;
  }

  return (
    versions.find(
      ({ version }) => normalizeVersionQuery(version) === normalizedQuery,
    ) || null
  );
};
