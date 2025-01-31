import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import * as CANNON from "cannon-es";

const CubeScene: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!mountRef.current) return;

    // Создание сцены, камеры и рендера
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );
    camera.position.set(0, 5, 10);

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Контролы камеры
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Физический мир
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0);

    // Создание земли (плоскости)
    const groundMaterial = new CANNON.Material();
    const groundBody = new CANNON.Body({
        shape: new CANNON.Plane(),
        type: CANNON.Body.STATIC,
        material: groundMaterial,
    });
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(groundBody);

    // Визуальная плоскость
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
    const groundMaterialThree = new THREE.MeshStandardMaterial({ color: 0x808080 });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterialThree);
    groundMesh.rotation.x = -Math.PI / 2;
    scene.add(groundMesh);

    // Свет
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 10, 5);
    scene.add(light);

    // Массивы фигур
    const objects: THREE.Mesh[] = [];
    const bodies: CANNON.Body[] = [];

    // Функция создания случайной фигуры
    const createRandomShape = () => {
    const shapeTypes = ["box", "sphere", "cylinder", "cone", "tetrahedron"];
    const shapeType = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    const color = Math.random() * 0xffffff;

    let geometry: THREE.BufferGeometry;
    let shape: CANNON.Shape;
    const size = 0.5;

    switch (shapeType) {
    case "box":
        geometry = new THREE.BoxGeometry(1, 1, 1);
        shape = new CANNON.Box(new CANNON.Vec3(size, size, size));
        break;
    case "sphere":
        geometry = new THREE.SphereGeometry(size, 16, 16);
        shape = new CANNON.Sphere(size);
        break;
    case "cylinder":
        geometry = new THREE.CylinderGeometry(size, size, 1, 16);
        shape = new CANNON.Cylinder(size, size, 1, 16);
        break;
    case "cone":
        geometry = new THREE.ConeGeometry(size, 1, 16);
        shape = new CANNON.Cylinder(0, size, 1, 16);
        break;
    default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
        shape = new CANNON.Box(new CANNON.Vec3(size, size, size));
    }

    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    return { mesh, shape };
    };

    // Функция добавления фигуры при клике
    const handleClick = (event: MouseEvent) => {
    const mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(groundMesh);

    if (intersects.length > 0) {
        const point = intersects[0].point;
        const { mesh, shape } = createRandomShape();

        mesh.position.copy(point);
        scene.add(mesh);
        objects.push(mesh);

        const body = new CANNON.Body({ mass: 1, shape });
        body.position.set(point.x, point.y + 1, point.z);
        world.addBody(body);
        bodies.push(body);
    }
    };

    window.addEventListener("click", handleClick);

    // Анимация
    const animate = () => {
        requestAnimationFrame(animate);
        world.step(1 / 60);

    bodies.forEach((body, index) => {
        objects[index].position.copy(body.position);
        objects[index].quaternion.copy(body.quaternion);
    });

        controls.update();
        renderer.render(scene, camera);
    };

    animate();

    return () => {
        window.removeEventListener("click", handleClick);
        mountRef.current?.removeChild(renderer.domElement);
    };
    }, []);

    return <div ref={mountRef} />;
};

export default CubeScene;
