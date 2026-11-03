import '@rrweb/replay/dist/style.css';
import { Replayer } from '@rrweb/replay';
import { Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ReplayUtils } from '../utils/replay.utils';

interface ReplayPlayerProps {
  events: unknown[];
}

const MIN_EVENTS = 2;
const TICK_MS = 250;

export function ReplayPlayer({ events }: ReplayPlayerProps) {
  const container = useRef<HTMLDivElement>(null);
  const replayer = useRef<Replayer | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const target = container.current;
    if (!target || events.length < MIN_EVENTS) return;
    target.innerHTML = '';
    const instance = new Replayer(events as ConstructorParameters<typeof Replayer>[0], {
      root: target,
      skipInactive: true,
      mouseTail: false,
    });
    replayer.current = instance;
    setTotal(instance.getMetaData().totalTime);
    setElapsed(0);
    setPlaying(false);

    let recorded = ReplayUtils.recordedSize(events);
    const fit = (): void => {
      if (!recorded) return;
      const scale = Math.min(1, target.clientWidth / recorded.width);
      instance.wrapper.style.transform = `scale(${scale})`;
      instance.wrapper.style.transformOrigin = 'top left';
      target.style.height = `${recorded.height * scale}px`;
    };
    instance.on('resize', (size) => {
      const next = size as { width: number; height: number };
      recorded = { width: next.width, height: next.height };
      fit();
    });
    const observer = new ResizeObserver(fit);
    observer.observe(target);
    fit();

    const timer = setInterval(() => setElapsed(instance.getCurrentTime()), TICK_MS);
    instance.on('finish', () => setPlaying(false));
    return () => {
      clearInterval(timer);
      observer.disconnect();
      instance.destroy();
      replayer.current = null;
    };
  }, [events]);

  const toggle = (): void => {
    const instance = replayer.current;
    if (!instance) return;
    if (playing) {
      instance.pause();
      setPlaying(false);
      return;
    }
    instance.play(elapsed >= total ? 0 : elapsed);
    setPlaying(true);
  };

  const seek = (value: number): void => {
    const instance = replayer.current;
    if (!instance) return;
    setElapsed(value);
    if (playing) instance.play(value);
    else instance.pause(value);
  };

  return (
    <div className="space-y-3">
      <div className="overflow-auto rounded-lg border bg-muted/30 p-2">
        <div ref={container} className="w-full overflow-hidden" />
      </div>
      <div className="flex items-center gap-3">
        <Button size="icon" variant="outline" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
        <input
          type="range"
          min={0}
          max={total}
          value={Math.min(elapsed, total)}
          onChange={(event) => seek(Number(event.target.value))}
          className="flex-1"
          aria-label="Seek"
        />
        <span className="font-mono text-xs text-muted-foreground">
          {ReplayUtils.duration(elapsed)} / {ReplayUtils.duration(total)}
        </span>
      </div>
    </div>
  );
}
