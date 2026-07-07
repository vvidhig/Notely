import { useState, useCallback, useEffect, useRef } from "react";

export interface SelectionInfo {
  noteId: number;
  text: string;
  startOffset: number;
  endOffset: number;
  rect: DOMRect;
}

function getTextOffset(container: Node, targetNode: Node, targetOffset: number): number {
  let total = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node === targetNode) return total + targetOffset;
    total += node.textContent?.length ?? 0;
  }
  return total + targetOffset;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useTextHighlight(containerRef: React.RefObject<any>) {
  const [selection, setSelection] = useState<SelectionInfo | null>(null);
  const lastMouseUp = useRef<{ x: number; y: number } | null>(null);

  const clearSelection = useCallback(() => {
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  useEffect(() => {
    const handleMouseUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const selectedText = sel.toString().trim();
      if (!selectedText) { setSelection(null); return; }

      // Find the nearest ancestor with data-note-id
      let el: Element | null =
        range.commonAncestorContainer instanceof Element
          ? range.commonAncestorContainer
          : range.commonAncestorContainer.parentElement;

      let noteEl: Element | null = null;
      while (el) {
        if (el.hasAttribute("data-note-id")) { noteEl = el; break; }
        el = el.parentElement;
      }
      if (!noteEl) { setSelection(null); return; }

      const noteId = parseInt(noteEl.getAttribute("data-note-id")!, 10);
      const startOffset = getTextOffset(noteEl, range.startContainer, range.startOffset);
      const endOffset = getTextOffset(noteEl, range.endContainer, range.endOffset);
      const rect = range.getBoundingClientRect();

      setSelection({ noteId, text: selectedText, startOffset, endOffset, rect });
    };

    const container = containerRef.current;
    if (container) container.addEventListener("mouseup", handleMouseUp);
    return () => { if (container) container.removeEventListener("mouseup", handleMouseUp); };
  }, [containerRef]);

  // Dismiss on click outside toolbar
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      lastMouseUp.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener("mousedown", handleDown);
    return () => document.removeEventListener("mousedown", handleDown);
  }, []);

  return { selection, clearSelection };
}
