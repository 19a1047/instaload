document.getElementById("getLinks").onclick = function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.scripting.executeScript(
      {
        target: { tabId: tabs[0].id },
        func: () => {
          const images = Array.from(document.querySelectorAll("img"));
          const links = images
            .map((img) => img.src)
            .filter((src) => src.includes("instagram"));
          return [...new Set(links)];
        },
      },
      (results) => {
        const links = results[0].result || [];
        document.getElementById("results").value = links.join("\n");
      }
    );
  });
};
