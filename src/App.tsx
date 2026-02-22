import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import "./App.css";
import Item from "./Item";

function App() {
    const [middleNum, setMiddleNum] = useState(0);

    useEffect(() => {
        const VELOCITY_THRESHOLD = 2.5;
        const SNAP_SPEED = 0.15;

        const container = document.getElementById("container")!;
        const center = document.getElementById("center")!;
        const width = center.clientWidth;
        container.scrollLeft = width * 2;

        let x: number;
        let lastOffset = 0;
        let offset = 0;
        let internalMiddleNum = 0;
        let velocity = 0;
        let animationFrameId: number | null = null;
        let grabIndex = 0;
        let targetOffset: number;

        function touchstart(e: TouchEvent) {
            x = e.touches[0].clientX;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            // detect grabbing swiper before lerp is finished (before elements swap over)
            // otherwise, swiping in one direction and then swiping back causes it to skip over
            // an element, as we still have the old one selected
            if (lastOffset > width / 2) {
                grabIndex = -1;
            } else if (lastOffset < -width / 2) {
                grabIndex = 1;
            } else {
                grabIndex = 0;
            }
        }

        function touchmove(e: TouchEvent) {
            e.preventDefault();

            velocity = lastOffset - (offset + e.touches[0].clientX - x);
            lastOffset = offset + e.touches[0].clientX - x;
            calculateOffset();
        }

        function touchend(e: TouchEvent) {
            e.preventDefault();
            offset = lastOffset;

            targetOffset = 0;
            // if we're over the edge or swiped with enough velocity (and not in the middle
            // of the opposite swipe), clear the gap
            const isFlickBack = velocity < -VELOCITY_THRESHOLD;
            const isFlickForward = velocity > VELOCITY_THRESHOLD;

            const isDraggedBack = lastOffset > width / 2 && !isFlickForward;
            const isDraggedForward = lastOffset < -width / 2 && !isFlickBack;

            const canGoBack = grabIndex !== 1;
            const canGoForward = grabIndex !== -1;

            if ((isFlickBack || isDraggedBack) && canGoBack) {
                targetOffset = width;
            } else if ((isFlickForward || isDraggedForward) && canGoForward) {
                targetOffset = -width;
            }

            animateSwipe();
        }

        function animateSwipe() {
            // linear interpolation
            const glide = () => {
                lastOffset += (targetOffset - lastOffset) * SNAP_SPEED;

                // snap and stop when <0.5px away
                if (Math.abs(targetOffset - lastOffset) < 0.5) {
                    lastOffset = targetOffset;
                    calculateOffset();
                    offset = lastOffset;
                    animationFrameId = null;
                    return;
                }

                calculateOffset();
                offset = lastOffset;
                animationFrameId = requestAnimationFrame(glide);
            };

            glide();
        }

        // returns whether shift happened
        function calculateOffset() {
            if (lastOffset >= width) {
                flushSync(() => {
                    setMiddleNum(--internalMiddleNum);
                });
                offset -= width;
                lastOffset -= width;
                targetOffset -= width;
            } else if (lastOffset <= -width) {
                flushSync(() => {
                    setMiddleNum(++internalMiddleNum);
                });
                offset += width;
                lastOffset += width;
                targetOffset += width;
            }

            container.scrollLeft = width * 2 - lastOffset;
        }

        container.addEventListener("touchstart", touchstart, { passive: false });
        container.addEventListener("touchmove", touchmove, { passive: false });
        container.addEventListener("touchend", touchend, { passive: false });

        document.getElementById("prev")!.onclick = () => {
            targetOffset = width;
            // if arrow is clicked while a swipe animation is already happening, cancel it
            // and start a new one which goes an item further
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                targetOffset += width;
            }
            animateSwipe();
        };
        document.getElementById("next")!.onclick = () => {
            targetOffset = -width;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                targetOffset -= width;
            }
            animateSwipe();
        };

        return () => {
            container.removeEventListener("touchstart", touchstart);
            container.removeEventListener("touchmove", touchmove);
            container.removeEventListener("touchend", touchend);
        };
    }, []);

    return (
        <>
            <div id="container">
                <Item number={middleNum - 2} />
                <Item number={middleNum - 1} />
                <Item number={middleNum} id="center" />
                <Item number={middleNum + 1} />
                <Item number={middleNum + 2} />
            </div>
            <div className="controls">
                <svg id="prev" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="m9.55 12l7.35 7.35q.375.375.363.875t-.388.875t-.875.375t-.875-.375l-7.7-7.675q-.3-.3-.45-.675t-.15-.75t.15-.75t.45-.675l7.7-7.7q.375-.375.888-.363t.887.388t.375.875t-.375.875z"
                    />
                </svg>
                <svg id="next" xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24">
                    <path
                        fill="currentColor"
                        d="m14.475 12l-7.35-7.35q-.375-.375-.363-.888t.388-.887t.888-.375t.887.375l7.675 7.7q.3.3.45.675t.15.75t-.15.75t-.45.675l-7.7 7.7q-.375.375-.875.363T7.15 21.1t-.375-.888t.375-.887z"
                    />
                </svg>
            </div>
        </>
    );
}

export default App;
