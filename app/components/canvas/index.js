import React, { Component, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import { observer } from "mobx-react";
import { zipWith } from "lodash";
// Nesting the ElementList here so drag and drop state is controlled by this component
import { ElementTypes } from "../../constants";
import { getElementDimensions, getPointsToSnap, snap } from "../../utils";
import ElementList from "../element-list";
import Elements from "../../elements";
import CanvasElement from "./canvas-element";
import Slide from "./slide";
import styles from "./index.css";

const padding = 40;

@observer
class SlideList extends Component {
  static contextTypes = {
    store: PropTypes.object
  };

  constructor(props) {
    super(props);

    this.state = {
      isOverPosition: null,
      isOverSlide: false,
      isDragging: false
    };
  }

  componentDidMount() {
    this.resize();

    window.addEventListener("load", this.resize);
    window.addEventListener("resize", this.resize);
  }

  componentWillUnmount() {
    window.removeEventListener("load", this.resize);
    window.removeEventListener("resize", this.resize);
  }

  showGridLine() {}

  changeIsOverState = (newIsOverPosition, dragElementType, isOverSlide) => {
    if (newIsOverPosition === null) {
      this.setState({
        isOverSlide,
        dragElementType,
        isOverPosition: null
      });

      return;
    }

    const element = Elements[dragElementType];
    const { defaultHeight: height, defaultWidth: width } = element;
    const position = newIsOverPosition.concat();
    const snapOffset = [0, 0];

    position[0] -= width / 2;
    position[1] -= height / 2;

    if (!this.gridLines) {
      this.gridLines = this.context.store.gridLines;
    }

    // If position is relative to the slide add slide left and top to the values.
    if (isOverSlide) {
      position[0] += this.context.store.left;
      position[1] += this.context.store.top;

      const createSnapCallback = (isVertical, length) => (line, index) => {
        if (line === null) {
          this.refs.slide.hideGridLine(isVertical);

          return;
        }

        this.refs.slide.showGridLine(line, isVertical);

        // Index 0 = starting edge, 1 = middle, 2 = ending edge
        snapOffset[isVertical ? 0 : 1] = (length / 2 * index);

        // Set either x or y
        position[isVertical ? 0 : 1] = line + (
          isVertical ?
          // Extra pixel added for slide border
          this.context.store.left + 1 :
          this.context.store.top + 1
        );
      };

      snap(
        this.gridLines.horizontal,
        getPointsToSnap(newIsOverPosition[1], height, height / -2),
        createSnapCallback(false, height)
      );

      snap(
        this.gridLines.vertical,
        getPointsToSnap(newIsOverPosition[0], width, width / -2),
        createSnapCallback(true, width)
      );
    } else {
      this.refs.slide.hideGridLine(true);
      this.refs.slide.hideGridLine(false);
    }

    this.setState({
      isOverPosition: zipWith(position, snapOffset, (a, b) => a - b),
      isOverSlide,
      dragElementType
    });
  }

  // Keep a 4:3 ratio with the inner element centered, 30px padding
  resize = () => {
    const { offsetWidth, offsetHeight } = findDOMNode(this.refs.container);

    const effectiveWidth = Math.floor(offsetWidth - (padding * 2));
    const effectiveHeight = Math.floor(offsetHeight - (padding * 2));

    const isWidthConstrained = effectiveHeight / effectiveWidth > 0.75;

    const width = isWidthConstrained ? effectiveWidth : Math.floor(effectiveHeight / 0.75);
    const height = isWidthConstrained ? Math.floor(effectiveWidth * 0.75) : effectiveHeight;

    const left = isWidthConstrained ? padding : Math.floor((offsetWidth - width) / 2);
    const top = isWidthConstrained ? Math.floor((offsetHeight - height) / 2) : padding;

    // TODO: need better logic for handling scale and content scale
    const scale = 1;

    this.context.store.setCanvasSize({ width, height, left, top, scale });
  }

  dropElement = (elementType, position) => {
    this.refs.slide.hideGridLine(true);
    this.refs.slide.hideGridLine(false);
    this.gridLines = null;

    if (!position) {
      this.context.store.dropElement(elementType, {
        style: {
          whiteSpace: "nowrap",
          position: "absolute",
          // TODO: Place in center of slide
          left: 0,
          top: 0
        }
      });

      return;
    }

    let [x, y] = this.state.isOverPosition;
    const { left, top } = this.context.store;

    // Extra pixel added for slide border
    x -= left + 1;
    y -= top + 1;

    this.context.store.dropElement(elementType, /* props */{
      style: {
        position: "absolute",
        left: x,
        top: y,
        whiteSpace: "nowrap"
      }
    });
  }

  render() {
    const {
      isOverPosition,
      dragElementType
    } = this.state;

    const {
      isDraggingElement,
      isDraggingSlide,
      scale,
      width,
      height,
      top,
      left
     } = this.context.store;

    const PreviewElementType = dragElementType === ElementTypes.PLOTLY ?
      ElementTypes.PLOTY_PLACEHOLDER_IMAGE :
      dragElementType;

    const component = Elements[PreviewElementType];

    return (
      <div
        className={styles.canvasWrapper}
        style={{
          cursor: isDraggingElement ? "-webkit-grabbing" : "auto",
          pointerEvents: isDraggingSlide ? "none" : "auto"
        }}
      >
        <div className={styles.canvas} id="canvas" ref="container">
          <div
            style={{
              position: "absolute",
              transform: `scale(${scale})`,
              width, // Hardcoded to 1100:850 aspect ratio
              height,
              top,
              left,
              backgroundColor: "#999"
            }}
          >
            <Slide ref="slide" isOver={isOverPosition} />
          </div>
          {isOverPosition &&
            <CanvasElement
              mousePosition={isOverPosition}
              scale={scale}
              component={component}
            />
          }
        </div>
        <ElementList
          scale={scale}
          onIsOverCanvasChange={this.changeIsOverState}
          onDropElement={this.dropElement}
        />
      </div>
    );
  }
}

export default SlideList;
