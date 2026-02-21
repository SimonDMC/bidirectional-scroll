import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import "./App.css";
import Item from "./Item";

function App() {
    const [middleNum, setMiddleNum] = useState(0);

    useEffect(() => {
        const VELOCITY_CAP = 7;

        const container = document.getElementById("container")!;
        const center = document.getElementById("center")!;
        const width = center.clientWidth;
        container.scrollLeft = width * 2;

        let x: number;
        let lastOffset = 0;
        let offset = 0;
        let innerMiddleNum = 0;
        let velocity = 0;
        let momentumTimeout: number | null = null;

        function touchstart(e: TouchEvent) {
            e.preventDefault();

            x = e.touches[0].clientX;
            if (momentumTimeout) clearTimeout(momentumTimeout);
        }

        function touchmove(e: TouchEvent) {
            e.preventDefault();

            velocity = lastOffset - (offset + e.touches[0].clientX - x);
            if (velocity < -VELOCITY_CAP) velocity = -VELOCITY_CAP;
            if (velocity > VELOCITY_CAP) velocity = VELOCITY_CAP;

            lastOffset = offset + e.touches[0].clientX - x;
            calculateOffset();
        }

        function touchend(e: TouchEvent) {
            e.preventDefault();

            offset = lastOffset;

            // velocity calculation
            const momentum = () => {
                document.getElementById("touched")!.innerText = velocity;
                lastOffset -= velocity;
                velocity /= 1.05;
                calculateOffset();
                offset = lastOffset;
                if (Math.abs(velocity) > 0.1) {
                    momentumTimeout = setTimeout(momentum, 1);
                } else {
                    momentumTimeout = null;
                }
            };

            momentumTimeout = setTimeout(momentum, 1);
        }

        function calculateOffset() {
            if (lastOffset > width) {
                flushSync(() => {
                    setMiddleNum(--innerMiddleNum);
                });
                offset -= width;
                lastOffset -= width;
                container.scrollLeft = width * 2;
            } else if (lastOffset < -width) {
                flushSync(() => {
                    setMiddleNum(++innerMiddleNum);
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
