<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-6 w-full max-w-lg bg-white shadow-lg rounded-lg">
      <h2 class="text-2xl font-bold mb-6 text-center text-gray-800">License Compatibility Checker</h2>
      
      <input type="file" @change="handleFileUpload" class="mb-4 block w-full p-2 border rounded-md shadow-sm text-gray-700" />
      
      <label class="block mb-2 font-medium text-gray-700">Or enter issued date:</label>
      <input type="date" v-model="issuedDate" class="border p-2 w-full rounded-md shadow-sm text-gray-700" @input="handleDateChange" />
      
      <div v-if="forever" class="mt-6 bg-blue-100 p-4 rounded-md">
        <h3 class="font-semibold text-blue-800">Perpetual License</h3>
        <p class="text-blue-700">This license is perpetual, meaning it is compatible with all versions. You can always use the most up-to-date version of the product.</p>
      </div>
      
      <div v-else-if="compatibleVersions.length" class="mt-6 bg-green-100 p-4 rounded-md">
        <h3 class="font-semibold text-green-800">Compatible Versions:</h3>
        <ul class="list-disc pl-5 mt-2 text-green-700">
          <li v-for="version in compatibleVersions" :key="version">{{ version }}</li>
        </ul>
      </div>
      
      <div v-else-if="issuedDate" class="mt-6 bg-red-100 p-4 rounded-md text-red-700">
        No compatible versions found.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useVersionStore } from "@/store/versionStore";

const issuedDate = ref("");
const compatibleVersions = ref([]);
const versionStore = useVersionStore();
const forever = ref(false); // Track if the license is perpetual

// Fetch versions when the component mounts
onMounted(versionStore.fetchVersions);

// Computed property to access versions from store
const versions = computed(() => versionStore.versions);

const handleDateChange = () => {
  resetCompatibility();
  checkCompatibility();
};

const checkCompatibility = () => {
  try {
    if (!issuedDate.value) return;

    console.log("Checking compatibility for issued date:", issuedDate.value);
    
    // If forever license, show perpetual license message
    if (forever.value) {
      console.log("License is perpetual. User can always use the latest version.");
      compatibleVersions.value = [];
      return;
    }

    // Convert issued date & expiry date to Date objects
    const issueDate = new Date(issuedDate.value);
    const expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    console.log("Valid range for compatibility:", issueDate, "to", expiryDate);

    // Ensure comparison is done using Date objects
    compatibleVersions.value = versions.value
      .filter(({ date }) => {
        const releaseDate = new Date(date);
        return releaseDate >= issueDate && releaseDate <= expiryDate;
      })
      .map(({ version }) => version);

    console.log("Compatible Versions:", compatibleVersions.value);
  } catch (error) {
    console.error("Error checking compatibility:", error);
  }
};

const handleFileUpload = (event) => {
  try {
    const file = event.target.files[0];
    if (!file) {
      console.warn("No file selected.");
      return;
    }
    console.log("Reading file:", file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parser = new DOMParser();
        const xml = parser.parseFromString(e.target.result, "text/xml");

        resetCompatibility();

        // Extract <issued> date
        const issuedNode = xml.querySelector("issued");
        if (issuedNode && issuedNode.textContent) {
          issuedDate.value = issuedNode.textContent.split("T")[0];
          console.log("Extracted issued date:", issuedDate.value);
        } else {
          console.warn("Issued date not found in XML file.");
        }

        // Extract <forever> status
        const foreverNode = xml.querySelector("forever");
        forever.value = foreverNode && foreverNode.textContent.toLowerCase() === "true";
        console.log("License is perpetual:", forever.value);

        checkCompatibility();
      } catch (error) {
        console.error("Error parsing XML file:", error);
      }
    };
    reader.readAsText(file);
  } catch (error) {
    console.error("Error handling file upload:", error);
  }
};

const resetCompatibility = () => {
  compatibleVersions.value = [];
  forever.value = false;
  console.log("Compatibility state reset for new input.");
};
</script>

<style>
body {
  font-family: 'Inter', sans-serif;
  background-color: #f7f9fc;
}
</style>
