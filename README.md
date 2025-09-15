# Polaris — Quantum State Cartography & Noise Dynamics on the Bloch Sphere

An interactive, real‑time single‑qubit simulator (extendable to two qubits). Control θ/φ, see the Bloch sphere update, inspect amplitudes and measurement probabilities in Z/X/Y, watch animated phase panels, and add open‑system noise (dephasing, depolarizing, amplitude damping) to visualize purity loss.

https://github.com/ (optional placeholder)

## ✨ Features
- θ/φ sliders → |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩
- Three.js Bloch sphere (OrbitControls)
- Z/X/Y probability bars (via Bloch components r_x, r_y, r_z)
- Phase panels animate Re[α·e^{-it}], Re[β·e^{-it}] to reveal relative phase
- Kraus noise channels (dephasing, depolarizing, amplitude damping)
- Purity Tr(ρ²) and |r| shown; arrow shortens as decoherence grows
- Web Worker computes physics; UI stays at 60fps

## 🧱 Stack
- React + TypeScript + Vite
- Three.js for the 3D Bloch sphere
- Web Worker for linear algebra / channels

## 🚀 Quickstart

```bash
npm i
npm run dev
```

- Open the printed local URL. Drag the sphere, move θ/φ sliders, toggle Auto‑decohere and adjust noise sliders.
- **Reset purity** returns to the current pure state determined by θ/φ.

## 🧪 Math recap

- |ψ⟩ = cos(θ/2)|0⟩ + e^{iφ} sin(θ/2)|1⟩ with α ≡ cos(θ/2), β ≡ e^{iφ} sin(θ/2).
- Bloch vector r = (sinθ cosφ, sinθ sinφ, cosθ) for pure states; for ρ, r = (2 Re ρ₀₁, 2 Im ρ₀₁, ρ₀₀ − ρ₁₁).
- Measurement probabilities: P_Z(0) = (1 + r_z)/2, P_X(+) = (1 + r_x)/2, P_Y(+i) = (1 + r_y)/2.
- Purity Tr(ρ²) ∈ [1/2, 1], with Tr(ρ²) = (1 + |r|²)/2 for qubits.

## 🧩 Project layout

```text
src/
  App.tsx                # UI glue
  components/
    BlochSphere.tsx      # Three.js scene + arrow
    ProbabilityBars.tsx  # Z/X/Y bars
    PhasePanel.tsx       # Re[α e^{-it}], Re[β e^{-it}] panels
  worker/
    physicsWorker.ts     # math, density matrix, Kraus channels
  styles.css             # minimal dark UI
```

## 🧭 Notes

- When any noise channel is nonzero and Auto‑decohere is checked, the worker applies the channel each tick (discrete time). Purity drops, |r| shrinks, α/β hide (mixed state).
- Click **Reset purity** to re‑instantiate the pure state with the current θ/φ.

## ➕ Extensions (PR‑ready ideas)
1. **Two‑qubit mode + CHSH**: Add a second worker path with 4×4 density matrices, Bell‑pair builder (H+CNOT), and CHSH estimator. Show S downward trend under depolarization.
2. **Gate deck**: Drag‑and‑drop gates (X, Y, Z, H, S, T, Rx/Ry/Rz) onto a timeline; preview state trajectory on the sphere.
3. **Phase disc**: Add an equatorial disc heatmap showing arg(α*β) for quick phase reading.
4. **Continuous channels**: Integrate Lindblad master equation with dt slider (Euler / RK4) to model time‑continuous decoherence.
5. **Save/Share**: Permalinks for θ/φ/noise params; export PNG/GIF of trajectories.
6. **WASM**: Port math to Rust/WASM for mobile‑smooth performance.
7. **Accessibility**: Add screen‑reader strings announcing basis probabilities and purity changes.

## 🛠️ Troubleshooting
- Use Node 18+.
- If `OrbitControls` type warnings appear, they’re safe; we ship a light `d.ts` shim.
- If the 3D canvas looks blurry, set your OS/browser to normal scaling or zoom.

## 📄 License
MIT
