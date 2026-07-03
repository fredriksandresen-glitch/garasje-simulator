import React from "react";
import { Canvas } from "@react-three/fiber";
import { Edges, OrbitControls } from "@react-three/drei";

export default function Container3DView({ container, load, result, spacing }) {
  const maxDim = Math.max(container.usableLength, container.usableWidth, container.usableHeight);
  const cameraPosition = [container.usableWidth * 1.65, Math.max(container.usableHeight * 2.1, maxDim * 0.72), container.usableLength * 1.35];
  const sceneKey = `${container.usableLength}-${container.usableHeight}-${load.packKey}-${result.selectedOrientation}`;

  return (
    <Canvas key={sceneKey} dpr={[1, 1.75]} camera={{ position: cameraPosition, fov: 42, near: 0.05, far: 100 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#b9f5ed", "#15262c", 1.15]} />
      <directionalLight position={[4, 7, 5]} intensity={2.2} castShadow />
      <ContainerMesh container={container} />
      {result.compatible && <CargoGrid load={load} result={result} spacing={spacing} />}
      <OrbitControls makeDefault target={[0, container.usableHeight * 0.34, 0]} enableDamping dampingFactor={0.08} minDistance={maxDim * 0.7} maxDistance={maxDim * 4.5} maxPolarAngle={Math.PI * 0.49} />
    </Canvas>
  );
}

function ContainerMesh({ container }) {
  const { usableWidth: width, usableHeight: height, usableLength: length } = container;
  const post = Math.min(0.055, width * 0.024);

  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[width, height, length]} />
        <meshPhysicalMaterial color="#3a9aa0" transparent opacity={0.085} roughness={0.18} metalness={0.05} depthWrite={false} side={2} />
        <Edges scale={1.001} threshold={15} color="#64e1d2" />
      </mesh>
      <mesh position={[0, -0.018, 0]} receiveShadow>
        <boxGeometry args={[width, 0.036, length]} />
        <meshStandardMaterial color="#21494d" transparent opacity={0.72} roughness={0.72} metalness={0.15} />
        <Edges color="#4bbeb7" />
      </mesh>
      {[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([xSide, zSide]) => (
        <mesh key={`${xSide}-${zSide}`} position={[xSide * (width / 2 - post / 2), height / 2, zSide * (length / 2 - post / 2)]}>
          <boxGeometry args={[post, height, post]} />
          <meshStandardMaterial color="#3fc6b5" metalness={0.62} roughness={0.3} />
        </mesh>
      ))}
      {[-0.25, 0, 0.25].map((fraction) => (
        <mesh key={fraction} position={[fraction * width, height / 2, length / 2 + 0.008]}>
          <boxGeometry args={[post * 0.28, height * 0.94, post * 0.22]} />
          <meshStandardMaterial color="#72e6d8" transparent opacity={0.72} metalness={0.45} />
        </mesh>
      ))}
      {(container.roofIntrusions || []).map((intrusion, index) => {
        const intrusionWidth = Math.min(intrusion.width, width);
        const offset = intrusion.offsetFromWall || 0;
        const sideDirection = intrusion.side === "left" ? -1 : 1;
        const x = sideDirection * (width / 2 - offset - intrusionWidth / 2);
        const y = height - intrusion.drop / 2;

        return (
          <mesh key={`${intrusion.side}-${index}`} position={[x, y, 0]} castShadow>
            <boxGeometry args={[intrusionWidth, intrusion.drop, length]} />
            <meshStandardMaterial color="#d79a45" transparent opacity={0.82} metalness={0.58} roughness={0.3} />
            <Edges scale={1.002} color="#ffd58a" />
          </mesh>
        );
      })}
      <gridHelper args={[Math.max(width, length) * 1.7, 18, "#23474c", "#183239"]} position={[0, -0.045, 0]} />
    </group>
  );
}

function CargoGrid({ load, result, spacing }) {
  const meshes = [];
  for (let row = 0; row < result.rows; row += 1) {
    for (let col = 0; col < result.cols; col += 1) {
      const x = -result.usedWidth / 2 + result.itemWidth / 2 + col * (result.itemWidth + spacing);
      const z = -result.usedLength / 2 + result.itemLength / 2 + row * (result.itemLength + spacing);
      meshes.push(<CargoMesh key={`${row}-${col}`} load={load} result={result} position={[x, result.usedHeight / 2, z]} />);
    }
  }
  return <group>{meshes}</group>;
}

function CargoMesh({ load, result, position }) {
  if (load.packKey === "drum") {
    const radius = load.size.width / 2;
    const ringRadius = radius * 1.015;
    return (
      <group position={position}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, load.size.height, 32]} />
          <meshStandardMaterial color="#42c9a2" metalness={0.48} roughness={0.34} />
        </mesh>
        {[-load.size.height * 0.47, 0, load.size.height * 0.47].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[ringRadius, Math.max(0.009, radius * 0.035), 8, 32]} />
            <meshStandardMaterial color="#a6f1dc" metalness={0.7} roughness={0.24} />
          </mesh>
        ))}
      </group>
    );
  }

  const color = load.packKey === "kokille" ? "#e6a33b" : "#4f83bd";
  const edgeColor = load.packKey === "kokille" ? "#ffd17a" : "#a5d4ff";
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={[result.itemWidth, result.itemHeight, result.itemLength]} />
      <meshStandardMaterial color={color} metalness={0.34} roughness={0.46} />
      <Edges scale={1.002} color={edgeColor} />
    </mesh>
  );
}
