// Pick a thing up and turn it around: loads an .stl or .glb only when asked.
import { Scene, PerspectiveCamera, WebGLRenderer, HemisphereLight, DirectionalLight, Mesh, MeshStandardMaterial, Box3, Vector3, Color } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default async function model(host) {
  const src = host.dataset.model, type = host.dataset.modelType;
  const css = getComputedStyle(host), accent = css.getPropertyValue('--accent').trim() || '#C8A24B';
  const scene = new Scene();
  const cam = new PerspectiveCamera(35, 1, 0.01, 1000);
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  scene.add(new HemisphereLight(0xffffff, 0x554433, 1.5));
  const sun = new DirectionalLight(0xffffff, 2.2); sun.position.set(2, 3, 4); scene.add(sun);
  let obj;
  if (type === 'stl') {
    const { STLLoader } = await import('three/examples/jsm/loaders/STLLoader.js');
    const geo = await new STLLoader().loadAsync(src);
    geo.computeVertexNormals();
    obj = new Mesh(geo, new MeshStandardMaterial({ color: new Color(accent), roughness: 0.55, metalness: 0.05 }));
    obj.rotation.x = -Math.PI / 2;         // printers think Z is up
  } else {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    obj = (await new GLTFLoader().loadAsync(src)).scene;
  }
  scene.add(obj);
  const box = new Box3().setFromObject(obj), c = box.getCenter(new Vector3()), s = box.getSize(new Vector3()).length() || 1;
  obj.position.sub(c);
  cam.position.set(s * 0.9, s * 0.6, s * 1.2); cam.near = s / 100; cam.far = s * 20; cam.updateProjectionMatrix();
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'A 3D model you can turn around');
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.tabIndex = 0;
  const controls = new OrbitControls(cam, renderer.domElement);
  controls.enableDamping = true; controls.enablePan = false; controls.autoRotate = !matchMedia('(prefers-reduced-motion: reduce)').matches; controls.autoRotateSpeed = 1.2;
  controls.minDistance = s * 0.5; controls.maxDistance = s * 4;
  renderer.domElement.addEventListener('pointerdown', () => { controls.autoRotate = false; });
  renderer.domElement.addEventListener('keydown', e => { const k = { ArrowLeft: [0.2, 0], ArrowRight: [-0.2, 0], ArrowUp: [0, 0.15], ArrowDown: [0, -0.15] }[e.key]; if (k) { e.preventDefault(); controls.autoRotate = false; obj.rotation.y += k[0]; obj.rotation.x += k[1]; } });
  const fit = () => { const w = host.clientWidth, h = host.clientHeight; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  fit(); new ResizeObserver(fit).observe(host);
  let on = true;
  new IntersectionObserver(es => { on = es[0].isIntersecting; }).observe(host);
  renderer.setAnimationLoop(() => { if (!on) return; controls.update(); renderer.render(scene, cam); });
}
