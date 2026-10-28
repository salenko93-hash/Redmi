/** Called from a user click. LAN HTTP may not expose navigator.clipboard. */
export async function copyText(
  text: string,
  field: HTMLTextAreaElement | null,
): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // A browser permission denial can still allow the older copy command.
  }
  if (!field || !field.isConnected) return false;
  try {
    field.focus({ preventScroll: true });
    field.select();
    field.setSelectionRange(0, field.value.length);
    // Deprecated, but remains the clipboard fallback for local HTTP and older browsers.
    return document.execCommand("copy");
  } catch {
    return false;
  }
}
