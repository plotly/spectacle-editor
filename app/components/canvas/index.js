import React, { Component, PropTypes } from "react";
import { findDOMNode } from "react-dom";
import { observer } from "mobx-react";
// Nesting the ElementList here so drag and drop state is controlled by this component
import { ElementTypes, MODES } from "../../constants";
import ElementList from "../element-list";
import Elements from "../../elements";
import { TextElement, ImageElement, PlotlyElement } from "./element-types";
import SnapLines from "./snap-lines";
import * as constraints from "./constraints";
import Slide from "./slide";
import styles from "./index.css";

@observer
class SlideList extends Component {
  static contextTypes = {
    store: PropTypes.object
  };

  constructor(props) {
    super(props);
    this.state = { };
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

  getDefaultPosition = (type) => {
    const slideElement = findDOMNode(this.slideRef);
    const { width, height } = this.getDefaultSize(type);
    let left = (slideElement.clientWidth / 2) - (width / 2);
    let top = (slideElement.clientHeight / 2) - (height / 2);
    const { currentSlide } = this.context.store;
    const positions = currentSlide.children.reduce((positionHashMap, child) => {
      const key = `${child.props.style.left}x${child.props.style.top}`;
      positionHashMap[key] = true; // eslint-disable-line no-param-reassign
      return positionHashMap;
    }, {});

    while (positions[`${left}x${top}`]) {
      left += 10;
      top += 10;
    }

    return { left, top };
  }

  getDefaultSize = (type) => {
    const element = Elements[type];
    const height = element.defaultHeight || element.props.style.height;
    const width = element.defaultWidth || element.props.style.width;
    return { width, height };
  }

  // Keep a 4:3 ratio with the inner element centered, 30px padding
  resize = () => {
    const { offsetWidth, offsetHeight } = findDOMNode(this.refs.container);
    const width = offsetWidth;
    const height = offsetHeight;

    // TODO: need better logic for handling scale and content scale
    const shouldScale = offsetWidth < 1000 || offsetHeight < 700;

    const xScale = offsetWidth < 1000 ? offsetWidth / 1000 : 1;
    const yScale = offsetHeight < 700 ? offsetHeight / 700 : 1;

    this.scale = shouldScale ? Math.min(xScale, yScale) : 1;

    const scaleXOffset = width - (1000 * this.scale);
    const scaleYOffset = height - (700 * this.scale);

    const left = Math.floor(scaleXOffset / 2);
    const top = Math.floor(scaleYOffset / 2);

    this.context.store.setCanvasSize({
      width: 1000 * this.scale,
      height: 700 * this.scale,
      left,
      top,
      scale: this.scale
    });
  }

  handleDragStart = (e, type) => {
    this.context.store.setCurrentElementIndex(null);

    const scale = this.context.store.scale;
    const defaultSize = this.getDefaultSize(type);
    const position = {};
    const slideOffset = findDOMNode(this.slideRef).getBoundingClientRect();
    position.left = (e.clientX - slideOffset.left - (defaultSize.width * scale / 2)) / scale;
    position.top = (e.clientY - slideOffset.top - (defaultSize.height * scale / 2)) / scale;

    const rect = {
      ...position,
      ...defaultSize
    };

    this.setState({
      startMousePosition: { x: e.clientX, y: e.clientY },
      startRect: rect,
      elementType: type,
      elementRect: rect,
      snapLines: this.slideRef.getSnapLines(),
      activeSnapLines: []
    });
  }

  handleDrag = (e) => {
    const size = { ...this.state.startRect };
    size.left += (e.clientX - this.state.startMousePosition.x) / this.context.store.scale;
    size.top += (e.clientY - this.state.startMousePosition.y) / this.context.store.scale;
    const results = constraints.constrainGrid(size, this.state.snapLines, MODES.MOVE);
    this.setState({
      elementRect: results.size,
      activeSnapLines: results.lines
    });
  }

  handleDragStop = () => {
    this.setState({
      startMousePosition: null,
      elementType: null,
      elementRect: null,
      snapLines: [],
      activeSnapLines: []
    });
  }

  handleDrop = (type) => {
    const rect = this.state.elementRect || this.getDefaultPosition(type);
    this.context.store.dropElement(type, {
      style: {
        position: "absolute",
        left: rect.left,
        top: rect.top
      }
    });
  }

  elementFromType = (type) => {
    switch (type) {
      case ElementTypes.TEXT:
        return TextElement;
      case ElementTypes.IMAGE:
        return ImageElement;
      case ElementTypes.PLOTLY:
        return PlotlyElement;
      default:
        return null;
    }
  }

  render() {
    const {
      isDraggingElement,
      isDraggingSlide,
      scale,
      top,
      left
     } = this.context.store;

    let tempComponent = null;
    if (this.state.elementType) {
      const Element = this.elementFromType(this.state.elementType);
      tempComponent = (
        <div
          className={styles.isSelected}
          style={{
            pointerEvents: "none",
            position: "absolute",
            left: this.state.elementRect.left,
            top: this.state.elementRect.top
          }}
        >
          <Element
            component={Elements[this.state.elementType]}
            scale={scale}
            rect={this.state.elementRect}
            draggable={false}
            resizeVertical={false}
            resizeHorizontal={false}
            canArrange={false}
            isSelected
            isDragging
            isPlaceholder
          />
        </div>
      );
    }

    return (
      <div
        className={styles.canvasWrapper}
        style={{
          cursor: isDraggingElement ? "move" : "auto",
          pointerEvents: isDraggingSlide ? "none" : "auto"
        }}
      >
        <div className={styles.canvas} id="canvas" ref="container">
          <div
            style={{
              position: "absolute",
              transformOrigin: "top left",
              transform: `scale(${scale})`,
              width: 1000, // Hardcoded to 1100:850 aspect ratio
              height: 700,
              top,
              left,
              backgroundColor: "#999"
            }}
          >
            <Slide
              ref={(slide) => { this.slideRef = slide; }}
              scale={scale}
            />
            <SnapLines lines={this.state.activeSnapLines} scale={scale} />
            {tempComponent}
          </div>
        </div>
        <ElementList
          scale={scale}
          onDragStart={this.handleDragStart}
          onDrag={this.handleDrag}
          onDragStop={this.handleDragStop}
          onDrop={this.handleDrop}
        />
      </div>
    );
  }
}

export default SlideList;
