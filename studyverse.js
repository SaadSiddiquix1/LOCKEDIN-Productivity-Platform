/* ==========================================
  STUDYVERSE 3D ENGINE (INTERACTIVE)
  "Touch, Toggle, and Transform"
========================================== */

let scene, camera, renderer, controls;
let trophy, clockGroup, lampLight, lampShade, screenMesh;
let raycaster, mouse;
let isWorldBuilt = false;
let isAnimating = false;
let screenUpdateInterval = null;
let currentScreenMode = 0; // 0: Code, 1: Social, 2: Dashboard

function initStudyverse() {
    if (isWorldBuilt) return;

    const container = document.getElementById("canvas-container");
    if (!container) return;

    try {
        if (!window.THREE) throw new Error('Three.js not loaded');

        // 1. SCENE
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x0f172a);
        scene.fog = new THREE.FogExp2(0x0f172a, 0.012);

        // 2. CAMERA
        camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 6, 12);
        camera.lookAt(0, 2, 0);

        // 3. RENDERER
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // 4. CONTROLS
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2 - 0.02;
        controls.target.set(0, 2, 0);

        // 5. LIGHTING
        setupLighting();

        // 6. OBJECTS
        buildRoom();
        buildDeskSetup();
        buildBookshelves();
        createTrophy();
        createWhiteboard();
        createFloatingClock();
        addParticles();

        // 7. LISTENERS
        raycaster = new THREE.Raycaster();
        mouse = new THREE.Vector2();

        window.addEventListener('resize', onWindowResize);
        renderer.domElement.addEventListener('click', onCanvasClick, false);

        // Hide loader
        setTimeout(() => {
            const loader = document.getElementById("loading-screen");
            if (loader) {
                loader.style.opacity = 0;
                setTimeout(() => { loader.style.display = 'none'; }, 500);
            }
        }, 1500);

        isWorldBuilt = true;
        isAnimating = true;
        animate();

    } catch (error) {
        console.error('Studyverse init error:', error);
    }
}

function setupLighting() {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x6366f1, 0.8);
    dirLight.position.set(-8, 15, -8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Lamp Light (State controlled)
    lampLight = new THREE.PointLight(0xffedd5, 1.5, 12);
    lampLight.position.set(2.0, 2.3, -0.8);
    lampLight.castShadow = true;
    scene.add(lampLight);
}

function buildRoom() {
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const gridHelper = new THREE.GridHelper(80, 80, 0x334155, 0x1e293b);
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    const rug = new THREE.Mesh(
        new THREE.PlaneGeometry(6, 4),
        new THREE.MeshStandardMaterial({ color: 0x7c3aed, roughness: 0.9 })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.02;
    rug.receiveShadow = true;
    scene.add(rug);
}

function buildDeskSetup() {
    // Desk
    const desk = new THREE.Mesh(
        new THREE.BoxGeometry(5, 0.15, 3),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
    );
    desk.position.set(0, 1.5, 0);
    desk.receiveShadow = true;
    scene.add(desk);

    // Monitor
    const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(2, 1.2, 0.1),
        new THREE.MeshStandardMaterial({ color: 0x000000 })
    );
    monitor.position.set(0, 2.5, -1);
    monitor.userData = { isMonitor: true };
    scene.add(monitor);

    // Screen (Interactive)
    const screenGeo = new THREE.PlaneGeometry(1.9, 1.1);
    screenMesh = new THREE.Mesh(screenGeo, new THREE.MeshBasicMaterial());
    screenMesh.position.set(0, 2.5, -0.94);
    screenMesh.userData = { isMonitor: true };
    scene.add(screenMesh);
    updateMonitorScreen();

    // Lamp
    const lampBase = new THREE.Mesh(
        new THREE.CylinderGeometry(0.15, 0.2, 0.05, 16),
        new THREE.MeshStandardMaterial({ color: 0x64748b })
    );
    lampBase.position.set(1.8, 1.58, -0.8);
    scene.add(lampBase);

    const lampArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8),
        new THREE.MeshStandardMaterial({ color: 0x475569 })
    );
    lampArm.position.set(1.8, 2.0, -0.8);
    lampArm.rotation.z = 0.3;
    scene.add(lampArm);

    lampShade = new THREE.Mesh(
        new THREE.ConeGeometry(0.2, 0.3, 16),
        new THREE.MeshStandardMaterial({
            color: 0xfbbf24,
            emissive: 0xfbbf24,
            emissiveIntensity: 0.5
        })
    );
    lampShade.position.set(2.0, 2.3, -0.8);
    lampShade.rotation.z = Math.PI / 6;
    lampShade.userData = { isLamp: true };
    scene.add(lampShade);

    // Decor
    const mug = new THREE.Mesh(
        new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16),
        new THREE.MeshStandardMaterial({ color: 0xdc2626 })
    );
    mug.position.set(-1.5, 1.65, -0.2);
    scene.add(mug);
}

function updateMonitorScreen() {
    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 300;
    const ctx = cvs.getContext('2d');

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, 512, 300);

    if (currentScreenMode === 0) { // Code
        ctx.fillStyle = '#10b981'; ctx.font = 'bold 20px monospace';
        ctx.fillText('> LOCKEDIN.init();', 20, 40);
        ctx.fillText('> Loading Core...', 20, 70);
        for (let i = 100; i < 280; i += 25) ctx.fillText(`0x${Math.random().toString(16).substr(2, 8)}: SUCCESS`, 20, i);
    } else if (currentScreenMode === 1) { // Social
        ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 24px Arial';
        ctx.fillText('Social Connect', 20, 40);
        ctx.fillStyle = '#1e293b'; ctx.fillRect(20, 60, 472, 2);
        ctx.fillStyle = '#94a3b8'; ctx.font = '18px Arial';
        ctx.fillText('• 3 New Messages', 30, 100);
        ctx.fillText('• 1 Hackathon Update', 30, 140);
    } else { // Dashboard
        ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 24px Arial';
        ctx.fillText('System Stats', 20, 40);
        ctx.fillStyle = '#1e293b'; ctx.fillRect(20, 80, 400, 30);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(20, 80, 320, 30); // 80% Bar
        ctx.fillStyle = '#ffffff'; ctx.font = '14px Arial';
        ctx.fillText('Attendance: 80%', 30, 100);
    }

    if (screenMesh.material.map) screenMesh.material.map.dispose();
    screenMesh.material.map = new THREE.CanvasTexture(cvs);
    screenMesh.material.map.needsUpdate = true;
}

function buildBookshelves() {
    const wallX = -9, wallZ = -1;
    const shelfMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
    const shelfHeights = [1.5, 2.8, 4.1];

    shelfHeights.forEach(height => {
        const shelf = new THREE.Mesh(new THREE.BoxGeometry(3, 0.08, 0.8), shelfMat);
        shelf.position.set(wallX, height, wallZ);
        scene.add(shelf);

        // Add random books
        for (let x = -1.2; x < 1.2; x += 0.3) {
            if (Math.random() < 0.2) continue;
            const bh = 0.4 + Math.random() * 0.3;
            const book = new THREE.Mesh(
                new THREE.BoxGeometry(0.15, bh, 0.6),
                new THREE.MeshStandardMaterial({ color: Math.random() * 0xffffff })
            );
            book.position.set(wallX + x, height + bh / 2 + 0.04, wallZ);
            scene.add(book);
        }
    });
}

function createTrophy() {
    const trophyGeo = new THREE.IcosahedronGeometry(0.8, 0);
    const trophyMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 1, roughness: 0.2 });
    trophy = new THREE.Mesh(trophyGeo, trophyMat);
    trophy.position.set(7, 3, 2);
    trophy.userData = { isTrophy: true };
    scene.add(trophy);

    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(1.3, 0.04, 16, 100),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.5 })
    );
    trophy.add(ring);
    trophy.ring = ring;
}

function createWhiteboard() {
    const board = new THREE.Mesh(
        new THREE.BoxGeometry(6, 4, 0.2),
        new THREE.MeshStandardMaterial({ color: 0xd1d5db })
    );
    board.position.set(6, 4, -6);
    board.rotation.y = -0.5;
    board.userData = { isBoard: true };
    scene.add(board);

    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 340;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 512, 340);
    ctx.fillStyle = '#000'; ctx.font = 'bold 36px Arial';
    ctx.fillText("INSTRUCTIONS", 40, 60);
    ctx.font = '28px Arial';
    ctx.fillStyle = '#1e293b';
    ctx.fillText("• Click on objects", 40, 130);
    ctx.fillText("  to interact", 40, 170);
    ctx.fillText("• Explore your room!", 40, 230);

    const face = new THREE.Mesh(new THREE.PlaneGeometry(5.8, 3.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvs) }));
    face.position.z = 0.11;
    board.add(face);
}

function createFloatingClock() {
    clockGroup = new THREE.Group();
    clockGroup.position.set(0, 6, -8);
    clockGroup.userData = { isClock: true };

    const cvs = document.createElement('canvas');
    cvs.width = 512; cvs.height = 128;
    clockGroup.ctx = ctx = cvs.getContext('2d');

    const text = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cvs), transparent: true }));
    clockGroup.add(text);
    scene.add(clockGroup);
}

function updateClock() {
    if (!clockGroup) return;
    const ctx = clockGroup.ctx;
    const str = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    ctx.clearRect(0, 0, 512, 128);
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 100px Arial';
    ctx.textAlign = 'center'; ctx.fillText(str, 256, 80);
    clockGroup.children[0].material.map.needsUpdate = true;
}

function addParticles() {
    const geo = new THREE.BufferGeometry();
    const pos = [];
    for (let i = 0; i < 400; i++) pos.push((Math.random() - 0.5) * 40);
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 0.1, color: 0x6366f1, transparent: true, opacity: 0.4 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);
    scene.particles = pts;
}

// === INTERACTION ===

function onCanvasClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== scene) {
            if (obj.userData && Object.keys(obj.userData).length > 0) break;
            obj = obj.parent;
        }

        const type = obj.userData;

        if (type.isLamp) {
            lampLight.visible = !lampLight.visible;
            lampShade.material.emissiveIntensity = lampLight.visible ? 0.5 : 0;
        } else if (type.isMonitor) {
            currentScreenMode = (currentScreenMode + 1) % 3;
            updateMonitorScreen();
        } else if (type.isTrophy) {
            triggerTrophySpin();
        } else if (type.isBoard) {
            toggleBoardFocus();
        } else if (type.isClock) {
            clockGroup.children[0].material.color.setHex(Math.random() * 0xffffff);
        }
    }
}

let isBoardFocused = false;
function toggleBoardFocus() {
    isBoardFocused = !isBoardFocused;
    const targetPos = isBoardFocused ? { x: 3, y: 4, z: -2 } : { x: 0, y: 6, z: 12 };
    const targetLookAt = isBoardFocused ? { x: 6, y: 4, z: -6 } : { x: 0, y: 2, z: 0 };

    new TWEEN.Tween(camera.position)
        .to(targetPos, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    // Smoother lookAt transition would need a proxy object or quaternion interpolation
    // For now we just snap or use controls.target
    new TWEEN.Tween(controls.target)
        .to(targetLookAt, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();
}

function triggerTrophySpin() {
    const start = { y: trophy.rotation.y };
    const end = { y: trophy.rotation.y + Math.PI * 4 };

    new TWEEN.Tween(start)
        .to(end, 1500)
        .easing(TWEEN.Easing.Elastic.Out)
        .onUpdate(() => { trophy.rotation.y = start.y; })
        .start();

    if (window.confetti) window.confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
}

function onWindowResize() {
    const container = document.getElementById("canvas-container");
    if (!container || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    if (!isAnimating) return;
    requestAnimationFrame(animate);
    if (controls) controls.update();
    TWEEN.update();

    if (trophy) {
        trophy.position.y = 3 + Math.sin(Date.now() * 0.001) * 0.15;
        if (trophy.ring) trophy.ring.rotation.x += 0.05;
    }
    if (scene && scene.particles) scene.particles.rotation.y += 0.0005;

    updateClock();
    renderer.render(scene, camera);
}

function stopStudyverse() {
    isAnimating = false;
}

function resumeStudyverse() {
    if (isWorldBuilt && !isAnimating) {
        isAnimating = true;
        animate();
    }
}

window.startStudyverse = initStudyverse;
window.stopStudyverse = stopStudyverse;
window.resumeStudyverse = resumeStudyverse;
