const url = "./LS.pdf";

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

const container = document.getElementById("pdf-container");
const overlay = document.getElementById("loading-overlay");
const percentText = document.getElementById("loading-percent");

let pdfDoc = null;
let zoom = 1.5;

let rendered = 0;
let total = 0;
let canvasList = [];

// Load PDF
pdfjsLib.getDocument(url).promise.then(pdf => {
  pdfDoc = pdf;
  total = pdf.numPages;
  renderAllPages();
}).catch(err => {
  // fallback: show error message
  overlay.classList.add("hidden");
  document.body.classList.remove("no-scroll");
  const msg = document.createElement('div');
  msg.style.padding = '24px';
  msg.style.maxWidth = '900px';
  msg.textContent = 'Failed to load product brochure: ' + (err && err.message ? err.message : '');
  container.appendChild(msg);
});

// Render all pages first (hidden)
function renderAllPages() {
  for (let i = 1; i <= total; i++) {
    pdfDoc.getPage(i).then(page => {
      const viewport = page.getViewport({ scale: zoom });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { alpha: true });
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      page.render({ canvasContext: ctx, viewport }).promise.then(() => {
        removeWhite(canvas);
        canvasList.push(canvas);

        rendered++;
        updatePercent();

        if (rendered === total) {
          showAllPages();
        }
      }).catch(err => {
        rendered++;
        updatePercent();
        if (rendered === total) showAllPages();
      });
    }).catch(err => {
      rendered++;
      updatePercent();
      if (rendered === total) showAllPages();
    });
  }
}

function updatePercent() {
  const pct = Math.floor((rendered / total) * 100);
  percentText.textContent = pct + "%";
}

// After all pages load
function showAllPages() {
  overlay.classList.add("hidden");
  document.body.classList.remove("no-scroll");

  canvasList.forEach(c => {
    container.appendChild(c);
    setTimeout(() => c.classList.add("visible"), 50);
  });
}

// Remove white background
function removeWhite(canvas, threshold = 250) {
  const ctx = canvas.getContext("2d");
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = img.data;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] >= threshold && data[i+1] >= threshold && data[i+2] >= threshold) {
      data[i+3] = 0;
    }
  }

  ctx.putImageData(img, 0, 0);
}
