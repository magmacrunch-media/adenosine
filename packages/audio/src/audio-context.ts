let ctx: AudioContext | null = null;

export function getCtx(): AudioContext {
  if (!ctx) {
    ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return ctx;
}

export async function resumeCtx(): Promise<void> {
  const c = getCtx();
  if (c.state === 'suspended') {
    await c.resume();
  }
}

export function closeCtx(): void {
  if (ctx && ctx.state !== 'closed') {
    ctx.close();
  }
  ctx = null;
}
