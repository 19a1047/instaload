// Enhanced Instagram Image Scraper - 2025 Version
// Improved error handling, updated selectors, and better debugging

// == Debug Utilities ==
const DEBUG = true;
function debugLog(...args) {
  if (DEBUG) console.log("[IG-Scraper]", ...args);
}

// == UI Setup ==
const style = document.createElement("style");
style.innerHTML = `
#ig-getall-btn {
  position: fixed;
  top: 26px;
  right: 30px;
  z-index: 999999;
  background: #f35369;
  color: white;
  font-weight: bold;
  border: none;
  border-radius: 7px;
  padding: 14px 28px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.15);
  cursor: pointer;
  font-size: 18px;
  opacity: 0.95;
  transition: all 0.2s ease;
}
#ig-getall-btn:hover { 
  opacity: 1; 
  transform: scale(1.02);
}
#ig-getall-btn.loading {
  background: #ffa500;
  cursor: wait;
}
#ig-modal-bg {
  position:fixed; left:0; top:0; width:100vw; height:100vh;
  background:rgba(0,0,0,0.5); z-index:1000000;
  backdrop-filter: blur(4px);
}
#ig-getall-modal {
  position: fixed;
  top: 56px;
  left: 50%;
  transform: translateX(-50%);
  width: 96vw;
  max-width: 700px;
  background: #fff;
  color: #222;
  z-index: 1000001;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 8px 64px 0 rgba(0,0,0,0.3);
  max-height: 80vh;
  overflow-y: auto;
}
#ig-getall-modal h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 20px;
}
#ig-getall-modal textarea {
  width: 100%; 
  min-height: 300px; 
  margin-top: 16px;
  font-family: 'Courier New', monospace; 
  font-size: 12px; 
  color: #333;
  border: 2px solid #ddd;
  border-radius: 6px;
  padding: 12px;
  resize: vertical;
  background: #f9f9f9;
}
#ig-getall-close {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 28px; 
  cursor: pointer; 
  color: #888; 
  background: none; 
  border: none;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}
#ig-getall-close:hover {
  color: #f35369;
  background: #f0f0f0;
  border-radius: 50%;
}
#ig-getall-copy, #ig-getall-zip, #ig-getall-test {
  margin-top: 16px; 
  padding: 10px 20px; 
  border: none; 
  border-radius: 6px;
  color: #fff; 
  font-weight: bold; 
  cursor: pointer; 
  margin-right: 10px;
  transition: all 0.2s ease;
}
#ig-getall-copy { background: #3bc47b;}
#ig-getall-copy:hover { background: #279b5e; }
#ig-getall-zip { background: #5864ff;}
#ig-getall-zip:hover { background: #2e37a0;}
#ig-getall-test { background: #ff9500;}
#ig-getall-test:hover { background: #cc7700;}
.ig-status {
  margin: 16px 0;
  padding: 12px;
  border-radius: 6px;
  font-weight: bold;
}
.ig-status.info { background: #e3f2fd; color: #1976d2; border-left: 4px solid #2196f3; }
.ig-status.success { background: #e8f5e8; color: #2e7d32; border-left: 4px solid #4caf50; }
.ig-status.warning { background: #fff3e0; color: #f57c00; border-left: 4px solid #ff9800; }
.ig-status.error { background: #ffebee; color: #d32f2f; border-left: 4px solid #f44336; }
`;
document.head.appendChild(style);

// == Enhanced Utilities ==
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay(min = 1000, max = 3000) {
  const delay = Math.random() * (max - min) + min;
  return wait(delay);
}

// Modern clipboard API
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand("copy");
      document.body.removeChild(textarea);
      return success;
    }
  } catch (err) {
    debugLog("Copy failed:", err);
    return false;
  }
}

// JSZip loader with error handling
function loadJSZip() {
  return new Promise((resolve, reject) => {
    if (window.JSZip) return resolve(window.JSZip);
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
    script.onload = () => {
      debugLog("JSZip loaded successfully");
      resolve(window.JSZip);
    };
    script.onerror = () => {
      debugLog("Failed to load JSZip");
      reject(new Error("Failed to load JSZip"));
    };
    document.head.appendChild(script);
  });
}

// == Enhanced Button Management ==
function createBtn() {
  if (document.getElementById("ig-getall-btn")) return;

  // Only create button on Instagram profile pages
  if (!window.location.href.includes("instagram.com/")) return;

  const btn = document.createElement("button");
  btn.id = "ig-getall-btn";
  btn.textContent = "Get Images (Smart)";
  btn.title =
    "Smart Mode: Extract images from carousel posts only (most efficient)";
  document.body.appendChild(btn);
  btn.onclick = mainIGScraper;

  debugLog("Button created");
}

// Check if we're on an Instagram profile page
function isInstagramProfile() {
  const path = window.location.pathname;
  return (
    path.match(/^\/[^\/]+\/?$/) &&
    !path.includes("/p/") &&
    !path.includes("/reel/")
  );
}

// Enhanced button creation with proper checks
function initButton() {
  if (isInstagramProfile()) {
    createBtn();
  }
}

// Initialize and monitor for page changes
initButton();
setInterval(initButton, 3000);

// == Enhanced Modal ==
function addStatus(modal, message, type = "info") {
  const existing = modal.querySelector(".ig-status");
  if (existing) existing.remove();

  const status = document.createElement("div");
  status.className = `ig-status ${type}`;
  status.textContent = message;

  const firstChild = modal.firstChild;
  modal.insertBefore(status, firstChild.nextSibling);
}

function showModal(links, errors = []) {
  // Remove existing modal
  const existingModal = document.getElementById("ig-getall-modal");
  const existingBg = document.getElementById("ig-modal-bg");
  if (existingModal) existingModal.remove();
  if (existingBg) existingBg.remove();

  // Modal background
  const bg = document.createElement("div");
  bg.id = "ig-modal-bg";
  bg.onclick = (e) => {
    if (e.target === bg) {
      modal.remove();
      bg.remove();
    }
  };
  document.body.appendChild(bg);

  const modal = document.createElement("div");
  modal.id = "ig-getall-modal";

  // Close button
  const close = document.createElement("button");
  close.id = "ig-getall-close";
  close.innerHTML = "×";
  close.onclick = () => {
    modal.remove();
    bg.remove();
  };
  modal.appendChild(close);

  // Title
  const title = document.createElement("h3");
  title.textContent = `Instagram Image Extractor Results`;
  modal.appendChild(title);

  // Status message
  let statusType = "success";
  let statusMessage = `Successfully found ${links.length} image link${
    links.length === 1 ? "" : "s"
  }`;

  if (links.length === 0) {
    statusType = "warning";
    statusMessage =
      "No images found. This might be due to Instagram UI changes or the profile being private.";
  } else if (errors.length > 0) {
    statusType = "warning";
    statusMessage = `Found ${links.length} images, but encountered ${errors.length} errors during extraction.`;
  }

  addStatus(modal, statusMessage, statusType);

  // Test button for debugging
  const testBtn = document.createElement("button");
  testBtn.id = "ig-getall-test";
  testBtn.textContent = "Test Selectors";
  testBtn.onclick = () => testSelectors(modal);
  modal.appendChild(testBtn);

  // Test carousel detection button
  const testCarouselBtn = document.createElement("button");
  testCarouselBtn.textContent = "Test Carousel Detection";
  testCarouselBtn.style.marginLeft = "10px";
  testCarouselBtn.onclick = async () => {
    const activeModal = document.querySelector('div[role="dialog"]');
    if (activeModal) {
      debugLog("=== ENHANCED CAROUSEL DETECTION TEST ===");
      const isCarousel = await isCarouselPost(activeModal);
      debugLog(`Is carousel: ${isCarousel}`);

      // Focus on post content area
      const postContent =
        activeModal.querySelector('[role="dialog"] > div > div') ||
        activeModal.querySelector("article") ||
        activeModal.querySelector('[data-testid="post-content"]') ||
        activeModal;

      // Test enhanced button detection (same as navigation function)
      const nextButtonSelectors = [
        'button[aria-label="Next"]',
        'button[aria-label*="next" i]',
        'button[aria-label="Go to next media"]',
        'button[aria-label="Next media"]',
        '[role="button"][aria-label*="next" i]',
        // Look for SVG-based next buttons
        'button:has(svg[aria-label="Next"])',
        'button:has(svg[aria-label*="next" i])',
        // Look for elements containing next arrows
        'button svg[aria-label="Next"]',
        'button svg[aria-label*="next" i]',
        // Fallback: look for any button in carousel area with arrow-like content
        'button[style*="position: absolute"]', // Often carousel buttons are absolutely positioned
      ];

      let allNextButtons = [];
      debugLog(`Testing ${nextButtonSelectors.length} button selectors:`);

      nextButtonSelectors.forEach((selector, index) => {
        try {
          const buttons = postContent.querySelectorAll(selector);
          debugLog(
            `  Selector ${index + 1} (${selector}): ${buttons.length} found`
          );

          for (const btn of buttons) {
            const actualButton = btn.closest("button") || btn;
            if (
              actualButton.tagName === "BUTTON" &&
              !allNextButtons.includes(actualButton)
            ) {
              allNextButtons.push(actualButton);
            }
          }
        } catch (e) {
          debugLog(`  Selector ${index + 1} failed: ${e.message}`);
        }
      });

      debugLog(`Total unique buttons found: ${allNextButtons.length}`);

      allNextButtons.forEach((btn, i) => {
        const rect = btn.getBoundingClientRect();
        const isCarouselBtn = isLikelyCarouselButton(btn, activeModal);
        const classes = btn.className || "";
        const parentClasses = btn.closest("div")?.className || "";
        const ariaLabel = btn.getAttribute("aria-label") || "none";
        const hasRotatedSVG = btn.querySelector('[style*="rotate(90deg)"]')
          ? "YES"
          : "NO";

        debugLog(
          `Button ${i + 1}: ${rect.width}x${rect.height} at (${rect.left}, ${
            rect.top
          }) - isCarousel: ${isCarouselBtn}`
        );
        debugLog(`  Aria-label: "${ariaLabel}"`);
        debugLog(`  Classes: "${classes}"`);
        debugLog(`  Parent classes: "${parentClasses}"`);
        debugLog(`  Has rotated SVG: ${hasRotatedSVG}`);
        debugLog(`  HTML: ${btn.outerHTML.substring(0, 200)}...`);
      });

      // Check for carousel indicators
      const carouselSvg = postContent.querySelector(
        'svg[aria-label="Carousel"]'
      );
      debugLog(`Carousel SVG in post content: ${carouselSvg ? "YES" : "NO"}`);

      if (carouselSvg) {
        const svgRect = carouselSvg.getBoundingClientRect();
        const modalRect = activeModal.getBoundingClientRect();
        const isInMainContent =
          svgRect.top > modalRect.top + 60 &&
          svgRect.bottom < modalRect.bottom - 60 &&
          svgRect.left > modalRect.left + 50 &&
          svgRect.right < modalRect.right - 50;
        debugLog(`Carousel SVG is in main content area: ${isInMainContent}`);
      }
    } else {
      debugLog("No modal open - click on a post first");
    }
  };
  modal.appendChild(testCarouselBtn);

  if (links.length > 0) {
    // Info text
    const info = document.createElement("div");
    info.innerHTML = `
      <strong>Image URLs (CSV format):</strong><br>
      <small>Ready to paste into spreadsheet or use with download tools</small>
    `;
    modal.appendChild(info);

    // Textarea with results
    const ta = document.createElement("textarea");
    ta.id = "ig-links-textarea";
    ta.readOnly = true;
    ta.value = links.map((link, i) => `${i + 1},${link}`).join("\n");
    modal.appendChild(ta);

    // Download ZIP button
    const zipBtn = document.createElement("button");
    zipBtn.id = "ig-getall-zip";
    zipBtn.textContent = "Download ZIP";
    zipBtn.onclick = async () => downloadAsZip(links, zipBtn);
    modal.appendChild(zipBtn);

    // Copy button
    const copyBtn = document.createElement("button");
    copyBtn.id = "ig-getall-copy";
    copyBtn.textContent = "Copy All";
    copyBtn.onclick = async () => {
      const success = await copyToClipboard(ta.value);
      if (success) {
        copyBtn.textContent = "Copied!";
        copyBtn.style.background = "#4caf50";
        setTimeout(() => {
          copyBtn.textContent = "Copy All";
          copyBtn.style.background = "#3bc47b";
        }, 2000);
      } else {
        copyBtn.textContent = "Copy Failed";
        copyBtn.style.background = "#f44336";
        setTimeout(() => {
          copyBtn.textContent = "Copy All";
          copyBtn.style.background = "#3bc47b";
        }, 2000);
      }
    };
    modal.appendChild(copyBtn);
  }

  // Error details (if any)
  if (errors.length > 0) {
    const errorInfo = document.createElement("details");
    errorInfo.innerHTML = `
      <summary style="cursor: pointer; margin-top: 16px; color: #f57c00;">
        <strong>Debug Information (${errors.length} issues)</strong>
      </summary>
      <pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 11px; overflow-x: auto; margin-top: 8px;">${errors.join(
        "\n"
      )}</pre>
    `;
    modal.appendChild(errorInfo);
  }

  document.body.appendChild(modal);
}

// == Testing Function ==
function testSelectors(modal) {
  const tests = [
    {
      name: "Post links",
      selector: 'a[href*="/p/"]',
      description: "Links to individual posts",
    },
    {
      name: "Post images",
      selector: "article img",
      description: "Images within posts",
    },
    {
      name: "Modal dialog",
      selector: 'div[role="dialog"]',
      description: "Post modal dialog",
    },
    {
      name: "Modal images",
      selector: 'div[role="dialog"] img',
      description: "Images within modal",
    },
    {
      name: "Next button",
      selector: 'div[role="dialog"] svg[aria-label="Next"]',
      description: "Next button in carousel",
    },
    {
      name: "Close button",
      selector: 'div[role="dialog"] svg[aria-label="Close"]',
      description: "Close modal button",
    },
  ];

  const results = tests.map((test) => {
    const elements = document.querySelectorAll(test.selector);
    return `${test.name}: ${elements.length} found - ${test.description}`;
  });

  const currentUrl = window.location.href;
  const isProfile = isInstagramProfile();

  const report = [
    `=== Instagram Scraper Selector Test ===`,
    `URL: ${currentUrl}`,
    `Is Profile Page: ${isProfile}`,
    ``,
    ...results,
    ``,
    `=== Additional Info ===`,
    `User Agent: ${navigator.userAgent.substr(0, 100)}...`,
    `Page Title: ${document.title}`,
    `Instagram App: ${window._sharedData ? "Classic" : "New"}`,
  ].join("\n");

  addStatus(
    modal,
    "Selector test completed. Check console for detailed results.",
    "info"
  );
  console.log(report);
  alert(
    "Selector test completed! Check the browser console for detailed results."
  );
}

// == Enhanced ZIP Download with Better Error Handling ==
async function downloadAsZip(links, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Loading JSZip...";

  try {
    await loadJSZip();
    const zip = new window.JSZip();
    let successCount = 0;
    let failCount = 0;

    // Limit concurrent downloads to avoid overwhelming the browser
    const batchSize = 5;
    const batches = [];

    for (let i = 0; i < links.length; i += batchSize) {
      batches.push(links.slice(i, i + batchSize));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      button.textContent = `Batch ${batchIndex + 1}/${
        batches.length
      } (${successCount}/${links.length})...`;

      // Process batch in parallel with Promise.allSettled
      const promises = batch.map(async (url, index) => {
        const globalIndex = batchIndex * batchSize + index;
        const filename = extractFilename(url, globalIndex);

        try {
          // Try multiple download strategies
          const blob = await downloadImageWithFallback(url);
          zip.file(filename, blob);
          return { success: true, url, filename };
        } catch (error) {
          debugLog(`Failed to download ${url}:`, error);
          return { success: false, url, error: error.message };
        }
      });

      const results = await Promise.allSettled(promises);

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          if (result.value.success) {
            successCount++;
          } else {
            failCount++;
          }
        } else {
          failCount++;
        }
      });

      // Small delay between batches
      if (batchIndex < batches.length - 1) {
        await wait(500);
      }
    }

    if (successCount === 0) {
      throw new Error(
        `No images could be downloaded. This is likely due to CORS restrictions. Try using the CSV list with a download manager instead.`
      );
    }

    button.textContent = "Creating ZIP...";
    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    // Create download
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = `instagram-images-${
      new Date().toISOString().split("T")[0]
    }.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    button.textContent = `Downloaded! (${successCount}/${links.length})`;

    if (failCount > 0) {
      debugLog(
        `ZIP download completed with ${failCount} failures out of ${links.length} images`
      );
    }

    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 4000);
  } catch (error) {
    debugLog("ZIP download failed:", error);
    button.textContent = "Download Failed";
    button.style.background = "#f44336";

    // Show helpful error message
    alert(
      `ZIP Download Failed: ${error.message}\n\nTip: Copy the CSV list and use a download manager like IDM or JDownloader instead.`
    );

    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = "#5864ff";
      button.disabled = false;
    }, 3000);
  }
}

// Extract clean filename from URL
function extractFilename(url, index) {
  try {
    const urlParts = url.split("?")[0].split("/");
    let filename = urlParts[urlParts.length - 1];

    if (!filename || !filename.includes(".")) {
      // Fallback filename
      filename = `ig-img-${index + 1}.jpg`;
    }

    // Ensure valid filename
    filename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

    return filename;
  } catch (error) {
    return `ig-img-${index + 1}.jpg`;
  }
}

// Download image with multiple fallback strategies
async function downloadImageWithFallback(url) {
  const strategies = [
    // Strategy 1: Direct fetch with CORS headers
    async () => {
      const response = await fetch(url, {
        method: "GET",
        mode: "cors",
        headers: {
          Referer: "https://www.instagram.com/",
          "User-Agent": navigator.userAgent,
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.blob();
    },

    // Strategy 2: No-cors mode (may work but limited)
    async () => {
      const response = await fetch(url, {
        method: "GET",
        mode: "no-cors",
      });
      return await response.blob();
    },

    // Strategy 3: Image element approach
    async () => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(resolve, "image/jpeg", 0.9);
          } catch (error) {
            reject(error);
          }
        };
        img.onerror = () => reject(new Error("Image load failed"));
        img.src = url;

        // Timeout after 10 seconds
        setTimeout(() => reject(new Error("Image load timeout")), 10000);
      });
    },
  ];

  let lastError;
  for (const strategy of strategies) {
    try {
      const blob = await strategy();
      if (blob && blob.size > 0) {
        return blob;
      }
    } catch (error) {
      lastError = error;
      continue;
    }
  }

  throw lastError || new Error("All download strategies failed");
}

// == Enhanced Instagram Scraper with Modern Selectors ==
async function mainIGScraper() {
  const btn = document.getElementById("ig-getall-btn");
  if (!btn) return;

  // Enhanced confirmation with smart carousel option
  const choice = prompt(
    "Instagram Image Extractor Options:\n\n" +
      "1 = SMART MODE (carousels only - fastest, most efficient)\n" +
      "2 = Full extraction (all posts - slower but complete)\n" +
      "3 = Quick extraction (visible images only)\n\n" +
      "Enter 1, 2, or 3:",
    "1"
  );

  if (!choice || !["1", "2", "3"].includes(choice)) {
    return; // User cancelled or invalid choice
  }

  // Set loading state
  btn.classList.add("loading");
  btn.textContent = "Initializing...";
  btn.disabled = true;

  const errors = [];
  const startTime = Date.now();

  try {
    // Check if we're on the right page
    if (!isInstagramProfile()) {
      throw new Error("Please navigate to an Instagram profile page first");
    }

    debugLog("Starting Instagram scraper...");

    if (choice === "1") {
      // Smart carousel mode
      await smartCarouselMode(btn, errors);
    } else if (choice === "2") {
      // Full extraction mode
      await fullExtractionMode(btn, errors);
    } else {
      // Quick extraction mode
      await quickExtractionMode(btn, errors);
    }
  } catch (error) {
    debugLog("Scraper failed:", error);
    errors.push(`Fatal error: ${error.message}`);
    showModal([], errors);
  } finally {
    // Reset button
    btn.classList.remove("loading");
    btn.textContent = "Get Images (Smart)";
    btn.disabled = false;
  }
}

// Smart carousel mode (NEW - only processes carousel posts)
async function smartCarouselMode(btn, errors) {
  debugLog("Starting SMART MODE - targeting carousel posts only...");

  // Ensure we start from the top of the page
  window.scrollTo(0, 0);
  await wait(1000);

  // Phase 1: Collect only carousel post links
  btn.textContent = "Smart collection - finding carousels...";
  const carouselLinks = await collectCarouselPostLinks(errors);

  debugLog(`Smart mode found ${carouselLinks.length} carousel posts`);

  if (carouselLinks.length === 0) {
    throw new Error(
      "No carousel posts found. Try full mode to get single images too, or the profile might be private."
    );
  }

  // Phase 2: Extract images from carousel posts only
  btn.textContent = "Extracting from carousels...";
  const imageUrls = await extractImagesFromPosts(
    carouselLinks,
    errors,
    btn,
    true
  ); // Pass smart mode flag

  const duration = ((Date.now() - Date.now()) / 1000).toFixed(1);
  debugLog(
    `Smart mode completed. Found ${imageUrls.size} images from ${carouselLinks.length} carousels.`
  );

  // Show results with smart mode info
  const smartModeNote = [
    `=== SMART MODE RESULTS ===`,
    `Processed: ${carouselLinks.length} carousel posts (skipped single posts)`,
    `Total images found: ${imageUrls.size}`,
    `Efficiency: ~${(imageUrls.size / carouselLinks.length).toFixed(
      1
    )} images per carousel`,
    ``,
    `Note: Single-image posts were skipped for efficiency.`,
    `Use "Full Mode" if you need single images too.`,
  ];

  errors.unshift(...smartModeNote);
  showModal(Array.from(imageUrls), errors);
}

// Full extraction mode (original approach)
async function fullExtractionMode(btn, errors) {
  // Ensure we start from the top of the page
  debugLog("Ensuring we start from top of page...");
  window.scrollTo(0, 0);
  await wait(1000);

  // Phase 1: Collect post links
  btn.textContent = "Scrolling & collecting posts...";
  const postLinks = await collectPostLinks(errors);

  debugLog(`Found ${postLinks.length} unique posts`);

  if (postLinks.length === 0) {
    throw new Error(
      "No posts found. The profile might be private or have no posts."
    );
  }

  // Phase 2: Extract images from posts
  btn.textContent = "Extracting images...";
  const imageUrls = await extractImagesFromPosts(postLinks, errors, btn);

  const duration = ((Date.now() - Date.now()) / 1000).toFixed(1);
  debugLog(`Extraction completed. Found ${imageUrls.length} images.`);

  // Show results
  showModal(Array.from(imageUrls), errors);
}

// Quick extraction mode (just visible images)
async function quickExtractionMode(btn, errors) {
  btn.textContent = "Quick extraction - scrolling...";

  const imageUrls = new Set();
  const maxScrolls = 30;

  // Scroll and collect visible images
  window.scrollTo(0, 0);
  await wait(1000);

  for (let i = 0; i < maxScrolls; i++) {
    btn.textContent = `Quick extraction - scroll ${i + 1}/${maxScrolls}...`;

    // Extract visible images
    await extractVisibleImages(imageUrls, errors);

    // Scroll down
    const oldHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    await randomDelay(800, 1500);

    // Check if we stopped loading new content
    if (document.body.scrollHeight === oldHeight) {
      debugLog(`Quick extraction stopped at scroll ${i + 1}`);
      break;
    }

    // Limit images to prevent excessive collection
    if (imageUrls.size >= 1000) {
      debugLog("Reached 1000 image limit in quick mode");
      break;
    }
  }

  debugLog(`Quick extraction completed. Found ${imageUrls.size} images.`);
  showModal(Array.from(imageUrls), errors);
}

// Extract all visible images on current view
async function extractVisibleImages(imageUrls, errors) {
  const strategies = [
    // Strategy 1: All Instagram images
    () => document.querySelectorAll('img[src*="instagram"]'),

    // Strategy 2: Article images (posts)
    () => document.querySelectorAll("article img"),

    // Strategy 3: Main content images
    () => document.querySelectorAll("main img"),

    // Strategy 4: Background images
    () => document.querySelectorAll('[style*="background-image"]'),

    // Strategy 5: High resolution images
    () => document.querySelectorAll('img[src*="1080"], img[src*="720"]'),
  ];

  for (const strategy of strategies) {
    try {
      const elements = strategy();
      elements.forEach((element) => {
        if (element.tagName === "IMG") {
          if (
            element.src &&
            element.src.includes("instagram") &&
            element.naturalWidth > 100 &&
            !element.src.includes("avatar") &&
            !element.src.includes("profile")
          ) {
            imageUrls.add(element.src);
          }
        } else if (element.style && element.style.backgroundImage) {
          const match = element.style.backgroundImage.match(
            /url\(['"]?(.*?)['"]?\)/
          );
          if (match && match[1] && match[1].includes("instagram")) {
            imageUrls.add(match[1]);
          }
        }
      });
    } catch (error) {
      errors.push(`Visible image extraction error: ${error.message}`);
    }
  }
}

// == Enhanced Post Collection ==
async function collectPostLinks(errors) {
  const postLinks = new Set();
  const maxScrolls = 50;
  const targetPosts = 500;

  // Scroll to top
  window.scrollTo(0, 0);
  await wait(1000);

  for (let i = 0; i < maxScrolls; i++) {
    // Scroll down
    const oldHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    await randomDelay(1500, 2500);

    // Collect post links using multiple selectors
    const selectors = [
      'a[href*="/p/"]',
      'article a[href*="/p/"]',
      '[role="main"] a[href*="/p/"]',
    ];

    for (const selector of selectors) {
      try {
        document.querySelectorAll(selector).forEach((link) => {
          const href = link.href;
          if (href && href.includes("/p/")) {
            const match = href.match(/\/p\/([^\/\?]+)/);
            if (match) {
              // Clean up URL: remove query params and normalize slashes
              let cleanUrl = href.split("?")[0].replace(/\/+$/, "") + "/";
              postLinks.add(cleanUrl);
              debugLog(`Added post URL: ${cleanUrl}`);
            }
          }
        });
      } catch (error) {
        errors.push(`Error with selector ${selector}: ${error.message}`);
      }
    }

    // Check if we found enough posts or page stopped loading
    if (postLinks.size >= targetPosts) break;
    if (document.body.scrollHeight === oldHeight) {
      debugLog(`Scrolling stopped at ${i + 1} scrolls`);
      break;
    }

    debugLog(`Scroll ${i + 1}: Found ${postLinks.size} posts`);
  }

  // Scroll back to top after collecting all posts
  debugLog("Scrolling back to top after post collection...");
  window.scrollTo(0, 0);
  await wait(1500);

  return Array.from(postLinks).slice(0, targetPosts);
}

// == Enhanced Carousel Post Collection (Smart Filtering) ==
async function collectCarouselPostLinks(errors) {
  const carouselPostLinks = new Set();
  const allPostElements = new Set(); // Track elements we've already checked
  const maxScrolls = 50;
  const targetCarousels = 100; // Target fewer since we're being selective

  debugLog(
    "Starting smart carousel collection - only targeting carousel posts..."
  );

  // Scroll to top
  window.scrollTo(0, 0);
  await wait(1000);

  for (let i = 0; i < maxScrolls; i++) {
    // Scroll down
    const oldHeight = document.body.scrollHeight;
    window.scrollTo(0, document.body.scrollHeight);
    await randomDelay(1500, 2500);

    // Look for post elements and check if they're carousels
    const postSelectors = [
      "article",
      'a[href*="/p/"]',
      '[role="main"] a[href*="/p/"]',
    ];

    for (const selector of postSelectors) {
      try {
        const postElements = document.querySelectorAll(selector);

        for (const postElement of postElements) {
          // Skip if we've already checked this element
          if (allPostElements.has(postElement)) continue;
          allPostElements.add(postElement);

          // Find the link within or around this post element
          let postLink = null;
          if (
            postElement.tagName === "A" &&
            postElement.href &&
            postElement.href.includes("/p/")
          ) {
            postLink = postElement;
          } else {
            // Look for a link within this post element
            postLink = postElement.querySelector('a[href*="/p/"]');
          }

          if (postLink && postLink.href) {
            const href = postLink.href;
            const match = href.match(/\/p\/([^\/\?]+)/);

            if (match) {
              // Check if this post element indicates it's a carousel
              if (isCarouselPostFromProfile(postElement)) {
                const cleanUrl = href.split("?")[0].replace(/\/+$/, "") + "/";
                carouselPostLinks.add(cleanUrl);
                debugLog(`✓ Added carousel post: ${cleanUrl}`);
              } else {
                debugLog(`⚪ Skipped single post: ${href.substring(0, 60)}...`);
              }
            }
          }
        }
      } catch (error) {
        errors.push(
          `Error with carousel collection selector ${selector}: ${error.message}`
        );
      }
    }

    // Check if we found enough carousels or page stopped loading
    if (carouselPostLinks.size >= targetCarousels) {
      debugLog(`Reached target of ${targetCarousels} carousel posts`);
      break;
    }
    if (document.body.scrollHeight === oldHeight) {
      debugLog(`Scrolling stopped at ${i + 1} scrolls`);
      break;
    }

    debugLog(`Scroll ${i + 1}: Found ${carouselPostLinks.size} carousel posts`);
  }

  // Scroll back to top after collecting all posts
  debugLog("Scrolling back to top after carousel collection...");
  window.scrollTo(0, 0);
  await wait(1500);

  const carouselArray = Array.from(carouselPostLinks);
  debugLog(
    `Smart collection complete: ${carouselArray.length} carousel posts found (skipped single posts)`
  );

  return carouselArray;
}

// == Enhanced Image Extraction with Progress Tracking ==
async function extractImagesFromPosts(
  postLinks,
  errors,
  btn,
  smartMode = false
) {
  const imageUrls = new Set();
  const maxPostsToProcess = Math.min(postLinks.length, 50); // Reduced for better performance
  let processedCount = 0;
  let successCount = 0;

  debugLog(
    `Starting to process ${maxPostsToProcess} posts out of ${postLinks.length} found`
  );

  for (let i = 0; i < maxPostsToProcess; i++) {
    const postUrl = postLinks[i];
    const startImageCount = imageUrls.size;

    btn.textContent = `Processing post ${
      i + 1
    }/${maxPostsToProcess} (${successCount} successful)...`;
    debugLog(`\n--- Processing post ${i + 1}: ${postUrl} ---`);

    try {
      await openAndExtractFromPost(postUrl, imageUrls, errors, smartMode);

      const newImages = imageUrls.size - startImageCount;
      if (newImages > 0) {
        successCount++;
        debugLog(`✓ Post ${i + 1} successful: ${newImages} images added`);
      } else {
        debugLog(`⚠ Post ${i + 1}: No new images found`);
      }

      processedCount++;
    } catch (error) {
      errors.push(`Post ${i + 1} (${postUrl}): ${error.message}`);
      debugLog(`✗ Post ${i + 1} failed: ${error.message}`);
      processedCount++;
    }

    // Add delay between posts - longer delay to avoid Instagram detection
    await randomDelay(2000, 4000);

    // Progress update
    if (i % 5 === 0 && i > 0) {
      debugLog(
        `Progress: ${i}/${maxPostsToProcess} posts processed, ${imageUrls.size} total images found`
      );
    }

    // Early termination if we have many images
    if (imageUrls.size >= 200) {
      debugLog(`Reached 200 images, stopping early`);
      break;
    }
  }

  debugLog(`\n=== Extraction Summary ===`);
  debugLog(`Posts processed: ${processedCount}/${maxPostsToProcess}`);
  debugLog(`Successful extractions: ${successCount}`);
  debugLog(`Total images found: ${imageUrls.size}`);
  debugLog(`Errors encountered: ${errors.length}`);

  return imageUrls;
}

// == Enhanced Single Post Processing with Better Recovery ==
async function openAndExtractFromPost(
  postUrl,
  imageUrls,
  errors,
  smartMode = false
) {
  const postId = postUrl.match(/\/p\/([^\/]+)/)?.[1];
  debugLog(`Starting extraction for post: ${postUrl}`);

  let success = false;
  const startImageCount = imageUrls.size;

  // Strategy 1: Modal approach with timeout
  try {
    debugLog(`Trying modal approach for ${postUrl}`);
    const postLink = findPostLink(postUrl);

    if (postLink) {
      // Scroll to link and click
      postLink.scrollIntoView({ behavior: "smooth", block: "center" });
      await wait(500);

      debugLog(`Clicking post link for ${postUrl}`);
      postLink.click();

      // Wait for modal with timeout
      const modal = await waitForModal(5000); // Reduced timeout

      if (modal) {
        debugLog(`Modal opened for ${postUrl}`);

        // Extract images from modal
        await extractImagesFromModal(modal, imageUrls);

        // Check if this is a carousel and navigate through it
        if (await isCarouselPost(modal)) {
          debugLog("Detected carousel post, navigating through images...");
          await navigateCarousel(modal, imageUrls);
          // Modal is closed by navigateCarousel
        } else {
          if (smartMode) {
            // In smart mode, skip single-image posts entirely
            debugLog("Smart mode: Skipping single image post");
            await forceCloseModal();
            // Don't count this as a success since we're filtering it out
            throw new Error("Skipped single-image post in smart mode");
          } else {
            debugLog("Single image post detected");
            // Force close modal for single image posts
            await forceCloseModal();
          }
        }

        success = true;
        debugLog(
          `Modal extraction successful for ${postUrl}, found ${
            imageUrls.size - startImageCount
          } new images`
        );
      } else {
        debugLog(`Modal failed to open for ${postUrl}`);
      }
    } else {
      debugLog(`Could not find clickable link for ${postUrl}`);
    }
  } catch (error) {
    debugLog(`Modal approach failed for ${postUrl}:`, error);
    await forceCloseModal(); // Ensure modal is closed
  }

  // Strategy 2: Extract from visible thumbnail (always try this)
  try {
    debugLog(`Trying thumbnail extraction for ${postUrl}`);
    await extractFromVisiblePost(postId, imageUrls);

    if (imageUrls.size > startImageCount) {
      success = true;
      debugLog(
        `Thumbnail extraction found ${
          imageUrls.size - startImageCount
        } images for ${postUrl}`
      );
    }
  } catch (error) {
    debugLog(`Thumbnail extraction failed for ${postUrl}:`, error);
  }

  // Ensure we're back to the profile page
  await ensureProfilePage();

  if (!success && imageUrls.size === startImageCount) {
    throw new Error(`No images extracted from ${postUrl}`);
  }

  debugLog(
    `Completed extraction for ${postUrl}, total new images: ${
      imageUrls.size - startImageCount
    }`
  );
}

// Enhanced modal closing with multiple strategies
async function forceCloseModal() {
  debugLog("Attempting to close modal...");
  let attempts = 0;
  const maxAttempts = 5;

  while (
    attempts < maxAttempts &&
    document.querySelector('div[role="dialog"]')
  ) {
    attempts++;
    debugLog(`Modal close attempt ${attempts}/${maxAttempts}`);

    // Strategy 1: Find and click close button - ONLY target actual close buttons
    const closeSelectors = [
      'div[role="dialog"] svg[aria-label="Close"]',
      'div[role="dialog"] button[aria-label="Close"]',
      'div[role="dialog"] [aria-label="Close"]',
      '[data-testid="modal-close-button"]',
      // Look for X icon specifically (common close pattern)
      'div[role="dialog"] svg[aria-label*="Close"]',
      'div[role="dialog"] svg[aria-label*="close"]',
    ];

    let closed = false;
    for (const selector of closeSelectors) {
      try {
        const elements = document.querySelectorAll(selector);
        for (const element of elements) {
          // Verify this is actually a close button and not navigation
          if (isActualCloseButton(element)) {
            debugLog(`Found valid close button with selector: ${selector}`);
            const clickable =
              element.closest("button") || element.parentElement;
            clickable.click();
            await wait(800);

            // Check if modal is closed
            if (!document.querySelector('div[role="dialog"]')) {
              debugLog("Modal closed successfully with button click");
              return;
            }
            closed = true;
            break;
          }
        }
        if (closed) break;
      } catch (e) {
        // Try next selector
      }
    }

    if (closed) continue;

    // Strategy 1.5: Look specifically in modal header/top area for close buttons
    debugLog("Looking for close button in modal header area...");
    try {
      const modal = document.querySelector('div[role="dialog"]');
      if (modal) {
        // Look for buttons in the top portion of the modal
        const modalRect = modal.getBoundingClientRect();
        const headerHeight = Math.min(100, modalRect.height * 0.2); // Top 20% or 100px max

        const allButtons = modal.querySelectorAll('button, [role="button"]');
        for (const btn of allButtons) {
          const btnRect = btn.getBoundingClientRect();

          // Only consider buttons in the top area
          if (btnRect.top <= modalRect.top + headerHeight) {
            // Additional safety checks
            const btnText = btn.textContent || "";
            const btnLabel = btn.getAttribute("aria-label") || "";

            // Skip buttons that are clearly navigation
            if (
              btnText.includes("Next") ||
              btnText.includes("Previous") ||
              btnLabel.includes("Next") ||
              btnLabel.includes("Previous") ||
              btnLabel.includes("Go to")
            ) {
              continue;
            }

            // Check if this looks like a close button
            if (isActualCloseButton(btn)) {
              debugLog(`Found close button in header area`);
              btn.click();
              await wait(800);

              if (!document.querySelector('div[role="dialog"]')) {
                debugLog("Modal closed successfully with header close button");
                return;
              }
              closed = true;
              break;
            }
          }
        }
      }
    } catch (e) {
      debugLog(`Header close button search failed: ${e.message}`);
    }

    if (closed) continue;

    // Strategy 2: Press Escape key multiple times
    debugLog("Trying Escape key...");
    for (let i = 0; i < 3; i++) {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        })
      );
      document.dispatchEvent(
        new KeyboardEvent("keyup", {
          key: "Escape",
          keyCode: 27,
          bubbles: true,
          cancelable: true,
        })
      );
      await wait(200);
    }
    await wait(600);

    if (!document.querySelector('div[role="dialog"]')) {
      debugLog("Modal closed successfully with Escape key");
      return;
    }

    // Strategy 3: Click outside modal (background)
    debugLog("Trying background click...");
    const modal = document.querySelector('div[role="dialog"]');
    if (modal) {
      const modalBg = modal.parentElement;
      if (modalBg) {
        // Click in multiple areas around the modal
        const rect = modalBg.getBoundingClientRect();
        const clickPoints = [
          { x: rect.left + 10, y: rect.top + 10 },
          { x: rect.right - 10, y: rect.top + 10 },
          { x: rect.left + 10, y: rect.bottom - 10 },
          { x: rect.right - 10, y: rect.bottom - 10 },
        ];

        for (const point of clickPoints) {
          modalBg.dispatchEvent(
            new MouseEvent("click", {
              clientX: point.x,
              clientY: point.y,
              bubbles: true,
            })
          );
          await wait(200);
        }
        await wait(600);
      }
    }

    if (!document.querySelector('div[role="dialog"]')) {
      debugLog("Modal closed successfully with background click");
      return;
    }

    // Strategy 4: Browser back button (last resort)
    if (attempts === maxAttempts) {
      debugLog("All strategies failed, trying browser back...");
      window.history.back();
      await wait(1500);
    }
  }

  if (document.querySelector('div[role="dialog"]')) {
    debugLog("WARNING: Modal might still be open after all attempts");

    // Strategy 5: Force removal if still present
    const remainingModal = document.querySelector('div[role="dialog"]');
    if (remainingModal) {
      debugLog("Force removing modal...");
      const modalContainer =
        remainingModal.closest('[role="presentation"]') ||
        remainingModal.parentElement;
      if (modalContainer) {
        modalContainer.remove();
      }
    }
  } else {
    debugLog("Modal closed successfully");
  }

  await wait(500);
}

// Helper function to determine if an element is actually a close button
function isActualCloseButton(element) {
  if (!element) return false;

  // Get the button element (could be the element itself or a parent)
  const button =
    element.closest("button") ||
    (element.tagName === "BUTTON" ? element : element.parentElement);
  if (!button) return false;

  // Check aria-label for close indicators
  const ariaLabel =
    button.getAttribute("aria-label") ||
    element.getAttribute("aria-label") ||
    "";
  const normalizedLabel = ariaLabel.toLowerCase();

  // Positive indicators for close buttons
  if (
    normalizedLabel.includes("close") ||
    normalizedLabel === "cerrar" ||
    normalizedLabel === "fermer"
  ) {
    return true;
  }

  // Negative indicators - these are definitely NOT close buttons
  const navigationTerms = [
    "next",
    "previous",
    "prev",
    "forward",
    "back",
    "go to",
    "siguiente",
    "anterior",
  ];
  if (navigationTerms.some((term) => normalizedLabel.includes(term))) {
    debugLog(`Rejecting button with navigation label: "${ariaLabel}"`);
    return false;
  }

  // Check button position - close buttons are typically in top-right corner
  const rect = button.getBoundingClientRect();
  const modal = button.closest('div[role="dialog"]');
  if (modal) {
    const modalRect = modal.getBoundingClientRect();
    const isTopRight =
      rect.right >= modalRect.right - 100 && rect.top <= modalRect.top + 100;

    // If it's in top-right and has close-like SVG, it's likely a close button
    if (isTopRight) {
      const svg =
        button.querySelector("svg") || element.querySelector
          ? element.querySelector("svg")
          : null;
      if (svg) {
        const svgLabel = svg.getAttribute("aria-label") || "";
        if (svgLabel.toLowerCase().includes("close")) {
          return true;
        }

        // Check for X-like SVG (common close icon pattern)
        const paths = svg.querySelectorAll("path");
        if (paths.length === 1 || paths.length === 2) {
          // X icon usually has 1-2 paths
          return true;
        }
      }
    }
  }

  // Check for common close button patterns in the button content
  const buttonText = button.textContent || "";
  if (buttonText.trim() === "×" || buttonText.trim() === "✕") {
    return true;
  }

  // If none of the above, it's probably not a close button
  debugLog(`Cannot confirm button is close button, rejecting for safety`);
  return false;
}

// Ensure we're back on the profile page
async function ensureProfilePage() {
  // Check if we're still on the profile page
  if (!isInstagramProfile() && !window.location.pathname.includes("/p/")) {
    debugLog("Not on profile page, navigating back...");

    // Try browser back button
    if (window.history.length > 1) {
      window.history.back();
      await wait(2000);
    }

    // If still not on profile, force reload
    if (!isInstagramProfile()) {
      debugLog("Force reloading profile page...");
      window.location.reload();
      await wait(3000);
    }
  }
}

// Extract images from current post page (when navigated directly)
async function extractImagesFromCurrentPage(imageUrls) {
  const strategies = [
    () => document.querySelectorAll("article img"),
    () => document.querySelectorAll("main img"),
    () => document.querySelectorAll('img[src*="instagram"]'),
    () => document.querySelectorAll('[style*="background-image"]'),
  ];

  for (const strategy of strategies) {
    try {
      const elements = strategy();
      elements.forEach((element) => {
        if (element.tagName === "IMG") {
          if (
            element.src &&
            element.src.includes("instagram") &&
            element.naturalWidth > 150
          ) {
            imageUrls.add(element.src);
            debugLog(`Found page image: ${element.src.substring(0, 80)}...`);
          }
        } else if (element.style && element.style.backgroundImage) {
          const match = element.style.backgroundImage.match(
            /url\(['"]?(.*?)['"]?\)/
          );
          if (match && match[1] && match[1].includes("instagram")) {
            imageUrls.add(match[1]);
            debugLog(`Found page background: ${match[1].substring(0, 80)}...`);
          }
        }
      });
    } catch (error) {
      debugLog("Page extraction strategy failed:", error);
    }
  }
}

// Extract from visible post on profile page
async function extractFromVisiblePost(postId, imageUrls) {
  // Look for visible post elements that might contain images
  const postElements = document.querySelectorAll(`[href*="${postId}"]`);

  for (const element of postElements) {
    try {
      // Look for images near this post element
      const container =
        element.closest("article") ||
        element.closest('div[role="button"]') ||
        element.parentElement;
      if (container) {
        const images = container.querySelectorAll("img");
        images.forEach((img) => {
          if (
            img.src &&
            img.src.includes("instagram") &&
            img.naturalWidth > 100
          ) {
            imageUrls.add(img.src);
            debugLog(
              `Found visible post image: ${img.src.substring(0, 80)}...`
            );
          }
        });
      }
    } catch (error) {
      debugLog("Visible post extraction failed:", error);
    }
  }
}

function findPostLink(postUrl) {
  debugLog(`Looking for post link: ${postUrl}`);

  // Clean the target URL for comparison
  const cleanTargetUrl = postUrl.replace(/\/+$/, "");
  const postId = postUrl.match(/\/p\/([^\/]+)/)?.[1];

  if (!postId) {
    debugLog(`Could not extract post ID from ${postUrl}`);
    return null;
  }

  // Multiple strategies to find the link
  const strategies = [
    // Strategy 1: Exact match with various formats
    () => {
      const exactSelectors = [
        `a[href="${postUrl}"]`,
        `a[href="${cleanTargetUrl}"]`,
        `a[href="${cleanTargetUrl}/"]`,
        `a[href*="${postId}"][href*="/p/"]`,
      ];

      for (const selector of exactSelectors) {
        try {
          const element = document.querySelector(selector);
          if (element) {
            debugLog(`Found exact match with selector: ${selector}`);
            return element;
          }
        } catch (e) {
          // Ignore bad selectors
        }
      }
      return null;
    },

    // Strategy 2: Find by post ID in href
    () => {
      const allPostLinks = document.querySelectorAll('a[href*="/p/"]');
      for (const link of allPostLinks) {
        const linkPostId = link.href.match(/\/p\/([^\/\?]+)/)?.[1];
        if (linkPostId === postId) {
          debugLog(`Found by post ID match: ${link.href}`);
          return link;
        }
      }
      return null;
    },

    // Strategy 3: Find by partial URL match
    () => {
      const allPostLinks = document.querySelectorAll('a[href*="/p/"]');
      for (const link of allPostLinks) {
        const cleanLinkUrl = link.href.split("?")[0].replace(/\/+$/, "");
        if (cleanLinkUrl === cleanTargetUrl) {
          debugLog(`Found by clean URL match: ${link.href}`);
          return link;
        }
      }
      return null;
    },

    // Strategy 4: Scroll and find (maybe the link is not in viewport)
    () => {
      // Find any link with the post ID and scroll it into view
      const allPostLinks = document.querySelectorAll('a[href*="/p/"]');
      for (const link of allPostLinks) {
        if (link.href.includes(postId)) {
          debugLog(`Found scrollable link: ${link.href}`);
          link.scrollIntoView({ behavior: "smooth", block: "center" });
          return link;
        }
      }
      return null;
    },
  ];

  // Try each strategy
  for (let i = 0; i < strategies.length; i++) {
    try {
      const result = strategies[i]();
      if (result) {
        debugLog(`Strategy ${i + 1} succeeded for ${postUrl}`);
        return result;
      }
    } catch (error) {
      debugLog(`Strategy ${i + 1} failed:`, error);
    }
  }

  debugLog(`All strategies failed for ${postUrl}`);
  return null;
}

async function waitForModal(timeout = 8000) {
  debugLog(`Waiting for modal to appear...`);
  const start = Date.now();
  let attempts = 0;

  while (Date.now() - start < timeout) {
    attempts++;
    const modal = document.querySelector('div[role="dialog"]');

    if (modal && modal.offsetHeight > 0) {
      // Additional check to ensure modal is fully loaded
      const images = modal.querySelectorAll("img");
      if (images.length > 0) {
        debugLog(
          `Modal found after ${attempts} attempts (${Date.now() - start}ms)`
        );
        await wait(500); // Small delay to ensure it's fully rendered
        return modal;
      }
    }

    await wait(100);
  }

  debugLog(`Modal timeout after ${attempts} attempts (${timeout}ms)`);
  return null;
}

async function extractImagesFromModal(modal, imageUrls) {
  // Multiple strategies to find images
  const strategies = [
    () => modal.querySelectorAll("img"),
    () => modal.querySelectorAll('[style*="background-image"]'),
    () => document.querySelectorAll('div[role="dialog"] img'),
  ];

  for (const strategy of strategies) {
    try {
      const elements = strategy();
      elements.forEach((element) => {
        if (element.tagName === "IMG") {
          if (
            element.src &&
            element.src.includes("instagram") &&
            element.naturalWidth > 150
          ) {
            imageUrls.add(element.src);
          }
        } else if (element.style && element.style.backgroundImage) {
          const match = element.style.backgroundImage.match(
            /url\(['"]?(.*?)['"]?\)/
          );
          if (match && match[1] && match[1].includes("instagram")) {
            imageUrls.add(match[1]);
          }
        }
      });
    } catch (error) {
      debugLog("Image extraction strategy failed:", error);
    }
  }
}

// == Carousel Detection ==
async function isCarouselPost(modal) {
  // Focus on the main post content area, not the entire modal which might contain navigation elements
  const postContent =
    modal.querySelector('[role="dialog"] > div > div') ||
    modal.querySelector("article") ||
    modal.querySelector('[data-testid="post-content"]') ||
    modal;

  debugLog("Checking carousel indicators in post content area...");

  // Strategy 1: Look for carousel SVG icon WITHIN the post content (more flexible)
  const carouselSvgSelectors = [
    'svg[aria-label="Carousel"]',
    'svg[aria-label*="carousel" i]', // Case insensitive
    '[aria-label*="carousel" i]',
    'svg[title*="carousel" i]',
    '[title*="carousel" i]',
  ];

  for (const selector of carouselSvgSelectors) {
    try {
      const carouselElement = postContent.querySelector(selector);
      if (carouselElement) {
        debugLog(
          `Carousel detected: found element with selector "${selector}"`
        );
        return true;
      }
    } catch (e) {
      // Ignore selector errors
    }
  }

  // Strategy 2: Look for navigation buttons specific to carousels
  const carouselNavigationSelectors = [
    'button[aria-label="Next"]:not([aria-label*="post"])',
    'button[aria-label="Previous"]:not([aria-label*="post"])',
    'button[aria-label="Go to next media"]',
    'button[aria-label="Go to previous media"]',
    'button[aria-label*="next" i]:not([aria-label*="post" i])',
    'button[aria-label*="previous" i]:not([aria-label*="post" i])',
  ];

  for (const selector of carouselNavigationSelectors) {
    try {
      const navButtons = postContent.querySelectorAll(selector);
      if (navButtons.length > 0) {
        // Verify these are small carousel buttons, not large post navigation
        let hasSmallButtons = false;
        navButtons.forEach((button) => {
          const rect = button.getBoundingClientRect();
          const isSmall = rect.width < 100 && rect.height < 100;
          const hasRotatedSVG = button.querySelector(
            '[style*="rotate(90deg)"]'
          );

          if (isSmall && !hasRotatedSVG) {
            hasSmallButtons = true;
          }
        });

        if (hasSmallButtons) {
          debugLog(
            `Carousel detected: found small navigation buttons with "${selector}"`
          );
          return true;
        }
      }
    } catch (e) {
      // Ignore selector errors
    }
  }

  // Strategy 3: Look for transform containers indicating sliding content
  const transformElements = postContent.querySelectorAll(
    'div[style*="transform"]'
  );
  for (const element of transformElements) {
    const style = element.style.transform;
    if (
      style &&
      (style.includes("translateX") || style.includes("translate3d"))
    ) {
      // Verify this is likely a carousel container, not other transforms
      const rect = element.getBoundingClientRect();
      const isLikelyCarousel = rect.width > 300 && rect.height > 300; // Substantial size

      if (isLikelyCarousel) {
        debugLog("Carousel detected: found transform elements in post content");
        return true;
      }
    }
  }

  // Strategy 4: Look for multiple large images within the post content
  const images = postContent.querySelectorAll('img[src*="instagram.com"]');
  if (images.length > 1) {
    // Filter out small images (likely avatars or icons)
    const largeImages = Array.from(images).filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 200 && rect.height > 200; // Only count substantial images
    });

    if (largeImages.length > 1) {
      debugLog(
        `Carousel detected: found ${largeImages.length} large images in post content`
      );
      return true;
    }
  }

  // Strategy 5: Look for pagination dots or indicators
  const dotSelectors = [
    '[role="tablist"] [role="tab"]',
    'div[style*="cursor: pointer"][style*="border-radius"]',
    'div[style*="width: 6px"], div[style*="width: 8px"]', // Common dot sizes
  ];

  for (const selector of dotSelectors) {
    try {
      const dots = postContent.querySelectorAll(selector);
      if (dots.length > 1 && dots.length <= 20) {
        // Reasonable carousel size
        debugLog(`Carousel detected: found ${dots.length} pagination dots`);
        return true;
      }
    } catch (e) {
      // Ignore selector errors
    }
  }

  debugLog("No carousel indicators found in post content");
  return false;
}

// == Helper function to distinguish carousel vs post navigation ==
function isLikelyCarouselButton(button, modal) {
  const rect = button.getBoundingClientRect();
  const modalRect = modal.getBoundingClientRect();

  // Check for SVG structure that indicates large navigation
  const hasRotatedSVG = button.querySelector('[style*="rotate(90deg)"]');

  // Avoid buttons that are clearly for post navigation based on size and position
  const isLargeSize = rect.width > 80 || rect.height > 80;
  const isEdgePosition =
    rect.left <= modalRect.left + 50 || rect.right >= modalRect.right - 50;

  // Check if button is in middle vertical area (carousel buttons are typically centered)
  const isMiddleVertical =
    rect.top > modalRect.top + modalRect.height * 0.2 &&
    rect.bottom < modalRect.bottom - modalRect.height * 0.2;

  // Avoid buttons that are clearly for post navigation (header/footer area)
  const notInHeaderFooter =
    rect.top > modalRect.top + 60 && rect.bottom < modalRect.bottom - 60;

  // Main logic: must be small, NOT have rotated SVG, NOT be at edges, and be in middle area
  const isCarouselBtn =
    !isLargeSize &&
    !hasRotatedSVG &&
    !isEdgePosition &&
    isMiddleVertical &&
    notInHeaderFooter;

  debugLog(
    `Button analysis: size=${rect.width}x${rect.height}, ` +
      `hasRotatedSVG=${hasRotatedSVG}, isLarge=${isLargeSize}, ` +
      `isEdge=${isEdgePosition}, isMiddle=${isMiddleVertical}, ` +
      `notHeaderFooter=${notInHeaderFooter}, result=${isCarouselBtn}`
  );

  return isCarouselBtn;
}

// == Carousel Information Helper ==
async function getCarouselInfo(modal) {
  debugLog("Getting carousel information...");

  const carouselInfo = {
    isCarousel: false,
    totalImages: 1,
    currentIndex: 0,
  };

  // Focus on the main post content area, not the entire modal
  const postContent =
    modal.querySelector('[role="dialog"] > div > div') ||
    modal.querySelector("article") ||
    modal.querySelector('[data-testid="post-content"]') ||
    modal;

  debugLog("Analyzing post content area for carousel information...");

  // Primary check: Look for carousel SVG icon within post content
  const carouselSvg = postContent.querySelector('svg[aria-label="Carousel"]');
  if (carouselSvg) {
    // Verify this SVG is in the main content area, not navigation
    const svgRect = carouselSvg.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();

    const isInMainContent =
      svgRect.top > modalRect.top + 60 &&
      svgRect.bottom < modalRect.bottom - 60 &&
      svgRect.left > modalRect.left + 50 &&
      svgRect.right < modalRect.right - 50;

    if (isInMainContent) {
      carouselInfo.isCarousel = true;
      debugLog("Carousel detected: found carousel SVG icon in post content");
    }
  }

  // Secondary checks - focus on post content area only
  if (!carouselInfo.isCarousel) {
    const carouselIndicators = [
      // Navigation buttons within post content
      'button[aria-label="Next"]:not([aria-label*="post"])',
      'button[aria-label="Previous"]:not([aria-label*="post"])',
      'button[aria-label="Go to next media"]',
      'button[aria-label="Go to previous media"]',
      // Transform containers indicating sliding content
      'div[style*="transform: translateX"]',
      'div[style*="transform:translateX"]',
      // Carousel title/label
      '[title="Carousel"]',
    ];

    // Check if carousel indicators exist within post content
    for (const selector of carouselIndicators) {
      try {
        const elements = postContent.querySelectorAll(selector);
        if (elements.length > 0) {
          // Verify these are small carousel buttons, not large post navigation
          let hasValidCarouselElements = false;
          elements.forEach((element) => {
            if (element.tagName === "BUTTON") {
              const rect = element.getBoundingClientRect();
              const isSmall = rect.width < 100 && rect.height < 100;
              const hasRotatedSVG = element.querySelector(
                '[style*="rotate(90deg)"]'
              );

              if (isSmall && !hasRotatedSVG) {
                hasValidCarouselElements = true;
              }
            } else {
              hasValidCarouselElements = true; // Non-button elements
            }
          });

          if (hasValidCarouselElements) {
            carouselInfo.isCarousel = true;
            debugLog(
              `Carousel detected using selector: ${selector} in post content`
            );
            break;
          }
        }
      } catch (e) {
        // Ignore selector errors
      }
    }
  }

  // If not detected as carousel, check for multiple large images within post content
  if (!carouselInfo.isCarousel) {
    const images = postContent.querySelectorAll('img[src*="instagram.com"]');
    const largeImages = Array.from(images).filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 200 && rect.height > 200; // Only substantial images
    });

    if (largeImages.length > 1) {
      carouselInfo.isCarousel = true;
      debugLog(
        `Carousel detected: found ${largeImages.length} large images in post content`
      );
    }
  }

  // If still not detected, check for transform elements within post content
  if (!carouselInfo.isCarousel) {
    const transformElements = postContent.querySelectorAll(
      'div[style*="transform"]'
    );
    for (const element of transformElements) {
      const style = element.style.transform;
      if (
        style &&
        (style.includes("translateX") || style.includes("translate3d"))
      ) {
        // Verify this is likely a carousel container
        const rect = element.getBoundingClientRect();
        const isLikelyCarousel = rect.width > 300 && rect.height > 300;

        if (isLikelyCarousel) {
          carouselInfo.isCarousel = true;
          debugLog(
            "Carousel detected: found transform elements in post content"
          );
          break;
        }
      }
    }
  }

  if (!carouselInfo.isCarousel) {
    debugLog("Not a carousel post");
    return carouselInfo;
  }

  // Try to determine total number of images and current index within post content
  try {
    // Look for dot indicators using more reliable selectors within post content
    const dotSelectors = [
      // Look for role-based navigation indicators
      '[role="tablist"] [role="tab"]',
      '[aria-label*="of"]', // "1 of 5" type indicators
      // Look for navigation dots by structure within post content
      'div[style*="flex"] div[style*="cursor: pointer"]',
      'div[style*="cursor: pointer"][style*="border-radius"]',
    ];

    for (const selector of dotSelectors) {
      try {
        const dots = postContent.querySelectorAll(selector);
        if (dots.length > 1 && dots.length <= 20) {
          // Reasonable carousel size
          carouselInfo.totalImages = dots.length;

          // Find current active dot by checking attributes and styles
          for (let i = 0; i < dots.length; i++) {
            const dot = dots[i];
            const isActive =
              dot.getAttribute("aria-selected") === "true" ||
              dot.getAttribute("aria-current") === "true" ||
              dot.style.opacity === "1" ||
              getComputedStyle(dot).opacity === "1" ||
              dot.style.backgroundColor !== "transparent";
            if (isActive) {
              carouselInfo.currentIndex = i;
              break;
            }
          }

          debugLog(
            `Carousel info from dots: ${carouselInfo.totalImages} total, current index ${carouselInfo.currentIndex}`
          );
          return carouselInfo;
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    // Look for text indicators like "1 / 5" or "1 of 5" within post content
    const textIndicators = postContent.querySelectorAll("*");
    for (const element of textIndicators) {
      const text = element.textContent || element.innerText;
      if (text && text.length < 20) {
        // Focus on short text that might be indicators
        // Match patterns like "1 / 5", "1 of 5", "2/8", etc.
        const match = text.match(/(\d+)\s*(?:\/|of)\s*(\d+)/);
        if (match) {
          carouselInfo.currentIndex = parseInt(match[1]) - 1; // Convert to 0-based
          carouselInfo.totalImages = parseInt(match[2]);
          debugLog(
           
            `Carousel info from text "${text}": ${carouselInfo.totalImages} total, current index ${carouselInfo.currentIndex}`
          );
          return carouselInfo;
        }
      }
    }

    // Fallback: try to count large loaded images within post content
    const loadedImages = postContent.querySelectorAll(
      'img[src*="instagram.com"]'
    );
    const largeImages = Array.from(loadedImages).filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 200 && rect.height > 200;
    });

    if (largeImages.length > 1) {
      carouselInfo.totalImages = largeImages.length;
      debugLog(
        `Carousel info from images: ${carouselInfo.totalImages} total (estimated from post content)`
      );
    }

    // Fallback: look for transform elements to estimate position within post content
    const transformContainer = postContent.querySelector(
      'div[style*="transform: translateX"], div[style*="transform:translateX"]'
    );
    if (transformContainer) {
      const transform = transformContainer.style.transform;
      const translateMatch = transform.match(/translateX\(([^)]+)\)/);
      if (translateMatch) {
        const translateValue = translateMatch[1];
        // Estimate current index based on translation percentage
        if (translateValue.includes("%")) {
          const percentage = parseFloat(translateValue);
          carouselInfo.currentIndex = Math.round(Math.abs(percentage) / 100);
        }
        debugLog(
          `Carousel position from transform: index ${carouselInfo.currentIndex}`
        );
      }
    }
  } catch (error) {
    debugLog(`Error determining carousel info:`, error);
  }

  debugLog(
    `Final carousel info: ${carouselInfo.totalImages} total, current index ${carouselInfo.currentIndex}`
  );
  return carouselInfo;
}

// == Enhanced Carousel Navigation ==
async function navigateCarousel(modal, imageUrls) {
  debugLog("Starting carousel navigation...");

  // First, determine the total number of images in the carousel
  const carouselInfo = await getCarouselInfo(modal);
  if (!carouselInfo.isCarousel) {
    debugLog("Not a carousel post, skipping navigation");
    return;
  }

  debugLog(
    `Carousel detected with ${carouselInfo.totalImages} images, currently at index ${carouselInfo.currentIndex}`
  );

  let attempts = 0;
  const maxAttempts = Math.min(10, carouselInfo.totalImages);
  let lastImageCount = imageUrls.size;
  let noNewImagesCount = 0;
  let currentImageIndex = carouselInfo.currentIndex;

  while (
    attempts < maxAttempts &&
    currentImageIndex < carouselInfo.totalImages - 1
  ) {
    attempts++;
    debugLog(
      `Carousel navigation attempt ${attempts}/${maxAttempts}, moving from image ${currentImageIndex} to ${
        currentImageIndex + 1
      }`
    );

    // Add a short delay to ensure the UI has rendered before searching for the Next button
    debugLog("Waiting for UI to render before searching for Next button...");
    await new Promise((resolve) => setTimeout(resolve, 800)); // Increased delay

    // FIRST: Try the most direct approach - look for Next button with exact aria-label
    debugLog("Trying direct Next button search first...");
    let carouselNextButton = null;

    // Try the most reliable selector first
    const directNextButtons = modal.querySelectorAll(
      'button[aria-label="Next"]'
    );
    debugLog(
      `Found ${directNextButtons.length} buttons with aria-label="Next"`
    );

    if (directNextButtons.length > 0) {
      // Pick the first one that looks like a carousel button (not post navigation)
      for (const btn of directNextButtons) {
        const rect = btn.getBoundingClientRect();
        const modalRect = modal.getBoundingClientRect();

        debugLog(`Checking Next button: ${rect.width}x${rect.height}`);

        // Skip very large buttons (likely post navigation)
        if (rect.width > 150 || rect.height > 150) {
          debugLog(`  -> Skipped: Too large (${rect.width}x${rect.height})`);
          continue;
        }

        // Skip buttons at the very edges (likely post navigation)
        const isAtEdge =
          rect.left <= modalRect.left + 30 ||
          rect.right >= modalRect.right - 30;
        if (isAtEdge) {
          debugLog(`  -> Skipped: At edge`);
          continue;
        }

        // This looks like a carousel button
        carouselNextButton = btn;
        debugLog(`  -> Selected as carousel Next button`);
        break;
      }
    }

    // If direct approach didn't work, fall back to comprehensive search
    if (!carouselNextButton) {
      debugLog("Direct approach failed, trying comprehensive search...");

      // Find ALL Next buttons within the post content area, not the entire modal
      const postContent =
        modal.querySelector('[role="dialog"] > div > div') ||
        modal.querySelector("article") ||
        modal.querySelector('[data-testid="post-content"]') ||
        modal;

      // Enhanced button detection with tabindex=-1 and aria-label="Next"
      const nextButtonSelectors = [
        'button[aria-label="Next"][tabindex="-1"]', // Prioritize buttons with tabindex=-1
        'button[aria-label="Next"]',
        'button[aria-label*="next" i]', // Case insensitive
        'button[aria-label="Go to next media"]',
        'button[aria-label="Next media"]',
        '[role="button"][aria-label*="next" i]',
        // Look for SVG-based next buttons
        'button:has(svg[aria-label="Next"])',
        'button:has(svg[aria-label*="next" i])',
        // Look for elements containing next arrows
        'button svg[aria-label="Next"]',
        'button svg[aria-label*="next" i]',
        // Fallback: look for any button in carousel area with arrow-like content
        'button[style*="position: absolute"]', // Often carousel buttons are absolutely positioned
      ];

      let allNextButtons = [];
      for (const selector of nextButtonSelectors) {
        try {
          const buttons = postContent.querySelectorAll(selector);
          for (const btn of buttons) {
            // If it's an SVG, get the parent button
            const actualButton = btn.closest("button") || btn;
            if (
              actualButton.tagName === "BUTTON" &&
              !allNextButtons.includes(actualButton)
            ) {
              allNextButtons.push(actualButton);
            }
          }
        } catch (e) {
          // Ignore selector errors
        }
      }

      debugLog(
        `Found ${allNextButtons.length} potential Next buttons in post content area using enhanced detection`
      );

      let carouselNextButton = null;
      let smallestButton = null;
      let smallestSize = Infinity;

      // Find the smallest Next button (carousel buttons are much smaller)
      for (const button of allNextButtons) {
        const rect = button.getBoundingClientRect();
        const buttonSize = rect.width * rect.height;

        // Log each button for debugging
        debugLog(`Button: ${rect.width}x${rect.height} (area: ${buttonSize})`);
        debugLog(`  Classes: "${button.className}"`);
        debugLog(
          `  Aria-label: "${button.getAttribute("aria-label") || "none"}"`
        );
        debugLog(
          `  Has rotated SVG: ${
            button.querySelector('[style*="rotate(90deg)"]') ? "YES" : "NO"
          }`
        );
        debugLog(`  Parent classes: "${button.closest("div")?.className || ""}"`);

        // Skip buttons that are clearly large navigation (avoid class-based detection)
        const hasRotatedSVG = button.querySelector('[style*="rotate(90deg)"]');

        // Check for large navigation by size and position instead of class
        const modalRect = modal.getBoundingClientRect();
        const isLargeBySize = rect.width > 100 || rect.height > 100;
        const isEdgePosition =
          rect.left <= modalRect.left + 50 || rect.right >= modalRect.right - 50;

        // More lenient size check for carousel buttons (Instagram may vary)
        const isReasonableSize =
          rect.width > 20 &&
          rect.height > 20 &&
          rect.width < 150 &&
          rect.height < 150;

        // Skip very large buttons or those with rotated SVGs (post navigation)
        if (hasRotatedSVG || isLargeBySize || isEdgePosition) {
          debugLog(
            `  -> Skipped: Large/edge navigation button (rotatedSVG: ${!!hasRotatedSVG}, large: ${isLargeBySize}, edge: ${isEdgePosition})`
          );
          continue;
        }

        // Accept reasonable-sized buttons as potential carousel buttons
        if (isReasonableSize) {
          // Prefer smaller buttons, but accept any reasonable size
          if (buttonSize < smallestSize || !smallestButton) {
            smallestSize = buttonSize;
            smallestButton = button;
            debugLog(
              `  -> New carousel button candidate (size: ${rect.width}x${rect.height})`
            );
          }
        } else {
          debugLog(
            `  -> Skipped: Unreasonable size (${rect.width}x${rect.height})`
          );
        }
      }

      // Use the smallest button as carousel button
      if (smallestButton) {
        carouselNextButton = smallestButton;
        const rect = smallestButton.getBoundingClientRect();
        debugLog(`Selected carousel button: ${rect.width}x${rect.height}`);
      }

      if (!carouselNextButton) {
        debugLog(
          `No suitable carousel next button found after ${attempts} attempts`
        );
        debugLog(`Total buttons found: ${allNextButtons.length}`);

        // Log what we found for debugging
        if (allNextButtons.length > 0) {
          debugLog(`Available buttons:`);
          allNextButtons.forEach((btn, i) => {
            const rect = btn.getBoundingClientRect();
            const ariaLabel = btn.getAttribute("aria-label") || "none";
            debugLog(
              `  Button ${i + 1}: ${rect.width}x${
                rect.height
              }, aria-label: "${ariaLabel}"`
            );
          });
        }

        // Fallback: try keyboard navigation
        debugLog("Trying keyboard navigation fallback...");
        try {
          // Try focusing the modal and using arrow keys
          modal.focus();
          await wait(200);

          // Try multiple keyboard strategies
          const keyStrategies = [
            { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
            { key: "Right", code: "ArrowRight", keyCode: 39 },
            { key: " ", code: "Space", keyCode: 32 }, // Space bar
          ];

          for (const keyEvent of keyStrategies) {
            debugLog(`Trying key: ${keyEvent.key}`);
            modal.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: keyEvent.key,
                code: keyEvent.code,
                keyCode: keyEvent.keyCode,
                bubbles: true,
              })
            );
            await wait(300);

            // Check if it worked
            const beforeCount = imageUrls.size;
            await extractImagesFromModal(modal, imageUrls);
            if (imageUrls.size > beforeCount) {
              debugLog(
                `Keyboard navigation successful with ${keyEvent.key}: found ${
                  imageUrls.size - beforeCount
                } new images`
              );
              lastImageCount = imageUrls.size;
              currentImageIndex++;
              noNewImagesCount = 0;
              break;
            }
          }

          // If keyboard didn't work, try one more manual approach
          if (imageUrls.size === lastImageCount) {
            debugLog("Keyboard navigation failed, trying manual navigation...");

            // Look for any clickable element that might advance the carousel
            const clickableElements = postContent.querySelectorAll(
              'button, [role="button"], [onclick], [style*="cursor: pointer"]'
            );

            debugLog(`Found ${clickableElements.length} clickable elements`);

            for (const element of clickableElements) {
              const rect = element.getBoundingClientRect();
              // Look for elements on the right side of the post (typical next button location)
              const modalRect = modal.getBoundingClientRect();
              const isOnRightSide =
                rect.left > modalRect.left + modalRect.width * 0.7;
              const isMiddleHeight =
                rect.top > modalRect.top + modalRect.height * 0.3 &&
                rect.bottom < modalRect.bottom - modalRect.height * 0.3;

              if (
                isOnRightSide &&
                isMiddleHeight &&
                rect.width < 100 &&
                rect.height < 100
              ) {
                debugLog(
                  `Trying manual click on right-side element: ${rect.width}x${rect.height}`
                );
                element.click();
                await wait(500);

                const beforeCount = imageUrls.size;
                await extractImagesFromModal(modal, imageUrls);
                if (imageUrls.size > beforeCount) {
                  debugLog(
                    `Manual navigation successful: found ${
                      imageUrls.size - beforeCount
                    } new images`
                  );
                  lastImageCount = imageUrls.size;
                  currentImageIndex++;
                  noNewImagesCount = 0;
                  break;
                }
              }
            }
          }

          if (imageUrls.size > lastImageCount) {
            continue; // Continue the main loop
          } else {
            debugLog(
              "All fallback navigation methods failed, ending carousel navigation"
            );
          }
        } catch (error) {
          debugLog(`Keyboard navigation failed:`, error);
        }

        break;
      }
    } // Close the comprehensive search if statement

    // Click the small carousel next button with multiple strategies
    try {
      debugLog(`Attempting to click carousel next button`);
      const buttonRect = carouselNextButton.getBoundingClientRect();
      debugLog(
        `Button position: ${buttonRect.left}, ${buttonRect.top}, size: ${buttonRect.width}x${buttonRect.height}`
      );

      // Strategy 1: Direct click
      carouselNextButton.click();
      await wait(500);

      // Check if carousel moved (extract and compare)
      const imageCountBeforeExtract = imageUrls.size;
      await extractImagesFromModal(modal, imageUrls);

      if (imageUrls.size === imageCountBeforeExtract) {
        // Strategy 2: Mouse event click
        debugLog(`Direct click failed, trying mouse event`);
        carouselNextButton.dispatchEvent(
          new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
            clientX: buttonRect.left + buttonRect.width / 2,
            clientY: buttonRect.top + buttonRect.height / 2,
          })
        );
        await wait(500);
        await extractImagesFromModal(modal, imageUrls);
      }

      if (imageUrls.size === imageCountBeforeExtract) {
        // Strategy 3: Focus and Enter key
        debugLog(`Mouse event failed, trying focus + Enter`);
        carouselNextButton.focus();
        carouselNextButton.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Enter",
            code: "Enter",
            keyCode: 13,
            bubbles: true,
          })
        );
        await wait(500);
        await extractImagesFromModal(modal, imageUrls);
      }

      await randomDelay(300, 700);

      // Check if we got new images
      if (imageUrls.size === lastImageCount) {
        noNewImagesCount++;
        if (noNewImagesCount >= 2) {
          debugLog(`No new images for 2 attempts, stopping carousel`);
          break;
        }
        debugLog(`No new images found, continuing...`);
      } else {
        noNewImagesCount = 0;
        currentImageIndex++;
        debugLog(
          `Carousel step ${attempts}: found ${
            imageUrls.size - lastImageCount
          } new images, now at index ${currentImageIndex}`
        );
      }
      lastImageCount = imageUrls.size;
    } catch (error) {
      debugLog(`Error clicking carousel next button:`, error);
      break;
    }
  }

  debugLog(
    `Carousel navigation completed after ${attempts} attempts. Processed ${
      currentImageIndex + 1
    } of ${carouselInfo.totalImages} images`
  );

  // Always close the modal after carousel navigation is complete
  debugLog("Closing modal after carousel navigation...");
  await forceCloseModal();
}

// == Profile page carousel detection ==
function isCarouselPostFromProfile(postElement) {
  debugLog("Checking if post element is a carousel...");

  // Strategy 1: Look for the carousel SVG icon in the post element
  const carouselSvg = postElement.querySelector('svg[aria-label="Carousel"]');
  if (carouselSvg) {
    debugLog("Carousel detected on profile: found carousel SVG icon");
    return true;
  }

  // Strategy 2: Look for carousel title attribute
  const carouselTitle = postElement.querySelector('[title="Carousel"]');
  if (carouselTitle) {
    debugLog("Carousel detected on profile: found carousel title");
    return true;
  }

  // Strategy 3: Look for common carousel indicators in the post container
  const carouselIndicators = [
    'svg[aria-label*="carousel" i]', // Case insensitive
    '[aria-label*="carousel" i]',
    'svg[title*="carousel" i]',
    '[title*="carousel" i]',
    // Look for small overlay icons that might indicate multiple items
    'div[style*="position: absolute"] svg',
    // Look for dots or pagination indicators
    '[role="button"][style*="width: 6px"], [role="button"][style*="width: 8px"]',
    // Look for transform containers (sliding content)
    'div[style*="transform: translateX"]',
    // Look for carousel navigation buttons
    'button[aria-label*="next" i]',
    'button[aria-label*="previous" i]',
  ];

  for (const selector of carouselIndicators) {
    try {
      const element = postElement.querySelector(selector);
      if (element) {
        debugLog(`Carousel detected on profile using selector: ${selector}`);
        return true;
      }
    } catch (e) {
      // Ignore selector errors
    }
  }

  // Strategy 4: Look for carousel indicator overlays (newer Instagram)
  try {
    // Look for elements that might be carousel indicators (small positioned elements)
    const overlayElements = postElement.querySelectorAll(
      'div[style*="position: absolute"]'
    );
    for (const overlay of overlayElements) {
      const rect = overlay.getBoundingClientRect();
      // Small overlay elements (like carousel indicators) are typically tiny
      if (
        rect.width > 0 &&
        rect.width < 50 &&
        rect.height > 0 &&
        rect.height < 50
      ) {
        // Check if it contains SVG or other indicator elements
        const hasSvg = overlay.querySelector("svg");
        const hasButton = overlay.querySelector("button");
        if (hasSvg || hasButton) {
          debugLog(
            "Carousel detected on profile: found small overlay indicator"
          );
          return true;
        }
      }
    }
  } catch (e) {
    // Ignore errors
  }

  // Strategy 5: Look for multiple images in the post (less reliable but fallback)
  const images = postElement.querySelectorAll('img[src*="instagram"]');
  if (images.length > 1) {
    // Check if they're not just profile/avatar images
    const largeImages = Array.from(images).filter((img) => {
      const rect = img.getBoundingClientRect();
      return rect.width > 100 && rect.height > 100;
    });

    if (largeImages.length > 1) {
      debugLog("Carousel detected on profile: found multiple large images");
      return true;
    }
  }

  // Strategy 6: Fallback detection - be more permissive but still try to filter
  // Look for any signs this might be a multi-media post
  try {
    // Check for any buttons or interactive elements that might indicate navigation
    const buttons = postElement.querySelectorAll("button");
    for (const button of buttons) {
      const ariaLabel = button.getAttribute("aria-label") || "";
      if (
        ariaLabel.toLowerCase().includes("next") ||
        ariaLabel.toLowerCase().includes("previous") ||
        ariaLabel.toLowerCase().includes("carousel")
      ) {
        debugLog("Carousel detected on profile: found navigation button");
        return true;
      }
    }

    // Look for any transform or translate styles that suggest sliding content
    const allDivs = postElement.querySelectorAll("div");
    for (const div of allDivs) {
      const style = div.getAttribute("style") || "";
      if (
        style.includes("transform") &&
        (style.includes("translateX") || style.includes("translate3d"))
      ) {
        debugLog("Carousel detected on profile: found transform styling");
        return true;
      }
    }
  } catch (e) {
    // Ignore errors
  }

  debugLog("No carousel indicators found in post element");
  return false;
}

debugLog("Enhanced Instagram Image Scraper loaded");
