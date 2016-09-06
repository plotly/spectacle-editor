import React, { Component, PropTypes } from "react";
import plotlyPlaceholder from "../../../../assets/images/plotly-placeholder.png";
import { Image } from "../../../../spectacle-components";
import styles from "./index.css";
import CanvasElement, { CanvasElementPropTypes } from "../../canvas-element";
import { pick } from "lodash";

export default class PlotlyElement extends Component {
  static propTypes = {
    ...CanvasElementPropTypes,
    rect: PropTypes.object,
    component: PropTypes.shape({
      props: PropTypes.object
    })
  }

  getSize = () => ({
    width: this.props.component.props.style.width,
    height: this.props.component.props.style.height,
    left: this.props.component.props.style.left,
    top: this.props.component.props.style.top
  })

  render() {
    const componentProps = this.props.component.props;
    const width = this.props.rect ? this.props.rect.width : componentProps.style.width;
    const height = this.props.rect ? this.props.rect.height : componentProps.style.height;

    return (
      <CanvasElement
        {...pick(this.props, Object.keys(CanvasElementPropTypes))}
        getSize={this.getSize}
      >
        {this.props.isPlaceholder
          ? <Image src={plotlyPlaceholder} style={{ display: "block", width, height }} />
          : <iframe
            {...this.props.component.props}
            style={{ width, height }}
            className={styles.iframe}
          />
        }
      </CanvasElement>
    );
  }
}
