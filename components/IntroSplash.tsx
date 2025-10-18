
import React, { useState, useEffect } from 'react';

const IntroSplash: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
    const [isFadingOut, setIsFadingOut] = useState(false);

    useEffect(() => {
        const totalDuration = 4000; // Total time for all animations
        const fadeOutStartTime = totalDuration - 500; // Start fading out 500ms before end

        const fadeOutTimer = setTimeout(() => {
            setIsFadingOut(true);
        }, fadeOutStartTime);

        const finishTimer = setTimeout(() => {
            onFinished();
        }, totalDuration);

        return () => {
            clearTimeout(fadeOutTimer);
            clearTimeout(finishTimer);
        };
    }, [onFinished]);

    return (
        <div id="intro-splash" className={`fixed inset-0 z-[1001] flex flex-col items-center justify-center ${isFadingOut ? 'fade-out' : ''}`}>
            <h1 id="intro-title" className="text-6xl font-bold intro-logo">
                Dewey Brain
            </h1>
            <p className="intro-text mt-4 text-lg font-medium">
                Made By Muhammad Faizan Adnan
            </p>
            <div className="intro-progress-bar-container mt-6 w-64">
                <div className="intro-progress-bar"></div>
            </div>
        </div>
    );
};

export default IntroSplash;
