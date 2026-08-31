import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export function WebGLOrganicBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    const currentContainer = containerRef.current;
    currentContainer.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 100;

    const scene = new THREE.Scene();
    
    const particleCount = 800;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const forces = new Float32Array(particleCount);

    const baseColor = new THREE.Color(0x003f7a);
    const hoverColor = new THREE.Color(0x00e5ff);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * 400;
      const y = (Math.random() - 0.5) * 400;
      const z = (Math.random() - 0.5) * 400;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      originalPositions[i3] = x;
      originalPositions[i3 + 1] = y;
      originalPositions[i3 + 2] = z;

      colors[i3] = baseColor.r;
      colors[i3 + 1] = baseColor.g;
      colors[i3 + 2] = baseColor.b;

      velocities[i3] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      sizes[i] = Math.random() * 2.5 + 0.5;
      forces[i] = 0;
    }

    const posAttribute = new THREE.BufferAttribute(positions, 3);
    posAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', posAttribute);

    const colorAttribute = new THREE.BufferAttribute(colors, 3);
    colorAttribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('color', colorAttribute);

    const sizeAttribute = new THREE.BufferAttribute(sizes, 1);
    geometry.setAttribute('size', sizeAttribute);

    const vertexShader = `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      varying vec3 vColor;
      void main() {
        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
        float alpha = 1.0 - smoothstep(0.4, 0.5, distanceToCenter);
        if (alpha < 0.001) discard;
        gl_FragColor = vec4(vColor, alpha * 0.8);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    let targetX = 0;
    let targetY = 0;
    let mouseX = 0;
    let mouseY = 0;
    
    let windowHalfX = window.innerWidth / 2;
    let windowHalfY = window.innerHeight / 2;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX - windowHalfX) * 0.15;
      targetY = -(e.clientY - windowHalfY) * 0.15; 
    };
    window.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      windowHalfX = window.innerWidth / 2;
      windowHalfY = window.innerHeight / 2;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    
    const render = () => {
      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      const posAttr = geometry.getAttribute('position') as any;
      const colAttr = geometry.getAttribute('color') as any;
      
      const posArr = posAttr.array as Float32Array;
      const colArr = colAttr.array as Float32Array;
      
      const repelRadiusSq = 2500;
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        
        originalPositions[i3] += velocities[i3];
        originalPositions[i3 + 1] += velocities[i3 + 1];
        originalPositions[i3 + 2] += velocities[i3 + 2];

        if (originalPositions[i3] > 200) originalPositions[i3] = -200;
        if (originalPositions[i3] < -200) originalPositions[i3] = 200;
        if (originalPositions[i3 + 1] > 200) originalPositions[i3 + 1] = -200;
        if (originalPositions[i3 + 1] < -200) originalPositions[i3 + 1] = 200;
        if (originalPositions[i3 + 2] > 200) originalPositions[i3 + 2] = -200;
        if (originalPositions[i3 + 2] < -200) originalPositions[i3 + 2] = 200;

        const dx = originalPositions[i3] - mouseX;
        const dy = originalPositions[i3 + 1] - mouseY;
        const distSq = dx * dx + dy * dy;

        let targetForce = 0;
        if (distSq < repelRadiusSq) {
          targetForce = (repelRadiusSq - distSq) / repelRadiusSq;
        }

        forces[i] += (targetForce - forces[i]) * 0.08;
        
        const force = forces[i];

        posArr[i3] = originalPositions[i3] + (dx * force * 0.15);
        posArr[i3 + 1] = originalPositions[i3 + 1] + (dy * force * 0.15);
        posArr[i3 + 2] = originalPositions[i3 + 2];
        
        colArr[i3] = baseColor.r + (hoverColor.r - baseColor.r) * force;
        colArr[i3 + 1] = baseColor.g + (hoverColor.g - baseColor.g) * force;
        colArr[i3 + 2] = baseColor.b + (hoverColor.b - baseColor.b) * force;
      }
      
      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;

      particles.rotation.y += 0.001;
      particles.rotation.x += 0.0005;

      camera.position.x += (mouseX * 0.3 - camera.position.x) * 0.02;
      camera.position.y += (mouseY * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (currentContainer && renderer.domElement.parentNode === currentContainer) {
        currentContainer.removeChild(renderer.domElement);
      }
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 z-[0] pointer-events-none opacity-40" 
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}
