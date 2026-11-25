import * as THREE from 'three';

export class InputManager {
  constructor(domElement) {
    this.keys = {};
    this.mouseNDC = new THREE.Vector2();
    this.isFiring = false;
    this.jumpPressed = false;
    this.dashPressed = false;
    this.camYaw = 0;
    this.isOrbiting = false;
    this.lastMouseX = 0;
    this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    this.joyVec = new THREE.Vector2(0, 0);
    this._bindEvents(domElement);
  }

  _bindEvents(dom) {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Space') this.jumpPressed = true;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.dashPressed = true;
    });
    window.addEventListener('keyup', (e) => { this.keys[e.code] = false; });
    window.addEventListener('mousemove', (e) => {
      this.mouseNDC.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNDC.y = -(e.clientY / window.innerHeight) * 2 + 1;
      if (this.isOrbiting) {
        const dx = e.clientX - this.lastMouseX;
        this.camYaw -= dx * 0.006;
        this.lastMouseX = e.clientX;
      }
    });
    dom.addEventListener('mousedown', (e) => {
      if (e.button === 0) this.isFiring = true;
      if (e.button === 2) { this.isOrbiting = true; this.lastMouseX = e.clientX; }
    });
    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.isFiring = false;
      if (e.button === 2) this.isOrbiting = false;
    });
    dom.addEventListener('contextmenu', (e) => e.preventDefault());

    if (this.isTouchDevice) {
      document.getElementById('mobile-controls').classList.remove('hidden');
      const zone = document.getElementById('joystick-zone');
      const knob = document.getElementById('joystick-knob');
      let joyTouchId = null;
      zone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joyTouchId = touch.identifier;
        this._updateJoystick(touch, zone, knob);
      });
      zone.addEventListener('touchmove', (e) => {
        e.preventDefault();
        for (const t of e.changedTouches) if (t.identifier === joyTouchId) this._updateJoystick(t, zone, knob);
      });
      const resetJoy = (e) => {
        for (const t of e.changedTouches) {
          if (t.identifier === joyTouchId) {
            joyTouchId = null;
            this.joyVec.set(0, 0);
            knob.style.transform = 'translate(0px, 0px)';
          }
        }
      };
      zone.addEventListener('touchend', resetJoy);
      zone.addEventListener('touchcancel', resetJoy);
      const fireBtn = document.getElementById('btn-fire');
      fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.isFiring = true; });
      fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.isFiring = false; });
      document.getElementById('btn-jump').addEventListener('touchstart', (e) => { e.preventDefault(); this.jumpPressed = true; });
      document.getElementById('btn-dash').addEventListener('touchstart', (e) => { e.preventDefault(); this.dashPressed = true; });
    }
  }

  _updateJoystick(touch, zone, knob) {
    const rect = zone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.4;
    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxR) { dx = (dx / dist) * maxR; dy = (dy / dist) * maxR; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    this.joyVec.set(dx / maxR, dy / maxR);
  }

  getMoveVector() {
    let x = this.joyVec.x;
    let z = this.joyVec.y;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) z -= 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) z += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) x -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) x += 1;
    const v = new THREE.Vector2(x, z);
    if (v.lengthSq() > 1) v.normalize();
    return v;
  }

  consumeJump() { const val = this.jumpPressed; this.jumpPressed = false; return val; }
  consumeDash() { const val = this.dashPressed; this.dashPressed = false; return val; }
}
