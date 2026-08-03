import React from "react";
import { Canvas } from "@react-three/fiber";
import { Edges, Line, OrbitControls } from "@react-three/drei";

export default function Container3DView({ container, load, result, spacing }) {
  const maxDim = Math.max(container.usableLength, container.usableWidth, container.usableHeight);
  const cameraPosition = [container.usableWidth * 1.65, Math.max(container.usableHeight * 2.1, maxDim * 0.72), container.usableLength * 1.35];
  const sceneKey = `${container.usableLength}-${container.usableHeight}-${load.packKey}-${result.selectedOrientation}`;

  return (
    <Canvas key={sceneKey} dpr={[1, 1.75]} camera={{ position: cameraPosition, fov: 42, near: 0.05, far: 100 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}>
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#b9f5ed", "#15262c", 1.15]} />
      <directionalLight position={[4, 7, 5]} intensity={2.2} castShadow />
      <ContainerMesh container={container} />
      {result.compatible && <CargoGrid load={load} result={result} spacing={spacing} />}
      {result.compatible && <ClearanceGuides container={container} result={result} />}
      {result.compatible && <OpeningComparison container={container} result={result} />}
      <OrbitControls makeDefault target={[0, container.usableHeight * 0.34, 0]} enableDamping dampingFactor={0.08} minDistance={maxDim * 0.7} maxDistance={maxDim * 4.5} maxPolarAngle={Math.PI * 0.49} />
    </Canvas>
  );
}

function ClearanceGuides({ container, result }) {
  const widthStart = result.usedWidth / 2;
  const widthEnd = container.usableWidth / 2;
  const lengthStart = result.usedLength / 2;
  const lengthEnd = container.usableLength / 2;
  const guideY = Math.min(container.usableHeight - 0.04, result.usedHeight + 0.12);

  return (
    <group>
      <MeasureLine
        start={[widthStart, guideY, -result.usedLength / 2]}
        end={[widthEnd, guideY, -result.usedLength / 2]}
      />
      <MeasureLine
        start={[-result.usedWidth / 2, 0.08, lengthStart]}
        end={[-result.usedWidth / 2, 0.08, lengthEnd]}
      />
      <MeasureLine
        start={[Math.min(widthEnd - 0.05, result.usedWidth / 2 + 0.08), result.usedHeight, result.usedLength / 2]}
        end={[Math.min(widthEnd - 0.05, result.usedWidth / 2 + 0.08), container.usableHeight, result.usedLength / 2]}
      />
    </group>
  );
}

function OpeningComparison({ container, result }) {
  const { usableWidth: width, usableHeight: height, usableLength: length } = container;
  const top = result.topAccess;
  const front = result.frontAccess;

  return (
    <group>
      {top.complete && <group>
        <RectangleLine width={container.topOpeningWidth} height={container.topOpeningLength} position={[0, height + 0.035, 0]} rotation={[Math.PI / 2, 0, 0]} color="#f6b84a" />
        <RectangleLine width={result.itemWidth} height={result.itemLength} position={[0, height + 0.055, 0]} rotation={[Math.PI / 2, 0, 0]} color={top.compatible ? "#69d4ff" : "#ff725f"} />
      </group>}
      {front.complete && <group>
        <RectangleLine width={container.doorOpeningWidth} height={container.doorOpeningHeight} position={[0, container.doorOpeningHeight / 2, length / 2 + 0.035]} color="#f6b84a" />
        <RectangleLine width={result.itemWidth} height={result.usedHeight} position={[0, result.usedHeight / 2, length / 2 + 0.055]} color={front.compatible ? "#69d4ff" : "#ff725f"} />
      </group>}
    </group>
  );
}

function RectangleLine({ width, height, position, rotation = [0, 0, 0], color }) {
  const points = [
    [-width / 2, -height / 2, 0],
    [width / 2, -height / 2, 0],
    [width / 2, height / 2, 0],
    [-width / 2, height / 2, 0],
    [-width / 2, -height / 2, 0]
  ];
  return <Line points={points} position={position} rotation={rotation} color={color} lineWidth={2.2} />;
}

function MeasureLine({ start, end }) {
  return <Line points={[start, end]} color="#e8f0a2" lineWidth={1.5} />;
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
      {container.hardTop && <HardTopEndFrames container={container} width={width} height={height} length={length} />}
      {(container.roofIntrusions || []).map((intrusion, index) => (
        <HardTopSideProfile key={`${intrusion.side}-${index}`} intrusion={intrusion} width={width} height={height} length={length} />
      ))}
      <gridHelper args={[Math.max(width, length) * 1.7, 18, "#23474c", "#183239"]} position={[0, -0.045, 0]} />
    </group>
  );
}

function HardTopEndFrames({ container, width, height, length }) {
  const openingLength = container.topOpeningLength || Math.max(0, length - 0.12);
  const endInset = Math.max(0.045, (length - openingLength) / 2);
  const railDepth = Math.min(0.08, endInset);
  const railHeight = 0.07;

  return (
    <group>
      {[-1, 1].map((zSide) => (
        <mesh key={zSide} position={[0, height - railHeight / 2, zSide * (length / 2 - railDepth / 2)]} castShadow>
          <boxGeometry args={[width, railHeight, railDepth]} />
          <meshStandardMaterial color="#cf8b3d" transparent opacity={0.86} metalness={0.58} roughness={0.3} />
          <Edges scale={1.002} color="#ffe0a6" />
        </mesh>
      ))}
    </group>
  );
}

function HardTopSideProfile({ intrusion, width, height, length }) {
  const intrusionWidth = Math.min(intrusion.inwardDepth ?? intrusion.width, width);
  const intrusionDrop = intrusion.verticalDrop ?? intrusion.drop;
  const offset = intrusion.offsetFromWall || 0;
  const sideDirection = intrusion.side === "left" ? -1 : 1;
  const lipWidth = Math.min(intrusion.lipDetailApprox || 0.086, intrusionWidth * 0.86);
  const lowerBoxDepth = Math.min(intrusion.lowerBoxDepth || 0.065, intrusionWidth * 0.72);
  const topRailHeight = Math.max(0.045, intrusionDrop);
  const topRailWidth = intrusionWidth;
  const topRailX = sideDirection * (width / 2 - offset - topRailWidth / 2);
  const lipX = sideDirection * (width / 2 - offset - intrusionWidth + lipWidth / 2);
  const lipY = height - topRailHeight - 0.018;
  const dropX = sideDirection * (width / 2 - offset - intrusionWidth + 0.018);
  const lowerX = sideDirection * (width / 2 - offset - intrusionWidth + lowerBoxDepth / 2);
  const diagonalX = sideDirection * (width / 2 - offset - intrusionWidth * 0.58);
  const diagonalAngle = sideDirection * -0.58;

  return (
    <group>
      <mesh position={[topRailX, height - topRailHeight / 2, 0]} castShadow>
        <boxGeometry args={[topRailWidth, topRailHeight, length]} />
        <meshStandardMaterial color="#d79a45" transparent opacity={0.85} metalness={0.58} roughness={0.3} />
        <Edges scale={1.002} color="#ffd58a" />
      </mesh>
      <mesh position={[lipX, lipY, 0]} castShadow>
        <boxGeometry args={[lipWidth, 0.026, length]} />
        <meshStandardMaterial color="#efbd66" transparent opacity={0.88} metalness={0.5} roughness={0.32} />
        <Edges scale={1.002} color="#ffe6b8" />
      </mesh>
      <mesh position={[dropX, height - topRailHeight - 0.055, 0]} castShadow>
        <boxGeometry args={[0.036, 0.110, length]} />
        <meshStandardMaterial color="#bd7834" transparent opacity={0.9} metalness={0.62} roughness={0.28} />
        <Edges scale={1.002} color="#ffe0a6" />
      </mesh>
      <mesh position={[diagonalX, height - topRailHeight - 0.102, 0]} rotation={[0, 0, diagonalAngle]} castShadow>
        <boxGeometry args={[0.030, 0.135, length]} />
        <meshStandardMaterial color="#c88138" transparent opacity={0.88} metalness={0.58} roughness={0.31} />
        <Edges scale={1.002} color="#ffe0a6" />
      </mesh>
      <mesh position={[lowerX, height - topRailHeight - 0.158, 0]} castShadow>
        <boxGeometry args={[lowerBoxDepth, 0.050, length]} />
        <meshStandardMaterial color="#a8642e" transparent opacity={0.9} metalness={0.65} roughness={0.27} />
        <Edges scale={1.002} color="#ffd58a" />
      </mesh>
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
