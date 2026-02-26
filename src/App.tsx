import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import "./App.css";
import Item from "./Item";
import { LeftArrowIcon } from "./icons/LeftArrow";
import { RightArrowIcon } from "./icons/RightArrow";
import { GithubIcon } from "./icons/Github";

function App() {
    // DEMO-RELEVANT TS STARTS HERE

    // this number represents the "index" of the middle element, expected to be passed down
    // to Item components; in this primitive example, the index is rendered directly, but in
    // a more realistic use-case, it could be used to index e.g. items in a finite but wrapping
    // list, or months in a calendar
    const [middleNum, setMiddleNum] = useState(0);

    // keeping the entire logic in a useEffect is "unreactful" but since it's entirely
    // implementation details that are irrelevant for any other component (apart from middleNum,
    // which is exposed) it makes sense for the sake of simplicity and eliminating the
    // performance overhead react hooks impose
    useEffect(() => {
        // how "hard" you have to swipe to glide to the next item
        const VELOCITY_THRESHOLD = 2.5;
        // speed of the glide animation
        const SNAP_SPEED = 0.15;

        const container = document.getElementById("container")!;
        const center = document.getElementById("center")!;
        const width = center.clientWidth;

        // initial scroll offset of the container -- twice the width since there's two
        // elements on each side of the middle one
        const BASE_OFFSET = width * 2;
        container.scrollLeft = BASE_OFFSET;

        // x position of current touch start, so we can calculate how much we've moved by
        let x = 0;
        // offset last frame, tracked since it cannot be recalculated on touchEnd
        let lastOffset = 0;
        // scroll offset already present before touching and moving the scroller, also used in
        // offset calculations
        let offset = 0;
        // middleNum, but tracked as a standard variable, since useEffect doesn't receive state
        // updates
        let internalMiddleNum = 0;
        // velocity with which the last swipe was released
        let velocity = 0;
        // currently ongoing animation frame id, used to cancel when another swipe is initiated
        // during the glide
        let animationFrameId: number | null = null;
        // whether the container was grabbed before finishing the last animation, and if so,
        // in which direction; tracked since elements haven't been moved over yet, and as such,
        // swiping in the opposite direction would cause it to move over by two
        let grabIndex = 0;
        // the scroll offset we are animating to
        let targetOffset = 0;

        function grabstart(grabX: number) {
            x = grabX;
            // cancel gliding if we grab before animation finishes
            if (animationFrameId) cancelAnimationFrame(animationFrameId);

            // detect grabbing swiper before glide is finished (before elements shift over)
            // if we don't do this, swiping in one direction and then swiping back causes it to
            // skip over an element, as we still have the old one selected
            if (lastOffset > width / 2) {
                grabIndex = -1;
            } else if (lastOffset < -width / 2) {
                grabIndex = 1;
            } else {
                grabIndex = 0;
            }
        }

        function grabmove(grabX: number) {
            // the velocity is the x-delta between the last two known touch positions
            velocity = lastOffset - (offset + grabX - x);
            lastOffset = offset + grabX - x;
            calculateOffset();
        }

        function grabend() {
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

            if ((document.getElementById("notchedToggle") as HTMLInputElement).checked) {
                animateSwipe();
            } else {
                const momentum = () => {
                    lastOffset -= velocity;
                    velocity /= 1.03;
                    calculateOffset();
                    offset = lastOffset;
                    if (Math.abs(velocity) > 0.1) {
                        animationFrameId = requestAnimationFrame(momentum);
                    } else {
                        animationFrameId = null;
                    }
                };

                if (Math.abs(velocity) > 1) animationFrameId = requestAnimationFrame(momentum);
            }
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

        function calculateOffset() {
            // if we crossed over the full width of the element in either direction, invisibly
            // reset scroll position and shift over the elements
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

            container.scrollLeft = BASE_OFFSET - lastOffset;
            updateDebug();
        }

        function scrollNext() {
            // if arrow is clicked while a swipe animation is already happening, cancel it
            // and start a new one
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                targetOffset += width;
            } else {
                targetOffset = width;
            }
            animateSwipe();
        }

        function scrollPrev() {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                targetOffset -= width;
            } else {
                targetOffset = -width;
            }
            animateSwipe();
        }

        container.onwheel = (e: WheelEvent) => {
            if ((document.getElementById("notchedToggle") as HTMLInputElement).checked) {
                // if notched, don't allow horizontal scrolling at all - at least not for this demo;
                // perhaps it would make sense in another project but not here. too many events
                // get fired and i don't like the idea of introducing an artificial cooldown
                e.preventDefault();
            } else {
                // update scroll position and shift over items if necessary
                lastOffset = BASE_OFFSET - container.scrollLeft;
                calculateOffset();
            }
        };

        function touchstart(e: TouchEvent) {
            // ignore if it's not the first touch point
            if (e.touches.length > 1) return;
            grabstart(e.touches[0].clientX);
        }

        function touchmove(e: TouchEvent) {
            e.preventDefault();
            grabmove(e.touches[0].clientX);
        }

        function touchend(e: TouchEvent) {
            // ignore if it's not the last touch point
            if (e.touches.length > 0) return;
            grabend();
        }

        // DEMO-RELEVANT TS ENDS HERE

        // touch listeners specifically have to be added via addEventListener, otherwise they're
        // not picked up on touchscreen laptops (???)
        container.addEventListener("touchstart", touchstart);
        container.addEventListener("touchmove", touchmove);
        container.addEventListener("touchend", touchend);

        // is mouse held down?
        let held = false;
        container.onmousedown = (e: MouseEvent) => {
            if (!(document.getElementById("mouseToggle") as HTMLInputElement).checked) return;
            held = true;
            grabstart(e.clientX);
        };
        document.onmousemove = (e: MouseEvent) => {
            if (!(document.getElementById("mouseToggle") as HTMLInputElement).checked) return;
            e.preventDefault();
            if (held) grabmove(e.clientX);
        };
        document.onmouseup = () => {
            if (!(document.getElementById("mouseToggle") as HTMLInputElement).checked) return;
            if (held) grabend();
            held = false;
        };

        document.getElementById("prev")!.onclick = scrollNext;
        document.getElementById("next")!.onclick = scrollPrev;

        function updateDebug() {
            document.getElementById("xDebug")!.innerText = x.toFixed(2);
            document.getElementById("lastOffsetDebug")!.innerText = lastOffset.toFixed(2);
            document.getElementById("offsetDebug")!.innerText = offset.toFixed(2);
            document.getElementById("internalMiddleNumDebug")!.innerText = `${internalMiddleNum}`;
            document.getElementById("velocityDebug")!.innerText = velocity.toFixed(2);
            document.getElementById("animationFrameIdDebug")!.innerText = `${animationFrameId}`;
            document.getElementById("grabIndexDebug")!.innerText = `${grabIndex}`;
            document.getElementById("targetOffsetDebug")!.innerText = `${targetOffset}`;
        }

        return () => {
            container.removeEventListener("touchstart", touchstart);
            container.removeEventListener("touchmove", touchmove);
            container.removeEventListener("touchend", touchend);
        };
    }, []);

    return (
        <>
            <h1>Bi-directional Scroll Demo</h1>
            <div className="settings">
                <div className="setting">
                    <input type="checkbox" name="debugToggle" id="debugToggle" />
                    <label htmlFor="debugToggle" title="Show debug data">
                        Debug
                    </label>
                </div>
                <div className="setting">
                    <input type="checkbox" name="notchedToggle" id="notchedToggle" defaultChecked />
                    <label
                        htmlFor="notchedToggle"
                        title="Stop at every item and disallow swiping more than one at a time (Note: This demo was built with the primary use-case of notched scrolling in mind, the standard scrolling calculation is not polished and would likely require more work to be usable)"
                    >
                        Notched
                    </label>
                </div>

                <div className="setting">
                    <input type="checkbox" name="mouseToggle" id="mouseToggle" defaultChecked />
                    <label htmlFor="mouseToggle" title="Use mouse dragging to swipe between elements">
                        Mouse
                    </label>
                </div>
            </div>
            {/* DEMO-RELEVANT TSX STARTS HERE */}
            <div id="container">
                <Item number={middleNum - 2} />
                <Item number={middleNum - 1} />
                <Item number={middleNum} id="center" />
                <Item number={middleNum + 1} />
                <Item number={middleNum + 2} />
            </div>
            {/* DEMO-RELEVANT TSX ENDS HERE */}
            <div className="controls">
                <LeftArrowIcon id="prev" />
                <a href="https://github.com/SimonDMC/bidirectional-scroll">
                    <GithubIcon />
                </a>
                <RightArrowIcon id="next" />
            </div>
            <div className="debug">
                <div className="debugLine">
                    x: <span id="xDebug">0</span>
                </div>
                <div className="debugLine">
                    lastOffset: <span id="lastOffsetDebug">0</span>
                </div>
                <div className="debugLine">
                    offset: <span id="offsetDebug">0</span>
                </div>
                <div className="debugLine">
                    middleNum: <span id="internalMiddleNumDebug">0</span>
                </div>
                <div className="debugLine">
                    velocity: <span id="velocityDebug">0</span>
                </div>
                <div className="debugLine">
                    frameId: <span id="animationFrameIdDebug">null</span>
                </div>
                <div className="debugLine">
                    grabIndex: <span id="grabIndexDebug">0</span>
                </div>
                <div className="debugLine">
                    targetOffset: <span id="targetOffsetDebug">0</span>
                </div>
            </div>
        </>
    );
}

export default App;
