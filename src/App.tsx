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

        function touchstart(e: TouchEvent) {
            x = e.touches[0].clientX;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
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

            // if we're over the edge or swiped with enough velocity, clear the gap
            let targetOffset = 0;

            if (velocity < -VELOCITY_THRESHOLD || lastOffset > width / 2) {
                targetOffset = width;
            } else if (velocity > VELOCITY_THRESHOLD || lastOffset < -width / 2) {
                targetOffset = -width;
            }

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

        function calculateOffset() {
            if (lastOffset >= width) {
                flushSync(() => {
                    setMiddleNum(--internalMiddleNum);
                });
                offset -= width;
                lastOffset -= width;
                container.scrollLeft = width * 2;
            } else if (lastOffset <= -width) {
                flushSync(() => {
                    setMiddleNum(++internalMiddleNum);
                });
                offset += width;
                lastOffset += width;
            }

            container.scrollLeft = width * 2 - lastOffset;
        }

        container.addEventListener("touchstart", touchstart, { passive: false });
        container.addEventListener("touchmove", touchmove, { passive: false });
        container.addEventListener("touchend", touchend, { passive: false });
        return () => {
            container.removeEventListener("touchstart", touchstart);
            container.removeEventListener("touchmove", touchmove);
            container.removeEventListener("touchend", touchend);
        };
    }, []);

    return (
        <>
            <div id="touched"></div>
            <div id="container">
                <Item number={middleNum - 2} />
                <Item number={middleNum - 1} />
                <Item number={middleNum} id="center" />
                <Item number={middleNum + 1} />
                <Item number={middleNum + 2} />
            </div>
            <div className="controls">
                <span id="prev">←</span>
                <span id="next">→</span>
            </div>
        </>
    );
}

export default App;
