import React, { Component, PropTypes } from "react";
import styles from "./snap-lines.css";

class SnapLines extends Component {
  static propTypes = {
    lines: PropTypes.array,
    scale: PropTypes.number.isRequired
  }

  renderSnapLine = (line, idx) => {
    const width = line[1] === 0 ? "100%" : Math.ceil(1 / this.props.scale);
    const height = line[1] === 1 ? "100%" : Math.ceil(1 / this.props.scale);
    const top = line[1] === 0 ? line[0] : 0;
    const left = line[1] === 1 ? line[0] : 0;
    return (
      <div key={idx}
        style={{ width, height, top, left }}
        className={styles.snapLine}
      />
    );
  }

  render() {
    return (
      <div>
        {this.props.lines ? this.props.lines.map(this.renderSnapLine) : null}
      </div>
    );
  }
}

export default SnapLines;
