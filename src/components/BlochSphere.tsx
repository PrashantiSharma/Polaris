import React, { useEffect, useRef } from 'react'
import * as THREE from 'three'
// @ts-ignore
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface BlochProps {
  r: {x:number,y:number,z:number, rmag:number}
}

export default function BlochSphere({ r }: BlochProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<THREE.ArrowHelper>()
  const rendererRef = useRef<THREE.WebGLRenderer>()

  useEffect(() => {
    const mount = mountRef.current!
    const w = mount.clientWidth || mount.parentElement!.clientWidth
    const h = mount.clientHeight || 400

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x0b1020)

    const camera = new THREE.PerspectiveCamera(45, w/h, 0.1, 100)
    camera.position.set(2.2, 2.0, 2.2)

    const renderer = new THREE.WebGLRenderer({ antialias:true })
    renderer.setSize(w, h)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08

    // Lighting
    const hemi = new THREE.HemisphereLight(0xffffff, 0x222233, 0.8)
    scene.add(hemi)

    // Sphere
    const sphereGeom = new THREE.SphereGeometry(1, 48, 48)
    const sphereMat = new THREE.MeshStandardMaterial({
      color: "#bcbcbc",
      metalness: 0.1, roughness: 0.8,
      transparent:true, opacity:0.5
    })
    const sphere = new THREE.Mesh(sphereGeom, sphereMat)
    scene.add(sphere)

    // Wireframe grid
    const wire = new THREE.WireframeGeometry(new THREE.SphereGeometry(1, 14, 14))
    const line = new THREE.LineSegments(wire, new THREE.LineBasicMaterial({ color: 0x1e2745 }))
    scene.add(line)

    // Axes
    const axisMatX = new THREE.LineBasicMaterial({ color: 0x6fa8ff })
    const axisMatY = new THREE.LineBasicMaterial({ color: 0x7fffd4 })
    const axisMatZ = new THREE.LineBasicMaterial({ color: 0xffa86f })
    const buildAxis = (dir: THREE.Vector3, mat: THREE.LineBasicMaterial) => {
      const pts = [new THREE.Vector3().copy(dir).multiplyScalar(-1), new THREE.Vector3().copy(dir).multiplyScalar(1)]
      const geom = new THREE.BufferGeometry().setFromPoints(pts)
      scene.add(new THREE.Line(geom, mat))
    }
    buildAxis(new THREE.Vector3(1,0,0), axisMatX)
    buildAxis(new THREE.Vector3(0,1,0), axisMatY)
    buildAxis(new THREE.Vector3(0,0,1), axisMatZ)

    // Arrow for Bloch vector
    const dir = new THREE.Vector3(r.x, r.y, r.z).normalize()
    const length = Math.max(0.0001, r.rmag)
    const color = "#f1c232"
    const arrow = new THREE.ArrowHelper(dir, new THREE.Vector3(0,0,0), length, color, 0.08, 0.04)
    arrowRef.current = arrow
    scene.add(arrow)

    const onResize = () => {
      const w2 = mount.clientWidth || mount.parentElement!.clientWidth
      const h2 = mount.clientHeight || 400
      camera.aspect = w2 / h2
      camera.updateProjectionMatrix()
      renderer.setSize(w2, h2)
    }
    window.addEventListener('resize', onResize)

    let raf = 0
    const tick = () => {
      controls.update()
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    tick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      mount.removeChild(renderer.domElement)
      renderer.dispose()
    }
  }, [])

  useEffect(() => {
    if(!arrowRef.current || !rendererRef.current) return
    const dir = new THREE.Vector3(r.x, r.y, r.z)
    const length = Math.max(0.0001, r.rmag)
    // Update arrow direction & length
    arrowRef.current.setDirection(dir.length() > 0 ? dir.clone().normalize() : new THREE.Vector3(0,0,1))
    arrowRef.current.setLength(length, 0.08, 0.04)
  }, [r.x, r.y, r.z, r.rmag])

  return <div className="stage" ref={mountRef} />
}
