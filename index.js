import gsap from "gsap"
import * as THREE from "three"
import * as TWEEN from "@tweenjs/tween.js"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import * as dat from "dat.gui"

//const gui = new dat.GUI()

const world = {
    plane: {
        width: 400,
        height: 400,
        widthSegments: 50,
        heightSegments: 50

    },
    coords: {
        x: 0,
        y: 0,
        z: 50
    }
}

const changeCoords = () => {
    camera.position.set(world.coords.x, world.coords.y, world.coords.z)
}

const generatePlane = () => {
    planeMesh.geometry.dispose()
    planeMesh.geometry = new THREE.PlaneGeometry(world.plane.width, world.plane.height, world.plane.widthSegments, world.plane.heightSegments)

    const { array, count } = planeMesh.geometry.attributes.position
    const randomValues = []

    for (let i = 0; i < array.length; i++) {
        if ( i % 3 === 0 ) {
            const x = array[i]
            const y = array[i + 1]
            const z = array[i + 2]
    
            array[i] = x + (Math.random() - 0.5) * 3
            array[i + 1] = y + (Math.random() - 0.5) * 3
            array[i + 2] = z + (Math.random() - 0.5) * 3
        }

        randomValues.push(Math.random() * Math.PI * 2)
    }

    const colors = []
    for (let i = 0; i < count; i++) {
        colors.push(0, 0.19, 0.4)
    }

    planeMesh.geometry.attributes.position.originalPosition = planeMesh.geometry.attributes.position.array
    planeMesh.geometry.attributes.position.randomValues = randomValues

    console.log(planeMesh.geometry.attributes.position)

    planeMesh.geometry.setAttribute("color", new THREE.BufferAttribute(new Float32Array(colors), 3))
}
/*
gui.add(world.plane, "width", 1, 500).onChange(generatePlane)
gui.add(world.plane, "height", 1, 500).onChange(generatePlane)
gui.add(world.plane, "widthSegments", 1, 100).onChange(generatePlane)
gui.add(world.plane, "heightSegments", 1, 100).onChange(generatePlane)

gui.add(world.coords, "x", -1000, 1000).onChange(changeCoords)
gui.add(world.coords, "y", -1000, 1000).onChange(changeCoords)
gui.add(world.coords, "z", -1000, 1000).onChange(changeCoords)
*/
const raycaster = new THREE.Raycaster()
const scene = new THREE.Scene()
const sceneTexture = new THREE.TextureLoader().load("/images/bg.jpg" );
scene.background = new THREE.Color(0xB3A6E);
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000)
gsap.to(camera.position, {
    duration: 1,
    z: 50
})

const renderer = new THREE.WebGL1Renderer()
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(devicePixelRatio)
const controls = new OrbitControls(camera, renderer.domElement)
//controls.enableZoom = false

document.body.appendChild(renderer.domElement)

const planeGeometry = new THREE.PlaneGeometry(19, 19, 17, 17)
const planeMaterial = new THREE.MeshPhongMaterial({ 
    side: THREE.DoubleSide, 
    flatShading: true,
    vertexColors: true
})

const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial)
scene.add(planeMesh)

generatePlane()

/*const planetTexture = new THREE.TextureLoader().load("/images/2k_venus_surface.jpg");
const planetGeometry = new THREE.SphereBufferGeometry(50, 50, 50);
const planetMaterial = new THREE.MeshBasicMaterial({ map: planetTexture});
const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial);*/

const starGeo = new THREE.BufferGeometry()

const vertices = [];
const velocities = [];
const accelerations = [];

for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 600 - 300;
    const y = Math.random() * 600 - 300;
    const z = Math.random() * 600 - 300;

    vertices.push(x, y, z);
    velocities.push(0);
    accelerations.push(Math.random() * 5);
}

starGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

let sprite = new THREE.TextureLoader().load('/images/star.png');
let starMaterial = new THREE.PointsMaterial({
    color: 0xaaaaaa,
    size: 0.7,
    map: sprite
});

const stars = new THREE.Points(starGeo, starMaterial);

const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.set(0, 0, 1)
scene.add(light)

const backLight = new THREE.DirectionalLight(0xffffff, 1)
backLight.position.set(0, 0, -1)
scene.add(backLight)

const mouse = {
    x: undefined,
    y: undefined
}

let frame = 0
const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
    raycaster.setFromCamera(mouse, camera)
    frame += 0.01

    const positionAttribute = starGeo.getAttribute('position');

    for (let i = 0; i < positionAttribute.count; i++) {
        var vel = velocities[i] + accelerations[i];
        positionAttribute.setY(i, positionAttribute.getY(i) - vel)
        
        if (positionAttribute.getY(i) < -200) {
            positionAttribute.setY(i, 200)
            velocities[i] = 0
        }
    }
    
    positionAttribute.needsUpdate = true;
    starGeo.verticesNeedUpdate = true;
    stars.rotation.y +=0.002;

    const intersects = raycaster.intersectObject(planeMesh)
    const { array, originalPosition, randomValues } = planeMesh.geometry.attributes.position
    for (let i = 0; i < array.length; i += 3) {
        // x
        array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.01
        // y
        array[i + 1] = originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.01
    }
    planeMesh.geometry.attributes.position.needsUpdate = true

    if (intersects.length > 0) {
        const { color  } = intersects[0].object.geometry.attributes
        intersects[0].object.geometry.attributes.color.needsUpdate = true

        const initialColor = {
            r: 0,
            g: 0.19,
            b: .4
        }

        const hoverColor = {
            r: 0.1,
            g: 0.5,
            b: 1
        }

        gsap.to(hoverColor, {
            r: initialColor.r,
            g: initialColor.g,
            b: initialColor.b,
            onUpdate: () => {
                // Vertice 1
                color.setX(intersects[0].face.a, hoverColor.r,)
                color.setY(intersects[0].face.a, hoverColor.g)
                color.setZ(intersects[0].face.a, hoverColor.b)

                // Vertice 2
                color.setX(intersects[0].face.b, hoverColor.r)
                color.setY(intersects[0].face.b, hoverColor.g)
                color.setZ(intersects[0].face.b, hoverColor.b)

                // Vertice 3
                color.setX(intersects[0].face.c, hoverColor.r)
                color.setY(intersects[0].face.c, hoverColor.g)
                color.setZ(intersects[0].face.c, hoverColor.b)
            }
        })
    }

    TWEEN.update();
}

animate()

addEventListener("mousemove", (event) => {
    mouse.x = (event.clientX / innerWidth) * 2 - 1
    mouse.y = -(event.clientY / innerHeight) * 2 + 1
})

document.querySelector("#seeAboutMe").addEventListener("click", (event) => {
    event.stopPropagation();

    gsap.to(camera.position, {
        duration: 1,
        x: 0,
        y: -60, 
        z: 10,
        onUpdate: () => {
            scene.add(stars);
            controls.update()
        },
        onComplete: () => {
            document.querySelector("#intro").classList.add("out")
            gsap.to(camera.position, {
                duration: 1,
                x: 0,
                y: -50, 
                z: 5,
                onUpdate: () => {
                    controls.update()
                },
                onComplete: () => {
                    document.querySelector("#about").classList.add("show")
                    gsap.to(camera.position, {
                        duration: 1,
                        x: 0,
                        y: -100, 
                        z: 5,
                        onUpdate: () => {
                            controls.update()
                        },
                    })
                }
            })
        }
    })
})


document.querySelector("#seeContactMe").addEventListener("click", (event) => {
    event.stopPropagation();

    gsap.to(camera.position, {
        duration: 1,
        x: 0,
        y: -60, 
        z: 10,
        onUpdate: () => {
            controls.update()
        },
        onComplete: () => {
            document.querySelector("#about").classList.remove("show")
            gsap.to(camera.position, {
                duration: 1,
                x: 0,
                y: -50, 
                z: 5,
                onUpdate: () => {
                    controls.update()
                },
                onComplete: () => {
                    document.querySelector("#contactMe").classList.add("show")
                    gsap.to(camera.position, {
                        duration: 1,
                        x: 0,
                        y: -100, 
                        z: 5,
                        onUpdate: () => {
                            controls.update()
                        },
                    })
                }
            })
        }
    })
})