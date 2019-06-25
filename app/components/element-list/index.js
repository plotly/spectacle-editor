import React, { Component, PropTypes } from "react";

import ElementItem from "./element-item";
import styles from "./index.css";
import { ElementTypes } from "../../constants";

const elements = [ElementTypes.TEXT, ElementTypes.IMAGE, ElementTypes.PLOTLY, ElementTypes.CODE];
const elementWidth = 75;
const elementHeight = 48;
const elementMarginRight = 25;
const wrapperWidth = elements.length * (elementWidth + elementMarginRight) - elementMarginRight;

const elementTop = 8;

class ElementList extends Component {
  static propTypes = {
    scale: PropTypes.number
  };

  constructor(props) {
    super(props);

    this.state = {
      listLeft: 350
    };
  }

  componentDidMount = () => {
    this.resize();

    window.addEventListener("load", this.resize);
    window.addEventListener("resize", this.resize);
  }

  componentWillUnmount() {
    window.removeEventListener("load", this.resize);
    window.removeEventListener("resize", this.resize);
  }

  resize = () => {
    const clientWidth = document.body.clientWidth;

    const listLeft = (clientWidth - wrapperWidth) / 2;

    this.setState({
      listLeft
    });
  }

  render() {
    const { listLeft } = this.state;

    return (
      <div className={styles.list}>
        {elements.map((elementType, i) => (
          <ElementItem
            key={elementType}
            elementType={elementType}
            {...this.props}
            elementTop={elementTop}
            elementLeft={listLeft + ((elementWidth + elementMarginRight) * i)}
            elementWidth={elementWidth}
            elementHeight={elementHeight}
            scale={this.props.scale}
          />
        ))}
      </div>
    );
  }
}

export default ElementList;
