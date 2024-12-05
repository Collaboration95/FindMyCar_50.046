import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';

const RenderEnv = ({ parkingSpot }) => {
    const parkingLot = useGLTF('src/models/ParkingLot.glb'); 
    const carModel = useGLTF('src/models/DodgeChallenger.glb');

    // State for car position
    const [carPosition, setCarPosition] = useState([0, 0, 0]);
    const [carRotation, setCarRotation] = useState([0, 0, 0]); 
    const [carOpacity, setCarOpacity] = useState(1); 
    const [fadingOut, setFadingOut] = useState(true);  

    // Fading effect for the car
    useEffect(() => {
        const interval = setInterval(() => {
            setCarOpacity((prevOpacity) => {
                if (fadingOut && prevOpacity > 0.5) {
                    return prevOpacity - 0.2; // Decrease opacity
                } else if (!fadingOut && prevOpacity < 1) {
                    return prevOpacity + 0.2; // Increase opacity
                } else {
                    setFadingOut(!fadingOut); // Reverse fade direction
                    return prevOpacity; // Keep the current opacity
                }
            });
        }, 200); 

        return () => clearInterval(interval); // Cleanup interval on unmount
    }, [fadingOut]);

    // Update car position when parkingSpot changes
    useEffect(() => {
        const parkingSpots = {
            SPOTR: [3, 0.1, -0.2],
            SPOTL: [3, 0.1, 0.9],
        };
    
        // Determine the key based on the parkingSpot string
        let spotKey;
    
        if (parkingSpot.includes('R') && !parkingSpot.includes('L')) {
            spotKey = 'SPOTR';
        } else {
            spotKey = 'SPOTL';
        }
    
        setCarPosition(parkingSpots[spotKey] || [3, 0.1, -1.3]);
        setCarRotation([0, Math.PI / 2, 0]); 
    }, [parkingSpot]);
    

    // Set shadow properties for parking lot
    parkingLot.scene.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    // Set shadow properties and opacity for car model
    useEffect(() => {
        carModel.scene.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    child.material.transparent = true; // Allow transparency
                    child.material.opacity = carOpacity; // Apply dynamic opacity
                }
            }
        });
    }, [carModel, carOpacity]);

    return (
        <div>
            {/* 3D Canvas */}
            <Canvas
                style={{ height: '400px', background: '#ffffff' }} 
                shadows // Enable shadows
                camera={{ position: [0, 10, 15], fov: 25 }} 
                gl={{ preserveDrawingBuffer: true }} 
            >
                {/* Ambient and Directional Lights */}
                <ambientLight intensity={0.8} />
                <directionalLight position={[10, 15, 10]} intensity={1.5} castShadow />
                <spotLight position={[0, 20, 0]} intensity={2} angle={0.2} penumbra={1} castShadow />

                {/* Parking Lot */}
                <primitive object={parkingLot.scene} scale={[2.5, 2.5, 2.5]} />

                {/* Car */}
                <primitive
                    object={carModel.scene}
                    position={carPosition}
                    rotation={carRotation} 
                    scale={[0.32, 0.32, 0.32]} 
                />

                {/* Orbit Controls */}
                <OrbitControls target={[0, 0, 0]} maxPolarAngle={Math.PI / 2} />
            </Canvas>
        </div>
    );
};

export default RenderEnv;
