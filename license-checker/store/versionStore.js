import { defineStore } from "pinia";

// Helper function to parse CSV dates
const parseCSVDate = (month, day, year) => {
  try {
    const formattedDate = new Date(`${month} ${day}, ${year}`);
    if (isNaN(formattedDate.getTime())) {
      console.error(`Invalid date parsed from CSV: ${month} ${day}, ${year}`);
      return null;
    }
    return formattedDate.toISOString().split("T")[0]; // Convert to YYYY-MM-DD
  } catch (error) {
    console.error("Error parsing CSV date:", month, day, year, error);
    return null;
  }
};

export const useVersionStore = defineStore("versionStore", {
    state: () => ({
      versions: [],
    }),
    actions: {
      async fetchVersions() {
        try {
          console.log("Fetching versions from CSV...");
          const response = await fetch("/versions.csv");
          const text = await response.text();
  
          this.versions = text.split("\n").slice(1).map((line, index) => {
            const columns = line.replace("\r", "").split(",");
  
            // ✅ Ensure we have exactly 4 columns (version, month, day, year)
            if (columns.length < 4) {
              console.warn(`Skipping invalid row at line ${index + 2}:`, columns);
              return null;
            }
  
            const [version, month, day, year] = columns.map(col => col ? col.trim() : null);
  
            // ✅ Ensure no null values before proceeding
            if (!version || !month || !day || !year) {
              console.warn(`Skipping incomplete row at line ${index + 2}:`, columns);
              return null;
            }
  
            const parsedDate = parseCSVDate(month, day, year);
            return parsedDate ? { version, date: new Date(parsedDate) } : null;
          }).filter(entry => entry !== null);
  
          console.log("First 3 processed versions:", this.versions.slice(0, 3));
          window.checkSpecificVersion = this.checkSpecificVersion; // Expose globally
        } catch (error) {
          console.error("Error fetching versions:", error);
        }
      },
    },
  });
  