import { useEffect } from "react";
import "./App.css";

function App() {
    useEffect(() => {
        // check active element by investigating which item is in the middle of the container
        // since safari doesn't reliably fire touchStart
        const boundingBox = document.getElementById("container")!.getBoundingClientRect()!;
        const midPoint = [(boundingBox.right + boundingBox.left) / 2, (boundingBox.top + boundingBox.bottom) / 2];
        console.log(midPoint);

        let lastSelectedElement = "0";
        document.getElementById("0")?.scrollIntoView();

        const scroll = () => {
            const el = document.elementFromPoint(midPoint[0], midPoint[1])!;
            const parent = el.parentElement!;

            // snap out of scroll nesting of doom
            if ((el.id == "-1" && parent.scrollLeft < 0) || (el.id == "1" && parent.scrollLeft < 0)) {
                parent.scrollLeft = 0;
                document.getElementById("0")?.scrollIntoView({ behavior: "smooth" });
            }

            // only process when the selected element has changed
            if (el.id == lastSelectedElement) return;
            lastSelectedElement = el.id;

            //document.getElementById("touched")!.innerText = el.id + ", " + ++a;

            // get child index
            const index = Array.from(parent.children).indexOf(el);

            if (index == Array.from(parent.children).length - 2) {
                // create element after
                const item = document.createElement("div");
                item.classList.add("item");
                const newId = parent.classList.contains("backward") ? parseInt(el.id) - 2 : parseInt(el.id) + 2;
                item.innerText = `${newId}`;
                item.id = `${newId}`;

                parent.appendChild(item);
                // TODO: figure out negative scrolling in chrome
            }
        };

        for (const container of document.getElementsByClassName("directionalScroller")) {
            container.addEventListener("scroll", scroll);
        }
        document.getElementById("prev")!.onclick = () => {
            document.getElementById(document.elementFromPoint(midPoint[0], midPoint[1]).id - 1)!.scrollIntoView({ behavior: "smooth" });
        };
        document.getElementById("next")!.onclick = () => {
            document
                .getElementById(parseInt(document.elementFromPoint(midPoint[0], midPoint[1]).id) + 1)!
                .scrollIntoView({ behavior: "smooth" });
        };

        return () => {
            for (const container of document.getElementsByClassName("directionalScroller")) {
                container.removeEventListener("scroll", scroll);
            }
        };
    });

    return (
        <>
            <div id="touched"></div>
            <div id="container">
                <div className="directionalScroller backward">
                    <div className="scrollStopper"></div>
                    <div className="item" id="-1">
                        -1
                    </div>
                    <div className="item" id="-2">
                        -2
                    </div>
                </div>
                <div className="item" id="0">
                    0
                </div>
                <div className="directionalScroller forward">
                    <div className="item" id="1">
                        1
                    </div>
                    <div className="item" id="2">
                        2
                    </div>
                </div>
            </div>
            <div className="controls">
                <span id="prev">←</span>
                <span id="next">→</span>
            </div>
        </>
    );
}

export default App;
