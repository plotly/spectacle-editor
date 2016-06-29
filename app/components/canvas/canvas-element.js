import React, { Component, PropTypes } from "react";
import { observer } from "mobx-react";

import { ElementTypes } from "../../constants";
import { TextElement, ImageElement } from "./element-types";

@observer
class CanvasElement extends Component {
  static propTypes = {
    component: PropTypes.object
  };

  getElementType(type) {
    if (type === ElementTypes.TEXT) {
      return <TextElement />;
    }

    if (type === ElementTypes.IMAGE) {
      return <ImageElement />;
    }
  }

  render() {
    const { component } = this.props;

    return React.cloneElement(
      this.getElementType(component.type),
      { ...this.props, component }
    );
  }
}

export default CanvasElement;
