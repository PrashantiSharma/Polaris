declare module 'three/examples/jsm/controls/OrbitControls.js' {
  import { Camera, EventDispatcher } from 'three';
  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement?: HTMLElement);
    update(): void;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
  }
}
