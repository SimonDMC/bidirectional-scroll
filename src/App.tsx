import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import "./App.css";
import Item from "./Item";

function App() {
    const [middleNum, setMiddleNum] = useState(0);

    useEffect(() => {
        const container = document.getElementById("container")!;
        const center = document.getElementById("center")!;
        const width = center.clientWidth;
        container.scrollLeft = width * 2;

        let x: number;
        let lastOffset = 0;
        let offset = 0;
        let innerMiddleNum = 0;

        function touchstart(e: TouchEvent) {
            e.preventDefault();

            x = e.touches[0].clientX;
        }

        function touchmove(e: TouchEvent) {
            e.preventDefault();

            lastOffset = offset + e.touches[0].clientX - x;

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
                container.scrollLeft = width * 2;
            }

            container.style.setProperty("--offset", `${lastOffset}px`);
        }

        function touchend(e: TouchEvent) {
            e.preventDefault();

            offset = lastOffset;
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
