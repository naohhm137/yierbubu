import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

/** Local typography avoids remote font/worker requests during a game. */
export function PrintedFace({ title, text = '', color = '#ede4d2', width, height }: {
  title: string; text?: string; color?: string; width: number; height: number;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = Math.round(512 * height / width);
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = color; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ad9677'; ctx.lineWidth = 3;
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    ctx.fillStyle = '#493b31'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '600 42px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(title, 256, canvas.height * (text ? .22 : .5), 440);
    if (text) {
      ctx.font = '26px "PingFang SC", "Microsoft YaHei", sans-serif';
      const lines: string[] = []; let line = '';
      for (const char of text) {
        if (ctx.measureText(line + char).width > 420) { lines.push(line); line = ''; }
        line += char;
      }
      if (line) lines.push(line);
      lines.slice(0, 9).forEach((value, i) => ctx.fillText(value, 256, canvas.height * .45 + i * 38));
    }
    const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [title, text, color, width, height]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh><planeGeometry args={[width, height]} /><meshStandardMaterial map={texture} roughness={.8} /></mesh>;
}
