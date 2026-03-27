/// <reference types="@react-three/fiber" />
import { useRef, useMemo, useState, useCallback } from "react";
import { Canvas, useFrame, useThree, useLoader, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import type { APILaunch } from "../../services/types";
import { getMissionName, getRocketName, getAgencyName, getOrbitAbbrev, getLaunchImage, getStatusConfig } from "../../services/formatters";
import { DS } from "./shared";

// NASA Blue Marble textures (public domain)
const EARTH_TEXTURE = "https://unpkg.com/three-globe@2.41.12/example/img/earth-blue-marble.jpg";
const EARTH_BUMP = "https://unpkg.com/three-globe@2.41.12/example/img/earth-topology.png";
const EARTH_SPECULAR = "https://unpkg.com/three-globe@2.41.12/example/img/earth-water.png";

/* ─── Earth Sphere ─── */
function Earth() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const cloudsRef = useRef<THREE.Mesh>(null!);

  const [earthMap, bumpMap, specMap] = useLoader(THREE.TextureLoader, [
    EARTH_TEXTURE,
    EARTH_BUMP,
    EARTH_SPECULAR,
  ]);

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.015;
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group>
      {/* Earth body with texture */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          map={earthMap}
          bumpMap={bumpMap}
          bumpScale={0.04}
          specularMap={specMap}
          specular={new THREE.Color("#333333")}
          shininess={15}
        />
      </mesh>

      {/* Cloud layer */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.02, 48, 48]} />
        <meshPhongMaterial
          color="#ffffff"
          transparent
          opacity={0.08}
          depthWrite={false}
        />
      </mesh>

      {/* Atmosphere glow (outer) */}
      <mesh>
        <sphereGeometry args={[2.2, 32, 32]} />
        <meshBasicMaterial
          color="#4fc3f7"
          transparent
          opacity={0.07}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Atmosphere glow (inner) */}
      <mesh>
        <sphereGeometry args={[2.12, 32, 32]} />
        <meshBasicMaterial
          color="#81d4fa"
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

/* ─── Generate orbital parameters from launch data ─── */
function getOrbitParams(index: number, total: number, orbit: string) {
  // Base radius varies by orbit type
  const orbitRadii: Record<string, number> = {
    "LEO": 2.8,
    "SSO": 3.0,
    "PO": 3.1,
    "MEO": 3.5,
    "GTO": 4.0,
    "GEO": 4.2,
    "HEO": 4.5,
    "TLI": 4.8,
    "ISS": 2.7,
    "Sub": 2.5,
  };

  const radius = orbitRadii[orbit] ?? (2.8 + (index % 5) * 0.4);

  // Distribute inclinations evenly with some variety
  const baseInclination = (index / total) * Math.PI;
  const inclination = baseInclination + (index * 0.3);
  const ascending = (index * 2.39996) % (Math.PI * 2); // Golden angle distribution

  return { radius, inclination, ascending };
}

/* ─── Orbital Path (ellipse ring) ─── */
function OrbitalPath({ radius, inclination, ascending }: { radius: number; inclination: number; ascending: number }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 128; i++) {
      const angle = (i / 128) * Math.PI * 2;
      pts.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius,
      ));
    }
    return pts;
  }, [radius]);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <group rotation={[inclination, ascending, 0]}>
      <line geometry={geometry}>
        <lineBasicMaterial color="#4fc3f7" transparent opacity={0.12} />
      </line>
    </group>
  );
}

/* ─── Satellite Dot ─── */
function SatelliteDot({
  launch,
  radius,
  inclination,
  ascending,
  speed,
  startAngle,
  onSelect,
  isSelected,
}: {
  launch: APILaunch;
  radius: number;
  inclination: number;
  ascending: number;
  speed: number;
  startAngle: number;
  onSelect: (launch: APILaunch, pos: THREE.Vector3) => void;
  isSelected: boolean;
}) {
  const dotGroupRef = useRef<THREE.Group>(null!);
  const [hovered, setHovered] = useState(false);
  const angleRef = useRef(startAngle);

  const statusConfig = getStatusConfig(launch.status);
  const color = new THREE.Color(statusConfig.color);

  // Move the entire group (dot + glow together) each frame
  useFrame((_, delta) => {
    angleRef.current += delta * speed;
    const angle = angleRef.current;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    dotGroupRef.current.position.set(x, 0, z);
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (dotGroupRef.current) {
      const worldPos = new THREE.Vector3();
      dotGroupRef.current.getWorldPosition(worldPos);
      onSelect(launch, worldPos);
    }
  }, [launch, onSelect]);

  const { gl } = useThree();
  const active = hovered || isSelected;

  return (
    <group rotation={[inclination, ascending, 0]}>
      {/* This group moves along the orbit — both meshes stay together */}
      <group
        ref={dotGroupRef}
        onClick={handleClick}
        onPointerEnter={() => { setHovered(true); gl.domElement.style.cursor = "pointer"; }}
        onPointerLeave={() => { setHovered(false); gl.domElement.style.cursor = "auto"; }}
      >
        {/* Core dot */}
        <mesh>
          <sphereGeometry args={[active ? 0.08 : 0.05, 12, 12]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {/* Glow halo — same position, just bigger + transparent */}
        <mesh>
          <sphereGeometry args={[active ? 0.14 : 0.09, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={active ? 0.25 : 0.12} />
        </mesh>
      </group>
    </group>
  );
}

/* ─── Tooltip Overlay ─── */
function SatelliteTooltip({
  launch,
  onClose,
}: {
  launch: APILaunch;
  onClose: () => void;
}) {
  const missionName = getMissionName(launch);
  const rocketName = getRocketName(launch);
  const agencyName = getAgencyName(launch);
  const orbit = getOrbitAbbrev(launch);
  const launchDate = new Date(launch.net);
  const statusConfig = getStatusConfig(launch.status);

  const dateStr = launchDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const timeStr = launchDate.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });

  return (
    <div
      className="absolute z-50 pointer-events-auto"
      style={{
        background: "rgba(13,27,42,0.95)",
        backdropFilter: "blur(20px)",
        border: `1px solid ${statusConfig.color}40`,
        borderRadius: 12,
        padding: "16px 20px",
        minWidth: 240,
        maxWidth: 300,
        boxShadow: `0 0 30px ${statusConfig.color}20, 0 8px 32px rgba(0,0,0,0.6)`,
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-2 right-3 text-lg cursor-pointer"
        style={{ color: DS.textMuted, background: "none", border: "none" }}
      >
        ×
      </button>
      <div className="flex items-center gap-2 mb-2">
        <span
          className="px-2 py-0.5 rounded-full text-[9px] tracking-widest"
          style={{
            fontFamily: DS.fontHeading,
            background: `${statusConfig.color}18`,
            color: statusConfig.color,
            border: `1px solid ${statusConfig.color}30`,
          }}
        >
          {statusConfig.label}
        </span>
        <span
          className="px-2 py-0.5 rounded text-[9px] tracking-widest"
          style={{
            fontFamily: DS.fontHeading,
            background: `${DS.secondary}15`,
            color: DS.secondary,
          }}
        >
          {orbit}
        </span>
      </div>
      <h3 className="text-sm mb-1" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
        {missionName}
      </h3>
      <p className="text-xs mb-2" style={{ color: DS.secondary }}>{rocketName}</p>
      <p className="text-[11px] mb-1" style={{ color: DS.textBody }}>{agencyName}</p>
      <div className="pt-2 mt-2" style={{ borderTop: `1px solid rgba(255,255,255,0.06)` }}>
        <p className="text-[11px]" style={{ color: DS.textMuted }}>
          📅 {dateStr}
        </p>
        <p className="text-[11px]" style={{ color: DS.textMuted }}>
          🕐 {timeStr}
        </p>
      </div>
      <a
        href={`/launch/${launch.id}`}
        className="block mt-3 text-center text-[10px] tracking-widest py-1.5 rounded-full transition-all no-underline"
        style={{
          fontFamily: DS.fontHeading,
          background: `${DS.primary}15`,
          color: DS.primary,
          border: `1px solid ${DS.primary}40`,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = `${DS.primary}30`; }}
        onMouseLeave={e => { e.currentTarget.style.background = `${DS.primary}15`; }}
      >
        VIEW MISSION →
      </a>
    </div>
  );
}

/* ─── 3D Scene ─── */
function GlobeScene({
  launches,
  selectedLaunch,
  onSelectLaunch,
}: {
  launches: APILaunch[];
  selectedLaunch: APILaunch | null;
  onSelectLaunch: (launch: APILaunch | null, pos: THREE.Vector3 | null) => void;
}) {
  const orbitData = useMemo(() =>
    launches.map((launch, i) => {
      const orbit = getOrbitAbbrev(launch);
      const params = getOrbitParams(i, launches.length, orbit);
      const speed = 0.03 + Math.random() * 0.05;
      const startAngle = (i / launches.length) * Math.PI * 2;
      return { launch, ...params, speed, startAngle };
    }), [launches]
  );

  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 3, 5]} intensity={0.8} color="#ffffff" />
      <pointLight position={[-5, -3, -5]} intensity={0.3} color="#4fc3f7" />

      <Stars
        radius={80}
        depth={60}
        count={2000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />

      <Earth />

      {orbitData.map((data, i) => (
        <OrbitalPath
          key={`orbit-${i}`}
          radius={data.radius}
          inclination={data.inclination}
          ascending={data.ascending}
        />
      ))}

      {orbitData.map((data, i) => (
        <SatelliteDot
          key={`sat-${data.launch.id}`}
          launch={data.launch}
          radius={data.radius}
          inclination={data.inclination}
          ascending={data.ascending}
          speed={data.speed}
          startAngle={data.startAngle}
          onSelect={(launch, pos) => onSelectLaunch(launch, pos)}
          isSelected={selectedLaunch?.id === data.launch.id}
        />
      ))}

      <OrbitControls
        enablePan={false}
        minDistance={4}
        maxDistance={12}
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={0.5}
        autoRotate
        autoRotateSpeed={0.3}
      />
    </>
  );
}

/* ─── Main Globe Component ─── */
export function OrbitGlobe({ launches }: { launches: APILaunch[] }) {
  const [selectedLaunch, setSelectedLaunch] = useState<APILaunch | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelect = useCallback((launch: APILaunch | null) => {
    if (launch && selectedLaunch?.id === launch.id) {
      setSelectedLaunch(null);
      setTooltipPos(null);
    } else {
      setSelectedLaunch(launch);
      // Position tooltip in center-right area
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setTooltipPos({ x: rect.width * 0.65, y: rect.height * 0.2 });
      }
    }
  }, [selectedLaunch]);

  return (
    <div ref={containerRef} className="relative w-full h-[600px] md:h-[700px] rounded-2xl overflow-hidden border" style={{ borderColor: DS.border }}>
      {/* Legend */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(13,27,42,0.8)", backdropFilter: "blur(10px)" }}>
          <p className="text-[10px] tracking-widest mb-2" style={{ fontFamily: DS.fontHeading, color: DS.textHeading }}>
            ORBITAL TRACKER
          </p>
          <p className="text-[10px]" style={{ color: DS.textMuted }}>
            {launches.length} satellites • Click to inspect
          </p>
        </div>

        <div className="px-3 py-2 rounded-lg" style={{ background: "rgba(13,27,42,0.8)", backdropFilter: "blur(10px)" }}>
          <p className="text-[9px] tracking-wider mb-1.5" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>
            ORBITS
          </p>
          {[
            { label: "LEO", color: "#00e676" },
            { label: "MEO/GTO", color: "#ffc107" },
            { label: "GEO/HEO", color: "#ff6b35" },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[9px]" style={{ color: DS.textBody }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 px-4 py-1.5 rounded-full" style={{ background: "rgba(13,27,42,0.7)", backdropFilter: "blur(10px)" }}>
        <p className="text-[10px] tracking-wider" style={{ fontFamily: DS.fontHeading, color: DS.textMuted }}>
          🖱 Drag to rotate • Scroll to zoom
        </p>
      </div>

      {/* Tooltip */}
      {selectedLaunch && tooltipPos && (
        <div
          className="absolute z-20"
          style={{ left: tooltipPos.x, top: tooltipPos.y }}
        >
          <SatelliteTooltip
            launch={selectedLaunch}
            onClose={() => { setSelectedLaunch(null); setTooltipPos(null); }}
          />
        </div>
      )}

      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 2, 7], fov: 45 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
        onPointerMissed={() => { setSelectedLaunch(null); setTooltipPos(null); }}
      >
        <GlobeScene
          launches={launches}
          selectedLaunch={selectedLaunch}
          onSelectLaunch={handleSelect}
        />
      </Canvas>
    </div>
  );
}
