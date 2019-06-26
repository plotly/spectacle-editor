import React, { Component, PropTypes } from "react";
import { Motion, spring } from "react-motion";

import {
  SpringSettings,
  BLACKLIST_CURRENT_ELEMENT_DESELECT
} from "../../constants";
import Icon from "../icon";
import styles from "./element-item.css";

const addedPadding = 2;

class ElementItem extends Component {
  static propTypes = {
    elementType: PropTypes.string.isRequired,
    elementLeft: PropTypes.number.isRequired,
    elementTop: PropTypes.number.isRequired,
    elementWidth: PropTypes.number.isRequired,
    elementHeight: PropTypes.number.isRequired,
    onDragStart: PropTypes.func.isRequired,
    onDrag: PropTypes.func.isRequired,
    onDragStop: PropTypes.func.isRequired,
    onDrop: PropTypes.func.isRequired,
    scale: PropTypes.number
  };

  static contextTypes = {
    store: React.PropTypes.object
  };

  constructor(props, context) {
    super(props, context);

    this.state = {
      delta: [0, 0],
      mouseStart: [0, 0],
      mouseOffset: [0, 0],
      canvasOffset: [0, 0],
      isPressed: false,
      isUpdating: false
    };
  }

  handleTouchStart = (ev) => {
    ev.preventDefault();
    this.handleMouseDown(ev.touches[0]);
  }

  handleTouchMove = (ev) => {
    ev.preventDefault();
    this.handleMouseMove(ev.touches[0]);
  }

  handleMouseMove = ({ pageX, pageY, offsetX, offsetY, clientX, clientY, target: { id } }) => {
    const { mouseStart: [x, y], isOverCanvasPosition } = this.state;
    const newDelta = [pageX - x, pageY - y];

    let isUpdating = false;
    let newOverCanvasPosition = null;

    if (id === "canvas" || id === "slide") {
      newOverCanvasPosition = [offsetX, offsetY];

    // Switching from canvas element back to icon, do not animate icon
    } else if (isOverCanvasPosition !== null) {
      isUpdating = true;
    }

    const mousePosition = {
      clientX,
      clientY
    };

    if (!newOverCanvasPosition && this.state.isOverCanvasPosition) {
      this.props.onDragStop();
    } else if (newOverCanvasPosition && !this.state.isOverCanvasPosition) {
      this.props.onDragStart(mousePosition, this.props.elementType);
    }

    if (newOverCanvasPosition) {
      this.props.onDrag(mousePosition);
    }

    this.setState({
      delta: newDelta,
      // TODO: Clean up these two properties
      canvasOffset: [offsetX, offsetY],
      isOverCanvasPosition: newOverCanvasPosition,
      isUpdating
    }, () => {
      this.setState({
        isUpdating: false
      });
    });
  }


  handleMouseDown = (ev) => {
    ev.preventDefault();
    ev.persist();

    const { pageX, pageY } = ev;

    window.addEventListener("mouseup", this.handleMouseUp);
    window.addEventListener("touchend", this.handleMouseUp);

    // Only do drag if we hold the mouse down for a bit
    this.mouseClickTimeout = setTimeout(() => {
      this.mouseClickTimeout = null;

      this.context.store.updateElementDraggingState(true, true);

      // Make the cursor dragging everywhere
      document.body.style.cursor = "-webkit-grabbing";

      this.setState({
        mouseOffset: [(addedPadding / 2), (addedPadding / 2)],
        delta: [0, 0],
        mouseStart: [pageX, pageY],
        isPressed: true
      });

      window.addEventListener("touchmove", this.handleTouchMove);
      window.addEventListener("mousemove", this.handleMouseMove);
    }, 150);
  }

  handleMouseUp = () => {
    if (this.mouseClickTimeout || this.mouseClickTimeout === 0) {
      clearTimeout(this.mouseClickTimeout);
      window.removeEventListener("mouseup", this.handleMouseUp);
      window.removeEventListener("touchend", this.handleMouseUp);

      this.mouseClickTimeout = null;

      this.props.onDrop(this.props.elementType);
      this.props.onDragStop();

      return;
    }

    window.removeEventListener("touchmove", this.handleTouchMove);
    window.removeEventListener("touchend", this.handleMouseUp);
    window.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("mouseup", this.handleMouseUp);

    // Reset the cursor dragging to auto
    document.body.style.cursor = "auto";

    const state = {
      delta: [0, 0],
      mouseOffset: [0, 0],
      mouseStart: [0, 0],
      canvasOffset: [0, 0],
      isOverCanvasPosition: null,
      isPressed: false
    };

    if (this.state.isOverCanvasPosition) {
      // Don't show return animation if dropping the element on the canvas
      state.isUpdating = true;

      this.props.onDrop(this.props.elementType, [
        this.state.canvasOffset[0],
        this.state.canvasOffset[1]
      ]);
      this.props.onDragStop();
    }

    this.context.store.updateElementDraggingState(false);

    this.setState(state, () => {
      setTimeout(() => {
        this.setState({
          isUpdating: false
        });
      }, 1);
    });
  }


  render() {
    const {
      elementType,
      elementLeft,
      elementTop,
      elementWidth,
      elementHeight
    } = this.props;

    const {
      isUpdating,
      isOverCanvasPosition,
      isPressed,
      delta: [x, y],
      mouseOffset: [offsetX, offsetY]
    } = this.state;

    const motionStyles = {
      translateX: spring(x - offsetX, SpringSettings.DRAG),
      translateY: spring(y - offsetY, SpringSettings.DRAG),
      opacity: spring(isPressed ? 0.9 : 0, SpringSettings.DRAG),
      padding: spring(isPressed ? 2 : 0, SpringSettings.DRAG)
    };

    if (isUpdating) {
      motionStyles.translateX = isPressed ? x - offsetX : 0;
      motionStyles.translateY = isPressed ? y - offsetY : 0;
      motionStyles.padding = isPressed ? addedPadding : 0;
      motionStyles.opacity = 0.9;
    }

    return (
      <div
        onMouseDown={this.handleMouseDown}
        onTouchStart={this.handleTouchStart}
        className={`${styles.wrapper} ${BLACKLIST_CURRENT_ELEMENT_DESELECT}`}
        style={{
          left: elementLeft,
          top: elementTop,
          width: elementWidth,
          height: elementHeight,
          cursor: isPressed ? "-webkit-grabbing" : "-webkit-grab"
        }}
      >
        {!isOverCanvasPosition &&
          <Motion
            defaultStyle={isUpdating ? motionStyles : {
              translateX: 0,
              translateY: 0,
              padding: 0,
              opacity: 0
            }}
            style={motionStyles}
          >
            {({ translateY, translateX, opacity, padding }) => (
              <Icon
                name={elementType}
                className={`${styles.icon} ${styles.dragIcon}`}
                style={{
                  transform: `
                    translate3d(${translateX}px,
                    ${translateY}px, 0)
                  `,
                  opacity,
                  padding
                }}
              />
            )}
          </Motion>
        }
        <div
          className={styles.item}
        >
          <Icon name={elementType} className={styles.icon} />
          <h4>
            {elementType.replace("Plotly", "Plotly & Dash")}
          </h4>
        </div>
      </div>
    );
  }
}

export default ElementItem;
