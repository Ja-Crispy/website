"use client"

import { useRef, useMemo, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { Note } from "@/lib/generate-notes"

interface GardenSceneProps {
  notes: Note[]
  currentTime: number
  selectedCategory: string | null
  hoveredNote: string | null
  onHoverNote: (id: string | null) => void
  isPlaying: boolean
  onTimeUpdate: (time: number) => void
}

const CATEGORY_COLORS: Record<string, string> = {
  "Machine Learning": "#ff6b9d",
  "Web Development": "#4ecdc4",
  "Data Science": "#95e1d3",
  "DevOps": "#ffd93d",
  "Mobile Development": "#6bcb77",
  "Cloud Computing": "#4d96ff",
  "Cybersecurity": "#ff8b94",
  "Blockchain": "#c9b1ff",
  "AI Ethics": "#ffc75f",
  "System Design": "#845ec2",
  "Frontend": "#00c9a7",
  "Backend": "#ff9671",
  "Database": "#d65db1",
  "Testing": "#00d4ff",
  "Architecture": "#ff6f91",
}

function getColorForCategory(category: string): THREE.Color {
  const hex = CATEGORY_COLORS[category] || "#ffffff"
  return new THREE.Color(hex)
}

interface TreeInstanceData {
  position: THREE.Vector3
  color: THREE.Color
  birthTime: number
  maxHeight: number
  category: string
  id: string
}

function KnowledgeTree({
  data,
  currentTime,
  isSelected,
  isHovered,
  onHover,
}: {
  data: TreeInstanceData
  currentTime: number
  isSelected: boolean
  isHovered: boolean
  onHover: (id: string | null) => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const growthProgress = useMemo(() => {
    if (currentTime < data.birthTime) return 0
    const progress = (currentTime - data.birthTime) / (1 - data.birthTime)
    return Math.min(1, Math.max(0, progress))
  }, [currentTime, data.birthTime])

  const { trunkGeometry, branchPositions, particlePositions, particleColors } =
    useMemo(() => {
      const height = data.maxHeight * growthProgress
      const trunk = new THREE.CylinderGeometry(0.02, 0.04, height, 6)
      trunk.translate(0, height / 2, 0)

      // Generate branch positions based on growth
      const branches: THREE.Vector3[] = []
      const numBranches = Math.floor(growthProgress * 8)

      for (let i = 0; i < numBranches; i++) {
        const branchHeight = height * (0.3 + (i / numBranches) * 0.6)
        const angle = (i * Math.PI * 2) / 3 + Math.random() * 0.5
        const length = 0.3 + Math.random() * 0.4
        branches.push(
          new THREE.Vector3(
            Math.cos(angle) * length,
            branchHeight,
            Math.sin(angle) * length
          )
        )
      }

      // Particle system for leaves/glow
      const numParticles = Math.floor(growthProgress * 50)
      const positions: number[] = []
      const colors: number[] = []
      const baseColor = data.color

      for (let i = 0; i < numParticles; i++) {
        const particleHeight = height * (0.4 + Math.random() * 0.6)
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * 0.5
        positions.push(
          Math.cos(angle) * radius,
          particleHeight + (Math.random() - 0.5) * 0.3,
          Math.sin(angle) * radius
        )

        // Color variation
        const variation = 0.8 + Math.random() * 0.4
        colors.push(
          baseColor.r * variation,
          baseColor.g * variation,
          baseColor.b * variation
        )
      }

      return {
        trunkGeometry: trunk,
        branchPositions: branches,
        particlePositions: new Float32Array(positions),
        particleColors: new Float32Array(colors),
      }
    }, [growthProgress, data.maxHeight, data.color])

  useFrame((state) => {
    if (groupRef.current && particlesRef.current) {
      // Gentle sway animation
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + data.position.x) * 0.02

      // Particle animation
      const positions = particlesRef.current.geometry.attributes.position
      if (positions) {
        const array = positions.array as Float32Array
        for (let i = 0; i < array.length; i += 3) {
          array[i + 1] +=
            Math.sin(state.clock.elapsedTime * 2 + i) * 0.001
        }
        positions.needsUpdate = true
      }
    }
  })

  if (growthProgress <= 0) return null

  const opacity = isSelected ? 0.9 : 0.15
  const scale = isHovered ? 1.2 : 1

  return (
    <group
      ref={groupRef}
      position={data.position}
      scale={scale}
      onPointerOver={() => onHover(data.id)}
      onPointerOut={() => onHover(null)}
    >
      {/* Trunk */}
      <mesh geometry={trunkGeometry}>
        <meshBasicMaterial
          color={data.color}
          transparent
          opacity={opacity * 0.6}
        />
      </mesh>

      {/* Branches */}
      {branchPositions.map((pos, i) => (
        <mesh key={i} position={[0, pos.y, 0]}>
          <cylinderGeometry args={[0.01, 0.015, pos.length(), 4]} />
          <meshBasicMaterial
            color={data.color}
            transparent
            opacity={opacity * 0.5}
          />
        </mesh>
      ))}

      {/* Particles/Leaves */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particlePositions.length / 3}
            array={particlePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={particleColors.length / 3}
            array={particleColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={opacity}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Glow effect */}
      <mesh position={[0, data.maxHeight * growthProgress * 0.6, 0]}>
        <sphereGeometry args={[0.3 * growthProgress, 8, 8]} />
        <meshBasicMaterial
          color={data.color}
          transparent
          opacity={opacity * 0.15}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

function BackgroundParticles({ count = 500 }: { count?: number }) {
  const particlesRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const pos: number[] = []
    const col: number[] = []

    for (let i = 0; i < count; i++) {
      pos.push(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 10 - 5
      )
      const brightness = 0.3 + Math.random() * 0.7
      col.push(brightness, brightness, brightness)
    }

    return {
      positions: new Float32Array(pos),
      colors: new Float32Array(col),
    }
  }, [count])

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position
      const array = positions.array as Float32Array

      for (let i = 0; i < array.length; i += 3) {
        // Falling animation
        array[i + 1] -= 0.01
        if (array[i + 1] < -10) {
          array[i + 1] = 10
        }
        // Slight horizontal drift
        array[i] += Math.sin(state.clock.elapsedTime + i) * 0.001
      }
      positions.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        vertexColors
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function GardenScene({
  notes,
  currentTime,
  selectedCategory,
  hoveredNote,
  onHoverNote,
  isPlaying,
  onTimeUpdate,
}: GardenSceneProps) {
  const treeData = useMemo<TreeInstanceData[]>(() => {
    return notes.map((note, index) => {
      const seed = index * 1000
      return {
        position: new THREE.Vector3(
          (seededRandom(seed) - 0.5) * 20,
          (seededRandom(seed + 1) - 0.5) * 8 - 2,
          (seededRandom(seed + 2) - 0.5) * 8
        ),
        color: getColorForCategory(note.category),
        birthTime: note.createdAt,
        maxHeight: 1 + seededRandom(seed + 3) * 2,
        category: note.category,
        id: note.id,
      }
    })
  }, [notes])

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      onTimeUpdate((prev) => {
        const next = prev + 0.002
        return next > 1 ? 0 : next
      })
    }, 16)

    return () => clearInterval(interval)
  }, [isPlaying, onTimeUpdate])

  return (
    <>
      <color attach="background" args={["#0a0a0a"]} />
      <fog attach="fog" args={["#0a0a0a", 10, 30]} />

      <ambientLight intensity={0.2} />
      <pointLight position={[10, 10, 10]} intensity={0.5} color="#4ecdc4" />
      <pointLight position={[-10, -10, -10]} intensity={0.3} color="#ff6b9d" />

      <BackgroundParticles count={800} />

      {treeData.map((tree) => (
        <KnowledgeTree
          key={tree.id}
          data={tree}
          currentTime={currentTime}
          isSelected={
            selectedCategory === null || tree.category === selectedCategory
          }
          isHovered={hoveredNote === tree.id}
          onHover={onHoverNote}
        />
      ))}
    </>
  )
}
