import { defineStore } from "pinia";
import { parseChangelogText } from "~/utils/changelogParser";
import { buildDownloadUrl, parseCsvDate } from "~/utils/licenseCompatibility";

const PRODUCT_FILES = {
  windows: {
    versions: "/versions.csv",
    changelog: "/windows-changelog.txt",
  },
  android: {
    versions: "/android-versions.csv",
    changelog: "/android-changelog.txt",
  },
};

const PRODUCT_LABELS = {
  windows: "LaunchBox Windows",
  android: "LaunchBox Android",
};

export const useVersionStore = defineStore("versionStore", {
  state: () => ({
    versionsByProduct: {
      windows: [],
      android: [],
    },
    isLoadingByProduct: {
      windows: false,
      android: false,
    },
    errorsByProduct: {
      windows: "",
      android: "",
    },
  }),
  actions: {
    async fetchVersions(productKey) {
      const productFiles = PRODUCT_FILES[productKey];

      if (!productFiles) {
        return;
      }

      if (
        this.versionsByProduct[productKey].length ||
        this.isLoadingByProduct[productKey]
      ) {
        return;
      }

      this.isLoadingByProduct[productKey] = true;
      this.errorsByProduct[productKey] = "";

      try {
        const response = await fetch(productFiles.versions);

        if (!response.ok) {
          throw new Error(`Version data request failed with status ${response.status}.`);
        }

        const text = await response.text();
        let changelogByVersion = {};

        try {
          const changelogResponse = await fetch(productFiles.changelog);

          if (changelogResponse.ok) {
            changelogByVersion = parseChangelogText(await changelogResponse.text());
          } else {
            console.warn(
              `Changelog request for ${productKey} returned status ${changelogResponse.status}.`,
            );
          }
        } catch (error) {
          console.warn(`Could not load changelog notes for ${productKey}.`, error);
        }

        const parsedVersions = text
          .split(/\r?\n/)
          .slice(1)
          .map((line, index) => {
            if (!line.trim()) {
              return null;
            }

            const columns = line.split(",");

            if (columns.length < 4) {
              console.warn(`Skipping invalid row at line ${index + 2}:`, columns);
              return null;
            }

            const [version, month, day, year] = columns.map((column) =>
              column ? column.trim() : "",
            );

            if (!version || !month || !day || !year) {
              console.warn(`Skipping incomplete row at line ${index + 2}:`, columns);
              return null;
            }

            const releaseDate = parseCsvDate(month, day, year);

            if (!releaseDate) {
              console.warn(
                `Skipping row with an invalid release date at line ${index + 2}:`,
                columns,
              );
              return null;
            }

            return {
              version,
              releaseDate,
              productKey,
              productLabel: PRODUCT_LABELS[productKey],
              downloadUrl: buildDownloadUrl(productKey, version),
              notes: changelogByVersion[version] || [],
            };
          })
          .filter(Boolean)
          .sort((left, right) => right.releaseDate.localeCompare(left.releaseDate));

        this.versionsByProduct[productKey] = parsedVersions;
      } catch (error) {
        this.errorsByProduct[productKey] =
          `Could not load the ${PRODUCT_LABELS[productKey]} release list.`;
        console.error(`Error fetching ${productKey} versions:`, error);
      } finally {
        this.isLoadingByProduct[productKey] = false;
      }
    },
  },
});
