"use strict";

const form = document.getElementById("qr-form");
const input = document.getElementById("qr-input");
const error = document.getElementById("form-error");
const result = document.getElementById("qr-result");
const qrContainer = document.getElementById("qrcode");
const downloadButton = document.getElementById("download-button");
const status = document.getElementById("status");
let qrCanvas = null;

function showError(message) {
  error.textContent = message;
  error.hidden = false;
  input.setAttribute("aria-invalid", "true");
  input.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  result.hidden = true;
  qrContainer.replaceChildren();
  qrCanvas = null;
  status.textContent = "";
  error.hidden = true;
  input.removeAttribute("aria-invalid");

  const data = input.value.trim();
  if (!data) {
    showError("Enter a URL, email address, or some text first.");
    return;
  }
  // Plain text is valid too. Encode the supplied data without rewriting it.
  // The encoder determines capacity because it varies by character encoding.
  if (typeof QRCode === "undefined") {
    showError("The QR library could not load. Check your connection and reload the page.");
    return;
  }

  try {
    new QRCode(qrContainer, {
      text: data,
      width: 256,
      height: 256,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
    // qrcodejs draws synchronously to canvas before creating its image.
    qrCanvas = qrContainer.querySelector("canvas");
    if (!qrCanvas) throw new Error("Canvas unavailable");
    result.hidden = false;
    status.textContent = "Your permanent QR code is ready to scan or download.";
  } catch (exception) {
    qrContainer.replaceChildren();
    qrCanvas = null;
    const message = /overflow|too long/i.test(String(exception))
      ? "This content is too long for a QR code with high error correction. Shorten it and try again."
      : "Could not generate the QR code. Try shorter text or a modern browser.";
    showError(message);
  }
});

input.addEventListener("input", () => {
  error.hidden = true;
  input.removeAttribute("aria-invalid");
});

downloadButton.addEventListener("click", () => {
  if (!qrCanvas) return;
  try {
    // Include a white quiet zone in the PNG to keep scanning reliable.
    const padding = 32;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = qrCanvas.width + padding * 2;
    exportCanvas.height = qrCanvas.height + padding * 2;
    const context = exportCanvas.getContext("2d");
    if (!context) throw new Error("Canvas unavailable");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    context.drawImage(qrCanvas, padding, padding);
    const link = document.createElement("a");
    link.href = exportCanvas.toDataURL("image/png");
    link.download = "permanent-qrcode.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
    status.textContent = "PNG download started.";
  } catch {
    error.textContent = "The PNG could not be downloaded. Try again in a modern browser.";
    error.hidden = false;
  }
});
