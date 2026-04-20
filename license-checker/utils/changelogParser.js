const VERSION_HEADER_PATTERN = /^Version\s+(.+?)\s+-\s+Released\s+(.+)$/;

export const parseChangelogText = (text) => {
  const changelogByVersion = {};
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
  let currentVersion = "";
  let currentNotes = [];

  const commitCurrentVersion = () => {
    if (!currentVersion) {
      return;
    }

    changelogByVersion[currentVersion] = currentNotes;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      continue;
    }

    const versionHeader = line.match(VERSION_HEADER_PATTERN);

    if (versionHeader) {
      commitCurrentVersion();
      currentVersion = versionHeader[1];
      currentNotes = [];
      continue;
    }

    if (!currentVersion) {
      continue;
    }

    currentNotes.push(line);
  }

  commitCurrentVersion();
  return changelogByVersion;
};
