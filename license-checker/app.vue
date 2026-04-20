<template>
  <div class="page-shell">
    <div class="mx-auto w-full max-w-5xl">
      <div class="page-frame p-5 md:p-6">
        <div class="page-hero">
          <div class="hero-layout">
            <div class="hero-copy">
              <p class="eyebrow text-sm font-semibold uppercase tracking-[0.24em]">
                {{ currentProductTitle }}
              </p>
              <h1 class="page-title mt-3 text-2xl font-semibold tracking-tight md:text-3xl">
                License Version Checker
              </h1>
              <p class="page-copy mt-3 text-sm leading-6">
                Upload your license or enter an issue date to find the newest
                compatible {{ currentProductLabel }} version.
              </p>
            </div>

            <div class="hero-controls">
              <p class="meta-label text-xs font-medium uppercase tracking-[0.18em]">
                Product
              </p>
              <div class="product-switch mt-3">
                <button
                  v-for="product in productOptions"
                  :key="product.key"
                  :class="[
                    'product-pill',
                    selectedProduct === product.key
                      ? product.key === 'windows'
                        ? 'product-pill--windows-active'
                        : 'product-pill--android-active'
                      : 'product-pill--idle',
                  ]"
                  type="button"
                  @click="selectedProduct = product.key"
                >
                  {{ product.label }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="widget-stack mt-5">
          <section class="panel panel--hero p-5">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="panel-title text-lg font-semibold">
                    Most Recent Compatible Version
                  </h2>
                </div>
                <span class="platform-badge px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {{ currentProductLabel }}
                </span>
            </div>

            <div
              v-if="versionLoadError"
              class="status-card status-card--error mt-4 text-sm"
            >
              {{ versionLoadError }}
            </div>

            <div
              v-else-if="isLoadingVersions && !allVersions.length"
              class="status-card status-card--info mt-4 text-sm"
            >
              Loading the {{ currentProductTitle }} release list...
            </div>

            <div
              v-else-if="latestCompatibleVersion"
              class="result-panel mt-4 p-5"
            >
              <div class="result-layout">
                <div>
                  <h3 class="value-title text-4xl font-semibold tracking-tight">
                    {{ latestCompatibleVersion.version }}
                  </h3>
                  <div class="meta-grid mt-5">
                    <div>
                      <p class="meta-label text-xs font-medium uppercase tracking-wide">
                        Released
                      </p>
                      <p class="panel-copy mt-1 text-sm">
                        {{ formatDate(latestCompatibleVersion.releaseDate) }}
                      </p>
                    </div>
                    <div>
                      <p class="meta-label text-xs font-medium uppercase tracking-wide">
                        Eligibility
                      </p>
                      <p class="panel-copy mt-1 text-sm">
                        {{
                          forever
                            ? "Forever updates"
                            : entitlementEndDate
                              ? `Through ${formatDate(entitlementEndDate)}`
                              : "Upload a license or enter a date"
                        }}
                      </p>
                    </div>
                  </div>
                </div>

                <div class="result-actions">
                  <div class="action-stack">
                    <a
                      :href="latestCompatibleVersion.downloadUrl"
                      :class="downloadButtonClass"
                    >
                      Download
                    </a>
                    <button
                      v-if="hasPatchNotes(latestCompatibleVersion)"
                      class="action-button action-button--ghost action-button--small"
                      type="button"
                      @click="openPatchNotes(latestCompatibleVersion)"
                    >
                      Patch Notes
                    </button>
                  </div>
                  <p class="fine-copy text-xs">
                    Download links are placeholders for now.
                  </p>
                </div>
              </div>

              <details
                v-if="olderCompatibleVersions.length"
                class="nested-panel mt-5 p-4"
              >
                <summary class="details-summary cursor-pointer list-none text-sm font-semibold">
                  <span class="inline-flex items-center gap-2">
                    Show older compatible versions
                    <span class="count-badge px-2.5 py-0.5 text-xs font-medium">
                      {{ olderCompatibleVersions.length }}
                    </span>
                  </span>
                </summary>

                <ul class="mt-4 space-y-3">
                  <li
                    v-for="version in olderCompatibleVersions"
                    :key="version.version"
                    class="item-card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p class="meta-value text-base font-semibold">
                        {{ version.version }}
                      </p>
                      <p class="panel-copy mt-1 text-sm">
                        Released {{ formatDate(version.releaseDate) }}
                      </p>
                    </div>

                    <div class="item-actions">
                      <a
                        :href="version.downloadUrl"
                        :class="downloadButtonClass"
                      >
                        Download
                      </a>
                      <button
                        v-if="hasPatchNotes(version)"
                        class="action-button action-button--ghost action-button--small"
                        type="button"
                        @click="openPatchNotes(version)"
                      >
                        Patch Notes
                      </button>
                    </div>
                  </li>
                </ul>
              </details>
            </div>

            <div
              v-else-if="hasCompatibilityContext"
              class="status-card status-card--error mt-4 text-sm"
            >
              No compatible {{ currentProductLabel }} versions were found for the
              current license context.
            </div>

            <div
              v-else
              class="status-card status-card--neutral mt-4 text-sm"
            >
              No license loaded yet. Upload a license or enter a date to begin.
            </div>
          </section>

          <section class="panel panel--compact p-5">
            <div
              class="workspace-tabs"
              role="tablist"
              aria-label="Widget tools"
            >
              <button
                :class="[
                  'workspace-tab',
                  activeWorkspaceTab === 'license'
                    ? 'workspace-tab--license-active'
                    : 'workspace-tab--idle',
                ]"
                :aria-selected="activeWorkspaceTab === 'license'"
                role="tab"
                type="button"
                @click="activeWorkspaceTab = 'license'"
              >
                License Input
              </button>
              <button
                :class="[
                  'workspace-tab',
                  activeWorkspaceTab === 'search'
                    ? 'workspace-tab--search-active'
                    : 'workspace-tab--idle',
                ]"
                :aria-selected="activeWorkspaceTab === 'search'"
                role="tab"
                type="button"
                @click="activeWorkspaceTab = 'search'"
              >
                Version Search
              </button>
            </div>

            <div
              v-if="activeWorkspaceTab === 'license'"
              class="tab-panel mt-5"
              role="tabpanel"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <h2 class="panel-title text-lg font-semibold">License Input</h2>
                  <p class="panel-copy mt-1 text-sm">
                    Upload a license file or enter the issued date manually.
                  </p>
                </div>
                <button
                  v-if="uploadedFileName || issuedDate"
                  class="action-button action-button--ghost"
                  type="button"
                  @click="clearLicenseContext"
                >
                  Clear
                </button>
              </div>

              <div class="status-card status-card--warning mt-4 text-sm">
                Windows and Android are separate products. Make sure the selected
                product above matches the license file or issue date you are
                checking for {{ currentProductLabel }}.
              </div>

              <label class="field-label mt-5 block text-sm font-medium" for="license-upload">
                Upload LaunchBox license XML
              </label>
              <input
                id="license-upload"
                accept=".xml,text/xml"
                class="upload-field mt-2 block px-4 py-3 text-sm"
                type="file"
                @change="handleFileUpload"
              />

              <div class="section-divider mt-5 pt-5">
                <label class="field-label block text-sm font-medium" for="issued-date">
                  Or enter an issued date
                </label>
                <div
                  id="issued-date"
                  class="date-segment-grid mt-2"
                  role="group"
                  aria-label="Issued date"
                >
                  <div>
                    <label class="date-segment-label mb-2 block text-xs font-medium uppercase tracking-wide" for="issued-year">
                      Year
                    </label>
                    <input
                      id="issued-year"
                      ref="issuedYearInput"
                      :value="issuedYear"
                      class="input-field block px-4 py-3 text-sm"
                      inputmode="numeric"
                      maxlength="4"
                      placeholder="YYYY"
                      type="text"
                      @input="handleDateSegmentInput('year', $event)"
                      @keydown="handleDateSegmentKeydown('year', $event)"
                    />
                  </div>
                  <div>
                    <label class="date-segment-label mb-2 block text-xs font-medium uppercase tracking-wide" for="issued-month">
                      Month
                    </label>
                    <input
                      id="issued-month"
                      ref="issuedMonthInput"
                      :value="issuedMonth"
                      class="input-field block px-4 py-3 text-sm"
                      inputmode="numeric"
                      maxlength="2"
                      placeholder="MM"
                      type="text"
                      @input="handleDateSegmentInput('month', $event)"
                      @keydown="handleDateSegmentKeydown('month', $event)"
                    />
                  </div>
                  <div>
                    <label class="date-segment-label mb-2 block text-xs font-medium uppercase tracking-wide" for="issued-day">
                      Day
                    </label>
                    <input
                      id="issued-day"
                      ref="issuedDayInput"
                      :value="issuedDay"
                      class="input-field block px-4 py-3 text-sm"
                      inputmode="numeric"
                      maxlength="2"
                      placeholder="DD"
                      type="text"
                      @input="handleDateSegmentInput('day', $event)"
                      @keydown="handleDateSegmentKeydown('day', $event)"
                    />
                  </div>
                </div>
              </div>

              <div
                v-if="fileError"
                class="status-card status-card--error mt-5 text-sm"
              >
                {{ fileError }}
              </div>

              <div
                v-if="uploadedFileName || issuedDate"
                class="inset-card mt-5 p-4"
              >
                <p class="meta-label text-sm font-semibold uppercase tracking-wide">
                  Current License Context
                </p>
                <p class="panel-copy mt-1 text-sm">
                  {{
                    uploadedFileName
                      ? `Parsed from ${uploadedFileName}`
                      : "Manual issue date entry"
                  }}
                </p>

                <dl class="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt class="meta-label text-xs font-medium uppercase tracking-wide">
                      Issued
                    </dt>
                    <dd class="meta-value mt-1 text-sm font-medium">
                      {{ issuedDate ? formatDate(issuedDate) : "Not set" }}
                    </dd>
                  </div>
                  <div>
                    <dt class="meta-label text-xs font-medium uppercase tracking-wide">
                      Update Eligibility
                    </dt>
                    <dd class="meta-value mt-1 text-sm font-medium">
                      {{
                        forever
                          ? "Forever updates"
                          : entitlementEndDate
                            ? `Through ${formatDate(entitlementEndDate)}`
                            : "Not set"
                      }}
                    </dd>
                  </div>
                  <div v-if="licenseHolderName">
                    <dt class="meta-label text-xs font-medium uppercase tracking-wide">
                      Name
                    </dt>
                    <dd class="meta-value mt-1 text-sm font-medium">
                      {{ licenseHolderName }}
                    </dd>
                  </div>
                  <div v-if="licenseHolderEmail">
                    <dt class="meta-label text-xs font-medium uppercase tracking-wide">
                      Email
                    </dt>
                    <dd class="meta-value mt-1 break-all text-sm font-medium">
                      {{ licenseHolderEmail }}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div
              v-else
              class="tab-panel mt-5"
              role="tabpanel"
            >
              <h2 class="panel-title text-lg font-semibold">Version Search</h2>
              <p class="panel-copy mt-1 text-sm">
                {{ searchPanelCopy }}
              </p>

              <div class="scope-switch mt-4">
                <button
                  :class="[
                    'scope-button',
                    searchScope === 'compatible' ? 'scope-button--magenta-active' : '',
                  ]"
                  type="button"
                  @click="searchScope = 'compatible'"
                >
                  Compatible
                </button>
                <button
                  :class="[
                    'scope-button',
                    searchScope === 'all' ? 'scope-button--green-active' : '',
                  ]"
                  type="button"
                  @click="searchScope = 'all'"
                >
                  All
                </button>
              </div>

              <label class="field-label mt-5 block text-sm font-medium" for="version-search">
                Search for a version
              </label>
              <input
                id="version-search"
                v-model="searchQuery"
                class="input-field mt-2 block px-4 py-3 text-sm"
                :placeholder="currentProductPlaceholder"
                type="text"
              />
              <p class="fine-copy mt-2 text-xs">
                Searches use exact version matches. Enter a full version number such
                as {{ currentProductPlaceholder }}.
              </p>

              <div v-if="hasSearchQuery" class="mt-5">
                <div
                  v-if="searchStatus === 'loading'"
                  class="status-card status-card--info text-sm"
                >
                  Loading the release list before searching...
                </div>

                <div
                  v-else-if="searchStatus === 'error'"
                  class="status-card status-card--error text-sm"
                >
                  {{ versionLoadError }}
                </div>

                <div
                  v-else-if="searchStatus === 'needs-license'"
                  class="status-card status-card--warning text-sm"
                >
                  Load a license or switch the search scope to All before searching
                  the compatible set.
                </div>

                <div
                  v-else-if="searchStatus === 'found'"
                  class="status-card status-card--search-hit p-4"
                >
                  <div class="flex flex-col gap-4">
                    <div>
                      <p class="section-kicker text-sm font-semibold uppercase tracking-wide">
                        {{
                          searchScope === "compatible"
                            ? "Compatible version found"
                            : "Version found"
                        }}
                      </p>
                      <h3 class="value-title mt-2 text-2xl font-semibold">
                        {{ scopedVersionMatch.version }}
                      </h3>
                      <p class="panel-copy mt-1 text-sm">
                        Released {{ formatDate(scopedVersionMatch.releaseDate) }}
                      </p>
                    </div>

                    <div class="search-actions">
                      <a
                        :href="scopedVersionMatch.downloadUrl"
                        :class="downloadButtonClass"
                      >
                        Download
                      </a>
                      <button
                        v-if="hasPatchNotes(scopedVersionMatch)"
                        class="action-button action-button--ghost action-button--small"
                        type="button"
                        @click="openPatchNotes(scopedVersionMatch)"
                      >
                        Patch Notes
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  v-else-if="searchStatus === 'not-compatible'"
                  class="status-card status-card--warning text-sm"
                >
                  <p class="meta-value font-semibold">
                    Version {{ allVersionMatch.version }} exists, but it is not
                    compatible with the current license.
                  </p>
                  <p class="fine-copy mt-1">
                    The current license is eligible through
                    {{ formatDate(entitlementEndDate) }}.
                  </p>
                  <button
                    v-if="hasPatchNotes(allVersionMatch)"
                    class="action-button action-button--ghost action-button--small mt-4"
                    type="button"
                    @click="openPatchNotes(allVersionMatch)"
                  >
                    Patch Notes
                  </button>
                </div>

                <div
                  v-else
                  class="status-card status-card--error text-sm"
                >
                  Version {{ searchQuery.trim() }} was not found in the
                  {{ currentProductLabel }} release list.
                </div>
              </div>
            </div>
          </section>
        </div>

        <div
          v-if="isPatchNotesOpen && activePatchNotes"
          class="notes-overlay"
          @click.self="closePatchNotes"
        >
          <section
            class="notes-modal p-5 md:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="patch-notes-title"
          >
            <div class="notes-modal__header">
              <div>
                <p class="section-kicker text-sm font-semibold uppercase tracking-wide">
                  {{ currentProductLabel }} patch notes
                </p>
                <h2
                  id="patch-notes-title"
                  class="value-title mt-2 text-2xl font-semibold tracking-tight"
                >
                  Version {{ activePatchNotes.version }}
                </h2>
                <p class="panel-copy mt-2 text-sm">
                  Released {{ formatDate(activePatchNotes.releaseDate) }}
                </p>
              </div>

              <button
                class="action-button action-button--ghost action-button--small"
                type="button"
                @click="closePatchNotes"
              >
                Close
              </button>
            </div>

            <div class="notes-modal__body mt-5">
              <ul class="notes-list">
                <li
                  v-for="(note, index) in activePatchNotes.notes"
                  :key="`${activePatchNotes.version}-${index}`"
                  class="notes-list__item text-sm leading-6"
                >
                  {{ note }}
                </li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useVersionStore } from "@/store/versionStore";
import {
  addOneYearToDate,
  findVersion,
  getCompatibleVersions,
  parseLicenseXml,
} from "~/utils/licenseCompatibility";

const PRODUCT_OPTIONS = [
  {
    key: "windows",
    label: "Windows",
    title: "LaunchBox Windows",
    placeholderVersion: "13.19",
  },
  {
    key: "android",
    label: "Android",
    title: "LaunchBox Android",
    placeholderVersion: "1.21",
  },
];

const versionStore = useVersionStore();
const selectedProduct = ref("windows");
const issuedDate = ref("");
const forever = ref(false);
const uploadedFileName = ref("");
const licenseHolderName = ref("");
const licenseHolderEmail = ref("");
const fileError = ref("");
const issuedYear = ref("");
const issuedMonth = ref("");
const issuedDay = ref("");
const issuedYearInput = ref(null);
const issuedMonthInput = ref(null);
const issuedDayInput = ref(null);
const searchQuery = ref("");
const searchScope = ref("all");
const activeWorkspaceTab = ref("license");
const activePatchNotes = ref(null);
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

onMounted(() => {
  versionStore.fetchVersions(selectedProduct.value);
  window.addEventListener("keydown", handleWindowKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleWindowKeydown);
});

watch(selectedProduct, (productKey, previousProductKey) => {
  if (productKey !== previousProductKey) {
    closePatchNotes();
    versionStore.fetchVersions(productKey);
  }
});

const currentProduct = computed(
  () =>
    PRODUCT_OPTIONS.find(({ key }) => key === selectedProduct.value) ||
    PRODUCT_OPTIONS[0],
);
const currentProductLabel = computed(() => currentProduct.value.label);
const currentProductTitle = computed(() => currentProduct.value.title);
const currentProductPlaceholder = computed(
  () => currentProduct.value.placeholderVersion,
);
const searchPanelCopy = computed(() =>
  searchScope.value === "compatible"
    ? `Search ${currentProductLabel.value} releases compatible with your license.`
    : `Search every ${currentProductLabel.value} release.`,
);
const allVersions = computed(
  () => versionStore.versionsByProduct[selectedProduct.value] || [],
);
const isLoadingVersions = computed(
  () => versionStore.isLoadingByProduct[selectedProduct.value],
);
const versionLoadError = computed(
  () => versionStore.errorsByProduct[selectedProduct.value],
);
const hasCompatibilityContext = computed(
  () => forever.value || Boolean(issuedDate.value),
);
const entitlementEndDate = computed(() => {
  if (forever.value || !issuedDate.value) {
    return "";
  }

  return addOneYearToDate(issuedDate.value) || "";
});
const compatibleVersions = computed(() =>
  getCompatibleVersions(allVersions.value, {
    issuedDate: issuedDate.value,
    forever: forever.value,
  }),
);
const latestCompatibleVersion = computed(() => compatibleVersions.value[0] || null);
const olderCompatibleVersions = computed(() => compatibleVersions.value.slice(1));
const scopedVersions = computed(() =>
  searchScope.value === "all" ? allVersions.value : compatibleVersions.value,
);
const isPatchNotesOpen = computed(() => Boolean(activePatchNotes.value));
const scopedVersionMatch = computed(() =>
  findVersion(scopedVersions.value, searchQuery.value),
);
const allVersionMatch = computed(() =>
  findVersion(allVersions.value, searchQuery.value),
);
const hasSearchQuery = computed(() => Boolean(searchQuery.value.trim()));
const downloadButtonClass = computed(() => [
  "action-button",
  selectedProduct.value === "android"
    ? "action-button--android"
    : "action-button--windows",
]);
const productOptions = PRODUCT_OPTIONS;
const searchStatus = computed(() => {
  if (!hasSearchQuery.value) {
    return "idle";
  }

  if (isLoadingVersions.value && !allVersions.value.length) {
    return "loading";
  }

  if (versionLoadError.value) {
    return "error";
  }

  if (searchScope.value === "compatible" && !hasCompatibilityContext.value) {
    return "needs-license";
  }

  if (scopedVersionMatch.value) {
    return "found";
  }

  if (searchScope.value === "compatible" && allVersionMatch.value) {
    return "not-compatible";
  }

  return "not-found";
});

const formatDate = (isoDate) =>
  dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));

const sanitizeDateSegment = (value, maxLength) =>
  String(value || "").replace(/\D/g, "").slice(0, maxLength);

const setIssuedDateSegments = (isoDate = "") => {
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    [issuedYear.value, issuedMonth.value, issuedDay.value] = isoDate.split("-");
    return;
  }

  issuedYear.value = "";
  issuedMonth.value = "";
  issuedDay.value = "";
};

const buildIssuedDateFromSegments = () => {
  if (
    issuedYear.value.length !== 4 ||
    issuedMonth.value.length !== 2 ||
    issuedDay.value.length !== 2
  ) {
    return "";
  }

  const year = Number(issuedYear.value);
  const month = Number(issuedMonth.value);
  const day = Number(issuedDay.value);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return "";
  }

  return `${issuedYear.value}-${issuedMonth.value}-${issuedDay.value}`;
};

const clearManualLicenseMetadata = () => {
  uploadedFileName.value = "";
  licenseHolderName.value = "";
  licenseHolderEmail.value = "";
  fileError.value = "";
  forever.value = false;
};

const updateIssuedDateFromSegments = () => {
  clearManualLicenseMetadata();
  issuedDate.value = buildIssuedDateFromSegments();
};

const focusDateSegment = (segment) => {
  const refsBySegment = {
    year: issuedYearInput,
    month: issuedMonthInput,
    day: issuedDayInput,
  };

  refsBySegment[segment]?.value?.focus();
};

const handleDateSegmentInput = (segment, event) => {
  const configBySegment = {
    year: { target: issuedYear, maxLength: 4, next: "month" },
    month: { target: issuedMonth, maxLength: 2, next: "day" },
    day: { target: issuedDay, maxLength: 2, next: "" },
  };
  const config = configBySegment[segment];

  if (!config) {
    return;
  }

  const sanitizedValue = sanitizeDateSegment(event.target.value, config.maxLength);
  config.target.value = sanitizedValue;

  if (event.target.value !== sanitizedValue) {
    event.target.value = sanitizedValue;
  }

  updateIssuedDateFromSegments();

  if (
    config.next &&
    sanitizedValue.length === config.maxLength &&
    !event.inputType?.startsWith("delete")
  ) {
    focusDateSegment(config.next);
  }
};

const handleDateSegmentKeydown = (segment, event) => {
  if (event.key !== "Backspace") {
    return;
  }

  const previousSegmentBySegment = {
    year: "",
    month: "year",
    day: "month",
  };
  const currentValueBySegment = {
    year: issuedYear.value,
    month: issuedMonth.value,
    day: issuedDay.value,
  };
  const previousSegment = previousSegmentBySegment[segment];

  if (!previousSegment || currentValueBySegment[segment]) {
    return;
  }

  focusDateSegment(previousSegment);
};

const hasPatchNotes = (version) =>
  Array.isArray(version?.notes) && version.notes.length > 0;

const openPatchNotes = (version) => {
  if (!hasPatchNotes(version)) {
    return;
  }

  activePatchNotes.value = version;
};

const closePatchNotes = () => {
  activePatchNotes.value = null;
};

const handleWindowKeydown = (event) => {
  if (event.key === "Escape" && isPatchNotesOpen.value) {
    closePatchNotes();
  }
};

const clearLicenseContext = () => {
  issuedDate.value = "";
  setIssuedDateSegments("");
  forever.value = false;
  uploadedFileName.value = "";
  licenseHolderName.value = "";
  licenseHolderEmail.value = "";
  fileError.value = "";
};

const handleFileUpload = async (event) => {
  const input = event.target;
  const file = input?.files?.[0];

  if (!file) {
    return;
  }

  fileError.value = "";
  const previousState = {
    issuedDate: issuedDate.value,
    forever: forever.value,
    uploadedFileName: uploadedFileName.value,
    licenseHolderName: licenseHolderName.value,
    licenseHolderEmail: licenseHolderEmail.value,
  };

  try {
    const parsedLicense = parseLicenseXml(await file.text());
    uploadedFileName.value = file.name;
    licenseHolderName.value = parsedLicense.name;
    licenseHolderEmail.value = parsedLicense.email;
    issuedDate.value = parsedLicense.issuedDate;
    setIssuedDateSegments(parsedLicense.issuedDate);
    forever.value = parsedLicense.forever;
  } catch (error) {
    issuedDate.value = previousState.issuedDate;
    setIssuedDateSegments(previousState.issuedDate);
    forever.value = previousState.forever;
    uploadedFileName.value = previousState.uploadedFileName;
    licenseHolderName.value = previousState.licenseHolderName;
    licenseHolderEmail.value = previousState.licenseHolderEmail;
    fileError.value =
      error instanceof Error
        ? error.message
        : "Could not parse the uploaded license file.";
  } finally {
    if (input) {
      input.value = "";
    }
  }
};
</script>

<style scoped>
.page-shell {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(1rem, 3vw, 2.5rem);
  box-sizing: border-box;
  color: var(--lb-body-strong);
}

@supports (min-height: 100dvh) {
  .page-shell {
    min-height: 100dvh;
  }
}

.page-frame {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 24px;
  border: 1px solid var(--lb-border);
  background:
    linear-gradient(180deg, rgba(21, 54, 66, 0.95) 0%, rgba(9, 31, 40, 0.98) 26%, rgba(4, 22, 29, 1) 100%);
  box-shadow: var(--lb-shadow);
}

.page-hero {
  border-bottom: 1px solid rgba(99, 185, 255, 0.14);
}

.hero-layout {
  display: grid;
  gap: 1.25rem;
}

.hero-copy {
  max-width: 38rem;
}

.hero-controls {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.widget-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.date-segment-grid {
  display: grid;
  gap: 0.75rem;
}

.tab-panel {
  display: flex;
  flex-direction: column;
}

.workspace-tabs {
  display: inline-flex;
  width: 100%;
  gap: 0.35rem;
  border-radius: 1rem;
  border: 1px solid var(--lb-border);
  background: rgba(6, 25, 32, 0.78);
  padding: 0.35rem;
}

.workspace-tab {
  flex: 1 1 0;
  border-radius: 0.85rem;
  border: 1px solid transparent;
  color: var(--lb-body);
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.85rem 1rem;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.workspace-tab:hover {
  color: var(--lb-heading);
}

.workspace-tab:focus-visible {
  outline: none;
  border-color: var(--lb-accent);
  box-shadow: 0 0 0 3px rgba(99, 185, 255, 0.14);
}

.workspace-tab--idle {
  background: transparent;
}

.workspace-tab--license-active {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(178, 63, 179, 0.24);
  color: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 0 18px rgba(178, 63, 179, 0.16);
}

.workspace-tab--search-active {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(99, 185, 255, 0.2);
  color: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 0 18px rgba(99, 185, 255, 0.14);
}

.date-segment-label {
  color: var(--lb-body);
}

.section-divider {
  border-top: 1px solid var(--lb-border);
}

.eyebrow,
.section-kicker {
  color: var(--lb-accent);
  text-shadow: 0 0 18px rgba(99, 185, 255, 0.12);
}

.page-title,
.panel-title,
.value-title,
.meta-value,
.details-summary {
  color: var(--lb-heading);
}

.page-copy,
.panel-copy,
.fine-copy {
  color: var(--lb-body);
}

.panel {
  border-radius: 1.5rem;
  border: 1px solid var(--lb-border);
  background: linear-gradient(180deg, rgba(10, 33, 41, 0.86), rgba(8, 27, 34, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.panel--hero {
  padding: 1.25rem;
}

.panel--compact {
  padding: 1.25rem;
}

.inset-card,
.nested-panel,
.item-card {
  border-radius: 1.25rem;
  border: 1px solid var(--lb-border);
  background: rgba(17, 46, 56, 0.58);
}

.field-label,
.meta-label {
  color: var(--lb-body-strong);
}

.meta-label {
  letter-spacing: 0.08em;
}

.product-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.product-pill {
  min-width: 8.5rem;
  border-radius: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.92);
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 700;
  padding: 0.75rem 1.1rem;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.product-pill:hover {
  transform: translateY(-1px);
}

.product-pill--idle {
  border-color: rgba(93, 129, 142, 0.4);
  background: rgba(10, 33, 41, 0.76);
  color: var(--lb-body-strong);
}

.product-pill--windows-active {
  background: linear-gradient(180deg, #be53be 0%, #a43aa4 100%);
  box-shadow: 0 14px 30px rgba(178, 63, 179, 0.28);
}

.product-pill--android-active {
  background: linear-gradient(180deg, #82c544 0%, #6aae37 100%);
  box-shadow: 0 14px 30px rgba(114, 190, 65, 0.24);
}

.input-field,
.upload-field {
  width: 100%;
  border-radius: 1rem;
  border: 1px solid var(--lb-border-strong);
  background: rgba(4, 27, 34, 0.88);
  color: var(--lb-heading);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.input-field {
  color-scheme: dark;
}

.input-field::placeholder {
  color: #6f858f;
}

.upload-field {
  color: var(--lb-body);
}

.input-field:focus,
.upload-field:focus {
  outline: none;
  border-color: var(--lb-accent);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.03),
    0 0 0 3px rgba(99, 185, 255, 0.14);
}

.upload-field::file-selector-button {
  margin-right: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.96);
  border-radius: 999px;
  background: linear-gradient(180deg, #be53be 0%, #a43aa4 100%);
  color: #ffffff;
  font-weight: 700;
  padding: 0.65rem 1rem;
  cursor: pointer;
}

.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.96);
  color: #ffffff;
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1;
  padding: 0.72rem 1.2rem;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.result-layout {
  display: grid;
  gap: 1rem;
}

.meta-grid {
  display: grid;
  gap: 0.85rem;
}

.result-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.action-stack,
.item-actions,
.search-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.action-button:hover {
  transform: translateY(-1px);
}

.action-button:focus-visible {
  outline: none;
}

.action-button--windows {
  background: linear-gradient(180deg, #be53be 0%, #a43aa4 100%);
  box-shadow: 0 12px 28px rgba(178, 63, 179, 0.24);
}

.action-button--windows:hover {
  box-shadow: 0 14px 30px rgba(178, 63, 179, 0.28);
}

.action-button--windows:focus-visible {
  box-shadow:
    0 0 0 3px rgba(99, 185, 255, 0.18),
    0 14px 30px rgba(178, 63, 179, 0.28);
}

.action-button--android {
  background: linear-gradient(180deg, #82c544 0%, #6aae37 100%);
  box-shadow: 0 12px 28px rgba(114, 190, 65, 0.2);
}

.action-button--android:hover {
  box-shadow: 0 14px 30px rgba(114, 190, 65, 0.24);
}

.action-button--android:focus-visible {
  box-shadow:
    0 0 0 3px rgba(99, 185, 255, 0.18),
    0 14px 30px rgba(114, 190, 65, 0.24);
}

.action-button--ghost {
  border-width: 1px;
  border-color: var(--lb-border-strong);
  background: rgba(10, 33, 41, 0.72);
  color: var(--lb-body-strong);
  box-shadow: none;
}

.action-button--ghost:hover {
  color: var(--lb-heading);
  border-color: var(--lb-accent);
  box-shadow: none;
}

.action-button--small {
  min-height: 2.75rem;
  font-size: 0.82rem;
  padding: 0.68rem 1rem;
}

.platform-badge,
.count-badge {
  border-radius: 999px;
  border: 1px solid rgba(99, 185, 255, 0.24);
  background: rgba(99, 185, 255, 0.14);
  color: var(--lb-accent);
}

.status-card {
  border-radius: 1rem;
  border: 1px solid transparent;
  padding: 1rem;
}

.status-card--neutral {
  background: rgba(17, 46, 56, 0.48);
  border-color: rgba(47, 89, 104, 0.7);
  color: var(--lb-body);
}

.status-card--info {
  background: var(--lb-info-bg);
  border-color: rgba(99, 185, 255, 0.18);
  color: var(--lb-info-text);
}

.status-card--warning {
  background: var(--lb-warning-bg);
  border-color: rgba(209, 171, 91, 0.2);
  color: var(--lb-warning-text);
}

.status-card--error {
  background: var(--lb-error-bg);
  border-color: rgba(224, 128, 150, 0.18);
  color: var(--lb-error-text);
}

.status-card--search-hit,
.result-panel {
  border-radius: 1.5rem;
  border: 1px solid rgba(99, 185, 255, 0.2);
  background: linear-gradient(180deg, rgba(17, 47, 58, 0.95) 0%, rgba(8, 28, 35, 0.95) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.nested-panel[open] .details-summary {
  margin-bottom: 1rem;
}

.scope-switch {
  display: inline-flex;
  gap: 0.25rem;
  border-radius: 1rem;
  border: 1px solid var(--lb-border);
  background: rgba(6, 25, 32, 0.78);
  padding: 0.25rem;
}

.scope-button {
  border-radius: 0.85rem;
  border: 1px solid transparent;
  color: var(--lb-body);
  padding: 0.55rem 1rem;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease;
}

.scope-button:hover {
  color: var(--lb-heading);
}

.scope-button--magenta-active {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(178, 63, 179, 0.24);
  color: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 0 18px rgba(178, 63, 179, 0.16);
}

.scope-button--green-active {
  border-color: rgba(255, 255, 255, 0.14);
  background: rgba(114, 190, 65, 0.24);
  color: #ffffff;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 0 18px rgba(114, 190, 65, 0.16);
}

.notes-overlay {
  position: absolute;
  inset: 0.9rem;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem;
  border-radius: 1.5rem;
  background: rgba(2, 15, 20, 0.8);
  backdrop-filter: blur(4px);
}

.notes-modal {
  width: min(100%, 42rem);
  max-height: min(100%, 36rem);
  display: flex;
  flex-direction: column;
  border-radius: 1.5rem;
  border: 1px solid rgba(99, 185, 255, 0.2);
  background: linear-gradient(180deg, rgba(17, 47, 58, 0.98) 0%, rgba(8, 28, 35, 0.98) 100%);
  box-shadow: var(--lb-shadow);
}

.notes-modal__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.notes-modal__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.notes-list {
  display: grid;
  gap: 0.75rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.notes-list__item {
  border-radius: 1rem;
  border: 1px solid var(--lb-border);
  background: rgba(17, 46, 56, 0.58);
  color: var(--lb-body-strong);
  padding: 0.85rem 1rem;
}

@media (min-width: 768px) {
  .hero-layout {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
  }

  .date-segment-grid {
    grid-template-columns: minmax(0, 1.3fr) repeat(2, minmax(0, 1fr));
  }

  .meta-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .result-layout {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }
}
</style>
