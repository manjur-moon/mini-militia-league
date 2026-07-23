function triggerDownload(blob, filename) {
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);
}

export async function downloadPlayerCardPng({ imageUrl, playerId }) {
  const response = await fetch(imageUrl, {
    headers: { Accept: "image/png" },
  });
  if (!response.ok) {
    throw new Error("Unable to download the player-card artwork.");
  }
  const blob = await response.blob();
  if (!blob.type.startsWith("image/png")) {
    throw new Error("The server returned an invalid player-card image.");
  }
  triggerDownload(blob, `${playerId}-mini-militia-player-card.png`);
}

export async function copyText(value) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const input = document.createElement("textarea");
  input.value = value;
  input.setAttribute("readonly", "");
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  const copied = document.execCommand("copy");
  input.remove();
  if (!copied) throw new Error("Unable to copy the share link.");
}
