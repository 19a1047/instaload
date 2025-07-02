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

// fflate loader with local fallback for extension
function loadJSZip() {
  return new Promise((resolve, reject) => {
    if (window.JSZip) return resolve(window.JSZip);
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("jszip.js");
    script.onload = () => {
      setTimeout(() => {
        if (window.JSZip) {
          debugLog("JSZip loaded from local extension file");
          resolve(window.JSZip);
        } else {
          debugLog("JSZip script loaded but window.JSZip missing");
          reject(new Error("JSZip loaded but not available"));
        }
      }, 100);
    };
    script.onerror = () => {
      debugLog("Failed to load local jszip.js");
      reject(new Error("Failed to load local jszip.js"));
    };
    (document.head || document.documentElement).appendChild(script);
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

    // Download ZIP button (JSZip)
    const zipBtn = document.createElement("button");
    zipBtn.id = "ig-getall-zip";
    zipBtn.textContent = "Download ZIP (JSZip)";
    zipBtn.onclick = async () => downloadAsZipJszip(links, zipBtn);
    modal.appendChild(zipBtn);

    // Download TXT button
    const txtBtn = document.createElement("button");
    txtBtn.id = "ig-getall-txt";
    txtBtn.textContent = "Download All as TXT";
    txtBtn.onclick = () => downloadAsTxt(links, txtBtn);
    modal.appendChild(txtBtn);

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

// Download all URLs as TXT file
function downloadAsTxt(links, button) {
  const originalText = button.textContent;
  button.disabled = true;
  try {
    const blob = new Blob([links.join("\n")], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `instagram-urls-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    button.textContent = "Downloaded!";
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  } catch (err) {
    button.textContent = "Failed";
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 2000);
  }
}

// == Enhanced ZIP Download with Better Error Handling ==
async function downloadAsZipJszip(links, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Loading JSZip...";
  try {
    const JSZip = await loadJSZip();
    let successCount = 0;
    let failCount = 0;
    const zip = new JSZip();
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
      const promises = batch.map(async (url, index) => {
        const globalIndex = batchIndex * batchSize + index;
        const filename = extractFilename(url, globalIndex);
        try {
          const blob = await downloadImageWithFallback(url);
          zip.file(filename, blob);
          return { success: true };
        } catch (error) {
          debugLog(`Failed to download ${url}:`, error);
          return { success: false };
        }
      });
      const results = await Promise.allSettled(promises);
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.success) {
          successCount++;
        } else {
          failCount++;
        }
      });
      if (batchIndex < batches.length - 1) {
        await wait(500);
      }
    }
    if (successCount === 0) {
      throw new Error(
        "No images could be downloaded. Likely CORS issue. Use TXT/CSV with a download manager."
      );
    }
    button.textContent = "Creating ZIP...";
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(zipBlob);
    a.download = `instagram-images-${
      new Date().toISOString().split("T")[0]
    }.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    button.textContent = `Downloaded! (${successCount}/${links.length})`;
    setTimeout(() => {
      button.textContent = originalText;
      button.disabled = false;
    }, 4000);
  } catch (error) {
    debugLog("JSZip ZIP download failed:", error);
    button.textContent = "Download Failed";
    button.style.background = "#f44336";
    alert(
      `ZIP Download Failed: ${error.message}\n\nTip: Copy the CSV/TXT list and use a download manager like IDM or JDownloader instead.`
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
      "3 = Quick extraction (visible images only)\n" +
      "4 = API Extraction (fastest, most robust)\n\n" +
      "Enter 1, 2, 3, or 4:",
    "1"
  );

  if (!choice || !["1", "2", "3", "4"].includes(choice)) {
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
    } else if (choice === "3") {
      // Quick extraction mode
      await quickExtractionMode(btn, errors);
    } else if (choice === "4") {
      // API Extraction mode
      await extractAllMediaViaGraphQL(errors, btn);
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

// Full extraction mode (gallery-dl style: all posts, all images)
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

  // Phase 2: Extract images from posts (process ALL posts, single and carousel)
  btn.textContent = "Extracting images...";
  const imageUrls = new Set();
  const maxPostsToProcess = Math.min(postLinks.length, 50); // For performance
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
      // Always process all posts, regardless of type
      await openAndExtractFromPost(postUrl, imageUrls, errors, false); // smartMode = false

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

  // Show results
  showModal(Array.from(imageUrls), errors);
}

// Open a post in a modal, extract all images/videos, and close the modal
async function openAndExtractFromPost(
  postUrl,
  imageUrls,
  errors,
  smartMode = false
) {
  try {
    debugLog(`Opening post: ${postUrl}`);
    // Try to scroll to the post's position to ensure its link is loaded in the DOM
    let found = false;
    for (let scrollTry = 0; scrollTry < 20; scrollTry++) {
      let postLink = Array.from(
        document.querySelectorAll('a[href*="/p/"]')
      ).find((a) => a.href.split("?")[0] === postUrl.replace(/\/$/, ""));
      if (postLink) {
        postLink.scrollIntoView({ behavior: "instant", block: "center" });
        await wait(300);
        postLink.click();
        found = true;
        break;
      }
      // Scroll down a bit to load more posts
      window.scrollBy(0, 600);
      await wait(400);
    }
    if (!found) {
      errors.push(
        `Could not find post link in DOM for ${postUrl} after scrolling. Skipping.`
      );
      debugLog(
        `Could not find post link in DOM for ${postUrl} after scrolling. Skipping.`
      );
      return;
    }

    // Wait for modal to appear
    let modal = null;
    for (let i = 0; i < 20; i++) {
      modal = document.querySelector('div[role="dialog"]');
      if (modal) break;
      await wait(300);
    }
    if (!modal) throw new Error("Modal did not appear for post.");
    await wait(500); // Let modal content load

    // Helper to collect all images/videos from modal
    function collectMediaFromModal(modal) {
      const found = [];
      // Images
      modal.querySelectorAll("img").forEach((img) => {
        if (img.src && !imageUrls.has(img.src)) found.push(img.src);
      });
      // Videos
      modal.querySelectorAll("video").forEach((vid) => {
        if (vid.src && !imageUrls.has(vid.src)) found.push(vid.src);
      });
      return found;
    }

    // Detect carousel: look for next button
    let isCarousel = !!modal.querySelector(
      'button[aria-label*="Next" i], button svg[aria-label*="Next" i]'
    );
    let seen = new Set();
    let tries = 0;
    while (true) {
      // Collect media from current slide
      const found = collectMediaFromModal(modal);
      found.forEach((url) => imageUrls.add(url));
      found.forEach((url) => seen.add(url));
      // Try to go to next slide if carousel
      const nextBtn = modal.querySelector(
        'button[aria-label*="Next" i], button svg[aria-label*="Next" i]'
      );
      if (isCarousel && nextBtn && tries < 20) {
        nextBtn.click();
        await wait(600);
        tries++;
        // Stop if no new images/videos are found
        const newFound = collectMediaFromModal(modal).filter(
          (url) => !seen.has(url)
        );
        if (newFound.length === 0) break;
      } else {
        break;
      }
    }

    // Close modal
    const closeBtn = modal.querySelector(
      'svg[aria-label="Close"], button[aria-label*="Close" i]'
    );
    if (closeBtn) {
      closeBtn.closest("button")?.click();
      await wait(500);
    } else {
      // Fallback: press Escape
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", keyCode: 27, which: 27 })
      );
      await wait(500);
    }
    debugLog(`Extracted ${seen.size} images/videos from post: ${postUrl}`);
  } catch (err) {
    errors.push(`openAndExtractFromPost failed for ${postUrl}: ${err.message}`);
    debugLog(`openAndExtractFromPost failed for ${postUrl}: ${err.message}`);
  }
}

// == Instagram GraphQL API Extraction ==
async function extractAllMediaViaGraphQL(errors, btn) {
  try {
    btn.textContent = "API: Getting user ID...";
    // 1. Get user ID from window._sharedData or by scraping the page
    let userId = null;
    // Try to get from window._sharedData (classic IG)
    if (
      window._sharedData &&
      window._sharedData.entry_data &&
      window._sharedData.entry_data.ProfilePage
    ) {
      userId = window._sharedData.entry_data.ProfilePage[0].graphql.user.id;
    }
    // Try to get from scripts (modern IG)
    if (!userId) {
      const scripts = Array.from(document.scripts);
      for (const script of scripts) {
        if (script.textContent.includes("profilePage_")) {
          const match = script.textContent.match(/"profilePage_([0-9]+)"/);
          if (match) {
            userId = match[1];
            break;
          }
        }
      }
    }
    // Try to get from meta tags
    if (!userId) {
      const meta = document.querySelector('meta[property="al:ios:url"]');
      if (meta && meta.content) {
        const match = meta.content.match(/id=([0-9]+)/);
        if (match) userId = match[1];
      }
    }
    if (!userId)
      throw new Error("Could not determine user ID for this profile.");

    // 2. Fetch all posts using GraphQL API
    btn.textContent = "API: Fetching posts...";
    const query_hash = "58b6785bea111c67129decbe6a448951"; // profile posts
    let hasNextPage = true;
    let endCursor = null;
    let allMedia = [];
    let page = 1;
    while (hasNextPage) {
      const variables = {
        id: userId,
        first: 50,
        after: endCursor,
      };
      const url = `https://www.instagram.com/graphql/query/?query_hash=${query_hash}&variables=${encodeURIComponent(
        JSON.stringify(variables)
      )}`;
      btn.textContent = `API: Fetching page ${page}...`;
      debugLog("GraphQL fetch:", url);
      const resp = await fetch(url, { credentials: "include" });
      if (!resp.ok)
        throw new Error(`GraphQL fetch failed: HTTP ${resp.status}`);
      const data = await resp.json();
      const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges || [];
      for (const edge of edges) {
        const node = edge.node;
        // Helper to get highest-res image from display_resources
        function getBestDisplayResource(node) {
          if (
            Array.isArray(node.display_resources) &&
            node.display_resources.length > 0
          ) {
            // Use config_width/config_height for sorting if present, else fallback to width/height
            let best = node.display_resources[0];
            for (const res of node.display_resources) {
              const w = res.config_width || res.width || 0;
              const h = res.config_height || res.height || 0;
              const bestW = best.config_width || best.width || 0;
              const bestH = best.config_height || best.height || 0;
              if (w * h > bestW * bestH) {
                best = res;
              }
              // Prefer width >= 1080 if available (IG's max standard)
              if (w >= 1080 && w > bestW) {
                best = res;
              }
            }
            return best.src || node.display_url;
          }
          return node.display_url;
        }
        // Single image/video
        if (
          node.__typename === "GraphImage" ||
          node.__typename === "GraphVideo"
        ) {
          // For images, get best display_resource
          if (node.display_resources) {
            allMedia.push(getBestDisplayResource(node));
          } else if (node.display_url) {
            allMedia.push(node.display_url);
          }
          if (node.video_url) allMedia.push(node.video_url);
        }
        // Carousel
        if (
          node.__typename === "GraphSidecar" &&
          node.edge_sidecar_to_children
        ) {
          for (const child of node.edge_sidecar_to_children.edges) {
            const c = child.node;
            if (c.display_resources) {
              allMedia.push(getBestDisplayResource(c));
            } else if (c.display_url) {
              allMedia.push(c.display_url);
            }
            if (c.video_url) allMedia.push(c.video_url);
          }
        }
      }
      // Pagination
      const pageInfo =
        data?.data?.user?.edge_owner_to_timeline_media?.page_info;
      hasNextPage = pageInfo?.has_next_page;
      endCursor = pageInfo?.end_cursor;
      page++;
      // Safety: stop if too many
      if (allMedia.length > 1000) break;
    }
    debugLog(`GraphQL extraction found ${allMedia.length} media URLs.`);
    if (allMedia.length === 0) throw new Error("No media found via API.");
    showModal(Array.from(new Set(allMedia)), errors);
  } catch (err) {
    errors.push("GraphQL extraction failed: " + err.message);
    showModal([], errors);
  }
}
