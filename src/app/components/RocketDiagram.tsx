import { useRef, useEffect } from "react";
import { DS } from "./shared";
import { getAgencyColor } from "../../services/formatters";
import type { APILaunch } from "../../services/types";

interface RocketSpec {
  name: string;
  height: number;
  diameter: number;
  stages: number;
  color: string;
}

function getRocketSpec(launch: APILaunch): RocketSpec {
  const config = launch.rocket.configuration;
  return {
    name: config.full_name || config.name,
    height: config.length ?? 0,
    diameter: config.diameter ?? 0,
    stages: config.max_stage ?? 1,
    color: getAgencyColor(launch.launch_service_provider.name),
  };
}

export function RocketDiagram({ launches }: { launches: APILaunch[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const specs = launches.map(getRocketSpec).filter((s) => s.height > 0);
  const maxHeight = Math.max(...specs.map((s) => s.height), 1);
  const [, setResizeTick] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let animationId = 0;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const padding = { top: 40, bottom: 60, left: 20, right: 20 };
      const drawHeight = h - padding.top - padding.bottom;

      ctx.clearRect(0, 0, w, h);

      if (specs.length === 0) {
        ctx.fillStyle = DS.textMuted;
        ctx.font = "11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("Spec data unavailable", w / 2, h / 2);
        return;
      }

      const rocketSpacing = w / (specs.length + 1);
      const maxRocketWidth = Math.min(rocketSpacing * 0.4, 80);

      specs.forEach((spec, i) => {
        const cx = rocketSpacing * (i + 1);
        const scaleY = drawHeight / maxHeight;
        const rocketPixelHeight = spec.height * scaleY;
        const bodyY = h - padding.bottom - rocketPixelHeight;

        const baseWidth = spec.diameter > 0
          ? Math.max((spec.diameter / 10), 6)
          : maxRocketWidth / 3;
        const stageWidth = Math.min(baseWidth, maxRocketWidth);
        const stageHeight = rocketPixelHeight / spec.stages;

        for (let s = 0; s < spec.stages; s++) {
          const stageY = bodyY + s * stageHeight;
          const stageW = stageWidth * (1 - s * 0.06);

          const gradient = ctx.createLinearGradient(cx - stageW / 2, stageY, cx + stageW / 2, stageY);
          gradient.addColorStop(0, spec.color + "40");
          gradient.addColorStop(0.5, spec.color + "80");
          gradient.addColorStop(1, spec.color + "40");

          ctx.fillStyle = gradient;
          ctx.strokeStyle = spec.color + "cc";
          ctx.lineWidth = 1;

          ctx.beginPath();
          const radius = 4 * (1 - s * 0.1);
          const x = cx - stageW / 2;
          const y = stageY;
          const w2 = stageW;
          const h2 = stageHeight;

          ctx.moveTo(x + radius, y);
          ctx.lineTo(x + w2 - radius, y);
          ctx.arcTo(x + w2, y, x + w2, y + radius, radius);
          ctx.lineTo(x + w2, y + h2 - radius);
          ctx.arcTo(x + w2, y + h2, x + w2 - radius, y + h2, radius);
          ctx.lineTo(x + radius, y + h2);
          ctx.arcTo(x, y + h2, x, y + h2 - radius, radius);
          ctx.lineTo(x, y + radius);
          ctx.arcTo(x, y, x + radius, y, radius);
          ctx.closePath();

          ctx.fill();
          ctx.stroke();
        }

        ctx.fillStyle = spec.color;
        ctx.font = "10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(spec.name, cx, h - padding.bottom + 18);

        ctx.fillStyle = DS.textMuted;
        ctx.font = "9px Inter, sans-serif";
        ctx.fillText(`${spec.height}m`, cx, h - padding.bottom + 34);

        // Height indicator line
        ctx.strokeStyle = spec.color + "40";
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, bodyY);
        ctx.lineTo(cx, h - padding.bottom - rocketPixelHeight);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Ground line
      const groundY = h - padding.bottom;
      ctx.strokeStyle = DS.textMuted;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, groundY);
      ctx.lineTo(w - padding.right, groundY);
      ctx.stroke();
    };

    draw();

    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(animationId);
      animationId = requestAnimationFrame(draw);
    });
    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animationId);
      observer.disconnect();
    };
  }, [specs, maxHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ height: `${Math.max(specs.length * 80, 300)}px`, background: DS.cardGradient }}
    />
  );
}
