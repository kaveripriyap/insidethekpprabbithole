// The walls of the hole: one small WebGL shader. Wobbling contour rings in
// gold leaf, a dream colour that drifts as the years go by, a little grain.
// If WebGL is missing the CSS background (plain deep green) simply shows.
const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uTime,uDepth,uVel,uOpen;uniform vec2 uPtr;uniform vec3 uA,uB,uGilt,uDeep;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*uRes)/min(uRes.x,uRes.y);
  p-=uPtr*.05;
  float a=atan(p.y,p.x),r=length(p);
  float z0=.55/max(r,.0005)+uDepth;
  float wob=.11*sin(a*2.+z0*.33)+.05*sin(a*5.-z0*.57+1.7)+.025*sin(a*9.+z0*1.1);
  float rr=r*(1.+wob);
  float z=.55/max(rr,.0005)+uDepth;
  float fog=smoothstep(.02,.62,rr);
  float f=abs(fract(z*.42)-.5);
  float w=min(.2,.0011/(rr*rr));
  float ring=smoothstep(w,w*.35,f)*smoothstep(.03,.2,rr);
  float fine=smoothstep(.985,1.,sin(a*46.+sin(z*.9)*1.4))*.5;
  float n=noise(vec2(cos(a)*1.3+z*.07,sin(a)*1.3+z*.31));
  vec3 wall=mix(uA,uB,smoothstep(.25,.8,n));
  vec3 col=mix(uDeep,wall,fog*fog*.42);
  col+=uGilt*ring*(.1+.5*fog);
  col+=uGilt*fine*fog*fog*.07;
  col+=uGilt*uVel*smoothstep(.96,1.,sin(a*70.+z*.15))*fog*.16;
  col*=.86+.14*smoothstep(1.1,.2,r);
  col+=(hash(gl_FragCoord.xy+fract(uTime)*91.)-.5)*.028;
  gl_FragColor=vec4(col,1.);
}`;
const hex = h => { const s = h.trim().replace('#', ''); return [0, 2, 4].map(i => parseInt(s.slice(i, i + 2), 16) / 255); };
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

export function startTunnel(canvas) {
  if (!canvas) return null;
  let gl;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' }); } catch { gl = null; }
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
  const vs = sh(gl.VERTEX_SHADER, VERT), fs = sh(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram(); gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const U = {}; for (const n of ['uRes', 'uTime', 'uDepth', 'uVel', 'uOpen', 'uPtr', 'uA', 'uB', 'uGilt', 'uDeep']) U[n] = gl.getUniformLocation(prog, n);
  const css = getComputedStyle(document.documentElement), v = n => hex(css.getPropertyValue(n));
  const pal = [v('--d-dawn'), v('--d-sea'), v('--d-plum'), v('--d-candle')];
  gl.uniform3fv(U.uGilt, v('--c-gilt')); gl.uniform3fv(U.uDeep, v('--c-burrow'));
  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, innerWidth < 860 ? 1 : 1.5);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h); }
    gl.uniform2f(U.uRes, w, h);
  }
  resize();
  return {
    resize,
    draw({ time, depth, vel, px, py, colour, open }) {
      const i = Math.floor(colour), f = colour - i, n = pal.length;
      gl.uniform3fv(U.uA, mix(pal[i % n], pal[(i + 1) % n], f));
      gl.uniform3fv(U.uB, mix(pal[(i + 1) % n], pal[(i + 2) % n], f));
      gl.uniform1f(U.uTime, time % 1000); gl.uniform1f(U.uDepth, depth % 4000); gl.uniform1f(U.uVel, vel); gl.uniform1f(U.uOpen, open);
      gl.uniform2f(U.uPtr, px, -py);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
  };
}
