import React, { Component, PropTypes } from "react";
import ResizeNode from "./resize-node";
import { MODES } from "../../constants";

class Resizable extends Component {
  static displayName = "Resizable";
  static propTypes = {
    resizeHorizontal: PropTypes.bool,
    resizeVertical: PropTypes.bool,
    scale: PropTypes.number.isRequired,
    onResize: PropTypes.func,
    onResizeStart: PropTypes.func,
    onResizeStop: PropTypes.func,
    getSize: PropTypes.func,
    children: PropTypes.node
  }

  static defaultProps = {
    onResizeStart: () => {},
    onResizeStop: () => {}
  }

  constructor(props) {
    super(props);
    this.state = {
      resizeMode: null
    };
  }

  getEventCoordinates = (e) => ({
    x: e.touches ? e.touches[0].clientX : e.clientX,
    y: e.touches ? e.touches[0].clientY : e.clientY
  })

  /*
   * Begin resizing with a particular mode
   */

  startResize = (e, resizeMode) => {
    e.preventDefault();
    e.stopPropagation();
    this.startMousePosition = this.getEventCoordinates(e);
    this.sizeAtStart = this.props.getSize();
    document.addEventListener("mousemove", this.handleMouseMove);
    document.addEventListener("mouseup", this.stopResize);
    document.addEventListener("touchmove", this.handleMouseMove);
    document.addEventListener("touchend", this.stopResize);
    this.props.onResizeStart(this.sizeAtStart);
    this.setState({ resizeMode });
  }

  /*
   * Stop resizing
   */

  stopResize = (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.removeEventListener("mousemove", this.handleMouseMove);
    document.removeEventListener("mouseup", this.stopResize);
    document.removeEventListener("touchmove", this.handleMouseMove);
    document.removeEventListener("touchend", this.stopResize);
    this.props.onResizeStop(this.state.resizeMode);
    this.setState({ resizeMode: null });
  }

  /*
   * Handle the mouse move. Calculate new target position
   */

  handleMouseMove = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
    const clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

    // Determine whether we can resize horizontally and vertically
    const resizingHorizontally = this.state.resizeMode !== MODES.TOP &&
                                 this.state.resizeMode !== MODES.BOTTOM;

    const resizingVertically = this.state.resizeMode !== MODES.LEFT &&
                               this.state.resizeMode !== MODES.RIGHT;

    // Capture deltas for top/left/width/height
    const targetSize = {
      ...this.sizeAtStart
    };

    // Determine horizontal deltas
    if (resizingHorizontally) {
      if (this.state.resizeMode === MODES.TOP_LEFT ||
          this.state.resizeMode === MODES.LEFT ||
          this.state.resizeMode === MODES.BOTTOM_LEFT) {
        targetSize.left += (clientX - this.startMousePosition.x) / this.props.scale;
        targetSize.width -= (clientX - this.startMousePosition.x) / this.props.scale;
      } else {
        targetSize.width += (clientX - this.startMousePosition.x) / this.props.scale;
      }
    }

    // Determine vertical deltas
    if (resizingVertically) {
      if (this.state.resizeMode === MODES.TOP_LEFT ||
          this.state.resizeMode === MODES.TOP ||
          this.state.resizeMode === MODES.TOP_RIGHT) {
        targetSize.top += (clientY - this.startMousePosition.y) / this.props.scale;
        targetSize.height -= (clientY - this.startMousePosition.y) / this.props.scale;
      } else {
        targetSize.height += (clientY - this.startMousePosition.y) / this.props.scale;
      }
    }

    this.resizeTo(e, targetSize);
  }

  /*
   * Attempt a resize to a position
   */

  resizeTo(e, rect) {
    this.props.onResize(e, this.sizeAtStart, rect, this.state.resizeMode);
  }

  /*
   * Render
   */

  render() {
    /* eslint-disable max-len */
    let resizeNodes = [];

    if (this.props.resizeHorizontal) {
      resizeNodes = resizeNodes.concat([
        <ResizeNode scale={this.props.scale} activeMode={this.state.resizeMode} key={MODES.RIGHT} mode={MODES.RIGHT} alignRight onMouseDownResize={this.startResize} />,
        <ResizeNode scale={this.props.scale} activeMode={this.state.resizeMode} key={MODES.LEFT} mode={MODES.LEFT} alignLeft onMouseDownResize={this.startResize} />
      ]);
    }
    if (this.props.resizeVertical) {
      resizeNodes = resizeNodes.concat([
        <ResizeNode scale={this.props.scale} activeMode={this.state.resizeMode} key={MODES.TOP} mode={MODES.TOP} alignTop onMouseDownResize={this.startResize} />,
        <ResizeNode scale={this.props.scale} activeMode={this.state.resizeMode} key={MODES.BOTTOM} mode={MODES.BOTTOM} alignBottom onMouseDownResize={this.startResize} />
      ]);
    }
    if (this.props.resizeVertical && this.props.resizeHorizontal) {
      resizeNodes = resizeNodes.concat([
        <ResizeNode scale={this.props.scale} activeMode={this.state.resizeMode} key={MODES.TOP_LEFT} mode={MODES.TOP_LEFT} cornerTopLeft onMouseDownResize={this.startResize} />,
        <ResizeNode scale={this.props.scale} activeMode={this.state.resizeMode} key={MODES.TOP_RIGHT} mode={MODES.TOP_RIGHT} cornerTopRight onMouseDownResize={this.startResize} />,
        <ResizeNode scale={this.props.scale} activeMode={this.state.resizeMode} key={MODES.BOTTOM_RIGHT} mode={MODES.BOTTOM_RIGHT} cornerBottomRight onMouseDownResize={this.startResize} />,
        <ResizeNode scale={this.props.scale} activeMode={this.state.resizeMode} key={MODES.BOTTOM_LEFT} mode={MODES.BOTTOM_LEFT} cornerBottomLeft onMouseDownResize={this.startResize} />
      ]);
    }

    return (
      <div>
        {this.props.children}
        {resizeNodes}
      </div>
    );
    /* eslint-enable max-len */
  }
}

export default Resizable;
