import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function ThreeCanvas({ scrollOffset = 0 }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    //scene.fog = new THREE.FogExp2(0x090d16, 0.025);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 24;

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // 4. Create 3D Database Nodes Group
    const nodeGroup = new THREE.Group();
    scene.add(nodeGroup);

    // Main central glowing Database Core
    const coreGeo = new THREE.IcosahedronGeometry(3.5, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    nodeGroup.add(coreMesh);

    // Inner core mesh
    const innerGeo = new THREE.OctahedronGeometry(2, 0);
    const innerMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      emissive: 0x06b6d4,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      wireframe: true
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    nodeGroup.add(innerMesh);

    // Orbiting Data Cubes (Nodes)
    const nodeCount = 30;
    const nodes = [];
    const cubeGeo = new THREE.BoxGeometry(0.8, 0.8, 0.8);
    const cubeMat = new THREE.MeshStandardMaterial({
      color: 0x818cf8,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.3,
    });

    for (let i = 0; i < nodeCount; i++) {
      const mesh = new THREE.Mesh(cubeGeo, cubeMat);
      const radius = 8 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      mesh.position.x = radius * Math.sin(phi) * Math.cos(theta);
      mesh.position.y = radius * Math.sin(phi) * Math.sin(theta);
      mesh.position.z = radius * Math.cos(phi);

      mesh.userData = {
        speed: 0.002 + Math.random() * 0.005,
        radius: radius,
        angle: theta,
        rotSpeed: Math.random() * 0.02
      };

      nodeGroup.add(mesh);
      nodes.push(mesh);
    }

    // 5. Ambient Data Constellation Particles
    const particleCount = 400;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 60;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.12,
      color: 0x818cf8,
      transparent: true,
      opacity: 0.2,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // 6. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x6366f1, 2, 50);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    const pointLight2 = new THREE.PointLight(0x06b6d4, 2, 50);
    pointLight2.position.set(-10, -10, -10);
    scene.add(pointLight2);

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotate central core
      coreMesh.rotation.x += 0.003;
      coreMesh.rotation.y += 0.005;
      innerMesh.rotation.x -= 0.006;
      innerMesh.rotation.y -= 0.004;

      // Orbit nodes
      nodes.forEach((node) => {
        node.userData.angle += node.userData.speed;
        node.position.x = node.userData.radius * Math.cos(node.userData.angle);
        node.position.z = node.userData.radius * Math.sin(node.userData.angle);
        node.rotation.x += node.userData.rotSpeed;
        node.rotation.y += node.userData.rotSpeed;
      });

      particleSystem.rotation.y += 0.0005;

      // React to mouse movement
      nodeGroup.rotation.y += (mouseX * 0.5 - nodeGroup.rotation.y) * 0.05;
      nodeGroup.rotation.x += (-mouseY * 0.5 - nodeGroup.rotation.x) * 0.05;

      // React to scroll up / down (Dynamic Camera Zoom & Y Shift)
      const targetZ = 24 + (window.scrollY || 0) * 0.01;
      camera.position.z += (targetZ - camera.position.z) * 0.1;
      camera.position.y = -(window.scrollY || 0) * 0.008;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-30 transition-opacity duration-700"
    />
  );
}
