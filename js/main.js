import { Scales } from "./scales.js";

// Initialisation Babylon.js
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// Chargement de Havok
const havok = await HavokPhysics();
const hk = new BABYLON.HavokPlugin(true, havok);
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), hk);

// Caméra et lumière
const camera = new BABYLON.ArcRotateCamera("camera", Math.PI / 2, Math.PI / 3, 15, BABYLON.Vector3.Zero(), scene);
camera.attachControl(canvas, true);
camera.inputs.attached.pointers.buttons = [2]; // clic droit pour bouger la caméra uniquement
new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

// Initialisation du synthé WAM et de la gamme
const scales = new Scales();
await scales.init();
const audioContext = scales.audioContext;
const synthInstance = scales.getSynthInstance();
scales.resumeAudio();

const scaleTextExample = scales.majorScale(scales.nameToMidi("C4"));
const scaleMidi = scales.arpeggiator(scales.scaleToMidi(scaleTextExample), "alternate");
let currentNote = 0;

const obstacles = [];
const obstacleAggregates = []; // pour garder les aggregates
const balls = [];

//////////////////////////////////////////////////////
// FONCTIONS UTILITAIRES
//////////////////////////////////////////////////////

function createObstacle(x, y) {
    const box = BABYLON.MeshBuilder.CreateBox("obstacle", { height: 0.3, width: 3, depth: 1 }, scene);
    box.position.set(x, y, 0);

    const mat = new BABYLON.StandardMaterial("mat", scene);
    mat.diffuseColor = new BABYLON.Color3(1, 1, 1); // Blanc
    box.material = mat;

    const aggregate = new BABYLON.PhysicsAggregate(box, BABYLON.PhysicsShapeType.BOX, {
        mass: 0,
        restitution: 0.9,
        friction: 0.1
    }, scene);

    obstacles.push(box);
    obstacleAggregates.push(aggregate);
    return box;
}

function updatePhysicsAggregateForObstacle(obstacle) {
    const index = obstacles.indexOf(obstacle);
    if (index !== -1 && obstacleAggregates[index]) {
        obstacleAggregates[index].dispose();
    }
    const newAggregate = new BABYLON.PhysicsAggregate(obstacle, BABYLON.PhysicsShapeType.BOX, {
        mass: 0,
        restitution: 0.9,
        friction: 0.1
    }, scene);
    obstacleAggregates[index] = newAggregate;
}

function selectObstacle(obstacle) {
    if (selectedObstacle && selectedObstacle !== obstacle) {
        selectedObstacle.material.diffuseColor = new BABYLON.Color3(1, 1, 1);
    }
    selectedObstacle = obstacle;
    if (selectedObstacle) {
        selectedObstacle.material.diffuseColor = new BABYLON.Color3(1, 0, 0);
    }
}

//////////////////////////////////////////////////////
// CRÉATION INITIALE DES OBSTACLES
//////////////////////////////////////////////////////

for (let i = 0; i < 5; i++) {
    createObstacle(Math.random() * 10 - 5, Math.random() * 10);
}

//////////////////////////////////////////////////////
// VARIABLES POUR LES TOUCHES SHIFT / CTRL
//////////////////////////////////////////////////////

let isShiftDown = false;
let isCtrlDown = false;

window.addEventListener("keydown", (e) => {
    if (e.key === "Shift") isShiftDown = true;
    if (e.key === "Control") isCtrlDown = true;
});

window.addEventListener("keyup", (e) => {
    if (e.key === "Shift") isShiftDown = false;
    if (e.key === "Control") isCtrlDown = false;
});

//////////////////////////////////////////////////////
// SÉLECTION ET MANIPULATION DES OBSTACLES
//////////////////////////////////////////////////////

let selectedObstacle = null;
let isDragging = false;
let lastPointerPos = null;

scene.onPointerDown = function (evt, pickResult) {
    if (pickResult.hit && obstacles.includes(pickResult.pickedMesh)) {
        selectObstacle(pickResult.pickedMesh);
        isDragging = true;
        lastPointerPos = { x: scene.pointerX, y: scene.pointerY };
    } else {
        selectObstacle(null);
        isDragging = false;
    }
};

scene.onPointerUp = function () {
    isDragging = false;
    lastPointerPos = null;
};

scene.onPointerMove = function (evt) {
    if (isDragging && selectedObstacle && lastPointerPos) {
        const dx = scene.pointerX - lastPointerPos.x;
        const dy = scene.pointerY - lastPointerPos.y;

        if (isShiftDown) { // Rotation
            selectedObstacle.rotation.y += dx * 0.01;
        } else if (isCtrlDown) { // Resize
            selectedObstacle.scaling.x = Math.max(0.2, selectedObstacle.scaling.x + dx * 0.005);
        } else { // Déplacement
            selectedObstacle.position.x += dx * 0.02;
            selectedObstacle.position.y -= dy * 0.02;
        }

        lastPointerPos = { x: scene.pointerX, y: scene.pointerY };
        updatePhysicsAggregateForObstacle(selectedObstacle);
    }
};

//////////////////////////////////////////////////////
// AJOUT / SUPPRESSION OBSTACLE
//////////////////////////////////////////////////////

window.addEventListener("keydown", (e) => {
    if (e.key === "n") {
        const newBox = createObstacle(0, 5);
        selectObstacle(newBox);
    }
    if ((e.key === "Delete" || e.key === "Backspace") && selectedObstacle) {
        const index = obstacles.indexOf(selectedObstacle);
        if (index !== -1) {
            obstacleAggregates[index].dispose();
            obstacles[index].dispose();
            obstacles.splice(index, 1);
            obstacleAggregates.splice(index, 1);
            selectedObstacle = null;
        }
    }
});

//////////////////////////////////////////////////////
// CRÉATION DES BALLES
//////////////////////////////////////////////////////

function createBall() {
    const ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
    ball.position.set(Math.random() * 6 - 3, 5, 0);

    const sphereAggregate = new BABYLON.PhysicsAggregate(ball, BABYLON.PhysicsShapeType.SPHERE, {
        mass: 1,
        restitution: 0.9,
        friction: 0.1
    }, scene);

    const mat = new BABYLON.StandardMaterial("mat", scene);
    mat.diffuseColor = new BABYLON.Color3(Math.random(), Math.random(), Math.random());
    ball.material = mat;

    sphereAggregate.body.setCollisionCallbackEnabled(true);

    const started = hk._hknp.EventType.COLLISION_STARTED.value;
    const continued = hk._hknp.EventType.COLLISION_CONTINUED.value;
    const finished = hk._hknp.EventType.COLLISION_FINISHED.value;
    const eventMask = started | continued | finished;
    sphereAggregate.body.setEventMask(eventMask);

    const observable = sphereAggregate.body.getCollisionObservable();

    observable.add((collisionEvent) => {
        if (collisionEvent.type !== "COLLISION_STARTED") return;

        const other = collisionEvent.collidedAgainst.transformNode;
        if (obstacles.includes(other)) {
            const noteMidiToPlay = scaleMidi[currentNote++];
            if (synthInstance) {
                synthInstance.audioNode.scheduleEvents({
                    type: 'wam-midi',
                    time: audioContext.currentTime,
                    data: { bytes: new Uint8Array([0x90, noteMidiToPlay, 100]) }
                });
                synthInstance.audioNode.scheduleEvents({
                    type: 'wam-midi',
                    time: audioContext.currentTime + 0.25,
                    data: { bytes: new Uint8Array([0x80, noteMidiToPlay, 100]) }
                });
                currentNote %= scaleMidi.length;
            }
        }
    });

    balls.push(ball);
}

//////////////////////////////////////////////////////
// CLIC SOURIS POUR AJOUTER UNE BALLE
//////////////////////////////////////////////////////

window.addEventListener("click", (evt) => {
    if (!isDragging) {
        audioContext.resume().then(() => {
            createBall();
        });
    }
});

//////////////////////////////////////////////////////
// RENDU + SUPPRESSION BALLES TOMBÉES
//////////////////////////////////////////////////////

engine.runRenderLoop(() => {
    scene.render();

    for (let i = balls.length - 1; i >= 0; i--) {
        if (balls[i].position.y < -10) {
            balls[i].dispose();
            balls.splice(i, 1);
        }
    }
});

window.addEventListener("resize", () => {
    engine.resize();
});