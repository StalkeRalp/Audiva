"use client";

import Image from "next/image";
import { PochetteImage } from "@/composants/ui/PochetteImage";
import { useEffect, useRef } from "react";
import { DEFAULT_PLASMA_PALETTE, extractPlasmaPalette } from "@/domaines/lecteur/utilitaires/plasmaPalette";
import styles from "./PlasmaBackground.module.css";

const paletteCache = new Map();
const APPLE_PLASMA_PALETTE = [
  [0.38, 0.66, 0.9], [0.62, 0.56, 0.86], [0.48, 0.78, 0.78], [0.92, 0.62, 0.72],
];
const VERTEX = `
attribute vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;
const FRAGMENT = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform vec3 u_colors[4];
uniform float u_light;
float hash(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 s = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), s.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0)), s.x), s.y);
}
float silk(vec2 p) {
  float value = 0.0, amplitude = 0.5;
  mat2 turn = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = turn * p * 2.03 + 7.1;
    amplitude *= 0.5;
  }
  return value;
}
void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 p = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  p += u_pointer * 0.06;
  float t = u_time * 0.075;
  // Deux champs entrelacés déforment le fluide sans boucle visible ni formes rigides.
  vec2 flow = vec2(silk(p * 0.85 + vec2(t, -t * 0.63)),
                   silk(p * 0.85 + vec2(-t * 0.72, t * 0.54) + 12.4));
  vec2 fold = vec2(silk(p * 0.95 + flow * 1.8 + vec2(t * 0.36, t * 0.45)),
                   silk(p * 0.95 + flow * 1.6 + vec2(-t * 0.42, t * 0.28) + 8.3));
  vec2 liquid = p + (flow - 0.5) * 1.7 + (fold - 0.5) * 1.1;
  float basin = 0.5 + 0.5 * sin(liquid.x * 2.7 + liquid.y * 2.2 + t * 0.6);
  float bloom = 0.5 + 0.5 * cos(liquid.y * 3.1 - liquid.x * 1.8 - t * 0.45);
  vec3 color = mix(u_colors[0], u_colors[1], smoothstep(0.12, 0.88, basin));
  color = mix(color, u_colors[2], smoothstep(0.35, 0.95, bloom) * 0.85);
  // Une veine nacrée, large et discrète : la signature du plasma Audiva.
  float ribbon = pow(max(0.0, 1.0 - abs(basin - bloom) * 2.0), 3.0);
  color = mix(color, u_colors[3], ribbon * 0.48);
  color *= 0.7 + bloom * 0.3;
  float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
  color *= mix(min(1.0, 0.34 / max(luminance, 0.001)), min(1.35, 0.78 / max(luminance, 0.001)), u_light);
  color = mix(color, vec3(0.94, 0.95, 0.98), u_light * 0.12);
  float grain = (hash(gl_FragCoord.xy) - 0.5) / 255.0;
  gl_FragColor = vec4(color + grain, 1.0);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { gl.deleteShader(shader); return null; }
  return shader;
}

export function PlasmaBackground({ cover, style = "auto" }) {
  const canvasRef = useRef(null);
  const paletteRef = useRef(DEFAULT_PLASMA_PALETTE.map((color) => [...color]));
  const refreshRef = useRef(null);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    const applyPalette = (palette) => {
      if (!active) return;
      paletteRef.current = document.documentElement.dataset.theme === "apple" ? APPLE_PLASMA_PALETTE : palette;
      canvas.dataset.palette = "ready";
      refreshRef.current?.();
    };
    if (paletteCache.has(cover)) { applyPalette(paletteCache.get(cover)); return; }
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    const fallback = () => { if (active) delete canvas.dataset.palette; };
    const timeout = window.setTimeout(fallback, 8000);
    image.onload = () => {
      window.clearTimeout(timeout);
      if (!active) return;
      try {
        const sample = document.createElement("canvas");
        sample.width = 48;
        sample.height = 48;
        const context = sample.getContext("2d", { willReadFrequently: true });
        if (!context) { fallback(); return; }
        context.drawImage(image, 0, 0, 48, 48);
        const palette = extractPlasmaPalette(context.getImageData(0, 0, 48, 48).data);
        if (paletteCache.size >= 24) paletteCache.delete(paletteCache.keys().next().value);
        paletteCache.set(cover, palette);
        applyPalette(palette);
      } catch {
        fallback();
        // Certaines pochettes distantes interdisent l’analyse CORS : leur image
        // reste animée en dessous du plasma pour conserver leurs vraies couleurs.
      }
    };
    image.onerror = () => { window.clearTimeout(timeout); fallback(); };
    image.src = cover;
    return () => { active = false; window.clearTimeout(timeout); image.onload = null; image.onerror = null; };
  }, [cover]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power", preserveDrawingBuffer: false });
    if (!gl) return;
    const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    if (!vertex || !fragment) { if (vertex) gl.deleteShader(vertex); if (fragment) gl.deleteShader(fragment); return; }
    const program = gl.createProgram();
    if (!program) { gl.deleteShader(vertex); gl.deleteShader(fragment); return; }
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) { gl.deleteProgram(program); return; }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    const uniforms = Object.fromEntries(["resolution", "time", "pointer", "light"].map((name) => [name, gl.getUniformLocation(program, `u_${name}`)]));
    const colors = gl.getUniformLocation(program, "u_colors[0]");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const current = paletteRef.current.map((color) => [...color]);
    const pointer = [0, 0];
    const targetPointer = [0, 0];
    const colorBuffer = new Float32Array(12);
    let frame = 0, previous = 0, time = 0, stopped = false;
    const draw = (timestamp, force = false) => {
      if (stopped || document.hidden) return;
      const delta = Math.min((timestamp - previous) / 1000, 0.1);
      if (force || timestamp - previous >= (window.innerWidth < 768 ? 42 : 33)) {
        previous = timestamp;
        time += delta;
        const blend = reduced.matches ? 1 : 1 - Math.exp(-delta / 1.4);
        current.forEach((color, index) => color.forEach((value, channel) => {
          color[channel] = value + (paletteRef.current[index][channel] - value) * blend;
          colorBuffer[index * 3 + channel] = color[channel];
        }));
        pointer.forEach((value, index) => { pointer[index] = value + (targetPointer[index] - value) * 0.035; });
        gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
        gl.uniform1f(uniforms.time, time);
        gl.uniform1f(uniforms.light, document.documentElement.dataset.theme === "apple" ? 1 : 0);
        gl.uniform2f(uniforms.pointer, pointer[0], pointer[1]);
        gl.uniform3fv(colors, colorBuffer);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        canvas.dataset.rendered = "true";
      }
      if (!reduced.matches) frame = requestAnimationFrame(draw);
    };
    const restart = () => { cancelAnimationFrame(frame); previous = performance.now(); draw(previous, true); };
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = Math.min(0.7, 800 / Math.max(rect.width, 1), 650 / Math.max(rect.height, 1));
      canvas.width = Math.max(1, Math.round(rect.width * scale));
      canvas.height = Math.max(1, Math.round(rect.height * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      restart();
    };
    const pointerMove = (event) => {
      if (reduced.matches || event.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      targetPointer[0] = (event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5;
      targetPointer[1] = (event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5;
    };
    const pointerLeave = () => { targetPointer[0] = 0; targetPointer[1] = 0; };
    const contextLost = (event) => { event.preventDefault(); stopped = true; cancelAnimationFrame(frame); delete canvas.dataset.rendered; };
    const syncTheme = (event) => {
      const apple = event.detail?.theme === "apple" || document.documentElement.dataset.theme === "apple";
      paletteRef.current = apple ? APPLE_PLASMA_PALETTE : (paletteCache.get(cover) || DEFAULT_PLASMA_PALETTE);
      refreshRef.current?.();
    };
    const parent = canvas.closest("main");
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    parent?.addEventListener("pointermove", pointerMove, { passive: true });
    parent?.addEventListener("pointerleave", pointerLeave);
    document.addEventListener("visibilitychange", restart);
    reduced.addEventListener("change", restart);
    canvas.addEventListener("webglcontextlost", contextLost);
    window.addEventListener("audiva-theme-change", syncTheme);
    syncTheme({ detail: { theme: document.documentElement.dataset.theme } });
    refreshRef.current = restart;
    resize();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      parent?.removeEventListener("pointermove", pointerMove);
      parent?.removeEventListener("pointerleave", pointerLeave);
      document.removeEventListener("visibilitychange", restart);
      reduced.removeEventListener("change", restart);
      canvas.removeEventListener("webglcontextlost", contextLost);
      window.removeEventListener("audiva-theme-change", syncTheme);
      refreshRef.current = null;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, []);

  return <div className={`${styles.plasma} now-playing__plasma plasma-style-${style}`} aria-hidden="true">
    <div className={`${styles.artwork} plasma-artwork`} key={cover}><PochetteImage unoptimized src={cover} alt="" fill sizes="100vw" /></div>
    <canvas ref={canvasRef} className={`${styles.canvas} plasma-canvas`} />
    <div className={styles.shade} />
  </div>;
}
