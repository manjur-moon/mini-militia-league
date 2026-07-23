export async function copyShareLink(value) {
  if (globalThis.navigator?.clipboard?.writeText) {
    await globalThis.navigator.clipboard.writeText(value);
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
  if (!copied) throw new Error("Unable to copy the public share link.");
}

export async function sharePublicItem({ title, text, url }) {
  if (!globalThis.navigator?.share) {
    await copyShareLink(url);
    return "copied";
  }

  await globalThis.navigator.share({ title, text, url });
  return "shared";
}

export async function downloadPublicImage({ imageUrl, filename }) {
  const response = await fetch(imageUrl, { headers: { Accept: "image/png" } });
  if (!response.ok) throw new Error("Unable to download the social artwork.");
  const blob = await response.blob();
  if (!blob.type.startsWith("image/png")) {
    throw new Error("The server returned an invalid social artwork file.");
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}
