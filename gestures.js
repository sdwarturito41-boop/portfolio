/**
 * GESTURES.JS
 * Gestion du nuage de points Three.js et du tracking MediaPipe Hands
 */

let scene, camera, renderer, points;
let particles = [];
let targetPositions = [];
const PARTICLE_COUNT = 5000;

// États de morphing
const STATES = {
    CLOUD: 'cloud',
    MMI3: 'mmi3',
    FEUILLOY: 'feuilloy',
    HUGO: 'hugo',
    SURE: 'sure'
};
let currentState = STATES.CLOUD;

// Initialisation Three.js
function initThree() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    
    const canvas = renderer.domElement;
    canvas.id = 'gesture-canvas';
    canvas.style.position = 'fixed';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '-1'; // En arrière-plan
    canvas.style.pointerEvents = 'none';
    document.body.appendChild(canvas);

    // Géométrie des particules
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        // Position initiale en nuage aléatoire
        positions[i * 3] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

        // Couleur (dégradé de violet/rose pour coller à la charte)
        colors[i * 3] = 0.5 + Math.random() * 0.1; // R
        colors[i * 3 + 1] = 0.3 + Math.random() * 0.1; // G
        colors[i * 3 + 2] = 0.9 + Math.random() * 0.1; // B
        
        particles.push({
            x: positions[i * 3],
            y: positions[i * 3 + 1],
            z: positions[i * 3 + 2],
            vx: 0, vy: 0, vz: 0
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.03,
        vertexColors: true,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
    });

    points = new THREE.Points(geometry, material);
    scene.add(points);

    // Générer les positions cibles pour les textes
    generateTextPositions("MMI3", STATES.MMI3, 80);
    generateTextPositions("HUGO", STATES.HUGO, 80);
    generateTextPositions("FEUILLOY", STATES.FEUILLOY, 60);
    generateTextPositions("🖕", STATES.SURE, 160);
    generateCloudPositions(); // Default state

    animate();
}

// Génération de points à partir de texte via un Canvas 2D
const textData = {};
function generateTextPositions(text, stateName, fontSize = 80) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 800; // Plus large pour accommoder l'emoji
    canvas.height = 200;
    
    ctx.fillStyle = 'white';
    ctx.font = `bold ${fontSize}px Space Grotesk, "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 400, 100);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const sampledPositions = [];
    
    for (let y = 0; y < canvas.height; y += 2) {
        for (let x = 0; x < canvas.width; x += 2) {
            const index = (y * canvas.width + x) * 4;
            if (imageData[index] > 128) {
                sampledPositions.push({
                    x: (x - 400) * 0.015,
                    y: -(y - 100) * 0.015,
                    z: (Math.random() - 0.5) * 0.5
                });
            }
        }
    }
    
    // Remplir jusqu'à PARTICLE_COUNT
    if (sampledPositions.length === 0) {
        generateCloudPositions();
        textData[stateName] = textData[STATES.CLOUD];
        return;
    }

    while (sampledPositions.length < PARTICLE_COUNT) {
        sampledPositions.push(sampledPositions[Math.floor(Math.random() * sampledPositions.length)]);
    }
    
    textData[stateName] = sampledPositions.slice(0, PARTICLE_COUNT);
}

function generateCloudPositions() {
    const positions = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
        positions.push({
            x: (Math.random() - 0.5) * 6,
            y: (Math.random() - 0.5) * 6,
            z: (Math.random() - 0.5) * 6
        });
    }
    textData[STATES.CLOUD] = positions;
}

function animate() {
    requestAnimationFrame(animate);

    const positions = points.geometry.attributes.position.array;
    const target = textData[currentState];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
        const i3 = i * 3;
        
        // Morphing fluide (Lerp)
        positions[i3] += (target[i].x - positions[i3]) * 0.05;
        positions[i3 + 1] += (target[i].y - positions[i3 + 1]) * 0.05;
        positions[i3 + 2] += (target[i].z - positions[i3 + 2]) * 0.05;
    }

    points.geometry.attributes.position.needsUpdate = true;
    
    // On ne fait tourner le nuage que s'il n'y a pas de texte affiché
    if (currentState === STATES.CLOUD) {
        points.rotation.y += 0.002;
        points.rotation.x *= 0.95;
    } else {
        points.rotation.y *= 0.95; 
        points.rotation.x *= 0.95;
    }
    
    renderer.render(scene, camera);
}

// Tracking des mains avec MediaPipe
const videoElement = document.createElement('video');
videoElement.id = 'gesture-video';
videoElement.style.display = 'none';
document.body.appendChild(videoElement);

const hands = new Hands({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
});

hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});

hands.onResults((results) => {
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];
        detectGesture(landmarks);
    } else {
        currentState = STATES.CLOUD;
    }
});

function detectGesture(landmarks) {
    // MediaPipe Landmarks Index:
    // 0: WRIST, 4: THUMB_TIP, 8: INDEX_FINGER_TIP, 12: MIDDLE_FINGER_TIP, 16: RING_FINGER_TIP, 20: PINKY_TIP

    const indexUp = landmarks[8].y < landmarks[6].y;
    const middleUp = landmarks[12].y < landmarks[10].y;
    const ringUp = landmarks[16].y < landmarks[14].y;
    const pinkyUp = landmarks[20].y < landmarks[18].y;

    // Poing serré (tous les doigts fermés)
    if (!indexUp && !middleUp && !ringUp && !pinkyUp) {
        currentState = STATES.MMI3;
    } 
    // Index + Majeur levés
    else if (indexUp && middleUp && !ringUp && !pinkyUp) {
        currentState = STATES.FEUILLOY;
    }
    // Index levé uniquement
    else if (indexUp && !middleUp && !ringUp && !pinkyUp) {
        currentState = STATES.HUGO;
    }
    // Majeur levé uniquement
    else if (!indexUp && middleUp && !ringUp && !pinkyUp) {
        currentState = STATES.SURE;
    }
    else {
        currentState = STATES.CLOUD;
    }
}

const camera_mp = new Camera(videoElement, {
    onFrame: async () => {
        await hands.send({ image: videoElement });
    },
    width: 640,
    height: 480
});

// Démarrage
window.addEventListener('load', () => {
    initThree();
    camera_mp.start().catch(err => {
        console.warn("Caméra non disponible ou bloquée :", err);
    });
});

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
