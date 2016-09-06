import React, { Component, PropTypes } from "react";
import { RESIZECORNER } from "../../assets/icons";

import styles from "./resize-node.css";

export default class ResizeNode extends Component {
  static propTypes = {
    mode: PropTypes.string,
    activeMode: PropTypes.string,
    alignLeft: PropTypes.bool,
    alignTop: PropTypes.bool,
    alignBottom: PropTypes.bool,
    alignRight: PropTypes.bool,
    cornerTopLeft: PropTypes.bool,
    cornerTopRight: PropTypes.bool,
    cornerBottomLeft: PropTypes.bool,
    cornerBottomRight: PropTypes.bool,
    onMouseDownResize: PropTypes.func,
    onTouchResize: PropTypes.func,
    scale: PropTypes.number
  }

  handleMouseDown = (e) => {
    this.props.onMouseDownResize(e, this.props.mode);
  }

  handleTouchStart = (e) => {
    this.props.onTouchResize(e, this.props.mode);
  }

  renderCornerIcon(props) {
    if (
      !props.cornerTopLeft && !props.cornerTopRight &&
      !props.cornerBottomLeft && !props.cornerBottomRight
    ) {
      return;
    }

    const iconClass = [
      props.cornerTopLeft && styles.iconTopLeft,
      props.cornerTopRight && styles.iconTopRight,
      props.cornerBottomLeft && styles.iconBottomLeft,
      props.cornerBottomRight && styles.iconBottomRight
    ].join(" ");

    return (
      <span
        className={iconClass}
        dangerouslySetInnerHTML={{ __html: RESIZECORNER }}
      >
      </span>
    );
  }

  render() {
    const resolvedClassNames = [
      styles.handle,
      this.props.alignTop && styles.handleTop,
      this.props.alignBottom && styles.handleBottom,
      this.props.alignLeft && styles.handleLeft,
      this.props.alignRight && styles.handleRight,
      this.props.cornerTopLeft && styles.cornerTopLeft,
      this.props.cornerTopRight && styles.cornerTopRight,
      this.props.cornerBottomLeft && styles.cornerBottomLeft,
      this.props.cornerBottomRight && styles.cornerBottomRight
    ].join(" ");

    return (
      !this.props.activeMode || this.props.activeMode === this.props.mode ?
        <div
          style={{ transform: `scale(${1 / this.props.scale})` }}
          className={resolvedClassNames}
          onMouseDown={this.handleMouseDown}
          onTouchStart={this.handleTouchStart}
        >
          {this.renderCornerIcon(this.props)}
        </div>
      : null
    );
  }
}
