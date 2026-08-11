/**
 * Common UI patterns: modals, dropdowns, formatting.
 */

export interface PuzzleUI {
  registerModal(id: string, element: HTMLElement): void;
  showModal(id: string): void;
  hideModal(id: string): void;
  hideAllModals(): void;
  isModalOpen(id: string): boolean;
  setupModalClose(modalId: string, closeButtons: (HTMLElement | null | undefined)[]): void;
  setupDropdown(
    container: HTMLElement,
    selected: HTMLElement,
    options: HTMLElement[],
    onSelect?: (value: string) => void,
  ): void;
  $(selector: string): HTMLElement | null;
  $$(selector: string): NodeListOf<HTMLElement>;
  show(element: HTMLElement | null): void;
  hide(element: HTMLElement | null): void;
  setText(element: HTMLElement | null, text: string): void;
  setHTML(element: HTMLElement | null, html: string): void;
  formatTime(seconds: number): string;
  formatScore(score: number): string;
}

export function create(): PuzzleUI {
  const modals: Record<string, HTMLElement> = {};

  function registerModal(id: string, element: HTMLElement) {
    modals[id] = element;
  }

  function showModal(id: string) {
    if (modals[id]) {
      modals[id].classList.add('active');
    }
  }

  function hideModal(id: string) {
    if (modals[id]) {
      modals[id].classList.remove('active');
    }
  }

  function hideAllModals() {
    for (const id of Object.keys(modals)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      modals[id]!.classList.remove('active');
    }
  }

  function isModalOpen(id: string): boolean {
    return !!(modals[id] && modals[id].classList.contains('active'));
  }

  function setupModalClose(modalId: string, closeButtons: (HTMLElement | null | undefined)[]) {
    const modal = modals[modalId];
    if (!modal) return;

    closeButtons.forEach((btn) => {
      if (btn) {
        btn.addEventListener('click', () => hideModal(modalId));
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        hideModal(modalId);
      }
    });
  }

  function setupDropdown(
    container: HTMLElement,
    selected: HTMLElement,
    options: HTMLElement[],
    onSelect?: (value: string) => void,
  ) {
    let isOpen = false;

    selected.addEventListener('click', (e) => {
      e.stopPropagation();
      isOpen = !isOpen;
      container.classList.toggle('open', isOpen);
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        selected.textContent = option.textContent;
        selected.dataset.value = option.dataset.value ?? '';
        container.classList.remove('open');
        isOpen = false;
        if (onSelect) onSelect(option.dataset.value ?? '');
      });
    });

    document.addEventListener('click', (e) => {
      if (!container.contains(e.target as Node)) {
        container.classList.remove('open');
        isOpen = false;
      }
    });
  }

  function $(selector: string): HTMLElement | null {
    return document.querySelector(selector);
  }

  function $$(selector: string): NodeListOf<HTMLElement> {
    return document.querySelectorAll(selector);
  }

  function show(element: HTMLElement | null) {
    if (element) element.style.display = '';
  }

  function hide(element: HTMLElement | null) {
    if (element) element.style.display = 'none';
  }

  function setText(element: HTMLElement | null, text: string) {
    if (element) element.textContent = text;
  }

  function setHTML(element: HTMLElement | null, html: string) {
    if (element) element.innerHTML = html;
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function formatScore(score: number): string {
    return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  return {
    registerModal,
    showModal,
    hideModal,
    hideAllModals,
    isModalOpen,
    setupModalClose,
    setupDropdown,
    $,
    $$,
    show,
    hide,
    setText,
    setHTML,
    formatTime,
    formatScore,
  };
}
