"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import s from './ExperienceDecouverte.module.css';

export default function MagneticOrbit({ worlds, active, onSelect }) {
  const host = useRef(null), engine = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const [fallback, setFallback] = useState(false);
  const toggle = () => { setExpanded(value => { if (engine.current) engine.current.expanded = !value; return !value; }); };
  useEffect(() => { if (engine.current) engine.current.focus = active; }, [active]);
  useEffect(() => {
    let disposed = false, cleanup = () => {};
    import('three').then(THREE => {
      if (disposed) return;
      const container = host.current;
      let renderer;
      try { renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' }); }
      catch { setFallback(true); return; }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(42, 1, .1, 100);
      camera.position.z = 13;
      scene.add(new THREE.AmbientLight(0x8196ff, 2));
      const light = new THREE.PointLight(0xb1c4ff, 70); light.position.set(-3, 4, 5); scene.add(light);
      const core = new THREE.Mesh(new THREE.SphereGeometry(.64, 40, 32), new THREE.MeshPhysicalMaterial({ color: 0x76eee9, metalness: .55, roughness: .17, emissive: 0x293c9e, emissiveIntensity: .65, clearcoat: 1 }));
      scene.add(core);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(.83, .012, 8, 80), new THREE.MeshBasicMaterial({ color: 0xa6f6ef, transparent: true, opacity: .65 }));
      core.add(halo); halo.rotation.x = .7;
      const control = { expanded: false, focus: 0, rotation: new THREE.Quaternion(), angular: new THREE.Vector3(), center: new THREE.Vector3(), drag: null };
      engine.current = control;
      const textures = [], cards = [], loader = new THREE.TextureLoader();
      const material = new THREE.LineBasicMaterial({ color: 0x76eee9, transparent: true, opacity: .4 });
      const count = matchMedia('(max-width:760px)').matches ? 12 : 18;
      for (let i = 0; i < count; i++) {
        const phi = Math.acos(1 - 2 * (i + .5) / count), theta = i * 2.399963;
        const direction = new THREE.Vector3(Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
        const group = new THREE.Group();
        const frame = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.3, .06), new THREE.MeshStandardMaterial({ color: 0x17234b, roughness: .4, metalness: .5 })); group.add(frame);
        const faceMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        const face = new THREE.Mesh(new THREE.PlaneGeometry(.97, 1.22), faceMaterial); face.position.z = .04; group.add(face);
        const texture = loader.load(worlds[i % worlds.length][2], loaded => { if (disposed) { loaded.dispose(); return; } loaded.colorSpace = THREE.SRGBColorSpace; faceMaterial.map = loaded; faceMaterial.needsUpdate = true; }); textures.push(texture);
        group.userData.index = i % worlds.length; scene.add(group);
        const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(25 * 3), 3));
        const line = new THREE.Line(geometry, material); scene.add(line);
        const position = direction.clone().multiplyScalar(2.4);
        cards.push({ group, direction, position, velocity: new THREE.Vector3(), line, phase: i * 1.7, radius: 3.5 + (i % 4) * .16 });
      }
      const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
      const hit = event => { const r = renderer.domElement.getBoundingClientRect(); pointer.set((event.clientX-r.left)/r.width*2-1, -(event.clientY-r.top)/r.height*2+1); raycaster.setFromCamera(pointer,camera); return raycaster.intersectObjects([core,...cards.map(c=>c.group)],true)[0]; };
      const down = event => { const target=hit(event); control.drag={x:event.clientX,y:event.clientY,startX:event.clientX,startY:event.clientY,moved:false,translate:event.shiftKey||event.button===2,roll:event.altKey,hit:target?.object}; control.angular.set(0,0,0); renderer.domElement.setPointerCapture(event.pointerId); };
      const move = event => { const d=control.drag;if(!d)return;const dx=event.clientX-d.x,dy=event.clientY-d.y;d.moved ||= Math.hypot(event.clientX-d.startX,event.clientY-d.startY)>5;if(d.translate){control.center.x=THREE.MathUtils.clamp(control.center.x+dx*.009,-1.1,1.1);control.center.y=THREE.MathUtils.clamp(control.center.y-dy*.009,-.8,.8);}else{control.angular.set(d.roll?0:dy*.006,d.roll?0:dx*.006,d.roll?dx*.006:0);const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(control.angular.x,control.angular.y,control.angular.z));control.rotation.premultiply(q);}d.x=event.clientX;d.y=event.clientY; };
      const up = event => { const d=control.drag;control.drag=null;if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);if(!d||d.moved)return;if(d.hit===core||d.hit===halo){control.expanded=!control.expanded;setExpanded(control.expanded);cards.forEach(c=>c.velocity.addScaledVector(c.direction.clone().applyQuaternion(control.rotation),control.expanded?1.8:-.5));}else{let obj=d.hit;while(obj&&obj.userData.index===undefined)obj=obj.parent;if(obj?.userData.index!==undefined)onSelect(obj.userData.index);} };
      const cancel = () => { control.drag=null; };
      const context = e => e.preventDefault();
      const canvas=renderer.domElement;canvas.addEventListener('pointerdown',down);canvas.addEventListener('pointermove',move);canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('contextmenu',context);
      const resize=new ResizeObserver(()=>{const w=container.clientWidth,h=container.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.position.z=camera.aspect<1?17:13;camera.updateProjectionMatrix();});resize.observe(container);
      let visible=true,frame,last=0;const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)start();});observer.observe(container);
      const preference=matchMedia('(prefers-reduced-motion: reduce)');
      const target=new THREE.Vector3(),delta=new THREE.Vector3(),startPoint=new THREE.Vector3(),endPoint=new THREE.Vector3(),bend=new THREE.Vector3(),point=new THREE.Vector3();
      const tick=time=>{frame=null;if(disposed||!visible||document.hidden)return;const dt=Math.min((time-last)/1000||1/60,1/30);last=time;
        if(!control.drag&&!preference.matches){control.angular.multiplyScalar(Math.exp(-3*dt));const q=new THREE.Quaternion().setFromEuler(new THREE.Euler(control.angular.x*dt*60,control.angular.y*dt*60,control.angular.z*dt*60));control.rotation.premultiply(q).normalize();}
        core.position.copy(control.center);core.quaternion.copy(control.rotation);
        cards.forEach((c,i)=>{target.copy(c.direction).applyQuaternion(control.rotation).multiplyScalar(control.expanded?c.radius:2.4).add(control.center);if(preference.matches){c.position.copy(target);c.velocity.set(0,0,0);}else{delta.copy(target).sub(c.position);c.velocity.addScaledVector(delta,(30+i%3*3)*dt).multiplyScalar(Math.exp(-7.5*dt));c.position.addScaledVector(c.velocity,dt);}
          c.group.position.copy(c.position);c.group.quaternion.copy(control.rotation);c.group.rotateZ(Math.sin(c.phase)*.12);c.group.scale.setScalar(c.group.userData.index===control.focus?1.1:1);
          // Attach the filament to the sphere surface and the inner edge of the frame.
          delta.copy(c.position).sub(control.center);startPoint.copy(delta).normalize().multiplyScalar(.64).add(control.center);endPoint.copy(c.position).addScaledVector(delta.clone().normalize(),-.48);bend.copy(startPoint).lerp(endPoint,.5);bend.y-=.16+Math.min(c.velocity.length()*.09,.45);bend.x+=Math.sin(time*.002+c.phase)*Math.min(c.velocity.length()*.04,.12);
          const attr=c.line.geometry.attributes.position;for(let j=0;j<=24;j++){const t=j/24;point.copy(startPoint).multiplyScalar((1-t)**2).addScaledVector(bend,2*(1-t)*t).addScaledVector(endPoint,t*t);attr.setXYZ(j,point.x,point.y,point.z);}attr.needsUpdate=true;c.line.geometry.computeBoundingSphere();
        });renderer.render(scene,camera);frame=requestAnimationFrame(tick);
      };
      function start(){if(!frame&&!document.hidden&&visible){last=performance.now();frame=requestAnimationFrame(tick);}}
      const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=null;}else start();};document.addEventListener('visibilitychange',visibility);start();
      const lost=e=>{e.preventDefault();setFallback(true);cancelAnimationFrame(frame);};canvas.addEventListener('webglcontextlost',lost);
      cleanup=()=>{cancelAnimationFrame(frame);observer.disconnect();resize.disconnect();document.removeEventListener('visibilitychange',visibility);canvas.removeEventListener('pointerdown',down);canvas.removeEventListener('pointermove',move);canvas.removeEventListener('pointerup',up);canvas.removeEventListener('pointercancel',cancel);canvas.removeEventListener('contextmenu',context);canvas.removeEventListener('webglcontextlost',lost);scene.traverse(obj=>{obj.geometry?.dispose();if(obj.material&&obj.material!==material)obj.material.dispose();});material.dispose();textures.forEach(t=>t.dispose());renderer.dispose();canvas.remove();engine.current=null;};
    }).catch(()=>setFallback(true));
    return()=>{disposed=true;cleanup();};
  // World data and selection callback belong to the parent scene lifecycle.
  }, [worlds, onSelect]);
  return <><div className={s.magneticStage}><div ref={host} className={s.magneticCanvas} role="img" aria-label="Composition 3D magnétique : glissez pour tourner, cliquez le noyau pour disperser ou rappeler les cartes."/>{fallback&&<div className={s.magneticFallback}>{worlds.map((w,i)=><button key={w[0]} onClick={()=>onSelect(i)}>{w[0]}</button>)}</div>}<div className={s.magneticToolbar}><button onClick={toggle} aria-pressed={expanded}>{expanded?'Rappeler les cartes':'Déployer les univers'} <span>{expanded?'−':'+'}</span></button><button onClick={()=>{if(engine.current){engine.current.rotation.identity();engine.current.angular.set(0,0,0);engine.current.center.set(0,0,0);}}}>Recentrer ↺</button></div><p className={s.magneticHelp}>Glisser : rotation 360° · Maj + glisser : déplacer · Alt + glisser : axe Z<br/>Au tactile : glissez pour tourner · Touchez le noyau pour déployer</p></div><div className={s.selection} key={active}><span>FRÉQUENCE {String(active+1).padStart(2,'0')}</span><h3>{worlds[active][0]}</h3><p>{worlds[active][1]}</p><Link href={`/recherche?q=${encodeURIComponent(worlds[active][0])}`}>Explorer cet univers ↗</Link></div></>;
}
