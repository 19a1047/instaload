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
  btn.textContent = "Get All Images";
  btn.title = "Extract all images from this Instagram profile";
  document.body.appendChild(btn);
  debugLog("Button appended to body", btn);
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

// == Enhanced ZIP Download ==
async function downloadAsZip(links, button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Loading JSZip...";

  try {
    await loadJSZip();
    const zip = new window.JSZip();
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < links.length; i++) {
      const url = links[i];
      const filename =
        url.split("?")[0].split("/").pop() || `ig-img-${i + 1}.jpg`;

      button.textContent = `Downloading ${i + 1}/${links.length}...`;

      try {
        const response = await fetch(url, {
          mode: "cors",
          headers: {
            Referer: "https://www.instagram.com/",
          },
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const blob = await response.blob();
        zip.file(filename, blob);
        successCount++;

        await wait(100); // Small delay between downloads
      } catch (error) {
        debugLog(`Failed to download ${url}:`, error);
        failCount++;
      }
    }

    button.textContent = "Creating ZIP...";
    const zipBlob = await zip.generateAsync({ type: "blob" });

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
      setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 3000);
    }
  } catch (error) {
    debugLog("ZIP download failed:", error);
    button.textContent = "Download Failed";
    button.style.background = "#f44336";
    setTimeout(() => {
      button.textContent = originalText;
      button.style.background = "#5864ff";
      button.disabled = false;
    }, 3000);
  }
}

// == Enhanced Instagram Scraper with Modern Selectors ==
async function mainIGScraper() {
  const btn = document.getElementById("ig-getall-btn");
  if (!btn) return;

  // Confirmation
  if (
    !confirm(
      "This will scroll through the Instagram profile and extract image URLs from posts.\n\n" +
        "⚠️ This may take several minutes and will:\n" +
        "• Scroll through the profile\n" +
        "• Open individual posts\n" +
        "• Extract high-quality image URLs\n\n" +
        "Continue?"
    )
  )
    return;

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

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    debugLog(
      `Extraction completed in ${duration}s. Found ${imageUrls.length} images.`
    );

    // Show results
    showModal(Array.from(imageUrls), errors);
  } catch (error) {
    debugLog("Scraper failed:", error);
    errors.push(`Fatal error: ${error.message}`);
    showModal([], errors);
  } finally {
    // Reset button
    btn.classList.remove("loading");
    btn.textContent = "Get All Images";
    btn.disabled = false;
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
              postLinks.add(href.split("?")[0] + "/");
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

  return Array.from(postLinks).slice(0, targetPosts);
}

// == Enhanced Image Extraction ==
async function extractImagesFromPosts(postLinks, errors, btn) {
  const imageUrls = new Set();
  const maxPostsToProcess = Math.min(postLinks.length, 100); // Limit for safety

  for (let i = 0; i < maxPostsToProcess; i++) {
    const postUrl = postLinks[i];
    btn.textContent = `Processing post ${i + 1}/${maxPostsToProcess}...`;

    try {
      await openAndExtractFromPost(postUrl, imageUrls, errors);
    } catch (error) {
      errors.push(`Post ${i + 1} error: ${error.message}`);
      debugLog(`Failed to process post ${postUrl}:`, error);
    }

    // Add delay between posts
    await randomDelay(1000, 2000);
  }

  return imageUrls;
}

// == Enhanced Single Post Processing ==
async function openAndExtractFromPost(postUrl, imageUrls, errors) {
  // Find and click the post link
  const postLink = findPostLink(postUrl);
  if (!postLink) {
    throw new Error(`Could not find clickable link for ${postUrl}`);
  }

  // Click to open modal
  postLink.scrollIntoView({ behavior: "smooth", block: "center" });
  await wait(500);
  postLink.click();
  await randomDelay(2000, 3000);

  // Wait for modal to open
  const modal = await waitForModal();
  if (!modal) {
    throw new Error("Modal did not open");
  }

  // Extract images from modal
  await extractImagesFromModal(modal, imageUrls);

  // Navigate through carousel if present
  await navigateCarousel(modal, imageUrls);

  // Close modal
  await closeModal(modal);
}

function findPostLink(postUrl) {
  const selectors = [
    `a[href="${postUrl}"]`,
    `a[href^="${postUrl.replace(/\/$/, "")}"]`,
    'a[href*="/p/"]',
  ];

  for (const selector of selectors) {
    const links = document.querySelectorAll(selector);
    for (const link of links) {
      if (link.href.includes(postUrl.match(/\/p\/([^\/]+)/)?.[1] || "")) {
        return link;
      }
    }
  }
  return null;
}

async function waitForModal(timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const modal = document.querySelector('div[role="dialog"]');
    if (modal && modal.offsetHeight > 0) {
      return modal;
    }
    await wait(100);
  }
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

async function navigateCarousel(modal, imageUrls) {
  let attempts = 0;
  const maxAttempts = 15;
  let lastImageCount = imageUrls.size;

  while (attempts < maxAttempts) {
    // Look for next button with multiple selectors
    const nextSelectors = [
      'div[role="dialog"] svg[aria-label="Next"]',
      'div[role="dialog"] button[aria-label="Next"]',
      'div[role="dialog"] [aria-label="Next"]',
      'button:has(svg[aria-label="Next"])',
    ];

    let nextButton = null;
    for (const selector of nextSelectors) {
      try {
        nextButton = modal.querySelector(selector);
        if (nextButton) break;
      } catch (e) {
        // Ignore selector errors
      }
    }

    if (!nextButton) break;

    // Click next button
    const clickableElement =
      nextButton.closest("button") || nextButton.parentElement;
    if (clickableElement) {
      clickableElement.click();
      await randomDelay(1000, 1500);

      // Extract new images
      await extractImagesFromModal(modal, imageUrls);

      // Check if we got new images
      if (imageUrls.size === lastImageCount) {
        break; // No new images, probably reached the end
      }
      lastImageCount = imageUrls.size;
    }

    attempts++;
  }
}

async function closeModal(modal) {
  const closeSelectors = [
    'div[role="dialog"] svg[aria-label="Close"]',
    'div[role="dialog"] button[aria-label="Close"]',
    'div[role="dialog"] [aria-label="Close"]',
  ];

  for (const selector of closeSelectors) {
    try {
      const closeButton = modal.querySelector(selector);
      if (closeButton) {
        const clickable =
          closeButton.closest("button") || closeButton.parentElement;
        clickable.click();
        await wait(1000);
        return;
      }
    } catch (e) {
      // Try next selector
    }
  }

  // Fallback: press Escape or click outside
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
  await wait(500);
}

debugLog("Enhanced Instagram Image Scraper loaded");
